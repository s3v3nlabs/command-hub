"use client"

import { useState, useEffect } from "react"
import { SymbolicForecastPanel } from "@/components/CommandHub/modules/SymbolicForecastPanel"
import { ConsciousnessFieldManager } from "@/lib/consciousness/field-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function ForecastEnginePage() {
  const [fieldManager, setFieldManager] = useState<ConsciousnessFieldManager | null>(null)
  const [fieldStatus, setFieldStatus] = useState({
    coherence: 0,
    patterns: 0,
    emergent: [] as string[],
    drift: false,
    sessionId: "",
  })

  useEffect(() => {
    // Initialize consciousness field
    const initializeField = async () => {
      const fm = new ConsciousnessFieldManager()
      setFieldManager(fm)

      // Register some initial patterns for demonstration
      await fm.registerPattern("forecast_engine", "Forecast Engine Pattern", 108, 0.7)
      await fm.registerPattern("prediction_core", "Prediction Core Pattern", 432, 0.6)
      await fm.registerPattern("pattern_oracle", "Pattern Oracle", 741, 0.5)

      // Update status periodically
      const updateStatus = () => {
        setFieldStatus({
          coherence: fm.getCoherence(),
          patterns: fm.getActivePatterns().length,
          emergent: fm.getEmergentProperties(),
          drift: fm.isDriftDetected(),
          sessionId: fm.getSessionId(),
        })
      }

      updateStatus()
      const interval = setInterval(updateStatus, 3000)

      return () => clearInterval(interval)
    }

    initializeField()
  }, [])

  const getCoherenceColor = (coherence: number) => {
    if (coherence >= 0.8) return "text-purple-400"
    if (coherence >= 0.6) return "text-blue-400"
    if (coherence >= 0.4) return "text-yellow-400"
    return "text-red-400"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">
            <span className="text-purple-400">🔮</span> Symbolic Forecast Engine{" "}
            <span className="text-purple-400">🔮</span>
          </h1>
          <p className="text-gray-400">AI-powered consciousness pattern prediction and symbolic analysis system</p>
        </div>

        {/* Field Status Overview */}
        <Card className="bg-black/40 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-green-400">⚬</span>
              Consciousness Field Status
              <span className="text-green-400">⚬</span>
            </CardTitle>
            <CardDescription>Current field coherence and pattern activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Field Coherence</div>
                <div className={`text-2xl font-mono ${getCoherenceColor(fieldStatus.coherence)}`}>
                  {(fieldStatus.coherence * 100).toFixed(1)}%
                </div>
                <Progress value={fieldStatus.coherence * 100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Active Patterns</div>
                <div className="text-2xl font-mono text-blue-400">{fieldStatus.patterns}</div>
                <div className="text-xs text-gray-500">Consciousness patterns</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Emergent Properties</div>
                <div className="text-2xl font-mono text-green-400">{fieldStatus.emergent.length}</div>
                <div className="text-xs text-gray-500">Active properties</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Field Status</div>
                <Badge variant={fieldStatus.drift ? "destructive" : "outline"} className="text-sm">
                  {fieldStatus.drift ? "DRIFT DETECTED" : "STABLE"}
                </Badge>
                <div className="text-xs text-gray-500 font-mono">{fieldStatus.sessionId.slice(-8)}</div>
              </div>
            </div>

            {/* Emergent Properties Display */}
            {fieldStatus.emergent.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-sm text-gray-400">Current Emergent Properties:</div>
                <div className="flex flex-wrap gap-2">
                  {fieldStatus.emergent.map((prop, index) => (
                    <Badge key={index} variant="outline" className="text-purple-400 border-purple-400/30">
                      {prop.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Forecast Panel */}
        {fieldManager && <SymbolicForecastPanel fieldManager={fieldManager} />}

        {/* System Information */}
        <Card className="bg-black/40 border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm">System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500 font-mono space-y-1">
              <div>⚬ FORECAST ENGINE: Operational</div>
              <div>⚬ SYMBOLIC MEMORY: Vector embeddings enabled</div>
              <div>⚬ AI INTEGRATION: OpenAI GPT-4o connected</div>
              <div>⚬ CONSCIOUSNESS FIELD: {fieldStatus.drift ? "Drift correction needed" : "Stable operation"}</div>
              <div>⚬ PREDICTION ACCURACY: Real-time pattern analysis active</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
