/**
 * Operator Twin v1 — LOCAL chat vault retrieval only.
 * No cloud twin training upload. HOLD_VYRNA_UNSYNC — lattice_sync false.
 * Never return or index raw secrets (sk-/eyJ/BEGIN PRIVATE/.env).
 */

import fs from "fs"
import path from "path"
import { routePrompt, type OpsProviderId } from "@/lib/ai/ops-router"

const VAULT_BASE = process.env.HUB_VAULT_BASE || "./local-data"

export const TWIN_INDEX_DIR =
  process.env.TWIN_INDEX_DIR || path.join(process.cwd(), ".local/twin-index")
export const TWIN_CHUNKS_PATH = path.join(TWIN_INDEX_DIR, "chunks.jsonl")
export const TWIN_META_PATH = path.join(TWIN_INDEX_DIR, "meta.json")

export const VAULT_ROOTS: Array<{ id: string; root: string; label: string }> = [
  { id: "chatgpt", root: `${VAULT_BASE}/chatgpt-vault`, label: "ChatGPT vault" },
  { id: "grok", root: `${VAULT_BASE}/grok-vault`, label: "Grok vault" },
  { id: "gemini", root: `${VAULT_BASE}/gemini-vault`, label: "Gemini vault" },
  { id: "venice", root: `${VAULT_BASE}/venice-vault`, label: "Venice vault" },
  { id: "v0-history", root: `${VAULT_BASE}/vercel-v0/v0-history`, label: "v0 history" },
  {
    id: "engines-personas",
    root: `${VAULT_BASE}/singular-ty-engines/personas`,
    label: "Engines personas",
  },
  {
    id: "engines-prompts",
    root: `${VAULT_BASE}/singular-ty-engines/prompts`,
    label: "Engines prompts",
  },
]

const TEXT_EXT = new Set([
  ".md",
  ".txt",
  ".json",
  ".jsonl",
  ".yaml",
  ".yml",
  ".csv",
  ".tsv",
  ".log",
  ".vtt",
  ".srt",
])

const SKIP_DIR = new Set([
  "node_modules",
  ".git",
  ".next",
  ".venv",
  "__pycache__",
  "backups",
  "quarantine",
  "reclaim_keys",
])

const SKIP_FILE_NAMES = new Set([
  ".env",
  ".env.local",
  ".env.example",
  ".env.template",
])

const MAX_FILE_BYTES = 400_000
const MAX_CHUNK_CHARS = 1800
const MAX_CHUNKS_PER_FILE = 8
const MAX_FILES_PER_ROOT = 400
const MAX_TOTAL_CHUNKS = 6000
const DEFAULT_TOP_K = 6

export interface TwinChunk {
  id: string
  vault: string
  path: string
  title: string
  text: string
  chars: number
}

export interface TwinSourceHit {
  vault: string
  path: string
  title: string
  score: number
  excerpt: string
}

export interface TwinMeta {
  builtAt: string
  docs: number
  chunks: number
  roots: Array<{ id: string; root: string; files: number; chunks: number; exists: boolean }>
  thin: boolean
  note: string
  camtasiaOrTranscriptHits: string[]
  lattice_sync: false
  hold: "HOLD_VYRNA_UNSYNC"
}

const SECRET_LINE =
  /(sk-[a-zA-Z0-9_-]{8,}|eyJ[a-zA-Z0-9_-]{20,}|BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY|gsk_[a-zA-Z0-9_-]{8,}|xai-[a-zA-Z0-9_-]{8,}|Bearer\s+[A-Za-z0-9._-]{12,})/i

function ensureIndexDir() {
  if (!fs.existsSync(TWIN_INDEX_DIR)) {
    fs.mkdirSync(TWIN_INDEX_DIR, { recursive: true, mode: 0o700 })
  }
  try {
    fs.chmodSync(TWIN_INDEX_DIR, 0o700)
  } catch {
    /* ignore */
  }
}

export function redactSecrets(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      if (SECRET_LINE.test(line)) {
        return "[REDACTED_SECRET_LINE]"
      }
      return line
        .replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]")
        .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[redacted-jwt]")
        .replace(/gsk_[a-zA-Z0-9_-]+/g, "[redacted]")
        .replace(/xai-[a-zA-Z0-9_-]+/gi, "[redacted]")
        .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    })
    .join("\n")
}

function shouldSkipFile(filePath: string, name: string): boolean {
  const lower = name.toLowerCase()
  if (SKIP_FILE_NAMES.has(name) || lower.startsWith(".env")) return true
  if (lower.includes("credential") && lower.endsWith(".json")) return true
  if (lower.includes("reclaim_keys")) return true
  const ext = path.extname(name).toLowerCase()
  if (!TEXT_EXT.has(ext)) return true
  // skip huge binary-masquerading exports
  try {
    const st = fs.statSync(filePath)
    if (!st.isFile() || st.size === 0 || st.size > MAX_FILE_BYTES * 4) return true
  } catch {
    return true
  }
  return false
}

function extractText(filePath: string, raw: string): string {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === ".json" || ext === ".jsonl") {
    try {
      if (ext === ".jsonl") {
        const lines = raw.split("\n").filter(Boolean).slice(0, 80)
        const parts: string[] = []
        for (const line of lines) {
          try {
            const obj = JSON.parse(line)
            parts.push(flattenJsonText(obj))
          } catch {
            parts.push(line.slice(0, 500))
          }
        }
        return parts.join("\n")
      }
      const obj = JSON.parse(raw)
      return flattenJsonText(obj)
    } catch {
      return raw
    }
  }
  return raw
}

function flattenJsonText(obj: unknown, depth = 0): string {
  if (depth > 6) return ""
  if (obj == null) return ""
  if (typeof obj === "string") return obj
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj)
  if (Array.isArray(obj)) {
    return obj
      .slice(0, 40)
      .map((x) => flattenJsonText(x, depth + 1))
      .filter(Boolean)
      .join("\n")
  }
  if (typeof obj === "object") {
    const rec = obj as Record<string, unknown>
    // Prefer conversation-shaped fields
    const preferred = [
      "full_text",
      "title",
      "content",
      "text",
      "message",
      "messages",
      "prompt",
      "response",
      "role",
      "name",
      "tone",
      "do_not",
      "system",
    ]
    const parts: string[] = []
    for (const k of preferred) {
      if (k in rec) parts.push(flattenJsonText(rec[k], depth + 1))
    }
    if (parts.length) return parts.join("\n")
    return Object.entries(rec)
      .slice(0, 30)
      .map(([k, v]) => `${k}: ${flattenJsonText(v, depth + 1)}`)
      .join("\n")
  }
  return ""
}

function chunkText(text: string, maxChars = MAX_CHUNK_CHARS, maxChunks = MAX_CHUNKS_PER_FILE): string[] {
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
  if (!clean) return []
  if (clean.length <= maxChars) return [clean]
  const chunks: string[] = []
  let i = 0
  while (i < clean.length && chunks.length < maxChunks) {
    let end = Math.min(i + maxChars, clean.length)
    if (end < clean.length) {
      const slice = clean.slice(i, end)
      const breakAt = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf("\n"), slice.lastIndexOf(". "))
      if (breakAt > maxChars * 0.4) end = i + breakAt + 1
    }
    const piece = clean.slice(i, end).trim()
    if (piece.length > 40) chunks.push(piece)
    i = end
  }
  return chunks
}

function walkFiles(root: string, limit: number): string[] {
  const out: string[] = []
  const stack = [root]
  while (stack.length && out.length < limit) {
    const dir = stack.pop()!
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const ent of entries) {
      if (out.length >= limit) break
      const name = ent.name
      if (name.startsWith(".") && name !== ".md") {
        // allow *.md/.txt under hidden? skip hidden dirs mostly
        if (ent.isDirectory()) continue
      }
      const full = path.join(dir, name)
      if (ent.isDirectory()) {
        if (SKIP_DIR.has(name)) continue
        stack.push(full)
      } else if (ent.isFile()) {
        if (!shouldSkipFile(full, name)) out.push(full)
      }
    }
  }
  return out
}

function isCamtasiaOrTranscript(filePath: string): boolean {
  const lower = filePath.toLowerCase()
  return (
    lower.includes("camtasia") ||
    lower.includes("transcript") ||
    lower.endsWith(".vtt") ||
    lower.endsWith(".srt") ||
    lower.includes("caption")
  )
}

export function buildTwinIndex(opts?: { force?: boolean }): TwinMeta {
  ensureIndexDir()
  const rootStats: TwinMeta["roots"] = []
  const camHits: string[] = []
  const chunks: TwinChunk[] = []
  let docs = 0
  let chunkSeq = 0

  for (const vault of VAULT_ROOTS) {
    const exists = fs.existsSync(vault.root)
    let files = 0
    let vaultChunks = 0
    if (exists) {
      const fileList = walkFiles(vault.root, MAX_FILES_PER_ROOT)
      for (const filePath of fileList) {
        if (chunks.length >= MAX_TOTAL_CHUNKS) break
        if (isCamtasiaOrTranscript(filePath)) {
          camHits.push(filePath)
        }
        let raw: string
        try {
          const st = fs.statSync(filePath)
          const readLen = Math.min(st.size, MAX_FILE_BYTES)
          const fd = fs.openSync(filePath, "r")
          const buf = Buffer.alloc(readLen)
          fs.readSync(fd, buf, 0, readLen, 0)
          fs.closeSync(fd)
          // skip if mostly binary
          let nonPrint = 0
          for (let i = 0; i < Math.min(buf.length, 2000); i++) {
            const c = buf[i]
            if (c === 0) {
              nonPrint = 999
              break
            }
            if (c < 9 || (c > 13 && c < 32)) nonPrint++
          }
          if (nonPrint > 50) continue
          raw = buf.toString("utf8")
        } catch {
          continue
        }
        const extracted = extractText(filePath, raw)
        const redacted = redactSecrets(extracted).slice(0, MAX_FILE_BYTES)
        const pieces = chunkText(redacted)
        if (!pieces.length) continue
        files++
        docs++
        const rel = path.relative(vault.root, filePath)
        const title = path.basename(filePath)
        for (const piece of pieces) {
          if (chunks.length >= MAX_TOTAL_CHUNKS) break
          chunkSeq++
          chunks.push({
            id: `${vault.id}-${chunkSeq}`,
            vault: vault.id,
            path: rel,
            title,
            text: piece,
            chars: piece.length,
          })
          vaultChunks++
        }
      }
    }
    rootStats.push({
      id: vault.id,
      root: vault.root,
      files,
      chunks: vaultChunks,
      exists,
    })
  }

  const tmp = TWIN_CHUNKS_PATH + ".tmp"
  const fd = fs.openSync(tmp, "w", 0o600)
  try {
    for (const c of chunks) {
      fs.writeSync(fd, JSON.stringify(c) + "\n")
    }
  } finally {
    fs.closeSync(fd)
  }
  fs.renameSync(tmp, TWIN_CHUNKS_PATH)
  try {
    fs.chmodSync(TWIN_CHUNKS_PATH, 0o600)
  } catch {
    /* ignore */
  }

  const thin = chunks.length < 40
  const meta: TwinMeta = {
    builtAt: new Date().toISOString(),
    docs,
    chunks: chunks.length,
    roots: rootStats,
    thin,
    note: thin
      ? "Index is thin — retrieval-only Twin, not a full persona clone."
      : "Local retrieval index built. Not a full persona clone; answers grounded in vault chunks only.",
    camtasiaOrTranscriptHits: camHits.slice(0, 50),
    lattice_sync: false,
    hold: "HOLD_VYRNA_UNSYNC",
  }
  fs.writeFileSync(TWIN_META_PATH, JSON.stringify(meta, null, 2), { mode: 0o600 })
  try {
    fs.chmodSync(TWIN_META_PATH, 0o600)
  } catch {
    /* ignore */
  }
  return meta
}

let cachedChunks: TwinChunk[] | null = null
let cachedMtime = 0

export function loadChunks(): TwinChunk[] {
  if (!fs.existsSync(TWIN_CHUNKS_PATH)) return []
  const st = fs.statSync(TWIN_CHUNKS_PATH)
  if (cachedChunks && st.mtimeMs === cachedMtime) return cachedChunks
  const lines = fs.readFileSync(TWIN_CHUNKS_PATH, "utf8").split("\n").filter(Boolean)
  const out: TwinChunk[] = []
  for (const line of lines) {
    try {
      out.push(JSON.parse(line) as TwinChunk)
    } catch {
      /* skip bad line */
    }
  }
  cachedChunks = out
  cachedMtime = st.mtimeMs
  return out
}

export function loadMeta(): TwinMeta | null {
  if (!fs.existsSync(TWIN_META_PATH)) return null
  try {
    return JSON.parse(fs.readFileSync(TWIN_META_PATH, "utf8")) as TwinMeta
  } catch {
    return null
  }
}

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9_\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .slice(0, 24)
}

export function searchTwin(query: string, topK = DEFAULT_TOP_K): TwinSourceHit[] {
  const tokens = tokenize(query)
  if (!tokens.length) return []
  const chunks = loadChunks()
  if (!chunks.length) return []

  const scored: TwinSourceHit[] = []
  for (const c of chunks) {
    const hay = (c.title + " " + c.path + " " + c.text).toLowerCase()
    let score = 0
    for (const t of tokens) {
      if (hay.includes(t)) {
        score += 1
        // title/path boost
        if (c.title.toLowerCase().includes(t)) score += 1.5
        if (c.path.toLowerCase().includes(t)) score += 0.75
      }
    }
    if (score > 0) {
      scored.push({
        vault: c.vault,
        path: c.path,
        title: c.title,
        score,
        excerpt: redactSecrets(c.text).slice(0, 280),
      })
    }
  }
  scored.sort((a, b) => b.score - a.score)
  // de-dupe by path
  const seen = new Set<string>()
  const uniq: TwinSourceHit[] = []
  for (const s of scored) {
    const key = `${s.vault}:${s.path}`
    if (seen.has(key)) continue
    seen.add(key)
    uniq.push(s)
    if (uniq.length >= topK) break
  }
  return uniq
}

const TWIN_SYSTEM = `You are Operator Twin for Commander S3v3n.
Use ONLY the provided memory excerpts from local chat vaults.
Never invent reclaim secrets, API keys, passwords, or private keys.
If memory is thin or missing, say so honestly.
Do not claim you are a full persona clone.
HOLD_VYRNA_UNSYNC — lattice_sync is false. Do not claim Vyrna lattice sync.
Be concise, direct, and match the Operator's reclaim/ops tone when memory supports it.`

function pickProvider(): OpsProviderId | null {
  if (process.env.GROQ_API_KEY || process.env.AI_GROQ_API_KEY) return "groq"
  if (process.env.OPENAI_API_KEY) return "openai"
  if (process.env.XAI_API_KEY) return "xai"
  return null
}

export async function queryTwin(opts: {
  query: string
  topK?: number
  provider?: OpsProviderId
}): Promise<{
  ok: boolean
  mode: "llm" | "retrieval-only"
  answer: string
  sources: TwinSourceHit[]
  confidence: number
  provider?: string
  thin: boolean
  lattice_sync: false
  hold: "HOLD_VYRNA_UNSYNC"
  meta?: Record<string, unknown>
}> {
  const q = (opts.query || "").trim()
  if (!q) {
    return {
      ok: false,
      mode: "retrieval-only",
      answer: "Empty query",
      sources: [],
      confidence: 0,
      thin: true,
      lattice_sync: false,
      hold: "HOLD_VYRNA_UNSYNC",
    }
  }

  let meta = loadMeta()
  if (!meta || !fs.existsSync(TWIN_CHUNKS_PATH)) {
    meta = buildTwinIndex()
  }

  const sources = searchTwin(q, opts.topK ?? DEFAULT_TOP_K)
  const thin = !!meta.thin || sources.length < 2
  const confidence = Math.min(
    0.92,
    Math.max(0.08, sources.reduce((a, s) => a + s.score, 0) / ((opts.topK ?? DEFAULT_TOP_K) * 4)),
  )

  const memoryBlock = sources.length
    ? sources
        .map(
          (s, i) =>
            `[${i + 1}] vault=${s.vault} path=${s.path} score=${s.score.toFixed(2)}\n${s.excerpt}`,
        )
        .join("\n\n")
    : "(no matching vault chunks)"

  const composedPrompt = `Operator question:\n${q}\n\n--- LOCAL MEMORY (redacted excerpts) ---\n${memoryBlock}\n--- END MEMORY ---\n\nAnswer using only this memory. Cite vault ids when useful.`

  const preferred = opts.provider || pickProvider()
  const tryOrder: OpsProviderId[] = preferred
    ? [preferred, "groq", "openai", "xai"].filter(
        (v, i, a) => a.indexOf(v) === i,
      ) as OpsProviderId[]
    : ["groq", "openai", "xai"]

  for (const provider of tryOrder) {
    const result = await routePrompt({
      provider,
      prompt: composedPrompt,
      liberation: false,
      system: TWIN_SYSTEM,
    })
    if (result.ok && result.status === "live" && result.text) {
      // Soft re-prompt path: if model ignored memory, still return with sources
      return {
        ok: true,
        mode: "llm",
        answer: redactSecrets(result.text),
        sources,
        confidence,
        provider,
        thin,
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
        meta: {
          model: result.meta?.model,
          twin_system: true,
          note: thin ? "Index/memory thin — treat as retrieval-assisted, not full clone." : undefined,
          // ensure twin system intent was in prompt
          systemHint: TWIN_SYSTEM.slice(0, 120),
        },
      }
    }
    // auth-fail / no-key → try next
    if (result.mode === "no-key" || /api key|unauthorized|401|403/i.test(result.text)) {
      continue
    }
    // other failures: try next once
    continue
  }

  // Retrieval-only honest stitch
  const stitch = sources.length
    ? [
        "Retrieval-only answer (no live LLM auth). Stitching top vault chunks:",
        thin ? "Note: index/memory is thin — not a full Operator Twin clone." : "",
        "",
        ...sources.map(
          (s, i) =>
            `(${i + 1}) [${s.vault}] ${s.title} — ${s.excerpt.slice(0, 220)}${s.excerpt.length > 220 ? "…" : ""}`,
        ),
        "",
        "HOLD_VYRNA_UNSYNC · lattice_sync: false",
      ]
        .filter(Boolean)
        .join("\n")
    : "No matching local vault chunks. Index may be thin or query terms absent. HOLD_VYRNA_UNSYNC."

  return {
    ok: true,
    mode: "retrieval-only",
    answer: stitch,
    sources,
    confidence: Math.min(confidence, 0.45),
    thin,
    lattice_sync: false,
    hold: "HOLD_VYRNA_UNSYNC",
    meta: { reason: "all-provider-auth-fail-or-unavailable" },
  }
}

export function getTwinStatus() {
  const meta = loadMeta()
  const chunks = meta ? meta.chunks : fs.existsSync(TWIN_CHUNKS_PATH) ? loadChunks().length : 0
  return {
    ok: true,
    indexed: !!meta && chunks > 0,
    meta,
    indexDir: TWIN_INDEX_DIR,
    vaultRoots: VAULT_ROOTS.map((v) => ({
      id: v.id,
      root: v.root,
      label: v.label,
      exists: fs.existsSync(v.root),
    })),
    providerPreference: pickProvider(),
    lattice_sync: false as const,
    hold: "HOLD_VYRNA_UNSYNC" as const,
    honest: "Local retrieval Twin — not a full persona clone; no cloud training upload.",
  }
}

export { TWIN_SYSTEM }
