/**
 * Monte-Carlo probability field over network zones.
 * Inspired by hive-lab-sim contagion ideas (abstract zones, seeded trials),
 * rewritten in TypeScript for the hub. MODEL OUTPUT only.
 */

import type { MonteCarloResult, NetworkZone, ZoneProbability } from "./types"

/** Mulberry32 — deterministic PRNG from a 32-bit seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const DEFAULT_ZONES: NetworkZone[] = [
  { id: "dmz", label: "DMZ", x: 0.15, y: 0.5, z: 0.2, exposure: 0.85, defense: 0.45 },
  { id: "web", label: "Web tier", x: 0.35, y: 0.35, z: 0.35, exposure: 0.7, defense: 0.55 },
  { id: "app", label: "App tier", x: 0.55, y: 0.45, z: 0.4, exposure: 0.45, defense: 0.6 },
  { id: "db", label: "Data tier", x: 0.75, y: 0.55, z: 0.35, exposure: 0.25, defense: 0.75 },
  { id: "ot", label: "OT / ICS", x: 0.7, y: 0.2, z: 0.7, exposure: 0.35, defense: 0.4 },
  { id: "user", label: "User LAN", x: 0.4, y: 0.75, z: 0.5, exposure: 0.6, defense: 0.35 },
  { id: "cloud", label: "Cloud SaaS", x: 0.2, y: 0.25, z: 0.65, exposure: 0.55, defense: 0.5 },
  { id: "mgmt", label: "Mgmt jump", x: 0.85, y: 0.35, z: 0.55, exposure: 0.3, defense: 0.8 },
]

/**
 * Per-zone Bernoulli/contagion trial:
 * each tick, P(compromise) ~= exposure * (1 - defense) * pressure,
 * P(detect | compromised) ~= defense * 0.4 + 0.05.
 */
export function runMonteCarlo(
  zones: NetworkZone[],
  opts: { trials?: number; horizon?: number; seed?: number; pressure?: number } = {},
): MonteCarloResult {
  const trials = Math.min(Math.max(opts.trials ?? 800, 50), 5000)
  const horizon = Math.min(Math.max(opts.horizon ?? 48, 5), 500)
  const seed = opts.seed ?? 20261111
  const pressure = opts.pressure ?? 0.08
  const rng = mulberry32(seed)

  const acc = new Map<
    string,
    { compromised: number; detected: number; sumTicks: number; hitTicks: number }
  >()
  for (const z of zones) acc.set(z.id, { compromised: 0, detected: 0, sumTicks: 0, hitTicks: 0 })

  for (let t = 0; t < trials; t++) {
    for (const z of zones) {
      let compromised = false
      let detected = false
      let tickHit: number | null = null
      const pLand = Math.min(0.85, Math.max(0.001, z.exposure * (1 - z.defense * 0.7) * pressure))
      const pDet = Math.min(0.95, Math.max(0.02, z.defense * 0.45 + 0.05))
      for (let tick = 1; tick <= horizon; tick++) {
        if (!compromised && rng() < pLand) {
          compromised = true
          tickHit = tick
        }
        if (compromised && !detected && rng() < pDet) {
          detected = true
        }
        if (compromised && detected) break
      }
      const a = acc.get(z.id)!
      if (compromised) {
        a.compromised += 1
        if (tickHit != null) {
          a.sumTicks += tickHit
          a.hitTicks += 1
        }
      }
      if (detected) a.detected += 1
    }
  }

  const out: ZoneProbability[] = zones.map((z) => {
    const a = acc.get(z.id)!
    return {
      zoneId: z.id,
      pCompromise: Number((a.compromised / trials).toFixed(4)),
      pDetected: Number((a.detected / trials).toFixed(4)),
      meanTicksToCompromise: a.hitTicks ? Number((a.sumTicks / a.hitTicks).toFixed(2)) : null,
      trials,
    }
  })

  return {
    trials,
    horizon,
    seed,
    zones: out,
    note: "Seeded Monte-Carlo estimates of per-zone compromise/detection under abstract exposure×defense×pressure assumptions. Model output — not a live risk score.",
  }
}
