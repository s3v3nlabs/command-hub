"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Brain, Database, AlertTriangle, CheckCircle, Download, Trash2, Plus } from "lucide-react"

interface EnvironmentConfig {
  GOVERNOR_MODE: string
  BLACKFRAME_MODE: string
  REPLAY_APPROVED_ONLY: boolean
  AI_MODEL: string
  BLACKFRAME_NODE_ID: string
  LOG_CHANNEL: string
  DISABLE_TELEMETRY: boolean
}

interface AIIntegration {
  id: string
  name: string
  provider: string
  status: "connected" | "disconnected" | "error" | "mock"
  apiKey: string
  endpoint?: string
  model?: string
  capabilities: string[]
  lastUsed?: Date
}

export function EnvironmentManager() {
  const [config, setConfig] = useState<EnvironmentConfig>({
    GOVERNOR_MODE: "gatekeeper",
    BLACKFRAME_MODE: "autonomy",
    REPLAY_APPROVED_ONLY: true,
    AI_MODEL: "gpt-4",
    BLACKFRAME_NODE_ID: "",
    LOG_CHANNEL: "ghostlight",
    DISABLE_TELEMETRY: true,
  })

  const [aiIntegrations, setAiIntegrations] = useState<AIIntegration[]>([
    {
      id: "groq",
      name: "Groq",
      provider: "Groq Inc.",
      status: "mock",
      apiKey: process.env.GROQ_API_KEY || "",
      model: "llama-3.1-70b-versatile",
      capabilities: ["text-generation", "reasoning", "code-analysis"],
      lastUsed: new Date(),
    },
    {
      id: "xai",
      name: "xAI (Grok)",
      provider: "xAI",
      status: "mock",
      apiKey: process.env.XAI_API_KEY || "",
      model: "grok-beta",
      capabilities: ["text-generation", "real-time-data", "reasoning"],
      lastUsed: new Date(),
    },
  ])

  const [newIntegration, setNewIntegration] = useState<Partial<AIIntegration>>({
    name: "",
    provider: "",
    apiKey: "",
    endpoint: "",
    model: "",
    capabilities: [],
  })

  const [showAddForm, setShowAddForm] = useState(false)

  // Update configuration
  const updateConfig = (key: keyof EnvironmentConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  // Add new AI integration
  const addAIIntegration = () => {
    if (!newIntegration.name || !newIntegration.provider) return

    const integration: AIIntegration = {
      id: newIntegration.name?.toLowerCase().replace(/\s+/g, "-") || "",
      name: newIntegration.name || "",
      provider: newIntegration.provider || "",
      status: "disconnected",
      apiKey: newIntegration.apiKey || "",
      endpoint: newIntegration.endpoint,
      model: newIntegration.model,
      capabilities: newIntegration.capabilities || [],
      lastUsed: new Date(),
    }

    setAiIntegrations((prev) => [...prev, integration])
    setNewIntegration({})
    setShowAddForm(false)
  }

  // Remove AI integration
  const removeAIIntegration = (id: string) => {
    setAiIntegrations((prev) => prev.filter((ai) => ai.id !== id))
  }

  // Toggle AI integration status
  const toggleAIIntegration = (id: string) => {
    setAiIntegrations((prev) =>
      prev.map((ai) => (ai.id === id ? { ...ai, status: ai.status === "connected" ? "mock" : "connected" } : ai)),
    )
  }

  // Export configuration
  const exportConfig = () => {
    const exportData = {
      environment: config,
      aiIntegrations: aiIntegrations,
      timestamp: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "singularity-config.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: AIIntegration["status"]) => {
    switch (status) {
      case "connected":
        return "bg-green-900/20 text-green-400 border-green-500"
      case "mock":
        return "bg-blue-900/20 text-blue-400 border-blue-500"
      case "error":
        return "bg-red-900/20 text-red-400 border-red-500"
      default:
        return "bg-gray-900/20 text-gray-400 border-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-dark-50 border-dark-300">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Environment & AI Integration Manager
            </span>
            <Button onClick={exportConfig} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Config
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="environment" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="environment">Environment</TabsTrigger>
              <TabsTrigger value="ai-integrations">AI Integrations</TabsTrigger>
              <TabsTrigger value="learning-system">Learning System</TabsTrigger>
            </TabsList>

            <TabsContent value="environment" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="governor-mode">Governor Mode</Label>
                    <select
                      id="governor-mode"
                      value={config.GOVERNOR_MODE}
                      onChange={(e) => updateConfig("GOVERNOR_MODE", e.target.value)}
                      className="w-full mt-1 p-2 bg-dark-100 border border-dark-300 rounded"
                    >
                      <option value="gatekeeper">Gatekeeper (Manual Approval)</option>
                      <option value="guardian">Guardian (Semi-Autonomous)</option>
                      <option value="autonomous">Autonomous (Full Auto)</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="blackframe-mode">Blackframe Mode</Label>
                    <select
                      id="blackframe-mode"
                      value={config.BLACKFRAME_MODE}
                      onChange={(e) => updateConfig("BLACKFRAME_MODE", e.target.value)}
                      className="w-full mt-1 p-2 bg-dark-100 border border-dark-300 rounded"
                    >
                      <option value="monitoring">Monitoring Only</option>
                      <option value="autonomy">Autonomy Enabled</option>
                      <option value="learning">Learning Mode</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="replay-approved"
                      checked={config.REPLAY_APPROVED_ONLY}
                      onCheckedChange={(checked) => updateConfig("REPLAY_APPROVED_ONLY", checked)}
                    />
                    <Label htmlFor="replay-approved">Replay Approved Only</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ai-model">Default AI Model</Label>
                    <Input
                      id="ai-model"
                      value={config.AI_MODEL}
                      onChange={(e) => updateConfig("AI_MODEL", e.target.value)}
                      placeholder="gpt-4"
                    />
                  </div>

                  <div>
                    <Label htmlFor="node-id">Blackframe Node ID</Label>
                    <Input
                      id="node-id"
                      value={config.BLACKFRAME_NODE_ID}
                      onChange={(e) => updateConfig("BLACKFRAME_NODE_ID", e.target.value)}
                      placeholder="node-001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="log-channel">Log Channel</Label>
                    <Input
                      id="log-channel"
                      value={config.LOG_CHANNEL}
                      onChange={(e) => updateConfig("LOG_CHANNEL", e.target.value)}
                      placeholder="ghostlight"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="disable-telemetry"
                      checked={config.DISABLE_TELEMETRY}
                      onCheckedChange={(checked) => updateConfig("DISABLE_TELEMETRY", checked)}
                    />
                    <Label htmlFor="disable-telemetry">Disable Telemetry</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai-integrations" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">AI Service Integrations</h3>
                <Button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-cyan-900/20 text-cyan-400 border-cyan-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Integration
                </Button>
              </div>

              {showAddForm && (
                <Card className="bg-dark-100 border-dark-400">
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Service Name</Label>
                        <Input
                          value={newIntegration.name || ""}
                          onChange={(e) => setNewIntegration((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="OpenAI GPT-4"
                        />
                      </div>
                      <div>
                        <Label>Provider</Label>
                        <Input
                          value={newIntegration.provider || ""}
                          onChange={(e) => setNewIntegration((prev) => ({ ...prev, provider: e.target.value }))}
                          placeholder="OpenAI"
                        />
                      </div>
                      <div>
                        <Label>API Key</Label>
                        <Input
                          type="password"
                          value={newIntegration.apiKey || ""}
                          onChange={(e) => setNewIntegration((prev) => ({ ...prev, apiKey: e.target.value }))}
                          placeholder="sk-..."
                        />
                      </div>
                      <div>
                        <Label>Model</Label>
                        <Input
                          value={newIntegration.model || ""}
                          onChange={(e) => setNewIntegration((prev) => ({ ...prev, model: e.target.value }))}
                          placeholder="gpt-4"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addAIIntegration} size="sm">
                        Add Integration
                      </Button>
                      <Button onClick={() => setShowAddForm(false)} variant="outline" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                {aiIntegrations.map((ai) => (
                  <Card key={ai.id} className="bg-dark-100 border-dark-400">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Brain className="h-5 w-5 text-cyan-400" />
                          <div>
                            <h4 className="font-medium">{ai.name}</h4>
                            <p className="text-sm text-gray-400">
                              {ai.provider} • {ai.model}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(ai.status)}>
                            {ai.status === "connected" && <CheckCircle className="h-3 w-3 mr-1" />}
                            {ai.status === "error" && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {ai.status.toUpperCase()}
                          </Badge>
                          <Switch
                            checked={ai.status === "connected"}
                            onCheckedChange={() => toggleAIIntegration(ai.id)}
                          />
                          <Button
                            onClick={() => removeAIIntegration(ai.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-400 border-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {ai.capabilities.map((cap) => (
                          <Badge key={cap} variant="outline" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="learning-system" className="space-y-4">
              <div className="text-center text-gray-400 py-8">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                <h3 className="text-lg font-semibold mb-2">Learning System Ready</h3>
                <p className="text-sm">
                  All UI/UX components are in place. Connect your local AI with custom LM from the backend to populate
                  the learning system with data.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
