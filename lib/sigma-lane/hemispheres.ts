/**
 * Brain-hemisphere design hooks + badges.
 * Left  = object OO tasking
 * Right = conscious-field symbolic / resonance
 * Corpus callosum = bus between them
 * Kotlin coroutine runtime: attached when brain-hemisphere jar exists; else hook_only.
 * Engineering metaphor — NOT medical claim.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false
 */

import type { LaneId, LanePath } from "./lanes"
import { getLaneState } from "./lanes"
import type { PulseState, TaskClass, NoiseColor } from "./pulse"
import { pulseTick } from "./pulse"
import fs from "node:fs"
import { spawnSync } from "node:child_process"

const BRAIN_JAR_CANDIDATES = [
  process.env.BRAIN_HEMISPHERE_JAR?.trim(),
  "/workspace/singular-ty-engines/brain-hemisphere/build/libs/brain-hemisphere-0.1.0.jar",
].filter(Boolean) as string[]

/** True when Kotlin brain-hemisphere jar is on disk (API bridge can attach). */
export function kotlinJarPresent(): boolean {
  return BRAIN_JAR_CANDIDATES.some((c) => {
    try {
      return Boolean(c) && fs.existsSync(c)
    } catch {
      return false
    }
  })
}

export function resolveKotlinRuntime(): "hook_only" | "attached" {
  return kotlinJarPresent() ? "attached" : "hook_only"
}

/** Best-effort Kotlin pulse via jar stdin/stdout. Returns null on failure (keep TS pulse). */
export function kotlinPulseOnce(action = "status"): Record<string, unknown> | null {
  const jar = BRAIN_JAR_CANDIDATES.find((c) => {
    try {
      return fs.existsSync(c)
    } catch {
      return false
    }
  })
  if (!jar) return null
  try {
    const r = spawnSync("java", ["-jar", jar], {
      input: JSON.stringify({ action }) + "\n",
      encoding: "utf8",
      timeout: 4000,
      env: process.env,
    })
    const line = (r.stdout || "").trim().split("\n").filter(Boolean).pop()
    if (!line) return null
    return JSON.parse(line) as Record<string, unknown>
  } catch {
    return null
  }
}

export type HemisphereId = "left" | "right"

export type HemisphereBadge = {
  id: HemisphereId
  label: string
  meaning: string
  active: boolean
  weight: number
}

export type HemisphereSnapshot = {
  left: HemisphereBadge
  right: HemisphereBadge
  dominant: HemisphereId | "balanced"
  path: LanePath
  note: string
  hold: "HOLD_VYRNA_UNSYNC"
  lattice_sync: false
}

/** Infer hemisphere bias from task text + current path. */
export function resolveHemispheres(input?: {
  prompt?: string
  path?: LanePath
}): HemisphereSnapshot {
  const prompt = (input?.prompt || "").toLowerCase()
  const st = getLaneState()
  const path: LanePath = input?.path || st.path || "SYMBOLIC_FAST"

  const leftHits =
    (prompt.match(/\b(module|schema|type|interface|class|stub|api|route|patch|json|registry|manifest)\b/g) || [])
      .length
  const rightHits =
    (prompt.match(/\b(glyph|symbol|frequency|lane|harmonic|sigma|whisper|field|pulse|coherence|hz)\b/g) || [])
      .length

  let leftW = 0.45 + leftHits * 0.08
  let rightW = 0.45 + rightHits * 0.08

  if (path === "SYMBOLIC_FAST") rightW += 0.2
  if (path === "TOKEN_FALLBACK") leftW += 0.15

  if (st.laneId === "build" || st.laneId === "defense" || st.laneId === "focus") leftW += 0.1
  if (st.laneId === "creative" || st.laneId === "comms" || st.laneId === "empathy" || st.laneId === "crown") {
    rightW += 0.1
  }

  leftW = Math.min(1, leftW)
  rightW = Math.min(1, rightW)
  const dominant: HemisphereId | "balanced" =
    Math.abs(leftW - rightW) < 0.08 ? "balanced" : leftW > rightW ? "left" : "right"

  return {
    left: {
      id: "left",
      label: "LEFT · OO",
      meaning: "Object/structure lane — modules, schemas, typed ops, stubs",
      active: dominant === "left" || dominant === "balanced",
      weight: Number(leftW.toFixed(3)),
    },
    right: {
      id: "right",
      label: "RIGHT · FIELD",
      meaning: "Conscious-field symbolic — glyphs, frequency lane, harmonic recall",
      active: dominant === "right" || dominant === "balanced",
      weight: Number(rightW.toFixed(3)),
    },
    dominant,
    path,
    note: "Hemisphere badges are ops UI metaphors, not medical claims.",
    hold: "HOLD_VYRNA_UNSYNC",
    lattice_sync: false,
  }
}

export interface LeftOOTask {
  kind: "oo_task"
  taskClass: TaskClass
  method: string
  args: Record<string, unknown>
  priority: number
}

export interface RightFieldPulse {
  kind: "field_pulse"
  laneId: LaneId
  glyph?: string
  resonanceHz: number
  phase: number
  noise: NoiseColor
  symbolicHint: string
}

export type CallosumMessage =
  | { id: string; from: "left"; to: "right"; at: string; payload: LeftOOTask }
  | { id: string; from: "right"; to: "left"; at: string; payload: RightFieldPulse }

export interface HemisphereBusStatus {
  left: { role: string; queueDepth: number; lastMethod: string | null }
  right: { role: string; queueDepth: number; lastHz: number | null }
  callosum: { pending: number; lastId: string | null }
  badges: HemisphereSnapshot
  kotlinRuntime: "hook_only" | "attached"
  /** Real jar pulse when attached; null when hook_only or spawn failed. */
  kotlinPulse?: Record<string, unknown> | null
  path: LanePath
  hold: "HOLD_VYRNA_UNSYNC"
  lattice_sync: false
}

const leftQueue: LeftOOTask[] = []
const rightQueue: RightFieldPulse[] = []
const callosumLog: CallosumMessage[] = []
const MAX_BUS = 64

function msgId(): string {
  return `cc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

export function leftEnqueue(task: Omit<LeftOOTask, "kind">): LeftOOTask {
  const full: LeftOOTask = { kind: "oo_task", ...task }
  leftQueue.push(full)
  if (leftQueue.length > MAX_BUS) leftQueue.shift()
  callosumLog.push({
    id: msgId(),
    from: "left",
    to: "right",
    at: new Date().toISOString(),
    payload: full,
  })
  if (callosumLog.length > MAX_BUS) callosumLog.shift()
  return full
}

export function rightEnqueue(pulse: Omit<RightFieldPulse, "kind">): RightFieldPulse {
  const full: RightFieldPulse = { kind: "field_pulse", ...pulse }
  rightQueue.push(full)
  if (rightQueue.length > MAX_BUS) rightQueue.shift()
  callosumLog.push({
    id: msgId(),
    from: "right",
    to: "left",
    at: new Date().toISOString(),
    payload: full,
  })
  if (callosumLog.length > MAX_BUS) callosumLog.shift()
  return full
}

/** Corpus-callosum bridge — TS pulse live; Kotlin may replace executor later. */
export function callosumBridge(task: string): {
  pulse: PulseState
  left: LeftOOTask
  right: RightFieldPulse
  badges: HemisphereSnapshot
  path: "SYMBOLIC_FAST"
  kotlinHint: string
  hold: "HOLD_VYRNA_UNSYNC"
  lattice_sync: false
} {
  const pulse = pulseTick(task)
  const st = getLaneState()
  const left = leftEnqueue({
    taskClass: pulse.pool.taskClass,
    method: `task.${pulse.pool.taskClass}`,
    args: { poolKey: pulse.pool.key, shardDepth: pulse.shardDepth, backoffMs: pulse.backoffMs },
    priority: pulse.noise === "brown" ? 2 : 1,
  })
  const right = rightEnqueue({
    laneId: st.laneId,
    resonanceHz: st.lane.hz.primaryHz,
    phase: pulse.phase,
    noise: pulse.noise,
    symbolicHint: `phaseLock=${pulse.phaseLocked} fib=${pulse.shardDepth} noise=${pulse.noise}`,
  })
  return {
    pulse,
    left,
    right,
    badges: resolveHemispheres({ prompt: task, path: "SYMBOLIC_FAST" }),
    path: "SYMBOLIC_FAST",
    kotlinHint: kotlinJarPresent()
      ? "Kotlin brain-hemisphere jar ATTACHED — /api/brain bridges real pulse; TS callosum bus still mirrors locally."
      : "Hemisphere hooks ready — jar missing. TS pulse math is live; kotlinRuntime=hook_only.",
    hold: "HOLD_VYRNA_UNSYNC",
    lattice_sync: false,
  }
}

export function hemisphereStatus(): HemisphereBusStatus & {
  /** UI badge aliases (Left=OO, Right=field) */
  dominant: HemisphereSnapshot["dominant"]
  ui: HemisphereSnapshot
} {
  const st = getLaneState()
  const badges = resolveHemispheres({ path: st.path })
  return {
    left: {
      role: "object OO tasking",
      queueDepth: leftQueue.length,
      lastMethod: leftQueue.length ? leftQueue[leftQueue.length - 1].method : null,
      // UI badge fields
      label: badges.left.label,
      active: badges.left.active,
      weight: badges.left.weight,
      meaning: badges.left.meaning,
    } as HemisphereBusStatus["left"] & HemisphereBadge,
    right: {
      role: "conscious-field symbolic/resonance",
      queueDepth: rightQueue.length,
      lastHz: rightQueue.length ? rightQueue[rightQueue.length - 1].resonanceHz : null,
      label: badges.right.label,
      active: badges.right.active,
      weight: badges.right.weight,
      meaning: badges.right.meaning,
    } as HemisphereBusStatus["right"] & HemisphereBadge,
    callosum: {
      pending: callosumLog.length,
      lastId: callosumLog.length ? callosumLog[callosumLog.length - 1].id : null,
    },
    badges,
    ui: badges,
    dominant: badges.dominant,
    kotlinRuntime: resolveKotlinRuntime(),
    kotlinPulse: kotlinJarPresent() ? kotlinPulseOnce("status") : null,
    path: st.path,
    hold: "HOLD_VYRNA_UNSYNC",
    lattice_sync: false,
  }
}

export function recentCallosum(limit = 8): CallosumMessage[] {
  return callosumLog.slice(-Math.min(32, Math.max(1, limit)))
}
