"use client"

import { useCallback, useEffect, useState } from "react"
import { ShieldCheck, RefreshCw, Save, AlertTriangle } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"

type Proposal = {
  id: string
  title: string
  severity: string
  pattern: string
  observedCount: number
  lastSeen?: string
  techniques: string[]
  rationale: string
  suggestedChange: string
  autoApplied: false
}
type Payload = { ok: boolean; proposals: Proposal[]; observed: number }

const SEV: Record<string, string> = {
  critical: "bg-red-800 text-red-100",
  high: "bg-orange-800 text-orange-100",
  medium: "bg-amber-800 text-amber-100",
  low: "bg-sky-800 text-sky-100",
  info: "bg-zinc-800 text-zinc-300",
}

export default function DefenseProposalsPage() {
  const [data, setData] = useState<Payload | null>(null)
  const [token, setToken] = useState("")
  const [msg, setMsg] = useState("")

  const load = useCallback(async () => {
    try {
      const d: Payload = await fetch("/api/dev-operator/defense-proposals", { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then((r) => r.json())
      if (d.ok) setData(d)
      else setMsg("load failed (auth?)")
    } catch (e) {
      setMsg(`load failed: ${(e as Error).message}`)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const save = useCallback(
    async (id: string) => {
      setMsg("")
      try {
        const r = await fetch("/api/dev-operator/defense-proposals", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ action: "save", id }),
        })
        const j = await r.json()
        setMsg(j.ok ? `Saved review draft: ${j.path}` : `save failed: ${j.error || r.status}`)
      } catch (e) {
        setMsg(`save failed: ${(e as Error).message}`)
      }
    },
    [token],
  )

  return (
    <SuiteShell
      title="Dev Operator — Defense Proposals"
      status="real"
      nav={
        <>
          <SuiteNavLink href="/dev-operator" label="Dev Operator" />
          <SuiteNavLink href="/audit" label="Audit" />
          <SuiteNavLink href="/offsec/attack-navigator" label="ATT&CK" />
        </>
      }
    >
      <div className="mx-auto max-w-4xl space-y-3">
        <header className="space-y-1">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck size={18} /> Autonomous Defense Proposals
          </div>
          <p className="text-xs text-[color:var(--ghost-dim)]">
            The Dev Operator watches Heimdall (IDS + deception) and drafts <b>defensive</b> hardening proposals for your
            review. Proposals are <b>never auto-applied</b>. Defensive only · HOLD_VYRNA_UNSYNC · no exploit generation.
          </p>
        </header>

        <div className="flex items-center gap-2 text-xs">
          <input type="password" placeholder="Operator token" value={token} onChange={(e) => setToken(e.target.value)} className="ghost-input w-40" />
          <button className="ghost-btn" onClick={load}>
            <RefreshCw size={13} /> Refresh
          </button>
          {data && <span className="text-[color:var(--ghost-dim)]">{data.observed} events analyzed</span>}
          {msg && <span className="text-amber-400">{msg}</span>}
        </div>

        {data && !data.proposals.length && (
          <div className="flex items-center gap-2 rounded border border-emerald-700 bg-emerald-950/30 p-2 text-xs text-emerald-300">
            <ShieldCheck size={14} /> No attack patterns observed yet — no proposals. (Run the purple-team replay or trigger decoys to generate signal.)
          </div>
        )}

        <div className="space-y-2">
          {data?.proposals.map((p) => (
            <div key={p.id} className="rounded border border-[color:var(--ghost-line)] bg-black/50 p-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] ${SEV[p.severity] || ""}`}>{p.severity}</span>
                  <span className="font-semibold">{p.title}</span>
                </div>
                <button className="ghost-btn !px-2 !py-0.5" onClick={() => save(p.id)}>
                  <Save size={12} /> Save review draft
                </button>
              </div>
              <div className="mt-1 text-[color:var(--ghost-dim)]">
                pattern <code>{p.pattern}</code> ×{p.observedCount} · ATT&CK {p.techniques.join(", ") || "—"}
                {p.lastSeen ? ` · last ${p.lastSeen}` : ""}
              </div>
              <div className="mt-1">{p.rationale}</div>
              <pre className="mt-2 whitespace-pre-wrap rounded bg-black/60 p-2 text-[11px] text-[color:var(--ghost-ink)]">{p.suggestedChange}</pre>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400">
                <AlertTriangle size={11} /> Review before applying — not auto-applied.
              </div>
            </div>
          ))}
        </div>
      </div>
    </SuiteShell>
  )
}
