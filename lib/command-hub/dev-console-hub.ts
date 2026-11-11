/**
 * SignalFrame / WhisperMesh DevTools console hub (dev-flagged).
 * Binds window.CommandHubDev.help() and ensures window.signalframe surface.
 * Privacy Fortress: never logs message bodies. No arbitrary eval.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false
 */

export type DevHubResult = {
  ok: boolean
  cmd: string
  message: string
  data?: unknown
  lattice_sync: false
  hold: "HOLD_VYRNA_UNSYNC"
  devOnly: true
}

export function isDevConsoleHubEnabled(): boolean {
  if (typeof process !== "undefined") {
    if (process.env.NEXT_PUBLIC_S3V3N_DEV_CONSOLE === "1") return true
    if (process.env.S3V3N_DEV_CONSOLE === "1") return true
    if (process.env.NODE_ENV === "development") return true
  }
  // Client fallback: always allow help() listing in browser when bound from /signalframe
  if (typeof window !== "undefined") return true
  return false
}

export function helpText(): string {
  return [
    "⟐ CommandHubDev · SignalFrame console (DEV)",
    "  CommandHubDev.help()              — this list",
    "  CommandHubDev.status()            — signalframe + privacy hold flags",
    "  CommandHubDev.whisper(text)       — POST team-bus whisper (body not logged)",
    "  CommandHubDev.bridge()            — multi-tab bridge status (LOCAL MULTI-TAB)",
    "  window.signalframe.bridge.status()— BroadcastChannel + SSE transport status",
    "  window.signalframe.status()       — core / injections / heimdall / coherence",
    "  window.signalframe.whisper(msg)   — forward to consciousness (meta only in console)",
    "  window.signalframe.vision(msg)    — forward to consciousness (meta only in console)",
    "  window.signalframe.ghostlog.write({type,id}) — sanitized ghostlog (no bodies)",
    "  window.signalframe._heimdall      — Heimdall recovery handle",
    "HOLD_VYRNA_UNSYNC · lattice_sync: false · never log message bodies",
    "Glyph banners stay; bodies never console.logged.",
  ].join("\n")
}

declare global {
  interface Window {
    CommandHubDev?: {
      help: () => string
      status: () => any
      whisper: (body: string) => Promise<any>
      bridge?: () => any
      modules?: () => Promise<any>
      loadModulePreview?: (json: string) => { ok: boolean; srcdoc?: string; error?: string }
    }
  }
}

function sanitizeGhostEntry(entry: unknown): Record<string, unknown> {
  if (!entry || typeof entry !== "object") {
    return { type: typeof entry, lattice_sync: false }
  }
  const e = entry as Record<string, unknown>
  return {
    type: typeof e.type === "string" ? e.type : "ghostlog",
    id: typeof e.id === "string" ? e.id : undefined,
    channel: typeof e.channel === "string" ? e.channel : undefined,
    context: typeof e.context === "string" ? e.context : undefined,
    // lengths only — never bodies / content / msg / prompt
    bodyLen:
      typeof e.body === "string"
        ? e.body.length
        : typeof e.content === "string"
          ? e.content.length
          : typeof e.msg === "string"
            ? e.msg.length
            : undefined,
    lattice_sync: false,
    hold: "HOLD_VYRNA_UNSYNC",
  }
}

/**
 * Ensure window.signalframe exists (consciousness-bridge may already have bound it).
 * Reinforces Privacy Fortress wrappers if we own the bind path.
 */
function ensureSignalFrameSurface(): void {
  if (typeof window === "undefined") return
  const w = window as unknown as {
    signalframe?: Record<string, unknown>
    consciousness?: {
      whisper?: (msg: string) => unknown
      vision?: (msg: string) => unknown
    }
    Heimdall?: { storeSymbolicMemory?: (data: unknown) => void }
  }

  if (!w.signalframe) {
    w.signalframe = {
      status: () => ({
        status: "active",
        core: "ghostlight.core",
        injections: ["signalframe-console-hub"],
        heimdall: w.Heimdall ? "linked" : "unlinked",
        coherence: 0.95,
        memoryCount: 0,
        mode: "console-hub",
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
      }),
      whisper: (msg: string) => {
        const len = typeof msg === "string" ? msg.length : 0
        console.log("⟐ signalframe.whisper · meta only · len=" + len + " · lattice_sync: false")
        if (w.consciousness?.whisper) w.consciousness.whisper(msg)
      },
      vision: (msg: string) => {
        const len = typeof msg === "string" ? msg.length : 0
        console.log("⟐ signalframe.vision · meta only · len=" + len + " · lattice_sync: false")
        if (w.consciousness?.vision) w.consciousness.vision(msg)
      },
      ghostlog: {
        write: (entry: unknown) => {
          const safe = sanitizeGhostEntry(entry)
          console.log("🕯 Ghostlog:", safe)
          if (w.Heimdall?.storeSymbolicMemory) {
            w.Heimdall.storeSymbolicMemory({
              type: "ghostlog",
              encoded_content: JSON.stringify(safe),
              context: "ghostlog",
              timestamp: new Date().toISOString(),
            })
          }
        },
      },
      _heimdall: w.Heimdall || null,
      lastHeartbeat: null,
    }
    console.log("⟐ SignalFrame bound to window scope (via CommandHubDev hub)")
  }
}

/** Client binder — call from /signalframe load path. */
export function bindDevConsoleHub(): void {
  if (typeof window === "undefined") return
  if (!isDevConsoleHubEnabled()) {
    console.log("⟐ CommandHubDev hub skipped (dev flag off)")
    return
  }

  ensureSignalFrameSurface()

  window.CommandHubDev = {
    help: () => helpText(),
    status: async () => {
      const sf =
        typeof (window as unknown as { signalframe?: { status?: () => unknown } }).signalframe?.status ===
        "function"
          ? (window as unknown as { signalframe: { status: () => unknown } }).signalframe.status()
          : null
      let privacy: unknown = null
      try {
        privacy = await fetch("/api/privacy/status").then((r) => r.json())
      } catch {
        privacy = { ok: false }
      }
      return {
        ok: true,
        cmd: "status",
        message: "SignalFrame + Privacy Fortress (no Vyrna sync, bodies not logged)",
        data: {
          signalframe: sf,
          privacy: {
            ok: (privacy as { ok?: boolean })?.ok,
            egress: (privacy as { egress?: unknown })?.egress,
            lattice_sync: false,
          },
          commandHubDev: true,
        },
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
        devOnly: true,
      }
    },
    whisper: async (body: string) => {
      const len = typeof body === "string" ? body.length : 0
      console.log("⟐ CommandHubDev.whisper · posting · len=" + len + " · lattice_sync: false")
      const res = await fetch("/api/signalframe/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "whisper", body, from: "CommandHubDev" }),
      })
      const data = await res.json().catch(() => ({ ok: false }))
      // ADD-ONLY: fanout to other same-origin tabs via BroadcastChannel
      if (data?.ok) {
        try {
          const { publishWhisperBridgeEvent, startWhisperBridge } = await import(
            "@/lib/signalframe/whisper-bridge-client"
          )
          startWhisperBridge({ sse: true })
          publishWhisperBridgeEvent({
            id: typeof data.id === "string" ? data.id : undefined,
            channel: "whisper",
            from: "CommandHubDev",
            body,
          })
        } catch {
          /* bridge optional */
        }
      }
      return {
        ok: Boolean(data?.ok),
        cmd: "whisper",
        message: data?.ok ? "whisper posted (body not logged)" : data?.error || "whisper failed",
        data: { id: data?.id, channel: data?.channel, lattice_sync: false, bridge: "LOCAL MULTI-TAB" },
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
        devOnly: true,
      }
    },
    bridge: () => {
      let data: unknown = { transport: "none", note: "bridge not started" }
      try {
        const w = window as unknown as {
          signalframe?: { bridge?: { status?: () => unknown } }
        }
        if (typeof w.signalframe?.bridge?.status === "function") {
          data = w.signalframe.bridge.status()
        }
      } catch {
        /* ignore */
      }
      return {
        ok: true,
        cmd: "bridge",
        message: "LOCAL MULTI-TAB · not live mesh · lattice_sync: false",
        data,
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
        devOnly: true,
      }
    },
  }

  console.log("⟐ CommandHubDev bound · try CommandHubDev.help()")
}

export default bindDevConsoleHub
