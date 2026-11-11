import type {
  AttackEvent,
  NetworkZone,
  ThreatFieldInput,
  ThreatFieldPoint,
  ThreatFieldReport,
} from "./types"
import {
  DEFAULT_ATTACKER,
  DEFAULT_DEFENDER,
  DEFAULT_PAYOFF,
  solveMixedNash,
} from "./nash"
import { analyzeFourier } from "./fourier"
import { DEFAULT_ZONES, runMonteCarlo } from "./montecarlo"

export function defaultEvents(zones: NetworkZone[]): AttackEvent[] {
  // Synthetic illustrative series so the Fourier panel is never empty on first load.
  const events: AttackEvent[] = []
  let t = 0
  for (let day = 0; day < 30; day++) {
    for (const z of zones) {
      const burst = day % 7 === 0 || day % 5 === 0
      const n = burst ? 2 + Math.floor(z.exposure * 3) : Math.floor(z.exposure)
      for (let k = 0; k < n; k++) {
        events.push({ t: t + k * 0.1, zoneId: z.id, weight: 1 + z.exposure })
      }
    }
    t += 1
  }
  return events
}

export function buildThreatField(input: ThreatFieldInput = {}): ThreatFieldReport {
  const zones = input.zones?.length ? input.zones : DEFAULT_ZONES
  const events = input.events?.length ? input.events : defaultEvents(zones)
  const attacker = input.attackerActions?.length ? input.attackerActions : DEFAULT_ATTACKER
  const defender = input.defenderActions?.length ? input.defenderActions : DEFAULT_DEFENDER
  const payoff = input.payoff?.length ? input.payoff : DEFAULT_PAYOFF

  const nash = solveMixedNash(payoff, attacker, defender)
  const fourier = analyzeFourier(events)
  const monteCarlo = runMonteCarlo(zones, {
    trials: input.trials,
    horizon: input.horizon,
    seed: input.seed,
  })

  // Map attacker mixed weights onto zones by crude label affinity for viz weighting.
  const attackWeightFor = (z: NetworkZone): number => {
    const m = nash.attackerMixed
    if (z.id === "dmz" || z.id === "web" || z.id === "cloud") return m.exploit ?? m.recon ?? 0.25
    if (z.id === "user") return m.phish ?? 0.25
    if (z.id === "app" || z.id === "db" || z.id === "mgmt" || z.id === "ot") return m.lateral ?? 0.25
    return m.recon ?? 0.2
  }

  const byId = new Map(monteCarlo.zones.map((z) => [z.zoneId, z]))
  const field: ThreatFieldPoint[] = zones.map((z) => {
    const mc = byId.get(z.id)!
    const nashW = attackWeightFor(z)
    // Combine: compromise likelihood + residual undetected mass + nash pressure + exposure
    const undetected = mc.pCompromise * (1 - mc.pDetected)
    const intensity = Math.min(
      1,
      0.45 * mc.pCompromise + 0.25 * undetected + 0.2 * nashW + 0.1 * z.exposure,
    )
    return {
      zoneId: z.id,
      label: z.label,
      x: z.x,
      y: z.y,
      z: z.z,
      intensity: Number(intensity.toFixed(4)),
      pCompromise: mc.pCompromise,
      pDetected: mc.pDetected,
      exposure: z.exposure,
      defense: z.defense,
      nashAttackerWeight: Number(nashW.toFixed(4)),
    }
  })

  return {
    generatedAt: new Date().toISOString(),
    assumptions: [
      "Zones are abstract network segments with operator-supplied exposure/defense weights.",
      "Nash mixed strategies are computed from the supplied (or default illustrative) payoff matrix.",
      "Fourier peaks come from the supplied (or synthetic illustrative) attack time series.",
      "Monte-Carlo uses a seeded Bernoulli landing/detection model; 1 tick is a notional time unit.",
      "Combined intensity is a weighted blend for visualization — not a calibrated risk score.",
    ],
    nash,
    fourier,
    monteCarlo,
    field,
    disclaimer:
      "MODEL OUTPUT under stated assumptions. Preferred / estimated / modeled only — never a guarantee, lock, or certainty of real-world compromise.",
  }
}
