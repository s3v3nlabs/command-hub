/**
 * Threat-field engine types.
 *
 * All outputs are MODEL RESULTS under stated assumptions — not measurements,
 * predictions of certainty, or operational lock-ons. Language in the UI must
 * stay honest: preferred / estimated / modeled. Never "guaranteed", "lock",
 * or "certain".
 */

export type ZoneId = string

export interface NetworkZone {
  id: ZoneId
  label: string
  /** Logical coordinates in a unit cube for viz (0..1). */
  x: number
  y: number
  z: number
  /** Relative attractiveness / exposure weight (0..1). */
  exposure: number
  /** Relative defensive coverage (0..1). */
  defense: number
}

export interface AttackEvent {
  /** Epoch ms or arbitrary tick index. */
  t: number
  zoneId: ZoneId
  /** Intensity / count weight. */
  weight?: number
}

export interface NashAction {
  id: string
  label: string
}

export interface NashResult {
  attackerMixed: Record<string, number>
  defenderMixed: Record<string, number>
  /** Modeled value of the game to the row player (attacker). */
  value: number
  iterations: number
  note: string
}

export interface FourierPeak {
  frequency: number
  magnitude: number
  periodHint?: number
}

export interface FourierResult {
  sampleCount: number
  peaks: FourierPeak[]
  spectrum: Array<{ frequency: number; magnitude: number }>
  note: string
}

export interface ZoneProbability {
  zoneId: ZoneId
  /** Modeled compromise probability under the stated Monte-Carlo assumptions. */
  pCompromise: number
  /** Modeled detection probability by horizon. */
  pDetected: number
  meanTicksToCompromise: number | null
  trials: number
}

export interface MonteCarloResult {
  trials: number
  horizon: number
  seed: number
  zones: ZoneProbability[]
  note: string
}

export interface ThreatFieldPoint {
  zoneId: ZoneId
  label: string
  x: number
  y: number
  z: number
  /** Combined modeled threat intensity 0..1 (NOT a guarantee). */
  intensity: number
  pCompromise: number
  pDetected: number
  exposure: number
  defense: number
  nashAttackerWeight?: number
}

export interface ThreatFieldReport {
  generatedAt: string
  assumptions: string[]
  nash: NashResult
  fourier: FourierResult
  monteCarlo: MonteCarloResult
  field: ThreatFieldPoint[]
  disclaimer: string
}

export interface ThreatFieldInput {
  zones?: NetworkZone[]
  events?: AttackEvent[]
  /** Attacker action labels (rows). */
  attackerActions?: NashAction[]
  /** Defender action labels (cols). */
  defenderActions?: NashAction[]
  /** Payoff matrix attacker-rows x defender-cols. Higher = better for attacker. */
  payoff?: number[][]
  trials?: number
  horizon?: number
  seed?: number
}
