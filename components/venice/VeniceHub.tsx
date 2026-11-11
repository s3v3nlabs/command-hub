"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  Send,
  Sparkles,
  Terminal,
  MessageSquare,
  Users,
  Trash2,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import VeniceCharacters from "@/components/venice/VeniceCharacters"
import Link from "next/link"

type VeniceModel = {
  id: string
  name: string
  beta?: boolean
  offline?: boolean
}

type ChatMsg = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
}

type StatusPayload = {
  keyPresent: boolean
  keyAuthOk?: boolean | null
  keyAuthDetail?: string | null
  modelsReachable: boolean
  models: VeniceModel[]
  defaultModel?: string | null
  characterPacks?: string[]
  error?: string
  note?: string
}

type TermLine = {
  id: string
  kind: "in" | "out" | "sys" | "err"
  text: string
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export default function VeniceHub() {
  const [status, setStatus] = useState<StatusPayload>({
    keyPresent: false,
    modelsReachable: false,
    models: [],
  })
  const [loadingModels, setLoadingModels] = useState(true)
  const [model, setModel] = useState<string>("")
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)

  const [termLines, setTermLines] = useState<TermLine[]>([
    {
      id: uid(),
      kind: "sys",
      text: "Venice terminal console — type a message, or: clear | help | models",
    },
  ])
  const [termInput, setTermInput] = useState("")
  const [termBusy, setTermBusy] = useState(false)
  const [localPacks, setLocalPacks] = useState<
    Array<{ id: string; name: string; stub?: boolean }>
  >([])
  const termEndRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const loadModels = useCallback(async () => {
    setLoadingModels(true)
    try {
      const res = await fetch("/api/venice/models?type=text")
      const data = (await res.json()) as StatusPayload & { ok?: boolean }
      setStatus({
        keyPresent: Boolean(data.keyPresent),
        keyAuthOk: data.keyAuthOk,
        keyAuthDetail: data.keyAuthDetail,
        modelsReachable: Boolean(data.modelsReachable),
        models: Array.isArray(data.models) ? data.models : [],
        defaultModel: data.defaultModel,
        characterPacks: Array.isArray(data.characterPacks) ? data.characterPacks : [],
        error: data.error,
        note: data.note,
      })
      const next =
        data.defaultModel ||
        data.models?.[0]?.id ||
        ""
      setModel((prev) => prev || next)
    } catch {
      setStatus({
        keyPresent: false,
        modelsReachable: false,
        models: [],
        error: "failed to reach /api/venice/models",
      })
    } finally {
      setLoadingModels(false)
    }
  }, [])

  useEffect(() => {
    loadModels()
  }, [loadModels])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/venice/characters")
        const data = await res.json()
        if (!cancelled && Array.isArray(data.packs)) {
          setLocalPacks(
            data.packs.map((p: { id: string; name: string; stub?: boolean }) => ({
              id: p.id,
              name: p.name,
              stub: p.stub,
            })),
          )
        }
      } catch {
        /* Characters panel has its own error path */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    termEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [termLines])

  const sendChat = async (text: string, history: ChatMsg[]) => {
    const payload = {
      model: model || undefined,
      messages: [
        ...history
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: text },
      ],
    }
    const res = await fetch("/api/venice/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok || !data.ok) {
      throw new Error(typeof data.error === "string" ? data.error : `HTTP ${res.status}`)
    }
    return String(data.message?.content || "")
  }

  const onSendGui = async () => {
    const text = input.trim()
    if (!text || sending) return
    setChatError(null)
    setInput("")
    const userMsg: ChatMsg = { id: uid(), role: "user", content: text }
    const nextHistory = [...messages, userMsg]
    setMessages(nextHistory)
    setSending(true)
    try {
      const reply = await sendChat(text, messages)
      setMessages((prev) => [...prev, { id: uid(), role: "assistant", content: reply }])
    } catch (err) {
      const msg = err instanceof Error ? err.message : "chat failed"
      setChatError(msg)
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "system", content: `[error] ${msg}` },
      ])
    } finally {
      setSending(false)
    }
  }

  const onTermSubmit = async () => {
    const raw = termInput.trim()
    if (!raw || termBusy) return
    setTermInput("")
    setTermLines((prev) => [...prev, { id: uid(), kind: "in", text: `venice> ${raw}` }])

    const cmd = raw.toLowerCase()
    if (cmd === "clear") {
      setTermLines([{ id: uid(), kind: "sys", text: "scrollback cleared" }])
      return
    }
    if (cmd === "help") {
      setTermLines((prev) => [
        ...prev,
        {
          id: uid(),
          kind: "sys",
          text: "commands: clear | help | models | <any text to chat>",
        },
      ])
      return
    }
    if (cmd === "models") {
      const ids = status.models.map((m) => m.id).slice(0, 40)
      setTermLines((prev) => [
        ...prev,
        {
          id: uid(),
          kind: "out",
          text: ids.length
            ? `models (${ids.length}+): ${ids.join(", ")}${status.models.length > 40 ? " …" : ""}`
            : status.error || "no models loaded",
        },
      ])
      return
    }

    setTermBusy(true)
    try {
      const history: ChatMsg[] = termLines
        .filter((l) => l.kind === "in" || l.kind === "out")
        .slice(-12)
        .map((l) => ({
          id: l.id,
          role: (l.kind === "in" ? "user" : "assistant") as "user" | "assistant",
          content: l.kind === "in" ? l.text.replace(/^venice>\s*/, "") : l.text,
        }))
      const reply = await sendChat(raw, history)
      setTermLines((prev) => [...prev, { id: uid(), kind: "out", text: reply }])
    } catch (err) {
      const msg = err instanceof Error ? err.message : "chat failed"
      setTermLines((prev) => [...prev, { id: uid(), kind: "err", text: msg }])
    } finally {
      setTermBusy(false)
    }
  }

  const packs = status.characterPacks || []

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-xs",
              status.keyPresent
                ? "border-emerald-500/50 text-emerald-300"
                : "border-rose-500/50 text-rose-300",
            )}
          >
            key: {status.keyPresent ? "present" : "missing"}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-xs",
              status.keyAuthOk
                ? "border-emerald-500/50 text-emerald-300"
                : "border-amber-500/50 text-amber-300",
            )}
          >
            auth: {status.keyAuthOk ? "ok" : "fail"}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-xs",
              status.modelsReachable
                ? "border-cyan-500/50 text-cyan-300"
                : "border-amber-500/50 text-amber-300",
            )}
          >
            models: {status.modelsReachable ? `reachable (${status.models.length})` : "unreachable"}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">
            HOLD_VYRNA_UNSYNC
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 font-mono text-xs text-dark-600"
            onClick={loadModels}
            disabled={loadingModels}
          >
            {loadingModels ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            refresh
          </Button>
          {status.error && !status.modelsReachable && (
            <span className="font-mono text-xs text-rose-400/90 truncate max-w-md">{status.error}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-dark-600">model</span>
          <Select value={model} onValueChange={setModel} disabled={!status.models.length}>
            <SelectTrigger className="h-8 w-[min(100%,280px)] border-dark-300/40 bg-dark-100/40 font-mono text-xs">
              <SelectValue placeholder={loadingModels ? "loading…" : "select model"} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {status.models.map((m) => (
                <SelectItem key={m.id} value={m.id} className="font-mono text-xs">
                  {m.name}
                  {m.beta ? " (beta)" : ""}
                  {m.offline ? " [offline]" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="gui" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="w-fit bg-dark-100/60 border border-dark-300/30">
            <TabsTrigger value="gui" className="gap-1.5 font-mono text-xs data-[state=active]:bg-dark-200/80">
              <MessageSquare className="h-3.5 w-3.5" />
              Windowed GUI
            </TabsTrigger>
            <TabsTrigger value="term" className="gap-1.5 font-mono text-xs data-[state=active]:bg-dark-200/80">
              <Terminal className="h-3.5 w-3.5" />
              Terminal
            </TabsTrigger>
            <TabsTrigger value="characters" className="gap-1.5 font-mono text-xs data-[state=active]:bg-dark-200/80">
              <Users className="h-3.5 w-3.5" />
              Characters
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gui" className="mt-3 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
            <div className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-lg border border-dark-300/40 bg-black/50">
              <div className="flex items-center justify-between border-b border-dark-300/30 px-3 py-2">
                <div className="flex items-center gap-2 font-mono text-xs text-cyan-300/90">
                  <Sparkles className="h-3.5 w-3.5" />
                  Venice chat
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 font-mono text-xs"
                  onClick={() => {
                    setMessages([])
                    setChatError(null)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                  clear
                </Button>
              </div>
              <ScrollArea className="flex-1 px-3 py-3">
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <p className="font-mono text-xs text-dark-500">
                      No messages yet. Pick a model and send a prompt.
                    </p>
                  )}
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "rounded-md border px-3 py-2 font-mono text-sm whitespace-pre-wrap",
                        m.role === "user" && "border-cyan-500/30 bg-cyan-950/20 text-cyan-100",
                        m.role === "assistant" && "border-violet-500/30 bg-violet-950/20 text-violet-100",
                        m.role === "system" && "border-rose-500/30 bg-rose-950/20 text-rose-200",
                      )}
                    >
                      <div className="mb-1 text-[10px] uppercase tracking-wider opacity-60">{m.role}</div>
                      {m.content}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
              <div className="border-t border-dark-300/30 p-3">
                {chatError && (
                  <p className="mb-2 font-mono text-xs text-rose-400">{chatError}</p>
                )}
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message Venice…"
                    className="min-h-[64px] flex-1 resize-none border-dark-300/40 bg-dark-100/30 font-mono text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        onSendGui()
                      }
                    }}
                    disabled={sending || !status.keyPresent}
                  />
                  <Button
                    onClick={onSendGui}
                    disabled={sending || !input.trim() || !status.keyPresent}
                    className="self-end gap-1.5 font-mono"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    send
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="term" className="mt-3 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
            <div className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-lg border border-emerald-500/20 bg-black font-mono text-sm">
              <div className="flex items-center justify-between border-b border-emerald-500/20 px-3 py-2 text-emerald-400/80">
                <span className="flex items-center gap-2 text-xs">
                  <Terminal className="h-3.5 w-3.5" />
                  venice console
                </span>
                <button
                  type="button"
                  className="text-xs text-emerald-600 hover:text-emerald-400"
                  onClick={() =>
                    setTermLines([{ id: uid(), kind: "sys", text: "scrollback cleared" }])
                  }
                >
                  clear
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {termLines.map((l) => (
                  <div
                    key={l.id}
                    className={cn(
                      "whitespace-pre-wrap break-words",
                      l.kind === "in" && "text-emerald-300",
                      l.kind === "out" && "text-emerald-100/90",
                      l.kind === "sys" && "text-emerald-600/80",
                      l.kind === "err" && "text-rose-400",
                    )}
                  >
                    {l.text}
                  </div>
                ))}
                {termBusy && <div className="text-emerald-500/70 animate-pulse">…</div>}
                <div ref={termEndRef} />
              </div>
              <div className="flex items-center gap-2 border-t border-emerald-500/20 px-3 py-2">
                <span className="text-emerald-400 shrink-0">venice&gt;</span>
                <Input
                  value={termInput}
                  onChange={(e) => setTermInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      onTermSubmit()
                    }
                  }}
                  disabled={termBusy || !status.keyPresent}
                  className="h-8 border-0 bg-transparent px-0 font-mono text-sm text-emerald-100 focus-visible:ring-0"
                  placeholder={status.keyPresent ? "message or command…" : "key missing"}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="characters" className="mt-3 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
            <VeniceCharacters />
          </TabsContent>
        </Tabs>
      </div>

      <aside className="w-full shrink-0 rounded-lg border border-dark-300/40 bg-dark-100/30 p-4 lg:w-64">
        <div className="mb-3 flex items-center gap-2 font-mono text-sm text-dark-700">
          <Users className="h-4 w-4 text-violet-400" />
          Local packs
        </div>
        <Badge variant="outline" className="mb-3 font-mono text-[10px] border-violet-500/40 text-violet-300">
          LOCAL PACK · Phase 2
        </Badge>
        <p className="mb-3 font-mono text-[11px] leading-relaxed text-dark-500">
          Disk packs under <code className="text-dark-600">data/venice-characters/</code>. Not live on
          Venice.ai cloud. Open the <span className="text-violet-300">Characters</span> tab for search /
          digests / new pack.
        </p>
        <p className="mb-3 font-mono text-[10px] leading-relaxed text-amber-300/80">
          Pulse bayed — paste VENICE_PULSE_SCRIPT when Operator wakes — not auto.
        </p>
        <Link
          href="/reclaim"
          className="mb-3 inline-flex items-center gap-1 font-mono text-[10px] text-violet-300 hover:underline"
        >
          FULL_RECALL → /reclaim
        </Link>
        {(localPacks.length ? localPacks : packs.map((p) => ({ id: p, name: p }))).length === 0 ? (
          <div className="rounded border border-dashed border-dark-300/40 px-3 py-6 text-center font-mono text-xs text-dark-500">
            No packs yet
          </div>
        ) : (
          <ul className="space-y-1">
            {(localPacks.length
              ? localPacks
              : packs.map((p) => ({ id: p, name: p }))
            ).map((p) => (
              <li
                key={p.id}
                className="rounded border border-dark-300/30 bg-black/30 px-2 py-1.5 font-mono text-xs text-dark-600"
              >
                <span className="text-violet-200/90">{p.name}</span>
                <span className="block text-[10px] text-dark-500">{p.id}</span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}
