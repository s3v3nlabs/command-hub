#!/usr/bin/env node
/**
 * Verify a detached ed25519 signature over the registry index (or any file)
 * against the trust-anchor public key.
 *
 * Usage:
 *   node scripts/verify-registry.mjs                                   # verifies bundled index
 *   node scripts/verify-registry.mjs modules/acme-recon/module.json    # verifies <file> + <file>.sig
 *
 * Verification key resolution (same as the hub):
 *   1. env REGISTRY_PUBLIC_KEY (PEM SPKI or base64-of-PEM)
 *   2. public/registry/registry.pub
 * Exit code 0 = verified, 1 = NOT verified (never silent-trust).
 */
import crypto from "crypto"
import fs from "fs"
import path from "path"

const ROOT = process.cwd()
const PUB = path.join(ROOT, "public", "registry", "registry.pub")
const DEFAULT_DOC = path.join(ROOT, "public", "registry", "modules.json")

function resolveKey() {
  const env = (process.env.REGISTRY_PUBLIC_KEY || "").trim()
  if (env) {
    if (env.includes("BEGIN PUBLIC KEY")) return env
    try {
      const d = Buffer.from(env, "base64").toString("utf8")
      if (d.includes("BEGIN PUBLIC KEY")) return d
    } catch {}
  }
  if (fs.existsSync(PUB)) return fs.readFileSync(PUB, "utf8")
  return null
}

const docPath = process.argv[2] || DEFAULT_DOC
const sigPath = docPath + ".sig"
const pem = resolveKey()
if (!pem) {
  console.error("UNVERIFIED: no verification key (env REGISTRY_PUBLIC_KEY or public/registry/registry.pub).")
  process.exit(1)
}
if (!fs.existsSync(docPath) || !fs.existsSync(sigPath)) {
  console.error("UNVERIFIED: missing", !fs.existsSync(docPath) ? docPath : sigPath)
  process.exit(1)
}
try {
  const pub = crypto.createPublicKey(pem)
  const data = fs.readFileSync(docPath)
  const sig = Buffer.from(fs.readFileSync(sigPath, "utf8").trim(), "base64")
  const ok = crypto.verify(null, data, pub, sig)
  if (ok) {
    console.log("VERIFIED:", docPath, "signature is valid.")
    process.exit(0)
  }
  console.error("INVALID: signature does NOT match", docPath, "— tampered or signed by another key.")
  process.exit(1)
} catch (e) {
  console.error("ERROR verifying:", e.message)
  process.exit(1)
}
