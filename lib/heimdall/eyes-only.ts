/**
 * HEIMDALL EYES-ONLY encrypted log store.
 *
 * REAL authenticated encryption: AES-256-GCM (Node crypto). The key is held
 * ONLY by the Heimdall subsystem, read from env HEIMDALL_LOG_KEY (32-byte hex
 * or base64, or any passphrase which is HKDF/scrypt-derived). The key is never
 * committed. Decryption is access-gated: only callers that present the Heimdall
 * subsystem token may read plaintext ("only Heimdall crosses the Bifrost").
 *
 * SECURITY NOTE: the confidentiality + integrity guarantee comes from AES-256-GCM
 * (a 96-bit random IV per record, 128-bit auth tag). The glyph / symbol / EchoNexus
 * "resonance" skin (see glyph-skin.ts) is COSMETIC display/obfuscation ONLY and
 * provides NO security. Never represent frequency/resonance/harmonics as security.
 */

import crypto from "crypto"
import fs from "fs"
import path from "path"

const DIR = path.join(process.cwd(), "local-data", "heimdall-eyes-only")
const FILE = path.join(DIR, "log.enc.jsonl")

function ensureDir() {
  fs.mkdirSync(DIR, { recursive: true, mode: 0o700 })
}

/** Derive a 32-byte key from HEIMDALL_LOG_KEY. */
function deriveKey(): Buffer | null {
  const raw = process.env.HEIMDALL_LOG_KEY?.trim()
  if (!raw) return null
  // hex 64 chars
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex")
  // base64 32 bytes
  try {
    const b = Buffer.from(raw, "base64")
    if (b.length === 32) return b
  } catch {
    /* fall through */
  }
  // passphrase → scrypt (fixed salt tied to subsystem; key never leaves server)
  return crypto.scryptSync(raw, "heimdall-eyes-only-v1", 32)
}

export function isHeimdallKeyConfigured(): boolean {
  return deriveKey() !== null
}

/** Only the Heimdall subsystem token may decrypt. */
export function isHeimdallReader(presentedToken: string | null): boolean {
  const want = process.env.HEIMDALL_SUBSYSTEM_TOKEN?.trim() || process.env.HEIMDALL_LOG_KEY?.trim()
  if (!want) return false
  if (!presentedToken) return false
  // constant-time compare
  const a = Buffer.from(presentedToken)
  const b = Buffer.from(want)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export interface EncRecord {
  v: 1
  alg: "aes-256-gcm"
  iv: string
  tag: string
  ct: string
  ts: string
}

export function encryptRecord(plaintext: string): EncRecord | { error: string } {
  const key = deriveKey()
  if (!key) return { error: "heimdall_key_unavailable" }
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    v: 1,
    alg: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ct: ct.toString("base64"),
    ts: new Date().toISOString(),
  }
}

export function decryptRecord(rec: EncRecord): string | { error: string } {
  const key = deriveKey()
  if (!key) return { error: "heimdall_key_unavailable" }
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(rec.iv, "base64"))
    decipher.setAuthTag(Buffer.from(rec.tag, "base64"))
    const pt = Buffer.concat([decipher.update(Buffer.from(rec.ct, "base64")), decipher.final()])
    return pt.toString("utf8")
  } catch {
    return { error: "decrypt_failed_or_tampered" }
  }
}

/** Append an encrypted log line. Returns ok/err; never writes plaintext to disk. */
export function appendEyesOnly(event: Record<string, unknown>): { ok: boolean; error?: string } {
  const enc = encryptRecord(JSON.stringify(event))
  if ("error" in enc) return { ok: false, error: enc.error }
  ensureDir()
  fs.appendFileSync(FILE, JSON.stringify(enc) + "\n", { mode: 0o600 })
  return { ok: true }
}

/** Read + decrypt — Heimdall subsystem only. Returns ciphertext metadata for non-readers. */
export function readEyesOnly(
  presentedToken: string | null,
  limit = 200,
): { authorized: boolean; records: Array<Record<string, unknown>> | Array<{ ts: string; sealed: true }> } {
  let lines: string[] = []
  try {
    if (fs.existsSync(FILE)) lines = fs.readFileSync(FILE, "utf8").trim().split("\n").filter(Boolean)
  } catch {
    lines = []
  }
  const tail = lines.slice(-limit)
  if (!isHeimdallReader(presentedToken)) {
    // Non-readers only ever see that sealed records exist, never plaintext.
    return {
      authorized: false,
      records: tail.map((l) => {
        try {
          const r = JSON.parse(l) as EncRecord
          return { ts: r.ts, sealed: true as const }
        } catch {
          return { ts: "", sealed: true as const }
        }
      }),
    }
  }
  const out: Array<Record<string, unknown>> = []
  for (const l of tail) {
    try {
      const rec = JSON.parse(l) as EncRecord
      const pt = decryptRecord(rec)
      if (typeof pt === "string") out.push({ ts: rec.ts, ...JSON.parse(pt) })
      else out.push({ ts: rec.ts, error: pt.error })
    } catch {
      /* skip */
    }
  }
  return { authorized: true, records: out.reverse() }
}
