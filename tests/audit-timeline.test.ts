import { describe, it, expect } from "vitest"
import { buildTimeline } from "@/lib/audit/timeline"

describe("audit timeline", () => {
  it("builds a merged, sorted timeline without throwing", () => {
    const r = buildTimeline({ heimdallToken: null, limit: 50 })
    expect(Array.isArray(r.entries)).toBe(true)
    expect(r.counts).toHaveProperty("authz")
    expect(r.counts).toHaveProperty("eyes-only")
    expect(typeof r.heimdallAuthorized).toBe("boolean")
    // entries are sorted newest-first
    for (let i = 1; i < r.entries.length; i++) {
      expect((r.entries[i - 1].ts || "") >= (r.entries[i].ts || "")).toBe(true)
    }
  })
  it("keeps eyes-only sealed without a Heimdall token", () => {
    const r = buildTimeline({ heimdallToken: "wrong-token", limit: 50 })
    expect(r.heimdallAuthorized).toBe(false)
    const eyesOnly = r.entries.filter((e) => e.category === "eyes-only")
    for (const e of eyesOnly) expect(e.sealed).toBe(true)
  })
})
