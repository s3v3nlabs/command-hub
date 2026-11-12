"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode, type FormEvent } from "react"
import {
  Activity,
  CheckCircle2,
  Copy,
  Database,
  KeyRound,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  XCircle,
  BookOpen,
  Filter,
  MessageSquare,
} from "lucide-react"
import { VAULT_CONNECT_CONFIGS, type NodeConfig } from "@/lib/vault/connect-configs"

type Health = {
  ok: boolean
  degraded?: boolean
  reason?: string
  service?: string
  tokenConfigured?: boolean
  health?: {
    live?: boolean
    ready?: boolean
    version?: string
    conversations?: number
    messages_fts?: number
    ingest_enabled?: boolean
    db_exists?: boolean
    reason?: string
  }
  stats?: {
    conversations?: number
    messages_fts?: number
    ingest_enabled?: boolean
    db_exists?: boolean
    by_profile?: Record<string, number>
  } | null
}

type Hit = {
  conversation_id: string
  role: string | null
  snip: string
  create_time: string | null
  title?: string | null
  profile?: string | null
  backend?: string
  evidence?: string
  meta_evidence?: string
}

type SearchResult = {
  ok: boolean
  degraded?: boolean
  reason?: string
  query?: string
  count?: number
  hits?: Hit[]
  backend?: string
  fts_query?: string
}

const EVIDENCE_COLOR: Record<string, string> = {
  OBSERVED: "border-sky-500/50 text-sky-300",
  DOCUMENTED: "border-emerald-500/50 text-emerald-300",
  CORRELATED: "border-violet-500/50 text-violet-300",
  INFERRED: "border-amber-500/50 text-amber-300",
  PREDICTED: "border-rose-500/50 text-rose-300",
}

function EvidenceBadge({ label }: { label?: string | null }) {
  if (!label) return null
  const color = EVIDENCE_COLOR[label] || "border-zinc-600 text-zinc-400"
  return (
    <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${color}`}>
      {label}
    </span>
  )
}

function renderSnip(snip: string) {
  const parts = snip.split(/>>>|<<</)
  // snippet() wraps the match as >>>match<<< so split yields [pre, match, post, ...]
  const nodes: ReactNode[] = []
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      nodes.push(
        <mark
          key={i}
          className="bg-cyan-400/20 text-cyan-200 underline decoration-cyan-400/60 decoration-1 underline-offset-2"
        >
          {parts[i]}
        </mark>,
      )
    } else {
      nodes.push(<span key={i}>{parts[i]}</span>)
    }
  }
  return nodes
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = useCallback(async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 1600)
    } catch {
      setCopied("failed")
      setTimeout(() => setCopied(null), 1600)
    }
  }, [])
  return { copied, copy }
}

export function VaultConsole() {
  const [health, setHealth] = useState<Health | null>(null)
  const [healthErr, setHealthErr] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [role, setRole] = useState("")
  const [since, setSince] = useState("")
  const [until, setUntil] = useState("")
  const [conversationId, setConversationId] = useState("")
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [selected, setSelected] = useState<Hit | null>(null)
  const [thread, setThread] = useState<{
    conversation?: Record<string, unknown>
    messages?: Array<Record<string, unknown>>
    degraded?: boolean
    reason?: string
  } | null>(null)
  const [threadBusy, setThreadBusy] = useState(false)
  const [activeNode, setActiveNode] = useState<NodeConfig>(VAULT_CONNECT_CONFIGS[0])
  const { copied, copy } = useCopy()

  const refreshHealth = useCallback(async () => {
    setHealthErr(null)
    try {
      const res = await fetch("/api/vault/status", { cache: "no-store" })
      const data = (await res.json()) as Health
      setHealth(data)
    } catch (err) {
      setHealth(null)
      setHealthErr(err instanceof Error ? err.message : "status fetch failed")
    }
  }, [])

  useEffect(() => {
    void refreshHealth()
    const t = setInterval(() => void refreshHealth(), 20_000)
    return () => clearInterval(t)
  }, [refreshHealth])

  const search = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault()
      const query = q.trim()
      if (!query) return
      setBusy(true)
      setSelected(null)
      setThread(null)
      try {
        const params = new URLSearchParams({ q: query, limit: "30" })
        if (role) params.set("role", role)
        if (since) params.set("since", since)
        if (until) params.set("until", until)
        if (conversationId) params.set("conversation_id", conversationId)
        const res = await fetch(`/api/vault/search?${params.toString()}`, { cache: "no-store" })
        const data = (await res.json()) as SearchResult
        setResult(data)
      } catch (err) {
        setResult({
          ok: false,
          degraded: true,
          reason: err instanceof Error ? err.message : "search failed",
          count: 0,
          hits: [],
        })
      } finally {
        setBusy(false)
      }
    },
    [q, role, since, until, conversationId],
  )

  const openThread = useCallback(async (hit: Hit) => {
    setSelected(hit)
    setThreadBusy(true)
    setThread(null)
    try {
      const res = await fetch(`/api/vault/conversations/${encodeURIComponent(hit.conversation_id)}?limit=200`, {
        cache: "no-store",
      })
      const data = await res.json()
      setThread(data)
    } catch (err) {
      setThread({ degraded: true, reason: err instanceof Error ? err.message : "fetch failed" })
    } finally {
      setThreadBusy(false)
    }
  }, [])

  const live = health?.health?.live
  const ready = health?.health?.ready
  const down = !health || health.degraded || !health.ok
  const convs = health?.stats?.conversations ?? health?.health?.conversations
  const msgs = health?.stats?.messages_fts ?? health?.health?.messages_fts

  const statusLabel = useMemo(() => {
    if (healthErr) return { text: "UNREACHABLE", cls: "text-rose-400 border-rose-500/50" }
    if (down) return { text: "DEGRADED", cls: "text-amber-400 border-amber-500/50" }
    if (live && ready) return { text: "LIVE", cls: "text-emerald-400 border-emerald-500/50" }
    if (live) return { text: "LIVE / NOT READY", cls: "text-amber-400 border-amber-500/50" }
    return { text: "DOWN", cls: "text-rose-400 border-rose-500/50" }
  }, [healthErr, down, live, ready])

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      {/* Masthead */}
      <div className="ghost-glass ghost-brackets scanline relative rounded-[2px] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.16em] text-cyan-200">
              <Database size={15} /> Ghostlight Vault
            </div>
            <p className="mt-1 max-w-2xl text-[12px] text-[color:var(--ghost-dim)]">
              Search a local ChatGPT data-export index. Hits are{" "}
              <span className="text-emerald-300">DOCUMENTED</span> text from your export; titles and
              timestamps are <span className="text-sky-300">OBSERVED</span> metadata. This is not a
              backdoor into OpenAI&apos;s private store. Shareable MCP + REST — see Connect AI nodes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] ${statusLabel.cls}`}>
              {statusLabel.text}
            </span>
            <button
              type="button"
              onClick={() => void refreshHealth()}
              className="rounded border border-white/10 p-1.5 text-[color:var(--ghost-dim)] hover:text-cyan-200"
              aria-label="Refresh status"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={search} className="ghost-glass ghost-brackets rounded-[2px] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[16rem] flex-1">
            <Search size={13} className="absolute left-2.5 top-2.5 text-cyan-500/70" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the vault — punctuation like 11:30 is safe"
              className="w-full rounded-[2px] border border-cyan-500/20 bg-black/60 py-1.5 pl-8 pr-3 font-mono text-[13px] text-cyan-50 outline-none placeholder:text-zinc-600 focus:border-cyan-400/50"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !q.trim()}
            className="inline-flex items-center gap-1.5 rounded-[2px] border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-cyan-200 disabled:opacity-40"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />} Search
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-mono text-[color:var(--ghost-dim)]">
          <Filter size={11} />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-[2px] border border-white/10 bg-black/60 px-2 py-1 text-[11px]"
          >
            <option value="">any role</option>
            <option value="user">user</option>
            <option value="assistant">assistant</option>
            <option value="system">system</option>
            <option value="tool">tool</option>
          </select>
          <input
            type="text"
            value={since}
            onChange={(e) => setSince(e.target.value)}
            placeholder="since (ISO)"
            className="w-36 rounded-[2px] border border-white/10 bg-black/60 px-2 py-1 text-[11px]"
          />
          <input
            type="text"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            placeholder="until (ISO)"
            className="w-36 rounded-[2px] border border-white/10 bg-black/60 px-2 py-1 text-[11px]"
          />
          <input
            type="text"
            value={conversationId}
            onChange={(e) => setConversationId(e.target.value)}
            placeholder="conversation id"
            className="min-w-[12rem] flex-1 rounded-[2px] border border-white/10 bg-black/60 px-2 py-1 text-[11px]"
          />
        </div>
      </form>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_1fr]">
        {/* Status + connect */}
        <div className="flex flex-col gap-4">
          <section className="ghost-glass ghost-brackets rounded-[2px] p-3">
            <h2 className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-cyan-200">
              <Activity size={12} /> Status
            </h2>
            {healthErr ? (
              <p className="flex items-start gap-1.5 text-[12px] text-rose-300">
                <XCircle size={13} className="mt-0.5 shrink-0" /> Hub could not reach the vault
                proxy: {healthErr}
              </p>
            ) : null}
            {down && !healthErr ? (
              <p className="mb-2 flex items-start gap-1.5 text-[12px] text-amber-300">
                <ShieldAlert size={13} className="mt-0.5 shrink-0" />
                {health?.reason ||
                  "Vault service is down or unconfigured. Search will degrade honestly. Start modules/ghostlight-vault/run.sh and set GHOSTLIGHT_VAULT_URL / GHOSTLIGHT_VAULT_TOKEN."}
              </p>
            ) : null}
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
              <dt className="text-[color:var(--ghost-dim)]">service</dt>
              <dd className="truncate text-cyan-100" title={health?.service}>
                {health?.service || "http://127.0.0.1:8765"}
              </dd>
              <dt className="text-[color:var(--ghost-dim)]">live / ready</dt>
              <dd className="flex items-center gap-1">
                {live ? (
                  <CheckCircle2 size={11} className="text-emerald-400" />
                ) : (
                  <XCircle size={11} className="text-rose-400" />
                )}
                {live ? "live" : "down"} / {ready ? "ready" : "not ready"}
              </dd>
              <dt className="text-[color:var(--ghost-dim)]">token (hub)</dt>
              <dd className="flex items-center gap-1">
                <KeyRound size={11} />
                {health?.tokenConfigured ? "configured" : "not set"}
              </dd>
              <dt className="text-[color:var(--ghost-dim)]">conversations</dt>
              <dd>{convs ?? "—"}</dd>
              <dt className="text-[color:var(--ghost-dim)]">messages (FTS)</dt>
              <dd>{msgs ?? "—"}</dd>
              <dt className="text-[color:var(--ghost-dim)]">ingest</dt>
              <dd>
                {health?.stats?.ingest_enabled || health?.health?.ingest_enabled
                  ? "enabled"
                  : "off (default)"}
              </dd>
              <dt className="text-[color:var(--ghost-dim)]">index</dt>
              <dd>{health?.stats?.db_exists ?? health?.health?.db_exists ? "present" : "missing"}</dd>
            </dl>
            <p className="mt-2 text-[10px] leading-relaxed text-[color:var(--ghost-dim)]">
              Setup:{" "}
              <a href="https://github.com/s3v3nlabs/command-hub/blob/main/docs/GHOSTLIGHT_VAULT.md" className="text-cyan-300 underline">
                docs/GHOSTLIGHT_VAULT.md
              </a>
            </p>
          </section>

          <section className="ghost-glass ghost-brackets rounded-[2px] p-3">
            <h2 className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-cyan-200">
              <Link2 size={12} /> Connect AI nodes
            </h2>
            <ul className="flex flex-col gap-0.5">
              {VAULT_CONNECT_CONFIGS.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => setActiveNode(n)}
                    className={`w-full rounded-[2px] px-2 py-1 text-left font-mono text-[11px] ${
                      activeNode.id === n.id
                        ? "bg-cyan-400/15 text-cyan-100"
                        : "text-[color:var(--ghost-dim)] hover:bg-white/5"
                    }`}
                  >
                    {n.name}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Results + connect detail */}
        <div className="flex flex-col gap-4 min-w-0">
          <section className="ghost-glass ghost-brackets rounded-[2px] p-3 min-w-0">
            <h2 className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-cyan-200">
              <span className="flex items-center gap-1.5">
                <MessageSquare size={12} /> Results
              </span>
              {result?.backend ? (
                <span className="normal-case tracking-normal text-[10px] text-[color:var(--ghost-dim)]">
                  {result.count ?? 0} hit(s) · {result.backend}
                  {result.fts_query ? ` · FTS ${result.fts_query}` : ""}
                </span>
              ) : null}
            </h2>
            {!result ? (
              <p className="text-[12px] text-[color:var(--ghost-dim)]">
                Run a search. Queries with punctuation such as <code>11:30</code> are quoted for FTS
                and fall back to LIKE if needed.
              </p>
            ) : result.degraded || !result.ok ? (
              <p className="flex items-start gap-1.5 text-[12px] text-amber-300">
                <ShieldAlert size={13} className="mt-0.5 shrink-0" />
                {result.reason || "Vault search is unavailable. The service is down or unconfigured — no fake hits."}
              </p>
            ) : (result.hits || []).length === 0 ? (
              <p className="text-[12px] text-[color:var(--ghost-dim)]">No hits for <code className="text-cyan-200">{result.query}</code>.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {(result.hits || []).map((h, i) => (
                  <li key={`${h.conversation_id}-${i}`}>
                    <button
                      type="button"
                      onClick={() => void openThread(h)}
                      className={`w-full rounded-[2px] border px-3 py-2 text-left transition ${
                        selected?.conversation_id === h.conversation_id && selected?.snip === h.snip
                          ? "border-cyan-400/50 bg-cyan-400/10"
                          : "border-white/10 hover:border-cyan-500/30 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[12px] text-cyan-100">
                          {h.title || h.conversation_id}
                        </span>
                        <EvidenceBadge label={h.evidence} />
                        <span className="rounded border border-white/10 px-1 font-mono text-[9px] uppercase text-zinc-400">
                          {h.role || "?"}
                        </span>
                        {h.create_time ? (
                          <span className="font-mono text-[9px] text-zinc-500">{h.create_time}</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-zinc-300">
                        {renderSnip(h.snip || "")}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {(selected || threadBusy || thread) && (
            <section className="ghost-glass ghost-brackets rounded-[2px] p-3 min-w-0">
              <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-cyan-200">
                Conversation
              </h2>
              {threadBusy ? (
                <p className="flex items-center gap-1.5 text-[12px] text-[color:var(--ghost-dim)]">
                  <Loader2 size={12} className="animate-spin" /> Loading
                </p>
              ) : thread?.degraded ? (
                <p className="text-[12px] text-amber-300">{thread.reason || "unavailable"}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                    <span className="text-cyan-100">
                      {String(thread?.conversation?.title || selected?.title || selected?.conversation_id)}
                    </span>
                    <EvidenceBadge label={String(thread?.conversation?.evidence || "OBSERVED")} />
                  </div>
                  <div className="max-h-80 overflow-auto space-y-2 pr-1">
                    {(thread?.messages || []).map((m, i) => (
                      <div key={i} className="border-l-2 border-cyan-500/20 pl-2">
                        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[9px] uppercase text-zinc-500">
                          {String(m.role || "")} {m.create_time ? `· ${String(m.create_time)}` : ""}{" "}
                          <EvidenceBadge label={String(m.evidence || "DOCUMENTED")} />
                        </div>
                        <p className="whitespace-pre-wrap text-[12px] text-zinc-300">
                          {String(m.text || "").slice(0, 4000)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="ghost-glass ghost-brackets rounded-[2px] p-3 min-w-0">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-cyan-200">
                <BookOpen size={12} /> {activeNode.name}
              </h2>
              <button
                type="button"
                onClick={() => void copy(activeNode.id, activeNode.snippet)}
                className="inline-flex items-center gap-1 rounded-[2px] border border-cyan-400/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-cyan-200"
              >
                <Copy size={10} /> {copied === activeNode.id ? "copied" : "copy config"}
              </button>
            </div>
            <p className="text-[11px] text-[color:var(--ghost-dim)]">
              <span className="text-zinc-400">Transport:</span> {activeNode.transport}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--ghost-dim)]">
              {activeNode.verified}
            </p>
            {activeNode.notes ? (
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">{activeNode.notes}</p>
            ) : null}
            <pre className="mt-2 overflow-auto rounded-[2px] border border-white/10 bg-black/50 p-2 font-mono text-[10px] leading-relaxed text-cyan-100">
              {activeNode.snippet}
            </pre>
            <p className="mt-2 text-[10px] text-zinc-500">
              Placeholders only — never paste a live token into a committed file. Token lives in{" "}
              <code>.bearer_token</code> (gitignored).
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
