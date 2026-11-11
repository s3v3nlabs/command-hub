/**
 * Detached ed25519 signature verification for the module registry index.
 *
 * REAL crypto: Node's crypto.verify with an ed25519 public key. The signature
 * is a detached base64 ed25519 signature over the EXACT bytes of the signed
 * document (e.g. public/registry/modules.json).
 *
 * Trust anchor resolution order for the verification public key:
 *   1. process.env.REGISTRY_PUBLIC_KEY  (PEM SPKI, or base64 of PEM)
 *   2. bundled repo key at public/registry/registry.pub (PEM SPKI)
 *   3. none  -> verification is reported as "unverified" (NEVER silently trusted)
 *
 * This module NEVER signs in production; signing is an operator action done with
 * scripts/sign-registry.mjs using a private key kept out of the repo.
 */

import crypto from "crypto"
import fs from "fs"
import path from "path"

export type SignatureStatus = "verified" | "invalid" | "unsigned" | "no_key" | "error"

export interface VerifyResult {
  status: SignatureStatus
  /** true only when status === "verified" */
  verified: boolean
  keySource: "env" | "bundled" | "none"
  detail: string
}

const BUNDLED_PUB = path.join(process.cwd(), "public", "registry", "registry.pub")

function normalizePem(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  if (t.includes("BEGIN PUBLIC KEY")) return t
  // allow base64-of-PEM in env
  try {
    const decoded = Buffer.from(t, "base64").toString("utf8")
    if (decoded.includes("BEGIN PUBLIC KEY")) return decoded.trim()
  } catch {
    /* ignore */
  }
  return null
}

export function resolvePublicKey(): { pem: string; source: "env" | "bundled" } | null {
  const env = process.env.REGISTRY_PUBLIC_KEY
  if (env && env.trim()) {
    const pem = normalizePem(env)
    if (pem) return { pem, source: "env" }
  }
  try {
    if (fs.existsSync(BUNDLED_PUB)) {
      const pem = normalizePem(fs.readFileSync(BUNDLED_PUB, "utf8"))
      if (pem) return { pem, source: "bundled" }
    }
  } catch {
    /* ignore */
  }
  return null
}

/**
 * Verify a detached base64 ed25519 signature over `payload` (raw bytes/string).
 * Returns a structured, honest result; never throws.
 */
export function verifyDetached(payload: string | Buffer, signatureB64: string | null | undefined): VerifyResult {
  const key = resolvePublicKey()
  if (!key) {
    return { status: "no_key", verified: false, keySource: "none", detail: "No verification key configured (env REGISTRY_PUBLIC_KEY or public/registry/registry.pub)." }
  }
  const sig = (signatureB64 || "").trim()
  if (!sig) {
    return { status: "unsigned", verified: false, keySource: key.source, detail: "No detached signature present for the index." }
  }
  try {
    const pub = crypto.createPublicKey(key.pem)
    const data = typeof payload === "string" ? Buffer.from(payload, "utf8") : payload
    const ok = crypto.verify(null, data, pub, Buffer.from(sig, "base64"))
    return ok
      ? { status: "verified", verified: true, keySource: key.source, detail: `Signature verified against ${key.source} ed25519 key.` }
      : { status: "invalid", verified: false, keySource: key.source, detail: "Signature did NOT match — index may be tampered or signed by another key." }
  } catch (e) {
    return { status: "error", verified: false, keySource: key.source, detail: `Verification error: ${(e as Error).message}` }
  }
}
