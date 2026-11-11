"use client"

/**
 * ADD-ONLY Signalframe team collab overlay.
 * Does not rewrite WhisperMesh / multi-frame workspace.
 */

import { useCallback, useEffect, useState } from "react"
import { MessageSquare, Send, X, RefreshCw } from "lucide-react"

type TeamMsg = {
  id: string
  channel: string
  from: string
  body: string
  createdAt: string
  lattice_sync?: false
}

export function TeamCollabPanel() {
  const [open, setOpen] = useState(false)
  const [channel, setChannel] = useState<"team" | "whisper" | "system">("team")
  const [messages, setMessages] = useState<TeamMsg[]>([])
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/signalframe/messages?channel=${channel}&limit=40`)
      const data = await res.json()
      if (data?.ok) setMessages(data.messages || [])
      else setErr(data?.error || "load failed")
    } catch {
      setErr("network error")
    }
  }, [channel])

  useEffect(() => {
    if (open) void refresh()
  }, [open, refresh])

  const send = async () => {
    if (!draft.trim() || busy) return
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch("/api/signalframe/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, body: draft, from: "operator" }),
      })
      const data = await res.json()
      if (!data?.ok) setErr(data?.error || "send failed")
      else {
        setDraft("")
        await refresh()
      }
    } catch {
      setErr("send failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="absolute bottom-4 left-4 z-40 flex items-center gap-2 rounded-sm border border-cyan-700/50 bg-black/50 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-cyan-200 backdrop-blur-md hover:border-cyan-500 signalframe-glass"
        title="Team collab plane (ADD-ONLY)"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        Team Bus
      </button>

      {open && (
        <div className="absolute bottom-16 left-4 z-40 flex h-[min(360px,55%)] w-[min(340px,90%)] flex-col overflow-hidden rounded-sm border border-[color:var(--hub-accent-border)] bg-black/50 shadow-xl backdrop-blur-md signalframe-glass">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <div className="font-mono text-[11px] uppercase tracking-wider text-white/80">
              Signalframe · Team
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => void refresh()} className="p-1 text-white/50 hover:text-white">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => setOpen(false)} className="p-1 text-white/50 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex gap-1 border-b border-white/10 px-2 py-1">
            {(["team", "whisper", "system"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChannel(c)}
                className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase ${
                  channel === c ? "bg-cyan-900/60 text-cyan-200" : "text-white/40 hover:text-white/70"
                }`}
              >
                {c}
              </button>
            ))}
            <span className="ml-auto font-mono text-[9px] text-amber-400/80">lattice_sync:false</span>
          </div>

          <div className="flex-1 space-y-2 overflow-auto p-2">
            {messages.length === 0 && (
              <div className="font-mono text-[10px] text-white/40">No messages in {channel}.</div>
            )}
            {messages.map((m) => (
              <div key={m.id} className="rounded border border-white/10 bg-white/5 p-2">
                <div className="mb-1 flex justify-between font-mono text-[9px] text-white/45">
                  <span>{m.from}</span>
                  <span>{m.createdAt?.slice(11, 19)}</span>
                </div>
                <div className="whitespace-pre-wrap text-[11px] text-white/85">{m.body}</div>
              </div>
            ))}
          </div>

          {err && <div className="px-2 font-mono text-[10px] text-red-400">{err}</div>}

          <div className="flex gap-1 border-t border-white/10 p-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  void send()
                }
              }}
              placeholder="Team message (not logged)…"
              className="flex-1 rounded border border-white/15 bg-black px-2 py-1 font-mono text-[11px] text-white outline-none focus:border-cyan-600"
            />
            <button
              type="button"
              disabled={busy || !draft.trim()}
              onClick={() => void send()}
              className="rounded border border-cyan-700/50 bg-cyan-950/40 px-2 py-1 text-cyan-200 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
