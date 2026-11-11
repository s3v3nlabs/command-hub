import { describe, it, expect } from "vitest"
import { buildThreatField, solveMixedNash, DEFAULT_ATTACKER, DEFAULT_DEFENDER, DEFAULT_PAYOFF, analyzeFourier, runMonteCarlo, DEFAULT_ZONES } from "@/lib/offsec/threat-engine"

describe("threat-engine", () => {
  it("solves a mixed Nash without NaN and sums ~1", () => {
    const n = solveMixedNash(DEFAULT_PAYOFF, DEFAULT_ATTACKER, DEFAULT_DEFENDER, 2000)
    const aSum = Object.values(n.attackerMixed).reduce((x, y) => x + y, 0)
    const dSum = Object.values(n.defenderMixed).reduce((x, y) => x + y, 0)
    expect(aSum).toBeGreaterThan(0.99)
    expect(aSum).toBeLessThan(1.01)
    expect(dSum).toBeGreaterThan(0.99)
    expect(Number.isFinite(n.value)).toBe(true)
  })

  it("Fourier finds peaks on a synthetic series", () => {
    const events = Array.from({ length: 64 }, (_, i) => ({
      t: i,
      zoneId: "dmz",
      weight: Math.sin((2 * Math.PI * i) / 8) + 1,
    }))
    const f = analyzeFourier(events, 64)
    expect(f.peaks.length).toBeGreaterThan(0)
    expect(f.note.toLowerCase()).toContain("modeled")
  })

  it("Monte-Carlo is seeded / reproducible", () => {
    const a = runMonteCarlo(DEFAULT_ZONES, { trials: 100, seed: 42, horizon: 20 })
    const b = runMonteCarlo(DEFAULT_ZONES, { trials: 100, seed: 42, horizon: 20 })
    expect(a.zones.map((z) => z.pCompromise)).toEqual(b.zones.map((z) => z.pCompromise))
  })

  it("buildThreatField disclaimer forbids certainty language", () => {
    const r = buildThreatField({ trials: 50, seed: 1 })
    expect(r.disclaimer.toLowerCase()).toMatch(/never a guarantee|modeled only/)
    expect(r.field.length).toBeGreaterThan(0)
  })
})
