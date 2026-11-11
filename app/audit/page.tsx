"use client"

import { useCallback, useEffect, useState } from "react"
import { History, RefreshCw, ShieldCheck, Lock, Filter } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"

type Entry = {
  ts: string
  source: string
  category: "authz" | "detection" | "deception" | "eyes-only"
  actor?: string
  action: string
  detail?: string
  severity?: string
  allowed?: boolean
  sealed?: boolean
}
type Payload = {
  ok: boolean
  entries: Entry[]
  counts: Record<string, number>
  heimdallAuthorized: boolean
  generatedAt: string
}

const CAT_COLORS: Record<string, string> = {
  authz: "text-sky-300",
  detection: "text-red-300",
  deception: "text-amber-300",
  "eyes-only": "text-violet-300",
}

export default function AuditPage() {
  const [data, setData] = useState<Payload | null>(null)
  const [token, setToken] = useState("")
  const [heimdall, setHeimdall] = useState("")
  const [filter, setFilter] = useState<string>("all")
  const [msg, setMsg] = useState("")

  const load = useCallback(async () => {
    try {
      const qs = heimdall ? `?heimdall=${encodeURIComponent(heimdall)}` : ""
      const d: Payload = await fetch(`/api/audit/timeline${qs}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then((r) => r.json())
      if (d.ok) setData(d)
      else setMsg("load failed (auth?)")
    } catch (e) {
      setMsg(`load failed: ${(e as Error).message}`)
    }
  }, [token, heimdall])

  useEffect(() => {
    load()
  }, [load])

  const entries = (data?.entries || []).filter((e) => filter === "all" || e.category === filter)

  return (
    <SuiteShell
      title="Audit Timeline"
      status="real"
      nav={
        <>
          <SuiteNavLink href="/offsec/deception" label="Deception" />
          <SuiteNavLink href="/offsec/attack-navigator" label="ATT&CK" />
        </>
      }
    >
      <div className="mx-auto max-w-4xl space-y-3">
        <header className="space-y-1">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <History size={18} /> Audit Timeline
          </div>
          <p className="text-xs text-[color:var(--ghost-dim)]">
            Unified who-did-what-when across modules. Eyes-only records stay <b>sealed</b> unless a Heimdall token is
            presented — only Heimdall crosses the Bifrost.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input type="password" placeholder="Operator token" value={token} onChange={(e) => setToken(e.target.value)} className="ghost-input w-40" />
          <input type="password" placeholder="Heimdall token (unseal)" value={heimdall} onChange={(e) => setHeimdall(e.target.value)} className="ghost-input w-44" />
          <button className="ghost-btn" onClick={load}>
            <RefreshCw size={13} /> Refresh
          </button>
          <span className="flex items-center gap-1 text-[color:var(--ghost-dim)]">
            <Filter size={12} />
            <select className="ghost-input !py-0.5" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">all</option>
              <option value="authz">authz</option>
              <option value="detection">detection</option>
              <option value="deception">deception</option>
              <option value="eyes-only">eyes-only</option>
            </select>
          </span>
          {data && (
            <span className={`flex items-center gap-1 ${data.heimdallAuthorized ? "text-emerald-400" : "text-violet-400"}`}>
              {data.heimdallAuthorized ? <ShieldCheck size={13} /> : <Lock size={13} />}
              {data.heimdallAuthorized ? "eyes-only unsealed" : "eyes-only sealed"}
            </span>
          )}
          {msg && <span className="text-amber-400">{msg}</span>}
        </div>

        {data && (
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(data.counts).map(([c, n]) => (
              <span key={c} className={`rounded bg-zinc-800 px-2 py-0.5 ${CAT_COLORS[c] || ""}`}>
                {c}: {n}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-1">
          {entries.map((e, i) => (
            <div key={i} className="flex items-start gap-2 rounded border border-[color:var(--ghost-line)] bg-black/40 px-2 py-1 text-xs">
              <span className="w-36 shrink-0 font-mono text-[10px] text-[color:var(--ghost-dim)]">{e.ts?.replace("T", " ").slice(0, 19)}</span>
              <span className={`w-20 shrink-0 font-semibold ${CAT_COLORS[e.category] || ""}`}>{e.category}</span>
              <span className="min-w-0 flex-1">
                {e.sealed ? (
                  <span className="flex items-center gap-1 text-violet-300">
                    <Lock size={11} /> sealed record (present Heimdall token to view)
                  </span>
                ) : (
                  <>
                    <span className="font-medium">{e.action}</span>
                    {e.actor && <span className="text-[color:var(--ghost-dim)]"> · {e.actor}</span>}
                    {e.detail && <span className="block text-[10px] text-[color:var(--ghost-dim)]">{e.detail}</span>}
                  </>
                )}
              </span>
              <span className="shrink-0 text-[10px] text-[color:var(--ghost-dim)]">{e.source}</span>
            </div>
          ))}
          {!entries.length && <div className="text-xs text-[color:var(--ghost-dim)]">No audit entries for this filter yet.</div>}
        </div>
      </div>
    </SuiteShell>
  )
}
