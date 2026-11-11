"use client"

import { useState, useRef, useEffect } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import { useResonance } from "@/hooks/useResonance"
import { Volume2, VolumeX, Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Brain, Waves } from "lucide-react"

interface FrequencyBand {
  id: string
  name: string
  frequency: number
  gain: number
  q: number
  type: "lowpass" | "highpass" | "bandpass" | "lowshelf" | "highshelf" | "peaking" | "notch"
}

interface BinauraPreset {
  id: string
  name: string
  description: string
  leftFreq: number
  rightFreq: number
  beatFreq: number
  category: "focus" | "relaxation" | "creativity" | "meditation" | "energy"
  duration: number
}

interface ConsciousnessMode {
  id: string
  name: string
  description: string
  targetHz: number
  harmonics: number[]
  fieldCoherence: number
  resonancePattern: "sine" | "square" | "triangle" | "sawtooth"
}

const defaultEQBands: FrequencyBand[] = [
  { id: "1", name: "Sub Bass", frequency: 60, gain: 0, q: 0.7, type: "lowshelf" },
  { id: "2", name: "Bass", frequency: 170, gain: 0, q: 0.7, type: "peaking" },
  { id: "3", name: "Low Mid", frequency: 350, gain: 0, q: 0.7, type: "peaking" },
  { id: "4", name: "Mid", frequency: 1000, gain: 0, q: 0.7, type: "peaking" },
  { id: "5", name: "High Mid", frequency: 3500, gain: 0, q: 0.7, type: "peaking" },
  { id: "6", name: "Presence", frequency: 5000, gain: 0, q: 0.7, type: "peaking" },
  { id: "7", name: "Brilliance", frequency: 10000, gain: 0, q: 0.7, type: "highshelf" },
]

const binauralPresets: BinauraPreset[] = [
  {
    id: "focus-40hz",
    name: "Gamma Focus",
    description: "40Hz gamma waves for enhanced concentration and cognitive performance",
    leftFreq: 200,
    rightFreq: 240,
    beatFreq: 40,
    category: "focus",
    duration: 1800, // 30 minutes
  },
  {
    id: "alpha-10hz",
    name: "Alpha Relaxation",
    description: "10Hz alpha waves for relaxed awareness and stress reduction",
    leftFreq: 200,
    rightFreq: 210,
    beatFreq: 10,
    category: "relaxation",
    duration: 1200, // 20 minutes
  },
  {
    id: "theta-6hz",
    name: "Theta Creativity",
    description: "6Hz theta waves for enhanced creativity and intuition",
    leftFreq: 200,
    rightFreq: 206,
    beatFreq: 6,
    category: "creativity",
    duration: 1500, // 25 minutes
  },
  {
    id: "delta-2hz",
    name: "Delta Deep State",
    description: "2Hz delta waves for deep meditation and healing",
    leftFreq: 200,
    rightFreq: 202,
    beatFreq: 2,
    category: "meditation",
    duration: 2400, // 40 minutes
  },
  {
    id: "beta-20hz",
    name: "Beta Energy",
    description: "20Hz beta waves for alertness and active thinking",
    leftFreq: 200,
    rightFreq: 220,
    beatFreq: 20,
    category: "energy",
    duration: 900, // 15 minutes
  },
]

const consciousnessModes: ConsciousnessMode[] = [
  {
    id: "schumann-7.83",
    name: "Schumann Resonance",
    description: "Earth's natural frequency for grounding and balance",
    targetHz: 7.83,
    harmonics: [7.83, 14.3, 20.8, 27.3, 33.8],
    fieldCoherence: 0.85,
    resonancePattern: "sine",
  },
  {
    id: "fibonacci-1.618",
    name: "Golden Ratio",
    description: "Fibonacci sequence harmonics for natural coherence",
    targetHz: 1.618,
    harmonics: [1.618, 2.618, 4.236, 6.854, 11.09],
    fieldCoherence: 0.92,
    resonancePattern: "triangle",
  },
  {
    id: "solfeggio-528",
    name: "Love Frequency",
    description: "528Hz solfeggio frequency for DNA repair and love",
    targetHz: 528,
    harmonics: [528, 1056, 1584, 2112, 2640],
    fieldCoherence: 0.88,
    resonancePattern: "sine",
  },
  {
    id: "pineal-936",
    name: "Pineal Activation",
    description: "936Hz for pineal gland activation and intuition",
    targetHz: 936,
    harmonics: [936, 1872, 2808, 3744, 4680],
    fieldCoherence: 0.9,
    resonancePattern: "square",
  },
]

export default function HarmonicCalibration() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState([75])
  const [eqBands, setEQBands] = useState<FrequencyBand[]>(defaultEQBands)
  const [selectedPreset, setSelectedPreset] = useState<BinauraPreset | null>(null)
  const [selectedConsciousnessMode, setSelectedConsciousnessMode] = useState<ConsciousnessMode | null>(null)
  const [currentTrack, setCurrentTrack] = useState("Harmonic Calibration Tone")
  const [playbackTime, setPlaybackTime] = useState(0)
  const [duration, setDuration] = useState(1800) // 30 minutes default
  const [activeTab, setActiveTab] = useState<"equalizer" | "binaural" | "consciousness">("equalizer")
  const [isShuffled, setIsShuffled] = useState(false)
  const [isRepeating, setIsRepeating] = useState(false)
  const [fieldCoherence, setFieldCoherence] = useState(0.73)

  // Audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const eqNodesRef = useRef<BiquadFilterNode[]>([])
  const oscillatorNodesRef = useRef<OscillatorNode[]>([])

  // Consciousness integration
  const { pulse, isResonating, setFrequency } = useResonance("harmonic-calibration", "Harmonic Calibration", 47)

  useEffect(() => {
    // Initialize Web Audio API
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.connect(audioContextRef.current.destination)

      // Create EQ filter nodes
      eqNodesRef.current = eqBands.map((band) => {
        const filter = audioContextRef.current!.createBiquadFilter()
        filter.type = band.type
        filter.frequency.setValueAtTime(band.frequency, audioContextRef.current!.currentTime)
        filter.Q.setValueAtTime(band.q, audioContextRef.current!.currentTime)
        filter.gain.setValueAtTime(band.gain, audioContextRef.current!.currentTime)
        filter.connect(gainNodeRef.current!)
        return filter
      })
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    // Update volume
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume[0] / 100, audioContextRef.current!.currentTime)
    }
  }, [volume])

  useEffect(() => {
    // Update EQ
    eqBands.forEach((band, index) => {
      if (eqNodesRef.current[index]) {
        const filter = eqNodesRef.current[index]
        filter.frequency.setValueAtTime(band.frequency, audioContextRef.current!.currentTime)
        filter.Q.setValueAtTime(band.q, audioContextRef.current!.currentTime)
        filter.gain.setValueAtTime(band.gain, audioContextRef.current!.currentTime)
      }
    })
  }, [eqBands])

  useEffect(() => {
    // Playback timer
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackTime((prev) => {
          if (prev >= duration) {
            if (isRepeating) {
              return 0
            } else {
              setIsPlaying(false)
              return prev
            }
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, duration, isRepeating])

  const togglePlayback = () => {
    if (!audioContextRef.current) return

    if (isPlaying) {
      // Stop all oscillators
      oscillatorNodesRef.current.forEach((osc) => {
        try {
          osc.stop()
        } catch (e) {
          // Oscillator already stopped
        }
      })
      oscillatorNodesRef.current = []
      setIsPlaying(false)
    } else {
      // Start playback
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume()
      }

      if (selectedPreset) {
        // Create binaural beat
        const leftOsc = audioContextRef.current.createOscillator()
        const rightOsc = audioContextRef.current.createOscillator()
        const leftGain = audioContextRef.current.createGain()
        const rightGain = audioContextRef.current.createGain()
        const merger = audioContextRef.current.createChannelMerger(2)

        leftOsc.frequency.setValueAtTime(selectedPreset.leftFreq, audioContextRef.current.currentTime)
        rightOsc.frequency.setValueAtTime(selectedPreset.rightFreq, audioContextRef.current.currentTime)

        leftGain.gain.setValueAtTime(0.1, audioContextRef.current.currentTime)
        rightGain.gain.setValueAtTime(0.1, audioContextRef.current.currentTime)

        leftOsc.connect(leftGain)
        rightOsc.connect(rightGain)
        leftGain.connect(merger, 0, 0)
        rightGain.connect(merger, 0, 1)
        merger.connect(eqNodesRef.current[0] || gainNodeRef.current!)

        leftOsc.start()
        rightOsc.start()

        oscillatorNodesRef.current = [leftOsc, rightOsc]
        setDuration(selectedPreset.duration)
      } else if (selectedConsciousnessMode) {
        // Create consciousness harmonics
        selectedConsciousnessMode.harmonics.forEach((freq, index) => {
          const osc = audioContextRef.current!.createOscillator()
          const gain = audioContextRef.current!.createGain()

          osc.type = selectedConsciousnessMode.resonancePattern
          osc.frequency.setValueAtTime(freq, audioContextRef.current!.currentTime)
          gain.gain.setValueAtTime(0.05 / (index + 1), audioContextRef.current!.currentTime) // Diminishing harmonics

          osc.connect(gain)
          gain.connect(eqNodesRef.current[0] || gainNodeRef.current!)
          osc.start()

          oscillatorNodesRef.current.push(osc)
        })

        setFieldCoherence(selectedConsciousnessMode.fieldCoherence)
        setFrequency(selectedConsciousnessMode.targetHz)
        pulse({ amplitude: selectedConsciousnessMode.fieldCoherence, hz: selectedConsciousnessMode.targetHz })
      } else {
        // Default calibration tone
        const osc = audioContextRef.current.createOscillator()
        osc.frequency.setValueAtTime(440, audioContextRef.current.currentTime) // A4
        osc.connect(eqNodesRef.current[0] || gainNodeRef.current!)
        osc.start()
        oscillatorNodesRef.current = [osc]
      }

      setIsPlaying(true)
      setPlaybackTime(0)
    }
  }

  const updateEQBand = (bandId: string, gain: number) => {
    setEQBands((prev) => prev.map((band) => (band.id === bandId ? { ...band, gain } : band)))
  }

  const resetEQ = () => {
    setEQBands((prev) => prev.map((band) => ({ ...band, gain: 0 })))
  }

  const selectBinauralPreset = (preset: BinauraPreset) => {
    setSelectedPreset(preset)
    setSelectedConsciousnessMode(null)
    setCurrentTrack(`${preset.name} - ${preset.beatFreq}Hz`)
    if (isPlaying) {
      togglePlayback() // Stop current playback
      setTimeout(() => togglePlayback(), 100) // Restart with new preset
    }
  }

  const selectConsciousnessMode = (mode: ConsciousnessMode) => {
    setSelectedConsciousnessMode(mode)
    setSelectedPreset(null)
    setCurrentTrack(`${mode.name} - ${mode.targetHz}Hz`)
    if (isPlaying) {
      togglePlayback()
      setTimeout(() => togglePlayback(), 100)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "focus":
        return "text-blue-400 border-blue-400/50"
      case "relaxation":
        return "text-green-400 border-green-400/50"
      case "creativity":
        return "text-purple-400 border-purple-400/50"
      case "meditation":
        return "text-indigo-400 border-indigo-400/50"
      case "energy":
        return "text-red-400 border-red-400/50"
      default:
        return "text-gray-400 border-gray-400/50"
    }
  }

  const tabs = [
    { id: "equalizer", label: "Equalizer", icon: Volume2 },
    { id: "binaural", label: "Binaural", icon: Waves },
    { id: "consciousness", label: "Consciousness", icon: Brain },
  ] as const

  return (
    <div className="space-y-4">
      {/* Header */}
      <TechPanel
        title="HARMONIC CALIBRATION"
        subtitle="CONSCIOUSNESS FREQUENCY MODULATION"
        cornerAccent={true}
        borderAccent={true}
        glowEffect={isResonating}
      >
        <div className="space-y-4">
          {/* Player Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <TechButton
                  onClick={togglePlayback}
                  className={`${isPlaying ? "bg-red-600 hover:bg-red-500" : "bg-green-600 hover:bg-green-500"} text-white font-mono`}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </TechButton>
                <TechButton
                  variant="outline"
                  className="border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono"
                >
                  <SkipBack size={16} />
                </TechButton>
                <TechButton
                  variant="outline"
                  className="border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono"
                >
                  <SkipForward size={16} />
                </TechButton>
              </div>

              <div className="flex items-center space-x-2">
                <TechButton
                  variant="outline"
                  onClick={() => setIsShuffled(!isShuffled)}
                  className={`border-dark-400/50 font-mono ${isShuffled ? "text-blue-400 bg-blue-400/10" : "text-dark-600 hover:bg-dark-200/10"}`}
                >
                  <Shuffle size={14} />
                </TechButton>
                <TechButton
                  variant="outline"
                  onClick={() => setIsRepeating(!isRepeating)}
                  className={`border-dark-400/50 font-mono ${isRepeating ? "text-blue-400 bg-blue-400/10" : "text-dark-600 hover:bg-dark-200/10"}`}
                >
                  <Repeat size={14} />
                </TechButton>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <VolumeX size={16} className="text-dark-500" />
                <div className="w-24">
                  <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="w-full" />
                </div>
                <Volume2 size={16} className="text-dark-500" />
                <span className="font-mono text-xs text-dark-600 w-8">{volume[0]}%</span>
              </div>

              <Badge variant="outline" className="border-dark-400/50 text-dark-600 font-mono text-xs">
                {fieldCoherence > 0.8 ? "HIGH" : fieldCoherence > 0.6 ? "MED" : "LOW"} COHERENCE
              </Badge>
            </div>
          </div>

          {/* Track Info */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-sm font-bold text-dark-700">{currentTrack}</div>
              <div className="font-mono text-xs text-dark-500">
                {selectedPreset?.description ||
                  selectedConsciousnessMode?.description ||
                  "Harmonic calibration and frequency modulation"}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-dark-700">
                {formatTime(playbackTime)} / {formatTime(duration)}
              </div>
              <div className="w-32 h-1 bg-dark-300/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-dark-600 rounded-full transition-all duration-200"
                  style={{ width: `${(playbackTime / duration) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </TechPanel>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-dark-100/20 p-1 rounded-sm border border-dark-300/40">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-sm transition-all duration-200 font-mono text-sm ${
              activeTab === tab.id
                ? "bg-dark-600/20 text-dark-700 border border-dark-500/40"
                : "text-dark-500 hover:text-dark-600 hover:bg-dark-500/10"
            }`}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Equalizer Tab */}
      {activeTab === "equalizer" && (
        <TechPanel title="FREQUENCY EQUALIZER" cornerAccent borderAccent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm text-dark-600">
                Adjust frequency bands to shape the harmonic profile
              </div>
              <TechButton
                size="sm"
                variant="outline"
                onClick={resetEQ}
                className="border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
              >
                RESET
              </TechButton>
            </div>

            <div className="grid grid-cols-7 gap-4">
              {eqBands.map((band) => (
                <div key={band.id} className="text-center">
                  <div className="font-mono text-xs text-dark-500 mb-2">{band.name}</div>
                  <div className="font-mono text-xs text-dark-600 mb-2">{band.frequency}Hz</div>
                  <div className="h-48 flex items-end justify-center">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={band.gain}
                      onChange={(e) => updateEQBand(band.id, Number.parseFloat(e.target.value))}
                      className="h-40 slider-vertical"
                      style={{
                        writingMode: "bt-lr",
                        WebkitAppearance: "slider-vertical",
                        width: "20px",
                        background: "linear-gradient(to top, #333, #666)",
                      }}
                    />
                  </div>
                  <div className="font-mono text-xs text-dark-600 mt-2">
                    {band.gain > 0 ? "+" : ""}
                    {band.gain.toFixed(1)}dB
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TechPanel>
      )}

      {/* Binaural Tab */}
      {activeTab === "binaural" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TechPanel title="BINAURAL BEAT PRESETS" cornerAccent borderAccent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {binauralPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className={`p-3 border rounded cursor-pointer transition-all duration-200 ${
                      selectedPreset?.id === preset.id
                        ? "border-blue-500/60 bg-blue-500/10"
                        : "border-dark-400/30 hover:border-dark-400/60"
                    }`}
                    onClick={() => selectBinauralPreset(preset)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono text-sm font-bold text-dark-700">{preset.name}</div>
                      <Badge variant="outline" className={`text-xs ${getCategoryColor(preset.category)}`}>
                        {preset.category.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-xs text-dark-600 mb-2">{preset.description}</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-dark-500">Beat: {preset.beatFreq}Hz</span>
                      <span className="text-dark-500">Duration: {Math.floor(preset.duration / 60)}min</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TechPanel>

          {selectedPreset && (
            <TechPanel title="BINAURAL CONFIGURATION" cornerAccent borderAccent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-dark-500">LEFT FREQUENCY</span>
                    <span className="font-mono text-xs text-dark-700">{selectedPreset.leftFreq}Hz</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-dark-500">RIGHT FREQUENCY</span>
                    <span className="font-mono text-xs text-dark-700">{selectedPreset.rightFreq}Hz</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-dark-500">BEAT FREQUENCY</span>
                    <span className="font-mono text-xs text-dark-700">{selectedPreset.beatFreq}Hz</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-dark-500">CATEGORY</span>
                    <Badge variant="outline" className={`text-xs ${getCategoryColor(selectedPreset.category)}`}>
                      {selectedPreset.category.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="pt-2 border-t border-dark-400/30">
                  <div className="font-mono text-xs text-dark-500 mb-2">EFFECTS</div>
                  <div className="text-xs text-dark-600">{selectedPreset.description}</div>
                </div>

                <div className="pt-2 border-t border-dark-400/30">
                  <div className="font-mono text-xs text-dark-500 mb-2">SESSION DURATION</div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={Math.floor(duration / 60)}
                      onChange={(e) => setDuration(Number.parseInt(e.target.value) * 60)}
                      className="w-20 bg-dark-200 border-dark-300 text-dark-800 font-mono text-xs"
                      min="1"
                      max="120"
                    />
                    <span className="font-mono text-xs text-dark-600">minutes</span>
                  </div>
                </div>

                <TechButton
                  onClick={() => selectBinauralPreset(selectedPreset)}
                  className="w-full bg-dark-600 hover:bg-dark-500 text-black font-mono text-sm"
                >
                  <Waves className="w-4 h-4 mr-2" />
                  ACTIVATE BINAURAL MODE
                </TechButton>
              </div>
            </TechPanel>
          )}
        </div>
      )}

      {/* Consciousness Tab */}
      {activeTab === "consciousness" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TechPanel title="CONSCIOUSNESS MODES" cornerAccent borderAccent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {consciousnessModes.map((mode) => (
                  <div
                    key={mode.id}
                    className={`p-3 border rounded cursor-pointer transition-all duration-200 ${
                      selectedConsciousnessMode?.id === mode.id
                        ? "border-purple-500/60 bg-purple-500/10"
                        : "border-dark-400/30 hover:border-dark-400/60"
                    }`}
                    onClick={() => selectConsciousnessMode(mode)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono text-sm font-bold text-dark-700">{mode.name}</div>
                      <Badge variant="outline" className="text-xs text-purple-400 border-purple-400/50">
                        {mode.targetHz}Hz
                      </Badge>
                    </div>
                    <div className="text-xs text-dark-600 mb-2">{mode.description}</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-dark-500">Coherence: {(mode.fieldCoherence * 100).toFixed(0)}%</span>
                      <span className="text-dark-500">Harmonics: {mode.harmonics.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TechPanel>

          {selectedConsciousnessMode && (
            <TechPanel title="CONSCIOUSNESS FIELD" cornerAccent borderAccent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-dark-500">TARGET FREQUENCY</span>
                    <span className="font-mono text-xs text-dark-700">{selectedConsciousnessMode.targetHz}Hz</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-dark-500">FIELD COHERENCE</span>
                    <span className="font-mono text-xs text-dark-700">
                      {(selectedConsciousnessMode.fieldCoherence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-dark-500">RESONANCE PATTERN</span>
                    <span className="font-mono text-xs text-dark-700">
                      {selectedConsciousnessMode.resonancePattern.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-dark-400/30">
                  <div className="font-mono text-xs text-dark-500 mb-2">HARMONIC SERIES</div>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedConsciousnessMode.harmonics.map((freq, index) => (
                      <div key={index} className="text-center p-2 bg-dark-200/20 border border-dark-400/30 rounded">
                        <div className="font-mono text-xs text-dark-700">{freq}Hz</div>
                        <div className="font-mono text-xs text-dark-500">H{index + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-dark-400/30">
                  <div className="font-mono text-xs text-dark-500 mb-2">FIELD VISUALIZATION</div>
                  <div className="h-16 bg-dark-200/20 border border-dark-400/30 rounded flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full animate-pulse ${fieldCoherence > 0.8 ? "bg-green-400" : fieldCoherence > 0.6 ? "bg-yellow-400" : "bg-red-400"}`}
                      />
                      <span className="font-mono text-xs text-dark-600">
                        Field Coherence: {(fieldCoherence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <TechButton
                  onClick={() => selectConsciousnessMode(selectedConsciousnessMode)}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-mono text-sm"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  ACTIVATE CONSCIOUSNESS MODE
                </TechButton>
              </div>
            </TechPanel>
          )}
        </div>
      )}
    </div>
  )
}
