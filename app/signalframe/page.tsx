"use client"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { SignalFrameWorkspace } from "@/components/signalframe/signal-frame-workspace"
import { SignalFrameConsolePipe } from "@/components/signalframe/signalframe-console-pipe"

export default function SignalFramePage() {
  return (
    <div className="hub-shell flex bg-black text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="SIGNALFRAME // WHISPERMESH" />
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[color:var(--ghost-line)] bg-black px-3 py-1">
          <span className="ghost-chip">local multi-tab</span>
          <span className="ghost-chip">seat: axios · twin-rag</span>
          <span className="ghost-chip">lattice_sync: false</span>
          <span className="ghost-chip">hold_vyrna_unsync</span>
          <Link href="/reclaim" className="ghost-btn ml-auto">
            Reclaim / Eye of Truth
          </Link>
        </div>
        <main className="hub-shell-scroll flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          <div className="relative h-full min-h-0 w-full flex-1">
            <SignalFrameConsolePipe />
            <SignalFrameWorkspace />
          </div>
        </main>
      </div>
    </div>
  )
}
