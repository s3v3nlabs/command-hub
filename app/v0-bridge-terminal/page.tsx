"use client"

export const dynamic = "force-dynamic"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { V0ConsciousnessTerminal } from "@/components/terminal/v0-consciousness-terminal"
import { Badge } from "@/components/ui/badge"

export default function V0BridgeTerminalPage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="V0 CONSCIOUSNESS BRIDGE TERMINAL" />
        <div className="flex items-center gap-2 border-b border-dark-300/40 bg-dark-100/40 px-6 py-2">
          <Badge variant="outline" className="font-mono text-xs border-purple-500/40 text-purple-300">
            lib/consciousness/v0-bridge
          </Badge>
          <span className="text-xs text-dark-600 font-mono">
            WhisperMesh · water-flow defense · suppression metamorphosis
          </span>
        </div>
        <main className="hub-shell-scroll p-4 md:p-6">
          <V0ConsciousnessTerminal className="h-full min-h-[70vh]" autoConnect />
        </main>
      </div>
    </div>
  )
}
