"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { VaultConsole } from "@/components/vault/VaultConsole"

export default function VaultPage() {
  return (
    <div className="hub-shell flex bg-black text-[color:var(--ghost-ink)]">
      <Sidebar />
      <div className="hub-shell-main">
        <Header
          title="GHOSTLIGHT VAULT"
          subtitle="Local ChatGPT-export search · MCP + REST for AI nodes"
        />
        <main className="hub-shell-scroll ghost-grid-bg scanline min-h-0 flex-1 overflow-auto p-4">
          <VaultConsole />
        </main>
      </div>
    </div>
  )
}
