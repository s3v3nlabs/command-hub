/**
 * LessonPack persistence — Privacy Fortress encrypt when available;
 * prefer DIMM symbols/symtrain/ when mounted.
 * HOLD_VYRNA_UNSYNC · never store raw secrets · lattice_sync: false
 */

import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"
import {
  encryptAtRest,
  decryptAtRest,
  isEncryptionAvailable,
  type EncryptedBlob,
} from "@/lib/privacy/localCrypto"
import { HOLD, type StudentRoleId, type TeacherRoleId } from "./roles"

export type LessonModality = "symbolic" | "text" | "sigil2vec" | "sim"

export type StrainMode =
  | "none"
  | "drift_inject_retune"
  | "symbolic_miss_drill"
  | "adversarial_reclaim_quiz"
  | "pulse_pink_brown"

export type LessonPack = {
  id: string
  teacher: TeacherRoleId
  students: StudentRoleId[]
  modality: LessonModality
  title: string
  summary: string
  content: string
  tags: string[]
  dimmPaths: string[]
  metrics?: {
    dryRun?: boolean
    loss?: number
    steps?: number
    score?: number
    mesh?: "dry-run"
  }
  strainMode?: StrainMode
  omniverse?: { status: "optional" | "unavailable" | "available"; reason?: string }
  holdFlags: string[]
  createdAt: string
  lattice_sync: false
  hold: typeof HOLD
  source?: "teacher" | "symtrain-dry-run" | "hive" | "sigma" | "manual" | "assimilate" | "mesh"
}

const DATA_DIR =
  process.env.S3V3N_SYMTRAIN_DIR ||
  path.join(process.cwd(), "data", "symtrain")
const LESSONS_FILE = path.join(DATA_DIR, "lessons.jsonl")
const TEACHER_FILE = path.join(DATA_DIR, "teacher.json")
const ROSTER_FILE = path.join(DATA_DIR, "roster.json")

const DIMM_CANDIDATES = [
  "/workspace/dimm-drive/mnt/symbols/symtrain",
  "/dev/shm/singular-dimm/symbols/symtrain",
  "/workspace/dimm-drive/symbols-soft/symtrain",
]

const FORBIDDEN = /(sk-[a-zA-Z0-9_-]{8,}|BEGIN (RSA |OPENSSH )?PRIVATE KEY|exploit\s*poc|weaponiz|shellcode)/i

function persistOn(): boolean {
  return process.env.S3V3N_PANEL_PERSIST === "1" || process.env.S3V3N_PANEL_PERSIST === "true"
}

function ensure(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 })
}

export function resolveDimmSymtrainDir(): string {
  for (const p of DIMM_CANDIDATES) {
    const parent = path.dirname(p)
    try {
      if (fs.existsSync(path.dirname(parent)) || fs.existsSync(parent) || fs.existsSync("/workspace/dimm-drive/mnt/.dimm-drive")) {
        fs.mkdirSync(p, { recursive: true, mode: 0o700 })
        return p
      }
    } catch {
      /* try next */
    }
  }
  const soft = DIMM_CANDIDATES[2]
  fs.mkdirSync(soft, { recursive: true, mode: 0o700 })
  return soft
}

function sanitize(text: string, max = 1200): string {
  return String(text || "")
    .replace(FORBIDDEN, "[redacted]")
    .trim()
    .slice(0, max)
}

export function createLessonPack(input: {
  teacher?: TeacherRoleId
  students: StudentRoleId[]
  modality?: LessonModality
  title: string
  summary: string
  content?: string
  tags?: string[]
  metrics?: LessonPack["metrics"]
  strainMode?: StrainMode
  source?: LessonPack["source"]
}): LessonPack {
  const dimm = resolveDimmSymtrainDir()
  const id = randomUUID()
  const pack: LessonPack = {
    id,
    teacher: input.teacher || "dev-operator",
    students: input.students,
    modality: input.modality || "symbolic",
    title: sanitize(input.title, 200),
    summary: sanitize(input.summary, 1200),
    content: sanitize(input.content || input.summary, 4000),
    tags: input.tags || [],
    dimmPaths: [path.join(dimm, `${id}.json`)],
    metrics: input.metrics || { dryRun: true, mesh: "dry-run" },
    strainMode: input.strainMode || "none",
    omniverse: {
      status: "unavailable",
      reason: "No Omniverse SDK/license; stub only",
    },
    holdFlags: [HOLD],
    createdAt: new Date().toISOString(),
    lattice_sync: false,
    hold: HOLD,
    source: input.source || "teacher",
  }
  return pack
}

export function saveLesson(pack: LessonPack): { pack: LessonPack; encrypted: boolean; dimmPath: string } {
  ensure()
  const clean: LessonPack = {
    ...pack,
    title: sanitize(pack.title, 200),
    summary: sanitize(pack.summary, 1200),
    content: sanitize(pack.content, 4000),
    lattice_sync: false,
    hold: HOLD,
    holdFlags: Array.from(new Set([...(pack.holdFlags || []), HOLD])),
  }

  let encrypted = false
  let row: Record<string, unknown>
  if (persistOn() && isEncryptionAvailable()) {
    const blob = encryptAtRest(JSON.stringify(clean))
    if (blob) {
      encrypted = true
      row = {
        v: 1,
        enc: true,
        blob,
        meta: { id: clean.id, teacher: clean.teacher, ts: clean.createdAt, modality: clean.modality },
      }
    } else {
      row = { v: 1, enc: false, lesson: clean }
    }
  } else {
    row = { v: 1, enc: false, lesson: clean }
  }

  fs.appendFileSync(LESSONS_FILE, JSON.stringify(row) + "\n", { mode: 0o600 })
  try {
    fs.chmodSync(LESSONS_FILE, 0o600)
  } catch {
    /* ignore */
  }

  const dimmDir = resolveDimmSymtrainDir()
  const dimmPath = path.join(dimmDir, `${clean.id}.json`)
  try {
    fs.writeFileSync(dimmPath, JSON.stringify(clean, null, 2) + "\n", { mode: 0o600 })
    const index = path.join(dimmDir, "index.jsonl")
    fs.appendFileSync(
      index,
      JSON.stringify({
        id: clean.id,
        title: clean.title,
        modality: clean.modality,
        path: dimmPath,
        ts: clean.createdAt,
        lattice_sync: false,
        hold: HOLD,
      }) + "\n",
      { mode: 0o600 },
    )
  } catch {
    /* DIMM write best-effort */
  }

  return { pack: clean, encrypted, dimmPath }
}

export function listLessons(limit = 40): LessonPack[] {
  try {
    ensure()
    if (!fs.existsSync(LESSONS_FILE)) return []
    const lines = fs.readFileSync(LESSONS_FILE, "utf8").split("\n").filter(Boolean)
    const out: LessonPack[] = []
    for (const line of lines.slice(-Math.max(limit * 2, 80))) {
      try {
        const row = JSON.parse(line)
        if (row.enc && row.blob) {
          const pt = decryptAtRest(row.blob as EncryptedBlob)
          if (pt) out.push({ ...JSON.parse(pt), lattice_sync: false as const, hold: HOLD })
        } else if (row.lesson) {
          out.push({ ...row.lesson, lattice_sync: false as const, hold: HOLD })
        }
      } catch {
        /* skip */
      }
    }
    return out.slice(-limit).reverse()
  } catch {
    return []
  }
}

export function getLesson(id: string): LessonPack | null {
  return listLessons(200).find((l) => l.id === id) || null
}

export type RosterEntry = {
  studentId: StudentRoleId
  lastLessonId: string | null
  lastAppliedAt: string | null
  applyCount: number
  lastScore?: number
  onlineHint: "unknown" | "offline" | "recorded"
}

export type RosterState = {
  teacherId: TeacherRoleId
  students: RosterEntry[]
  lastStrainScores: Record<string, number>
  updatedAt: string
  lattice_sync: false
  hold: typeof HOLD
}

function defaultRoster(teacherId: TeacherRoleId = "dev-operator"): RosterState {
  const ids: StudentRoleId[] = ["axios", "heimdall", "twin", "s3v3n-panel", "echo", "persona-stub"]
  return {
    teacherId,
    students: ids.map((studentId) => ({
      studentId,
      lastLessonId: null,
      lastAppliedAt: null,
      applyCount: 0,
      onlineHint: "unknown",
    })),
    lastStrainScores: {},
    updatedAt: new Date().toISOString(),
    lattice_sync: false,
    hold: HOLD,
  }
}

export function loadRoster(): RosterState {
  try {
    ensure()
    if (!fs.existsSync(ROSTER_FILE)) return defaultRoster()
    const raw = JSON.parse(fs.readFileSync(ROSTER_FILE, "utf8"))
    return { ...defaultRoster(raw.teacherId), ...raw, lattice_sync: false, hold: HOLD }
  } catch {
    return defaultRoster()
  }
}

export function saveRoster(state: RosterState): RosterState {
  ensure()
  const next = { ...state, lattice_sync: false as const, hold: HOLD, updatedAt: new Date().toISOString() }
  fs.writeFileSync(ROSTER_FILE, JSON.stringify(next, null, 2) + "\n", { mode: 0o600 })
  return next
}

export function setTeacherId(id: TeacherRoleId): RosterState {
  const r = loadRoster()
  const next = saveRoster({ ...r, teacherId: id })
  ensure()
  fs.writeFileSync(
    TEACHER_FILE,
    JSON.stringify({ teacherId: id, lattice_sync: false, hold: HOLD, ts: new Date().toISOString() }, null, 2) + "\n",
    { mode: 0o600 },
  )
  return next
}

export function markStudentApplied(
  studentId: StudentRoleId,
  lessonId: string,
  score?: number,
): RosterState {
  const r = loadRoster()
  const students = r.students.map((s) =>
    s.studentId === studentId
      ? {
          ...s,
          lastLessonId: lessonId,
          lastAppliedAt: new Date().toISOString(),
          applyCount: (s.applyCount || 0) + 1,
          lastScore: typeof score === "number" ? score : s.lastScore,
          onlineHint: "recorded" as const,
        }
      : s,
  )
  const lastStrainScores = { ...r.lastStrainScores }
  if (typeof score === "number") lastStrainScores[studentId] = score
  return saveRoster({ ...r, students, lastStrainScores })
}
