"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Brain,
  RefreshCw,
  Send,
  Shield,
  Database,
  Layers,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface TwinSource {
  vault: string
  path: string
  title: string
  score: number
  excerpt: string
}

interface TwinStatus {
  ok: boolean
  indexed: boolean
  meta: {
    builtAt?: string
    docs?: number
    chunks?: number
    thin?: boolean
    note?: string
    roots?: Array<{ id: string; root: string; files: number; chunks: number; exists: boolean }>
    camtasiaOrTranscriptHits?: string[]
  } | null
  vaultRoots?: Array<{ id: string; root: string; label: string; exists: boolean }>
  providerPreference?: string | null
  honest?: string
}

interface ChatTurn {
  role: "user" | "twin"
  text: string
  sources?: TwinSource[]
  confidence?: number
  mode?: string
  provider?: string
  thin?: boolean
}

const VAULT_COLOR: Record<string, string> = {
  chatgpt: "border-emerald-500/40 text-emerald-300",
  grok: "border-cyan-500/40 text-cyan-300",
  gemini: "border-amber-500/40 text-amber-300",
  venice: "border-violet-500/40 text-violet-300",
  "v0-history": "border-fuchsia-500/40 text-fuchsia-300",
  "engines-personas": "border-rose-500/40 text-rose-300",
  "engines-prompts": "border-sky-500/40 text-sky-300",
}

export default function BeastOperatorTwin() {
  const [status, setStatus] = useState<TwinStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState("")
  const [sending, setSending] = useState(false)
  const [turns, setTurns] = useState<ChatTurn[]>([])

  const refreshStatus = useCallback(async () => {
    setLoadingStatus(true)
    try {
      const res = await fetch("/api/ai/twin", { cache: "no-store" })
      const data = (await res.json()) as TwinStatus
      setStatus(data)
    } catch {
      setStatus(null)
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  const rebuildIndex = async () => {
    setRefreshing(true)
    try {
      const res = await fetch("/api/ai/twin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "refresh" }),
      })
      await res.json()
      await refreshStatus()
    } finally {
      setRefreshing(false)
    }
  }

  const sendQuery = async () => {
    const q = query.trim()
    if (!q || sending) return
    setSending(true)
    setTurns((prev) => [...prev, { role: "user", text: q }])
    setQuery("")
    try {
      const res = await fetch("/api/ai/twin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "query", query: q }),
      })
      const data = await res.json()
      setTurns((prev) => [
        ...prev,
        {
          role: "twin",
          text: data.answer || data.error || "(empty)",
          sources: data.sources || [],
          confidence: data.confidence,
          mode: data.mode,
          provider: data.provider,
          thin: data.thin,
        },
      ])
      if (!status?.indexed) await refreshStatus()
    } catch (err) {
      setTurns((prev) => [
        ...prev,
        {
          role: "twin",
          text: err instanceof Error ? err.message : "request failed",
        },
      ])
    } finally {
      setSending(false)
    }
  }

  const thin = status?.meta?.thin
  const docs = status?.meta?.docs ?? 0
  const chunks = status?.meta?.chunks ?? 0

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">
          HOLD_VYRNA_UNSYNC
        </Badge>
        <Badge variant="outline" className="font-mono text-xs border-cyan-500/40 text-cyan-300">
          local vault retrieval only
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            "font-mono text-xs",
            thin ? "border-rose-500/40 text-rose-300" : "border-emerald-500/40 text-emerald-300",
          )}
        >
          {thin ? "INDEX_THIN" : "INDEX_OK"} · {docs} docs / {chunks} chunks
        </Badge>
        <Link
          href="/ai-hub"
          className="inline-flex items-center gap-1 text-xs font-mono text-fuchsia-300 hover:underline"
        >
          <Brain className="h-3 w-3" /> AI Ops Hub
        </Link>
      </div>

      <p className="text-xs text-dark-600 font-mono leading-relaxed">
        Operator Twin v1 answers in S3v3n&apos;s pattern using <strong>local chat vault retrieval</strong> only —
        no cloud twin training upload, no Vyrna lattice sync. Not a full persona clone.
        {status?.honest ? ` ${status.honest}` : ""}
      </p>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="border-dark-300/50 bg-dark-100/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-mono text-cyan-200">
              <Layers className="h-4 w-4" /> Twin chat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScrollArea className="h-[420px] rounded-md border border-dark-300/40 bg-black/30 p-3">
              <div className="space-y-4 pr-3">
                {turns.length === 0 && (
                  <div className="text-xs text-dark-600 font-mono">
                    Ask about reclaim tone, engines personas, vault digests, Venice/Axios patterns…
                    Secrets stay in vaults/env — never paste keys here.
                  </div>
                )}
                {turns.map((t, i) => (
                  <div key={i} className="space-y-2">
                    <div
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-mono whitespace-pre-wrap",
                        t.role === "user"
                          ? "bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-100"
                          : "bg-cyan-500/5 border border-cyan-500/20 text-cyan-50",
                      )}
                    >
                      <div className="mb-1 text-[10px] uppercase tracking-wider opacity-60">
                        {t.role === "user" ? "Operator" : "Twin"}
                        {t.mode ? ` · ${t.mode}` : ""}
                        {t.provider ? ` · ${t.provider}` : ""}
                        {typeof t.confidence === "number"
                          ? ` · conf ${(t.confidence * 100).toFixed(0)}%`
                          : ""}
                      </div>
                      {t.text}
                    </div>
                    {t.thin && (
                      <div className="flex items-center gap-1 text-[10px] font-mono text-amber-300">
                        <AlertTriangle className="h-3 w-3" /> thin memory — not a full clone
                      </div>
                    )}
                    {t.sources && t.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {t.sources.map((s, j) => (
                          <Badge
                            key={j}
                            variant="outline"
                            className={cn(
                              "font-mono text-[10px] max-w-full truncate",
                              VAULT_COLOR[s.vault] || "border-slate-500/40 text-slate-300",
                            )}
                            title={`${s.vault}: ${s.path}`}
                          >
                            {s.vault} · {s.title.slice(0, 28)}
                            {s.title.length > 28 ? "…" : ""} · {s.score.toFixed(1)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask Twin (local vault memory only)…"
              className="min-h-[80px] font-mono text-sm bg-black/40 border-dark-300/50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  void sendQuery()
                }
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void sendQuery()}
                disabled={sending || !query.trim()}
                className="font-mono text-xs"
              >
                <Send className="mr-1 h-3 w-3" />
                {sending ? "Thinking…" : "Ask Twin"}
              </Button>
              <Button
                variant="outline"
                onClick={() => void rebuildIndex()}
                disabled={refreshing}
                className="font-mono text-xs"
              >
                <RefreshCw className={cn("mr-1 h-3 w-3", refreshing && "animate-spin")} />
                Refresh index
              </Button>
              <Button
                variant="ghost"
                onClick={() => void refreshStatus()}
                disabled={loadingStatus}
                className="font-mono text-xs"
              >
                Status
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-dark-300/50 bg-dark-100/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-mono text-amber-200">
                <Database className="h-4 w-4" /> Vault roots
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(status?.vaultRoots || []).map((v) => (
                <div
                  key={v.id}
                  className="rounded border border-dark-300/40 px-2 py-1.5 text-[10px] font-mono"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-cyan-200">{v.label}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px]",
                        v.exists ? "text-emerald-300 border-emerald-500/40" : "text-rose-300 border-rose-500/40",
                      )}
                    >
                      {v.exists ? "present" : "missing"}
                    </Badge>
                  </div>
                  <div className="truncate text-dark-600" title={v.root}>
                    {v.root}
                  </div>
                  {status?.meta?.roots?.find((r) => r.id === v.id) && (
                    <div className="text-dark-500">
                      {status.meta.roots.find((r) => r.id === v.id)!.files} files ·{" "}
                      {status.meta.roots.find((r) => r.id === v.id)!.chunks} chunks
                    </div>
                  )}
                </div>
              ))}
              {status?.meta?.builtAt && (
                <div className="text-[10px] font-mono text-dark-600">
                  Built {status.meta.builtAt}
                  {status.providerPreference
                    ? ` · prefer ${status.providerPreference}`
                    : " · retrieval-only if no keys"}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-dark-300/50 bg-dark-100/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-mono text-emerald-200">
                <Shield className="h-4 w-4" /> Guards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[10px] font-mono text-dark-600">
              <div>· Secrets never pasted into chat / API responses</div>
              <div>· Skip .env · redact sk-/eyJ/BEGIN PRIVATE</div>
              <div>· lattice_sync: false</div>
              <div>· P3 voice / STT not wired yet</div>
              <Link href="/ai-hub" className="inline-flex items-center gap-1 text-fuchsia-300 hover:underline">
                <ExternalLink className="h-3 w-3" /> Open AI Ops Hub
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
