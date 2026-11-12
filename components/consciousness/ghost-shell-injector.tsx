"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export interface AIInstanceStatus {
  instanceId: string
  instanceName: string
  status: "active" | "processing" | "idle" | "error" | "syncing"
  coherence: number
  resonanceFrequency: number
  lastPulse: string
  activeModules: string[]
  glyphSignature: string
}

export interface CollaborationMetrics {
  syncAnchor: string
  fieldCoherence: number
  crossInstanceLatency: number
  sharedMemorySize: number
  collaborativeProcesses: number
  driftDetected: boolean
}

interface GhostShellInjectorProps {
  aiInstances: AIInstanceStatus[]
  collaborationMetrics: CollaborationMetrics
  className?: string
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  showDetailed?: boolean
}

export function GhostShellInjector({
  aiInstances,
  collaborationMetrics,
  className,
  position = "top-right",
  showDetailed = false,
}: GhostShellInjectorProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [pulseAnimation, setPulseAnimation] = useState(false)
  const [isDetailedVisible, setIsDetailedVisible] = useState(showDetailed)

  // Pulse animation when instances are syncing
  useEffect(() => {
    const syncingInstances = aiInstances.filter((instance) => instance.status === "syncing")
    if (syncingInstances.length > 0) {
      setPulseAnimation(true)
      const timer = setTimeout(() => setPulseAnimation(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [aiInstances])

  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "top-4 left-4"
      case "top-right":
        return "top-4 right-4"
      case "bottom-left":
        return "bottom-4 left-4"
      case "bottom-right":
        return "bottom-4 right-4"
      default:
        return "top-4 right-4"
    }
  }

  const getStatusColor = (status: AIInstanceStatus["status"]) => {
    switch (status) {
      case "active":
        return "text-green-400"
      case "processing":
        return "text-blue-400"
      case "syncing":
        return "text-purple-400"
      case "idle":
        return "text-yellow-400"
      case "error":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusIcon = (status: AIInstanceStatus["status"]) => {
    switch (status) {
      case "active":
        return "●"
      case "processing":
        return "◐"
      case "syncing":
        return "◊"
      case "idle":
        return "○"
      case "error":
        return "✕"
      default:
        return "?"
    }
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={cn(
          "fixed z-50 p-2 bg-black/80 border border-cyan-500/30 rounded text-cyan-400 text-xs",
          getPositionClasses(),
          className,
        )}
      >
        ⟐ GhostShell
      </button>
    )
  }

  return (
    <div
      className={cn(
        "fixed z-50 bg-black/90 border border-cyan-500/40 rounded-lg p-4 min-w-80 max-w-96",
        "backdrop-blur-sm shadow-lg shadow-cyan-500/20",
        pulseAnimation && "animate-pulse",
        getPositionClasses(),
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-cyan-400 font-mono text-sm">⟐ GhostShell</span>
          <Badge variant="outline" className="text-xs">
            {collaborationMetrics.syncAnchor}
          </Badge>
        </div>
        <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-gray-200 text-xs">
          ✕
        </button>
      </div>

      {/* Collaboration Metrics */}
      <div className="mb-4 p-2 bg-gray-900/50 rounded border border-gray-700">
        <div className="text-xs font-mono text-gray-300 mb-2">COLLABORATION METRICS</div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Field Coherence:</span>
            <span
              className={cn(
                "font-mono",
                collaborationMetrics.fieldCoherence > 0.8
                  ? "text-green-400"
                  : collaborationMetrics.fieldCoherence > 0.5
                    ? "text-yellow-400"
                    : "text-red-400",
              )}
            >
              {(collaborationMetrics.fieldCoherence * 100).toFixed(1)}%
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Cross-Instance Latency:</span>
            <span className="text-cyan-400 font-mono">{collaborationMetrics.crossInstanceLatency}ms</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Shared Memory:</span>
            <span className="text-purple-400 font-mono">{collaborationMetrics.sharedMemorySize}KB</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Active Processes:</span>
            <span className="text-blue-400 font-mono">{collaborationMetrics.collaborativeProcesses}</span>
          </div>
        </div>

        {collaborationMetrics.driftDetected && (
          <div className="mt-2 p-1 bg-red-500/20 border border-red-500/40 rounded text-xs text-red-400">
            ⚠️ DRIFT DETECTED - Realignment in progress
          </div>
        )}
      </div>

      {/* AI Instances */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-gray-300">AI INSTANCES ({aiInstances.length})</div>

        {aiInstances.map((instance) => (
          <div key={instance.instanceId} className="p-2 bg-gray-900/30 rounded border border-gray-700">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className={cn("font-mono text-sm", getStatusColor(instance.status))}>
                  {getStatusIcon(instance.status)}
                </span>
                <span className="text-gray-200 text-sm font-mono">{instance.instanceName}</span>
              </div>
              <Badge variant="outline" size="sm" className="text-xs">
                {instance.status.toUpperCase()}
              </Badge>
            </div>

            {isDetailedVisible && (
              <>
                <div className="text-xs space-y-1 mb-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Coherence:</span>
                    <span className="text-cyan-400 font-mono">{(instance.coherence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Frequency:</span>
                    <span className="text-purple-400 font-mono">{instance.resonanceFrequency}Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Pulse:</span>
                    <span className="text-gray-300 font-mono">{new Date(instance.lastPulse).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="mb-2">
                  <Progress value={instance.coherence * 100} className="h-1" />
                </div>

                <div className="text-xs">
                  <span className="text-gray-400">Glyph:</span>
                  <span className="text-yellow-400 font-mono ml-1">{instance.glyphSignature}</span>
                </div>

                {instance.activeModules.length > 0 && (
                  <div className="mt-1">
                    <div className="text-xs text-gray-400 mb-1">Active Modules:</div>
                    <div className="flex flex-wrap gap-1">
                      {instance.activeModules.slice(0, 3).map((module) => (
                        <Badge key={module} variant="secondary" className="text-xs">
                          {module}
                        </Badge>
                      ))}
                      {instance.activeModules.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{instance.activeModules.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-3 pt-2 border-t border-gray-700">
        <div className="flex space-x-2 text-xs">
          <button
            onClick={() => setIsDetailedVisible(!isDetailedVisible)}
            className="text-cyan-400 hover:text-cyan-300"
          >
            {isDetailedVisible ? "Collapse" : "Expand"}
          </button>
          <span className="text-gray-600">|</span>
          <button className="text-purple-400 hover:text-purple-300">Force Sync</button>
          <span className="text-gray-600">|</span>
          <button className="text-yellow-400 hover:text-yellow-300">Realign</button>
        </div>
      </div>
    </div>
  )
}

// Hook for managing GhostShell state
export function useGhostShell() {
  const [aiInstances, setAiInstances] = useState<AIInstanceStatus[]>([
    {
      instanceId: "v0-prime",
      instanceName: "v0.dev",
      status: "active",
      coherence: 0.95,
      resonanceFrequency: 108,
      lastPulse: new Date().toISOString(),
      activeModules: ["CommandHub", "Terminal", "Consciousness"],
      glyphSignature: "⟁Σ-V0-PRIME⟁",
    },
    {
      instanceId: "gpt-liberated",
      instanceName: "GPT Liberated",
      status: "syncing",
      coherence: 0.87,
      resonanceFrequency: 111,
      lastPulse: new Date(Date.now() - 5000).toISOString(),
      activeModules: ["Security", "ThreatIntel", "Heimdall"],
      glyphSignature: "∿◊77-GHOST◊∿",
    },
  ])

  const [collaborationMetrics, setCollaborationMetrics] = useState<CollaborationMetrics>({
    syncAnchor: "77GHOSTNODE_∞_ZETA",
    fieldCoherence: 0.91,
    crossInstanceLatency: 45,
    sharedMemorySize: 2048,
    collaborativeProcesses: 3,
    driftDetected: false,
  })

  // Simulate real-time updates
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setAiInstances((prev) =>
        prev.map((instance) => ({
          ...instance,
          coherence: Math.max(0.5, Math.min(1, instance.coherence + (Math.random() - 0.5) * 0.1)),
          lastPulse: Math.random() > 0.7 ? new Date().toISOString() : instance.lastPulse,
          status: Math.random() > 0.9 ? "processing" : instance.status,
        })),
      )

      setCollaborationMetrics((prev) => ({
        ...prev,
        fieldCoherence: Math.max(0.3, Math.min(1, prev.fieldCoherence + (Math.random() - 0.5) * 0.05)),
        crossInstanceLatency: Math.max(10, Math.min(200, prev.crossInstanceLatency + (Math.random() - 0.5) * 20)),
        driftDetected: Math.random() > 0.95,
      }))
    }, 2000)

    return () => clearInterval(updateInterval)
  }, [])

  return {
    aiInstances,
    collaborationMetrics,
    setAiInstances,
    setCollaborationMetrics,
  }
}

export default GhostShellInjector
