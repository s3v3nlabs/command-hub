"use client"

import { useCallback, useState } from "react"
import { Radar, Search, ExternalLink, Share2, Network } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"
import { GRAPH_STORAGE_KEY } from "@/lib/offsec/graph-model"

type Pivot = { label: string; url: string }
type Dork = { label: string; category: string; query: string; url: string; note?: string }
type Node = { id: string; type: string; label: string; x: number; y: number; meta?: Record<string, string> }
type Edge = { id: string; source: string; target: string; label?: string }
type Enrichment = {
  ok: boolean
  target: string
  type: string
  pivots: Pivot[]
  dorks: Dork[]
  graph: { nodes: Node[]; edges: Edge[] }
  notes: string[]
  error?: string
}

export default function OsintEnrichPage() {
  const [target, setTarget] = useState("")
  const [token, setToken] = useState("")
  const [data, setData] = useState<Enrichment | null>(null)
  const [msg, setMsg] = useState("")

  const run = useCallback(async () => {
    setMsg("")
    try {
      const d: Enrichment = await fetch("/api/offsec/osint-enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ target }),
      }).then((r) => r.json())
      if (d.ok) setData(d)
      else setMsg(`failed: ${d.error}`)
    } catch (e) {
      setMsg(`failed: ${(e as Error).message}`)
    }
  }, [target, token])

  const exportGraph = useCallback(() => {
    if (!data) return
    try {
      localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(data.graph))
      setMsg("Exported to Entity Graph — open /offsec/graph to continue.")
    } catch (e) {
      setMsg(`export failed: ${(e as Error).message}`)
    }
  }, [data])

  return (
    <SuiteShell
      title="OSINT Auto-Enrichment"
      status="real"
      nav={
        <>
          <SuiteNavLink href="/offsec/osint" label="OSINT Suite" />
          <SuiteNavLink href="/offsec/graph" label="Entity Graph" />
        </>
      }
    >
      <div className="mx-auto max-w-4xl space-y-4">
        <header className="space-y-1">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Radar size={18} /> OSINT Auto-Enrichment
          </div>
          <p className="text-xs text-[color:var(--ghost-dim)]">
            Paste a target — it classifies the entity, fans out across the OSINT launchers + dork recipes, and builds an
            investigative graph. Launchers open real resources; nothing is auto-queried or fabricated. Authorized use only.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input
            className="ghost-input w-72"
            placeholder="domain / IP / email / @handle / phone / name"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
          />
          <input type="password" placeholder="Operator token" value={token} onChange={(e) => setToken(e.target.value)} className="ghost-input w-40" />
          <button className="ghost-btn" onClick={run} disabled={!target}>
            <Search size={13} /> Enrich
          </button>
          {data && (
            <button className="ghost-btn" onClick={exportGraph}>
              <Share2 size={13} /> Export to Entity Graph
            </button>
          )}
          {msg && <span className="text-amber-400">{msg}</span>}
        </div>

        {data && (
          <>
            <div className="rounded border border-[color:var(--ghost-line)] bg-black/50 p-3 text-xs">
              <span className="text-[color:var(--ghost-dim)]">Classified:</span> <b>{data.target}</b>{" "}
              <span className="rounded bg-indigo-900/60 px-1.5 py-0.5">{data.type}</span>
              <ul className="mt-1 list-disc pl-4 text-[color:var(--ghost-dim)]">
                {data.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>

            <div className="rounded border border-[color:var(--ghost-line)] bg-black/40 p-2">
              <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-[color:var(--ghost-dim)]">
                <Network size={13} /> Auto-built graph ({data.graph.nodes.length} nodes, {data.graph.edges.length} edges)
              </div>
              <svg viewBox="0 0 840 600" className="h-72 w-full">
                {data.graph.edges.map((e) => {
                  const s = data.graph.nodes.find((n) => n.id === e.source)
                  const t = data.graph.nodes.find((n) => n.id === e.target)
                  if (!s || !t) return null
                  return <line key={e.id} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#334155" strokeWidth={1} />
                })}
                {data.graph.nodes.map((n) => (
                  <g key={n.id}>
                    <circle cx={n.x} cy={n.y} r={n.meta?.role === "target" ? 10 : 6} fill={n.meta?.role === "target" ? "#6366f1" : n.meta?.kind === "dork" ? "#f59e0b" : "#22d3ee"} />
                    <text x={n.x + 10} y={n.y + 3} fill="#94a3b8" fontSize={9}>
                      {n.label.slice(0, 28)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded border border-[color:var(--ghost-line)] bg-black/50 p-3 text-xs">
                <div className="mb-1 font-semibold">Pivot launchers ({data.pivots.length})</div>
                {data.pivots.length ? (
                  <ul className="space-y-1">
                    {data.pivots.map((p, i) => (
                      <li key={i}>
                        <a href={p.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-cyan-300 hover:underline">
                          {p.label} <ExternalLink size={11} />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-[color:var(--ghost-dim)]">No preset launchers for this type.</div>
                )}
              </div>
              <div className="rounded border border-[color:var(--ghost-line)] bg-black/50 p-3 text-xs">
                <div className="mb-1 font-semibold">Dork recipes ({data.dorks.length})</div>
                {data.dorks.length ? (
                  <ul className="space-y-1">
                    {data.dorks.map((d, i) => (
                      <li key={i}>
                        <a href={d.url} target="_blank" rel="noreferrer" className="text-amber-300 hover:underline" title={d.query}>
                          {d.label}
                        </a>
                        <span className="text-[color:var(--ghost-dim)]"> · {d.category}</span>
                        {d.note && <span className="block text-[10px] text-amber-500">{d.note}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-[color:var(--ghost-dim)]">Dorks apply to domain/email targets.</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </SuiteShell>
  )
}
