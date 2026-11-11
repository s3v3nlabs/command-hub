/**
 * Music Hub status — ADD-ONLY aggregate.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false · no OAuth tokens · no external music API calls.
 */

export const HOLD = "HOLD_VYRNA_UNSYNC" as const

export type StreamerId = "spotify" | "youtubeMusic" | "tidal" | "soundcloud" | "youtubeEmbed"

export type StreamerState = "STUB" | "NOT_CONNECTED" | "LIVE"

export type MusicStatus = {
  ok: boolean
  service: "music"
  hold: typeof HOLD
  lattice_sync: false
  eq: {
    present: boolean
    harmonicCalibration: boolean
    resonanceEqualizer: boolean
  }
  streamers: Record<StreamerId, StreamerState>
  sigmaLane: {
    linked: boolean
    href: string
    carriersHz: number[]
    note: string
  }
  links: Record<string, string>
  notes: string[]
  generatedAt: string
}

export function getMusicStatus(): MusicStatus {
  return {
    ok: true,
    service: "music",
    hold: HOLD,
    lattice_sync: false,
    eq: {
      present: true,
      harmonicCalibration: true,
      resonanceEqualizer: true,
    },
    streamers: {
      spotify: "STUB",
      youtubeMusic: "STUB",
      tidal: "STUB",
      soundcloud: "STUB",
      youtubeEmbed: "STUB",
    },
    sigmaLane: {
      linked: true,
      href: "/dev-operator#sigma-lane",
      carriersHz: [109, 594, 963],
      note: "Engineering UI semantics / Operator IP — not medical claims",
    },
    links: {
      music: "/music",
      harmonicCalibration: "/harmonic-calibration",
      soundcheck: "/soundcheck",
      triadic: "/triadic",
      signalframe: "/signalframe",
      privacy: "/privacy",
      sigmaLane: "/dev-operator#sigma-lane",
      sigmaLaneDocs: "/docs/SIGMA_LANE.md",
    },
    notes: [
      "Official OAuth streamers only — cards are STUB / NOT CONNECTED overnight",
      "YouTube = embed/search placeholder only — no download crawler",
      "No OAuth tokens invented; no external music API calls",
      "Hz / binaural UI = Operator IP + engineering semantics only",
    ],
    generatedAt: new Date().toISOString(),
  }
}
