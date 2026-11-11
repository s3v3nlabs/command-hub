#!/usr/bin/env node
/**
 * Sign the marketplace registry index with a detached ed25519 signature.
 *
 * Usage:
 *   # 1. generate an operator signing keypair (private key stays OUT of the repo)
 *   node scripts/sign-registry.mjs --genkey
 *   # 2. sign the bundled index (writes public/registry/modules.json.sig)
 *   node scripts/sign-registry.mjs
 *
 * Key locations:
 *   private: local-data/registry-signing-key.pem   (gitignored, NEVER commit)
 *   public:  public/registry/registry.pub          (committed trust anchor)
 *
 * The hub verifies against public/registry/registry.pub (or env REGISTRY_PUBLIC_KEY).
 */
import crypto from "crypto"
import fs from "fs"
import path from "path"

const ROOT = process.cwd()
const PRIV = path.join(ROOT, "local-data", "registry-signing-key.pem")
const PUB = path.join(ROOT, "public", "registry", "registry.pub")
const DOC = path.join(ROOT, "public", "registry", "modules.json")
const SIG = path.join(ROOT, "public", "registry", "modules.json.sig")

function genkey() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519")
  fs.mkdirSync(path.dirname(PRIV), { recursive: true, mode: 0o700 })
  fs.mkdirSync(path.dirname(PUB), { recursive: true })
  fs.writeFileSync(PRIV, privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600 })
  fs.writeFileSync(PUB, publicKey.export({ type: "spki", format: "pem" }))
  console.log("Wrote private key ->", PRIV, "(gitignored)")
  console.log("Wrote public key  ->", PUB, "(commit this)")
}

function sign() {
  if (!fs.existsSync(PRIV)) {
    console.error("No signing key. Run: node scripts/sign-registry.mjs --genkey")
    process.exit(1)
  }
  const key = crypto.createPrivateKey(fs.readFileSync(PRIV))
  const data = fs.readFileSync(DOC)
  const sig = crypto.sign(null, data, key).toString("base64")
  fs.writeFileSync(SIG, sig + "\n")
  console.log("Signed", DOC, "->", SIG)
}

if (process.argv.includes("--genkey")) genkey()
else sign()
