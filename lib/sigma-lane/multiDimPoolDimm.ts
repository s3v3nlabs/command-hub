/**
 * MultiDimPool × DIMM — physical substrate for pool shard blobs when DIMM mounted.
 * ADD-ONLY; does not alter pulse math. Pink/brown schedulers stay in pulse.ts.
 */
import fs from "fs"
import path from "path"
import type { PoolKey } from "./pulse"

const HOLD = "HOLD_VYRNA_UNSYNC" as const

function dimmSymbols(): string | null {
  try {
    // lazy require to avoid circular edge cases in edge runtime
    const { preferDimmSubdir } = require("@/lib/dimm-drive") as {
      preferDimmSubdir: (s: "symbols") => string | null
    }
    return preferDimmSubdir("symbols")
  } catch {
    return null
  }
}

export function poolShardPath(pool: PoolKey): string | null {
  const base = dimmSymbols()
  if (!base) return null
  const dir = path.join(base, "pool-shards")
  fs.mkdirSync(dir, { recursive: true })
  const safe = pool.key.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120)
  return path.join(dir, `${safe}.json`)
}

export function writePoolShard(pool: PoolKey, payload: Record<string, unknown>): {
  ok: boolean
  path?: string
  onDimm: boolean
  hold: typeof HOLD
  lattice_sync: false
} {
  const p = poolShardPath(pool)
  if (!p) {
    return { ok: false, onDimm: false, hold: HOLD, lattice_sync: false }
  }
  fs.writeFileSync(
    p,
    JSON.stringify({
      pool,
      payload,
      at: new Date().toISOString(),
      hold: HOLD,
      lattice_sync: false,
      note: "DIMM substrate for MultiDimPool shards (pink/brown pulse schedules elsewhere)",
    }) + "\n",
  )
  return { ok: true, path: p, onDimm: true, hold: HOLD, lattice_sync: false }
}

export function multiDimPoolDimmStatus() {
  const base = dimmSymbols()
  let shardCount = 0
  if (base) {
    const dir = path.join(base, "pool-shards")
    try {
      if (fs.existsSync(dir)) shardCount = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).length
    } catch {
      /* ignore */
    }
  }
  return {
    onDimm: Boolean(base),
    symbolsPath: base,
    shardCount,
    hold: HOLD,
    lattice_sync: false as const,
  }
}
