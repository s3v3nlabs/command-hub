/**
 * Cross-hub AI hive bus (team Command Hubs — NOT Vyrna lattice).
 * Every event carries lattice_sync: false and HOLD_VYRNA_UNSYNC.
 * Privacy Fortress: never log prompt bodies.
 */

import fs from "fs"
import path from "path"
import { randomUUID, createHash } from "crypto"

export type HiveEvent = {
  id: string
  fromHub: string
  toHub?: string
  panel?: string
  promptHash: string
  promptLen: number
  createdAt: string
  consensus?: unknown
  peerFanout?: { url: string; ok: boolean; status?: number }[]
  lattice_sync: false
  hold: "HOLD_VYRNA_UNSYNC"
}

const STORE_DIR =
  process.env.S3V3N_HIVE_DIR || path.join(process.cwd(), "data", "hive")
const STORE_FILE = path.join(STORE_DIR, "events.jsonl")
const MAX_EVENTS = 300

function ensureStore(): void {
  fs.mkdirSync(STORE_DIR, { recursive: true, mode: 0o700 })
}

function readEvents(): HiveEvent[] {
  try {
    if (!fs.existsSync(STORE_FILE)) return []
    return fs
      .readFileSync(STORE_FILE, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as HiveEvent
        } catch {
          return null
        }
      })
      .filter((e): e is HiveEvent => Boolean(e))
      .map((e) => ({ ...e, lattice_sync: false as const, hold: "HOLD_VYRNA_UNSYNC" as const }))
  } catch {
    return []
  }
}

function appendEvent(ev: HiveEvent): void {
  ensureStore()
  fs.appendFileSync(STORE_FILE, JSON.stringify(ev) + "\n", { mode: 0o600 })
  const all = readEvents()
  if (all.length > MAX_EVENTS) {
    const trimmed = all.slice(-MAX_EVENTS)
    fs.writeFileSync(STORE_FILE, trimmed.map((e) => JSON.stringify(e)).join("\n") + "\n", { mode: 0o600 })
  }
}

export function getHivePeers(): string[] {
  const raw = process.env.S3V3N_HIVE_PEERS || ""
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s))
}

export function hiveSecretConfigured(): boolean {
  return Boolean(process.env.S3V3N_HIVE_SECRET && process.env.S3V3N_HIVE_SECRET.trim())
}

/** Best-effort fan-out to peer /api/hive. Skips if peers or secret unset. Never logs prompt. */
async function fanoutPeers(payload: {
  fromHub: string
  toHub?: string
  prompt: string
  panel?: string
  lattice_sync: false
  hold: "HOLD_VYRNA_UNSYNC"
}): Promise<{ url: string; ok: boolean; status?: number }[]> {
  const peers = getHivePeers()
  const secret = process.env.S3V3N_HIVE_SECRET?.trim()
  if (!peers.length || !secret) return []
  const results: { url: string; ok: boolean; status?: number }[] = []
  await Promise.all(
    peers.map(async (base) => {
      const url = base.replace(/\/$/, "") + "/api/hive"
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-s3v3n-hive-secret": secret,
            S3V3N_HIVE_SECRET: secret,
          },
          body: JSON.stringify({ ...payload, _peerRelay: true }),
          signal: AbortSignal.timeout(8000),
        })
        results.push({ url, ok: res.ok, status: res.status })
      } catch {
        results.push({ url, ok: false })
      }
    }),
  )
  return results
}

async function tryLocalPanel(prompt: string, panel?: string): Promise<unknown | null> {
  try {
    const { runS3v3nPanel } = await import("@/lib/selfHealing/S3v3nPanel")
    const result = await runS3v3nPanel(prompt, {
      preferSeat: panel,
      includeOwnedCloud: false,
    })
    // Strip large body fields for store — keep metadata/consensus shape only
    return {
      ok: result.ok,
      source: result.source,
      privacyMode: result.privacyMode,
      leaderboard: result.leaderboard,
      adapters: result.adapters,
      aggregatePreview: result.aggregate ? String(result.aggregate.response || "").slice(0, 240) : null,
      lattice_sync: false,
      hold: "HOLD_VYRNA_UNSYNC",
    }
  } catch {
    return null
  }
}

export async function postHive(input: {
  fromHub: string
  toHub?: string
  prompt: string
  panel?: string
  skipPeerFanout?: boolean
}): Promise<
  | { ok: true; event: HiveEvent; panelInvoked: boolean }
  | { ok: false; error: string }
> {
  const prompt = typeof input.prompt === "string" ? input.prompt.trim() : ""
  if (!prompt) return { ok: false, error: "prompt is required" }
  if (prompt.length > 32000) return { ok: false, error: "prompt too long" }
  const fromHub = (input.fromHub || "local").slice(0, 64)
  const promptHash = createHash("sha256").update(prompt).digest("hex").slice(0, 16)

  const consensus = await tryLocalPanel(prompt, input.panel)
  const peerFanout =
    input.skipPeerFanout
      ? []
      : await fanoutPeers({
          fromHub,
          toHub: input.toHub,
          prompt,
          panel: input.panel,
          lattice_sync: false,
          hold: "HOLD_VYRNA_UNSYNC",
        })

  const event: HiveEvent = {
    id: randomUUID(),
    fromHub,
    toHub: input.toHub?.slice(0, 64),
    panel: input.panel?.slice(0, 64),
    promptHash,
    promptLen: prompt.length,
    createdAt: new Date().toISOString(),
    consensus: consensus ?? undefined,
    peerFanout: peerFanout.length ? peerFanout : undefined,
    lattice_sync: false,
    hold: "HOLD_VYRNA_UNSYNC",
  }
  appendEvent(event)
  return { ok: true, event, panelInvoked: Boolean(consensus) }
}

export function listHiveEvents(limit = 40): HiveEvent[] {
  const n = Math.min(Math.max(limit, 1), 100)
  return readEvents().slice(-n).reverse()
}

export function hiveStatus() {
  const events = readEvents()
  const last = events.length ? events[events.length - 1] : null
  return {
    ok: true,
    service: "s3v3n-hive",
    peers: getHivePeers(),
    peerCount: getHivePeers().length,
    secretConfigured: hiveSecretConfigured(),
    eventCount: events.length,
    lastSync: last?.createdAt ?? null,
    lastEventId: last?.id ?? null,
    hold: "HOLD_VYRNA_UNSYNC" as const,
    lattice_sync: false as const,
    note: "Team hub bus only — not Vyrna lattice. Prompt bodies never logged.",
  }
}

/** Optional inbound peer auth check (header name S3V3N_HIVE_SECRET or x-s3v3n-hive-secret). */
export function verifyHiveSecret(req: Request): boolean {
  const expected = process.env.S3V3N_HIVE_SECRET?.trim()
  if (!expected) return true // open local when unset
  const got =
    req.headers.get("x-s3v3n-hive-secret") ||
    req.headers.get("S3V3N_HIVE_SECRET") ||
    ""
  return got === expected
}
