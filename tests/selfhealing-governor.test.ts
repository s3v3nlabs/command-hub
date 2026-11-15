/**
 * F2 — selfHealing Governor must not trust a caller-supplied approved:true; variants deny.
 * Christian Wilford (s3v3n), Founder, Singular/ty Defense Solutions, LLC.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { authorize } from "@/lib/selfHealing/Governor"
import { mintCommanderToken, verifyCommanderToken } from "@/lib/security/commander-token"

const env = { ...process.env }
beforeEach(() => {
  process.env.COMMANDER_TOKEN_SECRET = "test-secret-not-real-0123456789abcdef"
  process.env.GOVERNOR_MODE = "gatekeeper"
  process.env.REPLAY_APPROVED_ONLY = "true"
  process.env.BLACKFRAME_MODE = "autonomy"
})
afterEach(() => {
  process.env = { ...env }
})

describe("selfHealing Governor (F2)", () => {
  it("ignores metadata.approved === true", () => {
    expect(authorize("heal", { approved: true }).approved).toBe(false)
  })
  it("non-gatekeeper mode: variant destructive verbs still need approval (fail closed)", () => {
    process.env.GOVERNOR_MODE = "autonomy"
    process.env.REPLAY_APPROVED_ONLY = "false"
    for (const a of ["overwrite-config", "DELETE ", "Wipe", "rm -rf /data", "exfiltrate vault"]) expect({ a, ok: authorize(a, { approved: true }).approved }).toEqual({ a, ok: false })
    expect(authorize("monitor").approved).toBe(true)
  })
  it("only a server-verified Commander token bound to action+target approves", () => {
    const t = mintCommanderToken({ action: "heal", target: "self-healing" })
    expect(authorize("heal", { commanderToken: t }).approved).toBe(false) // no server verifier → closed
    expect(authorize("heal", { commanderToken: t }, verifyCommanderToken).approved).toBe(true)
    expect(authorize("heal", { commanderToken: t }, verifyCommanderToken).approved).toBe(false) // single use
  })
})
