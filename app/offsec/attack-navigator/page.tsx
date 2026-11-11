"use client"

import { useCallback, useEffect, useState } from "react"
import { Crosshair, RefreshCw, Play, Pause } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"

type Cell = { technique: { id: string; name: string; url: string }; hits: number; lastSeen?: string; sources: string[] }
type Column = { id: string; name: string; techniques: Cell[] }
type Model = {
  ok: boolean
  generatedAt: string
  totalObserved: number
  totalHits: number
  columns: Column[]
  topTechniques: { id: string; name: string; hits: number }[]
}

function heat(hits: number, max: number): string {
  if (hits <= 0) return "bg-black/40 border-[color:var(--ghost-line)] text-[color:var(--ghost-dim)]"
  const r = max > 0 ? hits / max : 0
  if (r > 0.66) return "bg-red-700/70 border-red-500 text-white"
  if (r > 0.33) return "bg-orange-700/60 border-orange-500 text-white"
  return "bg-amber-800/40 border-amber-600 text-amber-100"
}

export default function AttackNavigatorPage() {
  const [model, setModel] = useState<Model | null>(null)
  const [token, setToken] = useState("")
  const [auto, setAuto] = useState(true)
  const [msg, setMsg] = useState("")

  const load = useCallback(async () => {
    try {
      const d: Model = await fetch("/api/offsec/attack-navigator", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).then((r) => r.json())
      if (d.ok) setModel(d)
      else setMsg("load failed (auth?)")
    } catch (e) {
      setMsg(`load failed: ${(e as Error).message}`)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!auto) return
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [auto, load])

  const maxHits = model ? Math.max(1, ...model.columns.flatMap((c) => c.techniques.map((t) => t.hits))) : 1

  return (
    <SuiteShell
      title="Live ATT&CK Navigator"
      status="real"
      nav={
        <>
          <SuiteNavLink href="/offsec/deception" label="Deception" />
          <SuiteNavLink href="/offsec/report" label="Report" />
          <SuiteNavLink href="/audit" label="Audit" />
        </>
      }
    >
      <div className="space-y-3">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Crosshair size={18} /> Live ATT&CK Navigator
            </div>
            <p className="text-xs text-[color:var(--ghost-dim)]">
              Techniques light up as Heimdall (IDS ring + deception mesh) observes matching events. ATT&CK® © MITRE (see NOTICE).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              placeholder="Operator token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="ghost-input w-40 text-xs"
            />
            <button className="ghost-btn" onClick={() => setAuto((v) => !v)} data-on={auto}>
              {auto ? <Pause size={13} /> : <Play size={13} />} {auto ? "Live" : "Paused"}
            </button>
            <button className="ghost-btn" onClick={load}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </header>

        {msg && <div className="text-xs text-amber-400">{msg}</div>}

        {model && (
          <>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-zinc-800 px-2 py-0.5">observed: {model.totalObserved}</span>
              <span className="rounded bg-zinc-800 px-2 py-0.5">technique hits: {model.totalHits}</span>
              {model.topTechniques.slice(0, 5).map((t) => (
                <span key={t.id} className="rounded bg-red-900/60 px-2 py-0.5 text-red-200">
                  {t.id} ×{t.hits}
                </span>
              ))}
            </div>

            <div className="overflow-x-auto">
              <div className="flex gap-2 pb-2" style={{ minWidth: "max-content" }}>
                {model.columns.map((col) => (
                  <div key={col.id} className="w-40 shrink-0">
                    <div className="mb-1 truncate text-[10px] font-semibold uppercase tracking-wide text-[color:var(--ghost-dim)]" title={col.name}>
                      {col.name}
                    </div>
                    <div className="space-y-1">
                      {col.techniques.map((cell) => (
                        <a
                          key={cell.technique.id}
                          href={cell.technique.url}
                          target="_blank"
                          rel="noreferrer"
                          title={`${cell.technique.id} ${cell.technique.name}${cell.hits ? ` · ${cell.hits} hits · ${cell.sources.join(", ")}` : ""}`}
                          className={`block rounded border px-1.5 py-1 text-[10px] leading-tight ${heat(cell.hits, maxHits)}`}
                        >
                          <span className="block font-mono">{cell.technique.id}{cell.hits ? ` ×${cell.hits}` : ""}</span>
                          <span className="block truncate opacity-80">{cell.technique.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </SuiteShell>
  )
}
