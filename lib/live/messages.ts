
/**
 * Real encrypted local messaging. Messages are AES-256-GCM encrypted at rest
 * in local-data/messages and decrypted only on read. This is not a public
 * messenger; it is a working encrypted store on this host (and can be pointed
 * at a real Matrix/XMPP homeserver later via env).
 */
import fs from "fs"
import path from "path"
import crypto from "crypto"

const DIR = path.join(process.cwd(), "local-data", "messages")
const KEY_FILE = path.join(DIR, "key")
const STORE = path.join(DIR, "messages.jsonl")

export interface PlainMessage {
  id: string
  ts: string
  from: string
  to: string
  body: string
  channel: string
}

function ensure() {
  fs.mkdirSync(DIR, { recursive: true, mode: 0o700 })
  if (!fs.existsSync(KEY_FILE)) {
    const envKey = process.env.HUB_MESSAGES_KEY?.trim()
    const key = envKey && Buffer.from(envKey, "base64").length === 32 ? Buffer.from(envKey, "base64") : crypto.randomBytes(32)
    fs.writeFileSync(KEY_FILE, key, { mode: 0o600 })
  }
}

function key(): Buffer {
  ensure()
  return fs.readFileSync(KEY_FILE)
}

function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv)
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString("base64")
}

function decrypt(blob: string): string {
  const buf = Buffer.from(blob, "base64")
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const enc = buf.subarray(28)
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8")
}

export function listMessages(channel?: string, limit = 200): { ok: true; backend: string; live: true; messages: PlainMessage[]; count: number } {
  ensure()
  const messages: PlainMessage[] = []
  if (fs.existsSync(STORE)) {
    const lines = fs.readFileSync(STORE, "utf8").split("\n").filter(Boolean)
    for (const line of lines) {
      try {
        const row = JSON.parse(line) as { ct: string }
        const msg = JSON.parse(decrypt(row.ct)) as PlainMessage
        if (!channel || msg.channel === channel) messages.push(msg)
      } catch {
        /* skip corrupt */
      }
    }
  }
  return {
    ok: true,
    backend: "AES-256-GCM file store (live, local-data/messages)",
    live: true,
    messages: messages.slice(-limit),
    count: messages.length,
  }
}

export function sendMessage(input: { from?: string; to?: string; body: string; channel?: string }): { ok: true; message: PlainMessage; backend: string } | { ok: false; error: string } {
  const body = (input.body || "").trim()
  if (!body) return { ok: false, error: "body required" }
  if (body.length > 8000) return { ok: false, error: "body too long" }
  ensure()
  const msg: PlainMessage = {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    from: (input.from || "S3v3n@SingularityDefense").slice(0, 120),
    to: (input.to || "operator").slice(0, 120),
    body,
    channel: (input.channel || "default").slice(0, 80),
  }
  const row = JSON.stringify({ ts: msg.ts, id: msg.id, ct: encrypt(JSON.stringify(msg)) })
  fs.appendFileSync(STORE, row + "\n", { mode: 0o600 })
  return { ok: true, message: msg, backend: "AES-256-GCM file store (live)" }
}
