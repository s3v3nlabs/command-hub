"use client"

import { useCallback, useEffect, useState } from "react"
import { Repeat, RefreshCw, Plus, Play, Trash2, Check, X, Info } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"

type EventResult = {
  eventId: string
  label: string
  detectionFired: boolean
  reasons: string[]
  severity: string
  techniques: string[]
  expectDetection?: boolean
  expectTechnique?: string
  pass: boolean
  verdict: "pass" | "fail" | "info"
}
type Summary = { runId: string; at: string; total: number; passed: number; failed: number; info: number; results: EventResult[] }
type Run = { id: string; name: string; description?: string; events: unknown[]; lastReplayAt?: string; lastResult?: Summary }

export default function ReplayPage() {
  const [runs, setRuns] = useState<Run[]>([])
  const [token, setToken] = useState("")
  const [name, setName] = useState("")
  const [summary, setSummary] = useState<Summary | null>(null)
  const [msg, setMsg] = useState("")

  const headers = useCallback((): Record<string, string> => ({ "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }), [token])

  const load = useCallback(async () => {
    try {
      const d = await fetch("/api/offsec/replay", { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then((r) => r.json())
      if (d.ok) setRuns(d.runs)
      else setMsg("load failed (auth?)")
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
        const r = await fetch("/api/offsec/replay", { method: "POST", headers: headers(), body: JSON.stringify(payload) })
        const j = await r.json()
        if (!j.ok) setMsg(`failed: ${j.error || r.status}`)
        if (j.summary) setSummary(j.summary)
        await load()
        return j
      } catch (e) {
        setMsg(`failed: ${(e as Error).message}`)
      }
    },
    [headers, load],
  )

  const VerdictIcon = ({ v }: { v: string }) => (v === "pass" ? <Check size={12} className="text-emerald-400" /> : v === "fail" ? <X size={12} className="text-red-400" /> : <Info size={12} className="text-zinc-400" />)

  return (
    <SuiteShell
      title="Purple-Team Replay"
      status="real"
      nav={
        <>
          <SuiteNavLink href="/offsec/attack-navigator" label="ATT&CK" />
          <SuiteNavLink href="/offsec/deception" label="Deception" />
        </>
      }
    >
      <div className="mx-auto max-w-4xl space-y-4">
        <header className="space-y-1">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Repeat size={18} /> Purple-Team Replay
          </div>
          <p className="text-xs text-[color:var(--ghost-dim)]">
            Record a lab attack run (event sequence) and replay it through Heimdall's detection path (request-guard +
            ATT&CK mapping) to regression-test defenses. No traffic is sent — events are evaluated locally.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input type="password" placeholder="Operator token" value={token} onChange={(e) => setToken(e.target.value)} className="ghost-input w-40" />
          <input placeholder="Run name" value={name} onChange={(e) => setName(e.target.value)} className="ghost-input w-48" />
          <button className="ghost-btn" onClick={() => post({ action: "record", name: name || "Example attack run" })}>
            <Plus size={13} /> Record example run
          </button>
          <button className="ghost-btn" onClick={load}>
            <RefreshCw size={13} /> Refresh
          </button>
          {msg && <span className="text-amber-400">{msg}</span>}
        </div>

        <div className="space-y-2">
          {runs.map((run) => (
            <div key={run.id} className="rounded border border-[color:var(--ghost-line)] bg-black/50 p-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">{run.name}</span>{" "}
                  <span className="text-[color:var(--ghost-dim)]">· {run.events.length} events{run.lastReplayAt ? ` · last ${run.lastReplayAt}` : ""}</span>
                </div>
                <div className="flex gap-1">
                  <button className="ghost-btn !px-2 !py-0.5" onClick={() => post({ action: "replay", id: run.id })}>
                    <Play size={12} /> Replay
                  </button>
                  <button className="ghost-btn danger !px-2 !py-0.5" onClick={() => post({ action: "delete", id: run.id })}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              {run.lastResult && (
                <div className="mt-1 flex gap-2">
                  <span className="rounded bg-emerald-900 px-1.5 text-emerald-300">pass {run.lastResult.passed}</span>
                  <span className="rounded bg-red-900 px-1.5 text-red-300">fail {run.lastResult.failed}</span>
                  <span className="rounded bg-zinc-800 px-1.5 text-zinc-400">info {run.lastResult.info}</span>
                </div>
              )}
            </div>
          ))}
          {!runs.length && <div className="text-xs text-[color:var(--ghost-dim)]">No runs yet. Record the example run to get started.</div>}
        </div>

        {summary && (
          <div className="rounded border border-[color:var(--ghost-line)] bg-black/50 p-3 text-xs">
            <div className="mb-2 font-semibold">
              Detection report — {summary.passed}/{summary.total} passed, {summary.failed} failed, {summary.info} info
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left text-[color:var(--ghost-dim)]">
                  <th className="pb-1">Event</th>
                  <th>Detected</th>
                  <th>ATT&CK</th>
                  <th>Reasons</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {summary.results.map((r) => (
                  <tr key={r.eventId} className="border-t border-[color:var(--ghost-line)]/40">
                    <td className="py-1 pr-2">{r.label}</td>
                    <td>{r.detectionFired ? "yes" : "no"}</td>
                    <td>{r.techniques.join(", ") || "—"}</td>
                    <td className="max-w-[12rem] truncate" title={r.reasons.join("; ")}>{r.reasons.join("; ") || "—"}</td>
                    <td className="flex items-center gap-1">
                      <VerdictIcon v={r.verdict} /> {r.verdict}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SuiteShell>
  )
}
