"use client"

/**
 * Hands-free Phase 4 panel — browser speech nav + cross-AI multiplex.
 * ADD-ONLY · HOLD_VYRNA_UNSYNC · lattice_sync: false
 * Never logs prompt bodies. Venice seat = STUB/link only.
 */

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { TechPanel } from "@/components/ui/tech-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Mic,
  MicOff,
  RefreshCw,
  Shield,
  Hand,
  Radio,
  ExternalLink,
  AlertTriangle,
  Send,
  Navigation,
  Columns3,
} from "lucide-react"
import { useSpeechRecognition } from "@/lib/voice/useSpeechRecognition"
import {
  COMMAND_CHEATSHEET,
  matchHandsFreeCommand,
  type HandsFreeCommand,
} from "@/lib/handsfree/commands"
import type { MultiplexSeatId, SeatBadge } from "@/lib/handsfree/status"

type StatusSeat = {
  id: MultiplexSeatId
  label: string
  badge: SeatBadge
  role: string
  detail: string
  api: string
  liveCapable: boolean
  href?: string
}

type HandsFreeStatus = {
  ok?: boolean
  hold?: string
  lattice_sync?: boolean
  seats?: Record<MultiplexSeatId, StatusSeat>
  bans?: string[]
  links?: Record<string, string>
  notes?: string[]
  generatedAt?: string
  error?: string
  nav?: { badge?: string; detail?: string; commands?: typeof COMMAND_CHEATSHEET }
}

type SeatResult = {
  seat: MultiplexSeatId
  status: "idle" | "pending" | "ok" | "down" | "stub" | "error"
  badge: string
  text: string
  meta?: string
}

const SEAT_ORDER: MultiplexSeatId[] = ["twin", "axios", "ollama", "ghostlight", "venice"]

function badgeClass(b?: string) {
  switch (b) {
    case "LIVE":
    case "READY":
    case "BROWSER_LOCAL":
    case "ok":
      return "border-emerald-500/50 text-emerald-300 bg-emerald-950/40"
    case "PARTIAL":
    case "pending":
      return "border-cyan-500/50 text-cyan-300 bg-cyan-950/30"
    case "STUB":
    case "NOT_CFG":
    case "stub":
      return "border-amber-500/50 text-amber-300 bg-amber-950/30"
    case "DOWN":
    case "down":
    case "error":
      return "border-red-500/50 text-red-300 bg-red-950/40"
    default:
      return "border-gray-600 text-gray-400"
  }
}

function extractPanelSeat(
  data: {
    responses?: Array<{
      content?: string
      text?: string
      response?: string
      metadata?: { seat?: string }
      model?: string
      status?: string
      detail?: string
    }>
    ok?: boolean
    error?: string
  },
  seat: string,
): { text: string; meta: string; ok: boolean } {
  const list = data.responses || []
  const hit = list.find(
    (r) => r.metadata?.seat === seat || r.model === seat || r.metadata?.seat?.includes(seat),
  )
  if (!hit) {
    return {
      text: data.error || `No ${seat} response in panel (seat may be offline)`,
      meta: "missing",
      ok: false,
    }
  }
  const text =
    (typeof hit.content === "string" && hit.content) ||
    (typeof hit.text === "string" && hit.text) ||
    (typeof hit.response === "string" && hit.response) ||
    hit.detail ||
    "(empty)"
  return {
    text: String(text).slice(0, 4000),
    meta: hit.status || hit.metadata?.seat || seat,
    ok: Boolean(text && text !== "(empty)"),
  }
}

async function fanSeat(seat: MultiplexSeatId, prompt: string): Promise<SeatResult> {
  // Never send Venice to api.venice.ai from this panel
  if (seat === "venice") {
    return {
      seat,
      status: "stub",
      badge: "STUB",
      text: "Venice cloud seat is STUB on /handsfree — open /venice for Operator-owned chat. No api.venice.ai burns.",
      meta: "link:/venice",
    }
  }

  try {
    if (seat === "twin") {
      const res = await fetch("/api/ai/twin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: prompt }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        answer?: string
        text?: string
        response?: string
        error?: string
        sources?: unknown[]
      }
      if (!res.ok || data.ok === false) {
        return {
          seat,
          status: "down",
          badge: "DOWN",
          text: data.error || `HTTP ${res.status}`,
          meta: "twin",
        }
      }
      const text =
        data.answer || data.text || data.response || "(no answer field — twin returned ok)"
      return {
        seat,
        status: "ok",
        badge: "LIVE",
        text: String(text).slice(0, 4000),
        meta: `sources=${data.sources?.length ?? "?"}`,
      }
    }

    if (seat === "ollama") {
      const res = await fetch("/api/triadic/ollama-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        text?: string
        status?: string
        offline?: boolean
        error?: string
      }
      if (!res.ok || data.ok === false || data.offline) {
        return {
          seat,
          status: "down",
          badge: "DOWN",
          text: data.text || data.error || data.status || `HTTP ${res.status} · Ollama offline`,
          meta: "ollama",
        }
      }
      return {
        seat,
        status: "ok",
        badge: "LIVE",
        text: String(data.text || "").slice(0, 4000) || "(empty ollama text)",
        meta: data.status || "ollama",
      }
    }

    if (seat === "ghostlight") {
      const res = await fetch("/api/ghostlight/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: prompt.slice(0, 120), limit: 8 }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        error?: string
        count?: number
        hits?: Array<{ title?: string; snippet?: string; path?: string }>
      }
      if (!res.ok || data.ok === false) {
        return {
          seat,
          status: "down",
          badge: "DOWN",
          text: data.error || `HTTP ${res.status}`,
          meta: "ghostlight",
        }
      }
      const lines = (data.hits || []).map(
        (h, i) =>
          `${i + 1}. ${h.title || "(untitled)"}\n   ${(h.snippet || "").slice(0, 160)}\n   ${h.path || ""}`,
      )
      return {
        seat,
        status: "ok",
        badge: "LIVE",
        text: lines.length ? lines.join("\n\n") : "(0 hits)",
        meta: `hits=${data.count ?? lines.length}`,
      }
    }

    if (seat === "axios") {
      const res = await fetch("/api/s3v3n-panel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          preferSeat: "axios",
          includeOwnedCloud: false,
        }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        error?: string
        responses?: Array<{
          content?: string
          text?: string
          metadata?: { seat?: string }
          model?: string
          status?: string
          detail?: string
        }>
      }
      if (!res.ok && !data.responses) {
        return {
          seat,
          status: "down",
          badge: "DOWN",
          text: data.error || `HTTP ${res.status}`,
          meta: "s3v3n-panel",
        }
      }
      const extracted = extractPanelSeat(data, "axios")
      // Also accept offline/stub markers from panel honesty
      const lower = extracted.text.toLowerCase()
      if (
        !extracted.ok ||
        lower.includes("offline") ||
        lower.includes("missing") ||
        lower.includes("timeout")
      ) {
        return {
          seat,
          status: lower.includes("offline") || lower.includes("timeout") ? "down" : "error",
          badge: lower.includes("offline") ? "DOWN" : "PARTIAL",
          text: extracted.text,
          meta: extracted.meta,
        }
      }
      return {
        seat,
        status: "ok",
        badge: "LIVE",
        text: extracted.text,
        meta: extracted.meta,
      }
    }

    return {
      seat,
      status: "error",
      badge: "STUB",
      text: "Unknown seat",
      meta: seat,
    }
  } catch (e) {
    return {
      seat,
      status: "error",
      badge: "DOWN",
      text: e instanceof Error ? e.message : "fan-out failed",
      meta: "exception",
    }
  }
}

export default function HandsFreePanel() {
  const router = useRouter()
  const [status, setStatus] = useState<HandsFreeStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [navListening, setNavListening] = useState(false)
  const [lastCommand, setLastCommand] = useState<HandsFreeCommand | null>(null)
  const [navLog, setNavLog] = useState<string[]>([])
  const [selected, setSelected] = useState<Record<MultiplexSeatId, boolean>>({
    twin: true,
    axios: true,
    ollama: true,
    ghostlight: true,
    venice: false,
  })
  const [prompt, setPrompt] = useState("")
  const [results, setResults] = useState<Partial<Record<MultiplexSeatId, SeatResult>>>({})
  const [fanning, setFanning] = useState(false)
  const [fillFromVoice, setFillFromVoice] = useState(false)

  const onNavFinal = useCallback(
    (text: string) => {
      const cmd = matchHandsFreeCommand(text)
      if (cmd) {
        setLastCommand(cmd)
        setNavLog((prev) => [`→ ${cmd.phrases[0]} → ${cmd.href}`, ...prev].slice(0, 12))
        router.push(cmd.href)
      } else {
        setNavLog((prev) => [`heard: "${text.slice(0, 80)}" (no match)`, ...prev].slice(0, 12))
      }
    },
    [router],
  )

  const navSpeech = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    autoRestart: true,
    onFinal: onNavFinal,
  })

  const promptSpeech = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    autoRestart: true,
    onFinal: (text) => {
      if (!fillFromVoice) return
      setPrompt((prev) => (prev ? `${prev} ${text}` : text).trim())
    },
  })

  const refresh = useCallback(async () => {
    setBusy(true)
    try {
      const res = await fetch("/api/handsfree/status", { cache: "no-store" })
      const data = (await res.json()) as HandsFreeStatus
      setStatus(data)
      // Prefer selecting only liveCapable seats by default after first load
      if (data.seats) {
        setSelected((prev) => {
          const next = { ...prev }
          for (const id of SEAT_ORDER) {
            const s = data.seats?.[id]
            if (id === "venice") next.venice = false
            else if (s && !s.liveCapable && prev[id] === undefined) next[id] = false
          }
          return next
        })
      }
    } catch (e) {
      setStatus({
        ok: false,
        error: e instanceof Error ? e.message : "status fetch failed",
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
      })
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const toggleNavListen = useCallback(() => {
    if (navListening) {
      navSpeech.stop()
      setNavListening(false)
    } else {
      navSpeech.clearTranscript()
      navSpeech.start()
      setNavListening(true)
    }
  }, [navListening, navSpeech])

  // Keep navListening in sync if recognition dies
  useEffect(() => {
    if (!navSpeech.listening && navListening) {
      setNavListening(false)
    }
  }, [navSpeech.listening, navListening])

  const togglePromptListen = useCallback(() => {
    if (promptSpeech.listening) {
      promptSpeech.stop()
      setFillFromVoice(false)
    } else {
      setFillFromVoice(true)
      promptSpeech.start()
    }
  }, [promptSpeech])

  const runMultiplex = useCallback(async () => {
    const p = prompt.trim()
    if (!p || fanning) return
    const seats = SEAT_ORDER.filter((id) => selected[id])
    if (!seats.length) return

    setFanning(true)
    const pending: Partial<Record<MultiplexSeatId, SeatResult>> = {}
    for (const id of seats) {
      pending[id] = {
        seat: id,
        status: "pending",
        badge: "…",
        text: "Fanning…",
      }
    }
    setResults(pending)

    const settled = await Promise.all(seats.map((id) => fanSeat(id, p)))
    const next: Partial<Record<MultiplexSeatId, SeatResult>> = {}
    for (const r of settled) next[r.seat] = r
    setResults(next)
    setFanning(false)
  }, [prompt, selected, fanning])

  const seats = status?.seats

  return (
    <div className="space-y-4">
      {/* Hold banner */}
      <div className="rounded-md border border-rose-500/40 bg-rose-950/30 px-4 py-3 flex flex-wrap items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-rose-300 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="font-mono text-sm text-rose-200 font-semibold">
            HOLD_VYRNA_UNSYNC · lattice_sync: false · BROWSER-LOCAL nav · no Grok clone
          </div>
          <p className="text-xs text-dark-600 font-mono">
            Speech stays in-tab · multiplex uses local APIs only · Venice = STUB/link · prompts
            never logged server-side as full bodies
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs font-mono border-gray-600 bg-transparent"
          onClick={() => void refresh()}
          disabled={busy}
        >
          <RefreshCw className={`mr-1 h-3 w-3 ${busy ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Hands-free nav */}
      <TechPanel className="p-4 space-y-3 border-emerald-500/30">
        <div className="flex flex-wrap items-center gap-2">
          <Navigation className="h-4 w-4 text-emerald-300" />
          <span className="font-mono text-sm text-emerald-200">Hands-free nav</span>
          <Badge
            variant="outline"
            className={`font-mono text-[10px] ${badgeClass("BROWSER_LOCAL")}`}
          >
            BROWSER-LOCAL
          </Badge>
          {!navSpeech.supported && (
            <Badge variant="outline" className={`font-mono text-[10px] ${badgeClass("DOWN")}`}>
              STT UNAVAILABLE
            </Badge>
          )}
        </div>
        <p className="text-xs text-dark-600 font-mono">
          {status?.nav?.detail ||
            "Say a command below · SpeechRecognition client-only · no wake-word model"}
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            size="sm"
            className={`h-8 text-xs font-mono ${
              navListening
                ? "bg-emerald-900/70 border border-emerald-500/50"
                : "bg-violet-900/60 border border-violet-600/40"
            }`}
            onClick={toggleNavListen}
            disabled={!navSpeech.supported}
          >
            {navListening ? (
              <>
                <MicOff className="mr-1 h-3.5 w-3.5" /> Stop nav listen
              </>
            ) : (
              <>
                <Mic className="mr-1 h-3.5 w-3.5" /> Enable nav listen
              </>
            )}
          </Button>
          {lastCommand && (
            <span className="text-xs font-mono text-cyan-300">
              last: {lastCommand.phrases[0]} → {lastCommand.href}
            </span>
          )}
        </div>
        {(navSpeech.transcript || navSpeech.interim || navSpeech.error) && (
          <div className="min-h-[48px] rounded border border-dark-300/40 bg-black/50 p-2 font-mono text-xs text-dark-800">
            {navSpeech.error && (
              <div className="text-red-300 mb-1">mic: {navSpeech.error}</div>
            )}
            {navSpeech.transcript || (
              <span className="text-dark-500">{navListening ? "Listening for commands…" : ""}</span>
            )}
            {navSpeech.interim && (
              <span className="text-cyan-400/70 italic"> {navSpeech.interim}</span>
            )}
          </div>
        )}
        <div>
          <div className="font-mono text-[10px] text-dark-500 uppercase tracking-wide mb-2">
            Command cheat-sheet
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {COMMAND_CHEATSHEET.map((c) => (
              <button
                key={c.href + c.say}
                type="button"
                className="text-left rounded border border-dark-300/40 bg-black/40 px-2 py-1.5 hover:border-emerald-500/40 transition-colors"
                onClick={() => {
                  setLastCommand({
                    id: c.href,
                    phrases: [c.say],
                    href: c.href,
                    label: c.label,
                  })
                  router.push(c.href)
                }}
              >
                <div className="font-mono text-[11px] text-emerald-300">&quot;{c.say}&quot;</div>
                <div className="font-mono text-[10px] text-dark-500">
                  {c.href} · {c.label}
                </div>
              </button>
            ))}
          </div>
        </div>
        {navLog.length > 0 && (
          <ul className="text-[10px] font-mono text-dark-500 space-y-0.5 max-h-24 overflow-auto border-t border-dark-300/30 pt-2">
            {navLog.map((l, i) => (
              <li key={`${i}-${l.slice(0, 20)}`}>{l}</li>
            ))}
          </ul>
        )}
      </TechPanel>

      {/* Seat status cards */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {SEAT_ORDER.map((id) => {
          const s = seats?.[id]
          return (
            <TechPanel key={id} className="p-3 space-y-2 border-dark-300/50">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-dark-800 truncate">
                  {s?.label || id}
                </span>
                <Badge
                  variant="outline"
                  className={`font-mono text-[10px] shrink-0 ${badgeClass(s?.badge)}`}
                >
                  {s?.badge || "…"}
                </Badge>
              </div>
              <div className="text-[10px] font-mono text-violet-300/80">{s?.role || "—"}</div>
              <p className="text-[11px] text-dark-600 font-mono leading-relaxed line-clamp-4">
                {s?.detail || "Loading…"}
              </p>
              <label className="flex items-center gap-2 text-[11px] font-mono text-dark-700 cursor-pointer pt-1 border-t border-dark-300/30">
                <input
                  type="checkbox"
                  className="accent-violet-500"
                  checked={!!selected[id]}
                  onChange={(e) =>
                    setSelected((prev) => ({ ...prev, [id]: e.target.checked }))
                  }
                />
                multiplex
                {id === "venice" && (
                  <span className="text-amber-400/80">(STUB)</span>
                )}
              </label>
            </TechPanel>
          )
        })}
      </div>

      {/* Cross-AI multiplex */}
      <TechPanel className="p-4 space-y-3 border-cyan-500/30">
        <div className="flex flex-wrap items-center gap-2">
          <Columns3 className="h-4 w-4 text-cyan-300" />
          <span className="font-mono text-sm text-cyan-200">Cross-AI multiplex</span>
          <Badge variant="outline" className="font-mono text-[10px] border-cyan-500/40 text-cyan-300">
            local seats
          </Badge>
          <Radio className="h-3.5 w-3.5 text-dark-500" />
        </div>
        <p className="text-xs text-dark-600 font-mono">
          One Operator prompt → selected seats via existing local APIs. DOWN/STUB shown honestly —
          no fake completions. Venice never calls api.venice.ai from here.
        </p>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="bg-black/60 border-dark-300/50 font-mono text-sm"
          placeholder="Operator prompt (not logged as full body server-side)…"
        />
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            size="sm"
            className="h-8 text-xs font-mono bg-cyan-900/60 hover:bg-cyan-800/70 border border-cyan-600/40"
            onClick={() => void runMultiplex()}
            disabled={!prompt.trim() || fanning || !SEAT_ORDER.some((id) => selected[id])}
          >
            <Send className="mr-1 h-3.5 w-3.5" />
            {fanning ? "Fanning…" : "Fan to selected"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={`h-8 text-xs font-mono border-gray-600 bg-transparent ${
              promptSpeech.listening ? "border-emerald-500/50 text-emerald-300" : ""
            }`}
            onClick={togglePromptListen}
            disabled={!promptSpeech.supported}
            title="Fill prompt from browser speech (client-only)"
          >
            {promptSpeech.listening ? (
              <>
                <MicOff className="mr-1 h-3.5 w-3.5" /> Stop voice→prompt
              </>
            ) : (
              <>
                <Mic className="mr-1 h-3.5 w-3.5" /> Listen → prompt
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-mono border-gray-600 bg-transparent"
            onClick={() => {
              setPrompt("")
              setResults({})
            }}
          >
            Clear
          </Button>
        </div>
        {promptSpeech.interim && fillFromVoice && (
          <div className="text-[10px] font-mono text-cyan-400/70 italic">
            interim: {promptSpeech.interim}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SEAT_ORDER.filter((id) => selected[id] || results[id]).map((id) => {
            const r = results[id]
            const s = seats?.[id]
            return (
              <div
                key={id}
                className="rounded border border-dark-300/40 bg-black/50 p-3 space-y-2 min-h-[140px]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-dark-800">{s?.label || id}</span>
                  <Badge
                    variant="outline"
                    className={`font-mono text-[10px] ${badgeClass(r?.badge || s?.badge)}`}
                  >
                    {r?.badge || s?.badge || "—"}
                  </Badge>
                </div>
                <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-dark-700 max-h-56 overflow-auto">
                  {r?.text ||
                    (selected[id]
                      ? "Waiting for fan-out…"
                      : "Not selected")}
                </pre>
                {r?.meta && (
                  <div className="text-[10px] font-mono text-dark-500 border-t border-dark-300/30 pt-1">
                    {r.meta}
                    {id === "venice" && (
                      <Link
                        href="/venice"
                        className="ml-2 text-cyan-400/80 hover:text-cyan-300 inline-flex items-center gap-0.5"
                      >
                        open /venice <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </TechPanel>

      {/* Links + bans */}
      <div className="grid gap-3 md:grid-cols-2">
        <TechPanel className="p-4 space-y-2">
          <div className="font-mono text-xs text-dark-500 uppercase tracking-wide flex items-center gap-2">
            <Hand className="h-3.5 w-3.5" /> Related
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["/voice", "Voice Bus"],
                ["/triadic", "Triadic"],
                ["/signalframe", "SignalFrame"],
                ["/venice", "Venice"],
                ["/music", "Music"],
                ["/privacy", "Privacy"],
                ["/reclaim", "Reclaim"],
                ["/mesh", "Mesh"],
              ] as const
            ).map(([href, label]) => (
              <Link key={href} href={href}>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs font-mono border-gray-600 bg-transparent"
                >
                  {href}
                </Button>
              </Link>
            ))}
          </div>
        </TechPanel>
        <TechPanel className="p-4 space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs text-dark-500 uppercase tracking-wide">
            <Shield className="h-3.5 w-3.5" /> Explicit bans
          </div>
          <ul className="text-[11px] font-mono text-dark-600 space-y-1">
            {(status?.bans || [
              "No Grok / xAI voice clone",
              "No Venice API burns from /handsfree",
              "lattice_sync: false",
            ]).map((b) => (
              <li key={b}>· {b}</li>
            ))}
          </ul>
          {status?.generatedAt && (
            <div className="text-[10px] font-mono text-dark-500 pt-1 border-t border-dark-300/30">
              status @ {status.generatedAt}
              {status.error ? ` · ERR ${status.error}` : ""}
            </div>
          )}
          <a
            href="/api/handsfree/status"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400/80 hover:text-cyan-300"
          >
            /api/handsfree/status <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </TechPanel>
      </div>
    </div>
  )
}
