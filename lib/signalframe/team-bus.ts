/**
 * Signalframe team messaging bus — local encrypted-capable store.
 * Channels: team | whisper | system
 * Privacy Fortress: never log message bodies. HOLD_VYRNA_UNSYNC.
 */

import fs from "fs"
import path from "path"
import { randomUUID, createHash } from "crypto"
import { encryptAtRest, decryptAtRest, isEncryptionAvailable, type EncryptedBlob } from "@/lib/privacy/localCrypto"

export type TeamChannel = "team" | "whisper" | "system"

export type TeamMessage = {
  id: string
  channel: TeamChannel
  from: string
  body: string
  createdAt: string
  lattice_sync: false
}

type StoredEnvelope =
  | { v: 1; enc: true; blob: EncryptedBlob; meta: { id: string; channel: TeamChannel; from: string; createdAt: string; bodyHash: string } }
  | { v: 1; enc: false; message: TeamMessage }

const STORE_DIR =
  process.env.S3V3N_TEAM_BUS_DIR ||
  path.join(process.cwd(), "data", "signalframe-team")
const STORE_FILE = path.join(STORE_DIR, "messages.jsonl")
const MAX_MESSAGES = 500

function ensureStore(): void {
  fs.mkdirSync(STORE_DIR, { recursive: true, mode: 0o700 })
}

function bodyHash(body: string): string {
  return createHash("sha256").update(body).digest("hex").slice(0, 16)
}

function encode(msg: TeamMessage): StoredEnvelope {
  if (isEncryptionAvailable()) {
    const blob = encryptAtRest(JSON.stringify(msg))
    if (blob) {
      return {
        v: 1,
        enc: true,
        blob,
        meta: {
          id: msg.id,
          channel: msg.channel,
          from: msg.from,
          createdAt: msg.createdAt,
          bodyHash: bodyHash(msg.body),
        },
      }
    }
  }
  return { v: 1, enc: false, message: msg }
}

function decode(env: StoredEnvelope): TeamMessage | null {
  if (env.enc) {
    const pt = decryptAtRest(env.blob)
    if (!pt) return null
    try {
      const msg = JSON.parse(pt) as TeamMessage
      return { ...msg, lattice_sync: false }
    } catch {
      return null
    }
  }
  return { ...env.message, lattice_sync: false }
}

function readAllEnvelopes(): StoredEnvelope[] {
  try {
    if (!fs.existsSync(STORE_FILE)) return []
    const lines = fs.readFileSync(STORE_FILE, "utf8").split("\n").filter(Boolean)
    const out: StoredEnvelope[] = []
    for (const line of lines) {
      try {
        out.push(JSON.parse(line) as StoredEnvelope)
      } catch {
        /* skip */
      }
    }
    return out
  } catch {
    return []
  }
}

export function postTeamMessage(input: {
  channel?: TeamChannel
  body: string
  from?: string
}): { ok: true; id: string; channel: TeamChannel; encrypted: boolean; bodyHash: string } | { ok: false; error: string } {
  const body = typeof input.body === "string" ? input.body.trim() : ""
  if (!body) return { ok: false, error: "body is required" }
  if (body.length > 8000) return { ok: false, error: "body too long" }
  const channel: TeamChannel =
    input.channel === "whisper" || input.channel === "system" || input.channel === "team"
      ? input.channel
      : "team"
  const msg: TeamMessage = {
    id: randomUUID(),
    channel,
    from: (input.from || "operator").slice(0, 64),
    body,
    createdAt: new Date().toISOString(),
    lattice_sync: false,
  }
  ensureStore()
  const env = encode(msg)
  fs.appendFileSync(STORE_FILE, JSON.stringify(env) + "\n", { mode: 0o600 })
  // trim file if oversized
  const all = readAllEnvelopes()
  if (all.length > MAX_MESSAGES) {
    const trimmed = all.slice(-MAX_MESSAGES)
    fs.writeFileSync(STORE_FILE, trimmed.map((e) => JSON.stringify(e)).join("\n") + "\n", { mode: 0o600 })
  }
  return {
    ok: true,
    id: msg.id,
    channel,
    encrypted: env.enc === true,
    bodyHash: bodyHash(body),
  }
}

export function listTeamMessages(opts?: {
  channel?: TeamChannel | "all"
  limit?: number
}): TeamMessage[] {
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 200)
  const channel = opts?.channel ?? "all"
  const msgs = readAllEnvelopes()
    .map(decode)
    .filter((m): m is TeamMessage => Boolean(m))
    .filter((m) => (channel === "all" ? true : m.channel === channel))
  return msgs.slice(-limit).reverse()
}

export function teamBusStatus() {
  const count = readAllEnvelopes().length
  return {
    ok: true,
    store: STORE_DIR,
    count,
    encryptionAvailable: isEncryptionAvailable(),
    channels: ["team", "whisper", "system"] as TeamChannel[],
    hold: "HOLD_VYRNA_UNSYNC" as const,
    lattice_sync: false as const,
    note: "Bodies never logged; encrypt-at-rest when Privacy Fortress key available.",
  }
}

/** ADD-ONLY: messages strictly after `since` ISO cursor (for SSE poll). Oldest→newest. */
export function listTeamMessagesSince(opts: {
  channel?: TeamChannel | "all"
  since: string
  limit?: number
}): TeamMessage[] {
  const limit = Math.min(Math.max(opts.limit ?? 40, 1), 200)
  const channel = opts.channel ?? "all"
  const since = opts.since || ""
  const msgs = readAllEnvelopes()
    .map(decode)
    .filter((m): m is TeamMessage => Boolean(m))
    .filter((m) => (channel === "all" ? true : m.channel === channel))
    .filter((m) => (since ? m.createdAt > since : true))
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0))
  return msgs.slice(0, limit).map((m) => ({ ...m, lattice_sync: false as const }))
}
