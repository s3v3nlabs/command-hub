"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, RefreshCw, Trash2, FileText, Bug, Target } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"

type Severity = "info" | "low" | "medium" | "high" | "critical"
type Status = "scoping" | "active" | "reporting" | "closed"
type Finding = { id: string; title: string; severity: Severity; phase?: string; target?: string; description: string; recommendation?: string; createdAt: string }
type Note = { id: string; phase?: string; target?: string; body: string; createdAt: string }
type Engagement = {
  id: string
  name: string
  client?: string
  scope: string[]
  roe?: string
  authorizedBy?: string
  status: Status
  findings: Finding[]
  notes: Note[]
  updatedAt: string
}

const SEV_ORDER: Severity[] = ["critical", "high", "medium", "low", "info"]

export default function EngagementsPage() {
  const [items, setItems] = useState<Engagement[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [client, setClient] = useState("")
  const [scope, setScope] = useState("")
  const [authorizedBy, setAuthorizedBy] = useState("")

  const [note, setNote] = useState("")
  const [notePhase, setNotePhase] = useState("")
  const [fTitle, setFTitle] = useState("")
  const [fSev, setFSev] = useState<Severity>("medium")
  const [fTarget, setFTarget] = useState("")
  const [fDesc, setFDesc] = useState("")
  const [fRec, setFRec] = useState("")

  const refresh = useCallback(async () => {
    try {
      const data = await fetch("/api/offsec/engagements").then((r) => r.json())
      if (data?.ok) {
        setItems(data.engagements || [])
        if (!activeId && data.engagements?.[0]) setActiveId(data.engagements[0].id)
      }
    } catch {
      setErr("load failed")
    }
  }, [activeId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const post = async (body: Record<string, unknown>) => {
    setBusy(true)
    setErr(null)
    try {
      const data = await fetch("/api/offsec/engagements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json())
      if (!data?.ok) setErr(data?.error || "failed")
      await refresh()
      return data
    } catch {
      setErr("network error")
    } finally {
      setBusy(false)
    }
  }

  const active = items.find((e) => e.id === activeId) || null

  return (
    <SuiteShell
      title="OFFSEC // ENGAGEMENTS"
      status="real"
      nav={
        <>
          <SuiteNavLink href="/offsec" label="Arsenal" />
          <SuiteNavLink href="/offsec/osint" label="OSINT Suite" />
          <SuiteNavLink href="/bounty" label="Bug Bounty" />
        </>
      }
    >
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[320px_1fr]">
        {/* left: list + create */}
        <div className="space-y-3">
          <div className="ghost-glass ghost-brackets rounded-[2px] p-3">
            <div className="ghost-label mb-2 flex items-center gap-1">
              <Plus size={12} /> New engagement
            </div>
            <div className="space-y-2">
              <input className="ghost-input font-mono" placeholder="name *" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="ghost-input font-mono" placeholder="client / org" value={client} onChange={(e) => setClient(e.target.value)} />
              <textarea className="ghost-input font-mono" rows={2} placeholder="scope (one target per line)" value={scope} onChange={(e) => setScope(e.target.value)} />
              <input className="ghost-input font-mono" placeholder="authorized by (name / ticket)" value={authorizedBy} onChange={(e) => setAuthorizedBy(e.target.value)} />
              <button
                type="button"
                className="ghost-btn w-full"
                data-on="true"
                disabled={busy || !name.trim()}
                onClick={async () => {
                  const d = await post({ action: "create", name, client, scope, authorizedBy })
                  if (d?.ok && d.engagement?.id) setActiveId(d.engagement.id)
                  setName("")
                  setClient("")
                  setScope("")
                  setAuthorizedBy("")
                }}
              >
                Create
              </button>
              <p className="text-[10px] text-[color:var(--ghost-faint)]">
                Record written authorization before any testing. Scope defines what you may touch.
              </p>
            </div>
          </div>

          <div className="ghost-glass rounded-[2px] p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="ghost-label">Engagements</span>
              <button type="button" className="ghost-icon-btn" onClick={() => void refresh()}>
                <RefreshCw size={13} />
              </button>
            </div>
            <div className="ghost-scroll max-h-72 space-y-1 overflow-y-auto">
              {items.length === 0 && <div className="ghost-label p-2">none yet</div>}
              {items.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-2 rounded-[2px] border px-2 py-1.5 text-left"
                  style={{
                    borderColor: activeId === e.id ? "var(--ghost-accent)" : "var(--ghost-line)",
                    background: activeId === e.id ? "var(--ghost-accent-soft)" : "transparent",
                  }}
                  onClick={() => setActiveId(e.id)}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[12px] text-[color:var(--ghost-ink)]">{e.name}</span>
                    <span className="block truncate text-[10px] text-[color:var(--ghost-faint)]">
                      {e.client || "—"} · {e.findings.length}F / {e.notes.length}N
                    </span>
                  </span>
                  <span className="ghost-chip">{e.status}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* right: detail */}
        <div className="space-y-3">
          {err && <div className="font-mono text-[11px] text-[color:var(--ghost-danger)]">{err}</div>}
          {!active ? (
            <div className="ghost-glass rounded-[2px] p-6 text-center text-[color:var(--ghost-dim)]">Select or create an engagement.</div>
          ) : (
            <>
              <div className="ghost-glass ghost-brackets rounded-[2px] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-sm uppercase tracking-[0.12em] text-[color:var(--ghost-ink)]">{active.name}</div>
                    <div className="text-[11px] text-[color:var(--ghost-faint)]">
                      {active.client || "no client"} · auth: {active.authorizedBy || "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {(["scoping", "active", "reporting", "closed"] as Status[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="ghost-btn"
                        data-on={active.status === s}
                        onClick={() => void post({ action: "status", id: active.id, status: s })}
                      >
                        {s}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="ghost-icon-btn danger"
                      title="Delete"
                      onClick={() => {
                        void post({ action: "delete", id: active.id })
                        setActiveId(null)
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {active.scope.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Target size={12} className="text-[color:var(--ghost-faint)]" />
                    {active.scope.map((s) => (
                      <span key={s} className="ghost-chip">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* findings */}
              <div className="ghost-glass rounded-[2px] p-3">
                <div className="ghost-label mb-2 flex items-center gap-1">
                  <Bug size={12} /> Findings
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className="ghost-input font-mono" placeholder="title *" value={fTitle} onChange={(e) => setFTitle(e.target.value)} />
                  <div className="flex gap-2">
                    <select className="ghost-input font-mono" value={fSev} onChange={(e) => setFSev(e.target.value as Severity)}>
                      {SEV_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input className="ghost-input font-mono" placeholder="target" value={fTarget} onChange={(e) => setFTarget(e.target.value)} />
                  </div>
                  <textarea className="ghost-input font-mono sm:col-span-2" rows={2} placeholder="description / evidence" value={fDesc} onChange={(e) => setFDesc(e.target.value)} />
                  <textarea className="ghost-input font-mono sm:col-span-2" rows={2} placeholder="recommendation" value={fRec} onChange={(e) => setFRec(e.target.value)} />
                </div>
                <button
                  type="button"
                  className="ghost-btn mt-2"
                  disabled={busy || !fTitle.trim()}
                  onClick={async () => {
                    await post({ action: "finding", id: active.id, finding: { title: fTitle, severity: fSev, target: fTarget, description: fDesc, recommendation: fRec } })
                    setFTitle("")
                    setFTarget("")
                    setFDesc("")
                    setFRec("")
                  }}
                >
                  Add finding
                </button>
                <div className="mt-3 space-y-2">
                  {active.findings.map((f) => (
                    <div key={f.id} className="rounded-[2px] border border-[color:var(--ghost-line)] bg-black/40 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[12px] text-[color:var(--ghost-ink)]">{f.title}</span>
                        <span className={`ghost-chip ${["critical", "high"].includes(f.severity) ? "warn" : ""}`}>{f.severity}</span>
                      </div>
                      {f.target && <div className="text-[10px] text-[color:var(--ghost-faint)]">target: {f.target}</div>}
                      {f.description && <div className="mt-1 whitespace-pre-wrap text-[11px] text-[color:var(--ghost-dim)]">{f.description}</div>}
                      {f.recommendation && <div className="mt-1 whitespace-pre-wrap text-[11px] text-[color:var(--ghost-dim)]">fix: {f.recommendation}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* notes */}
              <div className="ghost-glass rounded-[2px] p-3">
                <div className="ghost-label mb-2 flex items-center gap-1">
                  <FileText size={12} /> Research notes
                </div>
                <div className="flex gap-2">
                  <input className="ghost-input font-mono max-w-[120px]" placeholder="phase" value={notePhase} onChange={(e) => setNotePhase(e.target.value)} />
                  <input
                    className="ghost-input font-mono"
                    placeholder="note…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && note.trim()) {
                        void post({ action: "note", id: active.id, body: note, phase: notePhase })
                        setNote("")
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="ghost-btn"
                    disabled={busy || !note.trim()}
                    onClick={async () => {
                      await post({ action: "note", id: active.id, body: note, phase: notePhase })
                      setNote("")
                    }}
                  >
                    Add
                  </button>
                </div>
                <div className="mt-3 space-y-1.5">
                  {active.notes.map((n) => (
                    <div key={n.id} className="rounded-[2px] border border-[color:var(--ghost-line)] bg-black/30 p-2">
                      <div className="mb-0.5 flex justify-between font-mono text-[9px] uppercase text-[color:var(--ghost-faint)]">
                        <span>{n.phase || "note"}</span>
                        <span>{n.createdAt.slice(0, 16).replace("T", " ")}</span>
                      </div>
                      <div className="whitespace-pre-wrap text-[11px] text-[color:var(--ghost-dim)]">{n.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </SuiteShell>
  )
}
