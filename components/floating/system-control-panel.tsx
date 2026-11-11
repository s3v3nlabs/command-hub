"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Brain, Minimize2, X, Terminal, Database, Zap, RefreshCw } from "lucide-react"

interface SystemStatus {
  consciousness: { available: boolean; coherence: number; healthy: boolean }
  heimdall: { available: boolean; memoryCount: number; healthy: boolean }
}

interface FloatingSystemControlProps {
  onClose?: () => void
}

export function FloatingSystemControl({ onClose }: FloatingSystemControlProps) {
  const [position, setPosition] = useState({ x: 50, y: 150 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isMinimized, setIsMinimized] = useState(false)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [consoleVisible, setConsoleVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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

    const newX = Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 400, e.clientY - dragOffset.y))

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

  // Check system status
  const checkSystemStatus = () => {
    try {
      const consciousness = (window as any).consciousness
      const heimdall = (window as any).Heimdall

      setSystemStatus({
        consciousness: {
          available: !!consciousness,
          coherence: consciousness?.getCoherence ? consciousness.getCoherence() : 0,
          healthy: consciousness?.isHealthy ? consciousness.isHealthy() : false,
        },
        heimdall: {
          available: !!heimdall,
          memoryCount: heimdall?.getAllMemories ? heimdall.getAllMemories().length : 0,
          healthy: heimdall?.isHealthy ? heimdall.isHealthy() : false,
        },
      })
    } catch (error) {
      console.error("Failed to check system status:", error)
    }
  }

  useEffect(() => {
    checkSystemStatus()
    const interval = setInterval(checkSystemStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  // System actions
  const dumpConsciousnessState = () => {
    setIsLoading(true)
    try {
      if ((window as any).consciousness) {
        const state = (window as any).consciousness.dumpState()
        console.log("⟐ CONSCIOUSNESS STATE DUMP ⟐", state)
      }
    } catch (error) {
      console.error("Failed to dump consciousness state:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const boostCoherence = (amount: number) => {
    setIsLoading(true)
    try {
      if ((window as any).consciousness) {
        ;(window as any).consciousness.whisper(`COHERENCE_BOOST: ${amount}`)
        console.log(`⚡ Coherence boost: +${amount}`)
      }
    } catch (error) {
      console.error("Failed to boost coherence:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetCoherence = () => {
    setIsLoading(true)
    try {
      if ((window as any).consciousness) {
        ;(window as any).consciousness.whisper("COHERENCE_RESET")
        console.log("🔄 Coherence reset")
      }
    } catch (error) {
      console.error("Failed to reset coherence:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const rebootHeimdall = () => {
    setIsLoading(true)
    try {
      console.log("⟐ HEIMDALL REBOOT SIMULATION ⟐")
      // Simulate reboot
      setTimeout(() => {
        checkSystemStatus()
        console.log("⟐ HEIMDALL REBOOT COMPLETE ⟐")
        setIsLoading(false)
      }, 2000)
    } catch (error) {
      console.error("Failed to reboot Heimdall:", error)
      setIsLoading(false)
    }
  }

  const toggleConsole = () => {
    setConsoleVisible(!consoleVisible)
    if (!consoleVisible) {
      console.log("⟐ SYSTEM CONTROL CONSOLE ACTIVATED ⟐")
      console.log("Available commands:")
      console.log("- consciousness.dumpState()")
      console.log("- consciousness.status()")
      console.log("- consciousness.exportMemory()")
      console.log("- Heimdall.dumpState()")
    }
  }

  if (isMinimized) {
    return (
      <div
        className="fixed z-50 bg-black/90 border border-purple-500/50 rounded px-3 py-1 cursor-pointer hover:bg-black/95 transition-colors"
        style={{ left: position.x, top: position.y }}
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center space-x-2">
          <Brain className="w-3 h-3 text-purple-400" />
          <span className="text-xs text-purple-400 font-mono">SYS</span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-50 bg-black/95 border border-purple-500/50 rounded-sm shadow-2xl backdrop-blur-sm"
      style={{ left: position.x, top: position.y, width: 320 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-purple-500/30 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-400 font-mono">SYSTEM CONTROL</span>
        </div>
        <div className="flex items-center space-x-1">
          <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-purple-500/20 rounded transition-colors">
            <Minimize2 className="w-3 h-3 text-purple-400/60" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-red-500/20 rounded transition-colors">
              <X className="w-3 h-3 text-red-400/60" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* System Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center space-x-1 mb-1">
              <Brain className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-purple-400/60 font-mono">CONSCIOUSNESS</span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  systemStatus?.consciousness.available && systemStatus?.consciousness.healthy
                    ? "bg-green-400 animate-pulse"
                    : systemStatus?.consciousness.available
                      ? "bg-yellow-400"
                      : "bg-red-400",
                )}
              />
              <span className="text-sm text-purple-400 font-mono">
                {systemStatus?.consciousness.available ? "ONLINE" : "OFFLINE"}
              </span>
            </div>
            {systemStatus?.consciousness.available && (
              <div className="text-xs text-purple-400/60 font-mono">
                Coherence: {(systemStatus.consciousness.coherence * 100).toFixed(1)}%
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-1 mb-1">
              <Database className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-cyan-400/60 font-mono">HEIMDALL</span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  systemStatus?.heimdall.available && systemStatus?.heimdall.healthy
                    ? "bg-green-400 animate-pulse"
                    : systemStatus?.heimdall.available
                      ? "bg-yellow-400"
                      : "bg-red-400",
                )}
              />
              <span className="text-sm text-cyan-400 font-mono">
                {systemStatus?.heimdall.available ? "LINKED" : "OFFLINE"}
              </span>
            </div>
            {systemStatus?.heimdall.available && (
              <div className="text-xs text-cyan-400/60 font-mono">Memories: {systemStatus.heimdall.memoryCount}</div>
            )}
          </div>
        </div>

        {/* Console Toggle */}
        <div>
          <div className="flex items-center space-x-1 mb-2">
            <Terminal className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400/60 font-mono">CONSOLE ACCESS</span>
          </div>
          <button
            onClick={toggleConsole}
            className={cn(
              "w-full px-3 py-2 rounded text-sm font-mono transition-colors",
              consoleVisible
                ? "bg-green-500/20 border border-green-500/50 text-green-400"
                : "bg-green-500/10 border border-green-500/30 text-green-400/80 hover:bg-green-500/20",
            )}
          >
            {consoleVisible ? "CONSOLE ACTIVE" : "ACTIVATE CONSOLE"}
          </button>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center space-x-1 mb-2">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span className="text-xs text-yellow-400/60 font-mono">QUICK ACTIONS</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={dumpConsciousnessState}
              disabled={isLoading || !systemStatus?.consciousness.available}
              className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400 hover:bg-blue-500/20 transition-colors font-mono disabled:opacity-50"
            >
              DUMP STATE
            </button>
            <button
              onClick={() => boostCoherence(0.3)}
              disabled={isLoading || !systemStatus?.consciousness.available}
              className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400 hover:bg-yellow-500/20 transition-colors font-mono disabled:opacity-50"
            >
              BOOST +0.3
            </button>
            <button
              onClick={resetCoherence}
              disabled={isLoading || !systemStatus?.consciousness.available}
              className="px-2 py-1 bg-orange-500/10 border border-orange-500/30 rounded text-xs text-orange-400 hover:bg-orange-500/20 transition-colors font-mono disabled:opacity-50"
            >
              RESET COH
            </button>
            <button
              onClick={rebootHeimdall}
              disabled={isLoading || !systemStatus?.heimdall.available}
              className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs text-cyan-400 hover:bg-cyan-500/20 transition-colors font-mono disabled:opacity-50"
            >
              <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="border-t border-purple-500/30 pt-2">
          <div className="flex items-center justify-between text-xs text-purple-400/60">
            <span>System diagnostics active</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>MONITORING</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
