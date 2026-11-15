/**
 * Commander token verifier (T1). Christian Wilford (s3v3n), Founder, Singular/ty Defense Solutions, LLC.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { canonicalAction, mintCommanderToken, verifyCommanderToken } from "@/lib/security/commander-token"

const SECRET = "test-secret-not-real-0123456789abcdef"
beforeEach(() => {
  process.env.COMMANDER_TOKEN_SECRET = SECRET
})
afterEach(() => {
  delete process.env.COMMANDER_TOKEN_SECRET
})

describe("commander token", () => {
  it("valid token verifies once; reused nonce rejected", () => {
    const t = mintCommanderToken({ action: "Heal", target: "patch:abc" })
    expect(verifyCommanderToken(t, { action: " heal ", target: "patch:abc" }).ok).toBe(true)
    expect(verifyCommanderToken(t, { action: "heal", target: "patch:abc" })).toEqual({ ok: false, error: "nonce_reused" })
  })
  it("binds action, target and ref", () => {
    const t = () => mintCommanderToken({ action: "heal", target: "patch:abc", ref: "replay-1" })
    expect(verifyCommanderToken(t(), { action: "delete", target: "patch:abc", ref: "replay-1" }).ok).toBe(false)
    expect(verifyCommanderToken(t(), { action: "heal", target: "patch:xyz", ref: "replay-1" }).ok).toBe(false)
    expect(verifyCommanderToken(t(), { action: "heal", target: "patch:abc", ref: null }).ok).toBe(false)
    expect(verifyCommanderToken(t(), { action: "heal", target: "patch:abc", ref: "replay-1" }).ok).toBe(true)
  })
  it("expired, tampered, forged and missing-secret all fail closed", () => {
    const now = Date.now()
    const t = mintCommanderToken({ action: "heal", target: "x", ttlMs: 1000 }, now)
    expect(verifyCommanderToken(t, { action: "heal", target: "x" }, now + 2000).ok).toBe(false)
    const [p, s] = mintCommanderToken({ action: "heal", target: "x" }).split(".")
    expect(verifyCommanderToken(`${p}.${s.slice(0, -2)}AA`, { action: "heal", target: "x" }).ok).toBe(false)
    expect(verifyCommanderToken("true", { action: "heal", target: "x" }).ok).toBe(false)
    expect(verifyCommanderToken(undefined, { action: "heal", target: "x" }).ok).toBe(false)
    const ok = mintCommanderToken({ action: "heal", target: "x" })
    delete process.env.COMMANDER_TOKEN_SECRET
    expect(verifyCommanderToken(ok, { action: "heal", target: "x" })).toEqual({ ok: false, error: "commander_token_secret_not_configured" })
    expect(() => mintCommanderToken({ action: "heal", target: "x" })).toThrow()
  })
  it("canonicalAction folds case/whitespace variants", () => {
    expect(canonicalAction("  DELETE   All ")).toBe("delete all")
  })
})
