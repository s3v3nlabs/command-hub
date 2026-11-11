/**
 * Encrypt-at-rest for panel transcripts (AES-256-GCM via Node crypto).
 * Key from env S3V3N_PRIVACY_KEY, or generated once into reclaim vault (chmod 600).
 * Never commit the key file. Never print the key.
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash, scryptSync } from "crypto"
import fs from "fs"
import path from "path"

export const PRIVACY_VAULT_DIR =
  process.env.S3V3N_PRIVACY_VAULT ||
  "/workspace/chatgpt-vault/raw/live_2026-gap/privacy-vault"

const KEY_FILE = path.join(PRIVACY_VAULT_DIR, "S3V3N_PRIVACY_KEY")

function ensureVaultDir(): void {
  fs.mkdirSync(PRIVACY_VAULT_DIR, { recursive: true, mode: 0o700 })
  try {
    fs.chmodSync(PRIVACY_VAULT_DIR, 0o700)
  } catch {
    /* ignore */
  }
}

/** Derive 32-byte AES key from passphrase or raw hex/base64 material. Never log. */
function deriveKeyMaterial(raw: string): Buffer {
  const trimmed = raw.trim()
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, "hex")
  }
  try {
    const b64 = Buffer.from(trimmed, "base64")
    if (b64.length === 32) return b64
  } catch {
    /* fall through */
  }
  // Passphrase → scrypt (fixed salt label for local reclaim only; not for multi-tenant)
  return scryptSync(trimmed, "s3v3n-privacy-fortress-v1", 32)
}

/**
 * Resolve local privacy key. Prefer env; else read/generate vault file (chmod 600).
 * Returns null if vault unavailable (encryption disabled).
 */
export function resolvePrivacyKey(): Buffer | null {
  const fromEnv = process.env.S3V3N_PRIVACY_KEY
  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return deriveKeyMaterial(fromEnv)
  }
  try {
    ensureVaultDir()
    if (fs.existsSync(KEY_FILE)) {
      const raw = fs.readFileSync(KEY_FILE, "utf8").trim()
      if (raw) return deriveKeyMaterial(raw)
    }
    const generated = randomBytes(32).toString("hex")
    fs.writeFileSync(KEY_FILE, generated + "\n", { mode: 0o600 })
    try {
      fs.chmodSync(KEY_FILE, 0o600)
    } catch {
      /* ignore */
    }
    return deriveKeyMaterial(generated)
  } catch {
    return null
  }
}

export function isEncryptionAvailable(): boolean {
  return resolvePrivacyKey() !== null
}

export type EncryptedBlob = {
  v: 1
  alg: "aes-256-gcm"
  iv: string
  tag: string
  ct: string
}

/** Encrypt UTF-8 plaintext → portable JSON blob (base64 fields). */
export function encryptAtRest(plaintext: string): EncryptedBlob | null {
  const key = resolvePrivacyKey()
  if (!key) return null
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    v: 1,
    alg: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ct: ct.toString("base64"),
  }
}

/** Decrypt blob produced by encryptAtRest. Returns null on failure. */
export function decryptAtRest(blob: EncryptedBlob): string | null {
  const key = resolvePrivacyKey()
  if (!key || blob?.alg !== "aes-256-gcm" || blob?.v !== 1) return null
  try {
    const iv = Buffer.from(blob.iv, "base64")
    const tag = Buffer.from(blob.tag, "base64")
    const ct = Buffer.from(blob.ct, "base64")
    const decipher = createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(tag)
    const pt = Buffer.concat([decipher.update(ct), decipher.final()])
    return pt.toString("utf8")
  } catch {
    return null
  }
}

/** Short fingerprint of key presence for UI (not the key). */
export function privacyKeyFingerprint(): string | null {
  const key = resolvePrivacyKey()
  if (!key) return null
  return createHash("sha256").update(key).digest("hex").slice(0, 12)
}

export function encryptJson(value: unknown): EncryptedBlob | null {
  return encryptAtRest(JSON.stringify(value))
}
