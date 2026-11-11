/** Evidence cache keyed by target sha256 + engine + op + args. */

import fs from "fs"
import path from "path"
import { rePaths } from "./paths"
import { cacheKey } from "./evidence"
import type { EngineId, EvidenceRecord } from "./types"

function file(sha: string, engine: EngineId, parts: Record<string, unknown>) {
  return path.join(rePaths.cache(), sha, engine, `${cacheKey(parts)}.json`)
}

export function getCached(sha: string, engine: EngineId, parts: Record<string, unknown>): EvidenceRecord | null {
  try {
    const f = file(sha, engine, parts)
    if (!fs.existsSync(f)) return null
    return { ...(JSON.parse(fs.readFileSync(f, "utf8")) as EvidenceRecord), cached: true }
  } catch {
    return null
  }
}

export function putCached(sha: string, engine: EngineId, parts: Record<string, unknown>, ev: EvidenceRecord) {
  if (ev.kind === "error") return // never cache failures
  const f = file(sha, engine, parts)
  fs.mkdirSync(path.dirname(f), { recursive: true, mode: 0o700 })
  fs.writeFileSync(f, JSON.stringify(ev), { mode: 0o600 })
}
