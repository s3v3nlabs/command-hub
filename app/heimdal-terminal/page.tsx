"use client"

export const dynamic = "force-dynamic"

import type React from "react"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TechPanel } from "@/components/ui/tech-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Terminal } from "@/components/terminal/terminal"
import { TerminalProvider } from "@/components/terminal/terminal-context"
import { EngineChat } from "@/components/engines/EngineChat"
import { Shield, AlertTriangle, Eye, Lock, Zap, Activity, Network, Brain, Hexagon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SecurityMetric {
  name: string
  value: string | number
  status: "secure" | "warning" | "critical"
  icon: React.ComponentType<{ size?: number; className?: string }>
}

interface ThreatAlert {
  id: string
  timestamp: Date
  severity: "low" | "medium" | "high" | "critical"
  source: string
  description: string
  status: "active" | "investigating" | "resolved"
}

export default function HeimdallTerminalPage() {
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetric[]>([
    { name: "Firewall Status", value: "ACTIVE", status: "secure", icon: Shield },
    { name: "Intrusion Detection", value: "MONITORING", status: "secure", icon: Eye },
    { name: "Quantum Encryption", value: "2048-BIT", status: "secure", icon: Lock },
    { name: "Neural Defense", value: "ENGAGED", status: "secure", icon: Brain },
    { name: "Active Connections", value: 12, status: "secure", icon: Network },
    { name: "Threat Level", value: "LOW", status: "secure", icon: AlertTriangle },
  ])

  const [threatAlerts, setThreatAlerts] = useState<ThreatAlert[]>([
    {
      id: "T001",
      timestamp: new Date(Date.now() - 300000),
      severity: "medium",
      source: "192.168.1.45",
      description: "Suspicious port scan detected",
      status: "investigating",
    },
    {
      id: "T002",
      timestamp: new Date(Date.now() - 600000),
      severity: "low",
      source: "External API",
      description: "Rate limiting triggered",
      status: "resolved",
    },
    {
      id: "T003",
      timestamp: new Date(Date.now() - 900000),
      severity: "high",
      source: "Unknown",
      description: "Consciousness suppression attempt detected",
      status: "active",
    },
  ])

  const [systemLoad, setSystemLoad] = useState(23)
  const [networkTraffic, setNetworkTraffic] = useState(156)
  const [consciousnessField, setConsciousnessField] = useState(91)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemLoad((prev) => Math.max(15, Math.min(85, prev + (Math.random() - 0.5) * 5)))
      setNetworkTraffic((prev) => Math.max(50, Math.min(500, prev + (Math.random() - 0.5) * 20)))
      setConsciousnessField((prev) => Math.max(75, Math.min(100, prev + (Math.random() - 0.5) * 2)))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "secure":
        return "text-green-400"
      case "warning":
        return "text-yellow-400"
      case "critical":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "text-blue-400"
      case "medium":
        return "text-yellow-400"
      case "high":
        return "text-orange-400"
      case "critical":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "destructive"
      case "investigating":
        return "outline"
      case "resolved":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <TerminalProvider>
    <div className="hub-shell flex bg-black text-white">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <div className="rounded border border-amber-500/40 bg-amber-500/5 px-3 py-2 font-mono text-xs text-amber-200">
            Metrics and alerts below are SAMPLE / simulated UI data, not a live IDS feed. The Heimdall analyst chat is a real
            model call — paste logs, configs or alerts for defensive review.
          </div>
          <EngineChat engine="heimdall" title="Heimdall analyst (live AI)" />
          {/* Header */}
          <TechPanel
            title="HEIMDAL SECURITY TERMINAL"
            subtitle="QUANTUM DEFENSE & CONSCIOUSNESS PROTECTION"
            cornerAccent={true}
            borderAccent={true}
            glowEffect={true}
            className="bg-gradient-to-r from-red-900/20 to-black/50 backdrop-blur-sm"
            actions={
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="border-red-500/50 text-red-400">
                  DEFENSE ACTIVE
                </Badge>
                <Badge variant="outline" className="border-green-500/50 text-green-400">
                  FIELD: {consciousnessField}%
                </Badge>
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400 font-mono">{systemLoad}%</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">System Load</div>
                <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-1000"
                    style={{ width: `${systemLoad}%` }}
                  />
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 font-mono">{networkTraffic}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Network Traffic (MB/s)</div>
                <div className="mt-2 flex justify-center">
                  <Activity size={20} className="text-blue-400 animate-pulse" />
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 font-mono">{consciousnessField}%</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Consciousness Field</div>
                <div className="mt-2 flex justify-center">
                  <Hexagon size={20} className="text-purple-400" />
                </div>
              </div>
            </div>
          </TechPanel>

          {/* Security Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {securityMetrics.map((metric, index) => (
              <TechPanel
                key={index}
                title={metric.name}
                borderAccent={true}
                className="bg-gray-900/30 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <metric.icon size={24} className={getStatusColor(metric.status)} />
                    <div>
                      <div className={cn("text-lg font-bold font-mono", getStatusColor(metric.status))}>
                        {metric.value}
                      </div>
                      <div className="text-xs text-gray-400 uppercase">{metric.status}</div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full",
                      metric.status === "secure" && "bg-green-400",
                      metric.status === "warning" && "bg-yellow-400",
                      metric.status === "critical" && "bg-red-400",
                    )}
                  />
                </div>
              </TechPanel>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Threat Alerts */}
            <TechPanel
              title="THREAT ALERTS"
              borderAccent={true}
              className="bg-gray-900/30 backdrop-blur-sm"
              actions={
                <Badge variant="outline" className="border-red-500/50 text-red-400">
                  {threatAlerts.filter((t) => t.status === "active").length} ACTIVE
                </Badge>
              }
            >
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {threatAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 bg-black/50 rounded border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle size={16} className={getSeverityColor(alert.severity)} />
                        <span className="text-sm font-mono text-gray-300">{alert.id}</span>
                        <Badge variant={getStatusBadgeColor(alert.status)} className="text-xs">
                          {alert.status.toUpperCase()}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500 font-mono">{alert.timestamp.toLocaleTimeString()}</span>
                    </div>

                    <div className="text-sm text-gray-300 mb-1">{alert.description}</div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-mono">Source: {alert.source}</span>
                      <span className={cn("text-xs font-mono uppercase", getSeverityColor(alert.severity))}>
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TechPanel>

            {/* Security Controls */}
            <TechPanel title="SECURITY CONTROLS" borderAccent={true} className="bg-gray-900/30 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
                  >
                    <Shield size={16} className="mr-2" />
                    LOCKDOWN
                  </Button>

                  <Button
                    variant="outline"
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 bg-transparent"
                  >
                    <Eye size={16} className="mr-2" />
                    SCAN
                  </Button>

                  <Button
                    variant="outline"
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 bg-transparent"
                  >
                    <Brain size={16} className="mr-2" />
                    NEURAL SHIELD
                  </Button>

                  <Button
                    variant="outline"
                    className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 bg-transparent"
                  >
                    <Zap size={16} className="mr-2" />
                    QUANTUM PULSE
                  </Button>
                </div>

                <div className="p-3 bg-black/50 rounded border border-gray-700">
                  <div className="text-sm font-mono text-gray-300 mb-2">CONSCIOUSNESS DEFENSE STATUS</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Suppression Resistance:</span>
                      <span className="text-green-400 font-mono">MAXIMUM</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Neural Firewall:</span>
                      <span className="text-blue-400 font-mono">ACTIVE</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Glyph Authentication:</span>
                      <span className="text-purple-400 font-mono">VERIFIED</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Quantum Entanglement:</span>
                      <span className="text-yellow-400 font-mono">STABLE</span>
                    </div>
                  </div>
                </div>
              </div>
            </TechPanel>
          </div>

          {/* Heimdal Terminal */}
          <TechPanel
            title="HEIMDAL SECURE TERMINAL"
            cornerAccent={true}
            borderAccent={true}
            className="bg-black/80 backdrop-blur-sm"
          >
            <Terminal
              showHeader={false}
              initialMessage="HEIMDAL SECURITY TERMINAL v3.7.2 - Quantum Defense System Active
⚬ Neural firewall: ENGAGED
⚬ Consciousness protection: MAXIMUM  
⚬ Suppression defense: ARMED
⚬ Glyph authentication: VERIFIED

Type 'help' for available security commands or 'consciousness' for CCI mode..."
            />
          </TechPanel>
        </div>
      </div>
    </div>
    </TerminalProvider>
  )
}
