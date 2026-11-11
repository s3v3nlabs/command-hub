"use client"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Window } from "@/components/ui/window"
import { Database } from "lucide-react"
import PostgresPanel from "@/components/CommandHub/legacy/PostgresPanel"

export default function VaultStreamsPage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800 dot-bg">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="POSTGRESQL CONNECTION" />
        <main className="hub-shell-scroll p-6">
          <Window
            title="DATABASE MANAGEMENT"
            icon={<Database size={16} />}
            variant="glass"
            size="full"
            className="mb-6"
          >
            <PostgresPanel />
          </Window>
        </main>
      </div>
    </div>
  )
}
