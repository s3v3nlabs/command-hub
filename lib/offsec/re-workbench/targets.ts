/**
 * Sandboxed analysis area. Targets are stored by sha256 under
 * local-data/re-workbench/targets/<sha256>/ with mode 0600 (never executable).
 * Samples already captured by the Deception Mesh quarantine can be selected
 * in place (read-only). Nothing here ever runs a target.
 */

import fs from "fs"
import path from "path"
import { createHash } from "crypto"
import { rePaths } from "./paths"
import { sniffFormat } from "./evidence"
import type { TargetRecord } from "./types"

export const MAX_UPLOAD_BYTES = () =>
  Math.max(1, Number(process.env.RE_MAX_UPLOAD_MB || "") || 256) * 1024 * 1024

function safeName(name: string): string {
  const base = path.basename(String(name || "target.bin"))
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, "_").replace(/^[.-]+/, "_").slice(0, 120)
  return cleaned || "target.bin"
}

function readHead(file: string): Buffer {
  const fd = fs.openSync(file, "r")
  try {
    const b = Buffer.alloc(16)
    const n = fs.readSync(fd, b, 0, 16, 0)
    return b.subarray(0, n)
  } finally {
    fs.closeSync(fd)
  }
}

export function storeUpload(name: string, buf: Buffer): TargetRecord {
  if (buf.length === 0) throw new Error("empty file")
  if (buf.length > MAX_UPLOAD_BYTES()) throw new Error(`file exceeds RE_MAX_UPLOAD_MB (${MAX_UPLOAD_BYTES()} bytes)`)
  const sha256 = createHash("sha256").update(buf).digest("hex")
  const dir = path.join(rePaths.targets(), sha256)
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
  const fname = safeName(name)
  const file = path.join(dir, fname)
  if (!fs.existsSync(file)) fs.writeFileSync(file, buf, { mode: 0o600 })
  const meta: TargetRecord = {
    id: sha256,
    sha256,
    name: fname,
    sizeBytes: buf.length,
    origin: "upload",
    relPath: path.relative(process.cwd(), file),
    addedAt: new Date().toISOString(),
    format: sniffFormat(buf.subarray(0, 16)),
  }
  fs.writeFileSync(path.join(dir, "target.json"), JSON.stringify(meta, null, 2), { mode: 0o600 })
  return meta
}

function listUploads(): TargetRecord[] {
  const dir = rePaths.targets()
  if (!fs.existsSync(dir)) return []
  const out: TargetRecord[] = []
  for (const sha of fs.readdirSync(dir)) {
    if (!/^[0-9a-f]{64}$/.test(sha)) continue
    try {
      out.push(JSON.parse(fs.readFileSync(path.join(dir, sha, "target.json"), "utf8")) as TargetRecord)
    } catch {
      /* skip malformed */
    }
  }
  return out
}

function listQuarantine(): TargetRecord[] {
  const dir = rePaths.quarantine()
  if (!fs.existsSync(dir)) return []
  const out: TargetRecord[] = []
  for (const f of fs.readdirSync(dir)) {
    const m = /^([0-9a-f]{64})\.bin$/.exec(f)
    if (!m) continue
    const file = path.join(dir, f)
    try {
      const st = fs.statSync(file)
      out.push({
        id: m[1],
        sha256: m[1],
        name: f,
        sizeBytes: st.size,
        origin: "quarantine",
        relPath: path.relative(process.cwd(), file),
        addedAt: st.mtime.toISOString(),
        format: sniffFormat(readHead(file)),
      })
    } catch {
      /* skip */
    }
  }
  return out
}

export function listTargets(): TargetRecord[] {
  const seen = new Set<string>()
  return [...listUploads(), ...listQuarantine()]
    .filter((t) => (seen.has(t.sha256) ? false : (seen.add(t.sha256), true)))
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
}

/** Resolve a target id to an absolute path that is guaranteed inside the sandbox roots. */
export function resolveTarget(id: string): { target: TargetRecord; absPath: string } | null {
  if (!/^[0-9a-f]{64}$/.test(String(id || ""))) return null
  const t = listTargets().find((x) => x.sha256 === id)
  if (!t) return null
  const abs = path.resolve(process.cwd(), t.relPath)
  const roots = [rePaths.targets(), rePaths.quarantine()].map((r) => path.resolve(r) + path.sep)
  if (!roots.some((r) => abs.startsWith(r))) return null
  if (!fs.existsSync(abs)) return null
  return { target: t, absPath: abs }
}

export function deleteTarget(id: string): boolean {
  if (!/^[0-9a-f]{64}$/.test(String(id || ""))) return false
  const dir = path.join(rePaths.targets(), id)
  if (!fs.existsSync(dir)) return false // quarantine samples are owned by the Deception Mesh
  fs.rmSync(dir, { recursive: true, force: true })
  fs.rmSync(path.join(rePaths.cache(), id), { recursive: true, force: true })
  return true
}
