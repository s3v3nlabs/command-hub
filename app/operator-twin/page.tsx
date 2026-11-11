"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import BeastOperatorTwin from "@/components/CommandHub/modules/BeastOperatorTwin"

export default function OperatorTwinPage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="OPERATOR TWIN v1 — LOCAL VAULT" />
        <div className="flex flex-wrap items-center gap-2 border-b border-dark-300/40 bg-dark-100/40 px-6 py-2">
          <Badge variant="outline" className="font-mono text-xs border-cyan-500/40 text-cyan-300">
            /operator-twin
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">
            HOLD_VYRNA_UNSYNC
          </Badge>
          <span className="text-xs text-dark-600 font-mono">
            Ghostlight chrome · retrieval Twin · no cloud training upload
          </span>
        </div>
        <main className="hub-shell-scroll p-4 md:p-6">
          <BeastOperatorTwin />
        </main>
      </div>
    </div>
  )
}
