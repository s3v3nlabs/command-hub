import path from "path"
import { rePaths } from "./paths"

/**
 * REA tool args may contain filesystem paths. Any absolute path must stay inside
 * the sandboxed analysis roots, so REA can never be pointed at arbitrary host files.
 */
export function argsPathViolation(args: unknown, depth = 0): string | null {
  if (depth > 8) return "args nested too deeply"
  if (typeof args === "string") {
    if (path.isAbsolute(args) || /^[A-Za-z]:[\\/]/.test(args) || args.startsWith("~")) {
      const abs = path.resolve(args)
      const roots = [rePaths.targets(), rePaths.quarantine()].map((r) => path.resolve(r) + path.sep)
      if (!roots.some((r) => abs.startsWith(r))) return `path outside sandboxed analysis area: ${args}`
    }
    if (/(^|[\\/])\.\.([\\/]|$)/.test(args)) return `path traversal not allowed: ${args}`
    return null
  }
  if (Array.isArray(args)) {
    for (const a of args) {
      const v = argsPathViolation(a, depth + 1)
      if (v) return v
    }
    return null
  }
  if (args && typeof args === "object") {
    for (const v of Object.values(args as Record<string, unknown>)) {
      const r = argsPathViolation(v, depth + 1)
      if (r) return r
    }
  }
  return null
}
