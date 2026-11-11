/**
 * Emotional / task drift detection from Dev Operator text cues.
 * Engineering meters only — not clinical affect sensing.
 * returnToLane(target) resets conscious state (Δt = 0).
 */

import {
  type LaneId,
  bumpDeltaT,
  getLaneState,
  neutralizeDeltaT,
  setLane,
  isLaneId,
} from "./lanes"

export type DriftSeverity = "none" | "low" | "medium" | "high"

export interface DriftCueHit {
  cue: string
  weight: number
  suggestsLane?: LaneId
}

export interface DriftReading {
  score: number
  severity: DriftSeverity
  deltaT: number
  hits: DriftCueHit[]
  suggestedLane: LaneId | null
  note: string
  neutralized: boolean
}

/** Text cues → task/emotional drift (ops language). No body telemetry stored. */
const CUE_TABLE: Array<{ re: RegExp; weight: number; suggestsLane?: LaneId; cue: string }> = [
  { re: /\b(overwhelm|panick?ing|spiral|burnout|exhausted)\b/i, weight: 0.35, suggestsLane: "empathy", cue: "overwhelm" },
  { re: /\b(distract|scatter|unfocus|ADHD|rabbit.?hole)\b/i, weight: 0.28, suggestsLane: "focus", cue: "scatter" },
  { re: /\b(angry|rage|hostile|attack|revenge)\b/i, weight: 0.32, suggestsLane: "defense", cue: "hostility" },
  { re: /\b(lost|confused|stuck|block(ed)?|don't know)\b/i, weight: 0.22, suggestsLane: "crown", cue: "stuck" },
  { re: /\b(tighten|lock.?down|harden|fortress|ids)\b/i, weight: 0.12, suggestsLane: "defense", cue: "harden-intent" },
  { re: /\b(ship|build|patch|scaffold|implement)\b/i, weight: 0.08, suggestsLane: "build", cue: "build-intent" },
  { re: /\b(create|invent|glyph|frame|design)\b/i, weight: 0.08, suggestsLane: "creative", cue: "create-intent" },
  { re: /\b(drift|noise|glitch|unstable|desync)\b/i, weight: 0.3, cue: "signal-drift" },
  { re: /\b(therapy|diagnose.?me|medical)\b/i, weight: 0.25, suggestsLane: "focus", cue: "soft-frame-reject" },
]

export function detectDrift(text: string): DriftReading {
  const hits: DriftCueHit[] = []
  let score = 0
  const laneVotes: Partial<Record<LaneId, number>> = {}

  for (const row of CUE_TABLE) {
    if (row.re.test(text)) {
      hits.push({ cue: row.cue, weight: row.weight, suggestsLane: row.suggestsLane })
      score += row.weight
      if (row.suggestsLane) {
        laneVotes[row.suggestsLane] = (laneVotes[row.suggestsLane] ?? 0) + row.weight
      }
    }
  }

  score = Math.min(1, score)
  // Intent cues alone shouldn't spike Δt; noise/affect cues do
  const affectHits = hits.filter((h) =>
    ["overwhelm", "scatter", "hostility", "stuck", "signal-drift", "soft-frame-reject"].includes(h.cue),
  )
  const deltaBump = affectHits.reduce((s, h) => s + h.weight * 0.5, 0)
  if (deltaBump > 0) bumpDeltaT(Math.min(0.4, deltaBump))

  const state = getLaneState()
  let suggestedLane: LaneId | null = null
  let best = 0
  for (const [id, w] of Object.entries(laneVotes)) {
    if ((w ?? 0) > best) {
      best = w ?? 0
      suggestedLane = id as LaneId
    }
  }

  const severity: DriftSeverity =
    state.deltaT >= 0.7 || score >= 0.7
      ? "high"
      : state.deltaT >= 0.4 || score >= 0.4
        ? "medium"
        : state.deltaT > 0.05 || score > 0.1
          ? "low"
          : "none"

  return {
    score,
    severity,
    deltaT: state.deltaT,
    hits,
    suggestedLane,
    note:
      severity === "none"
        ? "Lane coherent · Δt≈0"
        : `Drift ${severity} · prefer returnToLane(${suggestedLane ?? state.laneId})`,
    neutralized: state.deltaT === 0,
  }
}

/**
 * Reset conscious / lane state to target. Explicit neutralize (Δt = 0).
 */
export function returnToLane(target: LaneId): {
  ok: true
  laneId: LaneId
  deltaT: 0
  path: "SYMBOLIC_FAST"
  hold: "HOLD_VYRNA_UNSYNC"
  lattice_sync: false
} {
  if (!isLaneId(target)) {
    throw new Error(`Unknown lane target: ${target}`)
  }
  setLane(target, { path: "SYMBOLIC_FAST" })
  neutralizeDeltaT()
  return {
    ok: true,
    laneId: target,
    deltaT: 0,
    path: "SYMBOLIC_FAST",
    hold: "HOLD_VYRNA_UNSYNC",
    lattice_sync: false,
  }
}

export function driftMeter(): { deltaT: number; coherence: number; severity: DriftSeverity } {
  const s = getLaneState()
  const severity: DriftSeverity =
    s.deltaT >= 0.7 ? "high" : s.deltaT >= 0.4 ? "medium" : s.deltaT > 0.05 ? "low" : "none"
  return { deltaT: s.deltaT, coherence: s.coherence, severity }
}
