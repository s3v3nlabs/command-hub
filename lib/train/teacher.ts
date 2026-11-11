/**
 * Teacher (default: Dev Operator) — absorb learn/intel/sigma → emit LessonPack.
 * HOLD_VYRNA_UNSYNC · defense/learn only · no cloud leak
 */

import {
  createLessonPack,
  saveLesson,
  setTeacherId,
  loadRoster,
  type LessonPack,
  type LessonModality,
} from "./lessonStore"
import { applyLessonToStudents } from "./student"
import {
  DEFAULT_STUDENTS,
  DEFAULT_TEACHER,
  getTeacher,
  isStudentRoleId,
  type StudentRoleId,
  type TeacherRoleId,
  HOLD,
} from "./roles"

export type EmitInput = {
  title: string
  summary: string
  content?: string
  students?: StudentRoleId[]
  modality?: LessonModality
  tags?: string[]
  source?: LessonPack["source"]
  autoPush?: boolean
}

export function currentTeacher(): ReturnType<typeof getTeacher> {
  const roster = loadRoster()
  return getTeacher(roster.teacherId)
}

export function setTeacher(id: TeacherRoleId = "dev-operator") {
  return {
    teacher: getTeacher(id),
    roster: setTeacherId(id),
    lattice_sync: false as const,
    hold: HOLD,
  }
}

/** Dev Operator absorbs a learn/intel/sigma signal and emits a LessonPack. */
export function emitLesson(input: EmitInput): {
  ok: boolean
  pack: LessonPack | null
  encrypted: boolean
  dimmPath?: string
  pushed?: { studentId: StudentRoleId; ok: boolean }[]
  error?: string
} {
  const title = String(input.title || "").trim()
  const summary = String(input.summary || "").trim()
  if (!title || !summary) {
    return { ok: false, pack: null, encrypted: false, error: "title and summary required" }
  }

  const students = (input.students && input.students.length
    ? input.students.filter(isStudentRoleId)
    : DEFAULT_STUDENTS) as StudentRoleId[]

  if (!students.length) {
    return { ok: false, pack: null, encrypted: false, error: "no valid students" }
  }

  const pack = createLessonPack({
    teacher: DEFAULT_TEACHER.id,
    students,
    modality: input.modality || "symbolic",
    title,
    summary,
    content: input.content,
    tags: ["teacher", "dev-operator", ...(input.tags || [])],
    metrics: { dryRun: true, mesh: "dry-run", score: 0.8 },
    source: input.source || "teacher",
  })

  const saved = saveLesson(pack)

  let pushed: { studentId: StudentRoleId; ok: boolean }[] | undefined
  if (input.autoPush) {
    pushed = applyLessonToStudents(saved.pack, students).results
  }

  return {
    ok: true,
    pack: saved.pack,
    encrypted: saved.encrypted,
    dimmPath: saved.dimmPath,
    pushed,
  }
}

/** After SYMBOLIC_FAST learn — offer/auto emit from Dev Operator lesson. */
export function emitFromSymbolicLearn(input: {
  lessonText: string
  lessonId?: string
  laneId?: string
  autoPush?: boolean
}) {
  const text = String(input.lessonText || "").slice(0, 600)
  if (!text) return { ok: false as const, pack: null, encrypted: false, skipped: true as const }
  return {
    ...emitLesson({
      title: `Symbolic learn${input.laneId ? ` · ${input.laneId}` : ""}`,
      summary: text,
      modality: "symbolic",
      tags: ["sigma", "symbolic_fast", input.laneId || "lane"].filter(Boolean) as string[],
      source: "sigma",
      autoPush: input.autoPush ?? true,
    }),
    skipped: false as const,
  }
}

/** Hive BIG intel → Teacher LessonPack (defense notes only). */
export function emitFromHiveIntel(input: {
  title: string
  summary: string
  severity?: string
  defenseHints?: string[]
  autoPush?: boolean
}) {
  const hints = (input.defenseHints || []).slice(0, 6).join("; ")
  const summary = `[${input.severity || "info"}] ${input.summary.slice(0, 400)}${
    hints ? " | defense: " + hints : ""
  }`
  return emitLesson({
    title: `Hive intel: ${input.title}`.slice(0, 200),
    summary,
    modality: "text",
    tags: ["hive", "intel", input.severity || "info", "defense"],
    source: "hive",
    autoPush: input.autoPush ?? true,
  })
}
