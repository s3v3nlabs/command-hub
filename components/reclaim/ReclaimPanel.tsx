"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Eye,
  Shield,
  Search,
  Archive,
  RefreshCw,
  Radio,
  ExternalLink,
  Sparkles,
  Loader2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  TechCard,
  TechCardContent,
  TechCardDescription,
  TechCardHeader,
  TechCardTitle,
} from "@/components/ui/tech-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

type AxiosStatus = {
  ok: boolean
  name?: string
  runway?: string
  local_ready?: boolean
  as_of?: string
  identity?: Record<string, string>
  sources?: Record<string, string>
  venice?: { pulse: string; deepLink: string; note: string }
  demo?: { ran: boolean; ok?: boolean; detail?: string; preview?: string }
  lattice_sync?: boolean
  hold?: string
  error?: string
}

type HeimdallStatus = {
  ok: boolean
  status?: string
  handshake?: string
  gate_state?: string
  detail?: string
  lattice_sync?: boolean
  hold?: string
  shadow_protocol?: string
  sources?: Record<string, string> | null
  stdout_preview?: string
  error?: string
}

type PackFile = {
  name: string
  rel: string
  bytes: number
  kind: string
  mtime: string
}

type SearchHit = {
  title: string
  snippet: string
  path: string | null
  conversation_id: string
  role: string | null
}

const OSINT_SUMMARY = [
  "Negative-space OSINT — empty / deleted shards are signal",
  "Perimeter metaphor ≠ live Vyrna lattice claim",
  "HOFUD handshake — admit Operator signal; reject Sentinel / Axiom / Shadow-Veil",
  "Ironmirror — reflect adversary energy; do not become it",
  "Hand-offs — unveil→AXIOS · fragments→OB-1/Shadowvox · ethics→Nova Prime",
]

export default function ReclaimPanel() {
  const [axios, setAxios] = useState<AxiosStatus | null>(null)
  const [heimdall, setHeimdall] = useState<HeimdallStatus | null>(null)
  const [packFiles, setPackFiles] = useState<PackFile[]>([])
  const [packName, setPackName] = useState<"FULL_RECALL" | "GPT_REBUILD_LOCAL">(
    "FULL_RECALL",
  )
  const [packMeta, setPackMeta] = useState<{
    pack?: string
    packDir?: string
    venice_pulse?: string
    sibling?: { name: string; path: string; note: string }
  }>({})
  const [activeChunk, setActiveChunk] = useState<string | null>(null)
  const [chunkBody, setChunkBody] = useState<string>("")
  const [q, setQ] = useState("Heimdall")
  const [hits, setHits] = useState<SearchHit[]>([])
  const [searchMeta, setSearchMeta] = useState("")
  const [busy, setBusy] = useState<string | null>(null)

  const loadAxios = useCallback(async (demo = false) => {
    setBusy("axios")
    try {
      const res = await fetch(`/api/engines/axios/status${demo ? "?demo=1" : ""}`, {
        cache: "no-store",
      })
      const data = (await res.json()) as AxiosStatus
      setAxios(data)
    } catch (err) {
      setAxios({
        ok: false,
        error: err instanceof Error ? err.message : "axios status failed",
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
      })
    } finally {
      setBusy(null)
    }
  }, [])

  const runHandshake = useCallback(async () => {
    setBusy("heimdall")
    try {
      const res = await fetch("/api/engines/heimdall/handshake", {
        method: "POST",
        cache: "no-store",
      })
      const data = (await res.json()) as HeimdallStatus
      setHeimdall(data)
    } catch (err) {
      setHeimdall({
        ok: false,
        error: err instanceof Error ? err.message : "handshake failed",
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
      })
    } finally {
      setBusy(null)
    }
  }, [])

  const loadPack = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/reclaim/pack?name=${encodeURIComponent(packName)}`,
        { cache: "no-store" },
      )
      const data = await res.json()
      setPackFiles((data.files || []) as PackFile[])
      setPackMeta({
        pack: data.pack,
        packDir: data.packDir,
        venice_pulse: data.venice_pulse,
        sibling: data.sibling,
      })
      setActiveChunk(null)
      setChunkBody("")
    } catch {
      setPackFiles([])
      setPackMeta({})
    }
  }, [packName])

  const readChunk = useCallback(
    async (name: string) => {
      setBusy("pack")
      setActiveChunk(name)
      try {
        const res = await fetch(
          `/api/reclaim/pack?name=${encodeURIComponent(packName)}&file=${encodeURIComponent(name)}`,
          { cache: "no-store" },
        )
        const data = await res.json()
        setChunkBody(data.content || data.error || "(empty)")
      } catch (err) {
        setChunkBody(err instanceof Error ? err.message : "read failed")
      } finally {
        setBusy(null)
      }
    },
    [packName],
  )

  const runSearch = useCallback(async () => {
    if (!q.trim()) return
    setBusy("search")
    setSearchMeta("searching…")
    try {
      const res = await fetch("/api/ghostlight/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: q.trim(), limit: 12 }),
      })
      const data = await res.json()
      setHits((data.hits || []) as SearchHit[])
      setSearchMeta(
        data.ok
          ? `${data.count} hits · ${data.backend} · lattice_sync:false`
          : data.error || "search failed",
      )
    } catch (err) {
      setHits([])
      setSearchMeta(err instanceof Error ? err.message : "search failed")
    } finally {
      setBusy(null)
    }
  }, [q])

  useEffect(() => {
    loadAxios(false)
    runHandshake()
    loadPack()
  }, [loadAxios, runHandshake, loadPack])

  useEffect(() => {
    if (packFiles.length && !activeChunk) {
      const first =
        packFiles.find((f) => f.name.startsWith("CHUNK_01")) ||
        packFiles.find((f) => f.name.startsWith("MANIFEST")) ||
        packFiles[0]
      if (first) readChunk(first.name)
    }
  }, [packFiles, activeChunk, readChunk])

  return (
    <div className="space-y-4 text-dark-800">
      {/* Title strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded border border-violet-500/40 bg-violet-500/10">
            <Eye className="h-5 w-5 text-violet-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-violet-100 font-mono">
              SHADOW RECLAMATION · EYE OF TRUTH
            </h1>
            <p className="text-xs text-dark-600 font-mono">
              AXIOS · Heimdallr · Ghostlight Vault · FULL_RECALL + GPT_REBUILD_LOCAL — local seats only
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-xs border-amber-500/50 text-amber-300"
          >
            HOLD_VYRNA_UNSYNC
          </Badge>
          <Badge
            variant="outline"
            className="font-mono text-xs border-rose-500/40 text-rose-300"
          >
            lattice_sync: false
          </Badge>
          <Badge
            variant="outline"
            className="font-mono text-xs border-slate-500/40 text-slate-400"
          >
            Venice pulse: BAYED overnight
          </Badge>
        </div>
      </div>

      {/* Deep links */}
      <div className="flex flex-wrap gap-2 border border-dark-300/40 bg-dark-100/40 rounded px-3 py-2">
        <Link
          href="/heimdal-terminal"
          className="inline-flex items-center gap-1 rounded border border-cyan-500/30 bg-cyan-500/5 px-2 py-1 text-xs font-mono text-cyan-200 hover:bg-cyan-500/15"
        >
          <Shield className="h-3 w-3" /> Heimdal Terminal
        </Link>
        <Link
          href="/venice"
          className="inline-flex items-center gap-1 rounded border border-violet-500/30 bg-violet-500/5 px-2 py-1 text-xs font-mono text-violet-200 hover:bg-violet-500/15"
        >
          <Sparkles className="h-3 w-3" /> Venice (bayed)
        </Link>
        <Link
          href="/signalframe"
          className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/5 px-2 py-1 text-xs font-mono text-emerald-200 hover:bg-emerald-500/15"
        >
          <Radio className="h-3 w-3" /> SignalFrame · axios/twin seats
        </Link>
        <Link
          href="/ai-hub"
          className="inline-flex items-center gap-1 rounded border border-dark-300/40 px-2 py-1 text-xs font-mono text-dark-600 hover:text-dark-800"
        >
          AI Ops Hub
        </Link>
        <Link
          href="/operator-twin"
          className="inline-flex items-center gap-1 rounded border border-dark-300/40 px-2 py-1 text-xs font-mono text-dark-600 hover:text-dark-800"
        >
          Operator Twin
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* AXIOS */}
        <TechCard variant="info" glowEffect borderAccent>
          <TechCardHeader>
            <div>
              <TechCardTitle className="text-cyan-200">AXIOS · Eye of Truth</TechCardTitle>
              <TechCardDescription>
                Local smoke / STATUS · VEDIC frame · identity locks from CHUNK_01
              </TechCardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs"
                disabled={busy === "axios"}
                onClick={() => loadAxios(false)}
              >
                <RefreshCw className={cn("h-3 w-3 mr-1", busy === "axios" && "animate-spin")} />
                Status
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs border-cyan-500/40"
                disabled={busy === "axios"}
                onClick={() => loadAxios(true)}
              >
                Demo smoke
              </Button>
            </div>
          </TechCardHeader>
          <TechCardContent className="space-y-3 text-xs font-mono">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  axios?.ok && axios.local_ready
                    ? "border-emerald-500/40 text-emerald-300"
                    : "border-amber-500/40 text-amber-300",
                )}
              >
                {axios?.runway || "…"} · local {axios?.local_ready ? "ready" : "checking"}
              </Badge>
              <Badge variant="outline" className="text-xs border-rose-500/40 text-rose-300">
                lattice_sync: false
              </Badge>
            </div>
            {axios?.identity && (
              <ul className="space-y-1 text-dark-700">
                {Object.entries(axios.identity)
                  .filter(([k]) => !["lattice_sync", "hold"].includes(k))
                  .map(([k, v]) => (
                    <li key={k}>
                      <span className="text-cyan-400/80">{k}:</span> {v}
                    </li>
                  ))}
              </ul>
            )}
            {axios?.as_of && (
              <p className="text-dark-600">STATUS as of: {axios.as_of}</p>
            )}
            {axios?.demo?.ran && (
              <pre className="rounded border border-dark-300/40 bg-black/60 p-2 text-[10px] text-dark-700 whitespace-pre-wrap max-h-32 overflow-auto">
                {axios.demo.detail}
                {"\n"}
                {axios.demo.preview}
              </pre>
            )}
            {axios?.error && <p className="text-rose-400">{axios.error}</p>}
            <Link
              href="/venice"
              className="inline-flex items-center gap-1 text-violet-300 hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> Deep link /venice — pulse BAYED overnight
            </Link>
          </TechCardContent>
        </TechCard>

        {/* Heimdallr */}
        <TechCard variant="success" glowEffect borderAccent>
          <TechCardHeader>
            <div>
              <TechCardTitle className="text-emerald-200">
                Heimdallr · Watchful Eye
              </TechCardTitle>
              <TechCardDescription>
                Local handshake only — never claims Vyrna / lattice online
              </TechCardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="font-mono text-xs border-emerald-500/40"
              disabled={busy === "heimdall"}
              onClick={runHandshake}
            >
              {busy === "heimdall" ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Shield className="h-3 w-3 mr-1" />
              )}
              Handshake
            </Button>
          </TechCardHeader>
          <TechCardContent className="space-y-3 text-xs font-mono">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  heimdall?.ok
                    ? "border-emerald-500/40 text-emerald-300"
                    : "border-amber-500/40 text-amber-300",
                )}
              >
                {heimdall?.status || "…"} · {heimdall?.handshake || "local_standby"}
              </Badge>
              {heimdall?.gate_state && (
                <Badge variant="outline" className="text-xs border-cyan-500/40 text-cyan-300">
                  gate: {heimdall.gate_state}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs border-rose-500/40 text-rose-300">
                lattice_sync: false
              </Badge>
            </div>
            <p className="text-dark-700">
              Protocol: {heimdall?.shadow_protocol || "Shadow Reclamation"} · naming lock: not
              Shadow Veil
            </p>
            <div>
              <p className="text-emerald-400/80 mb-1">OSINT pattern summary (CHUNK_02 · safe):</p>
              <ul className="list-disc pl-4 space-y-0.5 text-dark-700">
                {OSINT_SUMMARY.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            {heimdall?.error && <p className="text-rose-400">{heimdall.error}</p>}
            {heimdall?.detail && (
              <p className="text-dark-600">detail: {heimdall.detail}</p>
            )}
          </TechCardContent>
        </TechCard>
      </div>

      {/* Ghostlight search */}
      <TechCard variant="outline" borderAccent>
        <TechCardHeader>
          <div>
            <TechCardTitle className="text-violet-200 flex items-center gap-2">
              <Search className="h-4 w-4" /> Ghostlight Vault search
            </TechCardTitle>
            <TechCardDescription>
              FTS over chatgpt-vault · titles / snippets / paths only · secrets scrubbed
            </TechCardDescription>
          </div>
        </TechCardHeader>
        <TechCardContent className="space-y-3">
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              runSearch()
            }}
          >
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search vault (e.g. Heimdall)"
              className="font-mono text-sm max-w-md bg-black/60 border-dark-300/50"
            />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="font-mono text-xs"
              disabled={busy === "search"}
            >
              {busy === "search" ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Search className="h-3 w-3 mr-1" />
              )}
              Search
            </Button>
          </form>
          {searchMeta && (
            <p className="text-[10px] font-mono text-dark-600">{searchMeta}</p>
          )}
          <ScrollArea className="h-56 rounded border border-dark-300/40 bg-black/50 p-2">
            <ul className="space-y-2 text-xs font-mono">
              {hits.length === 0 && (
                <li className="text-dark-600">No hits yet — run a search.</li>
              )}
              {hits.map((h, i) => (
                <li
                  key={`${h.conversation_id}-${i}`}
                  className="rounded border border-dark-300/30 bg-dark-100/30 p-2"
                >
                  <div className="text-violet-200">{h.title}</div>
                  <div className="text-dark-700 mt-1 whitespace-pre-wrap">{h.snippet}</div>
                  {h.path && (
                    <div className="text-[10px] text-dark-600 mt-1 truncate" title={h.path}>
                      {h.path}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </TechCardContent>
      </TechCard>

      {/* Reclaim packs: FULL_RECALL + GPT_REBUILD_LOCAL */}
      <TechCard variant="warning" borderAccent>
        <TechCardHeader>
          <div>
            <TechCardTitle className="text-amber-200 flex items-center gap-2">
              <Archive className="h-4 w-4" /> Reclaim pack browser
            </TechCardTitle>
            <TechCardDescription>
              {packMeta.packDir ||
                "/workspace/venice-vault/packs/…"}{" "}
              · read-only markdown ·{" "}
              <span className="text-amber-300/80">{packMeta.pack || packName}</span>
            </TechCardDescription>
          </div>
          <Badge
            variant="outline"
            className="font-mono text-xs border-amber-500/50 text-amber-300"
          >
            Venice pulse BAYED overnight
          </Badge>
        </TechCardHeader>
        <TechCardContent>
          <div className="mb-3 flex flex-wrap gap-2">
            {(
              [
                ["FULL_RECALL", "FULL_RECALL"],
                ["GPT_REBUILD_LOCAL", "GPT rebuild local"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPackName(id)}
                className={cn(
                  "rounded border px-2 py-1 text-[11px] font-mono transition-colors",
                  packName === id
                    ? "border-amber-400/60 bg-amber-500/15 text-amber-100"
                    : "border-dark-300/40 bg-black/40 text-dark-600 hover:border-amber-500/30",
                )}
              >
                {label}
              </button>
            ))}
            {packMeta.sibling && (
              <span className="self-center text-[10px] font-mono text-dark-600">
                sibling: {packMeta.sibling.name} · {packMeta.sibling.note}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="space-y-1">
              {packFiles.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => readChunk(f.name)}
                  className={cn(
                    "w-full text-left rounded border px-2 py-1.5 text-[11px] font-mono transition-colors",
                    activeChunk === f.name
                      ? "border-amber-400/60 bg-amber-500/10 text-amber-100"
                      : "border-dark-300/40 bg-black/40 text-dark-700 hover:border-amber-500/30",
                  )}
                >
                  <span className="text-amber-300/80">{f.kind}</span> · {f.name}
                  <span className="block text-[10px] text-dark-600">{f.bytes} B</span>
                </button>
              ))}
              {!packFiles.length && (
                <p className="text-xs text-dark-600 font-mono">Pack empty or missing.</p>
              )}
            </div>
            <div className="lg:col-span-2">
              <ScrollArea className="h-80 rounded border border-dark-300/40 bg-black/60 p-3">
                <pre className="text-[11px] font-mono text-dark-700 whitespace-pre-wrap">
                  {busy === "pack" ? "loading…" : chunkBody || "Select a chunk."}
                </pre>
              </ScrollArea>
            </div>
          </div>
        </TechCardContent>
      </TechCard>

      <p className="text-[10px] font-mono text-dark-600 text-center">
        Grok Bot = tool / executor · not persona · AXIOS not Axiom · Shadow Reclamation not Veil ·
        no PSID / WireGuard / .env in UI
      </p>
    </div>
  )
}
