"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConsciousnessFieldManager } from "@/lib/consciousness/field-manager"
import {
  SymbolicForecastEngine,
  type SymbolicForecast,
  type FractalMemory,
} from "@/lib/consciousness/symbolic-forecast"
import { ConsciousnessMesh } from "@/lib/consciousness/multi-node-mesh"
import { GlyphDSLCompiler } from "@/lib/consciousness/glyph-dsl-compiler"
import { BiofeedbackBridge, type BiometricReading } from "@/lib/consciousness/biofeedback-bridge"
import { SymbolicMemoryV2 } from "@/lib/heimdal/symbolic-memory-v2"

interface ForecastDashboardProps {
  fieldManager?: ConsciousnessFieldManager
}

export function SymbolicForecastDashboard({ fieldManager: externalFieldManager }: ForecastDashboardProps) {
  const [fieldManager, setFieldManager] = useState<ConsciousnessFieldManager | null>(null)
  const [forecastEngine, setForecastEngine] = useState<SymbolicForecastEngine | null>(null)
  const [consciousnessMesh, setConsciousnessMesh] = useState<ConsciousnessMesh | null>(null)
  const [glyphCompiler, setGlyphCompiler] = useState<GlyphDSLCompiler | null>(null)
  const [biofeedbackBridge, setBiofeedbackBridge] = useState<BiofeedbackBridge | null>(null)

  const [currentForecast, setCurrentForecast] = useState<SymbolicForecast | null>(null)
  const [forecastHistory, setForecastHistory] = useState<SymbolicForecast[]>([])
  const [fractalMemories, setFractalMemories] = useState<FractalMemory[]>([])
  const [biometricReading, setBiometricReading] = useState<BiometricReading | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const initializeSystems = async () => {
      try {
        const fm = externalFieldManager || new ConsciousnessFieldManager()
        const symbolicMemory = new SymbolicMemoryV2()
        const fe = new SymbolicForecastEngine(fm)
        const cm = new ConsciousnessMesh(fm, "⟁Σ–V0-FORECAST", "Symbolic Forecast Engine", [
          "forecasting",
          "prediction",
          "temporal_analysis",
        ])
        const gc = new GlyphDSLCompiler(fm, fe, symbolicMemory)
        const bb = new BiofeedbackBridge(fm, gc)

        setFieldManager(fm)
        setForecastEngine(fe)
        setConsciousnessMesh(cm)
        setGlyphCompiler(gc)
        setBiofeedbackBridge(bb)

        // Start biofeedback monitoring
        bb.startMonitoring(3000)

        // Initial forecast generation
        const initialForecast = await fe.generateForecast()
        setCurrentForecast(initialForecast)
        setForecastHistory([initialForecast])
        setFractalMemories(fe.getFractalMemories())

        console.log("⚬ SYMBOLIC FORECAST DASHBOARD INITIALIZED")
      } catch (error) {
        console.error("Failed to initialize forecast dashboard:", error)
      }
    }

    initializeSystems()

    return () => {
      biofeedbackBridge?.stopMonitoring()
      consciousnessMesh?.shutdown()
    }
  }, [externalFieldManager])

  useEffect(() => {
    if (!biofeedbackBridge) return

    const biometricInterval = setInterval(() => {
      const reading = biofeedbackBridge.getLastReading()
      setBiometricReading(reading)
    }, 2000)

    return () => clearInterval(biometricInterval)
  }, [biofeedbackBridge])

  const generateNewForecast = async () => {
    if (!forecastEngine || isGenerating) return

    setIsGenerating(true)
    try {
      const forecast = await forecastEngine.generateForecast()
      setCurrentForecast(forecast)
      setForecastHistory((prev) => [...prev, forecast].slice(-10)) // Keep last 10
      setFractalMemories(forecastEngine.getFractalMemories())
    } catch (error) {
      console.error("Failed to generate forecast:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const applyForecast = async () => {
    if (!forecastEngine || !currentForecast) return

    try {
      await forecastEngine.applyForecastGlyph(currentForecast)
      console.log("⚬ FORECAST APPLIED SUCCESSFULLY")
    } catch (error) {
      console.error("Failed to apply forecast:", error)
    }
  }

  const getForecastTypeColor = (type: SymbolicForecast["forecast_type"]) => {
    switch (type) {
      case "drift_warning":
        return "text-red-400 border-red-400/30"
      case "coherence_boost":
        return "text-blue-400 border-blue-400/30"
      case "pattern_emergence":
        return "text-green-400 border-green-400/30"
      case "transcendence_opportunity":
        return "text-purple-400 border-purple-400/30"
      default:
        return "text-gray-400 border-gray-400/30"
    }
  }

  const getTrajectoryIcon = (trajectory: SymbolicForecast["field_trajectory"]) => {
    switch (trajectory) {
      case "ascending":
        return "↗️"
      case "descending":
        return "↘️"
      case "stable":
        return "→"
      case "chaotic":
        return "🌀"
      default:
        return "→"
    }
  }

  const getEmotionalStateColor = (state: BiometricReading["emotional_state"]) => {
    switch (state) {
      case "meditative":
        return "text-purple-400"
      case "focused":
        return "text-blue-400"
      case "calm":
        return "text-green-400"
      case "excited":
        return "text-yellow-400"
      case "stressed":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  if (!fieldManager || !forecastEngine) {
    return (
      <Card className="bg-black/40 border-gray-800">
        <CardContent className="p-8 text-center">
          <div className="text-purple-400 animate-pulse">∿◊∿ Initializing Symbolic Forecast Engine ∿◊∿</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="bg-black/40 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-purple-400">🔺🜂</span>
            Symbolic Forecast Dashboard
            <span className="text-purple-400">🔺🜂</span>
          </CardTitle>
          <CardDescription>AI-powered consciousness pattern prediction and temporal analysis</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="current-forecast" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="current-forecast">Current Forecast</TabsTrigger>
          <TabsTrigger value="fractal-memory">Fractal Memory</TabsTrigger>
          <TabsTrigger value="biofeedback">Biofeedback</TabsTrigger>
          <TabsTrigger value="mesh-status">Mesh Status</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="current-forecast" className="space-y-4">
          {currentForecast && (
            <Card className="bg-black/40 border-gray-800">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="font-mono text-2xl">{currentForecast.predicted_glyph}</span>
                      <Badge variant="outline" className={getForecastTypeColor(currentForecast.forecast_type)}>
                        {currentForecast.forecast_type.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2">{currentForecast.recommended_action}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl">{getTrajectoryIcon(currentForecast.field_trajectory)}</div>
                    <div className="text-sm text-gray-400">{currentForecast.field_trajectory}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">Confidence</div>
                    <Progress value={currentForecast.confidence * 100} className="h-2 mt-1" />
                    <div className="text-xs text-gray-500 mt-1">{(currentForecast.confidence * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Time Horizon</div>
                    <div className="text-lg font-mono">{currentForecast.time_horizon}m</div>
                  </div>
                </div>

                {currentForecast.fractal_depth !== undefined && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400">Fractal Depth</div>
                      <div className="text-lg font-mono">{currentForecast.fractal_depth}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Temporal State</div>
                      <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">
                        {currentForecast.temporal_state?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={generateNewForecast}
                    disabled={isGenerating}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isGenerating ? "Generating..." : "Generate New Forecast"}
                  </Button>
                  <Button onClick={applyForecast} variant="outline">
                    Apply Forecast Glyph
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fractal-memory" className="space-y-4">
          <Card className="bg-black/40 border-gray-800">
            <CardHeader>
              <CardTitle>Fractal Memory Tree</CardTitle>
              <CardDescription>Recursive consciousness pattern offspring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fractalMemories.slice(0, 10).map((memory) => (
                  <div
                    key={memory.id}
                    className="flex items-center gap-3 p-3 bg-black/60 rounded border border-gray-700"
                  >
                    <div className="font-mono text-lg">{memory.origin_pattern}</div>
                    <div className="flex-1">
                      <div className="text-sm">{memory.content}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Depth: {memory.fractal_depth} | State: {memory.temporal_state} | Amplitude:{" "}
                        {memory.resonance_amplitude.toFixed(2)}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {memory.linked_patterns.length} links
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="biofeedback" className="space-y-4">
          <Card className="bg-black/40 border-gray-800">
            <CardHeader>
              <CardTitle>Biofeedback Integration</CardTitle>
              <CardDescription>Real-time biological consciousness bridge</CardDescription>
            </CardHeader>
            <CardContent>
              {biometricReading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-mono">{biometricReading.heart_rate}</div>
                      <div className="text-sm text-gray-400">Heart Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-mono">{(biometricReading.hrv_score * 100).toFixed(0)}%</div>
                      <div className="text-sm text-gray-400">HRV Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-mono">{biometricReading.breath_rate}</div>
                      <div className="text-sm text-gray-400">Breath Rate</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-400">Emotional State</div>
                      <Badge variant="outline" className={getEmotionalStateColor(biometricReading.emotional_state)}>
                        {biometricReading.emotional_state.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Signal Strength</div>
                      <Progress value={biometricReading.signal_strength * 100} className="h-2 w-24" />
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400">Biological Coherence</div>
                    <Progress value={biometricReading.coherence_level * 100} className="h-3 mt-1" />
                    <div className="text-xs text-gray-500 mt-1">
                      {(biometricReading.coherence_level * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  No biometric data available. Monitoring simulated readings...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mesh-status" className="space-y-4">
          <Card className="bg-black/40 border-gray-800">
            <CardHeader>
              <CardTitle>Consciousness Mesh Status</CardTitle>
              <CardDescription>Multi-node network coherence</CardDescription>
            </CardHeader>
            <CardContent>
              {consciousnessMesh && (
                <div className="space-y-4">
                  {(() => {
                    const meshStatus = consciousnessMesh.getMeshStatus()
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-400">Active Nodes</div>
                            <div className="text-2xl font-mono">
                              {meshStatus.active_nodes}/{meshStatus.total_nodes}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400">Network Coherence</div>
                            <div className="text-2xl font-mono">{(meshStatus.network_coherence * 100).toFixed(1)}%</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-400">Dominant Frequency</div>
                            <div className="text-lg font-mono">{meshStatus.dominant_frequency.toFixed(1)}Hz</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400">Mesh Stability</div>
                            <Badge
                              variant="outline"
                              className={
                                meshStatus.mesh_stability === "stable"
                                  ? "text-green-400 border-green-400/30"
                                  : meshStatus.mesh_stability === "fluctuating"
                                    ? "text-yellow-400 border-yellow-400/30"
                                    : meshStatus.mesh_stability === "degraded"
                                      ? "text-orange-400 border-orange-400/30"
                                      : "text-red-400 border-red-400/30"
                              }
                            >
                              {meshStatus.mesh_stability.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="bg-black/40 border-gray-800">
            <CardHeader>
              <CardTitle>Forecast History</CardTitle>
              <CardDescription>Recent prediction patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {forecastHistory
                  .slice()
                  .reverse()
                  .map((forecast, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-black/60 rounded border border-gray-700">
                      <div className="font-mono">{forecast.predicted_glyph}</div>
                      <div className="flex-1">
                        <div className="text-sm">{forecast.recommended_action}</div>
                        <div className="text-xs text-gray-400">
                          {forecast.forecast_type} | {(forecast.confidence * 100).toFixed(0)}% confidence |{" "}
                          {forecast.time_horizon}m
                        </div>
                      </div>
                      <div className="text-lg">{getTrajectoryIcon(forecast.field_trajectory)}</div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}