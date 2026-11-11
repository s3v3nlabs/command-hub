/**
 * Thin adapter recorder for hub AI seats.
 * Records lastLessonId even when engines runners are offline.
 * HOLD_VYRNA_UNSYNC
 */

import fs from "fs"
import path from "path"
import type { StudentRoleId } from "../roles"
import { HOLD } from "../roles"

const ADAPTER_DIR =
  process.env.S3V3N_TRAIN_ADAPTER_DIR ||
  path.join(process.cwd(), "data", "symtrain", "adapters")

export type AdapterRecord = {
  studentId: StudentRoleId
  lastLessonId: string
  title?: string
  modality?: string
  offline?: boolean
  updatedAt: string
  lattice_sync: false
  hold: typeof HOLD
}

function ensure(): void {
  fs.mkdirSync(ADAPTER_DIR, { recursive: true, mode: 0o700 })
}

export function recordAdapterLesson(
  studentId: StudentRoleId,
  lessonId: string,
  meta?: { title?: string; modality?: string; offline?: boolean },
): AdapterRecord {
  ensure()
  const rec: AdapterRecord = {
    studentId,
    lastLessonId: lessonId,
    title: meta?.title,
    modality: meta?.modality,
    offline: meta?.offline,
    updatedAt: new Date().toISOString(),
    lattice_sync: false,
    hold: HOLD,
  }
  const file = path.join(ADAPTER_DIR, `${studentId}.json`)
  fs.writeFileSync(file, JSON.stringify(rec, null, 2) + "\n", { mode: 0o600 })
  return rec
}

export function readAdapterLesson(studentId: StudentRoleId): AdapterRecord | null {
  try {
    const file = path.join(ADAPTER_DIR, `${studentId}.json`)
    if (!fs.existsSync(file)) return null
    return JSON.parse(fs.readFileSync(file, "utf8")) as AdapterRecord
  } catch {
    return null
  }
}

export function listAdapterRecords(): AdapterRecord[] {
  try {
    ensure()
    return fs
      .readdirSync(ADAPTER_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        try {
          return JSON.parse(fs.readFileSync(path.join(ADAPTER_DIR, f), "utf8")) as AdapterRecord
        } catch {
          return null
        }
      })
      .filter((x): x is AdapterRecord => Boolean(x))
  } catch {
    return []
  }
}
