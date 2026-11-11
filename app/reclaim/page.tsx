"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import ReclaimPanel from "@/components/reclaim/ReclaimPanel"
import { Eye } from "lucide-react"

export default function ReclaimPage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="RECLAIM — EYE OF TRUTH / HEIMDALLR" />
        <div className="hub-wireframe flex flex-wrap items-center gap-2 border-b border-dark-300/40 bg-black/80 px-6 py-2 mx-0 rounded-none">
          <Badge variant="outline" className="font-mono text-xs border-violet-500/40 text-violet-300">
            <Eye className="mr-1 inline h-3 w-3" />
            /reclaim
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">
            HOLD_VYRNA_UNSYNC
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-rose-500/40 text-rose-300">
            lattice_sync: false
          </Badge>
          <span className="text-xs text-dark-600 font-mono">
            Ghostlight chrome · local handshake ≠ lattice sync · Venice paste bayed
          </span>
        </div>
        <main className="hub-shell-scroll flex-1 overflow-auto p-4 md:p-6 grid-bg">
          <ReclaimPanel />
        </main>
      </div>
    </div>
  )
}
