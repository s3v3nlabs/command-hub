/**
 * AutonomyGovernor — BLACKFRAME gate. Deterministic and deny-by-default.
 *
 * F1 fix (blue-team review): the previous version approved 70% of critical actions with a
 * random number and always approved anything without a critical keyword. Now:
 *   • read-only verbs (monitor / analyze / report / log / status / read) are allowed unless
 *     BLACKFRAME_MODE=passive or manual;
 *   • every other action — known, unknown or variant spelling — needs a Commander token
 *     (lib/security/commander-token.ts) bound to this exact canonical action and target
 *     "autonomy". No token / bad token / reused token → denied.
 * Server-only (uses node:crypto through the verifier).
 *
 * Author: Christian Wilford (s3v3n), Founder, Singular/ty Defense Solutions, LLC.
 */
import { canonicalAction, verifyCommanderToken } from "@/lib/security/commander-token"

interface AuthorizationResult {
  authorized: boolean
  reason: string
  timestamp: string
  commanderId?: string
}

export const READ_ONLY_ACTIONS = ["monitor", "analyze", "report", "log", "status", "read"] as const

export function authorize(action: string, opts: { commanderToken?: string | null; now?: number } = {}): AuthorizationResult {
  const blackframeMode = (process.env.BLACKFRAME_MODE || "autonomy").toLowerCase()
  const act = canonicalAction(action)
  const timestamp = new Date(opts.now ?? Date.now()).toISOString()
  const readOnly = (READ_ONLY_ACTIONS as readonly string[]).includes(act)

  if (readOnly && blackframeMode !== "passive" && blackframeMode !== "manual") {
    return { authorized: true, reason: "Read-only action", timestamp }
  }
  if (!opts.commanderToken) {
    return {
      authorized: false,
      reason: blackframeMode === "passive" ? "BLACKFRAME is in passive mode, all actions require Commander approval" : "Commander token required",
      timestamp,
    }
  }
  const v = verifyCommanderToken(opts.commanderToken, { action: act, target: "autonomy" }, opts.now)
  if (!v.ok) return { authorized: false, reason: `Commander token rejected: ${v.error}`, timestamp }
  return { authorized: true, reason: "Approved by verified Commander token", timestamp, commanderId: `nonce:${v.claims.nonce.slice(0, 8)}` }
}
