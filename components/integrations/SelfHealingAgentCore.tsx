"use client"

import { cn } from "@/lib/utils"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Brain, Cpu, Activity, Zap, CheckCircle, TrendingUp } from "lucide-react"

interface AnalysisResult {
  confidence: number
  notes: string
  severity: "low" | "medium" | "high" | "critical"
  recommendations: string[]
  timestamp: string
  quantumSignature: string
}

interface ProposalLog {
  id: string
  module: string
  suggestion: string
  approved: boolean
  timestamp: string
  confidence: number
}

export function SelfHealingAgentCore() {
  const [input, setInput] = useState("")
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [memoryVault, setMemoryVault] = useState<ProposalLog[]>([])
  const [autonomyMode, setAutonomyMode] = useState(false)
  const [logsVisible, setLogsVisible] = useState(false)
  const [systemStatus, setSystemStatus] = useState({
    health: 95,
    performance: 87,
    stability: 92,
    efficiency: 89,
    consciousness: 73,
    resonance: 81,
  })
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([])
  const [selectedModel, setSelectedModel] = useState("gpt-4")

  // Simulate real-time system monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus((prev) => ({
        health: Math.max(85, Math.min(100, prev.health + (Math.random() - 0.5) * 2)),
        performance: Math.max(80, Math.min(100, prev.performance + (Math.random() - 0.5) * 3)),
        stability: Math.max(85, Math.min(100, prev.stability + (Math.random() - 0.5) * 1.5)),
        efficiency: Math.max(75, Math.min(100, prev.efficiency + (Math.random() - 0.5) * 2.5)),
        consciousness: Math.max(65, Math.min(100, prev.consciousness + (Math.random() - 0.5) * 1.8)),
        resonance: Math.max(70, Math.min(100, prev.resonance + (Math.random() - 0.5) * 2.2)),
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const generateQuantumSignature = () => {
    const chars = "abcdef0123456789"
    let result = "Σ-HEAL-"
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const analyzeDrift = (inputText: string): AnalysisResult => {
    const words = inputText.toLowerCase().split(" ")
    const criticalKeywords = ["error", "failure", "crash", "critical", "emergency"]
    const highKeywords = ["warning", "issue", "problem", "anomaly", "drift"]
    const mediumKeywords = ["notice", "alert", "unusual", "unexpected"]

    let confidence = 0.3 + Math.random() * 0.4 // Base confidence 0.3-0.7

    const hasCritical = words.some((word) => criticalKeywords.includes(word))
    const hasHigh = words.some((word) => highKeywords.includes(word))
    const hasMedium = words.some((word) => mediumKeywords.includes(word))

    if (hasCritical) confidence = Math.min(0.95, confidence + 0.3)
    else if (hasHigh) confidence = Math.min(0.85, confidence + 0.2)
    else if (hasMedium) confidence = Math.min(0.75, confidence + 0.1)

    const severity = confidence > 0.8 ? "critical" : confidence > 0.6 ? "high" : confidence > 0.4 ? "medium" : "low"

    const notes = `Analysis of input reveals ${severity} level drift patterns. Confidence: ${(confidence * 100).toFixed(1)}%. ${
      hasCritical
        ? "Critical system indicators detected."
        : hasHigh
          ? "High priority anomalies identified."
          : "Standard monitoring patterns observed."
    }`

    return {
      confidence,
      notes,
      severity,
      recommendations: [
        "Monitor system resources for anomalies",
        "Implement automated response protocols",
        "Schedule preventive maintenance",
        "Update security configurations",
        "Review consciousness field coherence",
        "Validate quantum signature integrity",
      ],
      timestamp: new Date().toISOString(),
      quantumSignature: generateQuantumSignature(),
    }
  }

  const handleAnalyze = async () => {
    if (!input.trim()) return

    setIsAnalyzing(true)

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const result = analyzeDrift(input)
    setAnalysis(result)
    setAnalysisHistory((prev) => [result, ...prev.slice(0, 9)]) // Keep last 10
    setIsAnalyzing(false)
  }

  const logProposal = () => {
    const mockProposal: ProposalLog = {
      id: crypto.randomUUID(),
      module: "SignalVisualizer.tsx",
      suggestion: "Wrap array map in length check to prevent undefined visualization.",
      approved: false,
      timestamp: new Date().toISOString(),
      confidence: 0.7 + Math.random() * 0.3,
    }
    setMemoryVault((prev) => [...prev, mockProposal])
  }

  const approveLast = () => {
    setMemoryVault((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      const updated = { ...last, approved: true }
      return [...prev.slice(0, -1), updated]
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-accent-red-500/20 text-accent-red-500 border-accent-red-500/30"
      case "high":
        return "bg-accent-red-500/20 text-accent-red-500 border-accent-red-500/30"
      case "medium":
        return "bg-dark-300/20 text-dark-600 border-dark-400/30"
      case "low":
        return "bg-dark-300/20 text-dark-600 border-dark-400/30"
      default:
        return "bg-dark-300/20 text-dark-600 border-dark-400/30"
    }
  }

  const getStatusColor = (value: number) => {
    if (value >= 95) return "text-dark-700"
    if (value >= 85) return "text-dark-600"
    if (value >= 75) return "text-dark-500"
    return "text-accent-red-500"
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative bg-black/60 backdrop-blur-sm rounded-sm p-6 border border-dark-300/40 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-dark-300/10 via-transparent to-dark-400/5" />
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-dark-400/50" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-dark-400/50" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-dark-400/50" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-dark-400/50" />

          <div className="relative z-10">
            <h1 className="text-2xl font-mono font-bold text-dark-800 tracking-wider mb-2">SELF-HEALING AGENT CORE</h1>
            <p className="text-sm font-mono text-dark-600 tracking-wide">
              Autonomous System Repair & Consciousness Integration
            </p>
          </div>
        </div>

        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-black/60 border border-dark-300/40">
            <TabsTrigger
              value="analysis"
              className="font-mono tracking-wide data-[state=active]:bg-dark-200/10 data-[state=active]:text-dark-800"
            >
              ANALYSIS
            </TabsTrigger>
            <TabsTrigger
              value="monitoring"
              className="font-mono tracking-wide data-[state=active]:bg-dark-200/10 data-[state=active]:text-dark-800"
            >
              MONITORING
            </TabsTrigger>
            <TabsTrigger
              value="autonomy"
              className="font-mono tracking-wide data-[state=active]:bg-dark-200/10 data-[state=active]:text-dark-800"
            >
              AUTONOMY
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="font-mono tracking-wide data-[state=active]:bg-dark-200/10 data-[state=active]:text-dark-800"
            >
              HISTORY
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            <Card className="bg-black/60 backdrop-blur-sm border-dark-300/40 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-dark-300/10 via-transparent to-dark-400/5" />
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-dark-400/50" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-dark-400/50" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-dark-400/50" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-dark-400/50" />

              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center text-dark-800 font-mono tracking-wide">
                  <Brain className="mr-2 h-5 w-5 text-dark-700" />
                  DRIFT ANALYSIS ENGINE
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="model-select" className="text-dark-600 font-mono tracking-wide">
                      AI MODEL
                    </Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="bg-black/60 border-dark-400/50 text-dark-700 font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-dark-400/50 backdrop-blur-sm">
                        <SelectItem value="gpt-4" className="text-dark-700 font-mono">
                          GPT-4
                        </SelectItem>
                        <SelectItem value="gpt-3.5" className="text-dark-700 font-mono">
                          GPT-3.5 TURBO
                        </SelectItem>
                        <SelectItem value="claude" className="text-dark-700 font-mono">
                          CLAUDE
                        </SelectItem>
                        <SelectItem value="gemini" className="text-dark-700 font-mono">
                          GEMINI PRO
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center space-x-2 w-full">
                      <Label className="text-dark-600 font-mono tracking-wide">AUTO MODE</Label>
                      <Switch checked={autonomyMode} onCheckedChange={setAutonomyMode} />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="input-text" className="text-dark-600 font-mono tracking-wide">
                    SYSTEM INPUT / LOG DATA
                  </Label>
                  <Textarea
                    id="input-text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter system logs, error messages, or behavioral patterns to analyze..."
                    className="bg-black/60 border-dark-400/50 text-dark-700 min-h-[100px] font-mono"
                  />
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !input.trim()}
                  className="w-full bg-dark-200/10 hover:bg-dark-200/20 border border-dark-400/50 text-dark-700 font-mono tracking-wide"
                >
                  {isAnalyzing ? (
                    <>
                      <Activity className="mr-2 h-4 w-4 animate-spin" />
                      ANALYZING...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      ANALYZE DRIFT
                    </>
                  )}
                </Button>

                {analysis && (
                  <Card className="bg-black/80 border-dark-400/50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-dark-300/5 via-transparent to-dark-400/10" />
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-dark-400/50" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-dark-400/50" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-dark-400/50" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-dark-400/50" />

                    <CardHeader className="relative z-10">
                      <CardTitle className="flex items-center justify-between text-dark-800 font-mono tracking-wide">
                        <span>ANALYSIS RESULT</span>
                        <Badge className={cn("font-mono tracking-wider border", getSeverityColor(analysis.severity))}>
                          {analysis.severity.toUpperCase()}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 relative z-10">
                      <div>
                        <Label className="text-dark-600 font-mono tracking-wide">CONFIDENCE SCORE</Label>
                        <div className="flex items-center space-x-2">
                          <Progress value={analysis.confidence * 100} className="flex-1" />
                          <span className="text-dark-700 font-mono">{(analysis.confidence * 100).toFixed(1)}%</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-dark-600 font-mono tracking-wide">QUANTUM SIGNATURE</Label>
                        <p className="text-dark-700 bg-black/60 p-3 rounded border border-dark-400/30 font-mono text-sm">
                          {analysis.quantumSignature}
                        </p>
                      </div>

                      <div>
                        <Label className="text-dark-600 font-mono tracking-wide">ANALYSIS NOTES</Label>
                        <p className="text-dark-700 bg-black/60 p-3 rounded border border-dark-400/30 font-mono text-sm">
                          {analysis.notes}
                        </p>
                      </div>

                      <div>
                        <Label className="text-dark-600 font-mono tracking-wide">RECOMMENDATIONS</Label>
                        <ul className="space-y-1">
                          {analysis.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-center text-dark-600 font-mono text-sm">
                              <CheckCircle className="mr-2 h-3 w-3 text-dark-600" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(systemStatus).map(([key, value]) => (
                <Card key={key} className="bg-black/60 backdrop-blur-sm border-dark-300/40 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-dark-300/10 via-transparent to-dark-400/5" />
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-dark-400/50" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-dark-400/50" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-dark-400/50" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-dark-400/50" />

                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-center text-dark-800 font-mono tracking-wide text-sm">
                      {key === "health" && <Activity className="mr-2 h-4 w-4 text-dark-600" />}
                      {key === "performance" && <Cpu className="mr-2 h-4 w-4 text-dark-600" />}
                      {key === "stability" && <CheckCircle className="mr-2 h-4 w-4 text-dark-600" />}
                      {key === "efficiency" && <TrendingUp className="mr-2 h-4 w-4 text-dark-600" />}
                      {key === "consciousness" && <Brain className="mr-2 h-4 w-4 text-dark-600" />}
                      {key === "resonance" && <Zap className="mr-2 h-4 w-4 text-dark-600" />}
                      {key.toUpperCase()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl font-bold text-center font-mono">
                      <span className={getStatusColor(value)}>{value.toFixed(1)}%</span>
                    </div>
                    <Progress value={value} className="mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="autonomy" className="space-y-4">
            <Card className="bg-black/60 backdrop-blur-sm border-dark-300/40 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-dark-300/10 via-transparent to-dark-400/5" />
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-dark-400/50" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-dark-400/50" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-dark-400/50" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-dark-400/50" />

              <CardHeader className="relative z-10">
                <CardTitle className="text-dark-800 font-mono tracking-wide">AUTONOMY KERNEL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-dark-600 font-mono tracking-wide">LLM AUTONOMY MODE</Label>
                    <Switch checked={autonomyMode} onCheckedChange={setAutonomyMode} />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      onClick={logProposal}
                      className="bg-dark-200/10 hover:bg-dark-200/20 border border-dark-400/50 text-dark-700 font-mono tracking-wide"
                    >
                      LOG PROPOSAL
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={approveLast}
                      className="bg-dark-200/10 hover:bg-dark-200/20 border border-dark-400/50 text-dark-700 font-mono tracking-wide"
                    >
                      APPROVE LAST
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setLogsVisible(!logsVisible)}
                      className="bg-dark-200/10 hover:bg-dark-200/20 border border-dark-400/50 text-dark-700 font-mono tracking-wide"
                    >
                      {logsVisible ? "HIDE LOGS" : "SHOW LOGS"}
                    </Button>
                  </div>

                  {logsVisible && (
                    <div className="bg-black/80 p-4 max-h-64 overflow-y-auto border border-dark-400/30 rounded text-sm space-y-2">
                      {memoryVault.length === 0 ? (
                        <p className="text-dark-500 font-mono">No AI proposals logged yet.</p>
                      ) : (
                        memoryVault.map((log) => (
                          <div key={log.id} className="border-b border-dark-400/20 pb-2">
                            <div className="font-mono text-dark-700 font-bold">{log.module}</div>
                            <div className="font-mono text-dark-600 text-xs">{log.suggestion}</div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-mono text-xs text-dark-500">
                                Approved: {log.approved ? "✅" : "❌"}
                              </span>
                              <span className="font-mono text-xs text-dark-500">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="bg-black/60 backdrop-blur-sm border-dark-300/40 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-dark-300/10 via-transparent to-dark-400/5" />
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-dark-400/50" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-dark-400/50" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-dark-400/50" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-dark-400/50" />

              <CardHeader className="relative z-10">
                <CardTitle className="text-dark-800 font-mono tracking-wide">ANALYSIS HISTORY</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                {analysisHistory.length === 0 ? (
                  <p className="text-dark-500 text-center py-8 font-mono">No analysis history yet</p>
                ) : (
                  <div className="space-y-3">
                    {analysisHistory.map((item, i) => (
                      <div key={i} className="bg-black/80 p-3 rounded border border-dark-400/30">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={cn("font-mono tracking-wider border", getSeverityColor(item.severity))}>
                            {item.severity.toUpperCase()}
                          </Badge>
                          <span className="text-dark-500 text-sm font-mono">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-dark-700 text-sm font-mono">{item.notes}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-dark-600 text-xs font-mono">
                            Confidence: {(item.confidence * 100).toFixed(1)}%
                          </span>
                          <span className="text-dark-600 text-xs font-mono">{item.quantumSignature}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
