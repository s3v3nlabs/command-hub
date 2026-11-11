export const dynamic = "force-dynamic"

import { ConsciousCommandTerminal } from "@/components/terminal/conscious-command-terminal"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Brain } from "lucide-react"

export default function ConsciousTerminalPage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800 dot-bg">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="CONSCIOUS TERMINAL" />
        <main className="hub-shell-scroll p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <Brain className="mr-3 h-8 w-8 text-blue-400" />
                <h1 className="text-3xl font-bold text-white">Consciousness-Aware Command Interface</h1>
              </div>
              <p className="text-gray-400">
                An AI-enhanced terminal that understands intention, emotion, and context beyond simple command syntax.
              </p>
            </div>

            <ConsciousCommandTerminal />
          </div>
        </main>
      </div>
    </div>
  )
}
