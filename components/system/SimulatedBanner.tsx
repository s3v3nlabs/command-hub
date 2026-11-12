"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { simulatedReason } from "@/lib/status/simulated-routes"

/** Honest label for routes that still show sample/simulated data. */
export function SimulatedBanner() {
  const pathname = usePathname()
  const [hidden, setHidden] = useState<string | null>(null)
  const reason = simulatedReason(pathname)
  if (!reason || hidden === pathname) return null
  return (
    <div
      role="status"
      data-testid="simulated-banner"
      className="fixed bottom-3 left-1/2 z-[60] flex max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-md border border-amber-500/50 bg-black/85 px-3 py-2 text-xs text-amber-300 shadow-lg backdrop-blur"
    >
      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-semibold tracking-wide">SIMULATED</span>
      <span>{reason}</span>
      <a href="https://github.com/s3v3nlabs/command-hub/blob/main/docs/MODULE_STATUS.md" target="_blank" rel="noreferrer" className="underline opacity-80 hover:opacity-100">
        status
      </a>
      <button type="button" aria-label="Dismiss" onClick={() => setHidden(pathname)} className="opacity-70 hover:opacity-100">
        ✕
      </button>
    </div>
  )
}
