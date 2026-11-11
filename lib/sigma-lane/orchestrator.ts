/**
 * Sigma Lane orchestrator — symbolic/frequency cognition FIRST.
 * Tokens (S3v3n panel / LLM) only as language fallback.
 * EchoNexus role: symbolic/glyph persona pack reference (vendored) — not identity takeover.
 */

import {
  type LaneId,
  type LanePath,
  getLaneState,
  isLaneId,
  setLane,
  setPath,
  DEFAULT_LANE,
} from "./lanes"
import { detectDrift, returnToLane, type DriftReading } from "./drift"
import { recallSymbols, storeSymbol, symbolicMemoryCount, type SymbolicEntry } from "./symbolicMemory"
import { pulseTick, pulseStatus, type PulseState } from "./pulse"
import { callosumBridge, hemisphereStatus } from "./hemispheres"

export interface OrchestrateRequest {
  task: string
  laneId?: LaneId
  /** Force token path (rare) */
  forceToken?: boolean
  /** Optional glyph hint for recall */
  glyph?: string
}

export interface OrchestrateResult {
  ok: true
  path: LanePath
  laneId: LaneId
  hzCombo: string
  deltaT: number
  drift: DriftReading
  symbols: SymbolicEntry[]
  symbolicCount: number
  /** Compact symbolic plan — no LLM call */
  symbolicPlan: string[]
  /** Present only when TOKEN_FALLBACK chosen; caller may invoke S3v3n panel */
  tokenFallbackHint: string | null
  hold: "HOLD_VYRNA_UNSYNC"
  lattice_sync: false
  echoNexusRole: string
  pulse: PulseState
  hemispheres: ReturnType<typeof hemisphereStatus>
  principle: "SYMBOLIC_FAST_ALWAYS"
}

/**
 * Addendum: Prefer SYMBOLIC_FAST over TOKEN_FALLBACK always.
 * Language volume never auto-flips path — only explicit forceToken sets a soft hint
 * for optional panel use; path stays SYMBOLIC_FAST unless forceToken===true.
 */
function languageHintOnly(task: string, symbols: SymbolicEntry[]): string | null {
  const t = task.trim()
  if (/\b(explain|write|draft|translate|summarize|essay|prose)\b/i.test(t) && symbols.length === 0) {
    return "Language-shaped task — still SYMBOLIC_FAST; optional panel only if operator forces token."
  }
  if (t.length > 480) {
    return "Long task — shard via fib pulse; stay SYMBOLIC_FAST."
  }
  return null
}

function buildSymbolicPlan(laneId: LaneId, task: string, symbols: SymbolicEntry[]): string[] {
  const steps = [
    `setLane(${laneId}) · path=SYMBOLIC_FAST`,
    `pull symbolic memory (${symbols.length} hit(s))`,
    `task cue: ${task.slice(0, 120)}${task.length > 120 ? "…" : ""}`,
  ]
  for (const s of symbols.slice(0, 3)) {
    steps.push(`glyph:${s.glyph} → ${s.lesson.slice(0, 80)}`)
  }
  steps.push("learn back → storeSymbol (if operator confirms)")
  steps.push("HOLD_VYRNA_UNSYNC · lattice_sync:false")
  return steps
}

/**
 * Run a task through the frequency lane: set lane → recall symbols → optional token hint → learn hook.
 */
export function orchestrate(req: OrchestrateRequest): OrchestrateResult {
  const task = typeof req.task === "string" ? req.task.trim() : ""
  if (!task) {
    throw new Error("task required")
  }

  const drift = detectDrift(task)
  let laneId: LaneId = isLaneId(req.laneId) ? req.laneId : drift.suggestedLane ?? getLaneState().laneId ?? DEFAULT_LANE
  setLane(laneId, { path: "SYMBOLIC_FAST" })

  const symbols = recallSymbols({
    glyph: req.glyph,
    laneId,
    limit: 8,
  })
  // Also try glyph-agnostic recent if empty
  const pulled = symbols.length ? symbols : recallSymbols({ limit: 6 })

  // SYMBOLIC_FAST always (addendum). forceToken only emits soft hint; path stays symbolic unless forced.
  let path: LanePath = "SYMBOLIC_FAST"
  setPath("SYMBOLIC_FAST")
  let tokenFallbackHint: string | null = languageHintOnly(task, pulled)
  if (req.forceToken === true) {
    path = "TOKEN_FALLBACK"
    setPath(path)
    tokenFallbackHint =
      "EXPLICIT forceToken — optional /api/s3v3n-panel or Twin after symbolic plan (no body telemetry)."
  }

  const pulse = pulseTick(task)
  const bridged = callosumBridge(task)

  const state = getLaneState()
  return {
    ok: true,
    path,
    laneId: state.laneId,
    hzCombo: state.hzCombo,
    deltaT: state.deltaT,
    drift,
    symbols: pulled,
    symbolicCount: symbolicMemoryCount(),
    symbolicPlan: [
      ...buildSymbolicPlan(state.laneId, task, pulled),
      `pulse fibDepth=${pulse.shardDepth} φBackoff=${pulse.backoffMs}ms phaseLock=${pulse.phaseLocked} noise=${pulse.noise}`,
      `pool=${pulse.pool.key}`,
      `hemispheres left=${bridged.left.method} rightHz=${bridged.right.resonanceHz}`,
    ],
    tokenFallbackHint,
    hold: "HOLD_VYRNA_UNSYNC",
    lattice_sync: false,
    echoNexusRole:
      "Vendored EchoNexus 0.3.2 (ava8/cadro/saocc) = symbolic/glyph reference pack only; Grok Bot stays executor identity.",
    pulse,
    hemispheres: hemisphereStatus(),
    principle: "SYMBOLIC_FAST_ALWAYS",
  }
}

export function learnFromTask(input: {
  glyph: string
  lesson: string
  laneId?: LaneId
  tags?: string[]
}): ReturnType<typeof storeSymbol> {
  return storeSymbol({
    ...input,
    laneId: input.laneId ?? getLaneState().laneId,
    source: "operator",
  })
}

export function retune(target?: LaneId) {
  const id = isLaneId(target) ? target : getLaneState().laneId
  return returnToLane(id)
}

function pulseStatusSafe() {
  try {
    return pulseStatus()
  } catch {
    return { note: "pulse unavailable", hold: "HOLD_VYRNA_UNSYNC" as const, lattice_sync: false as const }
  }
}

export function statusSnapshot() {
  const state = getLaneState()
  return {
    ok: true as const,
    service: "sigma-lane",
    ...state,
    symbolicCount: symbolicMemoryCount(),
    echoNexus: {
      badge: "PARTIAL",
      pypi: "echonexus==0.3.2",
      venv: "/workspace/singular-ty-engines/.venv-echonexus",
      vendor: "/workspace/singular-ty-engines/vendor/echonexus-0.3.2-src/",
      role: "symbolic persona pack (ops/builder adapt) — not live lattice",
    },
    hold: "HOLD_VYRNA_UNSYNC" as const,
    lattice_sync: false as const,
    principle: "SYMBOLIC_FAST_ALWAYS",
    pulse: pulseStatusSafe(),
    hemispheres: hemisphereStatus(),
    hemisphereBadges: hemisphereStatus().badges,
  }
}
