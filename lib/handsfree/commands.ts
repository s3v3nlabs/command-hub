/**
 * Hands-free browser speech → hub route map (CLIENT-ONLY).
 * Phase 4 · HOLD_VYRNA_UNSYNC · lattice_sync: false
 */

export type HandsFreeCommand = {
  id: string
  phrases: string[]
  href: string
  label: string
}

/** Canonical cheat-sheet + matcher phrases (lowercase). */
export const HANDSFREE_COMMANDS: HandsFreeCommand[] = [
  {
    id: "reclaim",
    phrases: ["open reclaim", "go to reclaim", "open heimdall", "open heimdallr"],
    href: "/reclaim",
    label: "Reclaim / Heimdallr",
  },
  {
    id: "venice",
    phrases: ["open venice", "go to venice"],
    href: "/venice",
    label: "Venice",
  },
  {
    id: "music",
    phrases: ["open music", "go to music", "open music hub"],
    href: "/music",
    label: "Music Hub",
  },
  {
    id: "triadic",
    phrases: ["open triadic", "go to triadic", "open local ai"],
    href: "/triadic",
    label: "Triadic Local AI",
  },
  {
    id: "signalframe",
    phrases: ["open signalframe", "go to signalframe", "open signal frame", "open whisper"],
    href: "/signalframe",
    label: "SignalFrame",
  },
  {
    id: "voice",
    phrases: ["open voice", "go to voice", "open voice bus"],
    href: "/voice",
    label: "Voice Bus",
  },
  {
    id: "privacy",
    phrases: ["open privacy", "go to privacy", "open privacy fortress"],
    href: "/privacy",
    label: "Privacy Fortress",
  },
  {
    id: "mesh",
    phrases: ["open mesh", "go to mesh"],
    href: "/mesh",
    label: "Mesh",
  },
  {
    id: "soundcheck",
    phrases: ["open soundcheck", "go to soundcheck", "open sound check"],
    href: "/soundcheck",
    label: "SoundCheck",
  },
  {
    id: "twin",
    phrases: ["open twin", "go to twin", "open operator twin"],
    href: "/operator-twin",
    label: "Operator Twin",
  },
  {
    id: "command-hub",
    phrases: ["open command hub", "go to command hub", "open hub"],
    href: "/command-hub",
    label: "Command Hub",
  },
  {
    id: "handsfree",
    phrases: ["open handsfree", "open hands free", "go to handsfree"],
    href: "/handsfree",
    label: "Hands-free (self)",
  },
]

/** Normalize spoken text for matching. */
export function normalizeSpeech(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Match a final transcript chunk to a nav command.
 * Prefers longest phrase match; returns null if none.
 */
export function matchHandsFreeCommand(raw: string): HandsFreeCommand | null {
  const text = normalizeSpeech(raw)
  if (!text) return null
  let best: HandsFreeCommand | null = null
  let bestLen = 0
  for (const cmd of HANDSFREE_COMMANDS) {
    for (const phrase of cmd.phrases) {
      if (text.includes(phrase) && phrase.length > bestLen) {
        best = cmd
        bestLen = phrase.length
      }
    }
  }
  return best
}

export const COMMAND_CHEATSHEET = HANDSFREE_COMMANDS.map((c) => ({
  say: c.phrases[0],
  href: c.href,
  label: c.label,
}))
