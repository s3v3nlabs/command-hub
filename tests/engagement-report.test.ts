import { describe, it, expect } from "vitest"
import type { Engagement } from "@/lib/offsec/engagements-store"
import { buildReport, renderMarkdown, renderReportPdf } from "@/lib/offsec/report/generate"
import { mapTextToTechniques } from "@/lib/offsec/report/attack-map"

function fixture(): Engagement {
  const now = new Date().toISOString()
  return {
    id: "e1",
    name: "ACME External Pentest",
    client: "ACME Corp",
    scope: ["acme.com", "10.0.0.0/24"],
    roe: "No DoS. Business hours only.",
    authorizedBy: "CISO",
    status: "reporting",
    createdAt: now,
    updatedAt: now,
    lattice_sync: false,
    notes: [],
    findings: [
      {
        id: "f1",
        title: "SQL injection in login",
        severity: "critical",
        phase: "exploitation",
        target: "acme.com/login",
        description: "Unauthenticated SQL injection allows auth bypass (public-facing app).",
        recommendation: "Parameterize queries.",
        createdAt: now,
      },
      {
        id: "f2",
        title: "Weak password policy enables brute force",
        severity: "high",
        description: "Password spray succeeded with common passwords. See T1110.",
        createdAt: now,
      },
      {
        id: "f3",
        title: "Informational: verbose banners",
        severity: "info",
        description: "Service banners leak versions.",
        createdAt: now,
      },
    ],
  }
}

describe("attack-map", () => {
  it("maps explicit technique ids", () => {
    const m = mapTextToTechniques("We observed T1003 OS credential dumping")
    expect(m.find((x) => x.technique.id === "T1003")?.reason).toBe("explicit")
  })
  it("maps by keyword", () => {
    const m = mapTextToTechniques("sql injection on a public-facing app")
    expect(m.map((x) => x.technique.id)).toContain("T1190")
  })
})

describe("engagement report", () => {
  it("computes severity counts and risk score", () => {
    const r = buildReport(fixture())
    expect(r.totalFindings).toBe(3)
    expect(r.severityCounts.critical).toBe(1)
    expect(r.severityCounts.high).toBe(1)
    expect(r.severityCounts.info).toBe(1)
    expect(r.riskScore).toBe(5 + 4 + 1)
  })
  it("maps findings to ATT&CK coverage", () => {
    const r = buildReport(fixture())
    const ids = r.attackCoverage.map((t) => t.id)
    expect(ids).toContain("T1190") // sqli
    expect(ids).toContain("T1110") // brute force
  })
  it("renders markdown with sections", () => {
    const md = renderMarkdown(buildReport(fixture()))
    expect(md).toMatch(/# Penetration Test Report/)
    expect(md).toMatch(/MITRE ATT&CK Coverage/)
    expect(md).toMatch(/SQL injection in login/)
  })
  it("renders a valid PDF buffer", () => {
    const pdf = renderReportPdf(buildReport(fixture()))
    expect(Buffer.isBuffer(pdf)).toBe(true)
    const head = pdf.subarray(0, 8).toString("latin1")
    expect(head.startsWith("%PDF-1.")).toBe(true)
    expect(pdf.toString("latin1")).toMatch(/%%EOF$/)
    expect(pdf.toString("latin1")).toMatch(/\/Type \/Catalog/)
    expect(pdf.length).toBeGreaterThan(500)
  })
})
