/**
 * Self-healing Governor — deny-by-default.
 *
 * F2 fix (blue-team review): approval no longer comes from a caller-supplied `approved: true`.
 * The ONLY approval is a Commander token checked by a server-side verifier that the caller
 * injects (lib/security/commander-token.ts → verifyCommanderToken). Client-side code has no
 * verifier and no secret, so in the browser only low-risk monitoring verbs can pass.
 * Actions are canonicalised (case / whitespace / NFKC); anything not on the low-risk list is
 * treated as needing approval in every mode (variants like "DELETE ", "Wipe",
 * "overwrite-config" included).
 * This file has no Node imports so client bundles keep compiling.
 *
 * Author: Christian Wilford (s3v3n), Founder, Singular/ty Defense Solutions, LLC.
 */

export type CommanderVerifier = (
  token: string | null | undefined,
  expect: { action: string; target: string; ref?: string | null },
) => { ok: boolean; error?: string }

export const LOW_RISK_ACTIONS = ["monitor", "analyze", "report", "log"] as const

export function canonicalHealAction(a: string): string {
  return String(a ?? "").normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ")
}

/**
 * @param action    action to authorise
 * @param metadata  { commanderToken?, target? (default "self-healing"), ref? } — `approved` is ignored
 * @param verify    server-side Commander token verifier; omitted → nothing can be approved
 */
export function authorize(action: string, metadata?: any, verify?: CommanderVerifier) {
  const replayApprovedOnly = process.env.REPLAY_APPROVED_ONLY === "true"
  const governorMode = process.env.GOVERNOR_MODE || "gatekeeper"
  const blackframeMode = process.env.BLACKFRAME_MODE || "autonomy"
  const act = canonicalHealAction(action)
  const target = typeof metadata?.target === "string" ? metadata.target : "self-healing"
  const ref = typeof metadata?.ref === "string" ? metadata.ref : null

  let commander: { ok: boolean; error?: string } = { ok: false, error: "no_commander_token" }
  if (metadata?.commanderToken) {
    commander = verify ? verify(metadata.commanderToken, { action: act, target, ref }) : { ok: false, error: "no_server_verifier" }
  }

  const lowRisk = (LOW_RISK_ACTIONS as readonly string[]).includes(act)
  const lowRiskAllowed =
    lowRisk && blackframeMode !== "manual" && !(blackframeMode === "autonomy" && governorMode === "gatekeeper" && replayApprovedOnly)

  const approved = lowRiskAllowed || commander.ok
  const reason = approved
    ? commander.ok
      ? "Approved by verified Commander token"
      : "Low-risk monitoring action"
    : `Commander approval required (${commander.error ?? "denied"})`

  const { approved: _ignored, commanderToken: _tok, ...rest } = metadata ?? {}
  return {
    approved,
    reason,
    timestamp: new Date().toISOString(),
    action: act,
    metadata: {
      ...rest,
      clientApprovedFlagIgnored: metadata?.approved === true,
      environmentSettings: { replayApprovedOnly, governorMode, blackframeMode },
    },
  }
}
