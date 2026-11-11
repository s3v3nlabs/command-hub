export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { listEngagements } from "@/lib/offsec/engagements-store"
import { buildReport, renderMarkdown, renderReportPdf } from "@/lib/offsec/report/generate"

function slug(s: string): string {
  return (s || "report").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "report"
}

export async function GET(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:report" })
  if (denied) return denied
  const sp = request.nextUrl.searchParams
  const id = sp.get("id") || ""
  const format = (sp.get("format") || "json").toLowerCase()
  const eng = listEngagements().find((e) => e.id === id)
  if (!eng) return NextResponse.json({ ok: false, error: "engagement_not_found" }, { status: 404 })

  const report = buildReport(eng)
  if (format === "md" || format === "markdown") {
    const md = renderMarkdown(report)
    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="report-${slug(eng.name)}.md"`,
      },
    })
  }
  if (format === "pdf") {
    const pdf = renderReportPdf(report)
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-${slug(eng.name)}.pdf"`,
      },
    })
  }
  return NextResponse.json({
    ok: true,
    report: {
      engagement: { id: eng.id, name: eng.name, client: eng.client, status: eng.status },
      generatedAt: report.generatedAt,
      severityCounts: report.severityCounts,
      totalFindings: report.totalFindings,
      riskScore: report.riskScore,
      attackCoverage: report.attackCoverage,
      mapped: report.mapped.map((m) => ({
        finding: { id: m.finding.id, title: m.finding.title, severity: m.finding.severity },
        techniques: m.techniques.map((t) => ({ id: t.technique.id, name: t.technique.name, reason: t.reason })),
      })),
    },
    hold: "HOLD_VYRNA_UNSYNC",
    lattice_sync: false,
  })
}
