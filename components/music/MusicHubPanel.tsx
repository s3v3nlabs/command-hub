"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { TechPanel } from "@/components/ui/tech-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import HarmonicCalibration from "@/components/CommandHub/modules/HarmonicCalibration"
import { ResonanceEqualizer } from "@/components/audio/resonance-equalizer"
import {
  Music2,
  Radio,
  Youtube,
  Waves,
  Activity,
  ExternalLink,
  RefreshCw,
  Lock,
  Search,
  AudioLines,
  Shield,
  MessageSquare,
  EyeOff,
} from "lucide-react"

type StreamerState = "STUB" | "NOT_CONNECTED" | "LIVE"

type MusicStatus = {
  ok?: boolean
  hold?: string
  lattice_sync?: boolean
  eq?: {
    present?: boolean
    harmonicCalibration?: boolean
    resonanceEqualizer?: boolean
  }
  streamers?: Record<string, StreamerState>
  sigmaLane?: {
    linked?: boolean
    href?: string
    carriersHz?: number[]
    note?: string
  }
  links?: Record<string, string>
  notes?: string[]
  error?: string
  generatedAt?: string
}

const STREAMER_CARDS: Array<{
  id: string
  name: string
  blurb: string
  oauth: string
}> = [
  {
    id: "spotify",
    name: "Spotify",
    blurb: "Official Authorization Code + PKCE · Web Playback SDK when client id present",
    oauth: "OAuth STUB",
  },
  {
    id: "youtubeMusic",
    name: "YouTube Music",
    blurb: "Official connect path only — no pirate sources",
    oauth: "OAuth STUB",
  },
  {
    id: "tidal",
    name: "Tidal",
    blurb: "Official TIDAL API when keys arrive",
    oauth: "OAuth STUB",
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    blurb: "Official Connect + stream URL from API",
    oauth: "OAuth STUB",
  },
]

const SIGMA_CARRIERS = [
  { hz: 109, key: "ECHO_109", role: "focus / build / creative" },
  { hz: 594, key: "MERCURY_594", role: "empathy / comms" },
  { hz: 963, key: "SIGMA_963", role: "defense / crown" },
]

function badgeClass(b?: string) {
  switch (b) {
    case "LIVE":
    case "READY":
      return "border-emerald-500/50 text-emerald-300 bg-emerald-950/40"
    case "STUB":
    case "NOT_CONNECTED":
    case "NOT_CFG":
      return "border-amber-500/50 text-amber-300 bg-amber-950/30"
    case "DOWN":
    case "OFFLINE":
      return "border-red-500/50 text-red-300 bg-red-950/40"
    default:
      return "border-gray-600 text-gray-400"
  }
}

export default function MusicHubPanel() {
  const [status, setStatus] = useState<MusicStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [showResonanceEq, setShowResonanceEq] = useState(false)
  const [ytQuery, setYtQuery] = useState("")
  const [ytNote, setYtNote] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setBusy(true)
    try {
      const res = await fetch("/api/music/status", { cache: "no-store" })
      setStatus((await res.json()) as MusicStatus)
    } catch (e) {
      setStatus({
        ok: false,
        error: e instanceof Error ? e.message : "refresh failed",
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

  const onYtSearch = () => {
    const q = ytQuery.trim()
    if (!q) {
      setYtNote("Enter a search query — Data API key not configured overnight (placeholder only).")
      return
    }
    setYtNote(
      `STUB: "${q}" — YouTube Data API search + iframe embed only. No download crawler. Key not wired overnight.`,
    )
  }

  return (
    <div className="space-y-6">
      {/* HOLD + status strip */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="font-mono text-xs border-violet-500/40 text-violet-300">
          <Music2 className="mr-1 inline h-3 w-3" />
          /music
        </Badge>
        <Badge variant="outline" className={`font-mono text-xs ${badgeClass("STUB")}`}>
          STREAMERS STUB
        </Badge>
        <Badge variant="outline" className={`font-mono text-xs ${badgeClass(status?.eq?.present ? "LIVE" : "STUB")}`}>
          EQ {status?.eq?.present ? "LIVE" : "…"}
        </Badge>
        <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">
          HOLD_VYRNA_UNSYNC
        </Badge>
        <Badge variant="outline" className="font-mono text-xs border-rose-500/40 text-rose-300">
          lattice_sync: false
        </Badge>
        <Button
          size="sm"
          variant="outline"
          className="h-7 font-mono text-xs"
          onClick={() => void refresh()}
          disabled={busy}
        >
          <RefreshCw className={`mr-1 h-3 w-3 ${busy ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        {[
          { href: "/soundcheck", label: "SoundCheck", icon: AudioLines },
          { href: "/triadic", label: "Triadic", icon: MessageSquare },
          { href: "/signalframe", label: "SignalFrame", icon: Radio },
          { href: "/privacy", label: "Privacy", icon: EyeOff },
          { href: "/harmonic-calibration", label: "Harmonic Calibration", icon: Waves },
          { href: "/dev-operator#sigma-lane", label: "Sigma Lane", icon: Activity },
        ].map((l) => (
          <Link key={l.href} href={l.href}>
            <Button size="sm" variant="outline" className="h-8 font-mono text-xs gap-1">
              <l.icon className="h-3 w-3" />
              {l.label}
              <ExternalLink className="h-3 w-3 opacity-50" />
            </Button>
          </Link>
        ))}
      </div>

      {/* Sigma lane Hz bus */}
      <TechPanel className="p-4 border border-cyan-500/30 bg-cyan-950/10">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <div className="font-mono text-sm text-cyan-300 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Sigma Lane Hz bus
            </div>
            <p className="text-xs text-dark-600 font-mono mt-1 max-w-2xl">
              Operator IP / engineering UI semantics only — not medical or healing product claims.
              Lane map: focus·build·creative → 109 · empathy·comms → 594 · defense·crown → 963.
            </p>
          </div>
          <Link href="/dev-operator#sigma-lane">
            <Button size="sm" variant="outline" className="font-mono text-xs gap-1 border-cyan-500/40 text-cyan-200">
              Open Sigma Lane
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SIGMA_CARRIERS.map((c) => (
            <div
              key={c.hz}
              className="rounded border border-dark-400/40 bg-black/40 px-3 py-2 font-mono"
            >
              <div className="text-lg text-cyan-200">{c.hz} Hz</div>
              <div className="text-xs text-dark-500">{c.key}</div>
              <div className="text-xs text-dark-600 mt-1">{c.role}</div>
            </div>
          ))}
        </div>
      </TechPanel>

      {/* Streamer shell — honest stubs */}
      <TechPanel className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Radio className="h-4 w-4 text-violet-300" />
          <span className="font-mono text-sm text-violet-200">Streamer shell</span>
          <Badge variant="outline" className={`font-mono text-[10px] ${badgeClass("STUB")}`}>
            NOT CONNECTED / STUB
          </Badge>
        </div>
        <p className="text-xs text-dark-600 font-mono mb-4">
          Official OAuth providers only. No fake live playback. No pirate download crawlers.
          OAuth tokens are not invented overnight — connect when Operator keys are present.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STREAMER_CARDS.map((s) => {
            const state = status?.streamers?.[s.id] ?? "STUB"
            return (
              <div
                key={s.id}
                className="rounded border border-dark-400/40 bg-dark-200/10 p-3 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm text-dark-800">{s.name}</span>
                  <div className="flex gap-1">
                    <Badge variant="outline" className={`font-mono text-[10px] ${badgeClass(state)}`}>
                      {state}
                    </Badge>
                    <Badge variant="outline" className={`font-mono text-[10px] ${badgeClass("NOT_CONNECTED")}`}>
                      NOT CONNECTED
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-dark-600 font-mono">{s.blurb}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 font-mono text-xs w-fit"
                  disabled
                  title="OAuth not wired overnight — no tokens invented"
                >
                  <Lock className="mr-1 h-3 w-3" />
                  Connect ({s.oauth})
                </Button>
              </div>
            )
          })}
        </div>

        {/* YouTube embed/search placeholder */}
        <div className="mt-4 rounded border border-dark-400/40 bg-black/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Youtube className="h-4 w-4 text-red-400" />
            <span className="font-mono text-sm text-dark-800">YouTube — embed / search placeholder</span>
            <Badge variant="outline" className={`font-mono text-[10px] ${badgeClass("STUB")}`}>
              STUB
            </Badge>
          </div>
          <p className="text-xs text-dark-600 font-mono mb-2">
            Data API v3 search + IFrame Player only. Forbidden: yt-dlp / pirate download crawlers.
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              value={ytQuery}
              onChange={(e) => setYtQuery(e.target.value)}
              placeholder="Search query (placeholder — no API call)"
              className="font-mono text-xs max-w-md bg-black/40"
              onKeyDown={(e) => {
                if (e.key === "Enter") onYtSearch()
              }}
            />
            <Button size="sm" variant="outline" className="font-mono text-xs" onClick={onYtSearch}>
              <Search className="mr-1 h-3 w-3" />
              Search (STUB)
            </Button>
          </div>
          {ytNote && (
            <p className="mt-2 text-xs font-mono text-amber-300/90 border border-amber-500/20 rounded px-2 py-1 bg-amber-950/20">
              {ytNote}
            </p>
          )}
          <div className="mt-3 h-28 rounded border border-dashed border-dark-400/50 flex items-center justify-center text-xs font-mono text-dark-500">
            iframe embed slot — empty until Data API key + Operator connect
          </div>
        </div>
      </TechPanel>

      {/* Resonance EQ drawer (reuse existing component) */}
      <TechPanel className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Waves className="h-4 w-4 text-emerald-300" />
            <span className="font-mono text-sm text-emerald-200">10-band Resonance Equalizer</span>
            <Badge variant="outline" className={`font-mono text-[10px] ${badgeClass("LIVE")}`}>
              LIVE UI
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="font-mono text-xs"
            onClick={() => setShowResonanceEq((v) => !v)}
          >
            {showResonanceEq ? "Hide" : "Show"} Resonance EQ
          </Button>
        </div>
        <p className="text-xs text-dark-600 font-mono mb-2">
          Reuses <code className="text-dark-500">components/audio/resonance-equalizer.tsx</code> — no look rewrite.
        </p>
        {showResonanceEq && (
          <div className="mt-2 rounded border border-dark-400/30 overflow-hidden">
            <ResonanceEqualizer onClose={() => setShowResonanceEq(false)} />
          </div>
        )}
      </TechPanel>

      {/* Harmonic Calibration embed — LIVE */}
      <TechPanel className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Waves className="h-4 w-4 text-purple-300" />
          <span className="font-mono text-sm text-purple-200">Harmonic Calibration</span>
          <Badge variant="outline" className={`font-mono text-[10px] ${badgeClass("LIVE")}`}>
            LIVE
          </Badge>
          <span className="text-xs font-mono text-dark-600">
            Existing module · Web Audio demo / binaural presets · no rewrite
          </span>
        </div>
        <div className="rounded border border-dark-400/30 bg-black/20 p-2">
          <HarmonicCalibration />
        </div>
      </TechPanel>

      {/* Honesty footer */}
      <div className="rounded border border-dark-400/30 bg-black/40 px-3 py-2 font-mono text-[11px] text-dark-600 space-y-1">
        <div className="flex items-center gap-1 text-dark-500">
          <Shield className="h-3 w-3" />
          Honesty contract
        </div>
        <ul className="list-disc list-inside space-y-0.5">
          {(status?.notes ?? [
            "Official OAuth streamers only — STUB overnight",
            "YouTube embed/search placeholder — no download crawler",
            "Hz as Operator IP / UI semantics — not medical claims",
            "HOLD_VYRNA_UNSYNC · lattice_sync: false",
          ]).map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        {status?.generatedAt && (
          <div className="pt-1 text-dark-500">status @ {status.generatedAt}</div>
        )}
        {status?.error && <div className="text-red-400">error: {status.error}</div>}
      </div>
    </div>
  )
}
