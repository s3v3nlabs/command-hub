"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { TechPanel } from "@/components/ui/tech-panel"
import LinuxTerminal from "@/components/CommandHub/modules/LinuxTerminal"
import { Terminal } from "lucide-react"

export default function CommandPromptPage() {
  return (
    <div className="hub-shell flex bg-black">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-4">
          <TechPanel
            title="COMMAND PROMPT"
            subtitle="REAL LAB SHELL ON THIS HOST"
            cornerAccent={true}
            borderAccent={true}
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 font-mono text-sm text-emerald-200">
                <Terminal size={14} className="mr-2" />
                LINUX — allowlisted verbs executed via child_process on this hub. The fake Windows console was removed.
              </div>
            </div>
          </TechPanel>

          <LinuxTerminal />
        </div>
      </div>
    </div>
  )
}
