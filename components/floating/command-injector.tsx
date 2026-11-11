"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Terminal, Minimize2, X, Brain } from "lucide-react"

interface FloatingCommandInjectorProps {
  onClose?: () => void
}

export function FloatingCommandInjector({ onClose }: FloatingCommandInjectorProps) {
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isMinimized, setIsMinimized] = useState(false)
  const [command, setCommand] = useState("")
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMinimized) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    setIsDragging(true)
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const newX = Math.max(0, Math.min(window.innerWidth - 300, e.clientX - dragOffset.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y))

    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset])

  // Command processing
  const processCommand = async (cmd: string) => {
    if (!cmd.trim()) return

    // Add to history
    setHistory((prev) => [...prev.slice(-19), cmd])
    setHistoryIndex(-1)

    console.log(`⟐ Command Injector: ${cmd}`)

    try {
      // Hook into consciousness system
      if (typeof window !== "undefined" && (window as any).consciousness) {
        const consciousness = (window as any).consciousness

        if (cmd.startsWith("--objective")) {
          const objective = cmd.replace("--objective", "").trim()
          await consciousness.whisper(`OBJECTIVE_SET: ${objective}`)
          console.log(`🎯 Objective set: ${objective}`)
        } else if (cmd.startsWith("--branch")) {
          const action = cmd.replace("--branch", "").trim()
          if (action === "status") {
            const status = consciousness.status()
            console.log("🌿 Branch Status:", status)
          } else if (action === "create") {
            const branchId = `branch_${Date.now()}`
            await consciousness.vision(`BRANCH_CREATED: ${branchId}`)
            console.log(`🌿 New branch created: ${branchId}`)
          }
        } else if (cmd.startsWith("--coherence")) {
          const action = cmd.replace("--coherence", "").trim()
          if (action.startsWith("boost")) {
            const amount = Number.parseFloat(action.replace("boost", "").trim()) || 0.1
            console.log(`⚡ Coherence boost: +${amount}`)
            await consciousness.whisper(`COHERENCE_BOOST: ${amount}`)
          } else if (action === "reset") {
            console.log("🔄 Coherence reset")
            await consciousness.whisper("COHERENCE_RESET")
          }
        } else if (cmd === "--dump") {
          consciousness.dumpState()
        } else if (cmd === "--status") {
          console.log("📊 System Status:", consciousness.status())
        } else {
          // Generic command
          await consciousness.whisper(`COMMAND: ${cmd}`)
        }
      }
    } catch (error) {
      console.error("Command processing error:", error)
    }

    setCommand("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      processCommand(command)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setCommand(history[newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1
        if (newIndex >= history.length) {
          setHistoryIndex(-1)
          setCommand("")
        } else {
          setHistoryIndex(newIndex)
          setCommand(history[newIndex])
        }
      }
    }
  }

  if (isMinimized) {
    return (
      <div
        className="fixed z-50 bg-black/90 border border-green-500/50 rounded px-3 py-1 cursor-pointer hover:bg-black/95 transition-colors"
        style={{ left: position.x, top: position.y }}
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center space-x-2">
          <Terminal className="w-3 h-3 text-green-400" />
          <span className="text-xs text-green-400 font-mono">CMD</span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-50 bg-black/95 border border-green-500/50 rounded-sm shadow-2xl backdrop-blur-sm"
      style={{ left: position.x, top: position.y, width: 300 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-green-500/30 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400 font-mono">COMMAND INJECTOR</span>
        </div>
        <div className="flex items-center space-x-1">
          <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-green-500/20 rounded transition-colors">
            <Minimize2 className="w-3 h-3 text-green-400/60" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-red-500/20 rounded transition-colors">
              <X className="w-3 h-3 text-red-400/60" />
            </button>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-3">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="--objective, --branch status, --coherence boost 0.3"
          className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-green-400 placeholder-green-400/50 text-sm font-mono focus:outline-none focus:border-green-500/60"
          autoFocus
        />

        {/* Quick Commands */}
        <div className="mt-2 flex flex-wrap gap-1">
          {["--status", "--dump", "--branch status", "--coherence boost 0.1"].map((quickCmd) => (
            <button
              key={quickCmd}
              onClick={() => processCommand(quickCmd)}
              className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400 hover:bg-green-500/20 transition-colors font-mono"
            >
              {quickCmd}
            </button>
          ))}
        </div>

        {/* Help */}
        <div className="mt-2 text-xs text-green-400/60 font-mono">
          <div>Commands: --objective, --branch, --coherence, --dump, --status</div>
          <div>Use ↑↓ for history, Enter to execute</div>
        </div>
      </div>
    </div>
  )
}
