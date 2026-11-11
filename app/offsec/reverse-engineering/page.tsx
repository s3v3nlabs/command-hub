"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Binary, Bot, Cpu, FileUp, Link2, Lock, RefreshCw, ShieldAlert, Trash2, Unlink } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"

type EngineId = "rea" | "radare2" | "ghidra"
type Engine = { id: EngineId; label: string; available: boolean; state: string; detail: string; install: string[]; version?: string }
type Target = { id: string; sha256: string; name: string; sizeBytes: number; origin: string; relPath: string; format: string; addedAt: string }
type Session = { id: string; engine: EngineId; targetSha256: string; boundAt: string } | null
type Evidence = {
  id: string
  kind: string
  provider: EngineId
  source: string
  targetSha256: string
  subject?: string
  data: unknown
  limitations: string[]
  truncated: boolean
  createdAt: string
  cached?: boolean
  meta?: Record<string, unknown>
}
type ReaTool = { name: string; description: string; class: "static" | "dynamic"; inputSchema?: unknown }

const OPS: Array<{ op: string; label: string; needsSubject?: boolean }> = [
  { op: "overview", label: "Overview" },
  { op: "functions", label: "Functions" },
  { op: "strings", label: "Strings" },
  { op: "symbols", label: "Symbols" },
  { op: "imports", label: "Imports" },
  { op: "disasm", label: "Assembly", needsSubject: true },
  { op: "pseudocode", label: "Pseudocode", needsSubject: true },
  { op: "xrefs", label: "Xrefs", needsSubject: true },
]

function fmtAddr(v: unknown): string {
  if (typeof v === "number") return "0x" + v.toString(16)
  return String(v ?? "")
}

function functionRows(ev: Evidence | undefined): Array<{ name: string; addr: string }> {
  if (!ev || !Array.isArray(ev.data)) return []
  return (ev.data as Array<Record<string, unknown>>)
    .map((r) => ({
      name: String(r.name ?? (typeof r.procedure === "string" ? r.procedure : undefined) ?? r.value ?? ""),
      addr: fmtAddr(r.addr ?? r.address ?? r.offset),
    }))
    .filter((r) => r.name || r.addr)
}

function EvidenceView({ ev }: { ev: Evidence }) {
  const d = ev.data
  if (typeof d === "string") {
    return <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap font-mono text-[11px] text-[color:var(--ghost-ink)]">{d}</pre>
  }
  if (Array.isArray(d) && d.length && typeof d[0] === "object" && d[0] !== null) {
    const rows = d as Array<Record<string, unknown>>
    const cols = Array.from(new Set(rows.slice(0, 50).flatMap((r) => Object.keys(r))))
      .filter((c) => !["ops", "esil", "bytes", "regvars", "spvars", "bpvars", "callrefs", "datarefs", "codexrefs", "dataxrefs"].includes(c))
      .slice(0, 7)
    return (
      <div className="max-h-[480px] overflow-auto">
        <table className="w-full font-mono text-[10.5px]">
          <thead>
            <tr>{cols.map((c) => <th key={c} className="sticky top-0 bg-black/90 px-1 text-left text-[color:var(--ghost-faint)]">{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.slice(0, 1000).map((r, i) => (
              <tr key={i} className="border-t border-[color:var(--ghost-line)]">
                {cols.map((c) => {
                  const v = r[c]
                  const s = typeof v === "number" && /addr|vaddr|paddr|offset|from|to/i.test(c) ? fmtAddr(v) : typeof v === "object" ? JSON.stringify(v) : String(v ?? "")
                  return <td key={c} className="max-w-[360px] truncate px-1 text-[color:var(--ghost-ink)]" title={s}>{s}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 1000 && <div className="font-mono text-[10px] text-[color:var(--ghost-faint)]">showing 1000 of {rows.length} rows</div>}
      </div>
    )
  }
  return <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap font-mono text-[11px] text-[color:var(--ghost-ink)]">{JSON.stringify(d, null, 2)}</pre>
}

export default function ReverseEngineeringPage() {
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [engines, setEngines] = useState<Engine[]>([])
  const [targets, setTargets] = useState<Target[]>([])
  const [session, setSession] = useState<Session>(null)
  const [dynEnabled, setDynEnabled] = useState(false)
  const [targetId, setTargetId] = useState("")
  const [engine, setEngine] = useState<EngineId>("radare2")
  const [subject, setSubject] = useState("main")
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [activeEv, setActiveEv] = useState<string>("")
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState("")
  const [msg, setMsg] = useState("")
  const [question, setQuestion] = useState("")
  const [assist, setAssist] = useState<{ status: string; text: string; model?: string } | null>(null)
  const [reaTools, setReaTools] = useState<ReaTool[]>([])
  const [reaTool, setReaTool] = useState("")
  const [reaArgs, setReaArgs] = useState("{}")
  const [scopeId, setScopeId] = useState("")
  const [attestation, setAttestation] = useState("")
  const [toolFilter, setToolFilter] = useState("")
  const [reaProvider, setReaProvider] = useState("")

  const auth = useCallback((json = true) => {
    const h: Record<string, string> = json ? { "Content-Type": "application/json" } : {}
    if (token) h.Authorization = `Bearer ${token}`
    return h
  }, [token])

  const load = useCallback(async (probe = false) => {
    setLoading(true)
    try {
      const d = await fetch(`/api/offsec/reverse-engineering${probe ? "?probe=1" : ""}`, { headers: auth(false) }).then((r) => r.json())
      if (d?.ok) {
        setEngines(d.engines)
        setTargets(d.targets)
        setSession(d.session)
        setDynEnabled(!!d.dynamicStage1Enabled)
        if (d.session) {
          setTargetId(d.session.targetSha256)
          setEngine(d.session.engine)
        }
      } else setMsg(d?.error || "status unavailable (hub token?)")
    } catch (e) {
      setMsg(String(e))
    } finally {
      setLoading(false)
    }
  }, [auth])

  useEffect(() => {
    void load()
  }, [load])

  const pushEvidence = (ev: Evidence | null | undefined) => {
    if (!ev) return
    setEvidence((prev) => [ev, ...prev.filter((p) => p.id !== ev.id)].slice(0, 60))
    setActiveEv(ev.id)
  }

  const upload = async (file: File) => {
    setBusy("upload")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const d = await fetch("/api/offsec/reverse-engineering/targets", { method: "POST", headers: auth(false), body: fd }).then((r) => r.json())
      if (d.ok) {
        setTargetId(d.target.sha256)
        setMsg(`Stored ${d.target.name} (${d.target.format}) as ${d.target.sha256.slice(0, 16)}… — never executed.`)
      } else setMsg(d.error)
      await load()
    } finally {
      setBusy("")
    }
  }

  const bind = async (rebind = false) => {
    if (!targetId) return setMsg("Pick a target first.")
    setBusy("bind")
    try {
      const r = await fetch("/api/offsec/reverse-engineering/session", { method: "POST", headers: auth(), body: JSON.stringify({ engine, targetId, rebind, reaProvider: engine === "rea" ? reaProvider || undefined : undefined }) })
      const d = await r.json()
      if (r.status === 409 && !rebind) {
        if (window.confirm(`${d.error}\n\nRebind the session to ${engine}? Evidence already collected stays labeled with its original provider.`)) return void (await bind(true))
        return
      }
      if (!d.ok) return setMsg(d.error)
      setSession(d.session)
      pushEvidence(d.evidence)
      setMsg(`Session bound: ${d.session.engine} ⇄ ${d.session.targetSha256.slice(0, 12)}…${d.rebound ? " (explicit rebind)" : ""}`)
    } finally {
      setBusy("")
    }
  }

  const unbind = async () => {
    await fetch("/api/offsec/reverse-engineering/session", { method: "DELETE", headers: auth(false) })
    setSession(null)
    setMsg("Session cleared.")
  }

  const runOp = async (op: string, subj?: string) => {
    setBusy(op)
    try {
      const d = await fetch("/api/offsec/reverse-engineering/analyze", { method: "POST", headers: auth(), body: JSON.stringify({ op, subject: subj ?? subject }) }).then((r) => r.json())
      if (d.evidence) pushEvidence(d.evidence)
      else setMsg(d.error)
    } finally {
      setBusy("")
    }
  }

  const loadReaTools = async () => {
    const d = await fetch("/api/offsec/reverse-engineering/rea", { headers: auth(false) }).then((r) => r.json())
    if (d.ok) setReaTools(d.tools)
    else setMsg(d.error)
  }

  const callRea = async () => {
    let args: unknown
    try {
      args = JSON.parse(reaArgs || "{}")
    } catch {
      return setMsg("REA args must be valid JSON.")
    }
    setBusy("rea")
    try {
      const d = await fetch("/api/offsec/reverse-engineering/rea", {
        method: "POST",
        headers: auth(),
        body: JSON.stringify({ tool: reaTool, args, scopeId: scopeId || undefined, attestation: attestation || undefined }),
      }).then((r) => r.json())
      if (d.evidence) pushEvidence(d.evidence)
      if (d.gated) setMsg(`LADDER BLOCK (stage ${d.stage}): ${d.error}\n${(d.howToUnlock || []).join("\n")}`)
      else if (!d.ok && !d.evidence) setMsg(d.error)
    } finally {
      setBusy("")
    }
  }

  const askAssist = async () => {
    const sel = evidence.filter((e) => picked[e.id])
    const use = sel.length ? sel : evidence.filter((e) => e.id === activeEv)
    setBusy("assist")
    try {
      const d = await fetch("/api/offsec/reverse-engineering/assist", { method: "POST", headers: auth(), body: JSON.stringify({ evidence: use, question }) }).then((r) => r.json())
      setAssist({ status: d.status, text: d.text, model: d.model })
    } finally {
      setBusy("")
    }
  }

  const active = evidence.find((e) => e.id === activeEv)
  const fnEv = useMemo(() => evidence.find((e) => e.kind === "functions" && e.targetSha256 === session?.targetSha256 && e.provider === session?.engine), [evidence, session])
  const fns = functionRows(fnEv)
  const selTool = reaTools.find((t) => t.name === reaTool)
  const engineAvail = engines.find((e) => e.id === engine)

  return (
    <SuiteShell
      title="OFFSEC // REVERSE ENGINEERING WORKBENCH"
      status="real"
      nav={
        <>
          <SuiteNavLink href="/offsec" label="Arsenal" />
          <SuiteNavLink href="/offsec/deception" label="Deception Mesh" />
          <SuiteNavLink href="/offsec/engagements" label="Engagements" />
          <SuiteNavLink href="/offsec/lab" label="WIP Lab" />
        </>
      }
    >
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="ghost-glass ghost-brackets rounded-[2px] p-4">
          <div className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.14em] text-[color:var(--ghost-ink)]">
            <Binary size={15} /> Reverse engineering workbench — evidence over answers
          </div>
          <p className="mt-1 text-[12px] text-[color:var(--ghost-dim)]">
            Static analysis of binaries, APKs and firmware you own or are authorized to examine. Brokers{" "}
            <a className="underline" href="https://github.com/morluto/rea" target="_blank" rel="noreferrer">REA</a> (MIT, MCP) when configured, with
            radare2 and Ghidra headless as direct engines. One engine per session, never swapped silently. Every result is an evidence record
            with its source, provider and limitations. Targets are stored 0600 in the sandboxed area and are never executed; dynamic REA tools
            are staged-ladder gated and audit-logged. Analyze live malware only inside an isolated VM.
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="ghost-label">Hub token (SECURE_MODE)</span>
              <input className="ghost-input font-mono" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="HUB_API_TOKEN" />
            </label>
            <button type="button" className="ghost-btn" onClick={() => void load()}>
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button type="button" className="ghost-btn" onClick={() => void load(true)}>Probe REA</button>
          </div>
          {msg && <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] text-amber-300/90">{msg}</pre>}
        </div>

        <section className="grid gap-2 md:grid-cols-3">
          {engines.map((e) => (
            <div key={e.id} className="ghost-glass ghost-brackets space-y-1 rounded-[2px] p-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 font-mono text-[12px] uppercase text-[color:var(--ghost-ink)]"><Cpu size={12} /> {e.label}</span>
                <span className={`ghost-chip ${e.available ? "accent" : ""}`}>{e.state}</span>
              </div>
              <div className="break-all font-mono text-[10px] text-[color:var(--ghost-faint)]">{e.version || e.detail}</div>
              {!e.available && (
                <ul className="list-disc pl-4 text-[10px] text-[color:var(--ghost-dim)]">
                  {e.install.map((s) => <li key={s} className="font-mono">{s}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>

        <section className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-3">
          <h2 className="font-mono text-sm uppercase tracking-[0.12em] text-[color:var(--ghost-ink)]">Target &amp; session</h2>
          <div className="flex flex-wrap items-end gap-2">
            <label className="ghost-btn cursor-pointer">
              <FileUp size={12} /> {busy === "upload" ? "Uploading…" : "Upload binary / APK / firmware"}
              <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
            </label>
            <select className="ghost-input max-w-[460px] font-mono" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
              <option value="">— select target —</option>
              {targets.map((t) => (
                <option key={t.sha256} value={t.sha256}>
                  [{t.origin}] {t.name} · {t.format} · {(t.sizeBytes / 1024).toFixed(1)}K · {t.sha256.slice(0, 10)}
                </option>
              ))}
            </select>
            <select className="ghost-input font-mono" value={engine} onChange={(e) => setEngine(e.target.value as EngineId)}>
              <option value="rea">REA (MCP)</option>
              <option value="radare2">radare2</option>
              <option value="ghidra">Ghidra headless</option>
            </select>
            {engine === "rea" && (
              <input className="ghost-input w-40 font-mono" value={reaProvider} onChange={(e) => setReaProvider(e.target.value)} placeholder="REA provider_id (e.g. ghidra)" title="Optional: pin REA's analysis provider (ghidra, ida, hopper, kuna). Empty = REA chooses." />
            )}
            <button type="button" className="ghost-btn" disabled={!!busy} onClick={() => void bind()}><Link2 size={12} /> Bind session</button>
            {session && <button type="button" className="ghost-btn" onClick={() => void unbind()}><Unlink size={12} /> Clear</button>}
            {targetId && targets.find((t) => t.sha256 === targetId)?.origin === "upload" && (
              <button
                type="button"
                className="ghost-btn"
                onClick={async () => {
                  if (!window.confirm("Delete this uploaded target and its cached evidence?")) return
                  await fetch(`/api/offsec/reverse-engineering/targets?id=${targetId}`, { method: "DELETE", headers: auth(false) })
                  setTargetId("")
                  await load()
                }}
              >
                <Trash2 size={12} /> Delete target
              </button>
            )}
          </div>
          <div className="font-mono text-[10.5px] text-[color:var(--ghost-dim)]">
            {session ? <>Bound: <span className="text-[color:var(--ghost-ink)]">{session.engine}</span> ⇄ {session.targetSha256} · since {session.boundAt}</> : "No session bound."}
            {engineAvail && !engineAvail.available && <span className="ml-2 text-amber-300/90">({engineAvail.label}: {engineAvail.state} — calls will return an honest error)</span>}
          </div>
        </section>

        <div className="grid gap-3 lg:grid-cols-[220px_1fr_320px]">
          <aside className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-3">
            <h3 className="font-mono text-[11px] uppercase text-[color:var(--ghost-faint)]">Operations</h3>
            <input className="ghost-input w-full font-mono" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="function name or 0xaddr" />
            <div className="grid grid-cols-2 gap-1">
              {OPS.map((o) => (
                <button key={o.op} type="button" className="ghost-btn justify-center" disabled={!session || !!busy} onClick={() => void runOp(o.op)} title={o.needsSubject ? "uses the function/address above" : undefined}>
                  {busy === o.op ? "…" : o.label}
                </button>
              ))}
            </div>
            <h3 className="pt-2 font-mono text-[11px] uppercase text-[color:var(--ghost-faint)]">Functions ({fns.length})</h3>
            <div className="max-h-[360px] overflow-auto">
              {fns.slice(0, 1500).map((f) => (
                <button
                  key={f.addr + f.name}
                  type="button"
                  className="block w-full truncate text-left font-mono text-[10.5px] text-[color:var(--ghost-ink)] hover:bg-white/5"
                  onClick={() => {
                    const s = f.name && /^[A-Za-z_.$@?][A-Za-z0-9_.:$@<>~?-]*$/.test(f.name) ? f.name : f.addr
                    setSubject(s)
                    void runOp("pseudocode", s)
                  }}
                >
                  {f.addr} {f.name}
                </button>
              ))}
              {!fns.length && <div className="text-[10px] text-[color:var(--ghost-dim)]">Run “Functions” to populate.</div>}
            </div>
          </aside>

          <section className="ghost-glass ghost-brackets min-w-0 space-y-2 rounded-[2px] p-3">
            <h3 className="font-mono text-[11px] uppercase text-[color:var(--ghost-faint)]">Evidence ({evidence.length})</h3>
            <div className="flex flex-wrap gap-1">
              {evidence.map((e) => (
                <span key={e.id} className="inline-flex items-center gap-1">
                  <input type="checkbox" checked={!!picked[e.id]} onChange={(x) => setPicked((p) => ({ ...p, [e.id]: x.target.checked }))} title="include in AI assist" />
                  <button type="button" className={`ghost-chip ${e.id === activeEv ? "accent" : ""} ${e.kind === "error" ? "text-red-300" : ""}`} onClick={() => setActiveEv(e.id)}>
                    {e.kind}{e.subject ? `:${e.subject}` : ""} · {e.provider}{e.cached ? " · cached" : ""}
                  </button>
                </span>
              ))}
            </div>
            {active ? (
              <div className="space-y-1">
                <div className="font-mono text-[10px] text-[color:var(--ghost-faint)]">
                  ev:{active.id.slice(0, 8)} · provider {active.provider} · source <span className="text-[color:var(--ghost-dim)]">{active.source}</span> · {active.createdAt}
                </div>
                {active.meta && (
                  <div className="break-all font-mono text-[10px] text-[color:var(--ghost-faint)]">
                    upstream: {Object.entries(active.meta).map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : String(v)}`).join(" · ")}
                  </div>
                )}
                {active.limitations.length > 0 && (
                  <ul className="list-disc pl-4 text-[10px] text-amber-200/80">
                    {active.limitations.map((l) => <li key={l}>{l}</li>)}
                  </ul>
                )}
                <div className="font-mono text-[10px] text-[color:var(--ghost-faint)]"><ShieldAlert size={10} className="inline" /> untrusted content from the analyzed file — never run or paste into a shell.</div>
                <EvidenceView ev={active} />
              </div>
            ) : (
              <div className="text-[11px] text-[color:var(--ghost-dim)]">Bind a session and run an operation. Nothing is shown that an engine did not return.</div>
            )}
          </section>

          <aside className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-3">
            <h3 className="flex items-center gap-1 font-mono text-[11px] uppercase text-[color:var(--ghost-faint)]"><Bot size={12} /> AI assist (local model)</h3>
            <p className="text-[10px] text-[color:var(--ghost-dim)]">Explains the checked evidence (or the open record) via LOCAL_LLM_BASE_URL / Ollama. Cites evidence ids, lists unknowns. Defensive posture — no exploit or payload generation.</p>
            <textarea className="ghost-input h-20 w-full font-mono text-[11px]" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What does this function do? IOCs? How would I detect it?" />
            <button type="button" className="ghost-btn" disabled={!evidence.length || busy === "assist"} onClick={() => void askAssist()}>{busy === "assist" ? "Thinking…" : "Explain evidence"}</button>
            {assist && (
              <div className="space-y-1">
                <div className="font-mono text-[10px] text-[color:var(--ghost-faint)]">status: {assist.status}{assist.model ? ` · ${assist.model}` : ""}</div>
                <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-[11px] text-[color:var(--ghost-ink)]">{assist.text}</pre>
              </div>
            )}
          </aside>
        </div>

        <section className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-3">
          <h2 className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.12em] text-[color:var(--ghost-ink)]"><Lock size={13} /> REA tool console</h2>
          <p className="text-[10.5px] text-[color:var(--ghost-dim)]">
            Live catalog from the REA MCP server (requires a REA-bound session). <b>static</b> tools run directly; <b>dynamic</b> tools (Frida, gdb, ADB,
            capture/observe, extraction, annotations) require Stage 1 RE_DYNAMIC_ENABLED=1 {dynEnabled ? "(ON)" : "(OFF)"}, an active engagement scope listing
            <code> sha256:&lt;target&gt;</code>, and the attestation “authorized under scope &lt;id&gt;”. Absolute paths in args must stay inside the sandboxed analysis area.
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <button type="button" className="ghost-btn" onClick={() => void loadReaTools()}>Load REA tools</button>
            <input className="ghost-input font-mono" placeholder="filter" value={toolFilter} onChange={(e) => setToolFilter(e.target.value)} />
            <select className="ghost-input max-w-[360px] font-mono" value={reaTool} onChange={(e) => setReaTool(e.target.value)}>
              <option value="">— tool ({reaTools.length}) —</option>
              {reaTools.filter((t) => t.name.includes(toolFilter)).map((t) => (
                <option key={t.name} value={t.name}>[{t.class}] {t.name}</option>
              ))}
            </select>
          </div>
          {selTool && (
            <div className="space-y-1">
              <div className="text-[10.5px] text-[color:var(--ghost-dim)]">{selTool.description}</div>
              <details>
                <summary className="cursor-pointer font-mono text-[10px] text-[color:var(--ghost-faint)]">input schema</summary>
                <pre className="max-h-48 overflow-auto font-mono text-[10px] text-[color:var(--ghost-dim)]">{JSON.stringify(selTool.inputSchema, null, 2)}</pre>
              </details>
            </div>
          )}
          <textarea className="ghost-input h-20 w-full font-mono text-[11px]" value={reaArgs} onChange={(e) => setReaArgs(e.target.value)} />
          {selTool?.class === "dynamic" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <input className="ghost-input font-mono" placeholder="engagement scopeId" value={scopeId} onChange={(e) => setScopeId(e.target.value)} />
              <input className="ghost-input font-mono" placeholder='attestation: "authorized under scope <id>"' value={attestation} onChange={(e) => setAttestation(e.target.value)} />
            </div>
          )}
          <button type="button" className="ghost-btn" disabled={!reaTool || busy === "rea"} onClick={() => void callRea()}>{busy === "rea" ? "Calling…" : `Call ${reaTool || "tool"}`}</button>
        </section>
      </div>
    </SuiteShell>
  )
}
