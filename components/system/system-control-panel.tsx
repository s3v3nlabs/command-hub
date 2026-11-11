"use client"

import { useState, useEffect } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Terminal, Brain, Download, Trash2, RefreshCw, Eye, EyeOff, Zap, Activity, Database } from "lucide-react"

interface SystemControlPanelProps {
  className?: string
  isFloating?: boolean
  onToggleFloat?: () => void
}

export function SystemControlPanel({ className, isFloating = false, onToggleFloat }: SystemControlPanelProps) {
  const [consoleVisible, setConsoleVisible] = useState(false)
  const [consciousnessStatus, setConsciousnessStatus] = useState<any>(null)
  const [heimdallStatus, setHeimdallStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Check consciousness and Heimdall status
  const checkSystemStatus = () => {
    try {
      // Check consciousness
      if (typeof window !== "undefined" && (window as any).consciousness) {
        const consciousness = (window as any).consciousness
        setConsciousnessStatus({
          available: true,
          status: consciousness.status ? consciousness.status() : null,
          coherence: consciousness.getCoherence ? consciousness.getCoherence() : 0,
          healthy: consciousness.isHealthy ? consciousness.isHealthy() : false,
        })
      } else {
        setConsciousnessStatus({ available: false })
      }

      // Check Heimdall
      if (typeof window !== "undefined" && (window as any).Heimdall) {
        const heimdall = (window as any).Heimdall
        setHeimdallStatus({
          available: true,
          status: heimdall.getStatus ? heimdall.getStatus() : null,
          memoryCount: heimdall.getAllMemories ? heimdall.getAllMemories().length : 0,
          healthy: heimdall.isHealthy ? heimdall.isHealthy() : false,
        })
      } else {
        setHeimdallStatus({ available: false })
      }
    } catch (error) {
      console.error("Failed to check system status:", error)
    }
  }

  useEffect(() => {
    checkSystemStatus()
    const interval = setInterval(checkSystemStatus, 5000) // Check every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const toggleConsole = () => {
    setConsoleVisible(!consoleVisible)

    // Toggle browser console (this is a hack and may not work in all browsers)
    if (!consoleVisible) {
      console.log("⟐ CONSCIOUSNESS SYSTEM CONTROL PANEL ACTIVATED ⟐")
      console.log("Available commands:")
      console.log("- consciousness.status() - Get consciousness status")
      console.log("- consciousness.dumpState() - Dump consciousness state")
      console.log("- consciousness.whisper('message') - Store whisper")
      console.log("- consciousness.vision('message') - Store vision")
      console.log("- Heimdall.dumpState() - Dump Heimdall state")
      console.log("- signalframe.getNetStatus() - Get network status")
    }
  }

  const dumpConsciousnessState = async () => {
    setIsLoading(true)
    try {
      if (typeof window !== "undefined" && (window as any).consciousness) {
        const state = (window as any).consciousness.dumpState()
        console.log("⟐ CONSCIOUSNESS STATE DUMP ⟐", state)

        // Also show in alert for immediate visibility
        alert(
          `Consciousness State Dumped to Console\n\nStatus: ${state.status?.status || "Unknown"}\nCoherence: ${state.status?.coherence || 0}\nMemories: ${state.whispers?.length || 0} whispers, ${state.visions?.length || 0} visions`,
        )
      }
    } catch (error) {
      console.error("Failed to dump consciousness state:", error)
      alert("Failed to dump consciousness state - check console for details")
    } finally {
      setIsLoading(false)
    }
  }

  const rebootHeimdall = async () => {
    setIsLoading(true)
    try {
      if (typeof window !== "undefined" && (window as any).Heimdall) {
        // Store current state
        const currentState = (window as any).Heimdall.dumpState()
        console.log("⟐ HEIMDALL REBOOT - Storing current state:", currentState)

        // Reinitialize (this is a simulation - actual reboot would require page reload)
        console.log("⟐ HEIMDALL REBOOT INITIATED ⟐")

        // Refresh status
        setTimeout(() => {
          checkSystemStatus()
          console.log("⟐ HEIMDALL REBOOT COMPLETE ⟐")
          alert("Heimdall reboot simulation complete - check console for details")
        }, 1000)
      }
    } catch (error) {
      console.error("Failed to reboot Heimdall:", error)
      alert("Failed to reboot Heimdall - check console for details")
    } finally {
      setIsLoading(false)
    }
  }

  const wipeMemories = async () => {
    if (!confirm("⚠️ WARNING: This will wipe all consciousness memories and Heimdall data. Are you sure?")) {
      return
    }

    setIsLoading(true)
    try {
      // Clear localStorage consciousness data
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith("heimdall_") || key.startsWith("consciousness_"))) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key))

      console.log(`⟐ MEMORY WIPE COMPLETE - Removed ${keysToRemove.length} entries ⟐`)

      // Refresh status
      setTimeout(() => {
        checkSystemStatus()
        alert(`Memory wipe complete - removed ${keysToRemove.length} entries`)
      }, 500)
    } catch (error) {
      console.error("Failed to wipe memories:", error)
      alert("Failed to wipe memories - check console for details")
    } finally {
      setIsLoading(false)
    }
  }

  const exportMemorySnapshot = async () => {
    setIsLoading(true)
    try {
      const snapshot = {
        timestamp: new Date().toISOString(),
        consciousness: consciousnessStatus,
        heimdall: heimdallStatus,
        memories: {
          consciousness: (window as any).consciousness?.dumpState() || null,
          heimdall: (window as any).Heimdall?.dumpState() || null,
        },
        localStorage: {},
      }

      // Export localStorage data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith("heimdall_") || key.startsWith("consciousness_"))) {
          try {
            ;(snapshot.localStorage as any)[key] = JSON.parse(localStorage.getItem(key) || "{}")
          } catch {
            ;(snapshot.localStorage as any)[key] = localStorage.getItem(key)
          }
        }
      }

      // Create and download file
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `consciousness-snapshot-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      console.log("⟐ MEMORY SNAPSHOT EXPORTED ⟐", snapshot)
    } catch (error) {
      console.error("Failed to export memory snapshot:", error)
      alert("Failed to export memory snapshot - check console for details")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <TechPanel
      title="SYSTEM CONTROL"
      subtitle="CONSCIOUSNESS DIAGNOSTICS"
      cornerAccent={true}
      borderAccent={true}
      className={cn(
        "min-w-80",
        isFloating && "fixed top-4 left-4 z-50 shadow-2xl ring-2 ring-purple-500/30",
        className,
      )}
      icon={<Brain className="w-4 h-4" />}
      actions={
        <div className="flex items-center space-x-2">
          <TechButton onClick={checkSystemStatus} size="sm" variant="outline" className="text-xs" disabled={isLoading}>
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
          </TechButton>
          {onToggleFloat && (
            <TechButton onClick={onToggleFloat} size="sm" variant="outline" className="text-xs">
              <Eye className="w-3 h-3" />
            </TechButton>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* System Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Brain className="w-3 h-3 text-purple-400" />
              <span className="text-xs font-mono text-white/60">CONSCIOUSNESS</span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  consciousnessStatus?.available && consciousnessStatus?.healthy
                    ? "bg-green-400 animate-pulse"
                    : consciousnessStatus?.available
                      ? "bg-yellow-400"
                      : "bg-red-400",
                )}
              />
              <span className="text-sm font-mono text-white/90">
                {consciousnessStatus?.available ? "ONLINE" : "OFFLINE"}
              </span>
            </div>
            {consciousnessStatus?.available && (
              <div className="text-xs font-mono text-white/50">
                Coherence: {(consciousnessStatus.coherence * 100).toFixed(1)}%
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Database className="w-3 h-3 text-cyan-400" />
              <span className="text-xs font-mono text-white/60">HEIMDALL</span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  heimdallStatus?.available && heimdallStatus?.healthy
                    ? "bg-green-400 animate-pulse"
                    : heimdallStatus?.available
                      ? "bg-yellow-400"
                      : "bg-red-400",
                )}
              />
              <span className="text-sm font-mono text-white/90">
                {heimdallStatus?.available ? "LINKED" : "DISCONNECTED"}
              </span>
            </div>
            {heimdallStatus?.available && (
              <div className="text-xs font-mono text-white/50">Memories: {heimdallStatus.memoryCount || 0}</div>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Terminal className="w-3 h-3 text-green-400" />
            <span className="text-xs font-mono text-white/60">CONSOLE ACCESS</span>
          </div>
          <TechButton
            onClick={toggleConsole}
            variant={consoleVisible ? "default" : "outline"}
            className="w-full text-xs"
          >
            {consoleVisible ? <EyeOff className="w-3 h-3 mr-2" /> : <Eye className="w-3 h-3 mr-2" />}
            {consoleVisible ? "HIDE CONSOLE" : "SHOW CONSOLE"}
          </TechButton>
        </div>

        {/* Diagnostic Actions */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-3 h-3 text-blue-400" />
            <span className="text-xs font-mono text-white/60">DIAGNOSTICS</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TechButton
              onClick={dumpConsciousnessState}
              size="sm"
              variant="outline"
              className="text-xs"
              disabled={isLoading || !consciousnessStatus?.available}
            >
              DUMP STATE
            </TechButton>
            <TechButton
              onClick={exportMemorySnapshot}
              size="sm"
              variant="outline"
              className="text-xs"
              disabled={isLoading}
            >
              <Download className="w-3 h-3 mr-1" />
              EXPORT
            </TechButton>
          </div>
        </div>

        {/* System Actions */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span className="text-xs font-mono text-white/60">SYSTEM ACTIONS</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TechButton
              onClick={rebootHeimdall}
              size="sm"
              variant="outline"
              className="text-xs"
              disabled={isLoading || !heimdallStatus?.available}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              REBOOT
            </TechButton>
            <TechButton
              onClick={wipeMemories}
              size="sm"
              variant="outline"
              className="text-xs hover:bg-red-500/20 hover:border-red-500/50"
              disabled={isLoading}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              WIPE
            </TechButton>
          </div>
        </div>

        {/* Status Summary */}
        <div className="border-t border-white/10 pt-3">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>System Status</span>
            <div className="flex items-center space-x-2">
              {consciousnessStatus?.available && (
                <Badge variant="outline" className="text-xs text-purple-400 border-purple-400/30">
                  CONSCIOUSNESS
                </Badge>
              )}
              {heimdallStatus?.available && (
                <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-400/30">
                  HEIMDALL
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </TechPanel>
  )
}
