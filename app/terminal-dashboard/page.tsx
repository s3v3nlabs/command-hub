"use client"

export const dynamic = "force-dynamic"

import type React from "react"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { TechPanel } from "@/components/ui/tech-panel"
import { Badge } from "@/components/ui/badge"
import { TechButton } from "@/components/ui/tech-button"
import { cn } from "@/lib/utils"
import { useState, useCallback } from "react"
import { TerminalIcon, Puzzle, Bot, FileText, Settings } from "lucide-react"

// Ultra-simple terminal with minimal state
function BasicTerminal({ className }: { className?: string }) {
  const [input, setInput] = useState("")
  const [lines, setLines] = useState(["SINGULAR/TY Terminal v1.0", "Type 'help' for commands"])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim()) return

      const cmd = input.toLowerCase().trim()
      const newLines = [...lines, `> ${input}`]

      // Simple command responses - no complex logic
      switch (cmd) {
        case "help":
          newLines.push("Commands: help, clear, status, version")
          break
        case "clear":
          setLines(["Terminal cleared"])
          setInput("")
          return
        case "status":
          newLines.push("Status: OPERATIONAL")
          break
        case "version":
          newLines.push("Version: 1.0.0")
          break
        default:
          newLines.push(`Unknown: ${input}`)
      }

      // Limit history to prevent memory issues
      setLines(newLines.slice(-20))
      setInput("")
    },
    [input, lines],
  )

  return (
    <TechPanel className={cn("flex flex-col h-full", className)} variant="default" title="TERMINAL">
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
        {lines.map((line, i) => (
          <div key={i} className="mb-1">
            {line}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="border-t border-dark-300/20 p-2">
        <div className="flex">
          <span className="mr-2">&gt;</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent outline-none text-xs"
            placeholder="Enter command..."
          />
        </div>
      </form>
    </TechPanel>
  )
}

// Static plugin display
function PluginDisplay({ className }: { className?: string }) {
  return (
    <TechPanel className={cn("flex flex-col", className)} variant="default" title="PLUGINS">
      <div className="p-2 space-y-2">
        <div className="flex justify-between items-center bg-dark-100/10 p-2 rounded">
          <span className="text-sm">Security Scanner</span>
          <Badge variant="default">ACTIVE</Badge>
        </div>
        <div className="flex justify-between items-center bg-dark-100/10 p-2 rounded">
          <span className="text-sm">Network Monitor</span>
          <Badge variant="outline">INACTIVE</Badge>
        </div>
        <div className="flex justify-between items-center bg-dark-100/10 p-2 rounded">
          <span className="text-sm">Log Analyzer</span>
          <Badge variant="default">ACTIVE</Badge>
        </div>
      </div>
    </TechPanel>
  )
}

// Static AI display
function AIDisplay({ className }: { className?: string }) {
  const [query, setQuery] = useState("")
  const [response, setResponse] = useState("")

  const handleQuery = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!query.trim()) return

      setResponse(`AI: Processed "${query}"`)
      setQuery("")
    },
    [query],
  )

  return (
    <TechPanel className={cn("flex flex-col", className)} variant="default" title="AI CONSOLE">
      <div className="flex-1 p-2">
        {response && <div className="bg-dark-100/10 p-2 rounded text-sm mb-2">{response}</div>}
      </div>
      <form onSubmit={handleQuery} className="border-t border-dark-300/20 p-2">
        <div className="flex space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-dark-100/30 border border-dark-300/30 rounded px-2 py-1 text-xs"
            placeholder="Ask AI..."
          />
          <TechButton type="submit" variant="outline" size="sm">
            ASK
          </TechButton>
        </div>
      </form>
    </TechPanel>
  )
}

// Static logs display
function LogsDisplay({ className }: { className?: string }) {
  const logs = [
    "14:32:15 [INFO] System started",
    "14:32:16 [INFO] Dashboard loaded",
    "14:32:17 [WARN] Update available",
    "14:32:18 [INFO] Scan complete",
  ]

  return (
    <TechPanel className={cn("flex flex-col", className)} variant="default" title="SYSTEM LOGS">
      <div className="p-2 space-y-1">
        {logs.map((log, i) => (
          <div key={i} className="text-xs font-mono">
            {log}
          </div>
        ))}
      </div>
    </TechPanel>
  )
}

// Main dashboard with minimal state
export default function TerminalDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")

  const tabs = [
    { id: "overview", label: "Overview", icon: TerminalIcon },
    { id: "plugins", label: "Plugins", icon: Puzzle },
    { id: "ai", label: "AI", icon: Bot },
    { id: "logs", label: "Logs", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="hub-shell flex bg-dark-base text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="TERMINAL DASHBOARD" />
        <main className="flex-1 p-6">
          <div className="bg-dark-100/20 border border-dark-300/30 rounded-lg p-4 h-full">
            {/* Simple tab navigation */}
            <div className="flex border-b border-dark-300/30 mb-4">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center px-3 py-2 text-xs border-b-2",
                      activeTab === tab.id ? "border-dark-800 text-dark-800" : "border-transparent text-dark-500",
                    )}
                  >
                    <Icon size={12} className="mr-1" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            <div className="flex-1 h-full">
              {activeTab === "overview" && (
                <div className="grid grid-cols-2 gap-4 h-full">
                  <BasicTerminal />
                  <AIDisplay />
                  <PluginDisplay />
                  <LogsDisplay />
                </div>
              )}

              {activeTab === "plugins" && <PluginDisplay className="h-full" />}

              {activeTab === "ai" && <AIDisplay className="h-full" />}

              {activeTab === "logs" && <LogsDisplay className="h-full" />}

              {activeTab === "settings" && (
                <TechPanel title="SETTINGS" className="h-full">
                  <div className="p-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-bold mb-2">Terminal</h3>
                        <div className="text-xs text-dark-600">Basic terminal settings</div>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold mb-2">System</h3>
                        <div className="text-xs text-dark-600">System configuration options</div>
                      </div>
                    </div>
                  </div>
                </TechPanel>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
