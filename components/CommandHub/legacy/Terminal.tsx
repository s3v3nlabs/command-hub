"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TerminalIcon, ArrowRight, X } from "lucide-react"
import { speak } from "@/lib/audio"

interface CommandHistory {
  command: string
  output: string
  isError?: boolean
}

export default function Terminal() {
  const [input, setInput] = useState("")
  const [history, setHistory] = useState<CommandHistory[]>([
    {
      command: "system --status",
      output: "All systems operational. BLACKFRAME core running v3.7.2",
    },
  ])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }

    // Focus input when component mounts
    inputRef.current?.focus()
  }, [history])

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    // Add to command history
    setCommandHistory((prev) => [...prev, input])
    setHistoryIndex(-1)

    // Process command
    const output = processCommand(input)

    // Add to display history
    setHistory((prev) => [...prev, { command: input, output: output.message, isError: output.error }])

    // Clear input
    setInput("")
  }

  const processCommand = (cmd: string): { message: string; error: boolean } => {
    const command = cmd.trim().toLowerCase()

    // Simple command processor
    if (command === "help") {
      return {
        message: `Available commands:
help - Show this help message
clear - Clear terminal
status - Show system status
scan [target] - Scan target
connect [system] - Connect to system
decrypt [file] - Attempt to decrypt file
agents - List active field agents
alert [message] - Send alert to all agents`,
        error: false,
      }
    } else if (command === "clear") {
      setHistory([])
      return { message: "", error: false }
    } else if (command === "status" || command === "system --status") {
      return {
        message:
          "BLACKFRAME Core: ONLINE\nSecurity Level: ALPHA\nConnected Agents: 7\nActive Missions: 3\nSystem Integrity: 98.7%",
        error: false,
      }
    } else if (command.startsWith("scan ")) {
      const target = command.substring(5)
      speak(`Scanning target ${target}`)
      return {
        message: `Initiating scan on ${target}...\n\nScan complete.\nVulnerabilities detected: 3\nOpen ports: 22, 80, 443\nOS: Linux 5.4.0\nServices: SSH, HTTP, HTTPS`,
        error: false,
      }
    } else if (command.startsWith("connect ")) {
      const system = command.substring(8)
      return {
        message: `Attempting to connect to ${system}...\n\nConnection established. Use 'disconnect' to end session.`,
        error: false,
      }
    } else if (command.startsWith("decrypt ")) {
      const file = command.substring(8)
      speak("Decryption in progress")
      return {
        message: `Attempting to decrypt ${file}...\n\nDecryption failed. Insufficient permissions.`,
        error: true,
      }
    } else if (command === "agents") {
      return {
        message: `Active field agents:
- Agent Corvus (Paris)
- Agent Talon (Berlin)
- Agent Raven (Moscow)
- Agent Falcon (New York)
- Agent Osprey (Tokyo)
- Agent Hawk (London)
- Agent Eagle (Washington)`,
        error: false,
      }
    } else if (command.startsWith("alert ")) {
      const message = command.substring(6)
      speak(`Alert sent: ${message}`)
      return {
        message: `Alert sent to all agents: "${message}"`,
        error: false,
      }
    }

    return { message: `Command not recognized: ${command}. Type 'help' for available commands.`, error: true }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle up/down arrows for command history
    if (e.key === "ArrowUp") {
      e.preventDefault()
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput("")
      }
    }
  }

  const clearTerminal = () => {
    setHistory([])
    speak("Terminal cleared")
  }

  return (
    <Card className="bg-dark-50 border-dark-300 shadow-lg h-full">
      <CardHeader className="border-b border-dark-300 bg-dark-100 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TerminalIcon className="h-5 w-5 text-green-500" />
          BLACKFRAME Terminal
        </CardTitle>
        <button onClick={clearTerminal} className="text-gray-400 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent className="p-0 h-[500px] flex flex-col">
        <div ref={terminalRef} className="flex-grow overflow-y-auto p-4 font-mono text-sm bg-black">
          <div className="text-green-500 mb-2">
            BLACKFRAME Terminal v3.7.2
            <br />
            Type 'help' for available commands.
          </div>

          {history.map((item, index) => (
            <div key={index} className="mb-2">
              <div className="flex items-center">
                <span className="text-blue-400 mr-2">$</span>
                <span>{item.command}</span>
              </div>
              {item.output && (
                <div className={`ml-4 whitespace-pre-wrap ${item.isError ? "text-red-400" : "text-gray-300"}`}>
                  {item.output}
                </div>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleCommand} className="border-t border-dark-300 p-2 flex items-center">
          <span className="text-blue-400 mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-grow bg-transparent border-none outline-none text-white font-mono"
            autoComplete="off"
            spellCheck="false"
          />
          <button type="submit" className="text-gray-400 hover:text-white transition-colors">
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </CardContent>
    </Card>
  )
}
