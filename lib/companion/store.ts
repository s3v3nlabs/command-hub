/**
 * File-backed Device Bridge sessions, tickets, signals, and telemetry.
 * Persistence lives under data/companion/ (gitignored via data/*).
 * SSE listeners are in-process only — run a single Node hub process.
 *
 * Credit: Christian Wilford (s3v3n), AI Architect, Offensive Security Enthusiast,
 * Founder of Singular/ty Defense Solutions, LLC.
 */

import fs from "fs"
import path from "path"
import { createHash, randomBytes, randomUUID } from "crypto"
import type {
  CompanionRole,
  CompanionSession,
  CompanionTelemetry,
  CompanionTicket,
  MediaState,
  PublicCompanionStatus,
  SignalEnvelope,
  SignalKind,
} from "./types"
import { COMPANION_HTTPS_HINT, COMPANION_LIMITS, FIELD_MODULES } from "./types"
import { hasConfiguredHubToken, isSecureMode } from "@/lib/security/api-auth"

const MAX_SESSIONS = 32
const MAX_SIGNALS = 80
const MAX_SESSION_MS = 12 * 60 * 60 * 1000
const IDLE_MS = 45 * 60 * 1000
const TICKET_BYTES = 32

function rootDir(): string {
  return process.env.COMPANION_DATA_DIR || path.join(process.cwd(), "data", "companion")
}

function sessionsFile(): string {
  return path.join(rootDir(), "sessions.json")
}
function ticketsFile(): string {
  return path.join(rootDir(), "tickets.json")
}
function signalsFile(): string {
  return path.join(rootDir(), "signals.json")
}

function ensure(): void {
  fs.mkdirSync(rootDir(), { recursive: true, mode: 0o700 })
}

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback
    const raw = JSON.parse(fs.readFileSync(file, "utf8"))
    return raw as T
  } catch {
    return fallback
  }
}

function writeJson(file: string, value: unknown): void {
  ensure()
  const tmp = file + ".tmp"
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 })
  fs.renameSync(tmp, file)
}

function nowIso(): string {
  return new Date().toISOString()
}

function hashTicket(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex")
}

function newId(): string {
  return "db_" + randomBytes(8).toString("hex")
}

type SessionFile = { sessions: CompanionSession[] }
type TicketFile = { tickets: CompanionTicket[] }
type SignalFile = { signals: SignalEnvelope[]; seq: Record<string, number> }

function readSessions(): CompanionSession[] {
  return readJson<SessionFile>(sessionsFile(), { sessions: [] }).sessions || []
}
function writeSessions(sessions: CompanionSession[]): void {
  writeJson(sessionsFile(), { sessions })
}
function readTickets(): CompanionTicket[] {
  return readJson<TicketFile>(ticketsFile(), { tickets: [] }).tickets || []
}
function writeTickets(tickets: CompanionTicket[]): void {
  writeJson(ticketsFile(), { tickets })
}
function readSignals(): SignalFile {
  const raw = readJson<SignalFile>(signalsFile(), { signals: [], seq: {} })
  return { signals: raw.signals || [], seq: raw.seq || {} }
}
function writeSignals(file: SignalFile): void {
  writeJson(signalsFile(), file)
}

function isExpired(s: CompanionSession, now = Date.now()): boolean {
  if (s.endedAt) return true
  if (Date.parse(s.expiresAt) <= now) return true
  if (now - Date.parse(s.updatedAt) > IDLE_MS) return true
  return false
}

function live(s: CompanionSession, now = Date.now()): boolean {
  return !isExpired(s, now)
}

/** Drop ended / idle / over-capacity sessions and their tickets + signals. */
export function purgeExpired(): void {
  const now = Date.now()
  const all = readSessions()
  const kept = all.filter((s) => !isExpired(s, now)).slice(-MAX_SESSIONS)
  const keptIds = new Set(kept.map((s) => s.id))
  if (kept.length !== all.length) writeSessions(kept)
  const tickets = readTickets().filter(
    (t) => keptIds.has(t.sessionId) && Date.parse(t.expiresAt) > now,
  )
  writeTickets(tickets)
  const sf = readSignals()
  sf.signals = sf.signals.filter((m) => keptIds.has(m.sessionId))
  for (const id of Object.keys(sf.seq)) {
    if (!keptIds.has(id)) delete sf.seq[id]
  }
  writeSignals(sf)
}

function stamp(session: CompanionSession, patch: Partial<CompanionSession> = {}): CompanionSession {
  const updatedAt = nowIso()
  const expiresAt = new Date(Math.min(Date.parse(session.expiresAt), Date.now() + IDLE_MS + 60_000)).toISOString()
  // Don't shrink max lifetime below remaining; extend idle window from now.
  const maxEnd = Date.parse(session.createdAt) + MAX_SESSION_MS
  const idleEnd = Date.now() + IDLE_MS
  return {
    ...session,
    ...patch,
    updatedAt,
    expiresAt: new Date(Math.min(maxEnd, idleEnd)).toISOString(),
    lattice_sync: false,
  }
}

export function listSessions(opts: { liveOnly?: boolean } = {}): CompanionSession[] {
  purgeExpired()
  const all = readSessions().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  if (opts.liveOnly) return all.filter((s) => live(s))
  return all
}

export function getSession(id: string): CompanionSession | null {
  if (!id) return null
  purgeExpired()
  const s = readSessions().find((x) => x.id === id) || null
  if (!s) return null
  if (isExpired(s)) return null
  return s
}

export function createSession(input: {
  label?: string
  role: CompanionRole
}): { ok: true; session: CompanionSession; ticket: string; role: CompanionRole } | { ok: false; error: string } {
  purgeExpired()
  const all = readSessions()
  if (all.filter((s) => live(s)).length >= MAX_SESSIONS) {
    return { ok: false, error: "too_many_sessions" }
  }
  const createdAt = nowIso()
  const session: CompanionSession = {
    id: newId(),
    label: String(input.label || (input.role === "phone" ? "Phone bodycam" : "Hub seat")).trim().slice(0, 80) || "Device",
    createdAt,
    updatedAt: createdAt,
    expiresAt: new Date(Date.now() + Math.min(MAX_SESSION_MS, IDLE_MS)).toISOString(),
    media: {},
    lattice_sync: false,
  }
  if (input.role === "phone") session.phoneJoinedAt = createdAt
  if (input.role === "hub") session.hubJoinedAt = createdAt
  all.push(session)
  writeSessions(all)
  const ticket = issueTicket(session.id, input.role, session.expiresAt)
  return { ok: true, session, ticket: ticket.raw, role: input.role }
}

export function joinSession(input: {
  sessionId: string
  role: CompanionRole
}): { ok: true; session: CompanionSession; ticket: string; role: CompanionRole } | { ok: false; error: string } {
  purgeExpired()
  const all = readSessions()
  const idx = all.findIndex((s) => s.id === input.sessionId)
  if (idx < 0) return { ok: false, error: "not_found" }
  if (isExpired(all[idx])) return { ok: false, error: "expired" }
  const now = nowIso()
  const patch: Partial<CompanionSession> = {}
  if (input.role === "phone") patch.phoneJoinedAt = all[idx].phoneJoinedAt || now
  if (input.role === "hub") patch.hubJoinedAt = now // last hub to join takes the seat
  all[idx] = stamp(all[idx], patch)
  writeSessions(all)
  const ticket = issueTicket(all[idx].id, input.role, all[idx].expiresAt)
  return { ok: true, session: all[idx], ticket: ticket.raw, role: input.role }
}

export function endSession(id: string): boolean {
  const all = readSessions()
  const idx = all.findIndex((s) => s.id === id)
  if (idx < 0) return false
  all[idx] = { ...all[idx], endedAt: nowIso(), updatedAt: nowIso(), lattice_sync: false }
  writeSessions(all)
  writeTickets(readTickets().filter((t) => t.sessionId !== id))
  const sf = readSignals()
  // keep a short hangup trail, then listeners can flush
  publishInProcess(id, {
    id: randomUUID(),
    seq: (sf.seq[id] || 0) + 1,
    sessionId: id,
    from: "hub",
    kind: "hangup",
    payload: { reason: "session_ended" },
    ts: nowIso(),
  })
  return true
}

export function updateMedia(sessionId: string, media: MediaState): CompanionSession | null {
  const all = readSessions()
  const idx = all.findIndex((s) => s.id === sessionId)
  if (idx < 0 || isExpired(all[idx])) return null
  all[idx] = stamp(all[idx], { media: { ...all[idx].media, ...media } })
  writeSessions(all)
  return all[idx]
}

export function recordTelemetry(
  sessionId: string,
  raw: Partial<CompanionTelemetry>,
): { ok: true; telemetry: CompanionTelemetry } | { ok: false; error: string } {
  const all = readSessions()
  const idx = all.findIndex((s) => s.id === sessionId)
  if (idx < 0 || isExpired(all[idx])) return { ok: false, error: "not_found" }
  const telemetry = sanitizeTelemetry(raw)
  all[idx] = stamp(all[idx], { lastTelemetry: telemetry })
  writeSessions(all)
  return { ok: true, telemetry }
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

function sanitizeTelemetry(raw: Partial<CompanionTelemetry>): CompanionTelemetry {
  const out: CompanionTelemetry = { ts: nowIso() }
  const g = raw.geo
  if (g && Number.isFinite(g.lat) && Number.isFinite(g.lon)) {
    out.geo = {
      lat: clamp(Number(g.lat), -90, 90),
      lon: clamp(Number(g.lon), -180, 180),
    }
    if (g.accuracy != null) out.geo.accuracy = clamp(Number(g.accuracy), 0, 1_000_000)
    if (g.altitude != null && Number.isFinite(g.altitude)) out.geo.altitude = clamp(Number(g.altitude), -2000, 100_000)
    if (g.heading != null && Number.isFinite(g.heading)) out.geo.heading = clamp(Number(g.heading), 0, 360)
    if (g.speed != null && Number.isFinite(g.speed)) out.geo.speed = clamp(Number(g.speed), 0, 400)
  }
  const b = raw.battery
  if (b && Number.isFinite(b.level)) {
    out.battery = { level: clamp(Number(b.level), 0, 1), charging: !!b.charging }
  }
  const n = raw.network
  if (n) {
    out.network = {
      type: n.type ? String(n.type).slice(0, 32) : undefined,
      effectiveType: n.effectiveType ? String(n.effectiveType).slice(0, 32) : undefined,
      downlink: n.downlink != null && Number.isFinite(n.downlink) ? clamp(Number(n.downlink), 0, 10_000) : undefined,
      rtt: n.rtt != null && Number.isFinite(n.rtt) ? clamp(Number(n.rtt), 0, 60_000) : undefined,
    }
  }
  if (raw.label) out.label = String(raw.label).slice(0, 80)
  return out
}

export function issueTicket(
  sessionId: string,
  role: CompanionRole,
  expiresAt: string,
): { raw: string; record: CompanionTicket } {
  const raw = randomBytes(TICKET_BYTES).toString("hex")
  const record: CompanionTicket = {
    hash: hashTicket(raw),
    sessionId,
    role,
    createdAt: nowIso(),
    expiresAt,
  }
  // One live ticket per role per session — previous tickets for that seat are revoked.
  const rest = readTickets().filter((t) => !(t.sessionId === sessionId && t.role === role))
  rest.push(record)
  writeTickets(rest)
  return { raw, record }
}

export function resolveTicket(
  raw: string | null | undefined,
): { ok: true; ticket: CompanionTicket; session: CompanionSession } | { ok: false; error: string } {
  if (!raw) return { ok: false, error: "no_ticket" }
  const hash = hashTicket(String(raw).trim())
  const rec = readTickets().find((t) => t.hash === hash)
  if (!rec) return { ok: false, error: "invalid_ticket" }
  if (Date.parse(rec.expiresAt) <= Date.now()) return { ok: false, error: "expired_ticket" }
  const session = getSession(rec.sessionId)
  if (!session) return { ok: false, error: "expired_session" }
  return { ok: true, ticket: rec, session }
}

export function extractCompanionTicket(req: Request): string | null {
  const header = req.headers.get("x-companion-ticket")
  if (header && header.trim()) return header.trim()
  try {
    const url = new URL(req.url)
    const q = url.searchParams.get("ticket")
    if (q && q.trim()) return q.trim()
  } catch {
    /* ignore */
  }
  return null
}

const listeners = new Map<string, Set<(msg: SignalEnvelope) => void>>()

function publishInProcess(sessionId: string, msg: SignalEnvelope): void {
  const set = listeners.get(sessionId)
  if (!set) return
  for (const cb of set) {
    try {
      cb(msg)
    } catch {
      /* ignore broken subscriber */
    }
  }
}

export function subscribeSignals(sessionId: string, cb: (msg: SignalEnvelope) => void): () => void {
  let set = listeners.get(sessionId)
  if (!set) {
    set = new Set()
    listeners.set(sessionId, set)
  }
  set.add(cb)
  return () => {
    set!.delete(cb)
    if (set!.size === 0) listeners.delete(sessionId)
  }
}

export function pushSignal(input: {
  sessionId: string
  from: CompanionRole
  kind: SignalKind
  payload: unknown
}): { ok: true; signal: SignalEnvelope } | { ok: false; error: string } {
  const session = getSession(input.sessionId)
  if (!session) return { ok: false, error: "not_found" }
  const kind = input.kind
  const allowed: SignalKind[] = ["offer", "answer", "ice", "hangup", "media-state", "navigate", "presence"]
  if (!allowed.includes(kind)) return { ok: false, error: "bad_kind" }
  const payload = sanitizePayload(kind, input.payload)
  if (payload === undefined) return { ok: false, error: "bad_payload" }

  const sf = readSignals()
  const seq = (sf.seq[input.sessionId] || 0) + 1
  sf.seq[input.sessionId] = seq
  const signal: SignalEnvelope = {
    id: randomUUID(),
    seq,
    sessionId: input.sessionId,
    from: input.from,
    kind,
    payload,
    ts: nowIso(),
  }
  sf.signals.push(signal)
  // keep a rolling window across all sessions
  if (sf.signals.length > MAX_SIGNALS * 4) {
    sf.signals = sf.signals.slice(-MAX_SIGNALS * 3)
  }
  const per = sf.signals.filter((s) => s.sessionId === input.sessionId)
  if (per.length > MAX_SIGNALS) {
    const drop = new Set(per.slice(0, per.length - MAX_SIGNALS).map((s) => s.id))
    sf.signals = sf.signals.filter((s) => !drop.has(s.id))
  }
  writeSignals(sf)

  if (kind === "media-state" && payload && typeof payload === "object") {
    updateMedia(input.sessionId, payload as MediaState)
  }
  if (kind === "hangup") {
    // leave session live so a re-offer can happen; just clear media flags
    updateMedia(input.sessionId, {
      phoneCam: false,
      phoneMic: false,
      hubCam: false,
      hubMic: false,
    })
  }
  // touch session
  const all = readSessions()
  const idx = all.findIndex((s) => s.id === input.sessionId)
  if (idx >= 0) {
    all[idx] = stamp(all[idx])
    writeSessions(all)
  }

  publishInProcess(input.sessionId, signal)
  return { ok: true, signal }
}

function sanitizePayload(kind: SignalKind, payload: unknown): unknown | undefined {
  if (kind === "ice") {
    if (payload == null) return null // end-of-candidates
    if (typeof payload !== "object") return undefined
    const p = payload as Record<string, unknown>
    return {
      candidate: p.candidate != null ? String(p.candidate).slice(0, 4000) : null,
      sdpMid: p.sdpMid != null ? String(p.sdpMid).slice(0, 64) : null,
      sdpMLineIndex: typeof p.sdpMLineIndex === "number" ? p.sdpMLineIndex : null,
      usernameFragment: p.usernameFragment != null ? String(p.usernameFragment).slice(0, 256) : undefined,
    }
  }
  if (kind === "offer" || kind === "answer") {
    if (!payload || typeof payload !== "object") return undefined
    const p = payload as Record<string, unknown>
    const type = p.type === "offer" || p.type === "answer" || p.type === "pranswer" || p.type === "rollback" ? p.type : null
    const sdp = typeof p.sdp === "string" ? p.sdp.slice(0, 200_000) : null
    if (!type || !sdp) return undefined
    return { type, sdp }
  }
  if (kind === "hangup") {
    return { reason: payload && typeof payload === "object" && "reason" in payload ? String((payload as { reason?: string }).reason || "hangup").slice(0, 80) : "hangup" }
  }
  if (kind === "media-state") {
    if (!payload || typeof payload !== "object") return {}
    const p = payload as Record<string, unknown>
    const out: MediaState & { wantRenegotiate?: boolean } = {}
    if (typeof p.phoneCam === "boolean") out.phoneCam = p.phoneCam
    if (typeof p.phoneMic === "boolean") out.phoneMic = p.phoneMic
    if (typeof p.hubCam === "boolean") out.hubCam = p.hubCam
    if (typeof p.hubMic === "boolean") out.hubMic = p.hubMic
    if (p.wantRenegotiate === true) (out as { wantRenegotiate?: boolean }).wantRenegotiate = true
    return out
  }
  if (kind === "navigate") {
    if (!payload || typeof payload !== "object") return undefined
    const p = payload as Record<string, unknown>
    const path = typeof p.path === "string" ? p.path : ""
    const safe = safeHubPath(path)
    if (!safe) return undefined
    return { path: safe }
  }
  if (kind === "presence") {
    return { ok: true }
  }
  return undefined
}

export function listSignalsAfter(sessionId: string, afterSeq: number): SignalEnvelope[] {
  const sf = readSignals()
  return sf.signals.filter((s) => s.sessionId === sessionId && s.seq > afterSeq).sort((a, b) => a.seq - b.seq)
}

/** Relative hub path only — no protocol, no `//`, no `..`. */
export function safeHubPath(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null
  const path = raw.trim()
  if (!path.startsWith("/")) return null
  if (path.startsWith("//") || path.includes("://") || path.includes("\\") || path.includes("..")) return null
  if (path.length > 240) return null
  if (/[\s<>"']/.test(path)) return null
  return path
}

export function publicStatus(): PublicCompanionStatus {
  purgeExpired()
  const tokenConfigured = hasConfiguredHubToken()
  const secure = isSecureMode()
  return {
    ok: true,
    surface: "companion",
    authRequired: tokenConfigured || secure,
    secureMode: secure,
    tokenConfigured,
    liveSessionCount: readSessions().filter((s) => live(s)).length,
    httpsRequired: true,
    httpsHint: COMPANION_HTTPS_HINT,
    limits: { ...COMPANION_LIMITS },
    features: {
      phoneCam: true,
      phoneMic: true,
      telemetry: true,
      hubCam: true,
      remoteActions: ["heartbeat", "open", "list_modules"],
    },
  }
}

/** Test helper — wipe the data dir. */
export function _resetCompanionStoreForTests(): void {
  listeners.clear()
  const dir = rootDir()
  try {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
}

export { FIELD_MODULES }
