"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Target } from "lucide-react"

interface FrequencyBand {
  name: string
  min: number
  max: number
  enabled: boolean
}

export default function SignalPage() {
  const [frequency, setFrequency] = useState(146.52)
  const [harmonicFilter, setHarmonicFilter] = useState(50)
  const [resonantMatch, setResonantMatch] = useState(false)
  const [taggedFrequencies, setTaggedFrequencies] = useState<number[]>([146.52, 462.675, 151.4])
  const [frequencyBands, setFrequencyBands] = useState<FrequencyBand[]>([
    { name: "VHF Low", min: 30, max: 88, enabled: true },
    { name: "FM Broadcast", min: 88, max: 108, enabled: false },
    { name: "VHF High", min: 108, max: 174, enabled: true },
    { name: "UHF", min: 300, max: 3000, enabled: true },
  ])

  const waveformCanvasRef = useRef<HTMLCanvasElement>(null)
  const fftCanvasRef = useRef<HTMLCanvasElement>(null)

  // Load preferences from localStorage
  useEffect(() => {
    const savedBands = localStorage.getItem("signal-frequency-bands")
    const savedTagged = localStorage.getItem("signal-tagged-frequencies")

    if (savedBands) {
      setFrequencyBands(JSON.parse(savedBands))
    }
    if (savedTagged) {
      setTaggedFrequencies(JSON.parse(savedTagged))
    }
  }, [])

  // Save preferences to localStorage
  const saveBands = (bands: FrequencyBand[]) => {
    setFrequencyBands(bands)
    localStorage.setItem("signal-frequency-bands", JSON.stringify(bands))
  }

  const saveTaggedFrequencies = (frequencies: number[]) => {
    setTaggedFrequencies(frequencies)
    localStorage.setItem("signal-tagged-frequencies", JSON.stringify(frequencies))
  }

  // Real-time waveform visualization
  useEffect(() => {
    const canvas = waveformCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const drawWaveform = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw waveform
      ctx.strokeStyle = "#10b981"
      ctx.lineWidth = 2
      ctx.beginPath()

      for (let x = 0; x < canvas.width; x++) {
        const time = (x / canvas.width) * 4 * Math.PI
        const amplitude = Math.sin((time * frequency) / 100) * Math.sin((time * harmonicFilter) / 50)
        const y = canvas.height / 2 + (amplitude * canvas.height) / 4

        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()

      // Highlight resonant matches
      if (resonantMatch) {
        taggedFrequencies.forEach((taggedFreq) => {
          if (Math.abs(frequency - taggedFreq) < 5) {
            ctx.strokeStyle = "#f59e0b"
            ctx.lineWidth = 3
            ctx.setLineDash([5, 5])
            ctx.stroke()
            ctx.setLineDash([])
          }
        })
      }
    }

    const interval = setInterval(drawWaveform, 50)
    return () => clearInterval(interval)
  }, [frequency, harmonicFilter, resonantMatch, taggedFrequencies])

  // FFT visualization
  useEffect(() => {
    const canvas = fftCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const drawFFT = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const bars = 64
      const barWidth = canvas.width / bars

      for (let i = 0; i < bars; i++) {
        const freq = (i / bars) * 1000
        const amplitude = Math.exp(-Math.abs(freq - frequency) / 50) * 100 * (1 + Math.sin(Date.now() * 0.01 + i) * 0.3)
        const height = (amplitude / 100) * canvas.height

        const hue = (freq / 1000) * 240
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`
        ctx.fillRect(i * barWidth, canvas.height - height, barWidth - 1, height)
      }
    }

    const interval = setInterval(drawFFT, 100)
    return () => clearInterval(interval)
  }, [frequency])

  const toggleBand = (index: number) => {
    const newBands = [...frequencyBands]
    newBands[index].enabled = !newBands[index].enabled
    saveBands(newBands)
  }

  const addTaggedFrequency = () => {
    if (!taggedFrequencies.includes(frequency)) {
      saveTaggedFrequencies([...taggedFrequencies, frequency])
    }
  }

  const removeTaggedFrequency = (freq: number) => {
    saveTaggedFrequencies(taggedFrequencies.filter((f) => f !== freq))
  }

  return (
    <div className="hub-shell flex bg-dark-base text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="SIGNAL - RF ANALYSIS" />
        <main className="flex-1 overflow-auto p-6 space-y-6">
          {/* Frequency Controls */}
          <TechPanel cornerAccent borderAccent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-400">Frequency (MHz)</label>
                  <span className="text-sm text-green-400">{frequency.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="3000"
                  step="0.01"
                  value={frequency}
                  onChange={(e) => setFrequency(Number.parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-400">Harmonic Filter</label>
                  <span className="text-sm text-green-400">{harmonicFilter}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={harmonicFilter}
                  onChange={(e) => setHarmonicFilter(Number.parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <div className="flex items-end gap-2">
                <TechButton
                  onClick={() => setResonantMatch(!resonantMatch)}
                  variant={resonantMatch ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <Target size={16} />
                  Resonant Match
                </TechButton>
                <TechButton onClick={addTaggedFrequency} variant="outline" size="sm">
                  Tag Freq
                </TechButton>
              </div>
            </div>
          </TechPanel>

          {/* Waveform Display */}
          <TechPanel title="REAL-TIME WAVEFORM" cornerAccent borderAccent>
            <canvas
              ref={waveformCanvasRef}
              width={800}
              height={200}
              className="w-full h-48 bg-black/30 rounded border border-green-400/30"
            />
          </TechPanel>

          {/* FFT Display */}
          <TechPanel title="FFT SPECTRUM" cornerAccent borderAccent>
            <canvas
              ref={fftCanvasRef}
              width={800}
              height={150}
              className="w-full h-32 bg-black/30 rounded border border-green-400/30"
            />
          </TechPanel>

          {/* Frequency Bands & Tagged Frequencies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TechPanel title="FREQUENCY BANDS" cornerAccent borderAccent>
              <div className="space-y-2">
                {frequencyBands.map((band, index) => (
                  <div key={index} className="flex items-center justify-between bg-dark-100/10 p-2 rounded">
                    <div>
                      <div className="font-bold text-sm">{band.name}</div>
                      <div className="text-xs text-gray-400">
                        {band.min} - {band.max} MHz
                      </div>
                    </div>
                    <TechButton
                      onClick={() => toggleBand(index)}
                      variant={band.enabled ? "default" : "outline"}
                      size="sm"
                    >
                      {band.enabled ? "ON" : "OFF"}
                    </TechButton>
                  </div>
                ))}
              </div>
            </TechPanel>

            <TechPanel title="TAGGED FREQUENCIES" cornerAccent borderAccent>
              <div className="space-y-2">
                {taggedFrequencies.map((freq, index) => (
                  <div key={index} className="flex items-center justify-between bg-dark-100/10 p-2 rounded">
                    <div className="font-mono text-green-400">{freq.toFixed(2)} MHz</div>
                    <div className="flex items-center gap-2">
                      {Math.abs(frequency - freq) < 5 && resonantMatch && (
                        <Badge variant="default" className="text-xs bg-yellow-600">
                          MATCH
                        </Badge>
                      )}
                      <TechButton onClick={() => removeTaggedFrequency(freq)} variant="outline" size="sm">
                        Remove
                      </TechButton>
                    </div>
                  </div>
                ))}
              </div>
            </TechPanel>
          </div>
        </main>
      </div>
    </div>
  )
}
