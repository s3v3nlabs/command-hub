
/**
 * Real filesystem browser. Roots are the hub repo, local-data, an optional
 * evidence/obsidian path. Secret files can be listed but not read.
 */
import fs from "fs"
import path from "path"
import os from "os"

const SECRET_NAME = /(\.env(\.|$)|credentials|secret|\.pem$|\.key$|\.p12$|\.pfx$|id_rsa|id_ed25519|authorized_keys|\.npmrc$)/i

export interface FsItem {
  id: string
  name: string
  type: "directory" | "file" | "component" | "module" | "config" | "symlink" | "other"
  path: string
  size?: number
  modified: string
  permissions: string
  hidden: boolean
  starred: boolean
  locked: boolean
  description?: string
  componentType?: string
  moduleType?: string
  readable: boolean
  redacted?: boolean
}

function modeString(mode: number, isDir: boolean, isLink: boolean): string {
  const types = isLink ? "l" : isDir ? "d" : "-"
  const bits = [
    mode & 0o400 ? "r" : "-",
    mode & 0o200 ? "w" : "-",
    mode & 0o100 ? "x" : "-",
    mode & 0o040 ? "r" : "-",
    mode & 0o020 ? "w" : "-",
    mode & 0o010 ? "x" : "-",
    mode & 0o004 ? "r" : "-",
    mode & 0o002 ? "w" : "-",
    mode & 0o001 ? "x" : "-",
  ].join("")
  return types + bits
}

function classify(name: string, isDir: boolean): FsItem["type"] {
  if (isDir) return "directory"
  if (/\.(tsx|jsx)$/i.test(name)) return "component"
  if (/\.(ts|js|mjs|cjs)$/i.test(name)) return "module"
  if (/\.(json|ya?ml|toml|ini|env|config\.[a-z]+)$/i.test(name) || name.startsWith(".")) return "config"
  if (isDir) return "directory"
  return "file"
}

export function allowedRoots(): { id: string; path: string; label: string }[] {
  const roots = [
    { id: "repo", path: process.cwd(), label: "hub repo" },
    { id: "local", path: path.join(process.cwd(), "local-data"), label: "local-data" },
    { id: "jail", path: path.join(process.cwd(), "local-data", "shell-home"), label: "shell home" },
    { id: "tmp", path: os.tmpdir(), label: "tmpdir" },
  ]
  const ev = process.env.EVIDENCE_ROOT
  if (ev) roots.push({ id: "evidence", path: ev, label: "EVIDENCE_ROOT" })
  const vault = process.env.OBSIDIAN_VAULT_PATH || path.join(process.cwd(), "local-data", "obsidian-vault")
  roots.push({ id: "obsidian", path: vault, label: "obsidian vault" })
  return roots.map((r) => ({ ...r, path: path.resolve(r.path) }))
}

export function resolveAllowed(inputPath: string | undefined | null): { abs: string; root: string } | { error: string } {
  const roots = allowedRoots()
  const raw = (inputPath || roots[0].path).trim() || roots[0].path
  const abs = path.resolve(raw.startsWith("/") ? raw : path.join(roots[0].path, raw))
  const root = roots.find((r) => abs === r.path || abs.startsWith(r.path + path.sep))
  if (!root) return { error: `path is outside allowed roots: ${roots.map((r) => r.path).join(", ")}` }
  return { abs, root: root.path }
}

export function listDir(inputPath?: string): { ok: true; cwd: string; parent: string | null; items: FsItem[]; roots: ReturnType<typeof allowedRoots>; backend: string } | { ok: false; error: string } {
  const resolved = resolveAllowed(inputPath)
  if ("error" in resolved) return { ok: false, error: resolved.error }
  let stat: fs.Stats
  try {
    stat = fs.statSync(resolved.abs)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
  const dir = stat.isDirectory() ? resolved.abs : path.dirname(resolved.abs)
  let names: string[]
  try {
    names = fs.readdirSync(dir)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
  const items: FsItem[] = []
  for (const name of names) {
    const p = path.join(dir, name)
    let st: fs.Stats
    let isLink = false
    try {
      const lst = fs.lstatSync(p)
      isLink = lst.isSymbolicLink()
      st = isLink ? fs.statSync(p) : lst
    } catch {
      continue
    }
    const isDir = st.isDirectory()
    const secret = SECRET_NAME.test(name)
    const type = classify(name, isDir)
    items.push({
      id: p,
      name,
      type: isLink ? "symlink" : type,
      path: p,
      size: isDir ? undefined : st.size,
      modified: st.mtime.toISOString(),
      permissions: modeString(st.mode, isDir, isLink),
      hidden: name.startsWith("."),
      starred: false,
      locked: secret,
      description: secret ? "secret filename — contents will not be returned" : isDir ? "directory" : `${type} (${st.size} bytes)`,
      componentType: type === "component" ? "React Component" : undefined,
      moduleType: type === "module" ? "TypeScript Module" : undefined,
      readable: !secret && (isDir || (st.mode & 0o444) !== 0),
      redacted: secret,
    })
  }
  items.sort((a, b) => {
    if (a.type === "directory" && b.type !== "directory") return -1
    if (b.type === "directory" && a.type !== "directory") return 1
    return a.name.localeCompare(b.name)
  })
  const parentResolved = path.dirname(dir)
  const parentOk = resolveAllowed(parentResolved)
  return {
    ok: true,
    cwd: dir,
    parent: "error" in parentOk || parentResolved === dir ? null : parentResolved,
    items,
    roots: allowedRoots(),
    backend: "fs.readdir (live)",
  }
}

const MAX_PREVIEW = 200_000

export function readFilePreview(inputPath: string): { ok: true; path: string; content: string; truncated: boolean; size: number; backend: string } | { ok: false; error: string } {
  const resolved = resolveAllowed(inputPath)
  if ("error" in resolved) return { ok: false, error: resolved.error }
  const name = path.basename(resolved.abs)
  if (SECRET_NAME.test(name)) return { ok: false, error: "refusing to read a secret file" }
  try {
    const st = fs.statSync(resolved.abs)
    if (st.isDirectory()) return { ok: false, error: "is a directory" }
    if (st.size > 8_000_000) return { ok: false, error: "file too large to preview" }
    const buf = fs.readFileSync(resolved.abs)
    // skip obviously binary
    const sample = buf.subarray(0, 800)
    let nul = 0
    for (const b of sample) if (b === 0) nul++
    if (nul > 4) return { ok: false, error: "binary file — not previewed" }
    const truncated = buf.length > MAX_PREVIEW
    const content = buf.subarray(0, MAX_PREVIEW).toString("utf8")
    return { ok: true, path: resolved.abs, content, truncated, size: st.size, backend: "fs.readFile (live)" }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
