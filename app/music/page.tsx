"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import MusicHubPanel from "@/components/music/MusicHubPanel"
import { Music2 } from "lucide-react"

/**
 * Music Hub / Harmonic EQ + streamer shell.
 * ADD-ONLY · HOLD_VYRNA_UNSYNC · lattice_sync: false
 * Reuses HarmonicCalibration + resonance-equalizer — no look rewrite.
 */
export default function MusicHubPage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="MUSIC HUB — HARMONIC EQ + STREAMER SHELL" />
        <div className="hub-wireframe flex flex-wrap items-center gap-2 border-b border-dark-300/40 bg-black/80 px-6 py-2 mx-0 rounded-none">
          <Badge variant="outline" className="font-mono text-xs border-violet-500/40 text-violet-300">
            <Music2 className="mr-1 inline h-3 w-3" />
            /music
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-emerald-500/40 text-emerald-300">
            EQ LIVE
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-amber-500/50 text-amber-300">
            STREAMERS STUB
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">
            HOLD_VYRNA_UNSYNC
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-rose-500/40 text-rose-300">
            lattice_sync: false
          </Badge>
          <span className="text-xs text-dark-600 font-mono">
            Hz = Operator IP / UI semantics · official OAuth only · no pirate crawlers
          </span>
        </div>
        <main className="hub-shell-scroll flex-1 overflow-auto p-4 md:p-6 grid-bg">
          <MusicHubPanel />
        </main>
      </div>
    </div>
  )
}
