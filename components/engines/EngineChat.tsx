"use client"

import { useRef, useState } from "react"
import { ProviderBadge } from "./ProviderBadge"

const ENGINES = [
  { id: "axios", label: "AXIOS" },
  { id: "heimdall", label: "Heimdall" },
  { id: "ghostlight", label: "Ghostlight" },
  { id: "echonexus", label: "EchoNexus" },
  { id: "nova_prime", label: "Nova Prime" },
  { id: "shadowvox", label: "Shadowvox" },
  { id: "ob1", label: "OB-1" },
]

type Msg = { role: "user" | "assistant"; content: string; meta?: string }

/**
 * Real persona chat for the hub engines. Calls /api/engines/:id/chat which uses the shared
 * provider core (xAI / OpenAI / Venice / Groq / Ollama). No canned replies.
 */
export function EngineChat({ engine: fixed, title }: { engine?: string; title?: string }) {
  const [engine, setEngine] = useState(fixed || "axios")
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    const next: Msg[] = [...msgs, { role: "user", content: text }]
    setMsgs(next)
    setInput("")
    setBusy(true)
    try {
      const r = await fetch(`/api/engines/${engine}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      })
      const j = await r.json()
      setMsgs([
        ...next,
        j.ok
          ? { role: "assistant", content: j.text, meta: `${j.provider} · ${j.model}` }
          : { role: "assistant", content: `⚠ ${j.error || "request failed"}`, meta: "error" },
      ])
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: `⚠ ${(e as Error).message}`, meta: "error" }])
    } finally {
      setBusy(false)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
    }
  }

  return (
    <div className="rounded-md border border-cyan-500/30 bg-black/60 p-3 font-mono text-sm text-gray-200">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-cyan-300">{title || "Engine chat"}</span>
        {!fixed && (
          <select
            value={engine}
            onChange={(e) => {
              setEngine(e.target.value)
              setMsgs([])
            }}
            className="rounded border border-cyan-500/30 bg-black px-2 py-0.5 text-xs text-cyan-200"
            aria-label="Engine"
          >
            {ENGINES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        )}
        <ProviderBadge className="ml-auto" />
      </div>
      <div className="max-h-72 min-h-[7rem] space-y-2 overflow-y-auto rounded border border-white/5 bg-black/40 p-2">
        {msgs.length === 0 && <div className="text-xs text-gray-500">Ask {ENGINES.find((e) => e.id === engine)?.label}… (real model call)</div>}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-cyan-200" : "text-gray-200"}>
            <span className="text-[10px] uppercase text-gray-500">{m.role === "user" ? "you" : m.meta || "engine"} › </span>
            <span className="whitespace-pre-wrap">{m.content}</span>
          </div>
        ))}
        {busy && <div className="animate-pulse text-xs text-gray-500">thinking…</div>}
        <div ref={endRef} />
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message and press Enter"
          className="flex-1 rounded border border-cyan-500/30 bg-black px-2 py-1 text-sm text-gray-100 outline-none focus:border-cyan-400"
        />
        <button
          type="button"
          onClick={send}
          disabled={busy}
          className="rounded border border-cyan-500/50 px-3 py-1 text-xs uppercase text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  )
}
