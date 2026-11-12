"use client"

import { useCallback, useEffect, useState } from "react"
import { Radio, ShieldAlert, RefreshCw, Plus, ChevronRight, Trash2, Power } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"

type Phase = string
type Task = {
  id: string
  verb: string
  arg?: string
  phase: string
  status: string
  createdAt: string
  resolvedAt?: string
  note?: string
  stdout?: string
  stderr?: string
  exitCode?: number | null
  durationMs?: number
  argv?: string[]
}
type Beacon = {
  id: string
  label: string
  labHost: string
  os: string
  status: string
  phase: string
  checkIns: number
  tasks: Task[]
}
type KillCol = { phase: Phase; beacons: Beacon[] }
type Scope = { id: string; name: string; active: boolean; authorizedTargets: string[] }
type Verb = { id: string; summary: string }
type Payload = {
  ok: boolean
  stage1Enabled: boolean
  phases: Phase[]
  verbs: Verb[]
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
  const [labHost, setLabHost] = useState("localhost")
  const [verb, setVerb] = useState("recon")
  const [arg, setArg] = useState("")
  const [msg, setMsg] = useState("")
  const [openTask, setOpenTask] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
      setBusy(true)
      try {
        const r = await fetch("/api/offsec/c2", { method: "POST", headers: headers(), body: JSON.stringify({ ...payload, scopeId, operator, attestation, labHost: payload.labHost ?? labHost }) })
        const j = await r.json()
        if (!j.ok) {
          if (j.blocked) setMsg(`LADDER BLOCKED (stage ${j.ladder?.stage}): ${j.ladder?.reason}`)
          else setMsg(`failed: ${j.error || r.status}`)
        } else if (j.task) {
          setMsg(`task ${j.task.verb} → ${j.task.status} (exit ${j.task.exitCode}, ${j.task.durationMs}ms)`)
          setOpenTask(j.task.id)
        }
        await load()
      } catch (e) {
        setMsg(`failed: ${(e as Error).message}`)
      } finally {
        setBusy(false)
      }
    },
    [headers, scopeId, operator, attestation, labHost, load],
  )

  return (
    <SuiteShell
      title="C2 Operator Console — LIVE LAB"
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
        <div className="flex items-start gap-2 rounded border border-emerald-700 bg-emerald-950/40 p-2 text-xs text-emerald-100">
          <Radio size={16} className="mt-0.5 shrink-0" />
          <div>
            <b>REAL LAB EXECUTION.</b> Sessions bind to this hub or an isolated lab host (localhost, RFC1918, *.lab.local).
            Tasks run allowlisted commands via <code>child_process</code> and return real stdout. The scope ladder is a
            real safety gate — Stage 1 master switch: <code>C2_LAB_ENABLED=1</code>, plus an active in-window scope that
            authorizes the lab host and an attestation. No third-party host is ever contacted.
            {data && !data.stage1Enabled && (
              <span className="ml-1 font-semibold text-red-300">Stage 1 currently LOCKED — set C2_LAB_ENABLED=1 to execute.</span>
            )}
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
                  {s.name} {s.active ? "(active)" : "(inactive)"} — {s.authorizedTargets.join(", ")}
                </option>
              ))}
            </select>
            <label className="mt-1 text-[color:var(--ghost-dim)]">Attestation</label>
            <input
              className="ghost-input"
              value={attestation}
              onChange={(e) => setAttestation(e.target.value)}
              placeholder={scopeId ? `authorized under scope ${scopeId}` : 'authorized under scope <id>'}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded border border-[color:var(--ghost-line)] bg-black/50 p-3 text-xs">
          <div className="flex flex-col gap-1">
            <label className="text-[color:var(--ghost-dim)]">Session label</label>
            <input className="ghost-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="hub-session" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[color:var(--ghost-dim)]">Lab host</label>
            <input className="ghost-input" value={labHost} onChange={(e) => setLabHost(e.target.value)} placeholder="localhost" />
          </div>
          <button
            className="ghost-btn"
            disabled={busy}
            onClick={() => post({ action: "create", label, labHost })}
          >
            <Plus size={12} /> open session
          </button>
          <button className="ghost-btn" onClick={() => void load()}>
            <RefreshCw size={12} /> refresh
          </button>
          {msg && <div className="w-full font-mono text-[11px] text-amber-200">{msg}</div>}
        </div>

        {data && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="text-[color:var(--ghost-dim)]">Task verb</label>
              <select className="ghost-input !w-auto" value={verb} onChange={(e) => setVerb(e.target.value)}>
                {(data.verbs || []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id} — {v.summary}
                  </option>
                ))}
              </select>
              {(verb === "curl-local" || verb === "osquery") && (
                <input
                  className="ghost-input !w-64"
                  value={arg}
                  onChange={(e) => setArg(e.target.value)}
                  placeholder={verb === "curl-local" ? "http://127.0.0.1:3000/" : "SELECT * FROM system_info"}
                />
              )}
            </div>

            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              {(data.killChain || []).map((col) => (
                <div key={col.phase} className="rounded border border-[color:var(--ghost-line)] bg-black/40 p-2">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ghost-dim)]">{col.phase}</div>
                  <div className="space-y-2">
                    {col.beacons.map((b) => (
                      <div key={b.id} className="rounded border border-[color:var(--ghost-line)] bg-black/50 p-1.5 text-[10px]">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-emerald-200">{b.label}</span>
                          <span className={`rounded px-1 ${b.status === "active" ? "bg-emerald-900 text-emerald-300" : b.status === "retired" ? "bg-zinc-800 text-zinc-500" : "bg-amber-900 text-amber-300"}`}>{b.status}</span>
                        </div>
                        <div className="text-[color:var(--ghost-dim)]">{b.labHost} · {b.os} · ×{b.checkIns}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <button
                            className="ghost-btn !px-1 !py-0.5"
                            disabled={busy}
                            onClick={() => post({ action: "task", id: b.id, verb, arg, phase: b.phase, labHost: b.labHost })}
                          >
                            run {verb}
                          </button>
                          {data.phases.map((p) =>
                            p !== b.phase ? (
                              <button key={p} className="ghost-btn !px-1 !py-0.5" title={`advance to ${p}`} onClick={() => post({ action: "advance", id: b.id, phase: p, labHost: b.labHost })}>
                                <ChevronRight size={10} /> {p.slice(0, 4)}
                              </button>
                            ) : null,
                          )}
                          <button className="ghost-btn !px-1 !py-0.5" onClick={() => post({ action: "retire", id: b.id, labHost: b.labHost })}><Power size={10} /></button>
                          <button className="ghost-btn danger !px-1 !py-0.5" onClick={() => post({ action: "delete", id: b.id, labHost: b.labHost })}><Trash2 size={10} /></button>
                        </div>
                        {b.tasks.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {b.tasks.slice(0, 4).map((t) => (
                              <div key={t.id}>
                                <button
                                  className="text-left text-[color:var(--ghost-dim)] hover:text-emerald-200"
                                  onClick={() => setOpenTask(openTask === t.id ? null : t.id)}
                                >
                                  {t.verb} · {t.status}
                                  {t.exitCode != null ? ` · exit ${t.exitCode}` : ""}
                                  {t.durationMs != null ? ` · ${t.durationMs}ms` : ""}
                                </button>
                                {openTask === t.id && (
                                  <pre className="mt-0.5 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-black/80 p-1 font-mono text-[9px] text-emerald-100">
                                    {t.argv?.join(" ") || t.verb}
                                    {"\n"}
                                    {t.stdout || ""}
                                    {t.stderr ? "\n[stderr]\n" + t.stderr : ""}
                                    {t.note ? "\n# " + t.note : ""}
                                  </pre>
                                )}
                              </div>
                            ))}
                          </div>
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
        {!data && (
          <div className="flex items-start gap-2 text-xs text-amber-200">
            <ShieldAlert size={14} /> Waiting for /api/offsec/c2 (hub auth may be required).
          </div>
        )}
      </div>
    </SuiteShell>
  )
}
