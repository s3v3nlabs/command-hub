"use client"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { SignalFrameWorkspace } from "@/components/signalframe/signal-frame-workspace"
import { SignalFrameConsolePipe } from "@/components/signalframe/signalframe-console-pipe"
import { Badge } from "@/components/ui/badge"
import { Eye, Radio } from "lucide-react"

export default function SignalFramePage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="SIGNALFRAME (WHISPERMESH)" />
        {/* ADD-ONLY honesty strip — prefer local axios / twin seats */}
        <div className="hub-wireframe flex flex-wrap items-center gap-2 border-b border-dark-300/40 bg-black/80 px-4 py-1.5">
          <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">
            HOLD_VYRNA_UNSYNC
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-rose-500/40 text-rose-300">
            lattice_sync: false
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-sky-500/40 text-sky-300">
            LOCAL MULTI-TAB
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-emerald-500/40 text-emerald-300">
            <Radio className="mr-1 inline h-3 w-3" />
            preferSeat: axios · twin-rag
          </Badge>
          <Link
            href="/reclaim"
            className="inline-flex items-center gap-1 rounded border border-violet-500/40 bg-violet-500/5 px-2 py-0.5 text-xs font-mono text-violet-200 hover:bg-violet-500/15"
          >
            <Eye className="h-3 w-3" /> Reclaim / Eye of Truth
          </Link>
        </div>
        <main className="hub-shell-scroll flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          <div className="relative min-h-0 h-full w-full flex-1">
            <SignalFrameConsolePipe />
            <SignalFrameWorkspace />
          </div>
        </main>
      </div>
    </div>
  )
}
