import { describe, it, expect } from "vitest"
import { WORKSPACE_PRESETS, getWorkspace, isWorkspaceId, resolveFeatured } from "@/lib/workspaces/presets"

describe("workspace presets", () => {
  it("has the four roles plus all", () => {
    const ids = WORKSPACE_PRESETS.map((w) => w.id)
    for (const r of ["red", "blue", "tiger", "investigator", "all"]) expect(ids).toContain(r)
  })
  it("getWorkspace falls back to 'all' for unknown", () => {
    expect(getWorkspace("nope").id).toBe("all")
    expect(getWorkspace("red").id).toBe("red")
  })
  it("isWorkspaceId validates", () => {
    expect(isWorkspaceId("blue")).toBe(true)
    expect(isWorkspaceId("green")).toBe(false)
  })
  it("resolveFeatured preserves preset order and drops unknown routes", () => {
    const red = getWorkspace("red")
    const modules = [
      { route: "/reports", id: "r" },
      { route: "/offsec", id: "o" },
      { route: "/unknown", id: "x" },
    ]
    const out = resolveFeatured(red, modules)
    // /offsec comes before /reports in the red preset
    expect(out.map((m) => m.route)).toEqual(["/offsec", "/reports"])
  })
  it("resolveFeatured returns all modules for the 'all' preset", () => {
    const all = getWorkspace("all")
    const modules = [{ route: "/a", id: "a" }, { route: "/b", id: "b" }]
    expect(resolveFeatured(all, modules)).toHaveLength(2)
  })
})
