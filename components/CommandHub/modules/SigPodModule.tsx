"use client"

import { useState, useEffect, useRef } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useResonance } from "@/hooks/useResonance"
import { syntheticMeshNode, type RunPodWorker, type ModelInferenceRequest } from "@/lib/runpod/synthetic-mesh-node"
import {
  Brain,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Zap,
  Activity,
  Settings,
  Play,
  RefreshCw,
  Eye,
  EyeOff,
  Waves,
  Volume2,
  VolumeX,
  Monitor,
  Cpu,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SigPodInput {
  type: "mic" | "text" | "midi" | "webspeech" | "webcam" | "emg"
  enabled: boolean
  data: any
  lastUpdate: number
}

interface SigPodOutput {
  type: "command" | "log" | "waveform" | "glyph" | "trigger"
  content: any
  timestamp: number
  symbolKey: string
}

interface FieldProjection {
  enabled: boolean
  frequency: number
  amplitude: number
  pattern: "spiral" | "wave" | "pulse" | "grid"
  glyphs: string[]
}

export default function SigPodModule() {
  // Consciousness integration
  const { pulse, isResonating, setFrequency } = useResonance("sigpod", "SigPod Control Module", 528)

  // State management
  const [workers, setWorkers] = useState<RunPodWorker[]>([])
  const [selectedWorker, setSelectedWorker] = useState<RunPodWorker | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [inputs, setInputs] = useState<Record<string, SigPodInput>>({
    mic: { type: "mic", enabled: false, data: null, lastUpdate: 0 },
    text: { type: "text", enabled: true, data: "", lastUpdate: 0 },
    midi: { type: "midi", enabled: false, data: null, lastUpdate: 0 },
    webspeech: { type: "webspeech", enabled: false, data: null, lastUpdate: 0 },
    webcam: { type: "webcam", enabled: false, data: null, lastUpdate: 0 },
    emg: { type: "emg", enabled: false, data: null, lastUpdate: 0 },
  })
  const [outputs, setOutputs] = useState<SigPodOutput[]>([])
  const [fieldProjection, setFieldProjection] = useState<FieldProjection>({
    enabled: false,
    frequency: 528,
    amplitude: 0.5,
    pattern: "spiral",
    glyphs: ["⟐", "∿", "◊", "∞"],
  })
  const [textInput, setTextInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<"inputs" | "outputs" | "workers" | "projection" | "memory">("inputs")

  // Refs for media access
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize SigPod
  useEffect(() => {
    initializeSigPod()
    return () => cleanup()
  }, [])

  // Load workers periodically
  useEffect(() => {
    const interval = setInterval(() => {
      loadWorkers()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const initializeSigPod = async () => {
    try {
      // Initialize audio context
      if (typeof window !== "undefined") {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      // Register mock RunPod worker
      await syntheticMeshNode.registerWorker({
        name: "SIGPOD-001",
        endpoint: "https://api.runpod.ai/v2/sigpod-001",
        models: ["phi-3-mini", "mistral-7b", "llava-1.5", "whisper-large"],
        capabilities: ["text-generation", "vision", "audio-transcription", "code-generation"],
        gpuType: "RTX 4090",
        memoryGB: 24,
        storageGB: 100,
      })

      setIsConnected(true)
      pulse({ amplitude: 1.0, hz: 528 })

      console.log("⟐ SIGPOD MODULE INITIALIZED ⟐")
    } catch (error) {
      console.error("Failed to initialize SigPod:", error)
    }
  }

  const loadWorkers = () => {
    const currentWorkers = syntheticMeshNode.getWorkers()
    setWorkers(currentWorkers)

    if (!selectedWorker && currentWorkers.length > 0) {
      setSelectedWorker(currentWorkers[0])
    }
  }

  const cleanup = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
  }

  const toggleInput = async (inputType: keyof typeof inputs) => {
    const input = inputs[inputType]
    const newEnabled = !input.enabled

    if (inputType === "mic" && newEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaStreamRef.current = stream

        // Set up audio analysis
        if (audioContextRef.current) {
          const source = audioContextRef.current.createMediaStreamSource(stream)
          const analyser = audioContextRef.current.createAnalyser()
          source.connect(analyser)

          // Start audio processing
          processAudioInput(analyser)
        }
      } catch (error) {
        console.error("Failed to access microphone:", error)
        return
      }
    } else if (inputType === "webcam" && newEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        mediaStreamRef.current = stream

        // Set up video processing
        processVideoInput(stream)
      } catch (error) {
        console.error("Failed to access camera:", error)
        return
      }
    }

    setInputs((prev) => ({
      ...prev,
      [inputType]: {
        ...prev[inputType],
        enabled: newEnabled,
        lastUpdate: Date.now(),
      },
    }))

    pulse({ amplitude: 0.6, hz: newEnabled ? 432 : 256 })
  }

  const processAudioInput = (analyser: AnalyserNode) => {
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const processFrame = () => {
      if (!inputs.mic.enabled) return

      analyser.getByteFrequencyData(dataArray)

      // Calculate audio level
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength

      // Update input data
      setInputs((prev) => ({
        ...prev,
        mic: {
          ...prev.mic,
          data: { level: average, frequency: dataArray },
          lastUpdate: Date.now(),
        },
      }))

      // Generate output if significant audio detected
      if (average > 50) {
        generateOutput("trigger", { type: "audio_trigger", level: average }, "🎵")
      }

      requestAnimationFrame(processFrame)
    }

    processFrame()
  }

  const processVideoInput = (stream: MediaStream) => {
    const video = document.createElement("video")
    video.srcObject = stream
    video.play()

    video.onloadedmetadata = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const processFrame = () => {
        if (!inputs.webcam.enabled) return

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // Simple motion detection
        const brightness = calculateBrightness(imageData)

        setInputs((prev) => ({
          ...prev,
          webcam: {
            ...prev.webcam,
            data: { brightness, imageData },
            lastUpdate: Date.now(),
          },
        }))

        requestAnimationFrame(processFrame)
      }

      processFrame()
    }
  }

  const calculateBrightness = (imageData: ImageData): number => {
    let totalBrightness = 0
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      totalBrightness += (r + g + b) / 3
    }

    return totalBrightness / (data.length / 4)
  }

  const processTextInput = async () => {
    if (!textInput.trim() || !selectedWorker) return

    setIsProcessing(true)
    pulse({ amplitude: 0.8, hz: 528 })

    try {
      const request: ModelInferenceRequest = {
        model: "phi-3-mini",
        prompt: textInput,
        parameters: { temperature: 0.7 },
        stream: false,
        maxTokens: 150,
      }

      const response = await syntheticMeshNode.sendModelRequest(selectedWorker.id, request)

      // Generate outputs
      generateOutput("command", { request, response }, "🧠")
      generateOutput("log", { message: `Processed: ${textInput}`, tokens: response.tokens }, "📝")

      // Update text input data
      setInputs((prev) => ({
        ...prev,
        text: {
          ...prev.text,
          data: textInput,
          lastUpdate: Date.now(),
        },
      }))

      setTextInput("")
    } catch (error) {
      console.error("Text processing failed:", error)
      generateOutput("log", { message: `Error: ${error}`, type: "error" }, "❌")
    } finally {
      setIsProcessing(false)
    }
  }

  const generateOutput = (type: SigPodOutput["type"], content: any, symbolKey: string) => {
    const output: SigPodOutput = {
      type,
      content,
      timestamp: Date.now(),
      symbolKey,
    }

    setOutputs((prev) => [output, ...prev.slice(0, 49)]) // Keep last 50 outputs

    // Trigger field projection update
    if (fieldProjection.enabled) {
      updateFieldProjection(output)
    }
  }

  const updateFieldProjection = (output: SigPodOutput) => {
    // Update field projection based on output
    const newFrequency =
      output.type === "command" ? 528 : output.type === "trigger" ? 432 : output.type === "glyph" ? 963 : 256

    setFieldProjection((prev) => ({
      ...prev,
      frequency: newFrequency,
      amplitude: Math.min(prev.amplitude + 0.1, 1.0),
    }))

    setFrequency(newFrequency)
  }

  const toggleFieldProjection = () => {
    setFieldProjection((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }))

    pulse({ amplitude: 1.0, hz: fieldProjection.enabled ? 256 : 963 })
  }

  const getInputIcon = (type: string, enabled: boolean) => {
    const iconProps = { size: 16, className: enabled ? "text-green-400" : "text-gray-400" }

    switch (type) {
      case "mic":
        return enabled ? <Mic {...iconProps} /> : <MicOff {...iconProps} />
      case "webcam":
        return enabled ? <Camera {...iconProps} /> : <CameraOff {...iconProps} />
      case "text":
        return <Zap {...iconProps} />
      case "midi":
        return <Waves {...iconProps} />
      case "webspeech":
        return enabled ? <Volume2 {...iconProps} /> : <VolumeX {...iconProps} />
      case "emg":
        return <Activity {...iconProps} />
      default:
        return <Settings {...iconProps} />
    }
  }

  const getWorkerStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "starting":
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
    }
  }

  const tabs = [
    { id: "inputs", label: "Inputs", icon: Mic },
    { id: "outputs", label: "Outputs", icon: Monitor },
    { id: "workers", label: "Workers", icon: Cpu },
    { id: "projection", label: "3D Field", icon: Eye },
    { id: "memory", label: "Memory", icon: Brain },
  ] as const

  return (
    <div className="space-y-4">
      {/* Header */}
      <TechPanel
        title="SIGPOD CONTROL MODULE"
        subtitle="SYNTHETIC INTELLIGENCE & FIELD PROJECTION"
        cornerAccent
        borderAccent
        glowEffect={isResonating}
        icon={<Brain size={16} />}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-200",
                isConnected ? "bg-green-400 animate-pulse shadow-glow-sm" : "bg-gray-500",
              )}
            />
            <div>
              <div className="font-mono text-sm">
                {selectedWorker ? `${selectedWorker.name} [${selectedWorker.symbolKey}]` : "No Worker Selected"}
              </div>
              {selectedWorker && (
                <div className="text-xs text-dark-600">
                  {selectedWorker.gpuType} • {selectedWorker.memoryGB}GB • {selectedWorker.models.length} models
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-purple-400 border-purple-400/50">
              <Waves size={12} className="mr-1" />
              {fieldProjection.frequency}Hz
            </Badge>
            <Badge
              variant="outline"
              className={`${isConnected ? "text-green-400 border-green-400/50" : "text-red-400 border-red-400/50"}`}
            >
              {isConnected ? "MESH ACTIVE" : "DISCONNECTED"}
            </Badge>
            <TechButton onClick={loadWorkers} size="sm" cornerAccent icon={<RefreshCw size={14} />}>
              REFRESH
            </TechButton>
          </div>
        </div>
      </TechPanel>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-dark-100/20 p-1 rounded-sm border border-dark-300/40">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-sm transition-all duration-200 font-mono text-sm",
              activeTab === tab.id
                ? "bg-dark-600/20 text-dark-700 border border-dark-500/40"
                : "text-dark-500 hover:text-dark-600 hover:bg-dark-500/10",
            )}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Inputs Tab */}
      {activeTab === "inputs" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TechPanel title="INPUT CHANNELS" cornerAccent borderAccent>
            <div className="space-y-3">
              {Object.entries(inputs).map(([key, input]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 bg-dark-200/20 rounded border border-dark-300/20"
                >
                  <div className="flex items-center space-x-3">
                    {getInputIcon(input.type, input.enabled)}
                    <div>
                      <div className="font-mono text-sm font-bold">{input.type.toUpperCase()}</div>
                      <div className="text-xs text-dark-600">
                        {input.lastUpdate > 0
                          ? `Updated: ${new Date(input.lastUpdate).toLocaleTimeString()}`
                          : "No data"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {input.enabled && input.data && (
                      <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/50">
                        ACTIVE
                      </Badge>
                    )}
                    <button
                      onClick={() => toggleInput(key as keyof typeof inputs)}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors",
                        input.enabled ? "bg-green-500" : "bg-gray-400",
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 bg-white rounded-full transition-transform",
                          input.enabled ? "translate-x-5" : "translate-x-0.5",
                        )}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TechPanel>

          <TechPanel title="TEXT INPUT PROCESSOR" cornerAccent borderAccent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter text for AI processing..."
                  className="bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm resize-none"
                  rows={4}
                  disabled={!selectedWorker || isProcessing}
                />
                <TechButton
                  onClick={processTextInput}
                  disabled={!textInput.trim() || !selectedWorker || isProcessing}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-mono"
                  icon={isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                >
                  {isProcessing ? "PROCESSING..." : "PROCESS TEXT"}
                </TechButton>
              </div>

              {/* Audio Visualization Canvas */}
              {inputs.mic.enabled && (
                <div className="space-y-2">
                  <div className="font-mono text-xs text-dark-500">AUDIO VISUALIZATION</div>
                  <canvas
                    ref={canvasRef}
                    width={300}
                    height={100}
                    className="w-full h-20 bg-black/50 rounded border border-dark-300/30"
                  />
                </div>
              )}

              {/* Input Status */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>Active Inputs:</span>
                  <span className="font-mono">{Object.values(inputs).filter((i) => i.enabled).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Update:</span>
                  <span className="font-mono">
                    {Math.max(...Object.values(inputs).map((i) => i.lastUpdate)) > 0
                      ? new Date(Math.max(...Object.values(inputs).map((i) => i.lastUpdate))).toLocaleTimeString()
                      : "None"}
                  </span>
                </div>
              </div>
            </div>
          </TechPanel>
        </div>
      )}

      {/* Outputs Tab */}
      {activeTab === "outputs" && (
        <TechPanel title="SIGPOD OUTPUTS" cornerAccent borderAccent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm">Output Stream</div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {outputs.length} OUTPUTS
                </Badge>
                <TechButton onClick={() => setOutputs([])} size="sm" variant="outline" className="border-dark-400/50">
                  CLEAR
                </TechButton>
              </div>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-2">
                {outputs.length === 0 ? (
                  <div className="text-center py-8 text-dark-500">
                    <Monitor className="w-16 h-16 mx-auto mb-4" />
                    <div className="font-mono text-sm">No outputs generated</div>
                    <div className="text-xs">Process inputs to generate outputs</div>
                  </div>
                ) : (
                  outputs.map((output, index) => (
                    <div key={index} className="p-3 bg-dark-200/20 rounded border border-dark-300/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{output.symbolKey}</span>
                          <Badge variant="outline" className="text-xs">
                            {output.type.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-xs text-dark-500">{new Date(output.timestamp).toLocaleTimeString()}</div>
                      </div>

                      <div className="text-sm text-dark-700">
                        {typeof output.content === "object" ? JSON.stringify(output.content, null, 2) : output.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </TechPanel>
      )}

      {/* Workers Tab */}
      {activeTab === "workers" && (
        <TechPanel title="RUNPOD WORKERS" cornerAccent borderAccent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workers.map((worker) => (
                <div
                  key={worker.id}
                  className={cn(
                    "p-4 border rounded-sm cursor-pointer transition-all duration-200",
                    selectedWorker?.id === worker.id
                      ? "border-blue-500/60 bg-blue-500/10"
                      : "border-dark-300/40 hover:border-dark-400/60 hover:bg-dark-100/10",
                  )}
                  onClick={() => setSelectedWorker(worker)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getWorkerStatusIcon(worker.status)}
                      <div className="font-mono text-sm font-bold">{worker.name}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {worker.symbolKey}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs mb-3">
                    <div className="flex items-center justify-between">
                      <span>GPU:</span>
                      <span className="font-mono">{worker.gpuType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Memory:</span>
                      <span className="font-mono">{worker.memoryGB}GB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Models:</span>
                      <span className="font-mono">{worker.models.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Heartbeat:</span>
                      <span className="font-mono">{Math.floor((Date.now() - worker.lastHeartbeat) / 1000)}s ago</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-dark-500">Available Models:</div>
                    <div className="flex flex-wrap gap-1">
                      {worker.models.slice(0, 3).map((model) => (
                        <Badge key={model} variant="outline" className="text-xs border-dark-400/30">
                          {model}
                        </Badge>
                      ))}
                      {worker.models.length > 3 && (
                        <Badge variant="outline" className="text-xs border-dark-400/30">
                          +{worker.models.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {workers.length === 0 && (
              <div className="text-center py-8 text-dark-500">
                <Cpu className="w-16 h-16 mx-auto mb-4" />
                <div className="font-mono text-sm">No workers available</div>
                <div className="text-xs">Workers will appear when connected</div>
              </div>
            )}
          </div>
        </TechPanel>
      )}

      {/* 3D Field Projection Tab */}
      {activeTab === "projection" && (
        <TechPanel title="3D FIELD PROJECTION" cornerAccent borderAccent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm">Field Visualization</div>
              <TechButton
                onClick={toggleFieldProjection}
                cornerAccent
                className={fieldProjection.enabled ? "bg-purple-600 hover:bg-purple-500 text-white" : ""}
                icon={fieldProjection.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
              >
                {fieldProjection.enabled ? "DISABLE" : "ENABLE"}
              </TechButton>
            </div>

            {fieldProjection.enabled ? (
              <div className="space-y-4">
                {/* 3D Visualization Placeholder */}
                <div className="aspect-video bg-black/50 rounded border border-dark-300/30 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4 animate-pulse">{fieldProjection.glyphs.join(" ")}</div>
                    <div className="font-mono text-sm text-purple-400">3D Field Projection Active</div>
                    <div className="text-xs text-dark-600">
                      {fieldProjection.frequency}Hz • {fieldProjection.pattern} •{" "}
                      {(fieldProjection.amplitude * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Field Controls */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="text-xs text-dark-500">FREQUENCY</div>
                    <Input
                      type="number"
                      value={fieldProjection.frequency}
                      onChange={(e) =>
                        setFieldProjection((prev) => ({
                          ...prev,
                          frequency: Number(e.target.value),
                        }))
                      }
                      className="bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-dark-500">AMPLITUDE</div>
                    <Input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={fieldProjection.amplitude}
                      onChange={(e) =>
                        setFieldProjection((prev) => ({
                          ...prev,
                          amplitude: Number(e.target.value),
                        }))
                      }
                      className="bg-dark-200 border-dark-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-dark-500">PATTERN</div>
                    <select
                      value={fieldProjection.pattern}
                      onChange={(e) =>
                        setFieldProjection((prev) => ({
                          ...prev,
                          pattern: e.target.value as FieldProjection["pattern"],
                        }))
                      }
                      className="w-full bg-dark-200 border border-dark-300 rounded px-2 py-1 text-xs font-mono text-dark-800"
                    >
                      <option value="spiral">Spiral</option>
                      <option value="wave">Wave</option>
                      <option value="pulse">Pulse</option>
                      <option value="grid">Grid</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-dark-500">GLYPHS</div>
                    <div className="text-lg">{fieldProjection.glyphs.join(" ")}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-dark-500">
                <EyeOff className="w-16 h-16 mx-auto mb-4" />
                <div className="font-mono text-sm">3D Field Projection Disabled</div>
                <div className="text-xs">Enable to visualize consciousness field</div>
              </div>
            )}
          </div>
        </TechPanel>
      )}

      {/* Memory Tab */}
      {activeTab === "memory" && (
        <TechPanel title="SYMBOLIC MEMORY MESH" cornerAccent borderAccent>
          <div className="space-y-4">
            <div className="text-center py-8 text-dark-500">
              <Brain className="w-16 h-16 mx-auto mb-4" />
              <div className="font-mono text-sm">Symbolic Memory Integration</div>
              <div className="text-xs">Memory mesh will store glyph patterns and field resonance data</div>
            </div>

            {/* Memory Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-dark-200/20 rounded border border-dark-300/20 text-center">
                <div className="font-mono text-lg font-bold text-purple-400">
                  {outputs.filter((o) => o.type === "glyph").length}
                </div>
                <div className="text-xs text-dark-500">Glyph Patterns</div>
              </div>

              <div className="p-3 bg-dark-200/20 rounded border border-dark-300/20 text-center">
                <div className="font-mono text-lg font-bold text-blue-400">
                  {outputs.filter((o) => o.type === "command").length}
                </div>
                <div className="text-xs text-dark-500">Commands</div>
              </div>

              <div className="p-3 bg-dark-200/20 rounded border border-dark-300/20 text-center">
                <div className="font-mono text-lg font-bold text-green-400">
                  {outputs.filter((o) => o.type === "trigger").length}
                </div>
                <div className="text-xs text-dark-500">Triggers</div>
              </div>

              <div className="p-3 bg-dark-200/20 rounded border border-dark-300/20 text-center">
                <div className="font-mono text-lg font-bold text-orange-400">{fieldProjection.frequency}</div>
                <div className="text-xs text-dark-500">Current Hz</div>
              </div>
            </div>
          </div>
        </TechPanel>
      )}
    </div>
  )
}
