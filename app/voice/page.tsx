"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import VoiceBusPanel from "@/components/voice/VoiceBusPanel"
import { Mic } from "lucide-react"

/**
 * Hub Voice Bus Phase 3 — STT/TTS scaffold.
 * ADD-ONLY · HOLD_VYRNA_UNSYNC · lattice_sync: false
 * No Grok voice clone · no Venice burns · honest seat badges.
 */
export default function VoiceBusPage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="VOICE BUS — STT / TTS PHASE 3" />
        <div className="hub-wireframe flex flex-wrap items-center gap-2 border-b border-dark-300/40 bg-black/80 px-6 py-2 mx-0 rounded-none">
          <Badge variant="outline" className="font-mono text-xs border-violet-500/40 text-violet-300">
            <Mic className="mr-1 inline h-3 w-3" />
            /voice
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-emerald-500/40 text-emerald-300">
            BROWSER-LOCAL
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-amber-500/50 text-amber-300">
            WHISPER/LMNT/NOVA STUB
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">
            HOLD_VYRNA_UNSYNC
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-rose-500/40 text-rose-300">
            lattice_sync: false
          </Badge>
          <span className="text-xs text-dark-600 font-mono">
            Operator-owned female TTS seat · not a Grok clone · no lattice voice sync
          </span>
        </div>
        <main className="hub-shell-scroll flex-1 overflow-auto p-4 md:p-6 grid-bg">
          <VoiceBusPanel />
        </main>
      </div>
    </div>
  )
}
