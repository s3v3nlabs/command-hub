/**
 * Hands-free + cross-AI multiplex status (ADD-ONLY).
 * HOLD_VYRNA_UNSYNC · lattice_sync: false · no secrets · no Venice API burns.
 * Honesty: DOWN/STUB/NOT_CFG — never invent LIVE seats.
 */

import fs from "fs"
import { probeOllama, OLLAMA_BASE } from "@/lib/ai/ops-router"
import { getTwinStatus } from "@/lib/ai/operator-twin"
import { COMMAND_CHEATSHEET } from "@/lib/handsfree/commands"

export const HOLD = "HOLD_VYRNA_UNSYNC" as const

export type SeatBadge =
  | "BROWSER_LOCAL"
  | "LIVE"
  | "PARTIAL"
  | "STUB"
  | "NOT_CFG"
  | "DOWN"
  | "READY"

export type MultiplexSeatId = "twin" | "axios" | "ollama" | "ghostlight" | "venice"

export type MultiplexSeat = {
  id: MultiplexSeatId
  label: string
  badge: SeatBadge
  role: string
  detail: string
  api: string
  liveCapable: boolean
  href?: string
}

export type HandsFreeStatus = {
  ok: boolean
  service: "handsfree"
  hold: typeof HOLD
  lattice_sync: false
  nav: {
    mode: "BROWSER_LOCAL"
    badge: "BROWSER_LOCAL"
    detail: string
    commands: typeof COMMAND_CHEATSHEET
  }
  seats: Record<MultiplexSeatId, MultiplexSeat>
  bans: string[]
  links: Record<string, string>
  notes: string[]
  generatedAt: string
}

const AXIOS_MARKERS = [
  "/workspace/singular-ty-engines/run_axios.py",
  "/workspace/singular-ty-engines/personas/axios.yaml",
  "/workspace/singular-ty-engines/prompts/axios.system.md",
]

const GHOSTLIGHT_DB = "/workspace/chatgpt-vault/index/vault.sqlite3"

function exists(p: string): boolean {
  try {
    return fs.existsSync(p)
  } catch {
    return false
  }
}

export async function getHandsFreeStatus(): Promise<HandsFreeStatus> {
  const twin = getTwinStatus()
  const ollama = await probeOllama(1500)
  const axiosReady = AXIOS_MARKERS.filter(exists).length >= 2
  const ghostOk = exists(GHOSTLIGHT_DB)

  const seats: Record<MultiplexSeatId, MultiplexSeat> = {
    twin: {
      id: "twin",
      label: "Operator Twin (local RAG)",
      badge: twin.indexed ? "LIVE" : twin.ok === false ? "DOWN" : "PARTIAL",
      role: "local-rag",
      detail: twin.indexed
        ? `Indexed · POST /api/ai/twin · chunks=${twin.meta?.chunks ?? "n/a"}`
        : "Twin index not built — POST refresh or query will build on demand",
      api: "POST /api/ai/twin",
      liveCapable: Boolean(twin.indexed),
      href: "/operator-twin",
    },
    axios: {
      id: "axios",
      label: "AXIOS local (Eye of Truth)",
      badge: axiosReady ? "LIVE" : "DOWN",
      role: "local-engine",
      detail: axiosReady
        ? "run_axios.py + persona present · via /api/s3v3n-panel preferSeat=axios (includeOwnedCloud:false)"
        : "Axios engine files missing under singular-ty-engines",
      api: "POST /api/s3v3n-panel { preferSeat: axios }",
      liveCapable: axiosReady,
      href: "/reclaim",
    },
    ollama: {
      id: "ollama",
      label: "Ollama (localhost)",
      badge: ollama.online ? "LIVE" : "DOWN",
      role: "local-llm",
      detail: ollama.online
        ? `Online @ ${OLLAMA_BASE} · tags=${(ollama.tags || []).slice(0, 4).join(",") || "n/a"}`
        : `DOWN @ ${OLLAMA_BASE} · ${ollama.detail || "offline"} · POST /api/triadic/ollama-chat will 503`,
      api: "POST /api/triadic/ollama-chat",
      liveCapable: ollama.online,
      href: "/triadic",
    },
    ghostlight: {
      id: "ghostlight",
      label: "Ghostlight vault search",
      badge: ghostOk ? "LIVE" : "DOWN",
      role: "fts-read",
      detail: ghostOk
        ? "vault.sqlite3 present · GET/POST /api/ghostlight/search (titles/snippets only)"
        : "vault.sqlite3 missing — search will fail honestly",
      api: "GET|POST /api/ghostlight/search",
      liveCapable: ghostOk,
      href: "/signalframe",
    },
    venice: {
      id: "venice",
      label: "Venice cloud",
      badge: "STUB",
      role: "cloud-link",
      detail:
        "STUB on hands-free multiplex · do not call api.venice.ai · open /venice for Operator-owned chat",
      api: "none (link only)",
      liveCapable: false,
      href: "/venice",
    },
  }

  return {
    ok: true,
    service: "handsfree",
    hold: HOLD,
    lattice_sync: false,
    nav: {
      mode: "BROWSER_LOCAL",
      badge: "BROWSER_LOCAL",
      detail:
        "Browser SpeechRecognition → hub routes · no wake-word model · transcripts stay in-tab",
      commands: COMMAND_CHEATSHEET,
    },
    seats,
    bans: [
      "No Grok / xAI voice clone",
      "No Vyrna lattice voice sync claim (lattice_sync: false)",
      "No Venice API burns from /handsfree (cloud seat = STUB/link)",
      "No wake-word model downloads overnight",
      "Never log full prompt bodies to server logs",
      "No off-box people messaging",
    ],
    links: {
      voice: "/voice",
      triadic: "/triadic",
      signalframe: "/signalframe",
      venice: "/venice",
      music: "/music",
      privacy: "/privacy",
      reclaim: "/reclaim",
      mesh: "/mesh",
      status: "/api/handsfree/status",
    },
    notes: [
      "Nav is CLIENT-ONLY (BROWSER-LOCAL badge).",
      "Multiplex fans to selected local seats only; DOWN/STUB shown honestly — no fake completions.",
      "Optional listen toggle fills multiplex prompt from voice transcript.",
    ],
    generatedAt: new Date().toISOString(),
  }
}
