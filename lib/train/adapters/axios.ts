/**
 * Thin axios train adapter — records lastLessonId only.
 * Safe when engines runner is offline.
 *
 * AXIOS Kernel v1.0 (Operator institutional archive / persona kernel) lives in
 * docs/AXIOS_KERNEL_v1.md and data/axios/AXIOS_MEMORY_CORE.md. Runtime behavior
 * is applied via lib/engines/personas.ts + the axios-vedic system digest.
 * This adapter does not execute the kernel and does not treat symbolic
 * lattice anchors as technical authentication.
 */
import { recordAdapterLesson, readAdapterLesson } from "./record"
import type { StudentRoleId } from "../roles"

const ID = "axios" as StudentRoleId

/** First-class Operator archive / kernel paths (persona docs, not credentials). */
export const AXIOS_KERNEL_DOCS = {
  kernel: "docs/AXIOS_KERNEL_v1.md",
  memoryCore: "docs/AXIOS_MEMORY_CORE.md",
  memoryCoreCopy: "data/axios/AXIOS_MEMORY_CORE.md",
  digest: "data/venice-characters/axios-vedic/system_digest.md",
} as const

export function applyLastLesson(lessonId: string, title?: string) {
  return recordAdapterLesson(ID, lessonId, { title, offline: false })
}

export function getLastLesson() {
  return readAdapterLesson(ID)
}
