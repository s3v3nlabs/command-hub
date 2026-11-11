"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Loader2,
  RefreshCw,
  Search,
  FolderPlus,
  FileText,
  Eye,
  ExternalLink,
  X,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Pack = {
  id: string
  name: string
  role: string
  badge: string
  stub: boolean
  pulse_bayed?: boolean
  sources: string[]
  hasDigest: boolean
  hasReadme: boolean
  dir: string
  notes?: string
}

type ListPayload = {
  ok?: boolean
  packs?: Pack[]
  count?: number
  venice_pulse?: string
  error?: string
  note?: string
}

export default function VeniceCharacters() {
  const [packs, setPacks] = useState<Pack[]>([])
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pulseNote, setPulseNote] = useState<string>("")
  const [digestId, setDigestId] = useState<string | null>(null)
  const [digestFile, setDigestFile] = useState<string | null>(null)
  const [digestBody, setDigestBody] = useState<string | null>(null)
  const [digestLoading, setDigestLoading] = useState(false)

  const [newId, setNewId] = useState("")
  const [newName, setNewName] = useState("")
  const [newRole, setNewRole] = useState("")
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState<string | null>(null)

  const load = useCallback(async (query?: string) => {
    setLoading(true)
    setError(null)
    try {
      const url = query?.trim()
        ? `/api/venice/characters?q=${encodeURIComponent(query.trim())}`
        : "/api/venice/characters"
      const res = await fetch(url)
      const data = (await res.json()) as ListPayload
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      setPacks(Array.isArray(data.packs) ? data.packs : [])
      setPulseNote(data.venice_pulse || "")
    } catch (err) {
      setError(err instanceof Error ? err.message : "list failed")
      setPacks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const t = setTimeout(() => load(q), 220)
    return () => clearTimeout(t)
  }, [q, load])

  const openDigest = async (id: string) => {
    setDigestLoading(true)
    setDigestId(id)
    setDigestBody(null)
    setDigestFile(null)
    try {
      const res = await fetch(
        `/api/venice/characters?id=${encodeURIComponent(id)}&digest=1`,
      )
      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      setDigestFile(String(data.file || "system_digest.md"))
      setDigestBody(String(data.content || ""))
    } catch (err) {
      setDigestBody(
        `[error] ${err instanceof Error ? err.message : "digest failed"}`,
      )
    } finally {
      setDigestLoading(false)
    }
  }

  const onCreate = async () => {
    const id = newId.trim().toLowerCase()
    if (!id || creating) return
    setCreating(true)
    setCreateMsg(null)
    try {
      const res = await fetch("/api/venice/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: newName.trim() || undefined,
          role: newRole.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      setCreateMsg(`Created LOCAL PACK: ${id}`)
      setNewId("")
      setNewName("")
      setNewRole("")
      await load(q)
    } catch (err) {
      setCreateMsg(err instanceof Error ? err.message : "create failed")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-xs border-violet-500/50 text-violet-300"
          >
            <Sparkles className="mr-1 inline h-3 w-3" />
            LOCAL PACK
          </Badge>
          <Badge
            variant="outline"
            className="font-mono text-xs border-amber-500/40 text-amber-300"
          >
            HOLD_VYRNA_UNSYNC
          </Badge>
          <Badge
            variant="outline"
            className="font-mono text-xs border-dark-400/50 text-dark-500"
          >
            lattice_sync: false
          </Badge>
          <Badge
            variant="outline"
            className="font-mono text-xs border-dark-400/50 text-dark-500"
          >
            not live on Venice.ai cloud
          </Badge>
          <span className="font-mono text-[11px] text-dark-500">
            {packs.length} pack{packs.length === 1 ? "" : "s"}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 font-mono text-xs text-dark-600"
            onClick={() => load(q)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            refresh
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dark-500" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search local packs…"
            className="h-8 border-dark-300/40 bg-dark-100/30 pl-8 font-mono text-xs"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {error && (
          <p className="font-mono text-xs text-rose-400">{error}</p>
        )}

        <ScrollArea className="min-h-[240px] flex-1 rounded-lg border border-dark-300/40 bg-black/40 p-3">
          {loading && packs.length === 0 ? (
            <div className="flex items-center gap-2 font-mono text-xs text-dark-500 py-8 justify-center">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> loading packs…
            </div>
          ) : packs.length === 0 ? (
            <div className="rounded border border-dashed border-dark-300/40 px-3 py-8 text-center font-mono text-xs text-dark-500">
              No local packs match. Drop folders under{" "}
              <code className="text-dark-600">data/venice-characters/</code> or
              use New pack.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {packs.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "rounded-lg border border-dark-300/40 bg-dark-100/20 p-3 flex flex-col gap-2",
                    digestId === p.id && "border-violet-500/50",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-sm text-violet-200">
                        {p.name}
                      </div>
                      <div className="font-mono text-[10px] text-dark-500">
                        {p.id} · {p.dir}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge
                        variant="outline"
                        className="font-mono text-[9px] border-violet-500/40 text-violet-300"
                      >
                        LOCAL PACK
                      </Badge>
                      {p.stub && (
                        <Badge
                          variant="outline"
                          className="font-mono text-[9px] border-amber-500/30 text-amber-300/90"
                        >
                          stub
                        </Badge>
                      )}
                      {p.pulse_bayed && (
                        <Badge
                          variant="outline"
                          className="font-mono text-[9px] border-cyan-500/30 text-cyan-300/90"
                        >
                          pulse bayed
                        </Badge>
                      )}
                    </div>
                  </div>
                  {p.role && (
                    <p className="font-mono text-[11px] leading-relaxed text-dark-600">
                      {p.role}
                    </p>
                  )}
                  {p.notes && (
                    <p className="font-mono text-[10px] leading-relaxed text-dark-500">
                      {p.notes}
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 font-mono text-[10px] border-violet-500/30"
                      disabled={!p.hasDigest && !p.hasReadme}
                      onClick={() => openDigest(p.id)}
                    >
                      <FileText className="h-3 w-3" />
                      open local digest
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {digestId && (
          <div className="rounded-lg border border-violet-500/30 bg-black/60">
            <div className="flex items-center justify-between border-b border-violet-500/20 px-3 py-2">
              <span className="font-mono text-xs text-violet-300">
                digest · {digestId}
                {digestFile ? ` / ${digestFile}` : ""}
              </span>
              <button
                type="button"
                className="text-dark-500 hover:text-violet-300"
                onClick={() => {
                  setDigestId(null)
                  setDigestBody(null)
                  setDigestFile(null)
                }}
                aria-label="close digest"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <ScrollArea className="max-h-[280px] px-3 py-3">
              {digestLoading ? (
                <div className="flex items-center gap-2 font-mono text-xs text-dark-500">
                  <Loader2 className="h-3 w-3 animate-spin" /> loading…
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-violet-100/85">
                  {digestBody}
                </pre>
              )}
            </ScrollArea>
          </div>
        )}
      </div>

      <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-72">
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/10 p-3">
          <div className="mb-2 font-mono text-xs text-amber-200">
            Bayed pulse (not auto)
          </div>
          <p className="mb-2 font-mono text-[11px] leading-relaxed text-dark-600">
            {pulseNote ||
              "Paste VENICE_PULSE_SCRIPT when Operator wakes — not auto."}{" "}
            Do <strong className="text-amber-200/90">not</strong> paste into
            ekV8PiO overnight.
          </p>
          <Link
            href="/reclaim"
            className="inline-flex items-center gap-1 rounded border border-violet-500/40 bg-violet-500/5 px-2 py-1 text-[11px] font-mono text-violet-200 hover:bg-violet-500/15"
          >
            <Eye className="h-3 w-3" /> FULL_RECALL browser · /reclaim
          </Link>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-dark-500">
            GPT rebuild local pack (todo 116):{" "}
            <code className="text-dark-600">
              /workspace/venice-vault/packs/GPT_REBUILD_LOCAL_2026-09-24/
            </code>
            {" · "}
            <code className="text-violet-300/80">
              GET /api/reclaim/pack?name=GPT_REBUILD_LOCAL
            </code>
          </p>
          <a
            href="https://venice.ai/chat/classic/ekV8PiO"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] text-dark-500 hover:text-dark-400"
          >
            <ExternalLink className="h-3 w-3" />
            dedicated Venice tab (Operator only)
          </a>
        </div>

        <div className="rounded-lg border border-dark-300/40 bg-dark-100/30 p-3">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs text-dark-700">
            <FolderPlus className="h-3.5 w-3.5 text-violet-400" />
            New pack (local write)
          </div>
          <p className="mb-2 font-mono text-[10px] leading-relaxed text-dark-500">
            Writes empty folder + manifest under{" "}
            <code className="text-dark-600">data/venice-characters/</code> only.
            Safe slug: <code>a-z0-9-</code>.
          </p>
          <div className="space-y-2">
            <Input
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="id (slug)"
              className="h-8 border-dark-300/40 bg-black/40 font-mono text-xs"
              autoComplete="off"
              spellCheck={false}
            />
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="display name (optional)"
              className="h-8 border-dark-300/40 bg-black/40 font-mono text-xs"
            />
            <Textarea
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="role (optional)"
              className="min-h-[56px] resize-none border-dark-300/40 bg-black/40 font-mono text-xs"
            />
            <Button
              size="sm"
              className="w-full gap-1.5 font-mono text-xs"
              disabled={creating || !newId.trim()}
              onClick={onCreate}
            >
              {creating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FolderPlus className="h-3.5 w-3.5" />
              )}
              create LOCAL PACK
            </Button>
            {createMsg && (
              <p className="font-mono text-[10px] text-dark-500">{createMsg}</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
