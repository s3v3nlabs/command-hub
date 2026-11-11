"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { TechPanel } from "@/components/ui/tech-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Mic,
  MicOff,
  Volume2,
  RefreshCw,
  ExternalLink,
  Shield,
  AudioLines,
  Music2,
  MessageSquare,
  Cpu,
  EyeOff,
  AlertTriangle,
  Radio,
  Hand,
} from "lucide-react"

type SeatBadge =
  | "BROWSER_LOCAL"
  | "PARTIAL"
  | "LIVE"
  | "STUB"
  | "NOT_CFG"
  | "DOWN"
  | "READY"

type VoiceSeat = {
  id: string
  label: string
  badge: SeatBadge
  role: string
  detail: string
  configured: boolean
  paths?: string[]
  note?: string
}

type VoiceStatus = {
  ok?: boolean
  hold?: string
  lattice_sync?: boolean
  seats?: Record<string, VoiceSeat>
  operatorSeat?: {
    id: string
    label: string
    default: "browser" | "lmnt"
    banner: string
    note: string
  }
  bans?: string[]
  reclaimPaths?: string[]
  notes?: string[]
  links?: Record<string, string>
  error?: string
  generatedAt?: string
}

type OperatorSeatChoice = "browser" | "lmnt"

type SpeechRec = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((ev: Event) => void) | null
  onerror: ((ev: Event) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

function badgeClass(b?: string) {
  switch (b) {
    case "LIVE":
    case "READY":
    case "BROWSER_LOCAL":
      return "border-emerald-500/50 text-emerald-300 bg-emerald-950/40"
    case "PARTIAL":
      return "border-cyan-500/50 text-cyan-300 bg-cyan-950/30"
    case "STUB":
    case "NOT_CFG":
      return "border-amber-500/50 text-amber-300 bg-amber-950/30"
    case "DOWN":
      return "border-red-500/50 text-red-300 bg-red-950/40"
    default:
      return "border-gray-600 text-gray-400"
  }
}

function pickFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null
  const femaleHints =
    /female|woman|samantha|karen|victoria|moira|fiona|tessa|veena|zira|susan|linda|hazel|martha|serena|allison|ava|emma|joanna|salli|kimberly|kendra|ivy|nicole|raveena|amy|olivia|google uk english female|google us english/i
  const scored = voices
    .filter((v) => /en(-|_|\b)/i.test(v.lang) || !v.lang)
    .map((v) => {
      let score = 0
      if (femaleHints.test(v.name)) score += 10
      if (/female/i.test(v.name)) score += 5
      if (/en-US/i.test(v.lang)) score += 2
      if (/en-GB/i.test(v.lang)) score += 1
      // Never prefer anything that looks like a brand clone label
      if (/grok|xai|elon/i.test(v.name)) score -= 100
      return { v, score }
    })
    .sort((a, b) => b.score - a.score)
  if (scored[0] && scored[0].score > 0) return scored[0].v
  return voices.find((v) => /en/i.test(v.lang)) || voices[0] || null
}

function getSpeechRecognitionCtor(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRec
    webkitSpeechRecognition?: new () => SpeechRec
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export default function VoiceBusPanel() {
  const [status, setStatus] = useState<VoiceStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [seatChoice, setSeatChoice] = useState<OperatorSeatChoice>("browser")
  const [speakText, setSpeakText] = useState(
    "Operator seat online. Hub Voice Bus Phase 3 scaffold. Not a Grok clone.",
  )
  const [transcript, setTranscript] = useState("")
  const [interim, setInterim] = useState("")
  const [listening, setListening] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const [ttsNote, setTtsNote] = useState<string | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("")
  const [browserSupport, setBrowserSupport] = useState({ stt: false, tts: false })
  const recRef = useRef<SpeechRec | null>(null)

  const refresh = useCallback(async () => {
    setBusy(true)
    try {
      const res = await fetch("/api/voice/status", { cache: "no-store" })
      const data = (await res.json()) as VoiceStatus
      setStatus(data)
      if (data.operatorSeat?.default) {
        setSeatChoice(data.operatorSeat.default)
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

  useEffect(() => {
    if (typeof window === "undefined") return
    const stt = Boolean(getSpeechRecognitionCtor())
    const tts = "speechSynthesis" in window
    setBrowserSupport({ stt, tts })

    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices()
      setVoices(list)
      const female = pickFemaleVoice(list)
      if (female && !selectedVoiceURI) {
        setSelectedVoiceURI(female.voiceURI)
      }
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const femaleVoices = useMemo(
    () =>
      voices.filter((v) =>
        /female|woman|samantha|karen|victoria|moira|fiona|tessa|zira|susan|ava|emma|joanna|amy|olivia/i.test(
          v.name,
        ),
      ),
    [voices],
  )

  const stopListening = useCallback(() => {
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    recRef.current = null
    setListening(false)
  }, [])

  const startListening = useCallback(() => {
    setMicError(null)
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setMicError("SpeechRecognition not available in this browser (Chrome/Edge recommended)")
      return
    }
    try {
      const rec = new Ctor()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = "en-US"
      rec.onresult = (ev: Event) => {
        const e = ev as unknown as {
          resultIndex: number
          results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
        }
        let finalChunk = ""
        let interimChunk = ""
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i]
          if (r.isFinal) finalChunk += r[0].transcript
          else interimChunk += r[0].transcript
        }
        if (finalChunk) {
          setTranscript((prev) => (prev ? `${prev} ${finalChunk}` : finalChunk).trim())
        }
        setInterim(interimChunk)
      }
      rec.onerror = (ev: Event) => {
        const err = (ev as unknown as { error?: string }).error || "recognition error"
        setMicError(err)
        setListening(false)
      }
      rec.onend = () => {
        setListening(false)
        setInterim("")
      }
      recRef.current = rec
      rec.start()
      setListening(true)
    } catch (e) {
      setMicError(e instanceof Error ? e.message : "mic start failed")
      setListening(false)
    }
  }, [])

  const speakBrowser = useCallback(() => {
    setTtsNote(null)
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setTtsNote("speechSynthesis not available")
      return
    }
    const text = speakText.trim()
    if (!text) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.95
    u.pitch = 1.05
    u.volume = 0.85
    const chosen =
      voices.find((v) => v.voiceURI === selectedVoiceURI) || pickFemaleVoice(voices)
    if (chosen) u.voice = chosen
    u.onend = () => setTtsNote(`BROWSER-LOCAL · spoke via ${chosen?.name || "default"}`)
    u.onerror = () => setTtsNote("browser TTS error")
    window.speechSynthesis.speak(u)
  }, [speakText, selectedVoiceURI, voices])

  const speakLmnt = useCallback(async () => {
    setTtsNote(null)
    const text = speakText.trim()
    if (!text) return
    try {
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "leah" }),
      })
      if (res.status === 503) {
        const j = (await res.json()) as { error?: string }
        setTtsNote(j.error || "LMNT STUB — key not configured")
        return
      }
      if (!res.ok) {
        setTtsNote(`LMNT HTTP ${res.status}`)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => URL.revokeObjectURL(url)
      await audio.play()
      setTtsNote("LMNT seat · audio played (text not logged server-side)")
    } catch (e) {
      setTtsNote(e instanceof Error ? e.message : "LMNT speak failed")
    }
  }, [speakText])

  const handleSpeak = useCallback(() => {
    if (seatChoice === "lmnt") void speakLmnt()
    else speakBrowser()
  }, [seatChoice, speakBrowser, speakLmnt])

  const seats = status?.seats
  const lmntReady = seats?.lmnt?.configured === true

  return (
    <div className="space-y-4">
      {/* Operator banner */}
      <div className="rounded-md border border-rose-500/40 bg-rose-950/30 px-4 py-3 flex flex-wrap items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-rose-300 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="font-mono text-sm text-rose-200 font-semibold">
            {status?.operatorSeat?.banner || "Operator-owned seat — not Grok clone"}
          </div>
          <p className="text-xs text-dark-600 font-mono">
            No Grok / xAI voice clone · no Vyrna lattice voice sync · HOLD_VYRNA_UNSYNC ·
            lattice_sync: false · Privacy Fortress: transcripts stay in-browser unless you
            explicitly call a configured seat
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

      {/* Seat cards */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {(["browser", "whisper", "lmnt", "nova"] as const).map((id) => {
          const s = seats?.[id]
          return (
            <TechPanel key={id} className="p-4 space-y-2 border-dark-300/50">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm text-dark-800">{s?.label || id}</span>
                <Badge variant="outline" className={`font-mono text-[10px] ${badgeClass(s?.badge)}`}>
                  {s?.badge || "…"}
                </Badge>
              </div>
              <div className="text-[10px] font-mono text-violet-300/80">{s?.role || "—"}</div>
              <p className="text-xs text-dark-600 font-mono leading-relaxed">
                {s?.detail || "Loading…"}
              </p>
              {s?.note && (
                <p className="text-[10px] text-dark-500 font-mono border-t border-dark-300/30 pt-2">
                  {s.note}
                </p>
              )}
              {id === "nova" && (status?.reclaimPaths?.length || 0) > 0 && (
                <ul className="text-[10px] font-mono text-cyan-400/70 space-y-0.5 max-h-24 overflow-auto">
                  {status!.reclaimPaths!.slice(0, 6).map((p) => (
                    <li key={p} className="truncate" title={p}>
                      {p.replace(/^\/workspace\//, "…/")}
                    </li>
                  ))}
                </ul>
              )}
            </TechPanel>
          )
        })}
      </div>

      {/* Female Operator seat selector */}
      <TechPanel className="p-4 space-y-3 border-violet-500/30">
        <div className="flex flex-wrap items-center gap-2">
          <Radio className="h-4 w-4 text-violet-300" />
          <span className="font-mono text-sm text-violet-200">
            Female Operator TTS seat
          </span>
          <Badge variant="outline" className="font-mono text-[10px] border-violet-500/40 text-violet-300">
            Operator-owned
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={seatChoice === "browser" ? "default" : "outline"}
            className="h-8 text-xs font-mono"
            onClick={() => setSeatChoice("browser")}
          >
            Browser female voice
          </Button>
          <Button
            size="sm"
            variant={seatChoice === "lmnt" ? "default" : "outline"}
            className="h-8 text-xs font-mono"
            onClick={() => setSeatChoice("lmnt")}
            disabled={!lmntReady}
            title={lmntReady ? "LMNT configured" : "LMNT_API_KEY not configured"}
          >
            LMNT {lmntReady ? "(READY)" : "(NOT CFG)"}
          </Button>
        </div>
        {seatChoice === "browser" && (
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-dark-500">Browser voice</label>
            <select
              className="w-full max-w-md bg-black/60 border border-dark-300/50 rounded px-2 py-1.5 text-xs font-mono text-dark-800"
              value={selectedVoiceURI}
              onChange={(e) => setSelectedVoiceURI(e.target.value)}
            >
              {voices.length === 0 && <option value="">(voices loading…)</option>}
              {(femaleVoices.length ? femaleVoices : voices).map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} · {v.lang}
                  {femaleVoices.includes(v) ? " · ♀" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
        <Textarea
          value={speakText}
          onChange={(e) => setSpeakText(e.target.value)}
          rows={3}
          className="bg-black/60 border-dark-300/50 font-mono text-sm"
          placeholder="Text to speak…"
        />
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            size="sm"
            className="h-8 text-xs font-mono bg-violet-900/60 hover:bg-violet-800/70 border border-violet-600/40"
            onClick={handleSpeak}
            disabled={!speakText.trim()}
          >
            <Volume2 className="mr-1 h-3.5 w-3.5" />
            Speak ({seatChoice === "lmnt" ? "LMNT" : "BROWSER-LOCAL"})
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-mono border-gray-600 bg-transparent"
            onClick={() => {
              if (typeof window !== "undefined") window.speechSynthesis?.cancel()
              setTtsNote(null)
            }}
          >
            Stop
          </Button>
          {ttsNote && (
            <span className="text-[10px] font-mono text-emerald-300/80">{ttsNote}</span>
          )}
        </div>
      </TechPanel>

      {/* Mic → transcript demo */}
      <TechPanel className="p-4 space-y-3 border-cyan-500/30">
        <div className="flex flex-wrap items-center gap-2">
          <Mic className="h-4 w-4 text-cyan-300" />
          <span className="font-mono text-sm text-cyan-200">Browser mic → transcript</span>
          <Badge
            variant="outline"
            className={`font-mono text-[10px] ${badgeClass("BROWSER_LOCAL")}`}
          >
            BROWSER-LOCAL
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px] border-gray-600 text-gray-400">
            STT {browserSupport.stt ? "API ok" : "unavailable"}
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px] border-gray-600 text-gray-400">
            TTS {browserSupport.tts ? "API ok" : "unavailable"}
          </Badge>
        </div>
        <p className="text-[10px] font-mono text-dark-500">
          Transcript stays in this tab — not posted to the server. Whisper seat is separate
          (local probe only).
        </p>
        <div className="flex flex-wrap gap-2">
          {!listening ? (
            <Button
              size="sm"
              className="h-8 text-xs font-mono bg-cyan-900/50 hover:bg-cyan-800/60 border border-cyan-600/40"
              onClick={startListening}
            >
              <Mic className="mr-1 h-3.5 w-3.5" />
              Enable mic / listen
            </Button>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              className="h-8 text-xs font-mono"
              onClick={stopListening}
            >
              <MicOff className="mr-1 h-3.5 w-3.5" />
              Stop listening
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-mono border-gray-600 bg-transparent"
            onClick={() => {
              setTranscript("")
              setInterim("")
              setMicError(null)
            }}
          >
            Clear transcript
          </Button>
        </div>
        {micError && (
          <div className="text-xs font-mono text-red-300 border border-red-800/50 rounded px-2 py-1.5 bg-red-950/30">
            {micError}
          </div>
        )}
        <div className="min-h-[88px] rounded border border-dark-300/40 bg-black/50 p-3 font-mono text-sm text-dark-800">
          {transcript || (
            <span className="text-dark-500">
              {listening ? "Listening…" : "Transcript appears here (client-only)."}
            </span>
          )}
          {interim && (
            <span className="text-cyan-400/70 italic"> {interim}</span>
          )}
        </div>
      </TechPanel>

      {/* Links + bans */}
      <div className="grid gap-3 md:grid-cols-2">
        <TechPanel className="p-4 space-y-2">
          <div className="font-mono text-xs text-dark-500 uppercase tracking-wide">Related hubs</div>
          <div className="flex flex-wrap gap-2">
            <Link href="/music">
              <Button size="sm" variant="outline" className="h-7 text-xs font-mono border-gray-600 bg-transparent">
                <Music2 className="mr-1 h-3 w-3" /> /music
              </Button>
            </Link>
            <Link href="/soundcheck">
              <Button size="sm" variant="outline" className="h-7 text-xs font-mono border-gray-600 bg-transparent">
                <AudioLines className="mr-1 h-3 w-3" /> /soundcheck
              </Button>
            </Link>
            <Link href="/triadic">
              <Button size="sm" variant="outline" className="h-7 text-xs font-mono border-gray-600 bg-transparent">
                <Cpu className="mr-1 h-3 w-3" /> /triadic
              </Button>
            </Link>
            <Link href="/signalframe">
              <Button size="sm" variant="outline" className="h-7 text-xs font-mono border-gray-600 bg-transparent">
                <MessageSquare className="mr-1 h-3 w-3" /> /signalframe
              </Button>
            </Link>
            <Link href="/privacy">
              <Button size="sm" variant="outline" className="h-7 text-xs font-mono border-gray-600 bg-transparent">
                <EyeOff className="mr-1 h-3 w-3" /> /privacy
              </Button>
            </Link>
            <Link href="/handsfree">
              <Button size="sm" variant="outline" className="h-7 text-xs font-mono border-gray-600 bg-transparent">
                <Hand className="mr-1 h-3 w-3" /> /handsfree
              </Button>
            </Link>
          </div>
        </TechPanel>
        <TechPanel className="p-4 space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs text-dark-500 uppercase tracking-wide">
            <Shield className="h-3.5 w-3.5" /> Explicit bans
          </div>
          <ul className="text-[11px] font-mono text-dark-600 space-y-1">
            {(status?.bans || [
              "No Grok / xAI voice clone",
              "No Vyrna lattice voice sync claim",
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
            href="/api/voice/status"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400/80 hover:text-cyan-300"
          >
            GET /api/voice/status <ExternalLink className="h-3 w-3" />
          </a>
        </TechPanel>
      </div>
    </div>
  )
}
