"use client"

import { useCallback, useEffect, useState } from "react"
import { FileText, RefreshCw, Download, ShieldAlert } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"

type Eng = { id: string; name: string; client?: string; status: string; findings: unknown[] }
type Cov = { id: string; name: string; tactics: string[]; url: string; findingCount: number }
type ReportJson = {
  ok: boolean
  report?: {
    engagement: { id: string; name: string; status: string; client?: string }
    generatedAt: string
    severityCounts: Record<string, number>
    totalFindings: number
    riskScore: number
    attackCoverage: Cov[]
    mapped: { finding: { id: string; title: string; severity: string }; techniques: { id: string; name: string; reason: string }[] }[]
  }
  error?: string
}

export default function ReportPage() {
  const [engagements, setEngagements] = useState<Eng[]>([])
  const [sel, setSel] = useState<string>("")
  const [token, setToken] = useState("")
  const [report, setReport] = useState<ReportJson["report"] | null>(null)
  const [msg, setMsg] = useState("")

  const headers = useCallback((): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}), [token])

  const loadEng = useCallback(async () => {
    try {
      const d = await fetch("/api/offsec/engagements", { headers: headers() }).then((r) => r.json())
      const list: Eng[] = d?.engagements || d?.items || (Array.isArray(d) ? d : [])
      setEngagements(list)
      if (list.length && !sel) setSel(list[0].id)
    } catch (e) {
      setMsg(`load failed: ${(e as Error).message}`)
    }
  }, [headers, sel])

  useEffect(() => {
    loadEng()
  }, [loadEng])

  const generate = useCallback(async () => {
    if (!sel) return
    setMsg("")
    try {
      const d: ReportJson = await fetch(`/api/offsec/report?id=${encodeURIComponent(sel)}&format=json`, { headers: headers() }).then((r) => r.json())
      if (d.ok) setReport(d.report || null)
      else setMsg(`generate failed: ${d.error}`)
    } catch (e) {
      setMsg(`generate failed: ${(e as Error).message}`)
    }
  }, [sel, headers])

  const download = useCallback(
    async (format: "md" | "pdf") => {
      if (!sel) return
      try {
        const res = await fetch(`/api/offsec/report?id=${encodeURIComponent(sel)}&format=${format}`, { headers: headers() })
        if (!res.ok) {
          setMsg(`download failed: ${res.status}`)
          return
        }
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `report.${format}`
        a.click()
        URL.revokeObjectURL(url)
      } catch (e) {
        setMsg(`download failed: ${(e as Error).message}`)
      }
    },
    [sel, headers],
  )

  return (
    <SuiteShell
      title="Engagement Report Builder"
      status="real"
      nav={
        <>
          <SuiteNavLink href="/offsec/engagements" label="Engagements" />
          <SuiteNavLink href="/offsec/attack-navigator" label="ATT&CK Navigator" />
        </>
      }
    >
      <div className="mx-auto max-w-4xl space-y-4">
        <header className="space-y-1">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <FileText size={18} /> Report Builder
          </div>
          <p className="text-xs text-[color:var(--ghost-dim)]">
            Findings → MITRE ATT&CK mapping → markdown / PDF. Built from the engagements DB. ATT&CK® © MITRE (see NOTICE).
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          <select className="ghost-input" value={sel} onChange={(e) => setSel(e.target.value)}>
            <option value="">Select engagement…</option>
            {engagements.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.findings?.length ?? 0} findings)
              </option>
            ))}
          </select>
          <input
            type="password"
            placeholder="Operator token (if required)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="ghost-input w-56 text-xs"
          />
          <button className="ghost-btn" onClick={loadEng}>
            <RefreshCw size={13} /> Reload
          </button>
          <button className="ghost-btn" onClick={generate} disabled={!sel}>
            Generate
          </button>
          <button className="ghost-btn" onClick={() => download("md")} disabled={!sel}>
            <Download size={13} /> Markdown
          </button>
          <button className="ghost-btn" onClick={() => download("pdf")} disabled={!sel}>
            <Download size={13} /> PDF
          </button>
          {msg && <span className="text-xs text-amber-400">{msg}</span>}
        </div>

        {!engagements.length && (
          <div className="flex items-center gap-2 rounded border border-amber-700 bg-amber-950/30 p-2 text-xs text-amber-300">
            <ShieldAlert size={14} /> No engagements found. Create one under /offsec/engagements first.
          </div>
        )}

        {report && (
          <div className="space-y-3 text-xs">
            <div className="rounded border border-[color:var(--ghost-line)] bg-black/50 p-3">
              <div className="font-semibold text-sm">{report.engagement.name}</div>
              <div className="text-[color:var(--ghost-dim)]">
                {report.engagement.client || "—"} · {report.engagement.status} · generated {report.generatedAt}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(report.severityCounts).map(([s, c]) => (
                  <span key={s} className="rounded bg-zinc-800 px-2 py-0.5">
                    {s}: {c}
                  </span>
                ))}
                <span className="rounded bg-indigo-900/60 px-2 py-0.5">risk {report.riskScore}</span>
              </div>
            </div>
            <div className="rounded border border-[color:var(--ghost-line)] bg-black/50 p-3">
              <div className="mb-1 font-semibold">ATT&CK Coverage ({report.attackCoverage.length})</div>
              {report.attackCoverage.length ? (
                <ul className="space-y-0.5">
                  {report.attackCoverage.map((t) => (
                    <li key={t.id}>
                      <a href={t.url} target="_blank" rel="noreferrer" className="text-indigo-300 hover:underline">
                        {t.id} {t.name}
                      </a>{" "}
                      <span className="text-[color:var(--ghost-dim)]">[{t.tactics.join(", ")}] ×{t.findingCount}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-[color:var(--ghost-dim)]">No techniques mapped.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </SuiteShell>
  )
}
