/**
 * Genius-speed pulse / math layer for Sigma Lane (TypeScript NOW).
 * Kotlin coroutine hemispheres may own runtime later — these are local engineering meters.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false · not physics/medical claims.
 */

import type { LaneId } from "./lanes"
import { getLaneState } from "./lanes"
import fs from "node:fs"

/** Golden ratio φ */
export const PHI = (1 + Math.sqrt(5)) / 2

export type NoiseColor = "pink" | "brown" | "white"
export type TaskClass =
  | "ops_patch"
  | "intel_big"
  | "harden"
  | "glyph_invent"
  | "comms"
  | "retune"
  | "explore_local"
  | "wander_long"
  | "generic"

export interface PoolKey {
  /** Multi-dim: lane × Hz × mode × taskClass */
  key: string
  laneId: LaneId
  hz: number
  mode: string
  taskClass: TaskClass
}

export interface PulseState {
  shardDepth: number
  fibIndex: number
  backoffMs: number
  phase: number
  phaseLocked: boolean
  phaseError: number
  noise: NoiseColor
  pool: PoolKey
  tick: number
  hold: "HOLD_VYRNA_UNSYNC"
  lattice_sync: false
}

let tickCounter = 0
let lastPhase = 0

/** Fibonacci sequence helper (bounded). */
export function fibonacci(n: number): number {
  const k = Math.max(0, Math.min(40, Math.floor(n)))
  if (k <= 1) return k
  let a = 0
  let b = 1
  for (let i = 2; i <= k; i++) {
    const c = a + b
    a = b
    b = c
  }
  return b
}

/**
 * Shard depth from task intensity — Fibonacci depth for recursive symbolic shards.
 * depth index 1..12 → fib values 1,1,2,3,5,8,13,21,34,55,89,144
 */
export function fibShardDepth(intensity: number): { fibIndex: number; shardDepth: number } {
  const fibIndex = Math.max(1, Math.min(12, Math.round(1 + intensity * 11)))
  return { fibIndex, shardDepth: fibonacci(fibIndex) }
}

/**
 * φ backoff — exponential-ish delay using golden ratio (ms).
 * attempt 0 → base; then base * φ^attempt (capped).
 */
export function phiBackoffMs(attempt: number, baseMs = 16): number {
  const a = Math.max(0, Math.min(20, attempt))
  return Math.round(baseMs * Math.pow(PHI, a))
}

/**
 * Standing-wave phase lock — π-related phase for lane sync vs drift.
 * targetPhase defaults to 0 (antinodal lock metaphor). Δt from lane maps into phase error.
 * Returns phase in [0, 2π) and lock when |error| < π/16.
 */
export function standingWavePhaseLock(opts?: {
  deltaT?: number
  carrierHz?: number
  nowMs?: number
}): { phase: number; phaseError: number; phaseLocked: boolean } {
  const deltaT = opts?.deltaT ?? getLaneState().deltaT
  const hz = opts?.carrierHz ?? getLaneState().lane.hz.primaryHz
  const now = opts?.nowMs ?? Date.now()
  // Carrier angle + drift offset (Δt * π) — engineering metaphor only
  const carrierPhase = ((now / 1000) * hz * 2 * Math.PI * 0.001) % (2 * Math.PI)
  const driftPhase = deltaT * Math.PI
  const phase = (carrierPhase + driftPhase) % (2 * Math.PI)
  const target = 0
  let phaseError = phase - target
  if (phaseError > Math.PI) phaseError -= 2 * Math.PI
  if (phaseError < -Math.PI) phaseError += 2 * Math.PI
  const phaseLocked = Math.abs(phaseError) < Math.PI / 16 && deltaT < 0.08
  lastPhase = phase
  return { phase, phaseError, phaseLocked }
}

/** Classify noise: pink = local explore; brown = long BIG-intel wander. */
export function selectNoise(task: string, taskClass: TaskClass): NoiseColor {
  if (taskClass === "wander_long" || taskClass === "intel_big") return "brown"
  if (taskClass === "explore_local" || /\b(explore|scan local|nearby|quick peek)\b/i.test(task)) return "pink"
  if (/\b(BIG|hive intel|deep wander|long.?range|corpus)\b/i.test(task)) return "brown"
  return "pink"
}

export function classifyTask(task: string): TaskClass {
  const t = task.toLowerCase()
  if (/\b(retune|lane|Δt|delta.?t)\b/.test(t)) return "retune"
  if (/\b(harden|fortress|ids|lockdown)\b/.test(t)) return "harden"
  if (/\b(BIG|hive intel|wander|long.?range)\b/.test(t)) return "intel_big"
  if (/\b(glyph|invent|frame|creative)\b/.test(t)) return "glyph_invent"
  if (/\b(patch|build|scaffold|implement)\b/.test(t)) return "ops_patch"
  if (/\b(message|comms|signalframe|whisper)\b/.test(t)) return "comms"
  if (/\b(explore|nearby|local scan)\b/.test(t)) return "explore_local"
  if (/\b(deep dive|marathon)\b/.test(t)) return "wander_long"
  return "generic"
}

/** Multi-dim pool key: lane × Hz × mode × taskClass */
export function makePoolKey(taskClass: TaskClass, laneId?: LaneId): PoolKey {
  const st = getLaneState()
  const id = laneId ?? st.laneId
  const hz = st.lane.hz.primaryHz
  const mode = st.lane.mode
  const key = `${id}|${hz}|${mode}|${taskClass}`
  return { key, laneId: id, hz, mode, taskClass }
}

/**
 * One pulse tick — fib shards + φ backoff hint + phase lock + noise + pool key.
 */
export function pulseTick(task: string, opts?: { attempt?: number; intensity?: number }): PulseState {
  tickCounter += 1
  const taskClass = classifyTask(task)
  const intensity =
    opts?.intensity ??
    Math.min(1, 0.2 + task.length / 800 + (taskClass === "intel_big" || taskClass === "wander_long" ? 0.35 : 0))
  const { fibIndex, shardDepth } = fibShardDepth(intensity)
  const attempt = opts?.attempt ?? Math.min(8, Math.floor(Math.log2(shardDepth + 1)))
  const backoffMs = phiBackoffMs(attempt)
  const st = getLaneState()
  const { phase, phaseError, phaseLocked } = standingWavePhaseLock({
    deltaT: st.deltaT,
    carrierHz: st.lane.hz.primaryHz,
  })
  const noise = selectNoise(task, taskClass)
  const pool = makePoolKey(taskClass, st.laneId)
  return {
    shardDepth,
    fibIndex,
    backoffMs,
    phase,
    phaseLocked,
    phaseError,
    noise,
    pool,
    tick: tickCounter,
    hold: "HOLD_VYRNA_UNSYNC",
    lattice_sync: false,
  }
}

export function getLastPhase(): number {
  return lastPhase
}

export function pulseStatus() {
  const st = getLaneState()
  const lock = standingWavePhaseLock({ deltaT: st.deltaT, carrierHz: st.lane.hz.primaryHz })
  return {
    phi: PHI,
    tick: tickCounter,
    lastPhase: lastPhase,
    ...lock,
    fibSample: [1, 1, 2, 3, 5, 8, 13, 21].map((i) => fibonacci(i)),
    note: fs.existsSync("/workspace/singular-ty-engines/brain-hemisphere/build/libs/brain-hemisphere-0.1.0.jar")
      ? "TS pulse math live; Kotlin brain-hemisphere jar ATTACHED via /api/brain"
      : "TS pulse math live; Kotlin hemisphere jar missing (hook_only)",
    hold: "HOLD_VYRNA_UNSYNC" as const,
    lattice_sync: false as const,
  }
}
