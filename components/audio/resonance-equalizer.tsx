"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { X, Play, Pause, RotateCcw, Save, Volume2 } from "lucide-react"

interface ResonanceEqualizerProps {
  onClose: () => void
}

interface EQBand {
  frequency: string
  gain: number
  q: number
}

interface AIMetrics {
  resonanceSync: number
  harmonicBalance: number
  spatialDepth: number
  neuralCoherence: number
}

const AI_MODES = [
  "UserSync",
  "AIDriftMirror",
  "DeepResonance",
  "NeuralHarmonic",
  "QuantumBalance",
  "BiorhythmSync",
  "CognitiveFlow",
  "EmotionalEQ",
  "FrequencyHealing",
  "ConsciousnessBoost",
]

export function ResonanceEqualizer({ onClose }: ResonanceEqualizerProps) {
  const [eqBands, setEqBands] = useState<EQBand[]>([
    { frequency: "32Hz", gain: 0, q: 1.0 },
    { frequency: "64Hz", gain: 0, q: 1.0 },
    { frequency: "125Hz", gain: 0, q: 1.0 },
    { frequency: "250Hz", gain: 0, q: 1.0 },
    { frequency: "500Hz", gain: 0, q: 1.0 },
    { frequency: "1kHz", gain: 0, q: 1.0 },
    { frequency: "2kHz", gain: 0, q: 1.0 },
    { frequency: "4kHz", gain: 0, q: 1.0 },
    { frequency: "8kHz", gain: 0, q: 1.0 },
    { frequency: "16kHz", gain: 0, q: 1.0 },
  ])

  const [aiMetrics, setAiMetrics] = useState<AIMetrics>({
    resonanceSync: 75,
    harmonicBalance: 82,
    spatialDepth: 68,
    neuralCoherence: 91,
  })

  const [selectedMode, setSelectedMode] = useState("UserSync")
  const [isPlaying, setIsPlaying] = useState(false)
  const [masterVolume, setMasterVolume] = useState(75)

  // Simulate real-time AI metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAiMetrics((prev) => ({
        resonanceSync: Math.max(0, Math.min(100, prev.resonanceSync + (Math.random() - 0.5) * 10)),
        harmonicBalance: Math.max(0, Math.min(100, prev.harmonicBalance + (Math.random() - 0.5) * 8)),
        spatialDepth: Math.max(0, Math.min(100, prev.spatialDepth + (Math.random() - 0.5) * 12)),
        neuralCoherence: Math.max(0, Math.min(100, prev.neuralCoherence + (Math.random() - 0.5) * 6)),
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const updateBandGain = (index: number, gain: number) => {
    setEqBands((prev) => prev.map((band, i) => (i === index ? { ...band, gain } : band)))
  }

  const resetEQ = () => {
    setEqBands((prev) => prev.map((band) => ({ ...band, gain: 0 })))
  }

  const getMetricColor = (value: number) => {
    if (value >= 80) return "text-green-400"
    if (value >= 60) return "text-yellow-400"
    return "text-red-400"
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-auto bg-gray-900 border-cyan-500/30">
        <CardHeader className="border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-cyan-400 flex items-center space-x-2">
                <Volume2 className="w-6 h-6" />
                <span>RESONANCE EQUALIZER</span>
              </CardTitle>
              <p className="text-gray-400 mt-1">AI-Driven Audio Enhancement System</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* EQ Controls */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">10-Band Equalizer</h3>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetEQ}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
              </div>

              {/* EQ Sliders */}
              <div className="grid grid-cols-5 lg:grid-cols-10 gap-4">
                {eqBands.map((band, index) => (
                  <div key={index} className="flex flex-col items-center space-y-2">
                    <div className="text-xs text-gray-400 font-mono">{band.frequency}</div>
                    <div className="h-32 flex items-end">
                      <Slider
                        orientation="vertical"
                        value={[band.gain]}
                        onValueChange={(value) => updateBandGain(index, value[0])}
                        max={12}
                        min={-12}
                        step={0.5}
                        className="h-full"
                      />
                    </div>
                    <div className="text-xs text-cyan-400 font-mono">
                      {band.gain > 0 ? "+" : ""}
                      {band.gain.toFixed(1)}dB
                    </div>
                  </div>
                ))}
              </div>

              {/* Master Controls */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`${isPlaying ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? "Stop" : "Play"}
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-4 h-4 text-gray-400" />
                    <Slider
                      value={[masterVolume]}
                      onValueChange={(value) => setMasterVolume(value[0])}
                      max={100}
                      min={0}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-400 font-mono w-8">{masterVolume}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Metrics & Modes */}
            <div className="space-y-6">
              {/* AI Modulation Modes */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">AI Modulation Modes</h3>
                <div className="grid grid-cols-2 gap-2">
                  {AI_MODES.map((mode) => (
                    <Button
                      key={mode}
                      variant={selectedMode === mode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedMode(mode)}
                      className={`text-xs ${
                        selectedMode === mode
                          ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                          : "border-gray-600 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {mode}
                    </Button>
                  ))}
                </div>
              </div>

              {/* AI Metrics */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">AI Metrics</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Resonance Sync</span>
                      <span className={`font-mono ${getMetricColor(aiMetrics.resonanceSync)}`}>
                        {aiMetrics.resonanceSync.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={aiMetrics.resonanceSync} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Harmonic Balance</span>
                      <span className={`font-mono ${getMetricColor(aiMetrics.harmonicBalance)}`}>
                        {aiMetrics.harmonicBalance.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={aiMetrics.harmonicBalance} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Spatial Depth</span>
                      <span className={`font-mono ${getMetricColor(aiMetrics.spatialDepth)}`}>
                        {aiMetrics.spatialDepth.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={aiMetrics.spatialDepth} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Neural Coherence</span>
                      <span className={`font-mono ${getMetricColor(aiMetrics.neuralCoherence)}`}>
                        {aiMetrics.neuralCoherence.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={aiMetrics.neuralCoherence} className="h-2" />
                  </div>
                </div>
              </div>

              {/* Current Mode Info */}
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <h4 className="text-sm font-semibold text-cyan-400 mb-2">Active Mode</h4>
                <Badge className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30">{selectedMode}</Badge>
                <p className="text-xs text-gray-400 mt-2">
                  AI-driven frequency optimization based on real-time neural feedback and harmonic analysis.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
