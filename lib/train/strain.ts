/**
 * Strain modes for Teacher→Student drills.
 * Returns scores for teacher; defense/learn only — no exploit payloads.
 * HOLD_VYRNA_UNSYNC
 */

import { createHash, randomUUID } from "crypto"
import {
  createLessonPack,
  saveLesson,
  markStudentApplied,
  loadRoster,
  type StrainMode,
  type LessonPack,
} from "./lessonStore"
import { DEFAULT_STUDENTS, isStudentRoleId, type StudentRoleId, HOLD } from "./roles"
import { applyLessonToStudent } from "./student"

export type StrainResult = {
  id: string
  mode: StrainMode
  scores: Record<string, number>
  average: number
  notes: string[]
  lessonId?: string
  lattice_sync: false
  hold: typeof HOLD
}

function hashScore(seed: string, base = 0.55): number {
  const h = createHash("sha256").update(seed).digest()
  const n = h[0]! / 255
  return Math.round(Math.min(0.99, Math.max(0.05, base + (n - 0.5) * 0.4)) * 1000) / 1000
}

const MODE_NOTES: Record<Exclude<StrainMode, "none">, string> = {
  drift_inject_retune: "Inject mild drift cues → student retune toward Δt=0 (symbolic).",
  symbolic_miss_drill: "Withhold one glyph cue → student must reclaim from DIMM/sigil memory.",
  adversarial_reclaim_quiz: "Quiz on reclaim UI posture (defense/privacy) — no exploit content.",
  pulse_pink_brown: "Pink explore + brown long-wander pulse scores for Teacher calibration.",
}

export function runStrain(input: {
  mode: StrainMode
  students?: StudentRoleId[]
  seed?: string
  emitLesson?: boolean
}): StrainResult {
  const mode = input.mode === "none" ? "symbolic_miss_drill" : input.mode
  const students = (input.students && input.students.length
    ? input.students.filter(isStudentRoleId)
    : DEFAULT_STUDENTS) as StudentRoleId[]
  const seed = input.seed || randomUUID().slice(0, 8)
  const id = randomUUID()
  const scores: Record<string, number> = {}
  const notes: string[] = [MODE_NOTES[mode as Exclude<StrainMode, "none">] || mode]

  const base =
    mode === "drift_inject_retune"
      ? 0.62
      : mode === "symbolic_miss_drill"
        ? 0.58
        : mode === "adversarial_reclaim_quiz"
          ? 0.7
          : 0.6

  for (const s of students) {
    scores[s] = hashScore(`${mode}:${s}:${seed}`, base)
  }

  const vals = Object.values(scores)
  const average = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 1000) / 1000 : 0

  let lessonId: string | undefined
  if (input.emitLesson !== false) {
    const pack = createLessonPack({
      students,
      modality: mode === "adversarial_reclaim_quiz" ? "text" : "symbolic",
      title: `Strain: ${mode}`,
      summary: `Teacher strain drill (${mode}). avg=${average}. seed=${seed}. Defense/learn only.`,
      tags: ["strain", mode, "teacher"],
      metrics: { dryRun: true, mesh: "dry-run", score: average },
      strainMode: mode,
      source: "teacher",
    })
    const saved = saveLesson(pack)
    lessonId = saved.pack.id
    for (const s of students) {
      applyLessonToStudent(saved.pack, s, scores[s])
      markStudentApplied(s, saved.pack.id, scores[s])
    }
  } else {
    let roster = loadRoster()
    for (const s of students) {
      roster = markStudentApplied(s, `strain-${id}`, scores[s])
    }
    void roster
  }

  if (mode === "pulse_pink_brown") {
    notes.push("pink=local explore · brown=long BIG-intel wander (engineering metaphor only)")
  }

  return {
    id,
    mode,
    scores,
    average,
    notes,
    lessonId,
    lattice_sync: false,
    hold: HOLD,
  }
}

export function listStrainModes(): { id: StrainMode; label: string; description: string }[] {
  return [
    { id: "drift_inject_retune", label: "Drift inject + retune", description: MODE_NOTES.drift_inject_retune },
    { id: "symbolic_miss_drill", label: "Symbolic miss drill", description: MODE_NOTES.symbolic_miss_drill },
    { id: "adversarial_reclaim_quiz", label: "Adversarial reclaim quiz", description: MODE_NOTES.adversarial_reclaim_quiz },
    { id: "pulse_pink_brown", label: "Pulse pink/brown explore", description: MODE_NOTES.pulse_pink_brown },
  ]
}
