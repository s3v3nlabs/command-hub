/**
 * F7 / T12 — requireHubAuth fails closed; constant-time compare.
 * Christian Wilford (s3v3n), Founder, Singular/ty Defense Solutions, LLC.
 */
import fs from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { isHubAuthorized, requireHubAuth } from "@/lib/security/api-auth"

const env = { ...process.env }
beforeEach(() => {
  for (const k of ["HUB_API_TOKEN", "OPERATOR_API_TOKEN", "HEIMDALL_API_KEY", "SECURE_MODE", "HUB_OPEN_LAB"]) delete process.env[k]
})
afterEach(() => {
  process.env = { ...env }
})
const r = (token?: string) => new Request("http://hub.local/x", { headers: token ? { authorization: `Bearer ${token}` } : {} })

describe("requireHubAuth (F7)", () => {
  it("no token configured, SECURE_MODE off → denied (fail closed)", () => {
    expect(requireHubAuth(r(), { surface: "t" })?.status).toBe(403)
    expect(isHubAuthorized(r())).toBe(false)
  })
  it("explicit HUB_OPEN_LAB=1 allows non-privileged surfaces only", () => {
    process.env.HUB_OPEN_LAB = "1"
    expect(requireHubAuth(r(), { surface: "t" })).toBeNull()
    expect(requireHubAuth(r(), { surface: "t", requireInSecureMode: true })?.status).toBe(403)
    process.env.SECURE_MODE = "1"
    expect(requireHubAuth(r(), { surface: "t" })?.status).toBe(403)
  })
  it("configured token: wrong / missing → 401, right → allowed", () => {
    process.env.HUB_API_TOKEN = "hub-test-token-123"
    expect(requireHubAuth(r(), { surface: "t" })?.status).toBe(401)
    expect(requireHubAuth(r("hub-test-token-12"), { surface: "t" })?.status).toBe(401)
    expect(requireHubAuth(r("hub-test-token-123"), { surface: "t" })).toBeNull()
    expect(isHubAuthorized(r("hub-test-token-123"))).toBe(true)
  })
  it("token comparison is constant-time (timingSafeEqual), not ===", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "lib/security/api-auth.ts"), "utf8")
    expect(src).toContain("timingSafeEqual")
    expect(src).not.toMatch(/presented\s*[!=]==\s*token/)
  })
})
