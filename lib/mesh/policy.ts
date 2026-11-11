/**
 * Mesh policy — hard reject burner / trashable / rotate-identity abuse.
 * ALLOWED: Operator-owned seats; rotate/combine ephemeral jobs/pods.
 * FORBIDDEN: createAccount / burner / trashable accounts / rotateIdentity / CAPTCHA farms.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false
 */

export const HOLD = "HOLD_VYRNA_UNSYNC" as const

export const FORBIDDEN_ACTIONS = [
  "createAccount",
  "createBurner",
  "burner",
  "trashable",
  "perishableAccount",
  "rotateIdentity",
  "rotateIdentities",
  "farmFreeTier",
  "multiAccount",
  "captchaSolve",
  "captchaSolver",
  "emailFarm",
  "throwawayAccount",
  "evadeQuota",
  "tosEvade",
] as const

export type ForbiddenAction = (typeof FORBIDDEN_ACTIONS)[number]

const FORBIDDEN_RE =
  /\b(create[-_]?account|create[-_]?burner|burner|trashable|perishable[-_]?account|rotate[-_]?identit|farm[-_]?free|multi[-_]?account|captcha[-_]?solv|email[-_]?farm|throwaway|evade[-_]?(tos|quota)|tos[-_]?evas)/i

export type PolicyVerdict =
  | { ok: true; action: string }
  | {
      ok: false
      status: 403
      error: string
      reason: string
      forbidsBurnerAccounts: true
      hold: typeof HOLD
      lattice_sync: false
    }

export function isForbiddenAction(action: unknown): boolean {
  if (typeof action !== "string" || !action.trim()) return false
  const a = action.trim()
  if (FORBIDDEN_ACTIONS.some((f) => f.toLowerCase() === a.toLowerCase())) return true
  return FORBIDDEN_RE.test(a)
}

export function rejectForbidden(action: unknown): PolicyVerdict {
  const label = typeof action === "string" ? action : String(action)
  if (!isForbiddenAction(action)) {
    return { ok: true, action: label }
  }
  return {
    ok: false,
    status: 403,
    error: "Forbidden mesh action",
    reason:
      "Burner/trashable/throwaway account creation, identity rotation, CAPTCHA/email farms, and ToS-quota evasion are forbidden. Auth must be Operator-owned seats only; perishable means ephemeral pods/jobs, not identities.",
    forbidsBurnerAccounts: true,
    hold: HOLD,
    lattice_sync: false,
  }
}

/** Shape-scan body for burner-farm intent (keys + nested strings). */
export function scanBodyForBurnerIntent(body: unknown): PolicyVerdict {
  if (!body || typeof body !== "object") return { ok: true, action: "body" }
  const blob = JSON.stringify(body)
  if (FORBIDDEN_RE.test(blob)) {
    return rejectForbidden("createBurner")
  }
  const rec = body as Record<string, unknown>
  if (typeof rec.action === "string" && isForbiddenAction(rec.action)) {
    return rejectForbidden(rec.action)
  }
  return { ok: true, action: "body" }
}
