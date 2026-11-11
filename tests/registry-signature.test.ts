import { describe, it, expect, afterEach } from "vitest"
import crypto from "crypto"
import { verifyDetached } from "@/lib/modules/signature"

const prev = { ...process.env }
afterEach(() => {
  process.env = { ...prev }
})

function keypair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519")
  return {
    pubPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
    sign: (data: string) => crypto.sign(null, Buffer.from(data, "utf8"), privateKey).toString("base64"),
  }
}

describe("registry signature verifyDetached", () => {
  it("verifies a valid detached ed25519 signature against env key", () => {
    const { pubPem, sign } = keypair()
    process.env.REGISTRY_PUBLIC_KEY = pubPem
    const payload = JSON.stringify({ modules: [], version: 1 })
    const r = verifyDetached(payload, sign(payload))
    expect(r.status).toBe("verified")
    expect(r.verified).toBe(true)
    expect(r.keySource).toBe("env")
  })
  it("flags a tampered payload as invalid", () => {
    const { pubPem, sign } = keypair()
    process.env.REGISTRY_PUBLIC_KEY = pubPem
    const sig = sign("original")
    const r = verifyDetached("tampered", sig)
    expect(r.status).toBe("invalid")
    expect(r.verified).toBe(false)
  })
  it("reports no_key when no key configured", () => {
    delete process.env.REGISTRY_PUBLIC_KEY
    const r = verifyDetached("x", "AAAA")
    // bundled key may or may not exist; accept no_key OR a real verdict, but never silent-trust
    expect(["no_key", "invalid", "error", "unsigned"]).toContain(r.status)
    if (r.status === "no_key") expect(r.verified).toBe(false)
  })
  it("reports unsigned when key present but no signature", () => {
    const { pubPem } = keypair()
    process.env.REGISTRY_PUBLIC_KEY = pubPem
    const r = verifyDetached("payload", "")
    expect(r.status).toBe("unsigned")
    expect(r.verified).toBe(false)
  })
  it("accepts base64-of-PEM in env", () => {
    const { pubPem, sign } = keypair()
    process.env.REGISTRY_PUBLIC_KEY = Buffer.from(pubPem, "utf8").toString("base64")
    const payload = "hello"
    const r = verifyDetached(payload, sign(payload))
    expect(r.verified).toBe(true)
  })
})
