/**
 * Server-side heal gate — replay BEFORE heal (F3 / T8).
 *
 *   1. recordReplay(proposal)  → deterministic simulated replay; stores { replayId, patchHash, passed }
 *   2. Commander mints a token: action "heal", target "patch:<sha256>", ref "<replayId>"
 *   3. authorizeHeal(...)      → approved only if a PASSED replay exists for that exact patch hash,
 *                                the token verifies (bound to patch + replay, single use), and the
 *                                replay record has not been used for a previous heal.
 * Ledger is in-memory (restart clears it → replay again). Server-only (node:crypto).
 *
 * Author: Christian Wilford (s3v3n), Founder, Singular/ty Defense Solutions, LLC.
 */
import crypto from "node:crypto"
import { verifyCommanderToken } from "@/lib/security/commander-token"
import { authorize } from "./Governor"
import { simulateReplay, stableStringify } from "./Replay"

type ReplayRecord = { replayId: string; patchHash: string; passed: boolean; checks: Array<{ check: string; ok: boolean }>; atMs: number; used: boolean }
const LEDGER = new Map<string, ReplayRecord>()

export function patchHash(proposal: unknown): string {
  return crypto.createHash("sha256").update(stableStringify(proposal)).digest("hex")
}

export function resetHealGate() {
  LEDGER.clear()
}

export async function recordReplay(proposal: unknown): Promise<ReplayRecord> {
  const r = await simulateReplay(proposal)
  const rec: ReplayRecord = {
    replayId: r.replayResult.replayId,
    patchHash: patchHash(proposal),
    passed: r.replayResult.success,
    checks: r.replayResult.checks,
    atMs: Date.now(),
    used: false,
  }
  LEDGER.set(rec.replayId, rec)
  return rec
}

export function authorizeHeal(p: { action: string; proposal: unknown; commanderToken?: string | null; replayId?: string | null }) {
  const h = patchHash(p.proposal)
  const rec = p.replayId ? LEDGER.get(p.replayId) : undefined
  if (!rec || rec.patchHash !== h || !rec.passed) return { approved: false, error: "no_passed_replay", patchHash: h }
  if (rec.used) return { approved: false, error: "replay_already_used", patchHash: h }
  const g = authorize(p.action, { commanderToken: p.commanderToken, target: `patch:${h}`, ref: rec.replayId }, verifyCommanderToken)
  if (!g.approved) return { approved: false, error: g.reason, patchHash: h }
  rec.used = true
  return { approved: true, error: null, patchHash: h, replayId: rec.replayId, reason: g.reason }
}
