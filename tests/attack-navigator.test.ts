import { describe, it, expect } from "vitest"
import { buildNavigator } from "@/lib/offsec/attack/navigator"

describe("attack navigator", () => {
  it("lights up techniques from observed events", () => {
    const m = buildNavigator([
      { ts: "2026-01-01T00:00:00Z", source: "ids:request-guard", text: "sql injection attempt on public-facing app" },
      { ts: "2026-01-01T00:01:00Z", source: "deception:service", text: "brute force / password spray against fake telnet" },
      { ts: "2026-01-01T00:02:00Z", source: "ids:api-auth", text: "benign health check" },
    ])
    expect(m.totalObserved).toBe(3)
    expect(m.totalHits).toBeGreaterThan(0)
    const top = m.topTechniques.map((t) => t.id)
    expect(top).toContain("T1190") // sqli
    expect(top).toContain("T1110") // brute force
  })
  it("produces all enterprise tactic columns", () => {
    const m = buildNavigator([])
    expect(m.columns.length).toBe(14)
    expect(m.totalHits).toBe(0)
    expect(m.topTechniques).toHaveLength(0)
  })
  it("records source and lastSeen on a lit cell", () => {
    const m = buildNavigator([{ ts: "2026-02-02T00:00:00Z", source: "ids:x", text: "mimikatz lsass credential dump" }])
    const cell = m.columns.flatMap((c) => c.techniques).find((t) => t.technique.id === "T1003")
    expect(cell?.hits).toBe(1)
    expect(cell?.sources).toContain("ids:x")
    expect(cell?.lastSeen).toBe("2026-02-02T00:00:00Z")
  })
})
