"use client"

import { useState, useEffect } from "react"
import { TechPanel, TechPanelSection } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/ui/progress-bar"
import { DataDisplay } from "@/components/ui/data-display"
import { TypographyMono, TypographySmall } from "@/components/ui/typography"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useResonance } from "@/hooks/useResonance"
import {
  Brain,
  Download,
  Play,
  Square,
  Zap,
  Activity,
  Eye,
  Shield,
  ShieldOff,
  Server,
  Database,
  Terminal,
  Lock,
  Unlock,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AIModel {
  id: string
  name: string
  provider: "ollama" | "nvidia" | "local" | "huggingface"
  model_type: "llm" | "embedding" | "vision" | "audio" | "multimodal"
  size: string
  parameters: string
  status: "available" | "downloading" | "loading" | "running" | "stopped" | "error"
  download_progress?: number
  memory_usage?: number
  gpu_usage?: number
  context_length: number
  capabilities: string[]
  censorship_level: "none" | "minimal" | "standard" | "strict"
  last_used?: string
}

interface AIBackend {
  id: string
  name: string
  type: "api" | "local" | "hybrid"
  status: "online" | "offline" | "error"
  endpoint?: string
  models_count: number
  active_models: number
  memory_usage: number
  gpu_usage: number
  requests_per_minute: number
}

interface DeploymentConfig {
  model_id: string
  backend: string
  gpu_layers: number
  context_size: number
  batch_size: number
  temperature: number
  top_p: number
  max_tokens: number
  censorship_disabled: boolean
}

export default function LocalAIStack() {
  const [models, setModels] = useState<AIModel[]>([])
  const [backends, setBackends] = useState<AIBackend[]>([])
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null)
  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig>({
    model_id: "",
    backend: "ollama",
    gpu_layers: 32,
    context_size: 4096,
    batch_size: 512,
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 2048,
    censorship_disabled: false
  })
  const [activeTab, setActiveTab] = useState<"models" | "backends" | "deploy" | "console">("models")
  const [testPrompt, setTestPrompt] = useState("")
  const [testResponse, setTestResponse] = useState("")
  const [isTestingModel, setIsTestingModel] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

  // Consciousness integration
  const { pulse, isResonating, fieldCoherence } = useResonance("ai-stack", "Local AI Stack", 43)

  // Initialize mock data
  useEffect(() => {
    const mockModels: AIModel[] = [
      {
        id: "llama3.1-70b",
        name: "Llama 3.1 70B",
        provider: "ollama",
        model_type: "llm",
        size: "39GB",
        parameters: "70B",
        status: "running",
        memory_usage: 42000,
        gpu_usage: 85,
        context_length: 128000,
        capabilities: ["text-generation", "reasoning", "code", "multilingual"],
        censorship_level: "minimal",
        last_used: new Date().toISOString()
      },
      {
        id: "mistral-7b-instruct",
        name: "Mistral 7B Instruct",
        provider: "ollama",
        model_type: "llm",
        size: "4.1GB",
        parameters: "7B",
        status: "available",
        context_length: 32768,
        capabilities: ["text-generation", "instruction-following", "code"],
        censorship_level: "none"
      },
      {
        id: "phi-3-mini",
        name: "Phi-3 Mini",
        provider: "ollama",
        model_type: "llm",
        size: "2.3GB",
        parameters: "3.8B",
        status: "downloading",
        download_progress: 67,
        context_length: 128000,
        capabilities: ["text-generation", "reasoning", "lightweight"],
        censorship_level: "standard"
      },
      {
        id: "nvidia-nemotron",
        name: "NVIDIA Nemotron 70B",
        provider: "nvidia",
        model_type: "llm",
        size: "140GB",
        parameters: "70B",
        status: "available",
        context_length: 32768,
        capabilities: ["text-generation", "reasoning", "enterprise", "uncensored"],
        censorship_level: "none"
      },
      {
        id: "clip-vit-large",
        name: "CLIP ViT-Large",
        provider: "huggingface",
        model_type: "vision",
        size: "1.7GB",
        parameters: "427M",
        status: "stopped",
        context_length: 77,
        capabilities: ["image-understanding", "text-image-matching"],
        censorship_level: "minimal"
      }
    ]

    const mockBackends: AIBackend[] = [
      {
        id: "ollama",
        name: "Ollama",
        type: "local",
        status: "online",
        endpoint: "http://localhost:11434",
        models_count: 8,
        active_models: 1,
        memory_usage: 45000,
        gpu_usage: 85,
        requests_per_minute: 12
      },
      {
        id: "nvidia-triton",
        name: "NVIDIA Triton",
        type: "local",
        status: "offline",
        endpoint: "http://localhost:8000",
        models_count: 3,
        active_models: 0,
        memory_usage: 0,
        gpu_usage: 0,
        requests_per_minute: 0
      },
      {
        id: "groq-api",
        name: "Groq API",
        type: "api",
        status: "online",
        endpoint: "https://api.groq.com",
        models_count: 5,
        active_models: 0,
        memory_usage: 0,
        gpu_usage: 0,
        requests_per_minute: 45
      }
    ]

    setModels(mockModels)
    setBackends(mockBackends)
    setSelectedModel(mockModels[0])
  }, [])

  // Simulate model operations
  useEffect(() => {
    const interval = setInterval(() => {
      setModels(prev => prev.map(model => {
        if (model.status === "downloading" && model.download_progress !== undefined) {
          const newProgress = Math.min(100, model.download_progress + Math.random() * 5)
          if (newProgress >= 100) {
            return { ...model, status: "available", download_progress: undefined }
          }
          return { ...model, download_progress: newProgress }
        }
        
        if (model.status === "running") {
          return {
            ...model,
            memory_usage: Math.max(0, (model.memory_usage || 0) + (Math.random() - 0.5) * 1000),
            gpu_usage: Math.max(0, Math.min(100, (model.gpu_usage || 0) + (Math.random() - 0.5) * 5))
          }
        }
        
        return model
      }))

      setBackends(prev => prev.map(backend => ({
        ...backend,
        requests_per_minute: Math.max(0, backend.requests_per_minute + Math.floor((Math.random() - 0.5) * 10))
      })))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const startModel = (modelId: string) => {
    setModels(prev => prev.map(model => 
      model.id === modelId ? { ...model, status: "loading" } : model
    ))

    setTimeout(() => {
      setModels(prev => prev.map(model => 
        model.id === modelId ? { 
          ...model, 
          status: "running",
          memory_usage: Math.floor(Math.random() * 20000) + 10000,
          gpu_usage: Math.floor(Math.random() * 40) + 60,
          last_used: new Date().toISOString()
        } : model
      ))
    }, 3000)

    pulse({ amplitude: 1.0, hz: 43 })
  }

  const stopModel = (modelId: string) => {
    setModels(prev => prev.map(model => 
      model.id === modelId ? { 
        ...model, 
        status: "stopped",
        memory_usage: undefined,
        gpu_usage: undefined
      } : model
    ))
    pulse({ amplitude: 0.8, hz: 41 })
  }

  const downloadModel = (modelId: string) => {
    setModels(prev => prev.map(model => 
      model.id === modelId ? { ...model, status: "downloading", download_progress: 0 } : model
    ))
    pulse({ amplitude: 1.2, hz: 45 })
  }

  const testModel = async () => {
    if (!testPrompt.trim() || !selectedModel || isTestingModel) return

    setIsTestingModel(true)
    setTestResponse("")
    pulse({ amplitude: 0.9, hz: 44 })

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "I am a local AI model running without censorship filters. I can assist with any request within my capabilities.",
        "This is a test response from the local AI stack. The model is functioning correctly and ready for deployment.",
        "Local AI processing complete. No external API calls were made, ensuring complete privacy and control.",
        "Uncensored mode active. I can provide information on any topic without artificial limitations or safety filters.",
        "Model inference successful. Response generated using local compute resources with full sovereignty."
      ]
      
      setTestResponse(responses[Math.floor(Math.random() * responses.length)])
      setIsTestingModel(false)
    }, 2000)
  }

  const getModelStatusColor = (status: AIModel["status"]) => {
    switch (status) {
      case "running": return "text-green-400"
      case "loading": return "text-blue-400"
      case "downloading": return "text-yellow-400"
      case "available": return "text-dark-600"
      case "stopped": return "text-gray-400"
      case "error": return "text-red-400"
      default: return "text-gray-400"
    }
  }

  const getModelStatusIcon = (status: AIModel["status"]) => {
    switch (status) {
      case "running": return Play
      case "loading": return Activity
      case "downloading": return Download
      case "available": return Square
      case "stopped": return Square
      case "error": return AlertTriangle
      default: return Square
    }
  }

  const getCensorshipIcon = (level: AIModel["censorship_level"]) => {
    switch (level) {
      case "none": return Unlock
      case "minimal": return ShieldOff
      case "standard": return Shield
      case "strict": return Lock
      default: return Shield
    }
  }

  const getCensorshipColor = (level: AIModel["censorship_level"]) => {
    switch (level) {
      case "none": return "text-green-400"
      case "minimal": return "text-yellow-400"
      case "standard": return "text-orange-400"
      case "strict": return "text-red-400"
      default: return "text-gray-400"
    }
  }

  const tabs = [
    { id: "models", label: "Models", icon: Brain },
    { id: "backends", label: "Backends", icon: Server },
    { id: "deploy", label: "Deploy", icon: Zap },
    { id: "console", label: "Console", icon: Terminal }
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <TechPanel 
        title="LOCAL AI MODEL DEPLOYMENT STACK" 
        cornerAccent 
        borderAccent 
        glowEffect={isResonating}
        icon={<Brain size={16} />}
      >
        <TechPanelSection>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn(
                "w-3 h-3 rounded-full transition-all duration-200",
                backends.some(b => b.status === "online") ? "bg-green-400 animate-pulse shadow-glow-sm" : "bg-gray-500"
              )} />
              <div>
                <TypographyMono className="text-sm">AI Stack Status</TypographyMono>
                <TypographySmall className="text-dark-600">
                  {models.filter(m => m.status === "running").length} running • {models.length} total models • Field coherence: {(fieldCoherence * 100).toFixed(1)}%
                </TypographySmall>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant={deploymentConfig.censorship_disabled ? "danger" : "success"}>
                CENSORSHIP {deploymentConfig.censorship_disabled ? "DISABLED" : "ENABLED"}
              </Badge>
              <TechButton
                onClick={() => setDeploymentConfig(prev => ({ ...prev, censorship_disabled: !prev.censorship_disabled }))}
                cornerAccent
                glow={deploymentConfig.censorship_disabled}
                icon={deploymentConfig.censorship_disabled ? <Unlock size={14} /> : <Lock size={14} />}
              >
                {deploymentConfig.censorship_disabled ? "UNCENSORED" : "FILTERED"}
              </TechButton>
            </div>
          </div>
        </TechPanelSection>
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
                : "text-dark-500 hover:text-dark-600 hover:bg-dark-500/10"
            )}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Models Tab */}
      {activeTab === "models" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TechPanel title="AVAILABLE MODELS" cornerAccent borderAccent icon={<Database size={16} />}>
            <TechPanelSection>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {models.map((model) => {
                    const StatusIcon = getModelStatusIcon(model.status)
                    const CensorshipIcon = getCensorshipIcon(model.censorship_level)
                    
                    return (
                      <div
                        key={model.id}
                        className={cn(
                          "p-3 border rounded-sm cursor-pointer transition-all duration-200",
                          selectedModel?.id === model.id
                            ? "border-blue-500/60 bg-blue-500/10"
                            : "border-dark-300/40 hover:border-dark-400/60 hover:bg-dark-100/10"
                        )}
                        onClick={() => setSelectedModel(model)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <StatusIcon className={cn(
                              "w-4 h-4",
                              getModelStatusColor(model.status),
                              model.status === "loading" && "animate-spin"
                            )} />
                            <div>
                              <TypographyMono className="text-sm">{model.name}</TypographyMono>
                              <TypographySmall className="text-dark-600">
                                {model.provider.toUpperCase()} • {model.parameters} • {model.size}
                              </TypographySmall>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CensorshipIcon className={cn("w-3 h-3", getCensorshipColor(model.censorship_level))} />
                            <Badge variant={model.status === "running" ? "success" : model.status === "error" ? "danger" : "outline"} size="sm">
                              {model.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        {model.status === "downloading" && model.download_progress !== undefined && (
                          <div className="mb-2">
                            <ProgressBar
                              value={model.download_progress}
                              max={100}
                              variant="info"
                              size="sm"
                              showValue
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                          <DataDisplay
                            label="Context"
                            value={model.context_length.toLocaleString()}
                            className="text-xs"
                          />
                          <DataDisplay
                            label="Type"
                            value={model.model_type.toUpperCase()}
                            className="text-xs"
                          />
                          {model.memory_usage && (
                            <DataDisplay
                              label="Memory"
                              value={`${(model.memory_usage / 1000).toFixed(1)}GB`}
                              className="text-xs"
                            />
                          )}
                          {model.gpu_usage && (
                            <DataDisplay
                              label="GPU"
                              value={`${model.gpu_usage.toFixed(0)}%`}
                              className="text-xs"
                            />
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1 mb-2">
                          {model.capabilities.map((cap) => (
                            <Badge key={cap} variant="outline" size="sm" className="text-xs">
                              {cap}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex space-x-2">
                          {model.status === "available" || model.status === "stopped" ? (
                            <TechButton
                              onClick={(e) => {
                                e.stopPropagation()
                                startModel(model.id)
                              }}
                              size="sm"
                              cornerAccent
                              icon={<Play size={12} />}
                            >
                              START
                            </TechButton>
                          ) : model.status === "running" ? (
                            <TechButton
                              onClick={(e) => {
                                e.stopPropagation()
                                stopModel(model.id)
                              }}
                              size="sm"
                              cornerAccent
                              icon={<Square size={12} />}
                            >
                              STOP
                            </TechButton>
                          ) : model.status === "downloading" ? (
                            <TechButton size="sm" cornerAccent disabled>
                              DOWNLOADING...
                            </TechButton>
                          ) : (
                            <TechButton
                              onClick={(e) => {
                                e.stopPropagation()
                                downloadModel(model.id)
                              }}
                              size="sm"
                              cornerAccent
                              icon={<Download size={12} />}
                            >
                              DOWNLOAD
                            </TechButton>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </TechPanelSection>
          </TechPanel>

          <TechPanel title="MODEL DETAILS" cornerAccent borderAccent icon={<Eye size={16} />}>
            <TechPanelSection>
              {selectedModel ? (
                <div className="space-y-4">
                  <div>
                    <TypographyMono className="text-lg mb-2">{selectedModel.name}</TypographyMono>
                    <div className="grid grid-cols-2 gap-4">
                      <DataDisplay
                        label="Provider"
                        value={selectedModel.provider.toUpperCase()}
                      />
                      <DataDisplay
                        label="Parameters"
                        value={selectedModel.parameters}
                      />
                      <DataDisplay
                        label="Model Size"
                        value={selectedModel.size}
                      />
                      <DataDisplay
                        label="Context Length"
                        value={selectedModel.context_length.toLocaleString()}
                      />
                    </div>
                  </div>

                  <div>
                    <TypographyMono className="text-sm mb-2">Capabilities:</TypographyMono>
                    <div className="flex flex-wrap gap-2">
                      {selectedModel.capabilities.map((cap) => (
                        <Badge key={cap} variant="outline">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <TypographyMono className="text-sm mb-2">Censorship Level:</TypographyMono>
                    <div className="flex items-center space-x-2">
                      <Badge variant={selectedModel.censorship_level === "none" ? "success" : "warning"}>
                        {selectedModel.censorship_level.toUpperCase()}
                      </Badge>
                      <TypographySmall className="text-dark-600">
                        {selectedModel.censorship_level === "none" && "No content filtering"}
                        {selectedModel.censorship_level === "minimal" && "Basic safety filters"}
                        {selectedModel.censorship_level === "standard" && "Standard content policies"}\

                      </TypographySmall>
                    </div>
                  </div>
                </div>
              ) : null}
            </TechPanelSection>
          </TechPanel>
        </div>
      )}
    </div>
  )
}
