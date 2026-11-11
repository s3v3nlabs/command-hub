/**
 * Teacher→Student roles for Σ3D-SYMTRAIN / Train Lane.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false always.
 * Default Teacher = Dev Operator.
 */

export const HOLD = "HOLD_VYRNA_UNSYNC" as const

export type TeacherRoleId = "dev-operator"

export type StudentRoleId =
  | "axios"
  | "heimdall"
  | "twin"
  | "s3v3n-panel"
  | "echo"
  | "persona-stub"

export type TeacherRole = {
  id: TeacherRoleId
  label: string
  description: string
  canEmitLessons: true
  lattice_sync: false
  hold: typeof HOLD
}

export type StudentRole = {
  id: StudentRoleId
  label: string
  description: string
  runnerHint?: string
  applyTargets: Array<"prefs" | "system_prompt" | "twin_rag" | "adapter_record">
  lattice_sync: false
  hold: typeof HOLD
}

export const DEFAULT_TEACHER: TeacherRole = {
  id: "dev-operator",
  label: "Dev Operator",
  description: "Designated Teacher: absorbs learn/intel/sigma → emits LessonPack to hub AIs.",
  canEmitLessons: true,
  lattice_sync: false,
  hold: HOLD,
}

export const STUDENT_REGISTRY: Record<StudentRoleId, StudentRole> = {
  axios: {
    id: "axios",
    label: "Axios",
    description: "Engines Axios runner seat — records lastLessonId via thin adapter.",
    runnerHint: "singular-ty-engines/run_axios.py",
    applyTargets: ["adapter_record", "prefs"],
    lattice_sync: false,
    hold: HOLD,
  },
  heimdall: {
    id: "heimdall",
    label: "Heimdall",
    description: "Engines Heimdall / guardian adapter — thin adapter + symbolic prefs.",
    runnerHint: "singular-ty-engines/run_heimdall.py",
    applyTargets: ["adapter_record", "prefs"],
    lattice_sync: false,
    hold: HOLD,
  },
  twin: {
    id: "twin",
    label: "Operator Twin",
    description: "Local Twin RAG index note only — no cloud leak.",
    applyTargets: ["twin_rag", "adapter_record"],
    lattice_sync: false,
    hold: HOLD,
  },
  "s3v3n-panel": {
    id: "s3v3n-panel",
    label: "S3v3n Panel",
    description: "Panel system-prompt / prefs nudge from Teacher lessons.",
    applyTargets: ["system_prompt", "prefs", "adapter_record"],
    lattice_sync: false,
    hold: HOLD,
  },
  echo: {
    id: "echo",
    label: "Echo (persona stub)",
    description: "EchoNexus / echo persona stub — adapter record only if offline.",
    runnerHint: "singular-ty-engines/.venv-echonexus",
    applyTargets: ["adapter_record"],
    lattice_sync: false,
    hold: HOLD,
  },
  "persona-stub": {
    id: "persona-stub",
    label: "Persona stub",
    description: "Generic persona seat for future hub AIs.",
    applyTargets: ["adapter_record"],
    lattice_sync: false,
    hold: HOLD,
  },
}

export const DEFAULT_STUDENTS: StudentRoleId[] = [
  "axios",
  "heimdall",
  "twin",
  "s3v3n-panel",
]

export function isStudentRoleId(v: unknown): v is StudentRoleId {
  return typeof v === "string" && v in STUDENT_REGISTRY
}

export function listStudents(): StudentRole[] {
  return Object.values(STUDENT_REGISTRY)
}

export function getTeacher(id?: string | null): TeacherRole {
  if (id && id !== "dev-operator") {
    // Only one designated teacher for now; ignore unknown and keep default
    return DEFAULT_TEACHER
  }
  return DEFAULT_TEACHER
}
