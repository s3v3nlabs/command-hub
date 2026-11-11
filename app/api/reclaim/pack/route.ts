export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const PACKS_ROOT = process.env.RECLAIM_PACKS_ROOT || "./local-data/packs"
const MAX_BYTES = 200_000

/** Known reclaim packs — ADD-ONLY catalog (basename under PACKS_ROOT). */
const PACK_CATALOG: Record<
  string,
  { dir: string; label: string; venice_pulse: string }
> = {
  FULL_RECALL: {
    dir: "FULL_RECALL_2026-09-24",
    label: "FULL_RECALL_2026-09-24",
    venice_pulse: "BAYED overnight — Operator paste in morning",
  },
  FULL_RECALL_2026_09_24: {
    dir: "FULL_RECALL_2026-09-24",
    label: "FULL_RECALL_2026-09-24",
    venice_pulse: "BAYED overnight — Operator paste in morning",
  },
  GPT_REBUILD_LOCAL: {
    dir: "GPT_REBUILD_LOCAL_2026-09-24",
    label: "GPT_REBUILD_LOCAL_2026-09-24",
    venice_pulse: "BAYED — use FULL_RECALL VENICE_PULSE_SCRIPT (todo 111)",
  },
  GPT_REBUILD_LOCAL_2026_09_24: {
    dir: "GPT_REBUILD_LOCAL_2026-09-24",
    label: "GPT_REBUILD_LOCAL_2026-09-24",
    venice_pulse: "BAYED — use FULL_RECALL VENICE_PULSE_SCRIPT (todo 111)",
  },
}

const DEFAULT_NAME = "FULL_RECALL"

function normalizeName(raw: string | null): string {
  if (!raw || !raw.trim()) return DEFAULT_NAME
  return raw.trim().replace(/-/g, "_").toUpperCase()
}

function resolvePack(nameParam: string | null): {
  key: string
  packDir: string
  label: string
  venice_pulse: string
} | null {
  const key = normalizeName(nameParam)
  const entry = PACK_CATALOG[key]
  if (!entry) return null
  const packDir = path.join(PACKS_ROOT, entry.dir)
  return { key, packDir, label: entry.label, venice_pulse: entry.venice_pulse }
}

function safeResolve(packDir: string, rel: string): string | null {
  if (!rel || rel.includes("\0")) return null
  const cleaned = rel.replace(/^\/+/, "").replace(/\\/g, "/")
  if (cleaned.includes("..") || cleaned.startsWith("/")) return null
  if (!cleaned.toLowerCase().endsWith(".md")) return null
  const abs = path.resolve(packDir, cleaned)
  const root = path.resolve(packDir)
  if (!abs.startsWith(root + path.sep) && abs !== root) return null
  return abs
}

function listMarkdown(packDir: string): Array<{
  name: string
  rel: string
  bytes: number
  mtime: string
  kind: string
}> {
  if (!fs.existsSync(packDir)) return []
  const entries = fs.readdirSync(packDir, { withFileTypes: true })
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md"))
    .map((e) => {
      const abs = path.join(packDir, e.name)
      const st = fs.statSync(abs)
      let kind = "doc"
      if (e.name.startsWith("CHUNK_")) kind = "chunk"
      else if (e.name.startsWith("VENICE_PULSE")) kind = "venice_pulse"
      else if (e.name.startsWith("LOCAL_RESTORE") || e.name.startsWith("LOCAL_APPLY"))
        kind = "local_apply"
      else if (e.name.startsWith("MANIFEST")) kind = "manifest"
      else if (e.name.startsWith("CONDENSED")) kind = "prompt"
      else if (e.name.startsWith("LINKS")) kind = "links"
      else if (e.name.startsWith("PROGRESS")) kind = "progress"
      return {
        name: e.name,
        rel: e.name,
        bytes: st.size,
        mtime: st.mtime.toISOString(),
        kind,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

function catalogList() {
  const seen = new Set<string>()
  const packs: Array<{
    name: string
    dir: string
    packDir: string
    exists: boolean
    venice_pulse: string
  }> = []
  for (const [alias, entry] of Object.entries(PACK_CATALOG)) {
    if (seen.has(entry.dir)) continue
    seen.add(entry.dir)
    const packDir = path.join(PACKS_ROOT, entry.dir)
    packs.push({
      name: entry.label,
      dir: entry.dir,
      packDir,
      exists: fs.existsSync(packDir),
      venice_pulse: entry.venice_pulse,
    })
  }
  // Prefer short alias names in response
  return packs.map((p) => ({
    ...p,
    queryName: p.dir.startsWith("GPT_REBUILD")
      ? "GPT_REBUILD_LOCAL"
      : "FULL_RECALL",
  }))
}

/**
 * GET /api/reclaim/pack
 * ?packs=1 — catalog of known packs (ADD-ONLY multi-pack)
 * ?name=FULL_RECALL|GPT_REBUILD_LOCAL — select pack (default FULL_RECALL)
 * ?list=1 (default) — list markdown under selected pack
 * ?file=MANIFEST.md — read one md (path-traversal safe)
 */
export async function GET(req: NextRequest) {
  try {
    const packsFlag = req.nextUrl.searchParams.get("packs")
    if (packsFlag === "1" || packsFlag === "true") {
      const packs = catalogList()
      return NextResponse.json({
        ok: true,
        hold: "HOLD_VYRNA_UNSYNC",
        lattice_sync: false,
        packsRoot: PACKS_ROOT,
        count: packs.length,
        packs,
        generatedAt: new Date().toISOString(),
      })
    }

    const nameParam = req.nextUrl.searchParams.get("name")
    const resolved = resolvePack(nameParam)
    if (!resolved) {
      return NextResponse.json(
        {
          ok: false,
          error: "unknown pack name",
          hint: "FULL_RECALL | GPT_REBUILD_LOCAL",
          hold: "HOLD_VYRNA_UNSYNC",
          lattice_sync: false,
        },
        { status: 404 },
      )
    }

    const { packDir, label, venice_pulse } = resolved
    const file = req.nextUrl.searchParams.get("file")

    if (file) {
      const abs = safeResolve(packDir, file)
      if (!abs || !fs.existsSync(abs)) {
        return NextResponse.json(
          {
            ok: false,
            error: "file not found or not allowed",
            pack: label,
            hold: "HOLD_VYRNA_UNSYNC",
            lattice_sync: false,
          },
          { status: 404 },
        )
      }
      const st = fs.statSync(abs)
      if (!st.isFile() || st.size > MAX_BYTES) {
        return NextResponse.json(
          {
            ok: false,
            error: "file too large or not a file",
            pack: label,
            hold: "HOLD_VYRNA_UNSYNC",
            lattice_sync: false,
          },
          { status: 400 },
        )
      }
      const content = fs.readFileSync(abs, "utf8")
      const scrubbed = content
        .replace(/sk-[a-zA-Z0-9_-]{10,}/g, "[redacted]")
        .replace(/\bPSID[=:\s][^\s\n]{4,}/gi, "[redacted-psid]")

      const base = path.basename(abs)
      const isPulse = base.startsWith("VENICE_PULSE")
      return NextResponse.json({
        ok: true,
        pack: label,
        packDir,
        file: base,
        bytes: st.size,
        content: scrubbed,
        hold: "HOLD_VYRNA_UNSYNC",
        lattice_sync: false,
        venice_pulse: isPulse ? venice_pulse : undefined,
        generatedAt: new Date().toISOString(),
      })
    }

    const files = listMarkdown(packDir)
    return NextResponse.json({
      ok: true,
      pack: label,
      packDir,
      hold: "HOLD_VYRNA_UNSYNC",
      lattice_sync: false,
      venice_pulse,
      sibling: label.startsWith("GPT_REBUILD")
        ? {
            name: "FULL_RECALL",
            path: path.join(PACKS_ROOT, "FULL_RECALL_2026-09-24"),
            note: "VENICE_PULSE_SCRIPT lives here — bayed",
          }
        : {
            name: "GPT_REBUILD_LOCAL",
            path: path.join(PACKS_ROOT, "GPT_REBUILD_LOCAL_2026-09-24"),
            note: "Local Axios reconnect prep (todo 116)",
          },
      count: files.length,
      files,
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "pack read failed"
    return NextResponse.json(
      {
        ok: false,
        hold: "HOLD_VYRNA_UNSYNC",
        lattice_sync: false,
        error: message.replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]"),
      },
      { status: 500 },
    )
  }
}
