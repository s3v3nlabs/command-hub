/**
 * Hub Voice Bus Phase 3 — status aggregate (ADD-ONLY).
 * HOLD_VYRNA_UNSYNC · lattice_sync: false · no secrets · no Grok voice clone.
 * Never log transcripts / prompt bodies. Env key presence only (boolean).
 */

import fs from "fs"

export const HOLD = "HOLD_VYRNA_UNSYNC" as const

export type SeatBadge =
  | "BROWSER_LOCAL"
  | "PARTIAL"
  | "LIVE"
  | "STUB"
  | "NOT_CFG"
  | "DOWN"
  | "READY"

export type VoiceSeatId = "browser" | "whisper" | "lmnt" | "nova"

export type VoiceSeat = {
  id: VoiceSeatId
  label: string
  badge: SeatBadge
  role: "STT" | "TTS" | "STT+TTS" | "TTS_IP"
  detail: string
  configured: boolean
  paths?: string[]
  note?: string
}

export type VoiceStatus = {
  ok: boolean
  service: "voice"
  hold: typeof HOLD
  lattice_sync: false
  seats: Record<VoiceSeatId, VoiceSeat>
  operatorSeat: {
    id: "female-operator-tts"
    label: string
    default: "browser" | "lmnt"
    banner: string
    note: string
  }
  bans: string[]
  links: Record<string, string>
  reclaimPaths: string[]
  notes: string[]
  generatedAt: string
}

/** Only probe when Operator sets WHISPER_LOCAL_URL (avoids false PARTIAL on unrelated :8080 services). */
const WHISPER_EXPLICIT = process.env.WHISPER_LOCAL_URL?.trim() || ""

const NOVA_RECLAIM_PATHS = [
  "/workspace/singular-ty-engines/engines/nova_prime",
  "/workspace/singular-ty-engines/personas/nova_prime.yaml",
  "/workspace/singular-ty-engines/prompts/nova_prime.system.md",
  "/workspace/singular-ty-engines/run_nova_prime.py",
  "/workspace/singular-ty-engines/docs/SHADOWVOX_NOVA_DEEP_MINE_2026-09-22.md",
  "/workspace/singular-ty-engines/personas/shadowvox.yaml",
  "/workspace/deliverables/heimdall-learn-upload/FREQUENCY_TECH.md",
]

function hasLmntKey(): boolean {
  const v = process.env.LMNT_API_KEY?.trim()
  return Boolean(v && v.length > 0)
}

function existingPaths(paths: string[]): string[] {
  return paths.filter((p) => {
    try {
      return fs.existsSync(p)
    } catch {
      return false
    }
  })
}

async function probeLocalWhisper(
  timeoutMs = 1200,
): Promise<{ badge: SeatBadge; detail: string; configured: boolean; endpoint?: string }> {
  // Never call paid OpenAI overnight even if OPENAI_API_KEY is present.
  // Do not blind-probe :8080 — unrelated tunnel/HTML services caused false PARTIAL.
  const explicit = WHISPER_EXPLICIT
  if (!explicit) {
    const whisperBin =
      fs.existsSync("/usr/local/bin/whisper") ||
      fs.existsSync("/usr/bin/whisper") ||
      fs.existsSync("/usr/local/bin/whisper-cpp") ||
      fs.existsSync("/usr/local/bin/whisper.cpp")
    return {
      badge: "NOT_CFG",
      configured: false,
      detail: whisperBin
        ? "whisper binary present but WHISPER_LOCAL_URL unset · no auto-probe of bare :8080"
        : "No WHISPER_LOCAL_URL · no local whisper.cpp endpoint · paid OpenAI STT blocked overnight",
    }
  }

  let hostOk = false
  try {
    const u = new URL(explicit)
    hostOk =
      u.hostname === "127.0.0.1" ||
      u.hostname === "localhost" ||
      u.hostname === "::1"
  } catch {
    return {
      badge: "NOT_CFG",
      configured: false,
      detail: "WHISPER_LOCAL_URL is not a valid URL",
    }
  }
  if (!hostOk) {
    return {
      badge: "NOT_CFG",
      configured: false,
      detail: "WHISPER_LOCAL_URL must be localhost / 127.0.0.1 overnight (no remote STT)",
    }
  }

  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(explicit, { method: "GET", signal: ctrl.signal })
    clearTimeout(t)
    const ctype = (res.headers.get("content-type") || "").toLowerCase()
    // Reject generic HTML landers (tunnel dashboards, etc.)
    if (ctype.includes("text/html")) {
      return {
        badge: "NOT_CFG",
        configured: true,
        endpoint: explicit.replace(/\/$/, ""),
        detail: `WHISPER_LOCAL_URL returned HTML (not an STT API) · HTTP ${res.status}`,
      }
    }
    if (res.status < 500) {
      return {
        badge: "PARTIAL",
        configured: true,
        endpoint: explicit.replace(/\/$/, ""),
        detail: `Local Whisper probe HTTP ${res.status} · ${explicit.split("?")[0]} (no paid OpenAI)`,
      }
    }
    return {
      badge: "DOWN",
      configured: true,
      detail: `WHISPER_LOCAL_URL HTTP ${res.status}`,
    }
  } catch {
    clearTimeout(t)
    return {
      badge: "DOWN",
      configured: true,
      detail: `WHISPER_LOCAL_URL unreachable · ${explicit.split("?")[0]}`,
    }
  }
}

export async function getVoiceStatus(): Promise<VoiceStatus> {
  const lmntConfigured = hasLmntKey()
  const whisper = await probeLocalWhisper()
  const novaFound = existingPaths(NOVA_RECLAIM_PATHS)

  const seats: Record<VoiceSeatId, VoiceSeat> = {
    browser: {
      id: "browser",
      label: "Browser Web Speech",
      badge: "BROWSER_LOCAL",
      role: "STT+TTS",
      configured: true,
      detail:
        "SpeechRecognition + speechSynthesis — in-browser only · prefer female voice when available",
      note: "LIVE/PARTIAL only inside the Operator browser — server cannot claim mic/TTS",
    },
    whisper: {
      id: "whisper",
      label: "Whisper STT",
      badge: whisper.badge,
      role: "STT",
      configured: whisper.configured,
      detail: whisper.detail,
      note: "Local whisper.cpp / openai-compatible localhost only · no paid OpenAI overnight · no large model download (15Gi box)",
    },
    lmnt: {
      id: "lmnt",
      label: "LMNT TTS",
      badge: lmntConfigured ? "READY" : "NOT_CFG",
      role: "TTS",
      configured: lmntConfigured,
      detail: lmntConfigured
        ? "LMNT_API_KEY present · POST /api/voice/tts enabled (key never printed)"
        : "LMNT_API_KEY absent · POST /api/voice/tts → 503 STUB",
      note: "Env presence check only — never echo key",
    },
    nova: {
      id: "nova",
      label: "Nova Prime / Singularity IP TTS",
      badge: "STUB",
      role: "TTS_IP",
      configured: false,
      detail: "Operator IP reclaim seat — no fake synthesis overnight",
      paths: novaFound,
      note: "Point at vault/engine docs only · no audio invented",
    },
  }

  return {
    ok: true,
    service: "voice",
    hold: HOLD,
    lattice_sync: false,
    seats,
    operatorSeat: {
      id: "female-operator-tts",
      label: "Female Operator TTS seat",
      default: lmntConfigured ? "lmnt" : "browser",
      banner: "Operator-owned seat — not Grok clone",
      note: "Defaults to browser female voice; switches to LMNT when LMNT_API_KEY configured",
    },
    bans: [
      "No Grok / xAI voice clone or imitation",
      "No Vyrna lattice voice sync claim",
      "No Venice burns overnight",
      "No large STT model download without RAM check",
      "No server-side plaintext transcript logging",
    ],
    links: {
      voice: "/voice",
      music: "/music",
      soundcheck: "/soundcheck",
      triadic: "/triadic",
      signalframe: "/signalframe",
      privacy: "/privacy",
    },
    reclaimPaths: novaFound,
    notes: [
      "HOLD_VYRNA_UNSYNC · lattice_sync: false",
      "Browser seat is BROWSER-LOCAL — mic/TTS demos run client-side only",
      "Whisper/LMNT/Nova honesty badges — never fake LIVE audio",
      "Female Operator TTS = Operator-owned seat — not a Grok clone",
    ],
    generatedAt: new Date().toISOString(),
  }
}
