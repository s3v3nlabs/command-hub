/**
 * Dev Operator learning loop — adapt over time.
 * Lessons encrypted when Privacy Fortress persist is on.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false always.
 * Never stores raw secrets in plaintext telemetry.
 */

import fs from "fs"
import path from "path"
import { createHash, randomUUID } from "crypto"
import {
  encryptAtRest,
  decryptAtRest,
  isEncryptionAvailable,
  type EncryptedBlob,
} from "@/lib/privacy/localCrypto"
import { redactSecrets, TWIN_INDEX_DIR, searchTwin } from "@/lib/ai/operator-twin"

export type LessonKind =
  | "correction"
  | "proposal_success"
  | "hive_intel"
  | "preference"
  | "chat_turn"
  | "defense_hint"

export type Lesson = {
  id: string
  kind: LessonKind
  text: string
  weight: number
  tags: string[]
  ts: string
  lattice_sync: false
  hold: "HOLD_VYRNA_UNSYNC"
}

export type LearnMetrics = {
  lessons_count: number
  intel_ingested: number
  proposals_accepted: number
  chat_turns: number
  last_learn_at: string | null
  preference_weights: Record<string, number>
  lattice_sync: false
  hold: "HOLD_VYRNA_UNSYNC"
}

const LEARN_DIR =
  process.env.S3V3N_DEV_OPERATOR_LEARN_DIR ||
  path.join(process.cwd(), "data", "dev-operator", "learn")
const LESSONS_FILE = path.join(LEARN_DIR, "lessons.jsonl")
const METRICS_FILE = path.join(LEARN_DIR, "metrics.json")
const MEMORY_CHUNK =
  process.env.S3V3N_DEV_OPERATOR_MEMORY ||
  path.join(TWIN_INDEX_DIR, "dev-operator-memory.jsonl")

const FORBIDDEN = /(sk-[a-zA-Z0-9_-]{8,}|BEGIN (RSA |OPENSSH )?PRIVATE KEY|exploit\s*poc|weaponiz|shellcode)/i

function persistOn(): boolean {
  return process.env.S3V3N_PANEL_PERSIST === "1" || process.env.S3V3N_PANEL_PERSIST === "true"
}

function ensure(): void {
  fs.mkdirSync(LEARN_DIR, { recursive: true, mode: 0o700 })
  try {
    fs.mkdirSync(path.dirname(MEMORY_CHUNK), { recursive: true, mode: 0o700 })
    fs.chmodSync(path.dirname(MEMORY_CHUNK), 0o700)
  } catch {
    /* ignore */
  }
}

function defaultMetrics(): LearnMetrics {
  return {
    lessons_count: 0,
    intel_ingested: 0,
    proposals_accepted: 0,
    chat_turns: 0,
    last_learn_at: null,
    preference_weights: {},
    lattice_sync: false,
    hold: "HOLD_VYRNA_UNSYNC",
  }
}

export function getLearnMetrics(): LearnMetrics {
  try {
    ensure()
    if (!fs.existsSync(METRICS_FILE)) return defaultMetrics()
    const raw = JSON.parse(fs.readFileSync(METRICS_FILE, "utf8"))
    return {
      ...defaultMetrics(),
      ...raw,
      lattice_sync: false,
      hold: "HOLD_VYRNA_UNSYNC",
    }
  } catch {
    return defaultMetrics()
  }
}

function writeMetrics(m: LearnMetrics): void {
  ensure()
  fs.writeFileSync(
    METRICS_FILE,
    JSON.stringify({ ...m, lattice_sync: false, hold: "HOLD_VYRNA_UNSYNC" }, null, 2) + "\n",
    { mode: 0o600 },
  )
  try {
    fs.chmodSync(METRICS_FILE, 0o600)
  } catch {
    /* ignore */
  }
}

function bumpMetrics(patch: Partial<LearnMetrics>): LearnMetrics {
  const cur = getLearnMetrics()
  const next: LearnMetrics = {
    ...cur,
    ...patch,
    preference_weights: { ...cur.preference_weights, ...(patch.preference_weights || {}) },
    last_learn_at: new Date().toISOString(),
    lattice_sync: false,
    hold: "HOLD_VYRNA_UNSYNC",
  }
  writeMetrics(next)
  return next
}

function sanitizeLessonText(text: string): string {
  return redactSecrets(String(text || ""))
    .replace(FORBIDDEN, "[redacted]")
    .trim()
    .slice(0, 800)
}

/** Extract a short lesson from a chat turn (no raw secrets). */
export function extractLessonFromTurn(userMsg: string, assistantReply: string): string | null {
  const u = sanitizeLessonText(userMsg)
  const a = sanitizeLessonText(assistantReply)
  if (!u) return null
  const focus = u.slice(0, 220)
  let lesson = `Operator focus: ${focus}`
  if (/correct|no[,.]|wrong|instead|prefer|always|never|don\'t|do not/i.test(u)) {
    lesson = `Correction: ${focus}`
  } else if (/module|manifest|stub/i.test(u)) {
    lesson = `Module intent: ${focus}`
  } else if (/patch|harden|defend|fix/i.test(u)) {
    lesson = `Defense intent: ${focus}`
  } else if (/hive|intel|bounty/i.test(u)) {
    lesson = `Hive/intel intent: ${focus}`
  }
  const tip = a
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 20 && l.length < 160 && !/^#|^```/.test(l))
  if (tip) lesson += ` · tip: ${tip}`
  return lesson.slice(0, 600)
}

function appendLessonRow(lesson: Lesson): void {
  ensure()
  let row: Record<string, unknown>
  if (persistOn() && isEncryptionAvailable()) {
    const blob = encryptAtRest(JSON.stringify(lesson))
    row = blob
      ? { v: 1, enc: true, blob, meta: { id: lesson.id, kind: lesson.kind, ts: lesson.ts, weight: lesson.weight } }
      : { v: 1, enc: false, lesson }
  } else {
    row = { v: 1, enc: false, lesson }
  }

  fs.appendFileSync(LESSONS_FILE, JSON.stringify(row) + "\n", { mode: 0o600 })
  try {
    fs.chmodSync(LESSONS_FILE, 0o600)
  } catch {
    /* ignore */
  }

  const mem = {
    id: lesson.id,
    vault: "dev-operator-memory",
    path: `dev-operator://${lesson.kind}/${lesson.id}`,
    title: `DevOperator lesson (${lesson.kind})`,
    text: lesson.text,
    chars: lesson.text.length,
    weight: lesson.weight,
    tags: lesson.tags,
    ts: lesson.ts,
    lattice_sync: false,
    hold: "HOLD_VYRNA_UNSYNC",
  }
  fs.appendFileSync(MEMORY_CHUNK, JSON.stringify(mem) + "\n", { mode: 0o600 })
  try {
    fs.chmodSync(MEMORY_CHUNK, 0o600)
  } catch {
    /* ignore */
  }
}

function readAllLessons(): Lesson[] {
  try {
    if (!fs.existsSync(LESSONS_FILE)) return []
    const lines = fs.readFileSync(LESSONS_FILE, "utf8").split("\n").filter(Boolean)
    const out: Lesson[] = []
    for (const line of lines) {
      try {
        const row = JSON.parse(line)
        if (row.enc && row.blob) {
          const pt = decryptAtRest(row.blob as EncryptedBlob)
          if (pt) {
            out.push({ ...JSON.parse(pt), lattice_sync: false as const, hold: "HOLD_VYRNA_UNSYNC" as const })
          }
        } else if (row.lesson) {
          out.push({ ...row.lesson, lattice_sync: false as const, hold: "HOLD_VYRNA_UNSYNC" as const })
        }
      } catch {
        /* skip */
      }
    }
    return out
  } catch {
    return []
  }
}

function lessonKey(kind: string, text: string): string {
  return createHash("sha256").update(kind + ":" + text.toLowerCase()).digest("hex").slice(0, 16)
}

export function upsertLesson(input: {
  kind: LessonKind
  text: string
  weight?: number
  tags?: string[]
}): Lesson | null {
  const text = sanitizeLessonText(input.text)
  if (!text || FORBIDDEN.test(text)) return null
  const hash = lessonKey(input.kind, text)
  const existing = readAllLessons()
  const prior = existing.find((l) => lessonKey(l.kind, l.text) === hash)
  if (prior) {
    const reinforced: Lesson = {
      ...prior,
      weight: Math.min(10, (prior.weight || 1) + (input.weight || 0.5)),
      ts: new Date().toISOString(),
      tags: Array.from(new Set([...(prior.tags || []), ...(input.tags || [])])),
      lattice_sync: false,
      hold: "HOLD_VYRNA_UNSYNC",
    }
    appendLessonRow(reinforced)
    bumpMetrics({ lessons_count: Math.max(existing.length, getLearnMetrics().lessons_count) })
    return reinforced
  }
  const lesson: Lesson = {
    id: randomUUID(),
    kind: input.kind,
    text,
    weight: input.weight ?? 1,
    tags: input.tags || [],
    ts: new Date().toISOString(),
    lattice_sync: false,
    hold: "HOLD_VYRNA_UNSYNC",
  }
  appendLessonRow(lesson)
  const m = getLearnMetrics()
  bumpMetrics({
    lessons_count: m.lessons_count + 1,
    intel_ingested: input.kind === "hive_intel" ? m.intel_ingested + 1 : m.intel_ingested,
    proposals_accepted: input.kind === "proposal_success" ? m.proposals_accepted + 1 : m.proposals_accepted,
    chat_turns: input.kind === "chat_turn" ? m.chat_turns + 1 : m.chat_turns,
  })
  return lesson
}

/** Score lessons against a prompt; return top-K. */
export function retrieveLessons(prompt: string, topK = 6): Lesson[] {
  const q = sanitizeLessonText(prompt).toLowerCase()
  const tokens = q.split(/[^a-z0-9]+/).filter((t) => t.length > 2)
  const all = readAllLessons()
  const scored = all.map((l) => {
    const hay = (l.text + " " + l.tags.join(" ")).toLowerCase()
    let score = l.weight || 1
    for (const t of tokens) if (hay.includes(t)) score += 1.5
    if (l.kind === "correction") score += 0.5
    if (l.kind === "hive_intel") score += 0.3
    return { l, score }
  })
  scored.sort((a, b) => b.score - a.score || b.l.ts.localeCompare(a.l.ts))
  const seen = new Set<string>()
  const out: Lesson[] = []
  for (const { l, score } of scored) {
    if (score <= 1 && tokens.length > 0) continue
    const key = l.text.slice(0, 80)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(l)
    if (out.length >= topK) break
  }
  return out
}

/** Retrieve lessons + Twin hits for prompt adaptation. */
export function retrieveContextForPrompt(prompt: string, topK = 6): {
  lessons: Lesson[]
  twinExcerpts: string[]
  block: string
} {
  const lessons = retrieveLessons(prompt, topK)
  let twinExcerpts: string[] = []
  try {
    const hits = searchTwin(prompt, topK)
    twinExcerpts = hits.map((h) => `[${h.vault}] ${h.title}: ${h.excerpt}`).slice(0, topK)
  } catch {
    twinExcerpts = []
  }
  try {
    if (fs.existsSync(MEMORY_CHUNK)) {
      const lines = fs.readFileSync(MEMORY_CHUNK, "utf8").split("\n").filter(Boolean).slice(-50)
      const q = prompt.toLowerCase()
      const extra = lines
        .map((line) => {
          try {
            return JSON.parse(line) as { text?: string }
          } catch {
            return null
          }
        })
        .filter((m): m is { text: string } => Boolean(m?.text))
        .filter((m) => m.text.toLowerCase().split(/\s+/).some((t) => t.length > 3 && q.includes(t)))
        .slice(0, 4)
        .map((m) => `memory: ${m.text.slice(0, 200)}`)
      twinExcerpts = [...twinExcerpts, ...extra].slice(0, topK)
    }
  } catch {
    /* ignore */
  }

  const block = [
    "## Retrieved lessons (adapt)",
    lessons.length ? lessons.map((l, i) => `${i + 1}. (${l.kind},w=${l.weight}) ${l.text}`).join("\n") : "(none yet)",
    "",
    "## Twin / memory excerpts",
    twinExcerpts.length ? twinExcerpts.map((e, i) => `${i + 1}. ${e}`).join("\n") : "(none)",
    "",
    "lattice_sync: false · HOLD_VYRNA_UNSYNC",
  ].join("\n")

  return { lessons, twinExcerpts, block }
}

export function learnFromChatTurn(userMsg: string, assistantReply: string): {
  lesson: Lesson | null
  metrics: LearnMetrics
} {
  const text = extractLessonFromTurn(userMsg, assistantReply)
  const lesson = text ? upsertLesson({ kind: "chat_turn", text, weight: 1, tags: ["chat"] }) : null
  const m = getLearnMetrics()
  const metrics = bumpMetrics({ chat_turns: m.chat_turns + 1 })
  return { lesson, metrics }
}

export function learnCorrection(note: string): Lesson | null {
  return upsertLesson({ kind: "correction", text: note, weight: 2.5, tags: ["correction"] })
}

export function learnProposalAccepted(summary: string): Lesson | null {
  const lesson = upsertLesson({
    kind: "proposal_success",
    text: summary,
    weight: 2,
    tags: ["proposal"],
  })
  const m = getLearnMetrics()
  if (lesson) bumpMetrics({ proposals_accepted: m.proposals_accepted + 1 })
  return lesson
}

export function learnPreference(key: string, delta = 1): LearnMetrics {
  const m = getLearnMetrics()
  const weights = { ...m.preference_weights, [key]: (m.preference_weights[key] || 0) + delta }
  upsertLesson({
    kind: "preference",
    text: `Preference weight: ${key}=${weights[key]}`,
    weight: 1.2,
    tags: ["pref", key],
  })
  return bumpMetrics({ preference_weights: weights })
}

/** Hive BIG intel → learn note + defense hints. */
export function learnFromHiveIntel(input: {
  title: string
  summary: string
  severity?: string
  defenseHints?: string[]
  patchHints?: string[]
  fromHub?: string
}): Lesson | null {
  const sev = input.severity || "info"
  const hints = [...(input.defenseHints || []), ...(input.patchHints || [])].slice(0, 8)
  const text = sanitizeLessonText(
    `[${sev}] ${input.title}: ${input.summary.slice(0, 280)}${hints.length ? " | defense: " + hints.join("; ") : ""} (hub=${input.fromHub || "local"})`,
  )
  const lesson = upsertLesson({
    kind: "hive_intel",
    text,
    weight: sev === "critical" ? 3 : sev === "high" ? 2.5 : 1.5,
    tags: ["hive", "intel", sev],
  })
  if (hints.length) {
    upsertLesson({
      kind: "defense_hint",
      text: `Defense hints for ${input.title}: ${hints.join("; ")}`.slice(0, 600),
      weight: 2,
      tags: ["defense", sev],
    })
  }
  const m = getLearnMetrics()
  bumpMetrics({ intel_ingested: m.intel_ingested + 1 })
  return lesson
}
