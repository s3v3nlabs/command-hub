"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import BeastAIOpsHub from "@/components/CommandHub/modules/BeastAIOpsHub"

export default function AIHubPage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="AI OPS HUB — BEAST MODE" />
        <div className="hub-wireframe flex flex-wrap items-center gap-2 border-b border-dark-300/40 bg-black/80 px-6 py-2 mx-0 rounded-none">
          <Badge variant="outline" className="font-mono text-xs border-cyan-500/40 text-cyan-300">
            /ai-hub
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">
            HOLD_VYRNA_UNSYNC
          </Badge>
          <span className="text-xs text-dark-600 font-mono">
            Ghostlight chrome · providers · engines · prompt router
          </span>
        </div>
        <main className="hub-shell-scroll p-4 md:p-6">
          <BeastAIOpsHub />
        </main>
      </div>
    </div>
  )
}
