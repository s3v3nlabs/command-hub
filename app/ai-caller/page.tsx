"use client"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { AICallerConsole } from "@/components/caller/AICallerConsole"

export default function AICallerPage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="AI CALLER — GROK BOT" />
        <main className="hub-shell-scroll p-4 md:p-6">
          <AICallerConsole />
        </main>
      </div>
    </div>
  )
}
