"use client"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Window } from "@/components/ui/window"
import { Globe } from "lucide-react"
import KeplerMap from "@/components/CommandHub/legacy/KeplerMap"

export default function MapPage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800 dot-bg">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="MAP INTEGRATION" />
        <main className="hub-shell-scroll p-6">
          <Window
            title="GEOSPATIAL VISUALIZATION"
            icon={<Globe size={16} />}
            variant="glass"
            size="full"
            className="mb-6"
          >
            <KeplerMap />
          </Window>
        </main>
      </div>
    </div>
  )
}
