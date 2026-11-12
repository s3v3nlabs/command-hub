"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { PhoneCall, PhoneOff, ShieldCheck, Bot, History, Ban, Send, X } from "lucide-react"

type Config = {
  mode: "live" | "unconfigured"
  twilioConfigured: boolean
  publicBaseUrlSet: boolean
  fromNumber: string | null
  owner: string
  disclosure: string
  dailyCap: number
  callsToday: number
  maxCallSeconds: number
  active: any
  llm: string[]
  stt: string[]
  tts: string[]
}
type Line = { t: string; speaker: string; text: string; meta?: any }
type Call = { id: string; to: string; objective: string; mode: string; status: string; createdAt: string; durationSec?: number }
type Prep = { to: string; mode: string; disclosure: string; from: string | null; callsToday: number; dailyCap: number; confirmToken: string; expiresAt: string }

const panel = "rounded-md border border-cyan-500/25 bg-black/60 p-4"
const label = "mb-1 block font-mono text-[11px] uppercase tracking-widest text-cyan-300/80"
const input =
  "w-full rounded border border-cyan-500/30 bg-black/70 px-3 py-2 font-mono text-sm text-gray-100 outline-none focus:border-cyan-400"
const btn =
  "inline-flex items-center gap-2 rounded border px-3 py-2 font-mono text-xs uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-40"

function maskNum(n: string) {
  return n.length > 4 ? `${n.slice(0, 2)}${"•".repeat(Math.max(0, n.length - 6))}${n.slice(-4)}` : n
}

export function AICallerConsole() {
  const [cfg, setCfg] = useState<Config | null>(null)
  const [to, setTo] = useState("")
  const [objective, setObjective] = useState("")
  const [script, setScript] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [prep, setPrep] = useState<Prep | null>(null)
  const [ack, setAck] = useState(false)
  const [busy, setBusy] = useState(false)
  const [callId, setCallId] = useState<string | null>(null)
  const [callMode, setCallMode] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [lines, setLines] = useState<Line[]>([])
  const [history, setHistory] = useState<Call[]>([])
  const [dnc, setDnc] = useState<{ number: string; reason: string }[]>([])
  const [dncInput, setDncInput] = useState("")
  const esRef = useRef<EventSource | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    const [c, h, d] = await Promise.all([
      fetch("/api/caller/config").then((r) => r.json()),
      fetch("/api/caller/history").then((r) => r.json()),
      fetch("/api/caller/dnc").then((r) => r.json()),
    ]).catch(() => [null, { calls: [] }, { dnc: [] }])
    if (c) setCfg(c)
    setHistory(h?.calls || [])
    setDnc(d?.dnc || [])
  }, [])

  useEffect(() => {
    refresh()
    return () => esRef.current?.close()
  }, [refresh])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [lines])

  const live = status && !["completed", "failed", "busy", "no-answer", "canceled", "ended-by-operator"].includes(status)

  function follow(id: string) {
    esRef.current?.close()
    setLines([])
    const es = new EventSource(`/api/caller/events?id=${encodeURIComponent(id)}`)
    es.addEventListener("line", (e) => setLines((prev) => [...prev, JSON.parse((e as MessageEvent).data)]))
    es.addEventListener("status", (e) => {
      const s = JSON.parse((e as MessageEvent).data)
      setStatus(s.status)
      setCallMode(s.mode)
      if (["completed", "failed", "busy", "no-answer", "canceled", "ended-by-operator"].includes(s.status)) {
        setTimeout(() => {
          es.close()
          refresh()
        }, 1500)
      }
    })
    esRef.current = es
  }

  async function review() {
    setErr(null)
    setBusy(true)
    try {
      const r = await fetch("/api/caller/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, objective }),
      })
      const j = await r.json()
      if (!j.ok) throw new Error(j.error)
      setAck(false)
      setPrep(j)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function confirmDial() {
    if (!prep || !ack) return
    setBusy(true)
    setErr(null)
    try {
      const r = await fetch("/api/caller/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: prep.to, objective, script, confirmToken: prep.confirmToken }),
      })
      const j = await r.json()
      if (!j.ok) throw new Error(j.error)
      setPrep(null)
      setCallId(j.id)
      setCallMode(j.mode)
      setStatus(j.status)
      follow(j.id)
    } catch (e) {
      setErr((e as Error).message)
      setPrep(null)
    } finally {
      setBusy(false)
    }
  }

  async function hangup() {
    if (!callId) return
    await fetch("/api/caller/hangup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: callId }) })
  }

  async function openHistory(c: Call) {
    esRef.current?.close()
    const j = await fetch(`/api/caller/history?id=${encodeURIComponent(c.id)}`).then((r) => r.json())
    setCallId(c.id)
    setCallMode(c.mode)
    setStatus(j.call?.status || c.status)
    setLines(j.transcript || [])
  }

  async function addToDnc() {
    const r = await fetch("/api/caller/dnc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ number: dncInput }) })
    const j = await r.json()
    if (!j.ok) setErr(j.error)
    else setDncInput("")
    refresh()
  }
  async function removeDnc(n: string) {
    await fetch("/api/caller/dnc", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ number: n }) })
    refresh()
  }

  return (
    <div className="space-y-4 text-gray-200">
      {/* status strip */}
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-cyan-500/20 bg-black/70 px-3 py-2 font-mono text-xs">
        {cfg?.mode === "live" ? (
          <span className="rounded border border-emerald-500/60 bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-300">LIVE · TWILIO</span>
        ) : (
          <span className="rounded border border-rose-500/60 bg-rose-500/15 px-2 py-0.5 font-bold text-rose-300" data-testid="unconfigured-badge">
            UNCONFIGURED · no calls until Twilio is set
          </span>
        )}
        <span className="text-gray-400">from: {cfg?.fromNumber || "—"}</span>
        <span className="text-gray-400">
          today: {cfg?.callsToday ?? 0}/{cfg?.dailyCap ?? "—"} live calls
        </span>
        <span className="text-gray-400">max {cfg ? Math.round(cfg.maxCallSeconds / 60) : "—"} min/call</span>
        <span className="text-gray-400">LLM: {cfg?.llm.length ? cfg.llm.join(", ") : "none (set an AI key)"}</span>
        <span className="text-gray-400">STT: {cfg?.stt.length ? cfg.stt.join(", ") : "none"}</span>
        <span className="text-gray-400">TTS: {cfg?.tts.length ? cfg.tts.join(", ") : "none"}</span>
      </div>
      {cfg && cfg.mode !== "live" && (
        <div className="rounded border border-rose-500/30 bg-rose-500/5 px-3 py-2 font-mono text-xs text-rose-200">
          This console only places real Twilio calls. Simulated/demo calls were removed. Set TWILIO_ACCOUNT_SID,
          TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER and PUBLIC_BASE_URL in .env.local, then run <code>npm run caller:bridge</code> behind a tunnel.
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          {/* dial form */}
          <div className={panel}>
            <div className="mb-3 flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-cyan-300">
              <PhoneCall className="h-4 w-4" /> New call
            </div>
            <div className="grid gap-3 md:grid-cols-[240px_minmax(0,1fr)]">
              <div>
                <label className={label} htmlFor="caller-to">
                  Phone number (one only)
                </label>
                <input id="caller-to" className={input} placeholder="+15551234567" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div>
                <label className={label} htmlFor="caller-obj">
                  Objective
                </label>
                <input
                  id="caller-obj"
                  className={input}
                  placeholder="e.g. Ask if they have a table for 4 on Friday at 7pm"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className={label} htmlFor="caller-script">
                Talking points / script (optional)
              </label>
              <textarea
                id="caller-script"
                className={`${input} min-h-[90px]`}
                placeholder={"- Party of 4, Friday 7pm\n- Name for the reservation: Alex\n- Ask about patio seating"}
                value={script}
                onChange={(e) => setScript(e.target.value)}
              />
            </div>
            <div className="mt-3 rounded border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 font-mono text-[11px] text-cyan-100/80">
              <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-300" />
              Fixed opening (cannot be edited): “{cfg?.disclosure || "…"}”
            </div>
            {err && <div className="mt-3 rounded border border-rose-500/40 bg-rose-500/10 px-3 py-2 font-mono text-xs text-rose-200">{err}</div>}
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={busy || !!live} onClick={review} className={`${btn} border-cyan-400/60 text-cyan-200 hover:bg-cyan-500/10`}>
                <PhoneCall className="h-4 w-4" /> Review &amp; call
              </button>
              <button type="button" disabled={!live} onClick={hangup} className={`${btn} border-rose-500/60 text-rose-300 hover:bg-rose-500/10`}>
                <PhoneOff className="h-4 w-4" /> End call
              </button>
            </div>
          </div>

          {/* transcript */}
          <div className={panel}>
            <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-sm uppercase tracking-widest text-cyan-300">
              Live transcript
              {callMode && callMode !== "live" && <span className="rounded border border-zinc-600 px-2 py-0.5 text-[10px] text-zinc-400">{callMode}</span>}
              {status && <span className="rounded border border-cyan-500/40 px-2 py-0.5 text-[10px] text-cyan-200">{status}</span>}
              {callId && <span className="text-[10px] text-gray-500">{callId}</span>}
            </div>
            <div className="h-80 space-y-2 overflow-y-auto rounded border border-white/5 bg-black/50 p-3 font-mono text-sm">
              {lines.length === 0 && <div className="text-xs text-gray-500">No call yet. Transcript lines stream here in real time.</div>}
              {lines.map((l, i) => (
                <div key={i} className="leading-relaxed">
                  <span
                    className={
                      "mr-2 rounded px-1.5 py-0.5 text-[10px] uppercase " +
                      (l.speaker === "ai"
                        ? "bg-cyan-500/15 text-cyan-300"
                        : l.speaker === "callee"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-white/5 text-gray-400")
                    }
                  >
                    {l.speaker === "ai" ? "AI assistant" : l.speaker}
                  </span>
                  <span className={l.speaker === "system" ? "text-gray-400" : "text-gray-100"}>{l.text}</span>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          </div>

          {/* history + dnc */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={panel}>
              <div className="mb-2 flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-cyan-300">
                <History className="h-4 w-4" /> Call history (local)
              </div>
              <div className="max-h-60 space-y-1 overflow-y-auto">
                {history.length === 0 && <div className="font-mono text-xs text-gray-500">No calls logged yet.</div>}
                {history.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => openHistory(c)}
                    className="flex w-full items-center gap-2 rounded border border-white/5 px-2 py-1.5 text-left font-mono text-xs hover:border-cyan-500/40"
                  >
                    <span className={c.mode === "live" ? "text-emerald-300" : "text-zinc-400"}>{c.mode.toUpperCase()}</span>
                    <span className="text-gray-300">{maskNum(c.to)}</span>
                    <span className="flex-1 truncate text-gray-500">{c.objective}</span>
                    <span className="text-gray-400">{c.status}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className={panel}>
              <div className="mb-2 flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-cyan-300">
                <Ban className="h-4 w-4" /> Do-not-call list
              </div>
              <div className="flex gap-2">
                <input className={input} placeholder="+15551234567" value={dncInput} onChange={(e) => setDncInput(e.target.value)} />
                <button type="button" onClick={addToDnc} className={`${btn} border-rose-500/50 text-rose-300 hover:bg-rose-500/10`}>
                  Add
                </button>
              </div>
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                {dnc.length === 0 && <div className="font-mono text-xs text-gray-500">Empty.</div>}
                {dnc.map((d) => (
                  <div key={d.number} className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-gray-300">{maskNum(d.number)}</span>
                    <span className="flex-1 truncate text-gray-500">{d.reason}</span>
                    <button type="button" onClick={() => removeDnc(d.number)} className="text-gray-500 hover:text-rose-300" aria-label="remove">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <GrokBotAssistant
          onUse={(o, s) => {
            if (o) setObjective(o)
            if (s) setScript(s)
          }}
        />
      </div>

      {/* confirm modal */}
      {prep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-md border border-cyan-400/50 bg-[#05080c] p-5 font-mono text-sm text-gray-200 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
            <div className="mb-3 flex items-center gap-2 text-base uppercase tracking-widest text-cyan-300">
              <ShieldCheck className="h-5 w-5" /> Confirm call
              {prep.mode !== "live" && <span className="ml-auto rounded border border-rose-500/60 bg-rose-500/15 px-2 py-0.5 text-[10px] text-rose-300">NOT LIVE — cannot dial</span>}
            </div>
            <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-xs">
              <dt className="text-gray-500">To</dt>
              <dd>{prep.to}</dd>
              <dt className="text-gray-500">From</dt>
              <dd>{prep.from || "—"}</dd>
              <dt className="text-gray-500">Objective</dt>
              <dd className="whitespace-pre-wrap">{objective}</dd>
              <dt className="text-gray-500">Opens with</dt>
              <dd className="text-emerald-200">“{prep.disclosure}”</dd>
              <dt className="text-gray-500">Daily cap</dt>
              <dd>
                {prep.callsToday}/{prep.dailyCap} live calls used
              </dd>
            </dl>
            <label className="mt-4 flex items-start gap-2 text-xs text-gray-300">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5" />
              I confirm I have a legitimate reason to call this person, they are not on a do-not-call list, and this is a single
              call (not a campaign).
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setPrep(null)} className={`${btn} border-gray-600 text-gray-300 hover:bg-white/5`}>
                Cancel
              </button>
              <button
                type="button"
                disabled={!ack || busy}
                onClick={confirmDial}
                className={`${btn} border-emerald-400/70 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20`}
              >
                <PhoneCall className="h-4 w-4" /> Confirm &amp; dial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function parseDraft(text: string): { objective?: string; script?: string } {
  const o = text.match(/OBJECTIVE:\s*(.+)/i)
  const s = text.match(/SCRIPT:\s*\n([\s\S]+)/i)
  return { objective: o?.[1]?.trim(), script: s?.[1]?.trim() }
}

function GrokBotAssistant({ onUse }: { onUse: (objective?: string, script?: string) => void }) {
  const [msgs, setMsgs] = useState<{ role: "user" | "assistant"; content: string; meta?: string }[]>([])
  const [inp, setInp] = useState("")
  const [busy, setBusy] = useState(false)
  async function send() {
    const t = inp.trim()
    if (!t || busy) return
    const next = [...msgs, { role: "user" as const, content: t }]
    setMsgs(next)
    setInp("")
    setBusy(true)
    try {
      const j = await fetch("/api/caller/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      }).then((r) => r.json())
      setMsgs([...next, j.ok ? { role: "assistant", content: j.text, meta: `${j.provider} · ${j.model}` } : { role: "assistant", content: `⚠ ${j.error}`, meta: "error" }])
    } finally {
      setBusy(false)
    }
  }
  return (
    <aside className={`${panel} flex h-fit flex-col`}>
      <div className="mb-2 flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-cyan-300">
        <Bot className="h-4 w-4" /> Grok Bot assistant
      </div>
      <p className="mb-2 font-mono text-[11px] text-gray-500">Describe who you're calling and why; it drafts the objective + talking points. Prefers xAI Grok, falls back to any configured model.</p>
      <div className="h-[420px] space-y-2 overflow-y-auto rounded border border-white/5 bg-black/50 p-2 font-mono text-xs">
        {msgs.length === 0 && <div className="text-gray-500">e.g. “Call my dentist to move Thursday’s cleaning to next week, mornings only.”</div>}
        {msgs.map((m, i) => {
          const d = m.role === "assistant" ? parseDraft(m.content) : {}
          return (
            <div key={i}>
              <span className="text-[10px] uppercase text-gray-500">{m.role === "user" ? "you" : m.meta || "grok bot"} › </span>
              <span className={m.role === "user" ? "text-cyan-200" : "whitespace-pre-wrap text-gray-200"}>{m.content}</span>
              {(d.objective || d.script) && (
                <button
                  type="button"
                  onClick={() => onUse(d.objective, d.script)}
                  className="mt-1 block rounded border border-emerald-500/50 px-2 py-0.5 text-[10px] uppercase text-emerald-300 hover:bg-emerald-500/10"
                >
                  Use this draft
                </button>
              )}
            </div>
          )
        })}
        {busy && <div className="animate-pulse text-gray-500">drafting…</div>}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className="flex-1 rounded border border-cyan-500/30 bg-black/70 px-2 py-1.5 font-mono text-xs text-gray-100 outline-none focus:border-cyan-400"
          value={inp}
          onChange={(e) => setInp(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask Grok Bot to draft a call…"
        />
        <button type="button" onClick={send} disabled={busy} className={`${btn} border-cyan-400/60 text-cyan-200 hover:bg-cyan-500/10`} aria-label="send">
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  )
}
