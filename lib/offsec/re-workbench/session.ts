/**
 * ONE PROVIDER PER SESSION (REA principle). An engine+target pair is bound
 * explicitly; requests for a different engine are refused until the operator
 * explicitly rebinds. Persisted under local-data/re-workbench/session.json.
 */

import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"
import { rePaths } from "./paths"
import type { EngineId, WorkbenchSession } from "./types"

const file = () => path.join(rePaths.root(), "session.json")

export function getSession(): WorkbenchSession | null {
  try {
    if (!fs.existsSync(file())) return null
    return JSON.parse(fs.readFileSync(file(), "utf8")) as WorkbenchSession
  } catch {
    return null
  }
}

export function clearSession() {
  fs.rmSync(file(), { force: true })
}

export type BindResult =
  | { ok: true; session: WorkbenchSession; rebound: boolean }
  | { ok: false; error: string; current: WorkbenchSession }

export function bindSession(
  engine: EngineId,
  targetSha256: string,
  opts: { rebind?: boolean; reaProvider?: string } = {},
): BindResult {
  const cur = getSession()
  const reaProvider = engine === "rea" ? opts.reaProvider || undefined : undefined
  const same = !!cur && cur.engine === engine && cur.targetSha256 === targetSha256 && (cur.reaProvider || undefined) === reaProvider
  if (cur && !same && !opts.rebind) {
    return {
      ok: false,
      error: `session_bound: this session is bound to ${cur.engine}${cur.reaProvider ? "/" + cur.reaProvider : ""} on ${cur.targetSha256.slice(0, 12)}…; engines/providers are never swapped silently — rebind explicitly (rebind: true) to change.`,
      current: cur,
    }
  }
  if (cur && same) return { ok: true, session: cur, rebound: false }
  const session: WorkbenchSession = { id: randomUUID(), engine, targetSha256, boundAt: new Date().toISOString(), ...(reaProvider ? { reaProvider } : {}) }
  fs.mkdirSync(rePaths.root(), { recursive: true, mode: 0o700 })
  fs.writeFileSync(file(), JSON.stringify(session, null, 2), { mode: 0o600 })
  return { ok: true, session, rebound: !!cur }
}

/** Guard used by every analysis call. */
export function assertBound(engine: EngineId, targetSha256: string): string | null {
  const cur = getSession()
  if (!cur) return "no_session: bind an engine to a target first"
  if (cur.engine !== engine) return `provider_mismatch: session is bound to ${cur.engine}; refusing to silently switch to ${engine}`
  if (cur.targetSha256 !== targetSha256) return "target_mismatch: session is bound to a different target"
  return null
}
