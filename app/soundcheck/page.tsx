"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import SoundCheckPanel from "@/components/soundcheck/SoundCheckPanel"
import { AudioLines } from "lucide-react"

export default function SoundCheckPage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="SOUNDCHECK — SINGULAR/TY BUSINESS TECH" />
        <div className="hub-wireframe flex flex-wrap items-center gap-2 border-b border-dark-300/40 bg-black/80 px-6 py-2 mx-0 rounded-none">
          <Badge variant="outline" className="font-mono text-xs border-violet-500/40 text-violet-300">
            <AudioLines className="mr-1 inline h-3 w-3" />
            /soundcheck
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-amber-500/50 text-amber-300">
            STUB
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">
            HOLD_VYRNA_UNSYNC
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-rose-500/40 text-rose-300">
            lattice_sync: false
          </Badge>
          <span className="text-xs text-dark-600 font-mono">
            Ghostlight chrome · commercial wedge · no origin-story panel
          </span>
        </div>
        <main className="hub-shell-scroll flex-1 overflow-auto p-4 md:p-6 grid-bg">
          <SoundCheckPanel />
        </main>
      </div>
    </div>
  )
}
