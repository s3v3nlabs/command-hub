"use client"

export const dynamic = "force-dynamic"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { MultiPaneTerminal } from "@/components/terminal/multi-pane-terminal"
import { Window } from "@/components/ui/window"
import { OperationsIcon } from "@/components/ui/icons"
import { TechPanel } from "@/components/ui/tech-panel"
import { Badge } from "@/components/ui/badge"
import { TechButton } from "@/components/ui/tech-button"
import { GridItem, GridLayout } from "@/components/ui/grid-layout"
import { TerminalProvider } from "@/components/terminal/terminal-context"

interface TerminalLine {
  type: "command" | "output" | "error"
  content: string
  timestamp: string
}

export default function TerminalPage() {
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([])
  const [currentCommand, setCurrentCommand] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [resonanceMode, setResonanceMode] = useState(false)
  const [typingIntensity, setTypingIntensity] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  // Load command history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("terminal-command-history")
    if (savedHistory) {
      setCommandHistory(JSON.parse(savedHistory))
    }
  }, [])

  // Save command history to localStorage
  const saveCommandHistory = (history: string[]) => {
    localStorage.setItem("terminal-command-history", JSON.stringify(history))
  }

  // Resonance input mode - track typing rhythm
  useEffect(() => {
    if (!resonanceMode) return

    let typingTimer: NodeJS.Timeout
    const handleTyping = () => {
      setTypingIntensity((prev) => Math.min(prev + 10, 100))
      clearTimeout(typingTimer)
      typingTimer = setTimeout(() => {
        setTypingIntensity((prev) => Math.max(prev - 5, 0))
      }, 200)
    }

    const inputElement = inputRef.current
    if (inputElement) {
      inputElement.addEventListener("input", handleTyping)
      return () => {
        inputElement.removeEventListener("input", handleTyping)
        clearTimeout(typingTimer)
      }
    }
  }, [resonanceMode])

  // Syntax highlighting function - COMPLETELY REWRITTEN TO AVOID REGEX ISSUES
  const highlightSyntax = (text: string, type: "command" | "output" | "error") => {
    if (type === "command") {
      // Simple highlighting without complex regex
      const parts = text.split(" ")
      if (parts.length > 0) {
        const command = parts[0]
        const rest = parts.slice(1).join(" ")
        return `<span class="text-blue-400 font-bold">${command}</span> ${rest}`
      }
      return text
    } else if (type === "error") {
      return `<span class="text-red-400">${text}</span>`
    } else {
      // Simple output highlighting without complex regex
      let highlighted = text

      // Replace success indicators
      if (highlighted.includes("SUCCESS")) {
        highlighted = highlighted.replace(/SUCCESS/g, '<span class="text-green-400 font-bold">SUCCESS</span>')
      }
      if (highlighted.includes("OK")) {
        highlighted = highlighted.replace(/OK/g, '<span class="text-green-400 font-bold">OK</span>')
      }
      if (highlighted.includes("COMPLETE")) {
        highlighted = highlighted.replace(/COMPLETE/g, '<span class="text-green-400 font-bold">COMPLETE</span>')
      }

      // Replace error indicators
      if (highlighted.includes("ERROR")) {
        highlighted = highlighted.replace(/ERROR/g, '<span class="text-red-400 font-bold">ERROR</span>')
      }
      if (highlighted.includes("FAIL")) {
        highlighted = highlighted.replace(/FAIL/g, '<span class="text-red-400 font-bold">FAIL</span>')
      }
      if (highlighted.includes("DENIED")) {
        highlighted = highlighted.replace(/DENIED/g, '<span class="text-red-400 font-bold">DENIED</span>')
      }

      // Replace warning indicators
      if (highlighted.includes("WARNING")) {
        highlighted = highlighted.replace(/WARNING/g, '<span class="text-yellow-400 font-bold">WARNING</span>')
      }
      if (highlighted.includes("CAUTION")) {
        highlighted = highlighted.replace(/CAUTION/g, '<span class="text-yellow-400 font-bold">CAUTION</span>')
      }

      return highlighted
    }
  }

  // Animate response simulation
  const animateResponse = async (response: string) => {
    const words = response.split(" ")
    let currentText = ""

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? " " : "") + words[i]

      setTerminalLines((prev) => {
        const newLines = [...prev]
        if (newLines[newLines.length - 1]?.type === "output") {
          newLines[newLines.length - 1] = {
            type: "output",
            content: currentText,
            timestamp: new Date().toLocaleTimeString(),
          }
        } else {
          newLines.push({
            type: "output",
            content: currentText,
            timestamp: new Date().toLocaleTimeString(),
          })
        }
        return newLines
      })

      await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 50))
    }
  }

  const executeCommand = async (command: string) => {
    if (!command.trim()) return

    // Add command to terminal
    const commandLine: TerminalLine = {
      type: "command",
      content: `$ ${command}`,
      timestamp: new Date().toLocaleTimeString(),
    }
    setTerminalLines((prev) => [...prev, commandLine])

    // Add to history
    const newHistory = [command, ...commandHistory.filter((h) => h !== command)].slice(0, 50)
    setCommandHistory(newHistory)
    saveCommandHistory(newHistory)
    setHistoryIndex(-1)

    // Simulate command execution
    let response = ""
    const cmd = command.toLowerCase().split(" ")[0]

    switch (cmd) {
      case "help":
        response = "Available commands: help, clear, ls, ps, netstat, ping, scan, status, history, resonance"
        break
      case "clear":
        setTerminalLines([])
        return
      case "ls":
        response =
          "drwxr-xr-x  2 user user 4096 Jan 15 14:30 documents\n-rw-r--r--  1 user user 1024 Jan 15 14:25 config.txt\n-rwxr-xr-x  1 user user 2048 Jan 15 14:20 scanner.sh"
        break
      case "ps":
        response = "PID  COMMAND\n1234 singularity-hub\n5678 signal-processor\n9012 threat-analyzer"
        break
      case "netstat":
        response =
          "Active connections:\nTCP 192.168.1.100:8080 LISTENING\nTCP 192.168.1.100:443 ESTABLISHED\nUDP 192.168.1.100:53 LISTENING"
        break
      case "ping":
        const target = command.split(" ")[1] || "localhost"
        response = `PING ${target}: 64 bytes from ${target}: icmp_seq=1 ttl=64 time=0.5ms\nPING ${target}: 64 bytes from ${target}: icmp_seq=2 ttl=64 time=0.3ms\nPING ${target}: 64 bytes from ${target}: icmp_seq=3 ttl=64 time=0.4ms`
        break
      case "scan":
        response =
          "Network scan initiated...\n192.168.1.1 - ONLINE (Router)\n192.168.1.100 - ONLINE (This machine)\n192.168.1.105 - ONLINE (Unknown device)\nScan complete: 3 devices found"
        break
      case "status":
        response =
          "System Status: OPERATIONAL\nCPU: 45% | Memory: 62% | Network: ACTIVE\nSecurity Level: GREEN | Threat Level: LOW"
        break
      case "history":
        response = commandHistory
          .slice(0, 10)
          .map((cmd, i) => `${i + 1}: ${cmd}`)
          .join("\n")
        break
      case "resonance":
        const mode = command.split(" ")[1]
        if (mode === "on") {
          setResonanceMode(true)
          response = "Resonance Input Mode: ENABLED\nBackground will respond to typing intensity"
        } else if (mode === "off") {
          setResonanceMode(false)
          setTypingIntensity(0)
          response = "Resonance Input Mode: DISABLED"
        } else {
          response = `Resonance Mode: ${resonanceMode ? "ENABLED" : "DISABLED"}\nUsage: resonance [on|off]`
        }
        break
      default:
        response = `Command not found: ${command}\nType 'help' for available commands`
        setTerminalLines((prev) => [
          ...prev,
          {
            type: "error",
            content: response,
            timestamp: new Date().toLocaleTimeString(),
          },
        ])
        return
    }

    // Animate the response
    await animateResponse(response)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand(currentCommand)
      setCurrentCommand("")
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setCurrentCommand("")
      }
    }
  }

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalLines])

  const getResonanceBackground = () => {
    if (!resonanceMode) return "bg-dark-base"
    return "bg-dark-base"
  }

  const getResonanceStyle = () => {
    if (!resonanceMode) return {}

    const intensity = typingIntensity / 100
    return {
      backgroundColor: `hsla(${120 + intensity * 60}, ${30 + intensity * 40}%, ${5 + intensity * 10}%, 0.1)`,
      transition: "background-color 0.2s ease",
    }
  }

  return (
    <TerminalProvider>
      <div
        className={`hub-shell flex text-dark-800 dot-bg transition-all duration-300 ${getResonanceBackground()}`}
        style={getResonanceStyle()}
      >
        <Sidebar />
        <div className="text-sm font-mono tracking-wider uppercase text-slate-300">
          <Header title="TERMINAL OPERATIONS" />
          <main className="flex rounded-lg border overflow-hidden shadow-2xl relative border-none flex-row text-neutral-500">
            <GridLayout>
              <GridItem colSpan={2} rowSpan={2}>
                <Window title="ENHANCED TERMINAL" icon={<OperationsIcon size={16} />} variant="glass" size="full">
                  <div className="h-full flex flex-col border-dashed border-[rgba(229,240,245,1)]">
                    {/* Status Bar */}
                    <div className="flex justify-between items-center mb-4 p-2 bg-black/30 rounded">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-green-400">
                          ONLINE
                        </Badge>
                        <span className="text-xs text-gray-400">History: {commandHistory.length} commands</span>
                        {resonanceMode && (
                          <Badge variant="outline" className="text-purple-400">
                            RESONANCE MODE
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <TechButton
                          onClick={() => setResonanceMode(!resonanceMode)}
                          variant={resonanceMode ? "default" : "outline"}
                          size="sm"
                        >
                          Resonance Mode
                        </TechButton>
                        <TechButton onClick={() => setTerminalLines([])} variant="outline" size="sm">
                          Clear
                        </TechButton>
                      </div>
                    </div>

                    {/* Terminal Output */}
                    <div ref={terminalRef} className="flex-1 bg-black/50 rounded p-4 font-mono text-sm overflow-y-auto">
                      {terminalLines.length === 0 && (
                        <div className="text-gray-400">
                          SINGULAR/TY Terminal v2.1.0
                          <br />
                          Type 'help' for available commands
                          <br />
                          Use ↑/↓ arrows to navigate command history
                          <br />
                          <br />
                        </div>
                      )}

                      {terminalLines.map((line, index) => (
                        <div key={index} className="mb-1">
                          <span className="text-gray-500 text-xs mr-2">[{line.timestamp}]</span>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: highlightSyntax(line.content, line.type),
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Command Input */}
                    <div className="mt-4 flex items-center gap-2">
                      <span className="font-mono text-sky-500">$</span>
                      <input
                        ref={inputRef}
                        type="text"
                        value={currentCommand}
                        onChange={(e) => setCurrentCommand(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono"
                        placeholder="Enter command..."
                        autoFocus
                      />
                      {resonanceMode && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 transition-all duration-200"
                              style={{ width: `${typingIntensity}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{typingIntensity}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Window>
              </GridItem>

              <GridItem>
                <TechPanel title="COMMAND HISTORY" cornerAccent borderAccent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {commandHistory.slice(0, 10).map((cmd, index) => (
                      <div
                        key={index}
                        className="p-2 bg-black/30 rounded cursor-pointer hover:bg-black/50 transition-colors"
                        onClick={() => setCurrentCommand(cmd)}
                      >
                        <span className="text-xs text-gray-400 mr-2">{index + 1}:</span>
                        <span className="text-green-400 font-mono text-sm">{cmd}</span>
                      </div>
                    ))}
                    {commandHistory.length === 0 && <div className="text-gray-400 text-sm">No command history</div>}
                  </div>
                </TechPanel>
              </GridItem>

              <GridItem>
                <MultiPaneTerminal />
              </GridItem>
            </GridLayout>
          </main>
        </div>
      </div>
    </TerminalProvider>
  )
}
