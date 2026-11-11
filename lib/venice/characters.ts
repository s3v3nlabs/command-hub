/**
 * Local Venice character packs — disk under data/venice-characters only.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false · no Venice marketplace · no secrets.
 */
import fs from "fs"
import path from "path"

export const HOLD = "HOLD_VYRNA_UNSYNC"
export const CHARACTERS_DIR = path.join(process.cwd(), "data", "venice-characters")
export const MAX_DIGEST_BYTES = 120_000
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/

export type CharacterManifest = {
  id: string
  name: string
  role?: string
  badge?: string
  aliases?: string[]
  reject_aliases?: string[]
  protocol?: string
  sources?: string[]
  digest?: string
  stub?: boolean
  lattice_sync: false
  hold: typeof HOLD
  live_on_venice_cloud?: boolean
  pulse_bayed?: boolean
  notes?: string
  [key: string]: unknown
}

export type CharacterPackSummary = {
  id: string
  name: string
  role: string
  badge: string
  stub: boolean
  lattice_sync: false
  hold: typeof HOLD
  live_on_venice_cloud: false
  pulse_bayed: boolean
  sources: string[]
  hasDigest: boolean
  hasReadme: boolean
  dir: string
  notes?: string
}

function scrub(text: string): string {
  return text
    .replace(/sk-[a-zA-Z0-9_-]{10,}/g, "[redacted]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\bPSID[=:\s][^\s\n]{4,}/gi, "[redacted-psid]")
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[redacted-jwt]")
}

export function isSafeSlug(id: string): boolean {
  if (!id || typeof id !== "string") return false
  if (!SLUG_RE.test(id)) return false
  if (id.includes("..") || id.includes("/") || id.includes("\\")) return false
  return true
}

export function packDir(id: string): string | null {
  if (!isSafeSlug(id)) return null
  const abs = path.resolve(CHARACTERS_DIR, id)
  const root = path.resolve(CHARACTERS_DIR)
  if (!abs.startsWith(root + path.sep)) return null
  return abs
}

function readManifest(dir: string, id: string): CharacterManifest | null {
  const mf = path.join(dir, "manifest.json")
  if (!fs.existsSync(mf)) {
    return {
      id,
      name: id,
      role: "unmanifested local folder",
      badge: "LOCAL PACK",
      lattice_sync: false,
      hold: HOLD,
      live_on_venice_cloud: false,
      stub: true,
    }
  }
  try {
    const raw = JSON.parse(fs.readFileSync(mf, "utf8")) as Record<string, unknown>
    const name = typeof raw.name === "string" ? raw.name : id
    const role = typeof raw.role === "string" ? raw.role : ""
    return {
      ...raw,
      id: typeof raw.id === "string" && isSafeSlug(raw.id) ? raw.id : id,
      name,
      role,
      badge: typeof raw.badge === "string" ? raw.badge : "LOCAL PACK",
      sources: Array.isArray(raw.sources)
        ? raw.sources.filter((s): s is string => typeof s === "string")
        : [],
      lattice_sync: false,
      hold: HOLD,
      live_on_venice_cloud: false,
      stub: Boolean(raw.stub),
      pulse_bayed: Boolean(raw.pulse_bayed),
      notes: typeof raw.notes === "string" ? raw.notes : undefined,
      digest: typeof raw.digest === "string" ? raw.digest : undefined,
    }
  } catch {
    return {
      id,
      name: id,
      role: "invalid manifest.json",
      badge: "LOCAL PACK",
      lattice_sync: false,
      hold: HOLD,
      live_on_venice_cloud: false,
      stub: true,
    }
  }
}

export function listCharacterPacks(q?: string): CharacterPackSummary[] {
  if (!fs.existsSync(CHARACTERS_DIR)) return []
  const entries = fs.readdirSync(CHARACTERS_DIR, { withFileTypes: true })
  const packs: CharacterPackSummary[] = []
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith(".")) continue
    if (!isSafeSlug(e.name)) continue
    const dir = path.join(CHARACTERS_DIR, e.name)
    const m = readManifest(dir, e.name)
    if (!m) continue
    const hasDigest =
      fs.existsSync(path.join(dir, "system_digest.md")) ||
      (typeof m.digest === "string" && fs.existsSync(path.join(dir, m.digest)))
    const hasReadme = fs.existsSync(path.join(dir, "README.md"))
    packs.push({
      id: m.id,
      name: m.name,
      role: m.role || "",
      badge: "LOCAL PACK",
      stub: Boolean(m.stub),
      lattice_sync: false,
      hold: HOLD,
      live_on_venice_cloud: false,
      pulse_bayed: Boolean(m.pulse_bayed),
      sources: m.sources || [],
      hasDigest,
      hasReadme,
      dir: `data/venice-characters/${m.id}`,
      notes: m.notes,
    })
  }
  packs.sort((a, b) => a.id.localeCompare(b.id))
  if (!q || !q.trim()) return packs
  const needle = q.trim().toLowerCase()
  return packs.filter((p) => {
    const hay = [p.id, p.name, p.role, p.notes || "", ...(p.sources || [])]
      .join(" ")
      .toLowerCase()
    return hay.includes(needle)
  })
}

export function readPackDigest(
  id: string,
): { ok: true; id: string; file: string; content: string; bytes: number } | { ok: false; error: string } {
  const dir = packDir(id)
  if (!dir || !fs.existsSync(dir)) return { ok: false, error: "pack not found" }
  const m = readManifest(dir, id)
  const candidates = [
    typeof m?.digest === "string" ? m.digest : null,
    "system_digest.md",
    "README.md",
  ].filter((x): x is string => Boolean(x))
  for (const rel of candidates) {
    if (rel.includes("..") || rel.includes("/") || rel.includes("\\")) continue
    if (!rel.toLowerCase().endsWith(".md")) continue
    const abs = path.join(dir, rel)
    if (!fs.existsSync(abs)) continue
    const st = fs.statSync(abs)
    if (!st.isFile() || st.size > MAX_DIGEST_BYTES) continue
    const content = scrub(fs.readFileSync(abs, "utf8"))
    return { ok: true, id, file: rel, content, bytes: st.size }
  }
  return { ok: false, error: "no digest markdown in pack" }
}

export type CreatePackInput = {
  id: string
  name?: string
  role?: string
  notes?: string
}

export function createEmptyPack(
  input: CreatePackInput,
): { ok: true; pack: CharacterPackSummary } | { ok: false; error: string; status: number } {
  const id = (input.id || "").trim().toLowerCase()
  if (!isSafeSlug(id)) {
    return { ok: false, error: "id must match [a-z0-9][a-z0-9-]{0,62}", status: 400 }
  }
  if (id === "readme") {
    return { ok: false, error: "reserved id", status: 400 }
  }
  const dir = packDir(id)
  if (!dir) return { ok: false, error: "invalid path", status: 400 }
  if (!fs.existsSync(CHARACTERS_DIR)) {
    fs.mkdirSync(CHARACTERS_DIR, { recursive: true })
  }
  if (fs.existsSync(dir)) {
    return { ok: false, error: "pack already exists", status: 409 }
  }
  const name = (input.name || id).trim().slice(0, 120) || id
  const role = (input.role || "Operator local seat (empty stub)").trim().slice(0, 240)
  const notes = (input.notes || "").trim().slice(0, 500)
  const manifest: CharacterManifest = {
    id,
    name,
    role,
    badge: "LOCAL PACK",
    sources: [],
    digest: "system_digest.md",
    stub: true,
    lattice_sync: false,
    hold: HOLD,
    live_on_venice_cloud: false,
    pulse_bayed: false,
    notes: notes || "Empty pack created via /venice New pack form. Drop assets under this folder.",
  }
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8")
  fs.writeFileSync(
    path.join(dir, "README.md"),
    `# ${id} — LOCAL PACK\n\n**Name:** ${name}\n**Badge:** LOCAL PACK — not live on Venice.ai cloud\n**Hold:** \`HOLD_VYRNA_UNSYNC\` · \`lattice_sync: false\`\n\n${role}\n\nEmpty stub. Add \`system_digest.md\` and source paths in \`manifest.json\` when ready.\n`,
    "utf8",
  )
  fs.writeFileSync(
    path.join(dir, "system_digest.md"),
    `# ${name} — stub digest (LOCAL · no secrets)\n\n**Hold:** HOLD_VYRNA_UNSYNC · lattice_sync: false\n\nEmpty Operator-created pack. Not a Venice marketplace character.\n`,
    "utf8",
  )
  const listed = listCharacterPacks().find((p) => p.id === id)
  if (!listed) return { ok: false, error: "created but failed to re-list", status: 500 }
  return { ok: true, pack: listed }
}
