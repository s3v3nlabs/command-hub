import { describe, it, expect } from "vitest"
import { classifyTarget, buildEnrichment } from "@/lib/offsec/osint/enrich"

describe("osint classifyTarget", () => {
  it("classifies common entity types", () => {
    expect(classifyTarget("example.com")).toBe("domain")
    expect(classifyTarget("8.8.8.8")).toBe("ip")
    expect(classifyTarget("jane@example.com")).toBe("email")
    expect(classifyTarget("@handle")).toBe("social")
    expect(classifyTarget("johndoe")).toBe("username")
    expect(classifyTarget("+1 202 555 0100")).toBe("phone")
    expect(classifyTarget("Jane Q Doe")).toBe("person")
  })
})

describe("osint buildEnrichment", () => {
  it("builds pivots, dorks and a graph for a domain", () => {
    const e = buildEnrichment("example.com")
    if ("error" in e) throw new Error(e.error)
    expect(e.type).toBe("domain")
    expect(e.pivots.length).toBeGreaterThan(0)
    expect(e.dorks.length).toBeGreaterThan(0)
    // dork queries substitute the domain
    expect(e.dorks.some((d) => d.query.includes("example.com"))).toBe(true)
    // graph has a pinned target node + leads
    const root = e.graph.nodes.find((n) => n.meta?.role === "target")
    expect(root?.label).toBe("example.com")
    expect(e.graph.nodes.length).toBeGreaterThan(1)
    expect(e.graph.edges.length).toBeGreaterThan(0)
  })
  it("derives a domain node from an email", () => {
    const e = buildEnrichment("jane@acme.com")
    if ("error" in e) throw new Error(e.error)
    expect(e.type).toBe("email")
    expect(e.graph.nodes.some((n) => n.type === "domain" && n.label === "acme.com")).toBe(true)
  })
  it("errors on empty target", () => {
    const e = buildEnrichment("")
    expect("error" in e).toBe(true)
  })
})
