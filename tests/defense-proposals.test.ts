import { describe, it, expect } from "vitest"
import { generateDefenseProposals, proposalToMarkdown, type DefenseProposal } from "@/lib/dev-operator/defense-proposals"

describe("defense proposals", () => {
  it("generates proposals without throwing and never auto-applies", () => {
    const { proposals, hold } = generateDefenseProposals()
    expect(hold).toBe("HOLD_VYRNA_UNSYNC")
    expect(Array.isArray(proposals)).toBe(true)
    for (const p of proposals) {
      expect(p.autoApplied).toBe(false)
      expect(["info", "low", "medium", "high", "critical"]).toContain(p.severity)
    }
  })
  it("renders defensive markdown with review warning", () => {
    const p: DefenseProposal = {
      id: "defense-sqli",
      title: "Harden against SQL injection",
      severity: "high",
      pattern: "sqli",
      observedCount: 3,
      techniques: ["T1190"],
      rationale: "SQLi observed.",
      suggestedChange: "- Use parameterized queries.",
      autoApplied: false,
    }
    const md = proposalToMarkdown(p)
    expect(md).toMatch(/Defense proposal/)
    expect(md).toMatch(/NOT auto-applied/)
    expect(md).toMatch(/HOLD_VYRNA_UNSYNC/)
  })
})
