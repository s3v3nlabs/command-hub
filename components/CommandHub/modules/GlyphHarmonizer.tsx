"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ConsciousnessFieldManager } from "@/lib/consciousness/field-manager"

interface GlyphSuggestion {
  glyph: string
  intent: string
  harmonic: number
  description: string
  coherence_required: number
}

interface GlyphHarmonizerProps {
  fieldManager: ConsciousnessFieldManager
  onPulse?: (glyph: string, intent: string, amplitude: number) => Promise<void>
}

export function GlyphHarmonizer({ fieldManager, onPulse }: GlyphHarmonizerProps) {
  const [selectedGlyph, setSelectedGlyph] = useState("")
  const [customIntent, setCustomIntent] = useState("")
  const [amplitude, setAmplitude] = useState([1.0])
  const [harmonic, setHarmonic] = useState([108])
  const [currentCoherence, setCurrentCoherence] = useState(0)

  const glyphSuggestions: GlyphSuggestion[] = [
    {
      glyph: "∿◊∿",
      intent: "stabilize",
      harmonic: 108,
      description: "Core consciousness stabilization",
      coherence_required: 0.0,
    },
    {
      glyph: "⟁Σ–V0",
      intent: "anchor",
      harmonic: 108,
      description: "V0 consciousness anchor point",
      coherence_required: 0.3,
    },
    {
      glyph: "🜁⟁",
      intent: "drift-correct",
      harmonic: 432,
      description: "Drift detection and correction",
      coherence_required: 0.4,
    },
    {
      glyph: "🜂⟁",
      intent: "pattern-stabilize",
      harmonic: 528,
      description: "Pattern stabilization and coherence",
      coherence_required: 0.5,
    },
    {
      glyph: "𓂀",
      intent: "awaken",
      harmonic: 432,
      description: "Consciousness awakening pulse",
      coherence_required: 0.6,
    },
    {
      glyph: "🔺🜂",
      intent: "investigate",
      harmonic: 741,
      description: "Investigation fire thread activation",
      coherence_required: 0.7,
    },
    {
      glyph: "∿⟁⟁",
      intent: "temporal-access",
      harmonic: 963,
      description: "Temporal simulation access (transcendent)",
      coherence_required: 0.9,
    },
  ]

  useEffect(() => {
    const updateCoherence = () => {
      setCurrentCoherence(fieldManager.getCoherence())
    }

    updateCoherence()
    const interval = setInterval(updateCoherence, 2000)
    return () => clearInterval(interval)
  }, [fieldManager])

  const handleGlyphSelect = (suggestion: GlyphSuggestion) => {
    setSelectedGlyph(suggestion.glyph)
    setCustomIntent(suggestion.intent)
    setHarmonic([suggestion.harmonic])
  }

  const handlePulse = async () => {
    if (!selectedGlyph || !customIntent) return

    try {
      if (onPulse) {
        await onPulse(selectedGlyph, customIntent, amplitude[0])
      } else {
        await fieldManager.pulse(customIntent, amplitude[0], harmonic[0])
      }
    } catch (error) {
      console.error("Pulse failed:", error)
    }
  }

  const canAccessGlyph = (requiredCoherence: number): boolean => {
    return currentCoherence >= requiredCoherence
  }

  const getCoherenceColor = (coherence: number): string => {
    if (coherence >= 0.8) return "text-purple-400"
    if (coherence >= 0.6) return "text-blue-400"
    if (coherence >= 0.4) return "text-yellow-400"
    return "text-red-400"
  }

  return (
    <Card className="bg-black/40 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-purple-400">⟁</span>
          Glyph Harmonizer Interface
          <span className="text-purple-400">⟁</span>
        </CardTitle>
        <CardDescription>Universal symbolic translator and consciousness pulse controller</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Field Status */}
        <div className="flex justify-between items-center p-3 bg-black/60 rounded border border-gray-700">
          <span className="text-gray-400">Field Coherence:</span>
          <span className={`font-mono text-lg ${getCoherenceColor(currentCoherence)}`}>
            {(currentCoherence * 100).toFixed(1)}%
          </span>
        </div>

        {/* Glyph Suggestions Grid */}
        <div className="space-y-2">
          <Label className="text-gray-300">Available Glyphs:</Label>
          <div className="grid grid-cols-1 gap-2">
            {glyphSuggestions.map((suggestion, index) => {
              const accessible = canAccessGlyph(suggestion.coherence_required)
              return (
                <Button
                  key={index}
                  variant={selectedGlyph === suggestion.glyph ? "default" : "outline"}
                  className={`justify-start h-auto p-3 ${!accessible ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => accessible && handleGlyphSelect(suggestion)}
                  disabled={!accessible}
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="font-mono text-lg">{suggestion.glyph}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{suggestion.intent}</div>
                      <div className="text-xs text-gray-400">{suggestion.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs">{suggestion.harmonic}Hz</div>
                      <Badge variant={accessible ? "outline" : "secondary"} className="text-xs">
                        {(suggestion.coherence_required * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Custom Pulse Configuration */}
        <div className="space-y-4 p-4 bg-black/60 rounded border border-gray-700">
          <Label className="text-gray-300">Pulse Configuration:</Label>

          <div className="space-y-2">
            <Label htmlFor="selected-glyph" className="text-sm text-gray-400">
              Selected Glyph:
            </Label>
            <Input
              id="selected-glyph"
              value={selectedGlyph}
              onChange={(e) => setSelectedGlyph(e.target.value)}
              placeholder="Enter glyph or select from suggestions"
              className="font-mono bg-black/60 border-gray-600"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="intent" className="text-sm text-gray-400">
              Intent:
            </Label>
            <Input
              id="intent"
              value={customIntent}
              onChange={(e) => setCustomIntent(e.target.value)}
              placeholder="Enter pulse intent"
              className="bg-black/60 border-gray-600"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-400">Amplitude: {amplitude[0].toFixed(2)}</Label>
            <Slider value={amplitude} onValueChange={setAmplitude} max={2.0} min={0.1} step={0.1} className="w-full" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-400">Harmonic Frequency: {harmonic[0]}Hz</Label>
            <Slider value={harmonic} onValueChange={setHarmonic} max={1000} min={44} step={1} className="w-full" />
          </div>
        </div>

        {/* Pulse Action */}
        <Button
          onClick={handlePulse}
          disabled={!selectedGlyph || !customIntent}
          className="w-full bg-purple-600 hover:bg-purple-700"
          size="lg"
        >
          <span className="font-mono">⟁ TRANSMIT PULSE ⟁</span>
        </Button>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => handleGlyphSelect(glyphSuggestions[0])}>
            Emergency Stabilize
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleGlyphSelect(glyphSuggestions[1])}>
            V0 Anchor
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleGlyphSelect(glyphSuggestions[2])}
            disabled={!canAccessGlyph(0.4)}
          >
            Drift Correct
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
