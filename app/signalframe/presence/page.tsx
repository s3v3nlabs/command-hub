"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Users, Send, StickyNote, Radio, ShieldCheck } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"

type Operator = { id: string; name: string; color: string; workspace?: string; cursor?: { x: number; y: number; view?: string }; lastSeen: string }
type Note = { id: string; engagementId: string; from: string; body: string; createdAt: string }
type Msg = { id: string; channel: string; from: string; body: string; createdAt: string }

function getOrMakeId(): string {
  try {
    let id = localStorage.getItem("hub-operator-id")
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem("hub-operator-id", id)
    }
    return id
  } catch {
    return "op-" + Math.random().toString(36).slice(2)
  }
}

export default function PresencePage() {
  const [name, setName] = useState("")
  const [online, setOnline] = useState<Operator[]>([])
  const [status, setStatus] = useState<{ multiOperator?: boolean; transport?: string; note?: string } | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [engagementId, setEngagementId] = useState("default")
  const [noteBody, setNoteBody] = useState("")
  const [chat, setChat] = useState<Msg[]>([])
  const [chatBody, setChatBody] = useState("")
  const idRef = useRef<string>("")
  const cursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const surfaceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    idRef.current = getOrMakeId()
    try {
      setName(localStorage.getItem("hub-operator-name") || "")
    } catch {}
  }, [])

  const beat = useCallback(async () => {
    if (!name) return
    try {
      const ws = (() => {
        try {
          return localStorage.getItem("hub-workspace") || undefined
        } catch {
          return undefined
        }
      })()
      const r = await fetch("/api/signalframe/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "heartbeat", id: idRef.current, name, workspace: ws, cursor: cursorRef.current }),
      }).then((r) => r.json())
      if (r.ok) setOnline(r.online || [])
    } catch {}
  }, [name])

  const loadAll = useCallback(async () => {
    try {
      const p = await fetch(`/api/signalframe/presence?engagement=${encodeURIComponent(engagementId)}`).then((r) => r.json())
      setOnline(p.online || [])
      setStatus({ multiOperator: p.multiOperator, transport: p.transport, note: p.note })
      setNotes(p.notes || [])
    } catch {}
    try {
      const c = await fetch("/api/signalframe/messages?channel=team&limit=30").then((r) => r.json())
      if (c.ok) setChat(c.messages || [])
    } catch {}
  }, [engagementId])

  useEffect(() => {
    if (!name) return
    try {
      localStorage.setItem("hub-operator-name", name)
    } catch {}
    beat()
    loadAll()
    const t1 = setInterval(beat, 4000)
    const t2 = setInterval(loadAll, 3000)
    return () => {
      clearInterval(t1)
      clearInterval(t2)
    }
  }, [name, beat, loadAll])

  const onMove = useCallback((e: React.MouseEvent) => {
    const rect = surfaceRef.current?.getBoundingClientRect()
    if (!rect) return
    cursorRef.current = { x: Math.round(((e.clientX - rect.left) / rect.width) * 1000), y: Math.round(((e.clientY - rect.top) / rect.height) * 1000) }
  }, [])

  const sendNote = useCallback(async () => {
    if (!noteBody.trim()) return
    await fetch("/api/signalframe/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "note", engagementId, from: name || "operator", body: noteBody }),
    })
    setNoteBody("")
    loadAll()
  }, [noteBody, engagementId, name, loadAll])

  const sendChat = useCallback(async () => {
    if (!chatBody.trim()) return
    await fetch("/api/signalframe/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "team", from: name || "operator", body: chatBody }),
    })
    setChatBody("")
    loadAll()
  }, [chatBody, name, loadAll])

  const others = online.filter((o) => o.id !== idRef.current)

  return (
    <SuiteShell
      title="SignalFrame — Multi-Operator Presence"
      status="local"
      nav={
        <>
          <SuiteNavLink href="/signalframe" label="SignalFrame" />
          <SuiteNavLink href="/offsec/engagements" label="Engagements" />
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input className="ghost-input w-44" placeholder="Your operator name" value={name} onChange={(e) => setName(e.target.value)} />
          <span className="flex items-center gap-1 text-[color:var(--ghost-dim)]">
            <Users size={13} /> {online.length} online
          </span>
          {status && (
            <span className={`flex items-center gap-1 ${status.multiOperator ? "text-emerald-400" : "text-amber-400"}`}>
              <Radio size={12} /> {status.note}
            </span>
          )}
          <span className="text-[10px] text-[color:var(--ghost-dim)]">transport: {status?.transport || "same-origin"} (not live mesh)</span>
        </div>

        {/* shared cursor surface */}
        <div
          ref={surfaceRef}
          onMouseMove={onMove}
          className="relative h-64 overflow-hidden rounded border border-[color:var(--ghost-line)] bg-black/40"
        >
          <div className="pointer-events-none absolute left-2 top-2 text-[10px] text-[color:var(--ghost-dim)]">
            Shared cursor surface — move your mouse; other operators on this hub see your cursor.
          </div>
          {others.map((o) =>
            o.cursor ? (
              <div
                key={o.id}
                className="pointer-events-none absolute flex items-center gap-1 transition-all duration-200"
                style={{ left: `${(o.cursor.x / 1000) * 100}%`, top: `${(o.cursor.y / 1000) * 100}%` }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={o.color}>
                  <path d="M4 2l16 7-7 3-3 7z" />
                </svg>
                <span className="rounded px-1 text-[10px] text-white" style={{ background: o.color }}>
                  {o.name}
                </span>
              </div>
            ) : null,
          )}
          {!others.length && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-[color:var(--ghost-dim)]">
              No other operators online — single-operator mode.
            </div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {/* engagement notes */}
          <div className="rounded border border-[color:var(--ghost-line)] bg-black/50 p-3 text-xs">
            <div className="mb-1 flex items-center gap-1 font-semibold">
              <StickyNote size={13} /> Live engagement notes
            </div>
            <input className="ghost-input mb-1 w-full" placeholder="engagement id" value={engagementId} onChange={(e) => setEngagementId(e.target.value)} />
            <div className="flex gap-1">
              <input className="ghost-input flex-1" placeholder="Add a note…" value={noteBody} onChange={(e) => setNoteBody(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendNote()} />
              <button className="ghost-btn" onClick={sendNote}>
                <Send size={12} />
              </button>
            </div>
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
              {notes.map((n) => (
                <li key={n.id} className="border-t border-[color:var(--ghost-line)]/40 pt-1">
                  <span className="font-medium">{n.from}</span>{" "}
                  <span className="text-[9px] text-[color:var(--ghost-dim)]">{n.createdAt.slice(11, 19)}</span>
                  <div>{n.body}</div>
                </li>
              ))}
              {!notes.length && <li className="text-[color:var(--ghost-dim)]">No notes yet.</li>}
            </ul>
          </div>

          {/* encrypted team chat (reuses team-bus) */}
          <div className="rounded border border-[color:var(--ghost-line)] bg-black/50 p-3 text-xs">
            <div className="mb-1 flex items-center gap-1 font-semibold">
              <ShieldCheck size={13} /> Team chat <span className="text-[9px] text-[color:var(--ghost-dim)]">(encrypt-at-rest via team-bus)</span>
            </div>
            <div className="flex gap-1">
              <input className="ghost-input flex-1" placeholder="Message team…" value={chatBody} onChange={(e) => setChatBody(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} />
              <button className="ghost-btn" onClick={sendChat}>
                <Send size={12} />
              </button>
            </div>
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
              {chat.map((m) => (
                <li key={m.id} className="border-t border-[color:var(--ghost-line)]/40 pt-1">
                  <span className="font-medium">{m.from}</span>{" "}
                  <span className="text-[9px] text-[color:var(--ghost-dim)]">{m.createdAt.slice(11, 19)}</span>
                  <div>{m.body}</div>
                </li>
              ))}
              {!chat.length && <li className="text-[color:var(--ghost-dim)]">No team messages yet.</li>}
            </ul>
          </div>
        </div>
      </div>
    </SuiteShell>
  )
}
