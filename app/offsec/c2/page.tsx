"use client"

import { useCallback, useEffect, useState } from "react"
import { Radio, ShieldAlert, RefreshCw, Plus, ChevronRight, Trash2, Power } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"

type Phase = string
type Task = { id: string; verb: string; arg?: string; phase: string; status: string; createdAt: string; note?: string }
type Beacon = { id: string; label: string; labHost: string; os: string; status: string; phase: string; checkIns: number; tasks: Task[] }
type KillCol = { phase: Phase; beacons: Beacon[] }
type Scope = { id: string; name: string; active: boolean; authorizedTargets: string[] }
type Payload = {
  ok: boolean
  simulated: boolean
  stage1Enabled: boolean
  phases: Phase[]
  beacons: Beacon[]
  killChain: KillCol[]
}

export default function C2ConsolePage() {
  const [data, setData] = useState<Payload | null>(null)
  const [scopes, setScopes] = useState<Scope[]>([])
  const [token, setToken] = useState("")
  const [scopeId, setScopeId] = useState("")
  const [operator, setOperator] = useState("")
  const [attestation, setAttestation] = useState("")
  const [label, setLabel] = useState("")
  const [labHost, setLabHost] = useState("")
  const [msg, setMsg] = useState("")

  const headers = useCallback((): Record<string, string> => ({ "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }), [token])

  const load = useCallback(async () => {
    try {
      const d = await fetch("/api/offsec/c2", { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then((r) => r.json())
      if (d.ok) setData(d)
      const s = await fetch("/api/offsec/scope", { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then((r) => r.json()).catch(() => ({}))
      if (s?.scopes) setScopes(s.scopes)
    } catch (e) {
      setMsg(`load failed: ${(e as Error).message}`)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const post = useCallback(
    async (payload: Record<string, unknown>) => {
      setMsg("")
      try {
        const r = await fetch("/api/offsec/c2", { method: "POST", headers: headers(), body: JSON.stringify({ ...payload, scopeId, operator, attestation, labHost: payload.labHost ?? labHost }) })
        const j = await r.json()
        if (!j.ok) {
          if (j.blocked) setMsg(`LADDER BLOCKED (stage ${j.ladder?.stage}): ${j.ladder?.reason}`)
          else setMsg(`failed: ${j.error || r.status}`)
        }
        await load()
      } catch (e) {
        setMsg(`failed: ${(e as Error).message}`)
      }
    },
    [headers, scopeId, operator, attestation, labHost, load],
  )

  return (
    <SuiteShell
      title="C2 Operator Console — LAB SIMULATION"
      status="local"
      nav={
        <>
          <SuiteNavLink href="/offsec/engagements" label="Scopes" />
          <SuiteNavLink href="/offsec/attack-navigator" label="ATT&CK" />
          <SuiteNavLink href="/offsec/replay" label="Replay" />
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded border border-amber-600 bg-amber-950/40 p-2 text-xs text-amber-200">
          <ShieldAlert size={16} className="mt-0.5 shrink-0" />
          <div>
            <b>AUTHORIZED LAB SIMULATION ONLY.</b> These are simulated beacons inside the hub's own lab. There is no real
            command-and-control channel and no third-party host is ever contacted. Every action is staged-ladder gated,
            audited, and mirrored to the Heimdall eyes-only log. Stage 1 master switch: <code>C2_LAB_ENABLED=1</code>.
            {data && !data.stage1Enabled && <span className="ml-1 font-semibold text-red-300">Stage 1 currently LOCKED.</span>}
          </div>
        </div>

        <div className="grid gap-2 rounded border border-[color:var(--ghost-line)] bg-black/50 p-3 text-xs md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-[color:var(--ghost-dim)]">Operator token</label>
            <input type="password" className="ghost-input" value={token} onChange={(e) => setToken(e.target.value)} />
            <label className="mt-1 text-[color:var(--ghost-dim)]">Operator identity</label>
            <input className="ghost-input" value={operator} onChange={(e) => setOperator(e.target.value)} placeholder="you@org" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[color:var(--ghost-dim)]">Engagement scope (active, authorizes labHost)</label>
            <select className="ghost-input" value={scopeId} onChange={(e) => setScopeId(e.target.value)}>
              <option value="">Select scope…</option>
              {scopes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.active ? "(active)" : "(inactive)"}
                </option>
              ))}
            </select>
            <label className="mt-1 text-[color:var(--ghost-dim)]">Attestation</label>
            <input
              className="ghost-input"
              value={attestation}
              onChange={(e) => setAttestation(e.target.value)}
              placeholder={`authorized under scope ${scopeId || "<id>"}`}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded border border-[color:var(--ghost-line)] bg-black/50 p-3 text-xs">
          <div className="flex flex-col gap-1">
            <label className="text-[color:var(--ghost-dim)]">New beacon label</label>
            <input className="ghost-input w-40" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="lab-win10-01" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[color:var(--ghost-dim)]">Lab host id (not a real target)</label>
            <input className="ghost-input w-48" value={labHost} onChange={(e) => setLabHost(e.target.value)} placeholder="lab.local/win10-01" />
          </div>
          <button className="ghost-btn" onClick={() => post({ action: "create", label })} disabled={!label || !labHost}>
            <Plus size={13} /> Spawn sim beacon
          </button>
          <button className="ghost-btn" onClick={load}>
            <RefreshCw size={13} /> Refresh
          </button>
          {msg && <span className="text-amber-400">{msg}</span>}
        </div>

        {data && (
          <div className="overflow-x-auto">
            <div className="flex gap-2 pb-2" style={{ minWidth: "max-content" }}>
              {data.killChain.map((col) => (
                <div key={col.phase} className="w-52 shrink-0 rounded border border-[color:var(--ghost-line)] bg-black/40 p-2">
                  <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--ghost-dim)]">
                    <Radio size={11} /> {col.phase}
                  </div>
                  <div className="space-y-1">
                    {col.beacons.map((b) => (
                      <div key={b.id} className="rounded border border-[color:var(--ghost-line)] bg-black/60 p-1.5 text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{b.label}</span>
                          <span className={`rounded px-1 ${b.status === "active" ? "bg-emerald-900 text-emerald-300" : b.status === "retired" ? "bg-zinc-800 text-zinc-500" : "bg-amber-900 text-amber-300"}`}>{b.status}</span>
                        </div>
                        <div className="text-[color:var(--ghost-dim)]">{b.labHost} · {b.os} · ×{b.checkIns}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <button className="ghost-btn !px-1 !py-0.5" onClick={() => post({ action: "task", id: b.id, verb: "sim-recon", phase: b.phase })}>task</button>
                          {data.phases.map((p) =>
                            p !== b.phase ? (
                              <button key={p} className="ghost-btn !px-1 !py-0.5" title={`advance to ${p}`} onClick={() => post({ action: "advance", id: b.id, phase: p })}>
                                <ChevronRight size={10} /> {p.slice(0, 4)}
                              </button>
                            ) : null,
                          )}
                          <button className="ghost-btn !px-1 !py-0.5" onClick={() => post({ action: "retire", id: b.id })}><Power size={10} /></button>
                          <button className="ghost-btn danger !px-1 !py-0.5" onClick={() => post({ action: "delete", id: b.id })}><Trash2 size={10} /></button>
                        </div>
                        {b.tasks.length > 0 && (
                          <div className="mt-1 text-[color:var(--ghost-dim)]">{b.tasks.length} sim task(s): {b.tasks.slice(0, 2).map((t) => t.verb).join(", ")}</div>
                        )}
                      </div>
                    ))}
                    {!col.beacons.length && <div className="text-[10px] text-[color:var(--ghost-dim)]">—</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SuiteShell>
  )
}
