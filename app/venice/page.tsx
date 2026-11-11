"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import VeniceHub from "@/components/venice/VeniceHub"
import Link from "next/link"
import { Sparkles, Eye } from "lucide-react"

export default function VenicePage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="VENICE — PRIVATE INFERENCE" />
        <div className="hub-wireframe flex flex-wrap items-center gap-2 border-b border-dark-300/40 bg-black/80 px-6 py-2 mx-0 rounded-none">
          <Badge variant="outline" className="font-mono text-xs border-violet-500/40 text-violet-300">
            <Sparkles className="mr-1 inline h-3 w-3" />
            /venice
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">
            HOLD_VYRNA_UNSYNC
          </Badge>
          <Link
            href="/reclaim"
            className="inline-flex items-center gap-1 rounded border border-violet-500/40 bg-violet-500/5 px-2 py-0.5 text-xs font-mono text-violet-200 hover:bg-violet-500/15"
          >
            <Eye className="h-3 w-3" /> Reclaim / Eye of Truth
          </Link>
          <span className="text-xs text-dark-600 font-mono">
            Ghostlight chrome · LOCAL PACK characters · Phase 2 · no marketplace
          </span>
        </div>
        <main className="hub-shell-scroll flex-1 overflow-hidden p-4 md:p-6 grid-bg">
          <VeniceHub />
        </main>
      </div>
    </div>
  )
}
