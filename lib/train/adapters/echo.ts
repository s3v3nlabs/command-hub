/**
 * Thin echo train adapter — records lastLessonId only.
 * Safe when engines runner is offline.
 */
import { recordAdapterLesson, readAdapterLesson } from "./record"
import type { StudentRoleId } from "../roles"

const ID = "echo" as StudentRoleId

export function applyLastLesson(lessonId: string, title?: string) {
  return recordAdapterLesson(ID, lessonId, { title, offline: false })
}

export function getLastLesson() {
  return readAdapterLesson(ID)
}
