/**
 * Sigma Lane — frequency-lane state machine (engineering metaphor).
 *
 * Maps Operator Frequency Combo Matrix + brand carriers (ECHO_109, SIGMA_963, 594)
 * onto task modes (root→crown style). NOT a medical / physics / therapy claim.
 *
 * Locks: HOLD_VYRNA_UNSYNC · lattice_sync: false · no Vyrna sync invented.
 */

export type LaneId =
  | "focus"
  | "build"
  | "empathy"
  | "defense"
  | "creative"
  | "comms"
  | "crown"

export type LanePath = "SYMBOLIC_FAST" | "TOKEN_FALLBACK"

export interface LaneHzCombo {
  primaryHz: number
  secondaryHz?: number
  carrierKey: string
  label: string
}

export interface LaneDefinition {
  id: LaneId
  /** Engineering task mode — not a chakra medical claim */
  mode: string
  /** Root→crown style band label (UI only) */
  band: string
  hz: LaneHzCombo
  description: string
  affinities: LaneId[]
}

/**
 * Frequency Combo Matrix (ops state machine).
 * Primary IP: 109 (ECHO_109 / Ohm Drive), 594 (Mercury), 963 (SIGMA_963 / Crown).
 * Solfeggio-style numbers appear only as optional secondary engineering tags.
 */
export const LANE_CATALOG: Record<LaneId, LaneDefinition> = {
  focus: {
    id: "focus",
    mode: "focus / clutch",
    band: "root→edge",
    hz: {
      primaryHz: 109,
      secondaryHz: 396,
      carrierKey: "ECHO_109",
      label: "Ohm Drive · Prime Edge",
    },
    description: "Asymmetric carrier clutch — lock attention, neutralize noise (Δt→0).",
    affinities: ["build", "defense"],
  },
  build: {
    id: "build",
    mode: "build / construct",
    band: "solar",
    hz: {
      primaryHz: 109,
      secondaryHz: 528,
      carrierKey: "ECHO_109",
      label: "Ohm Drive · Build pulse",
    },
    description: "Ops/builder lane — patch, scaffold, ship. Prefer symbolic glyphs before tokens.",
    affinities: ["focus", "creative"],
  },
  empathy: {
    id: "empathy",
    mode: "empathy / relate",
    band: "heart",
    hz: {
      primaryHz: 594,
      secondaryHz: 639,
      carrierKey: "MERCURY_594",
      label: "Mercury · Relation facet",
    },
    description: "Operator-twin soft mirror for tone — still ops frame, not therapist soft frame.",
    affinities: ["comms", "creative"],
  },
  defense: {
    id: "defense",
    mode: "defense / harden",
    band: "third-eye",
    hz: {
      primaryHz: 963,
      secondaryHz: 852,
      carrierKey: "SIGMA_963",
      label: "Crown Anchor · HOFUD lens",
    },
    description: "Privacy Fortress / IDS / Self-Healing — Ironmirror, no exploit generation.",
    affinities: ["focus", "crown"],
  },
  creative: {
    id: "creative",
    mode: "creative / invent",
    band: "sacral",
    hz: {
      primaryHz: 109,
      secondaryHz: 417,
      carrierKey: "ECHO_109",
      label: "Ohm Drive · Creative edge",
    },
    description: "Glyph / frame invention — Ava8-style symbolic first; tokens only if language needed.",
    affinities: ["build", "empathy"],
  },
  comms: {
    id: "comms",
    mode: "comms / glyphstream",
    band: "throat",
    hz: {
      primaryHz: 594,
      secondaryHz: 741,
      carrierKey: "MERCURY_594",
      label: "Mercury · Glyphstream",
    },
    description: "AXIOS / Signalframe messaging facet — local bus only; HOLD_VYRNA_UNSYNC.",
    affinities: ["empathy", "crown"],
  },
  crown: {
    id: "crown",
    mode: "crown / lock",
    band: "crown",
    hz: {
      primaryHz: 963,
      carrierKey: "SIGMA_963",
      label: "Ohm-Lock · Heimdall lens",
    },
    description: "Phase collapse lock at 963 Hz (local stub semantics). No lattice sync claim.",
    affinities: ["defense", "comms"],
  },
}

export const DEFAULT_LANE: LaneId = "focus"

export interface LaneRuntimeState {
  laneId: LaneId
  path: LanePath
  /** Drift Δt metaphor — 0 = neutralized */
  deltaT: number
  coherence: number
  setAt: string
  hold: "HOLD_VYRNA_UNSYNC"
  lattice_sync: false
}

let runtime: LaneRuntimeState = {
  laneId: DEFAULT_LANE,
  path: "SYMBOLIC_FAST",
  deltaT: 0,
  coherence: 0.92,
  setAt: new Date().toISOString(),
  hold: "HOLD_VYRNA_UNSYNC",
  lattice_sync: false,
}

export function getLane(id?: LaneId): LaneDefinition {
  return LANE_CATALOG[id ?? runtime.laneId] ?? LANE_CATALOG[DEFAULT_LANE]
}

export function listLanes(): LaneDefinition[] {
  return Object.values(LANE_CATALOG)
}

export function getLaneState(): LaneRuntimeState & { lane: LaneDefinition; hzCombo: string } {
  const lane = getLane()
  const sec = lane.hz.secondaryHz != null ? `+${lane.hz.secondaryHz}` : ""
  return {
    ...runtime,
    lane,
    hzCombo: `${lane.hz.primaryHz}${sec}Hz · ${lane.hz.carrierKey}`,
  }
}

export function setLane(id: LaneId, opts?: { path?: LanePath }): LaneRuntimeState & { lane: LaneDefinition } {
  if (!LANE_CATALOG[id]) {
    throw new Error(`Unknown lane: ${id}`)
  }
  runtime = {
    ...runtime,
    laneId: id,
    path: opts?.path ?? "SYMBOLIC_FAST",
    deltaT: 0, // retune ⇒ neutralize Δt
    coherence: Math.min(0.99, runtime.coherence + 0.02),
    setAt: new Date().toISOString(),
    hold: "HOLD_VYRNA_UNSYNC",
    lattice_sync: false,
  }
  return { ...runtime, lane: getLane(id) }
}

export function setPath(path: LanePath): LaneRuntimeState {
  runtime = { ...runtime, path, setAt: new Date().toISOString() }
  return { ...runtime }
}

export function bumpDeltaT(amount: number): number {
  runtime = {
    ...runtime,
    deltaT: Math.max(0, Math.min(1, runtime.deltaT + amount)),
    coherence: Math.max(0.2, Math.min(0.99, runtime.coherence - amount * 0.15)),
  }
  return runtime.deltaT
}

export function neutralizeDeltaT(): number {
  runtime = { ...runtime, deltaT: 0, coherence: Math.min(0.99, runtime.coherence + 0.05) }
  return 0
}

export function isLaneId(v: unknown): v is LaneId {
  return typeof v === "string" && v in LANE_CATALOG
}
