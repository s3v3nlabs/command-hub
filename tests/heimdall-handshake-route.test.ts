/**
 * F6 / T10 — handshake route: hub auth, pinned script hash, allowlisted child env.
 * Christian Wilford (s3v3n), Founder, Singular/ty Defense Solutions, LLC.
 */
import crypto from "node:crypto"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const env = { ...process.env }
let root: string
const SCRIPT = `import os, json
print(json.dumps({"handshake": "local_standby", "status": "STANDBY", "leaked": bool(os.environ.get("HUB_API_TOKEN") or os.environ.get("SECRET_PROBE"))}))
print("HANDSHAKE_OK")
`
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "hs-"))
  fs.writeFileSync(path.join(root, "run_heimdall.py"), SCRIPT)
  process.env.HEIMDALL_ENGINES_ROOT = root
  process.env.HUB_API_TOKEN = "hub-test-token-123"
  process.env.SECRET_PROBE = "should-not-reach-child"
  delete process.env.HEIMDALL_HANDSHAKE_SHA256
  vi.resetModules()
})
afterEach(() => {
  process.env = { ...env }
  fs.rmSync(root, { recursive: true, force: true })
})
const req = (token?: string) => new Request("http://hub.local/api/engines/heimdall/handshake", { method: "POST", headers: token ? { authorization: `Bearer ${token}` } : {} })
const sha = () => crypto.createHash("sha256").update(fs.readFileSync(path.join(root, "run_heimdall.py"))).digest("hex")

describe("heimdall handshake route (F6)", () => {
  it("401 without hub token", async () => {
    const { POST, GET } = await import("@/app/api/engines/heimdall/handshake/route")
    expect((await POST(req())).status).toBe(401)
    expect((await GET(req())).status).toBe(401)
  })
  it("unpinned script → ok:false and never trusted even if it prints HANDSHAKE_OK", async () => {
    const { POST } = await import("@/app/api/engines/heimdall/handshake/route")
    const j = await (await POST(req("hub-test-token-123"))).json()
    expect(j.ok).toBe(false)
    expect(j.detail).toMatch(/not_pinned/)
  })
  it("hash mismatch → ok:false", async () => {
    process.env.HEIMDALL_HANDSHAKE_SHA256 = "0".repeat(64)
    const { POST } = await import("@/app/api/engines/heimdall/handshake/route")
    const j = await (await POST(req("hub-test-token-123"))).json()
    expect(j.ok).toBe(false)
    expect(j.detail).toMatch(/hash_mismatch/)
  })
  it("pinned script runs with an allowlisted env (no hub secrets reach the child)", async () => {
    process.env.HEIMDALL_HANDSHAKE_SHA256 = sha()
    const { POST } = await import("@/app/api/engines/heimdall/handshake/route")
    const j = await (await POST(req("hub-test-token-123"))).json()
    expect(j.ok).toBe(true)
    expect(j.stdout_preview).toContain('"leaked": false')
  })
})
