"use client"

import { useState, useRef, useEffect } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Brain, Plus, Send, Download, RefreshCw, ChevronDown, Folder, Upload } from "lucide-react"

interface AIModel {
  id: string
  name: string
  provider: string
  version: string
  status: "available" | "loaded" | "loading" | "error"
  capabilities: string[]
  memoryUsage: string
  loadPath?: string
  isCustom: boolean
}

interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  modelId: string
}

const defaultModels: AIModel[] = [
  {
    id: "gpt-4o",
    name: "GPT-4 Omni",
    provider: "OpenAI",
    version: "2024-05-13",
    status: "available",
    capabilities: ["text", "vision", "code", "reasoning"],
    memoryUsage: "0 MB",
    isCustom: false,
  },
  {
    id: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    version: "20240229",
    status: "available",
    capabilities: ["text", "code", "analysis", "reasoning"],
    memoryUsage: "0 MB",
    isCustom: false,
  },
  {
    id: "grok-beta",
    name: "Grok Beta",
    provider: "xAI",
    version: "beta-1",
    status: "available",
    capabilities: ["text", "humor", "realtime", "reasoning"],
    memoryUsage: "0 MB",
    isCustom: false,
  },
  {
    id: "local-llama",
    name: "Llama 3.1 70B",
    provider: "Meta (Local)",
    version: "3.1",
    status: "available",
    capabilities: ["text", "code", "local"],
    memoryUsage: "0 MB",
    loadPath: "/models/llama-3.1-70b.gguf",
    isCustom: true,
  },
]

export default function EnhancedAIHub() {
  const [models, setModels] = useState<AIModel[]>(defaultModels)
  const [activeModel, setActiveModel] = useState<string>("gpt-4o")
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "system",
      content: "AI Hub initialized. Multiple model support active. Select a model to begin conversation.",
      timestamp: new Date(),
      modelId: "system",
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [customModelPath, setCustomModelPath] = useState("")
  const [showAddModel, setShowAddModel] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleLoadModel = async (modelId: string) => {
    setModels((prev) => prev.map((m) => (m.id === modelId ? { ...m, status: "loading" as const } : m)))

    // Simulate model loading
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setModels((prev) =>
      prev.map((m) =>
        m.id === modelId
          ? {
              ...m,
              status: "loaded" as const,
              memoryUsage: `${Math.floor(Math.random() * 8000) + 2000} MB`,
            }
          : m,
      ),
    )

    setActiveModel(modelId)

    const model = models.find((m) => m.id === modelId)
    if (model) {
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "system",
        content: `${model.name} loaded successfully. Model capabilities: ${model.capabilities.join(", ")}`,
        timestamp: new Date(),
        modelId: "system",
      }
      setMessages((prev) => [...prev, systemMessage])
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
      modelId: activeModel,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const activeModelData = models.find((m) => m.id === activeModel)
    const responses = [
      "I understand your request. Let me analyze this from multiple perspectives.",
      "Interesting question. Based on my training data and reasoning capabilities, here's my assessment:",
      "I can help with that. Let me break this down systematically:",
      "That's a complex topic. Here's my analysis based on available information:",
      "I see what you're asking. Let me provide a comprehensive response:",
    ]

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content:
        responses[Math.floor(Math.random() * responses.length)] +
        ` (Response from ${activeModelData?.name || "Unknown Model"})`,
      timestamp: new Date(),
      modelId: activeModel,
    }

    setMessages((prev) => [...prev, assistantMessage])
    setIsLoading(false)
  }

  const handleAddCustomModel = () => {
    if (!customModelPath.trim()) return

    const newModel: AIModel = {
      id: `custom-${Date.now()}`,
      name: `Custom Model`,
      provider: "Local",
      version: "1.0.0",
      status: "available",
      capabilities: ["text", "local"],
      memoryUsage: "0 MB",
      loadPath: customModelPath,
      isCustom: true,
    }

    setModels((prev) => [...prev, newModel])
    setCustomModelPath("")
    setShowAddModel(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "loaded":
        return "text-green-400 border-green-400/50"
      case "loading":
        return "text-yellow-400 border-yellow-400/50"
      case "available":
        return "text-blue-400 border-blue-400/50"
      case "error":
        return "text-red-400 border-red-400/50"
      default:
        return "text-gray-400 border-gray-400/50"
    }
  }

  const activeModelData = models.find((m) => m.id === activeModel)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Model Selector Panel */}
      <div className="lg:col-span-1">
        <TechPanel
          title="AI MODEL HUB"
          subtitle="MODULAR AI MULTIPLEXER"
          cornerAccent={true}
          borderAccent={true}
          className="h-full"
        >
          <div className="space-y-4">
            {/* Active Model Display */}
            <div className="relative">
              <TechButton
                variant="outline"
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="w-full justify-between border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono"
              >
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4" />
                  <span>{activeModelData?.name || "Select Model"}</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </TechButton>

              {showModelSelector && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-black border border-dark-400/50 rounded-md shadow-lg">
                  <ScrollArea className="max-h-60">
                    {models.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setActiveModel(model.id)
                          setShowModelSelector(false)
                          if (model.status === "available") {
                            handleLoadModel(model.id)
                          }
                        }}
                        className="w-full text-left p-3 hover:bg-dark-200/10 border-b border-dark-400/30 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-mono text-sm text-dark-700">{model.name}</div>
                            <div className="font-mono text-xs text-dark-500">{model.provider}</div>
                          </div>
                          <Badge variant="outline" className={`text-xs ${getStatusColor(model.status)}`}>
                            {model.status.toUpperCase()}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>

            {/* Model Info */}
            {activeModelData && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-dark-500">STATUS</span>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(activeModelData.status)}`}>
                    {activeModelData.status === "loading" && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                    {activeModelData.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-dark-500">MEMORY</span>
                  <span className="font-mono text-xs text-dark-700">{activeModelData.memoryUsage}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-dark-500">VERSION</span>
                  <span className="font-mono text-xs text-dark-700">{activeModelData.version}</span>
                </div>

                {activeModelData.loadPath && (
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-dark-500">PATH</span>
                    <span className="font-mono text-xs text-dark-700 truncate ml-2">{activeModelData.loadPath}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-dark-400/30">
                  <span className="font-mono text-xs text-dark-500 block mb-1">CAPABILITIES</span>
                  <div className="flex flex-wrap gap-1">
                    {activeModelData.capabilities.map((cap) => (
                      <Badge key={cap} variant="outline" className="text-xs border-dark-400/30 text-dark-600">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Add Custom Model */}
            <div className="space-y-2">
              <TechButton
                size="sm"
                variant="outline"
                onClick={() => setShowAddModel(!showAddModel)}
                className="w-full border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                ADD CUSTOM MODEL
              </TechButton>

              {showAddModel && (
                <div className="space-y-2 p-3 border border-dark-400/30 rounded">
                  <div className="flex items-center space-x-2">
                    <Folder className="w-4 h-4 text-dark-500" />
                    <Input
                      type="text"
                      placeholder="/path/to/model.gguf"
                      value={customModelPath}
                      onChange={(e) => setCustomModelPath(e.target.value)}
                      className="flex-1 bg-transparent border border-dark-400/30 text-dark-600 font-mono text-xs px-2 py-1 rounded"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <TechButton
                      size="sm"
                      onClick={handleAddCustomModel}
                      className="flex-1 bg-dark-600 hover:bg-dark-500 text-black font-mono text-xs"
                    >
                      ADD
                    </TechButton>
                    <TechButton
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddModel(false)}
                      className="flex-1 border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
                    >
                      CANCEL
                    </TechButton>
                  </div>
                </div>
              )}
            </div>

            {/* Model Actions */}
            <div className="grid grid-cols-2 gap-2">
              <TechButton
                size="sm"
                variant="outline"
                className="border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                EXPORT
              </TechButton>
              <TechButton
                size="sm"
                variant="outline"
                className="border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
              >
                <Upload className="w-3 h-3 mr-1" />
                IMPORT
              </TechButton>
            </div>
          </div>
        </TechPanel>
      </div>

      {/* Chat Interface */}
      <div className="lg:col-span-2">
        <TechPanel
          title="AI CONVERSATION"
          subtitle="MULTI-MODEL CHAT INTERFACE"
          cornerAccent={true}
          borderAccent={true}
          className="h-full flex flex-col"
        >
          <div className="flex-1 flex flex-col space-y-4">
            {/* Messages */}
            <ScrollArea className="flex-1 h-[400px]">
              <div className="space-y-3 p-2">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-dark-600 text-black"
                          : message.role === "system"
                            ? "bg-dark-200/20 text-dark-500 border border-dark-400/30"
                            : "bg-dark-300/30 text-dark-700 border border-dark-400/30"
                      }`}
                    >
                      <div className="font-mono text-sm">{message.content}</div>
                      <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                        <span>{message.role.toUpperCase()}</span>
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-dark-300/30 text-dark-700 border border-dark-400/30 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="font-mono text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="flex space-x-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Enter your message..."
                className="flex-1 bg-transparent border-dark-400/50 text-dark-600 font-mono text-sm resize-none"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
              <TechButton
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading || !activeModelData || activeModelData.status !== "loaded"}
                className="bg-dark-600 hover:bg-dark-500 text-black font-mono"
              >
                <Send className="w-4 h-4" />
              </TechButton>
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between text-xs font-mono text-dark-500 pt-2 border-t border-dark-400/30">
              <div className="flex items-center space-x-4">
                <span>Model: {activeModelData?.name || "None"}</span>
                <span>Messages: {messages.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                {activeModelData?.status === "loaded" && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span>READY</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TechPanel>
      </div>
    </div>
  )
}
