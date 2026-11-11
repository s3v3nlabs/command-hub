/**
 * Apply LessonPack to student prefs / system prompts / Twin RAG note.
 * Thin adapters record lastLessonId; runners may be offline (non-fatal).
 * HOLD_VYRNA_UNSYNC · no cloud leak
 */

import fs from "fs"
import path from "path"
import { markStudentApplied, loadRoster, type LessonPack } from "./lessonStore"
import {
  STUDENT_REGISTRY,
  isStudentRoleId,
  type StudentRoleId,
  HOLD,
} from "./roles"
import { recordAdapterLesson } from "./adapters/record"

const DATA_DIR =
  process.env.S3V3N_SYMTRAIN_DIR ||
  path.join(process.cwd(), "data", "symtrain")
const PREFS_DIR = path.join(DATA_DIR, "student-prefs")
const TWIN_NOTE =
  process.env.S3V3N_TWIN_TRAIN_NOTE ||
  path.join(process.cwd(), "data", "dev-operator", "learn", "train-twin-notes.jsonl")

function ensurePrefs(): void {
  fs.mkdirSync(PREFS_DIR, { recursive: true, mode: 0o700 })
}

function nudgePrefs(studentId: StudentRoleId, pack: LessonPack): void {
  ensurePrefs()
  const file = path.join(PREFS_DIR, `${studentId}.json`)
  let cur: Record<string, unknown> = {}
  try {
    if (fs.existsSync(file)) cur = JSON.parse(fs.readFileSync(file, "utf8"))
  } catch {
    cur = {}
  }
  const next = {
    ...cur,
    studentId,
    lastLessonId: pack.id,
    lastTitle: pack.title,
    lastModality: pack.modality,
    tags: pack.tags,
    updatedAt: new Date().toISOString(),
    lattice_sync: false,
    hold: HOLD,
  }
  fs.writeFileSync(file, JSON.stringify(next, null, 2) + "\n", { mode: 0o600 })
}

function nudgeSystemPromptNote(studentId: StudentRoleId, pack: LessonPack): void {
  ensurePrefs()
  const file = path.join(PREFS_DIR, `${studentId}.system-prompt-nudge.md`)
  const body = [
    `# Train nudge for ${studentId}`,
    ``,
    `lessonId: ${pack.id}`,
    `teacher: ${pack.teacher}`,
    `modality: ${pack.modality}`,
    `hold: ${HOLD}`,
    `lattice_sync: false`,
    ``,
    `## Title`,
    pack.title,
    ``,
    `## Summary`,
    pack.summary.slice(0, 800),
    ``,
    `## Operator note`,
    `Apply as local system-prompt preference only. Do not exfiltrate. Defense/learn only.`,
    ``,
  ].join("\n")
  fs.writeFileSync(file, body, { mode: 0o600 })
}

function twinRagNote(pack: LessonPack): void {
  try {
    fs.mkdirSync(path.dirname(TWIN_NOTE), { recursive: true, mode: 0o700 })
    const row = {
      id: pack.id,
      vault: "train-lesson",
      path: `symtrain://lesson/${pack.id}`,
      title: `Train lesson: ${pack.title}`,
      text: pack.summary.slice(0, 600),
      chars: Math.min(600, pack.summary.length),
      tags: ["symtrain", "teacher", ...pack.tags].slice(0, 12),
      ts: new Date().toISOString(),
      lattice_sync: false,
      hold: HOLD,
    }
    fs.appendFileSync(TWIN_NOTE, JSON.stringify(row) + "\n", { mode: 0o600 })
  } catch {
    /* Twin note best-effort */
  }
}

export function applyLessonToStudent(
  pack: LessonPack,
  studentId: StudentRoleId,
  score?: number,
): { studentId: StudentRoleId; ok: boolean; error?: string } {
  if (!isStudentRoleId(studentId)) {
    return { studentId, ok: false, error: "unknown student" }
  }
  const role = STUDENT_REGISTRY[studentId]
  try {
    for (const target of role.applyTargets) {
      if (target === "prefs") nudgePrefs(studentId, pack)
      if (target === "system_prompt") nudgeSystemPromptNote(studentId, pack)
      if (target === "twin_rag") twinRagNote(pack)
      if (target === "adapter_record") {
        recordAdapterLesson(studentId, pack.id, {
          title: pack.title,
          modality: pack.modality,
        })
      }
    }
    markStudentApplied(studentId, pack.id, score)
    return { studentId, ok: true }
  } catch (e) {
    // Still record best-effort so roster updates even if runner offline
    try {
      recordAdapterLesson(studentId, pack.id, { title: pack.title, offline: true })
      markStudentApplied(studentId, pack.id, score)
    } catch {
      /* ignore */
    }
    return {
      studentId,
      ok: true,
      error: e instanceof Error ? e.message : "apply soft-failed (recorded)",
    }
  }
}

export function applyLessonToStudents(
  pack: LessonPack,
  students?: StudentRoleId[],
): {
  results: { studentId: StudentRoleId; ok: boolean; error?: string }[]
  roster: ReturnType<typeof markStudentApplied> | null
} {
  const targets = (students && students.length ? students : pack.students).filter(isStudentRoleId)
  const results = targets.map((id) => applyLessonToStudent(pack, id))
  return { results, roster: null }
}

export function pushLessonToStudents(
  pack: LessonPack,
  students?: StudentRoleId[],
) {
  const { results } = applyLessonToStudents(pack, students)
  return {
    ok: results.some((r) => r.ok),
    results,
    roster: loadRoster(),
    lattice_sync: false as const,
    hold: HOLD,
  }
}
