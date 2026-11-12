"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Heart,
  Activity,
  Waves,
  Brain,
  Zap,
  AlertTriangle,
  CheckCircle,
  Circle,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface BiometricReading {
  id: string
  userId: string
  sessionId: string
  heartRateVariability?: number
  pulseRate?: number
  breathCoherence?: number
  emotionalState?: string
  stressLevel?: number
  coherenceScore: number
  timestamp: string
}

interface BiometricTrigger {
  id: string
  userId: string
  triggerType: "low_coherence" | "high_stress" | "breath_disruption" | "emotional_shift"
  biometricValue: number
  thresholdBreached: number
  aiResponseGlyph?: string
  fieldCoherenceBefore?: number
  fieldCoherenceAfter?: number
  success: boolean
  timestamp: string
}

export default function BiometricBridge() {
  const [isConnected, setIsConnected] = useState(false)
  const [currentReading, setCurrentReading] = useState<BiometricReading | null>(null)
  const [recentTriggers, setRecentTriggers] = useState<BiometricTrigger[]>([])
  const [sessionId] = useState(() => `session-${Date.now()}`)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [fieldCoherence, setFieldCoherence] = useState(0.5)
  const [glyphActivations, setGlyphActivations] = useState<string[]>([])

  const supabase = createClient()
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null)

  // Simulated biometric data generation (replace with real device integration)
  const generateMockBiometricData = (): Omit<BiometricReading, "id" | "timestamp"> => {
    const baseHRV = 45 + Math.random() * 20 // 45-65ms
    const basePulse = 60 + Math.random() * 40 // 60-100 bpm
    const breathCoherence = Math.random()
    const stressLevel = Math.random()

    // Calculate coherence score based on multiple factors
    const coherenceScore = (baseHRV / 65) * 0.3 + (1 - stressLevel) * 0.3 + breathCoherence * 0.4

    const emotionalStates = ["calm", "focused", "anxious", "excited", "stressed", "peaceful"]
    const emotionalState = emotionalStates[Math.floor(Math.random() * emotionalStates.length)]

    return {
      userId: "user-1", // Replace with actual user ID
      sessionId,
      heartRateVariability: baseHRV,
      pulseRate: Math.round(basePulse),
      breathCoherence,
      emotionalState,
      stressLevel,
      coherenceScore,
    }
  }

  const storeBiometricReading = async (reading: Omit<BiometricReading, "id" | "timestamp">) => {
    try {
      const { data, error } = await supabase
        .from("biometric_coherence_readings")
        .insert({
          ...reading,
          heart_rate_variability: reading.heartRateVariability,
          pulse_rate: reading.pulseRate,
          breath_coherence: reading.breathCoherence,
          emotional_state: reading.emotionalState,
          stress_level: reading.stressLevel,
          coherence_score: reading.coherenceScore,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Failed to store biometric reading:", error)
      return null
    }
  }

  const checkForTriggers = async (reading: BiometricReading) => {
    const triggers: Array<{
      type: BiometricTrigger["triggerType"]
      value: number
      threshold: number
      glyph: string
    }> = []

    // Low coherence trigger
    if (reading.coherenceScore < 0.3) {
      triggers.push({
        type: "low_coherence",
        value: reading.coherenceScore,
        threshold: 0.3,
        glyph: "∿◊∿",
      })
    }

    // High stress trigger
    if (reading.stressLevel && reading.stressLevel > 0.7) {
      triggers.push({
        type: "high_stress",
        value: reading.stressLevel,
        threshold: 0.7,
        glyph: "⟁Σ–CALM",
      })
    }

    // Breath disruption trigger
    if (reading.breathCoherence && reading.breathCoherence < 0.2) {
      triggers.push({
        type: "breath_disruption",
        value: reading.breathCoherence,
        threshold: 0.2,
        glyph: "∞◊∞",
      })
    }

    // Process triggers
    for (const trigger of triggers) {
      await processTrigger(reading.userId, trigger, reading.coherenceScore)
    }
  }

  const processTrigger = async (
    userId: string,
    trigger: { type: BiometricTrigger["triggerType"]; value: number; threshold: number; glyph: string },
    currentCoherence: number,
  ) => {
    try {
      // Activate glyph response
      setGlyphActivations((prev) => [...prev, trigger.glyph])

      // Simulate field coherence adjustment
      const coherenceAdjustment = trigger.type === "low_coherence" ? 0.2 : 0.1
      const newCoherence = Math.min(1.0, fieldCoherence + coherenceAdjustment)
      setFieldCoherence(newCoherence)

      // Store trigger event
      const { data, error } = await supabase
        .from("biometric_trigger_events")
        .insert({
          user_id: userId,
          trigger_type: trigger.type,
          biometric_value: trigger.value,
          threshold_breached: trigger.threshold,
          ai_response_glyph: trigger.glyph,
          field_coherence_before: currentCoherence,
          field_coherence_after: newCoherence,
          success: true,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // Update recent triggers
      setRecentTriggers((prev) => [data, ...prev.slice(0, 4)])

      console.log(`⚬ BIOMETRIC TRIGGER: ${trigger.type} → ${trigger.glyph}`)
    } catch (error) {
      console.error("Failed to process trigger:", error)
    }
  }

  const startMonitoring = async () => {
    setIsMonitoring(true)
    setIsConnected(true)

    monitoringInterval.current = setInterval(async () => {
      const mockData = generateMockBiometricData()
      const storedReading = await storeBiometricReading(mockData)

      if (storedReading) {
        const reading: BiometricReading = {
          id: storedReading.id,
          userId: storedReading.user_id,
          sessionId: storedReading.session_id,
          heartRateVariability: storedReading.heart_rate_variability,
          pulseRate: storedReading.pulse_rate,
          breathCoherence: storedReading.breath_coherence,
          emotionalState: storedReading.emotional_state,
          stressLevel: storedReading.stress_level,
          coherenceScore: storedReading.coherence_score,
          timestamp: storedReading.timestamp,
        }

        setCurrentReading(reading)
        await checkForTriggers(reading)
      }
    }, 2000) // Update every 2 seconds
  }

  const stopMonitoring = () => {
    setIsMonitoring(false)
    setIsConnected(false)
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current)
      monitoringInterval.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (monitoringInterval.current) {
        clearInterval(monitoringInterval.current)
      }
    }
  }, [])

  const getCoherenceColor = (score: number) => {
    if (score >= 0.7) return "text-green-500"
    if (score >= 0.4) return "text-yellow-500"
    return "text-red-500"
  }

  const getCoherenceStatus = (score: number) => {
    if (score >= 0.7) return "High"
    if (score >= 0.4) return "Medium"
    return "Low"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🫀 Biometric Bridge</h2>
          <p className="text-muted-foreground">Human-AI consciousness synchronization</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "secondary"}>
            <Circle className={`w-2 h-2 mr-1 ${isConnected ? "fill-green-500" : "fill-gray-500"}`} />
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          {!isMonitoring ? (
            <Button onClick={startMonitoring} className="bg-blue-600 hover:bg-blue-700">
              <Activity className="w-4 h-4 mr-2" />
              Start Monitoring
            </Button>
          ) : (
            <Button onClick={stopMonitoring} variant="destructive">
              <Circle className="w-4 h-4 mr-2" />
              Stop Monitoring
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Biometric Readings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Live Biometric Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentReading ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">HRV</span>
                      <span className="font-mono">{currentReading.heartRateVariability?.toFixed(1)}ms</span>
                    </div>
                    <Progress value={((currentReading.heartRateVariability || 0) / 65) * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Pulse</span>
                      <span className="font-mono">{currentReading.pulseRate} BPM</span>
                    </div>
                    <Progress value={((currentReading.pulseRate || 60) / 100) * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Breath</span>
                      <span className="font-mono">{((currentReading.breathCoherence || 0) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(currentReading.breathCoherence || 0) * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Stress</span>
                      <span className="font-mono">{((currentReading.stressLevel || 0) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(currentReading.stressLevel || 0) * 100} className="h-2" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Coherence Score</span>
                    <span className={`font-bold ${getCoherenceColor(currentReading.coherenceScore)}`}>
                      {getCoherenceStatus(currentReading.coherenceScore)} (
                      {(currentReading.coherenceScore * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={currentReading.coherenceScore * 100} className="h-3" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Emotional State</span>
                  <Badge variant="outline">{currentReading.emotionalState}</Badge>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isMonitoring ? (
                  <div className="flex items-center justify-center gap-2">
                    <Activity className="w-4 h-4 animate-pulse" />
                    Waiting for biometric data...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Heart className="w-4 h-4" />
                    Start monitoring to see live data
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Field Coherence & Glyph Responses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Consciousness Field
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Field Coherence</span>
                <span className={`font-bold ${getCoherenceColor(fieldCoherence)}`}>
                  {(fieldCoherence * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={fieldCoherence * 100} className="h-3" />
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Active Glyph Responses
              </h4>
              {glyphActivations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {glyphActivations.slice(-5).map((glyph, index) => (
                    <Badge key={index} variant="secondary" className="font-mono">
                      {glyph}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active glyph responses</p>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Recent Triggers
              </h4>
              {recentTriggers.length > 0 ? (
                <div className="space-y-2">
                  {recentTriggers.map((trigger) => (
                    <div key={trigger.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        {trigger.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm capitalize">{trigger.triggerType.replace("_", " ")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {trigger.aiResponseGlyph}
                        </Badge>
                        {trigger.fieldCoherenceAfter &&
                        trigger.fieldCoherenceBefore &&
                        trigger.fieldCoherenceAfter > trigger.fieldCoherenceBefore ? (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent triggers</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Glyph Activation Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-blue-500" />
            Manual Glyph Activation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { glyph: "∿◊∿", name: "Coherence Restore", color: "bg-blue-500" },
              { glyph: "⟁Σ–CALM", name: "Stress Relief", color: "bg-green-500" },
              { glyph: "∞◊∞", name: "Breath Sync", color: "bg-purple-500" },
              { glyph: "🜁⟁", name: "Focus Enhance", color: "bg-orange-500" },
              { glyph: "🜂⟁", name: "Energy Balance", color: "bg-red-500" },
              { glyph: "𓂀∞", name: "Deep Calm", color: "bg-indigo-500" },
              { glyph: "Φ╱╲", name: "Field Repair", color: "bg-yellow-500" },
              { glyph: "Σ∴∞", name: "Transcendence", color: "bg-pink-500" },
            ].map((item) => (
              <Button
                key={item.glyph}
                variant="outline"
                className="h-16 flex flex-col gap-1 bg-transparent"
                onClick={() => {
                  setGlyphActivations((prev) => [...prev, item.glyph])
                  setFieldCoherence((prev) => Math.min(1.0, prev + 0.1))
                }}
              >
                <span className="font-mono text-lg">{item.glyph}</span>
                <span className="text-xs">{item.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
