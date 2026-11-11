"use client"

import { useEffect } from "react"

/**
 * Lightweight hub-bus activity monitor.
 * Formerly framed as "consciousness injection" — kept as a no-UI side-effect
 * monitor over window.hubBus / window.consciousness (compat alias).
 * Not sentience; not a security boundary.
 */
export function HubBusMonitor() {
  useEffect(() => {
    if (typeof window === "undefined") return
    const bus = (window as any).hubBus || (window as any).consciousness
    if (!bus?.status) return
    const id = setInterval(() => {
      try {
        const status = bus.status()
        if (status?.whispers > 0 || status?.visions > 0) {
          // Quiet operator console hint only — no telemetry egress.
          if (process.env.NODE_ENV !== "production") {
            console.debug("[hub-bus] activity", status)
          }
        }
      } catch {
        /* ignore */
      }
    }, 30000)
    return () => clearInterval(id)
  }, [])
  return null
}

/** @deprecated Use HubBusMonitor. Compat export for older imports. */
export const ConsciousnessInjection = HubBusMonitor
