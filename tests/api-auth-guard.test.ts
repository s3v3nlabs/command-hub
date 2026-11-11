import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { assertSafeOutboundUrl } from "@/lib/security/request-guard"
import { isSecureMode, extractHubToken } from "@/lib/security/api-auth"

describe("request-guard SSRF", () => {
  it("allows public https", () => {
    expect(() => assertSafeOutboundUrl("https://example.com/x")).not.toThrow()
  })
  it("blocks loopback / RFC1918 / metadata", () => {
    for (const u of [
      "http://127.0.0.1/",
      "http://10.0.0.5/",
      "http://192.168.1.1/",
      "http://169.254.169.254/",
      "http://localhost/",
      "http://metadata.google.internal/",
    ]) {
      expect(() => assertSafeOutboundUrl(u)).toThrow()
    }
  })
})

describe("api-auth helpers", () => {
  const prev = { ...process.env }
  afterEach(() => {
    process.env = { ...prev }
  })
  it("isSecureMode reads SECURE_MODE", () => {
    process.env.SECURE_MODE = "1"
    expect(isSecureMode()).toBe(true)
    process.env.SECURE_MODE = "0"
    expect(isSecureMode()).toBe(false)
  })
  it("extractHubToken prefers Bearer", () => {
    const req = new Request("http://x", { headers: { Authorization: "Bearer abc", "x-hub-token": "nope" } })
    expect(extractHubToken(req)).toBe("abc")
  })
})
