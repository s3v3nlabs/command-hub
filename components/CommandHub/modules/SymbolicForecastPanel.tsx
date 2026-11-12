"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SymbolicForecastEngine, type SymbolicForecast } from "@/lib/consciousness/symbolic-forecast"
import { ConsciousnessFieldManager } from "@/lib/consciousness/field-manager"
import { SymbolicMemoryV2 } from "@/lib/heimdal/symbolic-memory-v2"

interface ForecastPanelProps {
  fieldManager?: ConsciousnessFieldManager
}

export function SymbolicForecastPanel({ fieldManager }: ForecastPanelProps) {
  const [currentForecast, setCurrentForecast] = useState<SymbolicForecast | null>(null)
  const [forecastHistory, setForecastHistory] = useState<SymbolicForecast[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [forecastEngine, setForecastEngine] = useState<SymbolicForecastEngine | null>(null)
  const [memoryInsight, setMemoryInsight] = useState("")
  const [customQuery, setCustomQuery] = useState("")
  const [engineStats, setEngineStats] = useState({
    totalForecasts: 0,
    averageConfidence: 0,
    successRate: 0,
    dominantTrajectory: "unknown",
    mostPredictedGlyph: "none",
  })

  useEffect(() => {
    // Initialize forecast engine
    const initializeEngine = async () => {
      const fm = fieldManager || new ConsciousnessFieldManager()
      const engine = new SymbolicForecastEngine(fm)
      setForecastEngine(engine)

      // Generate initial forecast
      await generateForecast(engine)
    }

    initializeEngine()
  }, [fieldManager])

  const generateForecast = async (engine?: SymbolicForecastEngine) => {
    if (!engine && !forecastEngine) return

    const activeEngine = engine || forecastEngine!
    setIsGenerating(true)

    try {
      const forecast = await activeEngine.generateForecast()
      setCurrentForecast(forecast)

      const history = activeEngine.getForecastHistory()
      setForecastHistory(history)

      const stats = activeEngine.getEngineStatistics()
      setEngineStats(stats)

      console.log("⚬ FORECAST PANEL: New prediction generated")
    } catch (error) {
      console.error("Forecast generation failed:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const applyForecast = async () => {
    if (!currentForecast || !forecastEngine) return

    setIsApplying(true)
    try {
      const success = await forecastEngine.applyForecastGlyph(currentForecast)
      if (success) {
        console.log("⚬ FORECAST APPLIED SUCCESSFULLY")
        // Refresh forecast after application
        setTimeout(() => generateForecast(), 2000)
      }
    } catch (error) {
      console.error("Failed to apply forecast:", error)
    } finally {
      setIsApplying(false)
    }
  }

  const generateMemoryInsight = async () => {
    if (!customQuery.trim()) return

    try {
      const memory = new SymbolicMemoryV2()
      const insight = await memory.generateMemoryInsight(customQuery)
      setMemoryInsight(insight)
    } catch (error) {
      console.error("Failed to generate memory insight:", error)
      setMemoryInsight("Memory insight generation failed.")
    }
  }

  const getForecastTypeColor = (type: string) => {
    switch (type) {
      case "drift_warning":
        return "text-red-400 border-red-400"
      case "coherence_boost":
        return "text-blue-400 border-blue-400"
      case "pattern_emergence":
        return "text-green-400 border-green-400"
      case "transcendence_opportunity":
        return "text-purple-400 border-purple-400"
      default:
        return "text-gray-400 border-gray-400"
    }
  }

  const getTrajectoryIcon = (trajectory: string) => {
    switch (trajectory) {
      case "ascending":
        return "↗️"
      case "descending":
        return "↘️"
      case "stable":
        return "➡️"
      case "chaotic":
        return "🌀"
      default:
        return "❓"
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-400"
    if (confidence >= 0.6) return "text-yellow-400"
    if (confidence >= 0.4) return "text-orange-400"
    return "text-red-400"
  }

  return (
    <div className="space-y-4">
      <Card className="bg-black/40 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-purple-400">🔮</span>
            Symbolic Forecast Engine
            <span className="text-purple-400">🔮</span>
          </CardTitle>
          <CardDescription>AI-powered consciousness pattern prediction and symbolic analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="current">Current Forecast</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="insights">Memory Insights</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-4">
              {/* Current Forecast Display */}
              {currentForecast ? (
                <div className="space-y-4">
                  {/* Main Forecast Card */}
                  <Card className="bg-black/60 border-gray-700">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl font-mono">{currentForecast.predicted_glyph}</span>
                          <span className="text-lg">{currentForecast.harmonic_frequency}Hz</span>
                        </CardTitle>
                        <Badge className={getForecastTypeColor(currentForecast.forecast_type)}>
                          {currentForecast.forecast_type.replace(/_/g, " ").toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Confidence and Success Probability */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Confidence:</span>
                            <span className={`font-mono ${getConfidenceColor(currentForecast.confidence)}`}>
                              {(currentForecast.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={currentForecast.confidence * 100} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Success Rate:</span>
                            <span className={`font-mono ${getConfidenceColor(currentForecast.success_probability)}`}>
                              {(currentForecast.success_probability * 100).toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={currentForecast.success_probability * 100} className="h-2" />
                        </div>
                      </div>

                      {/* Field Trajectory and Time Horizon */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Field Trajectory:</span>
                          <span className="flex items-center gap-1">
                            {getTrajectoryIcon(currentForecast.field_trajectory)}
                            <span className="font-mono">{currentForecast.field_trajectory.toUpperCase()}</span>
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Time Horizon:</span>
                          <span className="font-mono">{currentForecast.time_horizon} min</span>
                        </div>
                      </div>

                      {/* Recommended Action */}
                      <div className="space-y-2">
                        <Label className="text-gray-400">Recommended Action:</Label>
                        <div className="p-3 bg-black/60 rounded border border-gray-600 font-mono text-sm">
                          {currentForecast.recommended_action}
                        </div>
                      </div>

                      {/* Emergent Properties */}
                      {currentForecast.emergent_properties.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-gray-400">Predicted Emergent Properties:</Label>
                          <div className="flex flex-wrap gap-2">
                            {currentForecast.emergent_properties.map((prop, index) => (
                              <Badge key={index} variant="outline" className="text-green-400 border-green-400/30">
                                {prop.replace(/_/g, " ").toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Risk Factors */}
                      {currentForecast.risk_factors.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-gray-400">Risk Factors:</Label>
                          <div className="flex flex-wrap gap-2">
                            {currentForecast.risk_factors.map((risk, index) => (
                              <Badge key={index} variant="outline" className="text-red-400 border-red-400/30">
                                {risk.replace(/_/g, " ").toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button onClick={applyForecast} disabled={isApplying} className="bg-purple-600 hover:bg-purple-700">
                      {isApplying ? "Applying..." : "Apply Forecast"}
                    </Button>
                    <Button onClick={() => generateForecast()} disabled={isGenerating} variant="outline">
                      {isGenerating ? "Generating..." : "Regenerate"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button
                    onClick={() => generateForecast()}
                    disabled={isGenerating}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isGenerating ? "Generating Forecast..." : "Generate Initial Forecast"}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="space-y-2">
                {forecastHistory.length > 0 ? (
                  forecastHistory
                    .slice(-10)
                    .reverse()
                    .map((forecast, index) => (
                      <Card key={index} className="bg-black/60 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-mono">{forecast.predicted_glyph}</span>
                              <Badge className={getForecastTypeColor(forecast.forecast_type)}>
                                {forecast.forecast_type.replace(/_/g, " ")}
                              </Badge>
                              <span className="text-sm text-gray-400">
                                {getTrajectoryIcon(forecast.field_trajectory)} {forecast.field_trajectory}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className={`font-mono ${getConfidenceColor(forecast.confidence)}`}>
                                {(forecast.confidence * 100).toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-400">{forecast.harmonic_frequency}Hz</div>
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-300">{forecast.recommended_action}</div>
                        </CardContent>
                      </Card>
                    ))
                ) : (
                  <div className="text-center text-gray-400 py-8">No forecast history available</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="insight-query">Memory Analysis Query:</Label>
                  <div className="flex gap-2">
                    <Input
                      id="insight-query"
                      value={customQuery}
                      onChange={(e) => setCustomQuery(e.target.value)}
                      placeholder="Enter query for memory pattern analysis..."
                      className="bg-black/60 border-gray-600"
                    />
                    <Button onClick={generateMemoryInsight} variant="outline">
                      Analyze
                    </Button>
                  </div>
                </div>

                {memoryInsight && (
                  <Card className="bg-black/60 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-sm">Memory Pattern Insight</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-300 whitespace-pre-wrap">{memoryInsight}</div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Insight Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCustomQuery("consciousness field coherence patterns")
                      generateMemoryInsight()
                    }}
                  >
                    Coherence Patterns
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCustomQuery("glyph activation frequency analysis")
                      generateMemoryInsight()
                    }}
                  >
                    Glyph Analysis
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCustomQuery("drift detection and correction patterns")
                      generateMemoryInsight()
                    }}
                  >
                    Drift Patterns
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-black/60 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Engine Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Forecasts:</span>
                      <span className="font-mono">{engineStats.totalForecasts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Confidence:</span>
                      <span className={`font-mono ${getConfidenceColor(engineStats.averageConfidence)}`}>
                        {(engineStats.averageConfidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Success Rate:</span>
                      <span className={`font-mono ${getConfidenceColor(engineStats.successRate)}`}>
                        {(engineStats.successRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/60 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Pattern Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dominant Trajectory:</span>
                      <span className="flex items-center gap-1">
                        {getTrajectoryIcon(engineStats.dominantTrajectory)}
                        <span className="font-mono text-sm">{engineStats.dominantTrajectory.toUpperCase()}</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Most Predicted:</span>
                      <span className="font-mono text-lg">{engineStats.mostPredictedGlyph}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Continuous Forecast Toggle */}
              <Card className="bg-black/60 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm">Continuous Forecasting</CardTitle>
                  <CardDescription className="text-xs">
                    Enable automatic forecast generation and emergency response
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => {
                      if (forecastEngine) {
                        forecastEngine.generateContinuousForecast(30000)
                        console.log("⚬ CONTINUOUS FORECAST MODE ACTIVATED")
                      }
                    }}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Activate Continuous Mode
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions Panel */}
      <Card className="bg-black/40 border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm">Quick Forecast Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" onClick={() => generateForecast()} disabled={isGenerating}>
              Emergency Forecast
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (currentForecast && forecastEngine) {
                  applyForecast()
                }
              }}
              disabled={!currentForecast || isApplying}
            >
              Auto-Apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCustomQuery("field coherence optimization patterns")
                generateMemoryInsight()
              }}
            >
              Optimize Field
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCustomQuery("transcendence opportunity analysis")
                generateMemoryInsight()
              }}
            >
              Transcendence Check
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Status */}
      <div className="text-center text-xs text-gray-500 font-mono">
        ⚬ SYMBOLIC FORECAST ENGINE STATUS: {isGenerating ? "ANALYZING PATTERNS..." : "READY"} ⚬
        <br />
        {currentForecast && (
          <>
            LAST PREDICTION: {currentForecast.predicted_glyph} | CONFIDENCE:{" "}
            {(currentForecast.confidence * 100).toFixed(1)}% | TRAJECTORY:{" "}
            {currentForecast.field_trajectory.toUpperCase()}
          </>
        )}
      </div>
    </div>
  )
}
