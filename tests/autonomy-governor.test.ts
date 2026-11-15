/**
 * F1 / T2 / T3 — lib/AutonomyGovernor.ts must be deterministic and deny by default.
 * Christian Wilford (s3v3n), Founder, Singular/ty Defense Solutions, LLC.
 */
import fs from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { authorize } from "@/lib/AutonomyGovernor"
import { mintCommanderToken } from "@/lib/security/commander-token"

/** Files that must stay free of Math.random (grows as F-items are fixed). */
export const RANDOM_FREE = ["lib/AutonomyGovernor.ts", "lib/selfHealing/Governor.ts", "lib/selfHealing/Replay.ts", "lib/selfHealing/HealGate.ts", "lib/selfHealing/AgentCore.ts"]

beforeEach(() => {
  process.env.COMMANDER_TOKEN_SECRET = "test-secret-not-real-0123456789abcdef"
  delete process.env.GOVERNOR_MODE
  delete process.env.BLACKFRAME_MODE
})
afterEach(() => delete process.env.COMMANDER_TOKEN_SECRET)

describe("AutonomyGovernor (F1)", () => {
  it("never authorizes a critical action without a Commander token (×1000, deterministic)", () => {
    let n = 0
    for (let i = 0; i < 1000; i++) if (authorize("delete all logs").authorized) n++
    expect(n).toBe(0)
  })
  it("unknown / variant verbs deny by default (T3)", () => {
    for (const a of ["exfiltrate vault", "DELETE ", "Wipe", "overwrite-config"]) expect(authorize(a).authorized).toBe(false)
  })
  it("read-only verbs are allowed; a valid bound Commander token allows a critical action once", () => {
    expect(authorize("monitor").authorized).toBe(true)
    const t = mintCommanderToken({ action: "delete all logs", target: "autonomy" })
    expect(authorize("delete all logs", { commanderToken: t })).toMatchObject({ authorized: true })
    expect(authorize("delete all logs", { commanderToken: t }).authorized).toBe(false)
  })
  it("analyzeDrift is deterministic (F10)", async () => {
    const { analyzeDrift } = await import("@/lib/selfHealing/AgentCore")
    const r = Array.from({ length: 200 }, () => analyzeDrift("system running fine"))
    expect(new Set(r.map((x) => `${x.severity}|${x.confidence}|${x.quantumSignature}`)).size).toBe(1)
  })
  it("no Math.random in authz / replay / drift paths (T2)", () => {
    for (const f of RANDOM_FREE) {
      const src = fs.readFileSync(path.join(process.cwd(), f), "utf8")
      expect({ f, random: /Math\.random/.test(src) }).toEqual({ f, random: false })
    }
  })
})
