/**
 * Build a pentest report from an engagement: findings -> ATT&CK mapping ->
 * markdown + PDF. Honest: severity counts and coverage are computed from real
 * engagement data; ATT&CK mapping is best-effort (explicit ids or keywords).
 */

import type { Engagement, Finding, FindingSeverity } from "@/lib/offsec/engagements-store"
import { mapFindingToTechniques, type TechniqueMatch } from "./attack-map"
import { renderPdf, type PdfLine } from "./pdf"

const SEV_ORDER: FindingSeverity[] = ["critical", "high", "medium", "low", "info"]
const SEV_WEIGHT: Record<FindingSeverity, number> = { critical: 5, high: 4, medium: 3, low: 2, info: 1 }

export interface MappedFinding {
  finding: Finding
  techniques: TechniqueMatch[]
}

export interface Report {
  engagement: Engagement
  generatedAt: string
  severityCounts: Record<FindingSeverity, number>
  totalFindings: number
  riskScore: number
  mapped: MappedFinding[]
  attackCoverage: { id: string; name: string; tactics: string[]; url: string; findingCount: number }[]
}

export function buildReport(engagement: Engagement): Report {
  const mapped: MappedFinding[] = engagement.findings.map((f) => ({ finding: f, techniques: mapFindingToTechniques(f) }))
  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as Record<FindingSeverity, number>
  let riskScore = 0
  for (const f of engagement.findings) {
    severityCounts[f.severity] = (severityCounts[f.severity] || 0) + 1
    riskScore += SEV_WEIGHT[f.severity] || 0
  }
  const cov = new Map<string, { id: string; name: string; tactics: string[]; url: string; findingCount: number }>()
  for (const m of mapped) {
    for (const t of m.techniques) {
      const e = cov.get(t.technique.id) || { id: t.technique.id, name: t.technique.name, tactics: t.technique.tactics, url: t.technique.url, findingCount: 0 }
      e.findingCount += 1
      cov.set(t.technique.id, e)
    }
  }
  return {
    engagement,
    generatedAt: new Date().toISOString(),
    severityCounts,
    totalFindings: engagement.findings.length,
    riskScore,
    mapped,
    attackCoverage: Array.from(cov.values()).sort((a, b) => b.findingCount - a.findingCount),
  }
}

export function renderMarkdown(report: Report): string {
  const e = report.engagement
  const L: string[] = []
  L.push(`# Penetration Test Report — ${e.name}`)
  L.push("")
  L.push(`> Generated ${report.generatedAt} · Singular/ty Command Hub · HOLD_VYRNA_UNSYNC`)
  L.push("")
  L.push(`**Client:** ${e.client || "—"}  `)
  L.push(`**Status:** ${e.status}  `)
  L.push(`**Authorized by:** ${e.authorizedBy || "—"}  `)
  L.push(`**Scope:** ${e.scope.length ? e.scope.join(", ") : "—"}`)
  if (e.roe) {
    L.push("")
    L.push(`**Rules of Engagement:**`)
    L.push("")
    L.push(e.roe)
  }
  L.push("")
  L.push(`## Executive Summary`)
  L.push("")
  L.push(`${report.totalFindings} findings (risk score ${report.riskScore}).`)
  L.push("")
  L.push(`| Severity | Count |`)
  L.push(`| --- | --- |`)
  for (const s of SEV_ORDER) L.push(`| ${s} | ${report.severityCounts[s]} |`)
  L.push("")
  L.push(`## MITRE ATT&CK Coverage`)
  L.push("")
  if (report.attackCoverage.length) {
    L.push(`| Technique | ID | Tactic(s) | Findings |`)
    L.push(`| --- | --- | --- | --- |`)
    for (const t of report.attackCoverage) {
      L.push(`| [${t.name}](${t.url}) | ${t.id} | ${t.tactics.join(", ")} | ${t.findingCount} |`)
    }
  } else {
    L.push(`_No ATT&CK techniques mapped (add explicit Txxxx ids or descriptive findings)._`)
  }
  L.push("")
  L.push(`## Findings`)
  L.push("")
  const ordered = [...report.mapped].sort(
    (a, b) => (SEV_WEIGHT[b.finding.severity] || 0) - (SEV_WEIGHT[a.finding.severity] || 0),
  )
  if (!ordered.length) L.push(`_No findings recorded._`)
  ordered.forEach((m, i) => {
    const f = m.finding
    L.push(`### ${i + 1}. ${f.title}  _(${f.severity})_`)
    L.push("")
    if (f.target) L.push(`**Target:** ${f.target}  `)
    if (f.phase) L.push(`**Phase:** ${f.phase}  `)
    const techs = m.techniques.map((t) => `${t.technique.id} ${t.technique.name}`).join("; ")
    L.push(`**ATT&CK:** ${techs || "—"}`)
    L.push("")
    L.push(`**Description:** ${f.description || "—"}`)
    if (f.evidence) {
      L.push("")
      L.push(`**Evidence:** ${f.evidence}`)
    }
    if (f.recommendation) {
      L.push("")
      L.push(`**Recommendation:** ${f.recommendation}`)
    }
    L.push("")
  })
  L.push("---")
  L.push("")
  L.push(`Report authored in the Singular/ty Command Hub. ATT&CK® © The MITRE Corporation; see NOTICE.`)
  return L.join("\n")
}

export function renderReportPdf(report: Report): Buffer {
  const e = report.engagement
  const lines: PdfLine[] = []
  lines.push({ text: `Penetration Test Report`, size: 20, bold: true })
  lines.push({ text: e.name, size: 15, bold: true, gapBefore: 4 })
  lines.push({ text: `Generated ${report.generatedAt}`, size: 8, gapBefore: 6 })
  lines.push({ text: `Client: ${e.client || "—"}`, size: 10, gapBefore: 10 })
  lines.push({ text: `Status: ${e.status}    Authorized by: ${e.authorizedBy || "—"}`, size: 10, gapBefore: 2 })
  lines.push({ text: `Scope: ${e.scope.length ? e.scope.join(", ") : "—"}`, size: 10, gapBefore: 2 })
  if (e.roe) {
    lines.push({ text: `Rules of Engagement:`, size: 11, bold: true, gapBefore: 8 })
    lines.push({ text: e.roe, size: 9, gapBefore: 2 })
  }

  lines.push({ text: `Executive Summary`, size: 14, bold: true, gapBefore: 14 })
  lines.push({ text: `${report.totalFindings} findings — risk score ${report.riskScore}.`, size: 10, gapBefore: 4 })
  for (const s of SEV_ORDER) lines.push({ text: `  ${s}: ${report.severityCounts[s]}`, size: 10, indent: 8 })

  lines.push({ text: `MITRE ATT&CK Coverage`, size: 14, bold: true, gapBefore: 14 })
  if (report.attackCoverage.length) {
    for (const t of report.attackCoverage) {
      lines.push({ text: `${t.id}  ${t.name}  [${t.tactics.join(", ")}]  ×${t.findingCount}`, size: 9, indent: 8, gapBefore: 2 })
    }
  } else {
    lines.push({ text: `No ATT&CK techniques mapped.`, size: 10, indent: 8 })
  }

  lines.push({ text: `Findings`, size: 14, bold: true, gapBefore: 14 })
  const ordered = [...report.mapped].sort(
    (a, b) => (SEV_WEIGHT[b.finding.severity] || 0) - (SEV_WEIGHT[a.finding.severity] || 0),
  )
  ordered.forEach((m, i) => {
    const f = m.finding
    lines.push({ text: `${i + 1}. ${f.title}  (${f.severity})`, size: 11, bold: true, gapBefore: 10 })
    if (f.target) lines.push({ text: `Target: ${f.target}`, size: 9, indent: 8, gapBefore: 2 })
    if (f.phase) lines.push({ text: `Phase: ${f.phase}`, size: 9, indent: 8 })
    const techs = m.techniques.map((t) => `${t.technique.id} ${t.technique.name}`).join("; ")
    lines.push({ text: `ATT&CK: ${techs || "—"}`, size: 9, indent: 8 })
    lines.push({ text: `Description: ${f.description || "—"}`, size: 9, indent: 8, gapBefore: 2 })
    if (f.evidence) lines.push({ text: `Evidence: ${f.evidence}`, size: 9, indent: 8 })
    if (f.recommendation) lines.push({ text: `Recommendation: ${f.recommendation}`, size: 9, indent: 8 })
  })
  lines.push({ text: `ATT&CK® © The MITRE Corporation; see NOTICE.`, size: 8, gapBefore: 16 })
  return renderPdf(lines, { title: `Report — ${e.name}` })
}
