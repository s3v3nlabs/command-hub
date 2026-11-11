/**
 * Multi-operator PRESENCE for SignalFrame — shared cursors + live engagement
 * notes. Reuses the hub's same-origin transport model (like the team-bus SSE):
 * operators on the SAME hub see each other. Honest scope: this is real
 * presence across operators hitting one hub — NOT a live internet mesh / Vyrna
 * lattice. With a single operator it degrades to single-operator honestly.
 *
 * Ephemeral, file-backed under local-data/ (gitignored). Stale operators
 * (no heartbeat within TTL) are treated as offline. Encrypted team CHAT reuses
 * the existing team-bus (lib/signalframe/team-bus.ts).
 */

import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"

const DIR = path.join(process.cwd(), "local-data", "signalframe-presence")
const PRES_FILE = path.join(DIR, "presence.json")
const NOTES_FILE = path.join(DIR, "engagement-notes.jsonl")
const TTL_MS = 30_000
const MAX_NOTES = 500

export interface Operator {
  id: string
  name: string
  color: string
  workspace?: string
  cursor?: { x: number; y: number; view?: string }
  lastSeen: string
  lattice_sync: false
}

export interface EngagementNote {
  id: string
  engagementId: string
  from: string
  body: string
  createdAt: string
  lattice_sync: false
}

function ensure() {
  fs.mkdirSync(DIR, { recursive: true, mode: 0o700 })
}
function readPresence(): Operator[] {
  try {
    if (!fs.existsSync(PRES_FILE)) return []
    const raw = JSON.parse(fs.readFileSync(PRES_FILE, "utf8"))
    return (Array.isArray(raw) ? raw : []).map((o: Operator) => ({ ...o, lattice_sync: false as const }))
  } catch {
    return []
  }
}
function writePresence(list: Operator[]) {
  ensure()
  fs.writeFileSync(PRES_FILE, JSON.stringify(list, null, 2) + "\n", { mode: 0o600 })
}

function isOnline(o: Operator): boolean {
  return Date.now() - new Date(o.lastSeen).getTime() < TTL_MS
}

/** Register/refresh an operator's presence (heartbeat). */
export function heartbeat(input: {
  id?: string
  name: string
  color?: string
  workspace?: string
  cursor?: { x: number; y: number; view?: string }
}): { ok: true; operator: Operator; online: Operator[] } | { ok: false; error: string } {
  const name = (input.name || "").trim().slice(0, 60)
  if (!name) return { ok: false, error: "name required" }
  const id = (input.id || "").trim() || randomUUID()
  const all = readPresence().filter(isOnline)
  const existing = all.find((o) => o.id === id)
  const op: Operator = {
    id,
    name,
    color: input.color || existing?.color || pickColor(id),
    workspace: input.workspace ?? existing?.workspace,
    cursor: input.cursor ?? existing?.cursor,
    lastSeen: new Date().toISOString(),
    lattice_sync: false,
  }
  const next = [...all.filter((o) => o.id !== id), op]
  writePresence(next)
  return { ok: true, operator: op, online: next.filter(isOnline) }
}

export function listOnline(): Operator[] {
  const online = readPresence().filter(isOnline)
  // prune on read
  writePresence(online)
  return online
}

export function leave(id: string): boolean {
  const all = readPresence()
  const next = all.filter((o) => o.id !== id)
  writePresence(next)
  return next.length !== all.length
}

function pickColor(seed: string): string {
  const palette = ["#ef4444", "#3b82f6", "#a855f7", "#f59e0b", "#10b981", "#ec4899", "#06b6d4", "#eab308"]
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % palette.length
  return palette[h]
}

// ── engagement notes ────────────────────────────────────────────────────────
export function postNote(input: { engagementId: string; from: string; body: string }): { ok: true; note: EngagementNote } | { ok: false; error: string } {
  const engagementId = (input.engagementId || "").trim().slice(0, 100)
  const body = (input.body || "").trim().slice(0, 4000)
  if (!engagementId) return { ok: false, error: "engagementId required" }
  if (!body) return { ok: false, error: "body required" }
  const note: EngagementNote = {
    id: randomUUID(),
    engagementId,
    from: (input.from || "operator").slice(0, 60),
    body,
    createdAt: new Date().toISOString(),
    lattice_sync: false,
  }
  ensure()
  fs.appendFileSync(NOTES_FILE, JSON.stringify(note) + "\n", { mode: 0o600 })
  return { ok: true, note }
}

export function listNotes(engagementId?: string, limit = 100): EngagementNote[] {
  try {
    if (!fs.existsSync(NOTES_FILE)) return []
    const lines = fs.readFileSync(NOTES_FILE, "utf8").trim().split("\n").filter(Boolean)
    let notes = lines.slice(-MAX_NOTES).map((l) => JSON.parse(l) as EngagementNote)
    if (engagementId) notes = notes.filter((n) => n.engagementId === engagementId)
    return notes.slice(-limit).reverse()
  } catch {
    return []
  }
}

export function presenceStatus() {
  const online = listOnline()
  return {
    ok: true as const,
    online: online.length,
    multiOperator: online.length > 1,
    transport: "same-origin (hub-shared store)",
    note: online.length > 1 ? "Multiple operators online." : "Single operator — presence degrades honestly.",
    ttlMs: TTL_MS,
    hold: "HOLD_VYRNA_UNSYNC" as const,
    lattice_sync: false as const,
  }
}
