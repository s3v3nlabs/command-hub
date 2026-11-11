/**
 * File-backed deception store under data/offsec/deception/ (gitignored) for
 * decoys/canaries/profiles, and local-data/deception-quarantine/ for samples.
 * Every event is mirrored to the Heimdall IDS ring AND the eyes-only encrypted log.
 */

import fs from "fs"
import path from "path"
import crypto, { randomUUID } from "crypto"
import type {
  AttackerProfile,
  CanaryToken,
  CapturedSample,
  Decoy,
  DeceptionEvent,
} from "./types"
import { recordIdsThreat } from "@/lib/security/ids-status"
import { appendEyesOnly } from "@/lib/heimdall/eyes-only"

const DIR = path.join(process.cwd(), "data", "offsec", "deception")
const QUAR = path.join(process.cwd(), "local-data", "deception-quarantine")
const DECOYS = path.join(DIR, "decoys.json")
const CANARIES = path.join(DIR, "canaries.json")
const PROFILES = path.join(DIR, "profiles.json")
const SAMPLES = path.join(DIR, "samples.json")
const EVENTS = path.join(DIR, "events.jsonl")

function ensure() {
  fs.mkdirSync(DIR, { recursive: true, mode: 0o700 })
}
function ensureQuar() {
  fs.mkdirSync(QUAR, { recursive: true, mode: 0o700 })
}
function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback
    return JSON.parse(fs.readFileSync(file, "utf8")) as T
  } catch {
    return fallback
  }
}
function writeJson(file: string, data: unknown) {
  ensure()
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", { mode: 0o600 })
}

// ── decoys ────────────────────────────────────────────────────────────────
const DEFAULT_DECOYS: Omit<Decoy, "createdAt" | "hits">[] = [
  { id: "usb-decoy-E", kind: "usb", label: "Removable Drive (E:) decoy", surface: "E:\\ (emulated removable)", banner: "AUTORUN.INF; payload.lnk", tarpitMs: 0, active: true },
  { id: "serial-com3", kind: "serial", label: "Serial COM3 decoy", surface: "COM3 / /dev/ttyUSB-decoy", banner: "AT\r\nOK", tarpitMs: 1500, active: true },
  { id: "svc-telnet", kind: "service", label: "Fake telnet", surface: "tcp/23 (emulated)", banner: "Welcome to BusyBox telnet", tarpitMs: 3000, active: true },
  { id: "route-maze", kind: "route", label: "Maze admin route", surface: "/admin/legacy/console", banner: "Apache/2.2.8 admin", tarpitMs: 2000, active: true },
]

export function listDecoys(): Decoy[] {
  const stored = readJson<Decoy[]>(DECOYS, [])
  if (stored.length) return stored
  const seeded: Decoy[] = DEFAULT_DECOYS.map((d) => ({ ...d, createdAt: new Date().toISOString(), hits: 0 }))
  writeJson(DECOYS, seeded)
  return seeded
}

export function recordDecoyHit(
  decoyId: string,
  info: { fingerprint?: string; tooling?: string; source?: string; meta?: Record<string, unknown> } = {},
): DeceptionEvent {
  const all = listDecoys()
  const d = all.find((x) => x.id === decoyId)
  if (d) {
    d.hits += 1
    d.lastHitAt = new Date().toISOString()
    writeJson(DECOYS, all)
  }
  if (info.fingerprint) {
    upsertProfile(info.fingerprint, { tooling: info.tooling ? [info.tooling] : [], source: info.source })
  }
  return emitEvent({
    kind: "decoy_hit",
    decoyId,
    message: `Decoy ${d?.label || decoyId} touched${info.tooling ? ` by ${info.tooling}` : ""}`,
    severity: "high",
    fingerprint: info.fingerprint,
    meta: info.meta,
  })
}

// ── canaries ────────────────────────────────────────────────────────────────
export function listCanaries(): CanaryToken[] {
  return readJson<CanaryToken[]>(CANARIES, [])
}
export function createCanary(input: { label: string; placement: string; engagementId?: string }): CanaryToken {
  const all = listCanaries()
  const token = `CANARY-${crypto.randomBytes(12).toString("hex")}` // not a real secret
  const c: CanaryToken = {
    id: randomUUID(),
    label: input.label.slice(0, 160),
    token,
    placement: input.placement.slice(0, 400),
    createdAt: new Date().toISOString(),
    triggered: false,
    engagementId: input.engagementId,
  }
  all.push(c)
  writeJson(CANARIES, all)
  return c
}
export function triggerCanary(tokenOrId: string, info: { fingerprint?: string; source?: string } = {}): DeceptionEvent | null {
  const all = listCanaries()
  const c = all.find((x) => x.token === tokenOrId || x.id === tokenOrId)
  if (!c) return null
  c.triggered = true
  c.triggeredAt = new Date().toISOString()
  writeJson(CANARIES, all)
  if (info.fingerprint) upsertProfile(info.fingerprint, { ttps: ["credential-use:canary"], source: info.source })
  return emitEvent({
    kind: "canary_trigger",
    canaryId: c.id,
    message: `Canary "${c.label}" fired — planted at ${c.placement}`,
    severity: "critical",
    fingerprint: info.fingerprint,
  })
}

// ── profiles / fingerprinting ────────────────────────────────────────────────
export function listProfiles(): AttackerProfile[] {
  return readJson<AttackerProfile[]>(PROFILES, [])
}
export function upsertProfile(
  fingerprint: string,
  add: { tooling?: string[]; ttps?: string[]; source?: string; timingMs?: number } = {},
): AttackerProfile {
  const all = listProfiles()
  let p = all.find((x) => x.fingerprint === fingerprint)
  const now = new Date().toISOString()
  if (!p) {
    p = { id: randomUUID(), fingerprint, firstSeen: now, lastSeen: now, hitCount: 0, tooling: [], ttps: [], timingMs: [], sourceHints: [] }
    all.push(p)
  }
  p.lastSeen = now
  p.hitCount += 1
  for (const t of add.tooling || []) if (t && !p.tooling.includes(t)) p.tooling.push(t)
  for (const t of add.ttps || []) if (t && !p.ttps.includes(t)) p.ttps.push(t)
  if (add.source && !p.sourceHints.includes(add.source)) p.sourceHints.push(add.source)
  if (add.timingMs != null) p.timingMs.push(add.timingMs)
  writeJson(PROFILES, all)
  return p
}

// ── samples ──────────────────────────────────────────────────────────────────
export function listSamples(): CapturedSample[] {
  return readJson<CapturedSample[]>(SAMPLES, [])
}
export function captureSample(input: {
  buffer: Buffer
  filename?: string
  mime?: string
  decoyId?: string
  engagementId?: string
}): CapturedSample {
  ensureQuar()
  const sha256 = crypto.createHash("sha256").update(input.buffer).digest("hex")
  const quarantinePath = path.join(QUAR, `${sha256}.bin`)
  // Store inert: write raw bytes, no execution, restrictive perms, non-executable name.
  if (!fs.existsSync(quarantinePath)) {
    fs.writeFileSync(quarantinePath, input.buffer, { mode: 0o600 })
  }
  const metadata: Record<string, unknown> = {
    sizeBytes: input.buffer.length,
    header_hex: input.buffer.subarray(0, 16).toString("hex"),
    magic: sniffMagic(input.buffer),
    entropy: shannonEntropy(input.buffer.subarray(0, 4096)),
  }
  const sample: CapturedSample = {
    id: randomUUID(),
    sha256,
    sizeBytes: input.buffer.length,
    filename: input.filename?.slice(0, 200),
    mime: input.mime?.slice(0, 120),
    decoyId: input.decoyId,
    engagementId: input.engagementId,
    capturedAt: new Date().toISOString(),
    quarantinePath: `local-data/deception-quarantine/${sha256}.bin`,
    metadata,
  }
  const all = listSamples()
  if (!all.find((s) => s.sha256 === sha256)) {
    all.push(sample)
    writeJson(SAMPLES, all)
  }
  emitEvent({
    kind: "sample_capture",
    sampleSha256: sha256,
    message: `Captured + quarantined sample ${sha256.slice(0, 16)} (${input.buffer.length} bytes)`,
    severity: "high",
    meta: metadata,
  })
  return all.find((s) => s.sha256 === sha256) || sample
}

export function updateSampleVt(sha256: string, vt: CapturedSample["vt"]): CapturedSample | null {
  const all = listSamples()
  const s = all.find((x) => x.sha256 === sha256)
  if (!s) return null
  s.vt = vt
  writeJson(SAMPLES, all)
  return s
}

function sniffMagic(buf: Buffer): string {
  const h = buf.subarray(0, 4)
  if (h[0] === 0x4d && h[1] === 0x5a) return "PE/MZ (Windows executable)"
  if (h[0] === 0x7f && h[1] === 0x45 && h[2] === 0x4c && h[3] === 0x46) return "ELF"
  if (h[0] === 0x50 && h[1] === 0x4b) return "ZIP/Office/JAR"
  if (h[0] === 0x25 && h[1] === 0x50 && h[2] === 0x44 && h[3] === 0x46) return "PDF"
  if (h[0] === 0xca && h[1] === 0xfe && h[2] === 0xba && h[3] === 0xbe) return "Mach-O fat"
  return "unknown"
}

function shannonEntropy(buf: Buffer): number {
  if (!buf.length) return 0
  const counts = new Array(256).fill(0)
  for (const b of buf) counts[b]++
  let e = 0
  for (const c of counts) {
    if (!c) continue
    const p = c / buf.length
    e -= p * Math.log2(p)
  }
  return Number(e.toFixed(3))
}

// ── events ──────────────────────────────────────────────────────────────────
export function emitEvent(input: Omit<DeceptionEvent, "id" | "ts">): DeceptionEvent {
  ensure()
  const ev: DeceptionEvent = { id: randomUUID(), ts: new Date().toISOString(), ...input }
  fs.appendFileSync(EVENTS, JSON.stringify(ev) + "\n", { mode: 0o600 })
  // Mirror to Heimdall IDS ring
  recordIdsThreat({
    severity: ev.severity,
    source: "deception-mesh",
    message: ev.message,
    blocked: false,
    meta: { kind: ev.kind, decoyId: ev.decoyId, canaryId: ev.canaryId, fingerprint: ev.fingerprint },
  })
  // Mirror to Heimdall eyes-only encrypted log (sealed; no plaintext on disk)
  appendEyesOnly({ type: "deception_event", ...ev })
  return ev
}

export function listEvents(limit = 200): DeceptionEvent[] {
  try {
    if (!fs.existsSync(EVENTS)) return []
    const lines = fs.readFileSync(EVENTS, "utf8").trim().split("\n").filter(Boolean)
    return lines.slice(-limit).map((l) => JSON.parse(l) as DeceptionEvent).reverse()
  } catch {
    return []
  }
}

/** Build a cheap attacker fingerprint from request-ish signals. */
export function fingerprintFrom(signals: { ua?: string; ip?: string; tooling?: string; headersHash?: string }): string {
  const basis = [signals.ua || "", signals.tooling || "", signals.headersHash || ""].join("|")
  return crypto.createHash("sha256").update(basis || randomUUID()).digest("hex").slice(0, 16)
}
