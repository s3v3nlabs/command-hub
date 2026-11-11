import { describe, it, expect, afterAll } from "vitest"
import fs from "fs"
import path from "path"
import { loadRegistryIndex, setInstallState, readInstallState } from "@/lib/modules/registry-index"

const STATE_FILE = path.join(process.cwd(), "data", "marketplace", "state.json")

describe("registry-index loader", () => {
  it("loads the bundled index and verifies its signature", async () => {
    const r = await loadRegistryIndex()
    expect(r.source).toBe("bundled")
    expect(r.ok).toBe(true)
    expect(r.index?.modules.length).toBeGreaterThan(0)
    // bundled index is signed against the committed public key
    expect(r.signature.verified).toBe(true)
    expect(r.signature.status).toBe("verified")
  })

  it("annotates each entry with validity", async () => {
    const r = await loadRegistryIndex()
    for (const m of r.index!.modules) {
      expect(typeof m.valid).toBe("boolean")
    }
  })
})

describe("marketplace install state", () => {
  const id = "__test_module__"
  afterAll(() => {
    const s = readInstallState()
    delete s[id]
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2))
    } catch {
      /* ignore */
    }
  })
  it("install -> enable/disable -> uninstall", () => {
    expect(setInstallState(id, "install").ok).toBe(true)
    expect(readInstallState()[id].installed).toBe(true)
    expect(setInstallState(id, "disable").ok).toBe(true)
    expect(readInstallState()[id].enabled).toBe(false)
    expect(setInstallState(id, "enable").ok).toBe(true)
    expect(readInstallState()[id].enabled).toBe(true)
    expect(setInstallState(id, "uninstall").ok).toBe(true)
    expect(readInstallState()[id]).toBeUndefined()
  })
  it("rejects enable of a not-installed module", () => {
    const r = setInstallState("__never_installed__", "enable")
    expect(r.ok).toBe(false)
    expect(r.error).toBe("not_installed")
  })
})
