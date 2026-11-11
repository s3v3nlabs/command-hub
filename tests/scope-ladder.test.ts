import { describe, it, expect, beforeAll, beforeEach } from "vitest"
import fs from "fs"
import path from "path"
import os from "os"

describe("staged ladder", () => {
  let createScope: typeof import("@/lib/offsec/scope-ladder").createScope
  let setScopeActive: typeof import("@/lib/offsec/scope-ladder").setScopeActive
  let checkLadder: typeof import("@/lib/offsec/scope-ladder").checkLadder
  let enforceLadder: typeof import("@/lib/offsec/scope-ladder").enforceLadder
  let scopeId = ""

  beforeAll(async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ladder-"))
    process.chdir(tmp)
    // Dynamic import AFTER chdir so path constants bind to the temp cwd.
    const mod = await import("@/lib/offsec/scope-ladder")
    createScope = mod.createScope
    setScopeActive = mod.setScopeActive
    checkLadder = mod.checkLadder
    enforceLadder = mod.enforceLadder
  })

  beforeEach(() => {
    const r = createScope({
      name: "test",
      authorizationRef: "SOW-1",
      authorizedTargets: ["example.com", "1.2.3.4"],
      operatorIdentity: "tester",
      startsAt: new Date(Date.now() - 60_000).toISOString(),
      endsAt: new Date(Date.now() + 86_400_000).toISOString(),
    })
    expect(r.ok).toBe(true)
    if (r.ok) scopeId = r.scope.id
  })

  it("stage1 blocks when flag off", () => {
    const c = checkLadder({
      capability: "t",
      scopeId,
      target: "example.com",
      attestation: `authorized under scope ${scopeId}`,
      stage1Enabled: false,
    })
    expect(c.allowed).toBe(false)
    expect(c.stage).toBe(1)
  })

  it("stage2 blocks inactive scope", () => {
    const c = checkLadder({
      capability: "t",
      scopeId,
      target: "example.com",
      attestation: `authorized under scope ${scopeId}`,
      stage1Enabled: true,
    })
    expect(c.allowed).toBe(false)
    expect(c.stage).toBe(2)
  })

  it("stage3 requires attestation; then allows", () => {
    setScopeActive(scopeId, true)
    const noAtt = checkLadder({
      capability: "t",
      scopeId,
      target: "example.com",
      attestation: "",
      stage1Enabled: true,
    })
    expect(noAtt.allowed).toBe(false)
    expect(noAtt.stage).toBe(3)
    const ok = enforceLadder({
      capability: "t",
      scopeId,
      target: "example.com",
      attestation: `authorized under scope ${scopeId}`,
      stage1Enabled: true,
      operator: "tester",
    })
    expect(ok.blocked).toBe(false)
  })
})
