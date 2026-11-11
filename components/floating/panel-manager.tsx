"use client"

import { useState } from "react"
import { FloatingCommandInjector } from "./command-injector"
import { FloatingNetworkPanel } from "./network-intelligence-panel"
import { FloatingSystemControl } from "./system-control-panel"
import { Terminal, Globe, Brain } from "lucide-react"

export function FloatingPanelManager() {
  const [activePanel, setActivePanel] = useState<string | null>(null)

  const togglePanel = (panelId: string) => {
    setActivePanel(activePanel === panelId ? null : panelId)
  }

  return (
    <>
      {/* Floating Control Button */}
      <div className="fixed top-4 right-4 z-40 flex items-center space-x-2">
        <button
          onClick={() => togglePanel("command")}
          className="p-2 bg-black/90 border border-green-500/50 rounded hover:bg-black/95 transition-colors"
          title="Command Injector"
        >
          <Terminal className="w-4 h-4 text-green-400" />
        </button>
        <button
          onClick={() => togglePanel("network")}
          className="p-2 bg-black/90 border border-blue-500/50 rounded hover:bg-black/95 transition-colors"
          title="Network Intelligence"
        >
          <Globe className="w-4 h-4 text-blue-400" />
        </button>
        <button
          onClick={() => togglePanel("system")}
          className="p-2 bg-black/90 border border-purple-500/50 rounded hover:bg-black/95 transition-colors"
          title="System Control"
        >
          <Brain className="w-4 h-4 text-purple-400" />
        </button>
      </div>

      {/* Floating Panels */}
      {activePanel === "command" && <FloatingCommandInjector onClose={() => setActivePanel(null)} />}
      {activePanel === "network" && <FloatingNetworkPanel onClose={() => setActivePanel(null)} />}
      {activePanel === "system" && <FloatingSystemControl onClose={() => setActivePanel(null)} />}
    </>
  )
}
