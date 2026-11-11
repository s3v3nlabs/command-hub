import { describe, it, expect } from "vitest"
import { validatePluginManifest, PLUGIN_API_VERSION, PLUGIN_API_SURFACE } from "@/lib/modules/plugin-sdk"

const base = {
  id: "acme-recon",
  name: "ACME Recon",
  version: "1.2.0",
  description: "Passive recon for authorized engagements.",
  route: "/plugins/acme-recon",
  permissions: ["ui", "read"],
  entry: null,
  lattice_sync: false as const,
}

describe("plugin-sdk validatePluginManifest", () => {
  it("accepts a valid manifest", () => {
    const r = validatePluginManifest(base)
    expect(r.ok).toBe(true)
    expect(r.manifest?.lattice_sync).toBe(false)
  })
  it("rejects exploit-flavored ids via base schema", () => {
    const r = validatePluginManifest({ ...base, id: "ransomware-kit" })
    expect(r.ok).toBe(false)
  })
  it("requires a route or entry", () => {
    const { route, ...noRoute } = base
    const r = validatePluginManifest({ ...noRoute, entry: null })
    expect(r.ok).toBe(false)
    expect(r.errors.join()).toMatch(/route/)
  })
  it("rejects lattice_sync true", () => {
    const r = validatePluginManifest({ ...base, lattice_sync: true })
    expect(r.ok).toBe(false)
  })
  it("rejects unknown permissions", () => {
    const r = validatePluginManifest({ ...base, permissions: ["ui", "root"] })
    expect(r.ok).toBe(false)
  })
  it("warns on non-semver version", () => {
    const r = validatePluginManifest({ ...base, version: "v1" })
    expect(r.warnings.join()).toMatch(/semver/)
  })
  it("rejects relative routes", () => {
    const r = validatePluginManifest({ ...base, route: "plugins/x" })
    expect(r.ok).toBe(false)
  })
  it("exposes a stable API surface", () => {
    expect(PLUGIN_API_VERSION).toBe("1.0.0")
    expect(PLUGIN_API_SURFACE.endpoints.length).toBeGreaterThan(0)
  })
})
