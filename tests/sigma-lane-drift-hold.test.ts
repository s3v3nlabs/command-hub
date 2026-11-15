/**
 * F5 / T5 — drift (Δt) must survive a lane change; orchestrate must not erase it.
 * Christian Wilford (s3v3n), Founder, Singular/ty Defense Solutions, LLC.
 */
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { beforeAll, describe, expect, it } from "vitest"

beforeAll(() => {
  process.env.S3V3N_SIGMA_MEMORY = fs.mkdtempSync(path.join(os.tmpdir(), "sigma-f5-"))
})

describe("sigma-lane drift containment (F5)", () => {
  it("setLane keeps Δt", async () => {
    const { bumpDeltaT, setLane, getLaneState, neutralizeDeltaT } = await import("@/lib/sigma-lane/lanes")
    neutralizeDeltaT()
    bumpDeltaT(0.9)
    setLane("build")
    expect(getLaneState().deltaT).toBeCloseTo(0.9, 5)
    setLane("defense")
    expect(getLaneState().deltaT).toBeCloseTo(0.9, 5)
  })
  it("orchestrate measures drift without zeroing accumulated Δt", async () => {
    const { bumpDeltaT, getLaneState, neutralizeDeltaT } = await import("@/lib/sigma-lane/lanes")
    const { orchestrate } = await import("@/lib/sigma-lane/orchestrator")
    neutralizeDeltaT()
    bumpDeltaT(0.7)
    orchestrate({ task: "harden the firewall", laneId: "defense" })
    expect(getLaneState().deltaT).toBeGreaterThanOrEqual(0.7)
  })
})
