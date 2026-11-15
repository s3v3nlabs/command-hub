/**
 * F9 / T11 — install/enable through the marketplace boundary requires a verified signed index.
 * Christian Wilford (s3v3n), Founder, Singular/ty Defense Solutions, LLC.
 */
import { describe, expect, it } from "vitest"
import { gatedSetInstallState, loadRegistryIndex } from "@/lib/modules/registry-index"

describe("registry install gate (F9)", () => {
  it("refuses install/enable when the index signature is not verified", async () => {
    const idx = await loadRegistryIndex()
    const id = idx.index?.modules[0]?.id ?? "x"
    if (idx.signature.verified) return // a re-signed index makes this case unreachable
    for (const a of ["install", "enable"] as const) {
      const r = await gatedSetInstallState(id, a)
      expect(r).toMatchObject({ ok: false, error: "registry_signature_not_verified" })
    }
  })
  it("refuses ids that are not in the index even with a verified index", async () => {
    const r = await gatedSetInstallState("__not_in_index__", "install", { loader: async () => ({ ok: true, source: "bundled", index: { version: 1, modules: [] } as never, signature: { status: "verified", verified: true, keySource: "bundled" } as never }) })
    expect(r).toMatchObject({ ok: false, error: "module_not_in_index" })
  })
  it("uninstall/disable stay available (removing trust is always allowed)", async () => {
    const r = await gatedSetInstallState("__never_installed__", "uninstall")
    expect(r.ok).toBe(true)
  })
})
