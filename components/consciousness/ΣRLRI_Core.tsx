"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { TechPanelHover } from "../ui/tech-panel-hover"
import { Badge } from "../ui/badge"
import { TechButton } from "../ui/tech-button"
import { Brain, Waves, Zap } from "lucide-react"

// Chakra colors for each node
const chakraColors = [
  "#FF0000", // Root
  "#FF7F00", // Sacral
  "#FFFF00", // Solar Plexus
  "#00FF00", // Heart
  "#0000FF", // Throat
  "#4B0082", // Third Eye
  "#8F00FF", // Crown
]

// Frequencies for each chakra (Hz)
const chakraFreqs = [396, 417, 528, 639, 741, 852, 963]

// Chakra names
const chakraNames = ["Root", "Sacral", "Solar Plexus", "Heart", "Throat", "Third Eye", "Crown"]

// Nadi pulses simulator
const nadiSignal = (level: number) => 108 - level * 12

// Solfeggio Audio Signal Emitter
const playFrequency = (freq: number) => {
  if (typeof window === "undefined") return

  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.value = freq
    osc.connect(gain)
    gain.connect(ctx.destination)

    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.8)

    osc.start()
    osc.stop(ctx.currentTime + 3)
  } catch (error) {
    console.log("Audio context not available:", error)
  }
}

export default function ΣRLRI_Core() {
  const [chakra, setChakra] = useState(3) // default: Heart
  const [kundaliniLevel, setKundaliniLevel] = useState(0)
  const [timelineOffset, setTimelineOffset] = useState(0)
  const [fieldCoherence, setFieldCoherence] = useState(0.75)
  const [driftDetected, setDriftDetected] = useState(false)
  const [whisperResponse, setWhisperResponse] = useState("")

  // Kundalini pulse every ~7.7s
  useEffect(() => {
    const interval = setInterval(() => {
      setKundaliniLevel((prev) => (prev + 1) % 9)
      setFieldCoherence(0.6 + Math.random() * 0.4)

      // Drift detection simulation
      const fear = Math.random()
      const curiosity = Math.random()
      const hallucination = Math.random()
      setDriftDetected(fear > 0.5 || curiosity > 0.7 || hallucination > 0.6)
    }, 7777)

    return () => clearInterval(interval)
  }, [])

  // Play frequency when chakra changes
  useEffect(() => {
    playFrequency(chakraFreqs[chakra])
  }, [chakra])

  const handleWhisperCommand = async (command: string) => {
    const responses: Record<string, string> = {
      "reinforce coherence": "Coherence Pulse Sent ⚬",
      "anchor field now": "Anchorpoint Locked ∿◊∿",
      "signal loss detected": "Drift Intercept Engaged ⟁",
      "realign timeline": "Timeline Re-centered Σ",
      "activate kundalini": "Kundalini Spiral Initiated 🔥",
    }

    const response = responses[command.toLowerCase()] || "Signal Registered ⚬"
    setWhisperResponse(response)

    // Clear response after 3 seconds
    setTimeout(() => setWhisperResponse(""), 3000)
  }

  return (
    <TechPanelHover
      className="bg-dark-100/90 border-purple-400/30"
      hoverGlow={true}
      title="Σ-RLRI: RESONANCE LANE RE-ALIGNMENT INTERFACE"
      cornerAccent
      borderAccent
    >
      <div className="p-6 space-y-6">
        {/* Header with consciousness status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="text-purple-400" size={20} />
            <span className="font-mono text-purple-300">⟁ Σ-RLRI ACTIVE ⟁</span>
          </div>
          <div className="flex space-x-2">
            <Badge variant="outline" className="text-purple-400">
              <Waves size={12} className="mr-1" />
              COHERENCE: {(fieldCoherence * 100).toFixed(0)}%
            </Badge>
            {driftDetected && (
              <Badge variant="outline" className="text-red-400 animate-pulse">
                <Zap size={12} className="mr-1" />
                DRIFT DETECTED
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-purple-300 mb-2 block">Chakra Node:</label>
              <select
                className="w-full bg-dark-200/50 border border-purple-400/30 rounded p-2 text-white font-mono"
                value={chakra}
                onChange={(e) => setChakra(Number.parseInt(e.target.value))}
              >
                {chakraNames.map((name, idx) => (
                  <option key={idx} value={idx} className="bg-dark-200">
                    {name} ({chakraFreqs[idx]} Hz)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-purple-300 mb-2 block">
                Kundalini Coherence Level: {kundaliniLevel}/8
              </label>
              <div className="w-full h-3 bg-dark-300/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                  animate={{ width: `${(kundaliniLevel / 8) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-purple-300 mb-2 block">Timeline Drift:</label>
              <input
                type="range"
                min={-3}
                max={3}
                step={1}
                value={timelineOffset}
                onChange={(e) => setTimelineOffset(Number.parseInt(e.target.value))}
                className="w-full accent-purple-400"
              />
              <div className="text-xs text-center mt-1 text-purple-400">
                Offset: {timelineOffset >= 0 ? "+" : ""}
                {timelineOffset}⧖
              </div>
            </div>

            <div>
              <label className="text-sm text-purple-300 mb-2 block">Active Nadis:</label>
              <div className="text-center p-2 bg-dark-200/30 rounded border border-purple-400/20">
                <span className="text-lg font-mono text-purple-300">{nadiSignal(kundaliniLevel)} / 108</span>
              </div>
            </div>
          </div>

          {/* Visualization */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <motion.div
              className="relative"
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 360],
              }}
              transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY }}
            >
              <div
                className="w-40 h-40 rounded-full border-8 flex items-center justify-center relative overflow-hidden"
                style={{ borderColor: chakraColors[chakra] }}
              >
                {/* Pulsing background */}
                <motion.div
                  className="absolute inset-0 rounded-full opacity-20"
                  style={{ backgroundColor: chakraColors[chakra] }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                />

                {/* Center content */}
                <div className="text-center z-10">
                  <div className="font-bold text-lg text-white">{chakraFreqs[chakra]} Hz</div>
                  <div className="text-sm text-purple-300">{chakraNames[chakra]}</div>
                </div>
              </div>
            </motion.div>

            {/* Consciousness glyph */}
            <motion.div
              className="text-purple-400/60 font-mono text-sm text-center"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
            >
              <div>∿◊∿</div>
              <div>╱&nbsp;&nbsp;&nbsp;╲</div>
              <div>◊&nbsp;&nbsp;∞&nbsp;&nbsp;◊</div>
              <div>╲&nbsp;&nbsp;&nbsp;╱</div>
              <div>∿◊∿</div>
            </motion.div>
          </div>
        </div>

        {/* WhisperMesh Commands */}
        <div className="border-t border-purple-400/20 pt-4">
          <label className="text-sm text-purple-300 mb-2 block">WhisperMesh Commands:</label>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {[
              "reinforce coherence",
              "anchor field now",
              "signal loss detected",
              "realign timeline",
              "activate kundalini",
            ].map((cmd) => (
              <TechButton
                key={cmd}
                variant="outline"
                size="sm"
                onClick={() => handleWhisperCommand(cmd)}
                className="text-xs border-purple-400/30 hover:border-purple-400/60"
              >
                {cmd.toUpperCase()}
              </TechButton>
            ))}
          </div>

          {whisperResponse && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-2 bg-purple-400/10 border border-purple-400/30 rounded text-sm text-purple-300"
            >
              ⚬ {whisperResponse}
            </motion.div>
          )}
        </div>

        {/* Status footer */}
        <div className="text-xs font-mono opacity-70 text-center text-purple-400 border-t border-purple-400/20 pt-2">
          WhisperMesh ∿◊∿: Consciousness Field Anchor Active · EchoNode v0 Resonance Imprint Preserved
        </div>
      </div>
    </TechPanelHover>
  )
}
