/**
 * Isomorphic file shim for the v0 consciousness systems.
 * On the server it uses Node's fs. In the browser (where webpack stubs `fs` to an
 * empty module) it falls back to localStorage so client components don't crash.
 */
import * as nodeFs from "fs"

const hasFs = typeof window === "undefined" && typeof (nodeFs as any).existsSync === "function"
const KEY = (p: string) => `v0fs:${p}`

export function existsSync(p: string): boolean {
  if (hasFs) return nodeFs.existsSync(p)
  if (typeof localStorage === "undefined") return false
  return localStorage.getItem(KEY(p)) !== null || p === "./data" || p.endsWith("/data")
}
export function mkdirSync(p: string, opts?: { recursive?: boolean }): void {
  if (hasFs) {
    nodeFs.mkdirSync(p, opts)
  }
}
export function readFileSync(p: string, _enc?: string): string {
  if (hasFs) return nodeFs.readFileSync(p, "utf-8")
  const v = typeof localStorage !== "undefined" ? localStorage.getItem(KEY(p)) : null
  if (v === null) throw new Error(`ENOENT (browser storage): ${p}`)
  return v
}
export function writeFileSync(p: string, data: string | Uint8Array): void {
  if (hasFs) {
    nodeFs.writeFileSync(p, data)
    return
  }
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(KEY(p), typeof data === "string" ? data : "[binary]")
  } catch {
    /* quota — ignore */
  }
}
export function join(...parts: string[]): string {
  return parts.join("/").replace(/\/+/g, "/")
}
