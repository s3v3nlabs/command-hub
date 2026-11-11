"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import HandsFreePanel from "@/components/handsfree/HandsFreePanel"
import { Hand } from "lucide-react"

/**
 * Hub Hands-free Phase 4 — browser nav + cross-AI multiplex.
 * ADD-ONLY · HOLD_VYRNA_UNSYNC · lattice_sync: false
 * No Grok voice clone · no Venice API burns · honest seat badges.
 */
export default function HandsFreePage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="HANDS-FREE — NAV + CROSS-AI MULTIPLEX PHASE 4" />
        <div className="hub-wireframe flex flex-wrap items-center gap-2 border-b border-dark-300/40 bg-black/80 px-6 py-2 mx-0 rounded-none">
          <Badge variant="outline" className="font-mono text-xs border-violet-500/40 text-violet-300">
            <Hand className="mr-1 inline h-3 w-3" />
            /handsfree
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-emerald-500/40 text-emerald-300">
            BROWSER-LOCAL
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-cyan-500/40 text-cyan-300">
            MULTIPLEX
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">
            HOLD_VYRNA_UNSYNC
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-rose-500/40 text-rose-300">
            lattice_sync: false
          </Badge>
          <span className="text-xs text-dark-600 font-mono">
            Speech nav client-only · local seats only · Venice = STUB/link · no Grok clone
          </span>
        </div>
        <main className="hub-shell-scroll flex-1 overflow-auto p-4 md:p-6 grid-bg">
          <HandsFreePanel />
        </main>
      </div>
    </div>
  )
}
