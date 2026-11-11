#!/usr/bin/env node
/**
 * Sign the marketplace registry index (or any manifest file) with a detached
 * ed25519 signature.
 *
 * Usage:
 *   # 1. generate an operator signing keypair (private key stays OUT of the repo)
 *   node scripts/sign-registry.mjs --genkey
 *   # 2. sign the bundled index (writes public/registry/modules.json.sig)
 *   node scripts/sign-registry.mjs
 *   # or sign any manifest file (writes <file>.sig)
 *   node scripts/sign-registry.mjs modules/acme-recon/module.json
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
const DEFAULT_DOC = path.join(ROOT, "public", "registry", "modules.json")

function genkey() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519")
  fs.mkdirSync(path.dirname(PRIV), { recursive: true, mode: 0o700 })
  fs.mkdirSync(path.dirname(PUB), { recursive: true })
  fs.writeFileSync(PRIV, privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600 })
  fs.writeFileSync(PUB, publicKey.export({ type: "spki", format: "pem" }))
  console.log("Wrote private key ->", PRIV, "(gitignored, NEVER commit)")
  console.log("Wrote public key  ->", PUB, "(commit this trust anchor)")
}

function sign(docPath) {
  if (!fs.existsSync(PRIV)) {
    console.error("No signing key. Run: node scripts/sign-registry.mjs --genkey")
    process.exit(1)
  }
  if (!fs.existsSync(docPath)) {
    console.error("File not found:", docPath)
    process.exit(1)
  }
  const key = crypto.createPrivateKey(fs.readFileSync(PRIV))
  const data = fs.readFileSync(docPath)
  const sig = crypto.sign(null, data, key).toString("base64")
  const sigPath = docPath + ".sig"
  fs.writeFileSync(sigPath, sig + "\n")
  console.log("Signed", docPath, "->", sigPath)
}

const args = process.argv.slice(2)
if (args.includes("--genkey")) genkey()
else sign(args[0] || DEFAULT_DOC)
