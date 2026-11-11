"use client"

/**
 * Loads consciousness-bridge + CommandHubDev hub + WhisperMesh multi-tab bridge on /signalframe.
 * Glyph banners only; never logs message bodies.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false · LOCAL MULTI-TAB
 */
import { useEffect } from "react"

export function SignalFrameConsolePipe() {
  useEffect(() => {
    let cancelled = false
    let stopBridge: (() => void) | undefined
    ;(async () => {
      try {
        await import("@/lib/signalframe/consciousness-bridge")
        if (cancelled) return
        const hub = await import("@/lib/command-hub/dev-console-hub")
        if (cancelled) return
        hub.bindDevConsoleHub()
        console.log("⟐ SignalFrame console pipe ready · CommandHubDev.help()")

        // ADD-ONLY: multi-tab BroadcastChannel + SSE bridge
        const bridge = await import("@/lib/signalframe/whisper-bridge-client")
        if (cancelled) return
        const status = bridge.startWhisperBridge({ sse: true, channel: "whisper" })
        stopBridge = () => bridge.stopWhisperBridge()
        console.log(
          "⟐ whisper-bridge · LOCAL MULTI-TAB · transport=" +
            status.transport +
            " · lattice_sync: false · try window.signalframe.bridge.status()",
        )
      } catch (err) {
        console.warn("⟐ SignalFrame console pipe load failed (non-fatal)", err)
      }
    })()
    return () => {
      cancelled = true
      try {
        stopBridge?.()
      } catch {
        /* ignore */
      }
    }
  }, [])

  return null
}
