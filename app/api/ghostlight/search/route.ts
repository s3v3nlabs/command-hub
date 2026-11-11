export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { spawn } from "child_process"
import fs from "fs"
import path from "path"

const VAULT_DB = "/workspace/chatgpt-vault/index/vault.sqlite3"
const SEARCH_PY = "/workspace/chatgpt-vault/tools/search_vault.py"
const TIMEOUT_MS = 12000
const MAX_LIMIT = 40

/** Redact anything that looks secret-shaped from snippets */
function scrub(text: string): string {
  return text
    .replace(/sk-[a-zA-Z0-9_-]{10,}/g, "[redacted]")
    .replace(/-----BEGIN[\s\S]*?-----END[^-]+-----/g, "[redacted-pem]")
    .replace(/\b(wg|wireguard)[^\n]{0,80}/gi, "[redacted-wg]")
    .replace(/\bPSID[=:\s][^\s\n]{4,}/gi, "[redacted-psid]")
    .replace(/\b(api[_-]?key|token|secret|password)\s*[:=]\s*\S+/gi, "$1=[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer [redacted]")
    .slice(0, 480)
}

function sanitizeQuery(q: string): string {
  return q
    .replace(/["']/g, " ")
    .replace(/[^\w\s.\-:/]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120)
}

type Hit = {
  title: string
  snippet: string
  path: string | null
  conversation_id: string
  role: string | null
  create_time: string | null
  profile: string | null
}

function runPythonJson(args: string[], timeoutMs = TIMEOUT_MS): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("python3", args, {
      cwd: "/workspace/chatgpt-vault",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    })
    let stdout = ""
    let stderr = ""
    const timer = setTimeout(() => {
      child.kill("SIGKILL")
      reject(new Error(`timeout after ${timeoutMs}ms`))
    }, timeoutMs)
    child.stdout.on("data", (d) => {
      stdout += d.toString()
    })
    child.stderr.on("data", (d) => {
      stderr += d.toString()
    })
    child.on("error", (err) => {
      clearTimeout(timer)
      reject(err)
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      if (code !== 0) {
        reject(new Error((stderr || stdout || `exit ${code}`).slice(0, 240)))
        return
      }
      resolve(stdout)
    })
  })
}

async function searchVault(q: string, limit: number): Promise<{ hits: Hit[]; backend: string }> {
  if (!fs.existsSync(VAULT_DB)) {
    throw new Error("vault.sqlite3 missing")
  }
  if (!fs.existsSync(SEARCH_PY)) {
    throw new Error("search_vault.py missing")
  }

  // Inline python: FTS + join conversations for title/path (no secrets)
  const py = `
import json, sqlite3, sys
q = sys.argv[1]
limit = int(sys.argv[2])
db = ${JSON.stringify(VAULT_DB)}
conn = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
conn.row_factory = sqlite3.Row
rows = conn.execute(
    """SELECT m.conversation_id AS conversation_id,
              m.role AS role,
              m.create_time AS create_time,
              snippet(messages_fts, 2, '>>>', '<<<', '…', 28) AS snip,
              substr(m.text, 1, 400) AS text,
              c.title AS title,
              c.path AS path,
              c.profile AS profile
       FROM messages_fts m
       LEFT JOIN conversations c ON c.id = m.conversation_id
       WHERE messages_fts MATCH ?
       ORDER BY rank
       LIMIT ?""",
    (q, limit),
).fetchall()
out = []
for r in rows:
    out.append({
        "conversation_id": r["conversation_id"] or "",
        "role": r["role"],
        "create_time": r["create_time"],
        "snip": r["snip"] or r["text"] or "",
        "title": r["title"] or r["conversation_id"] or "(untitled)",
        "path": r["path"],
        "profile": r["profile"],
    })
print(json.dumps(out, ensure_ascii=False))
conn.close()
`
  try {
    const stdout = await runPythonJson(["-c", py, q, String(limit)])
    const rows = JSON.parse(stdout) as Array<Record<string, unknown>>
    const hits: Hit[] = rows.map((r) => ({
      title: String(r.title || r.conversation_id || "(untitled)"),
      snippet: scrub(String(r.snip || "")),
      path: r.path ? String(r.path) : null,
      conversation_id: String(r.conversation_id || ""),
      role: r.role ? String(r.role) : null,
      create_time: r.create_time ? String(r.create_time) : null,
      profile: r.profile ? String(r.profile) : null,
    }))
    return { hits, backend: "python-fts5-join" }
  } catch (primaryErr) {
    // Fallback to search_vault.py then enrich titles
    const raw = await runPythonJson([SEARCH_PY, q, "-n", String(limit)])
    const rows = JSON.parse(raw) as Array<Record<string, unknown>>
    const enrichPy = `
import json, sqlite3, sys
ids = json.loads(sys.argv[1])
db = ${JSON.stringify(VAULT_DB)}
conn = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
conn.row_factory = sqlite3.Row
out = {}
for i in ids:
    row = conn.execute("SELECT title, path FROM conversations WHERE id = ?", (i,)).fetchone()
    if row:
        out[i] = {"title": row["title"] or i, "path": row["path"]}
print(json.dumps(out, ensure_ascii=False))
conn.close()
`
    let titleMap: Record<string, { title: string; path: string | null }> = {}
    try {
      const ids = [...new Set(rows.map((r) => String(r.conversation_id || "")))].filter(Boolean)
      const mapRaw = await runPythonJson(["-c", enrichPy, JSON.stringify(ids)])
      titleMap = JSON.parse(mapRaw) as typeof titleMap
    } catch {
      titleMap = {}
    }
    const hits: Hit[] = rows.map((r) => {
      const cid = String(r.conversation_id || "")
      const meta = titleMap[cid]
      return {
        title: meta?.title || cid || "(untitled)",
        snippet: scrub(String(r.snip || r.text || "")),
        path: meta?.path || null,
        conversation_id: cid,
        role: r.role ? String(r.role) : null,
        create_time: r.create_time ? String(r.create_time) : null,
        profile: null,
      }
    })
    return {
      hits,
      backend: `search_vault.py-fallback (${primaryErr instanceof Error ? primaryErr.message.slice(0, 60) : "err"})`,
    }
  }
}

/**
 * GET/POST /api/ghostlight/search
 * FTS over /workspace/chatgpt-vault — titles/snippets/paths only. Never secrets.
 */
export async function GET(req: NextRequest) {
  const denied = requireHubAuth(req, { surface: "ghostlight:search", requireInSecureMode: true })
  if (denied) return denied

  const q = sanitizeQuery(req.nextUrl.searchParams.get("q") || "")
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 12) || 12),
  )
  return handleSearch(q, limit)
}

export async function POST(req: NextRequest) {
  const denied = requireHubAuth(req, { surface: "ghostlight:search", requireInSecureMode: true })
  if (denied) return denied

  let body: { q?: string; query?: string; limit?: number } = {}
  try {
    body = (await req.json()) as typeof body
  } catch {
    body = {}
  }
  const q = sanitizeQuery(body.q || body.query || "")
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(body.limit) || 12))
  return handleSearch(q, limit)
}

async function handleSearch(q: string, limit: number) {
  if (!q || q.length < 2) {
    return NextResponse.json(
      {
        ok: false,
        error: "query too short (min 2)",
        hold: "HOLD_VYRNA_UNSYNC",
        lattice_sync: false,
        hits: [],
      },
      { status: 400 },
    )
  }
  try {
    const { hits, backend } = await searchVault(q, limit)
    return NextResponse.json({
      ok: true,
      q,
      limit,
      count: hits.length,
      backend,
      hold: "HOLD_VYRNA_UNSYNC",
      lattice_sync: false,
      note: "titles/snippets/paths only — secrets scrubbed",
      hits,
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "search failed"
    return NextResponse.json(
      {
        ok: false,
        hold: "HOLD_VYRNA_UNSYNC",
        lattice_sync: false,
        error: message.replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]"),
        hits: [],
      },
      { status: 500 },
    )
  }
}
