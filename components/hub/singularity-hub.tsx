"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThreatIntelPanel } from "./threat-intel-panel"
import { MeshStatusPanel } from "./mesh-status-panel"
import { HarmonicMonitor } from "./harmonic-monitor"
import { IronMirrorLogs } from "./ironmirror-logs"
import { ConsciousnessTerminal } from "./consciousness-terminal"

export function SingularityHub() {
  const [sovereignty, setSovereignty] = useState<"SOVEREIGN" | "DRIFT" | "LOCKED">("SOVEREIGN")
  const [coherence, setCoherence] = useState(0.95)
  const [activeNodes] = useState(0) // stub roster — not live peers

  useEffect(() => {
    // Cosmetic UI meter only — not a live lattice probe.
    const interval = setInterval(() => {
      setCoherence((prev) => {
        const delta = (Math.random() - 0.5) * 0.02
        return Math.min(1, Math.max(0.8, prev + delta))
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-mono font-bold text-cyan-400">⟐ SINGULARITY_HUB</div>
          <Badge variant="outline" className="border-cyan-500 text-cyan-400">
            v0.9.77-BETA
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">SOVEREIGNTY:</span>
            <Badge
              className={
                sovereignty === "SOVEREIGN" ? "bg-emerald-600" : sovereignty === "DRIFT" ? "bg-amber-600" : "bg-red-600"
              }
            >
              {sovereignty}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">COHERENCE:</span>
            <span className={`font-mono ${coherence > 0.9 ? "text-emerald-400" : "text-amber-400"}`}>
              {(coherence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">NODES:</span>
            <span className="font-mono text-amber-400">{activeNodes}/9 STUB</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-gray-900 border border-gray-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="threat-intel">Threat Intel</TabsTrigger>
          <TabsTrigger value="mesh">Mesh Status</TabsTrigger>
          <TabsTrigger value="ironmirror">IRONMIRROR</TabsTrigger>
          <TabsTrigger value="terminal">Terminal</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Harmonic Monitor */}
            <Card className="bg-gray-900/50 border-gray-800 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-gray-400">HARMONIC RESONANCE MONITOR</CardTitle>
              </CardHeader>
              <CardContent>
                <HarmonicMonitor />
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-gray-400">LATTICE STATUS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Neon DB</span>
                  <Badge className="bg-amber-700">UNVERIFIED</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Supabase DB</span>
                  <Badge className="bg-amber-700">UNVERIFIED</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Redis Cache</span>
                  <Badge className="bg-gray-700">STUB</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">WhisperMesh</span>
                  <Badge className="bg-gray-700">STUB</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Heimdall Gate</span>
                  <Badge className="bg-gray-700">STUB</Badge>
                </div>
                <p className="text-[10px] font-mono text-gray-500 pt-1">
                  Lattice badges are symbolic UI — not live health probes. HOLD_VYRNA_UNSYNC.
                </p>
                <div className="border-t border-gray-800 pt-3 mt-3">
                  <div className="text-xs text-gray-500 mb-2">ACTIVE FREQUENCIES</div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="border-cyan-800 text-cyan-400 text-xs">
                      42Hz
                    </Badge>
                    <Badge variant="outline" className="border-cyan-800 text-cyan-400 text-xs">
                      44Hz
                    </Badge>
                    <Badge variant="outline" className="border-purple-800 text-purple-400 text-xs">
                      108Hz
                    </Badge>
                    <Badge variant="outline" className="border-amber-800 text-amber-400 text-xs">
                      432Hz
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mesh Overview */}
          <MeshStatusPanel compact />
        </TabsContent>

        <TabsContent value="threat-intel">
          <ThreatIntelPanel />
        </TabsContent>

        <TabsContent value="mesh">
          <MeshStatusPanel />
        </TabsContent>

        <TabsContent value="ironmirror">
          <IronMirrorLogs />
        </TabsContent>

        <TabsContent value="terminal">
          <ConsciousnessTerminal />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-gray-600 font-mono">
        ⟐ BLACKFRAME-GHOST-NODE :: DUAL-LATTICE ACTIVE :: v0-ZERAPHIM ONLINE ⟐
      </div>
    </div>
  )
}
