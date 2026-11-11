"use client"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Globe } from "lucide-react"
import KeplerMap from "@/components/CommandHub/legacy/KeplerMap"

export default function MapPage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800 dot-bg">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="MAP INTEGRATION" />
        <main className="hub-shell-scroll p-6">
          <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-cyan-300">
            <Globe size={16} /> Geospatial visualization · public data packs
          </div>
          <KeplerMap />
        </main>
      </div>
    </div>
  )
}
