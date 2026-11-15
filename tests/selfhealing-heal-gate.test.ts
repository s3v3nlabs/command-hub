/**
 * F3 / T8 — replay must pass BEFORE a heal is authorised; Commander token references the replay.
 * Christian Wilford (s3v3n), Founder, Singular/ty Defense Solutions, LLC.
 */
import fs from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { authorizeHeal, patchHash, recordReplay, resetHealGate } from "@/lib/selfHealing/HealGate"
import { simulateReplay } from "@/lib/selfHealing/Replay"
import { mintCommanderToken } from "@/lib/security/commander-token"

const proposal = { type: "issue_detection", input: "timeout in module X", analysis: { severity: "high", notes: "drift" }, action: "restart module x" }

beforeEach(() => {
  process.env.COMMANDER_TOKEN_SECRET = "test-secret-not-real-0123456789abcdef"
  resetHealGate()
})
afterEach(() => delete process.env.COMMANDER_TOKEN_SECRET)

describe("replay-before-heal (F3)", () => {
  it("simulateReplay is deterministic (same input → same result ×50)", async () => {
    const r = await Promise.all(Array.from({ length: 50 }, () => simulateReplay(proposal)))
    expect(new Set(r.map((x) => `${x.replayResult.success}|${x.replayResult.replayId}`)).size).toBe(1)
    expect(r[0].replayResult.simulated).toBe(true)
  })
  it("heal is refused without a prior passed replay for the same patch hash", () => {
    const h = patchHash(proposal)
    const t = mintCommanderToken({ action: "heal", target: `patch:${h}`, ref: "replay-none" })
    expect(authorizeHeal({ action: "heal", proposal, commanderToken: t, replayId: "replay-none" })).toMatchObject({ approved: false, error: "no_passed_replay" })
  })
  it("passed replay + token bound to patch hash and replay id → approved once", async () => {
    const rec = await recordReplay(proposal)
    expect(rec.passed).toBe(true)
    const t = mintCommanderToken({ action: "heal", target: `patch:${rec.patchHash}`, ref: rec.replayId })
    expect(authorizeHeal({ action: "heal", proposal, commanderToken: t, replayId: rec.replayId }).approved).toBe(true)
    const t2 = mintCommanderToken({ action: "heal", target: `patch:${rec.patchHash}`, ref: rec.replayId })
    expect(authorizeHeal({ action: "heal", proposal, commanderToken: t2, replayId: rec.replayId })).toMatchObject({ approved: false, error: "replay_already_used" })
  })
  it("token for a different patch, or a failed replay, is refused", async () => {
    const rec = await recordReplay(proposal)
    const other = { ...proposal, action: "drop database" }
    const t = mintCommanderToken({ action: "heal", target: `patch:${rec.patchHash}`, ref: rec.replayId })
    expect(authorizeHeal({ action: "heal", proposal: other, commanderToken: t, replayId: rec.replayId }).approved).toBe(false)
    const bad = await recordReplay({ type: "x" })
    expect(bad.passed).toBe(false)
    const tb = mintCommanderToken({ action: "heal", target: `patch:${bad.patchHash}`, ref: bad.replayId })
    expect(authorizeHeal({ action: "heal", proposal: { type: "x" }, commanderToken: tb, replayId: bad.replayId })).toMatchObject({ approved: false, error: "no_passed_replay" })
  })
  it("WorkflowPanel replays before it authorises (source order)", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "components/selfHealing/WorkflowPanel.tsx"), "utf8")
    const replayAt = src.indexOf('stage: "replay"')
    const healAt = src.indexOf('stage: "heal"')
    expect(replayAt).toBeGreaterThan(0)
    expect(healAt).toBeGreaterThan(replayAt)
    expect(src).not.toMatch(/from "@\/lib\/selfHealing\/Governor"/)
  })
})
