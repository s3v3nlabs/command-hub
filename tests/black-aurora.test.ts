import { describe, it, expect, beforeEach, afterEach } from "vitest"
import fs from "fs"
import path from "path"
import {
  __resetInvitesForTests,
  __invitesFilePath,
  createInvite,
  verifyInvite,
  revokeInvite,
  softCheck,
  consumeDownloadGrant,
  peekInvite,
} from "@/lib/black-aurora/invites"
import { createSourceBundle, cleanupBundle, __bundleDir } from "@/lib/black-aurora/bundle"
import { getBlackAuroraMode, PUBLIC_REPO_HONESTY } from "@/lib/black-aurora/mode"

describe("black-aurora invites", () => {
  const prev = { ...process.env }
  beforeEach(() => {
    process.env = { ...prev }
    delete process.env.BLACK_AURORA_MODE
    __resetInvitesForTests()
  })
  afterEach(() => {
    process.env = { ...prev }
    __resetInvitesForTests()
  })

  it("creates an 8-char code and soft-checks active", () => {
    const r = createInvite({ label: "zerocipher/Jerry", maxUses: 1 })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.code.length).toBe(8)
    const soft = softCheck(r.code)
    expect(soft.ok).toBe(true)
    expect(soft.invite?.label).toBe("zerocipher/Jerry")
  })

  it("verify enforces single-use", () => {
    const r = createInvite({ label: "t1", maxUses: 1 })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const v1 = verifyInvite(r.code)
    expect(v1.ok).toBe(true)
    if (!v1.ok) return
    expect(v1.downloadGrant).toBeTruthy()
    const v2 = verifyInvite(r.code)
    expect(v2.ok).toBe(false)
    if (v2.ok) return
    expect(v2.reason).toBe("exhausted")
  })

  it("verify enforces revoke", () => {
    const r = createInvite({ label: "t2" })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const rev = revokeInvite(r.code)
    expect(rev.ok).toBe(true)
    const v = verifyInvite(r.code)
    expect(v.ok).toBe(false)
    if (v.ok) return
    expect(v.reason).toBe("revoked")
  })

  it("verify enforces expiry", () => {
    const r = createInvite({ label: "t3", expiresInHours: 0.000001 }) // ~3.6ms
    expect(r.ok).toBe(true)
    if (!r.ok) return
    // Force expiry by rewriting the file
    const file = __invitesFilePath()
    const list = JSON.parse(fs.readFileSync(file, "utf8"))
    list[0].expiresAt = new Date(Date.now() - 1000).toISOString()
    fs.writeFileSync(file, JSON.stringify(list, null, 2))
    const v = verifyInvite(r.code)
    expect(v.ok).toBe(false)
    if (v.ok) return
    expect(v.reason).toBe("expired")
  })

  it("download grant is one-shot; rejects bad/used grants", () => {
    const r = createInvite({ label: "t4", maxUses: 2 })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const v = verifyInvite(r.code)
    expect(v.ok).toBe(true)
    if (!v.ok) return
    const g = v.downloadGrant
    const c1 = consumeDownloadGrant(g)
    expect(c1.ok).toBe(true)
    const c2 = consumeDownloadGrant(g)
    expect(c2.ok).toBe(false)
    if (c2.ok) return
    expect(c2.reason).toBe("not_found")
    const bad = consumeDownloadGrant("not-a-real-grant")
    expect(bad.ok).toBe(false)
  })

  it("peek returns null for unknown codes", () => {
    expect(peekInvite("ZZZZZZZZ")).toBeNull()
  })
})

describe("black-aurora mode + honesty", () => {
  const prev = { ...process.env }
  afterEach(() => {
    process.env = { ...prev }
  })
  it("defaults to bundle", () => {
    delete process.env.BLACK_AURORA_MODE
    expect(getBlackAuroraMode()).toBe("bundle")
  })
  it("reads github-private", () => {
    process.env.BLACK_AURORA_MODE = "github-private"
    expect(getBlackAuroraMode()).toBe("github-private")
  })
  it("honesty mentions public repo cannot be clone-gated", () => {
    expect(PUBLIC_REPO_HONESTY.toLowerCase()).toMatch(/public/)
    expect(PUBLIC_REPO_HONESTY.toLowerCase()).toMatch(/cannot/)
  })
})

describe("black-aurora bundle", () => {
  it("creates a git bundle or tar from the local repo", async () => {
    const r = await createSourceBundle("bundle")
    // In CI / this workspace we are inside a git checkout — should succeed
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.bytes).toBeGreaterThan(1000)
    expect(fs.existsSync(r.filePath)).toBe(true)
    expect(r.filePath.startsWith(__bundleDir())).toBe(true)
    cleanupBundle(r.filePath)
    expect(fs.existsSync(r.filePath)).toBe(false)
  }, 120_000)

  it("rejects download path conceptually for missing grant (unit)", () => {
    const bad = consumeDownloadGrant("")
    expect(bad.ok).toBe(false)
  })
})
