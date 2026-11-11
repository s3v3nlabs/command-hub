"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { TechPanel } from "@/components/ui/tech-panel"
import LinuxTerminal from "@/components/CommandHub/modules/LinuxTerminal"
import WindowsTerminal from "@/components/CommandHub/modules/WindowsTerminal"
import { useState } from "react"
import { TechButton } from "@/components/ui/tech-button"
import { Terminal, Monitor } from "lucide-react"

export default function CommandPromptPage() {
  const [activeOS, setActiveOS] = useState<"linux" | "windows">("linux")

  return (
    <div className="hub-shell flex bg-black">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-4">
          <TechPanel
            title="COMMAND PROMPT SUITE"
            subtitle="MULTI-OS TERMINAL INTERFACE"
            cornerAccent={true}
            borderAccent={true}
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <TechButton
                  onClick={() => setActiveOS("linux")}
                  variant={activeOS === "linux" ? "default" : "outline"}
                  className={`font-mono text-sm ${
                    activeOS === "linux"
                      ? "bg-dark-600 hover:bg-dark-500 text-black"
                      : "border-dark-400/50 text-dark-600 hover:bg-dark-200/10"
                  }`}
                >
                  <Terminal size={14} className="mr-2" />
                  LINUX/ZSH
                </TechButton>
                <TechButton
                  onClick={() => setActiveOS("windows")}
                  variant={activeOS === "windows" ? "default" : "outline"}
                  className={`font-mono text-sm ${
                    activeOS === "windows"
                      ? "bg-dark-600 hover:bg-dark-500 text-black"
                      : "border-dark-400/50 text-dark-600 hover:bg-dark-200/10"
                  }`}
                >
                  <Monitor size={14} className="mr-2" />
                  WINDOWS/CMD
                </TechButton>
              </div>
              <div className="text-sm font-mono text-dark-500">
                Full-featured terminal emulation with Python, Node.js, Git, and development tools
              </div>
            </div>
          </TechPanel>

          {activeOS === "linux" ? <LinuxTerminal /> : <WindowsTerminal />}
        </div>
      </div>
    </div>
  )
}
