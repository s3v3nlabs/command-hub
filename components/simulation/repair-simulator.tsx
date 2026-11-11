"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Pause, CheckCircle, XCircle, Wrench, Activity, Target } from "lucide-react"

interface RepairIssue {
  id: string
  title: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  category: string
  estimatedTime: number
  confidence: number
  routes: RepairRoute[]
}

interface RepairRoute {
  id: string
  name: string
  description: string
  steps: RepairStep[]
  riskLevel: "low" | "medium" | "high"
  successProbability: number
  estimatedTime: number
  sideEffects: string[]
}

interface RepairStep {
  id: string
  action: string
  description: string
  duration: number
  riskLevel: "low" | "medium" | "high"
  dependencies: string[]
}

interface SimulationResult {
  success: boolean
  duration: number
  sideEffects: string[]
  confidence: number
  recommendations: string[]
}

export function RepairSimulator() {
  const [identifiedIssues] = useState<RepairIssue[]>([
    {
      id: "env-config",
      title: "Missing Environment Variables",
      description: "GOVERNOR_MODE, BLACKFRAME_MODE, and REPLAY_APPROVED_ONLY are not configured",
      severity: "high",
      category: "Configuration",
      estimatedTime: 5,
      confidence: 0.95,
      routes: [
        {
          id: "auto-config",
          name: "Automatic Configuration",
          description: "Automatically set recommended environment variables",
          riskLevel: "low",
          successProbability: 0.98,
          estimatedTime: 2,
          sideEffects: ["System restart required"],
          steps: [
            {
              id: "backup-env",
              action: "Backup current environment",
              description: "Create backup of existing .env file",
              duration: 1,
              riskLevel: "low",
              dependencies: [],
            },
            {
              id: "set-vars",
              action: "Set environment variables",
              description: "Configure GOVERNOR_MODE=gatekeeper, BLACKFRAME_MODE=autonomy, REPLAY_APPROVED_ONLY=true",
              duration: 1,
              riskLevel: "low",
              dependencies: ["backup-env"],
            },
          ],
        },
        {
          id: "manual-config",
          name: "Manual Configuration",
          description: "Provide configuration template for manual setup",
          riskLevel: "low",
          successProbability: 0.9,
          estimatedTime: 10,
          sideEffects: ["Requires manual intervention"],
          steps: [
            {
              id: "generate-template",
              action: "Generate configuration template",
              description: "Create .env template with recommended values",
              duration: 1,
              riskLevel: "low",
              dependencies: [],
            },
            {
              id: "user-review",
              action: "User review and approval",
              description: "User reviews and applies configuration manually",
              duration: 8,
              riskLevel: "low",
              dependencies: ["generate-template"],
            },
            {
              id: "validate-config",
              action: "Validate configuration",
              description: "Verify all variables are set correctly",
              duration: 1,
              riskLevel: "low",
              dependencies: ["user-review"],
            },
          ],
        },
      ],
    },
    {
      id: "ai-connectivity",
      title: "AI API Connectivity Issues",
      description: "API keys present but actual connectivity unverified",
      severity: "medium",
      category: "Integration",
      estimatedTime: 15,
      confidence: 0.85,
      routes: [
        {
          id: "test-apis",
          name: "API Connectivity Testing",
          description: "Test actual API connectivity while maintaining mock fallback",
          riskLevel: "medium",
          successProbability: 0.8,
          estimatedTime: 10,
          sideEffects: ["Potential API rate limiting", "Network dependency"],
          steps: [
            {
              id: "validate-keys",
              action: "Validate API keys",
              description: "Check format and basic validity of API keys",
              duration: 2,
              riskLevel: "low",
              dependencies: [],
            },
            {
              id: "test-endpoints",
              action: "Test API endpoints",
              description: "Send test requests to verify connectivity",
              duration: 5,
              riskLevel: "medium",
              dependencies: ["validate-keys"],
            },
            {
              id: "configure-fallback",
              action: "Configure fallback system",
              description: "Ensure mock system remains active as fallback",
              duration: 3,
              riskLevel: "low",
              dependencies: ["test-endpoints"],
            },
          ],
        },
        {
          id: "mock-only",
          name: "Enhanced Mock System",
          description: "Improve mock system to better simulate real AI responses",
          riskLevel: "low",
          successProbability: 0.95,
          estimatedTime: 8,
          sideEffects: ["Limited to simulated responses"],
          steps: [
            {
              id: "enhance-mocks",
              action: "Enhance mock responses",
              description: "Improve mock AI responses with more realistic patterns",
              duration: 5,
              riskLevel: "low",
              dependencies: [],
            },
            {
              id: "add-variability",
              action: "Add response variability",
              description: "Introduce realistic variability in mock responses",
              duration: 3,
              riskLevel: "low",
              dependencies: ["enhance-mocks"],
            },
          ],
        },
      ],
    },
    {
      id: "vault-initialization",
      title: "Empty Vault System",
      description: "Vault system operational but lacks historical data for learning",
      severity: "medium",
      category: "Data",
      estimatedTime: 20,
      confidence: 0.9,
      routes: [
        {
          id: "seed-vault",
          name: "Seed with Baseline Data",
          description: "Populate vault with baseline repair scenarios and historical patterns",
          riskLevel: "low",
          successProbability: 0.95,
          estimatedTime: 15,
          sideEffects: ["Synthetic data may not reflect real patterns"],
          steps: [
            {
              id: "generate-scenarios",
              action: "Generate baseline scenarios",
              description: "Create common repair scenarios based on best practices",
              duration: 8,
              riskLevel: "low",
              dependencies: [],
            },
            {
              id: "populate-vault",
              action: "Populate vault",
              description: "Store baseline scenarios in vault system",
              duration: 5,
              riskLevel: "low",
              dependencies: ["generate-scenarios"],
            },
            {
              id: "validate-data",
              action: "Validate data integrity",
              description: "Verify all data is properly stored and accessible",
              duration: 2,
              riskLevel: "low",
              dependencies: ["populate-vault"],
            },
          ],
        },
        {
          id: "import-data",
          name: "Import External Data",
          description: "Import historical incident data from external sources",
          riskLevel: "medium",
          successProbability: 0.75,
          estimatedTime: 25,
          sideEffects: ["Data quality dependency", "Format compatibility issues"],
          steps: [
            {
              id: "analyze-sources",
              action: "Analyze data sources",
              description: "Identify and validate external data sources",
              duration: 10,
              riskLevel: "medium",
              dependencies: [],
            },
            {
              id: "transform-data",
              action: "Transform data format",
              description: "Convert external data to vault-compatible format",
              duration: 10,
              riskLevel: "medium",
              dependencies: ["analyze-sources"],
            },
            {
              id: "import-validate",
              action: "Import and validate",
              description: "Import data and validate integrity",
              duration: 5,
              riskLevel: "low",
              dependencies: ["transform-data"],
            },
          ],
        },
      ],
    },
    {
      id: "replay-consistency",
      title: "Replay System Inconsistency",
      description: "Replay verification showing inconsistent confidence levels",
      severity: "low",
      category: "Algorithm",
      estimatedTime: 30,
      confidence: 0.75,
      routes: [
        {
          id: "algorithm-tuning",
          name: "Algorithm Optimization",
          description: "Optimize replay algorithms for more consistent results",
          riskLevel: "medium",
          successProbability: 0.85,
          estimatedTime: 25,
          sideEffects: ["May affect existing replay results", "Requires testing period"],
          steps: [
            {
              id: "analyze-variance",
              action: "Analyze result variance",
              description: "Study patterns in replay result inconsistencies",
              duration: 10,
              riskLevel: "low",
              dependencies: [],
            },
            {
              id: "optimize-algorithm",
              action: "Optimize algorithms",
              description: "Adjust replay algorithms based on variance analysis",
              duration: 12,
              riskLevel: "medium",
              dependencies: ["analyze-variance"],
            },
            {
              id: "test-consistency",
              action: "Test consistency",
              description: "Validate improved consistency across multiple runs",
              duration: 3,
              riskLevel: "low",
              dependencies: ["optimize-algorithm"],
            },
          ],
        },
        {
          id: "confidence-calibration",
          name: "Confidence Score Calibration",
          description: "Recalibrate confidence scoring system for better accuracy",
          riskLevel: "low",
          successProbability: 0.9,
          estimatedTime: 15,
          sideEffects: ["Historical confidence scores may need recalculation"],
          steps: [
            {
              id: "baseline-confidence",
              action: "Establish confidence baseline",
              description: "Create standardized confidence scoring baseline",
              duration: 8,
              riskLevel: "low",
              dependencies: [],
            },
            {
              id: "calibrate-scores",
              action: "Calibrate scoring system",
              description: "Adjust confidence calculation algorithms",
              duration: 5,
              riskLevel: "low",
              dependencies: ["baseline-confidence"],
            },
            {
              id: "validate-calibration",
              action: "Validate calibration",
              description: "Test calibrated system for improved consistency",
              duration: 2,
              riskLevel: "low",
              dependencies: ["calibrate-scores"],
            },
          ],
        },
      ],
    },
  ])

  const [selectedIssue, setSelectedIssue] = useState<RepairIssue | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<RepairRoute | null>(null)
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [simulationProgress, setSimulationProgress] = useState(0)
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([])

  const runSimulation = async (issue: RepairIssue, route: RepairRoute) => {
    setSimulationRunning(true)
    setSimulationProgress(0)

    // Simulate repair process
    for (let i = 0; i <= 100; i += 10) {
      setSimulationProgress(i)
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    // Generate simulation result
    const result: SimulationResult = {
      success: Math.random() < route.successProbability,
      duration: route.estimatedTime + (Math.random() - 0.5) * 5,
      sideEffects: route.sideEffects,
      confidence: route.successProbability,
      recommendations: [
        `Monitor system for ${Math.ceil(route.estimatedTime / 2)} minutes after repair`,
        "Validate all dependent systems are functioning correctly",
        "Document repair process for future reference",
      ],
    }

    setSimulationResults((prev) => [...prev, result])
    setSimulationRunning(false)
    setSimulationProgress(0)
  }

  const getSeverityColor = (severity: RepairIssue["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-900/20 text-red-400 border-red-500"
      case "high":
        return "bg-orange-900/20 text-orange-400 border-orange-500"
      case "medium":
        return "bg-amber-900/20 text-amber-400 border-amber-500"
      case "low":
        return "bg-blue-900/20 text-blue-400 border-blue-500"
    }
  }

  const getRiskColor = (risk: RepairRoute["riskLevel"]) => {
    switch (risk) {
      case "high":
        return "text-red-400"
      case "medium":
        return "text-amber-400"
      case "low":
        return "text-green-400"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-dark-50 border-dark-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-cyan-400" />
            Repair Simulation System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-900/20 border border-red-500 rounded p-3 text-center">
              <div className="text-2xl font-bold text-red-400">
                {identifiedIssues.filter((i) => i.severity === "critical" || i.severity === "high").length}
              </div>
              <div className="text-sm text-red-300">Critical/High</div>
            </div>
            <div className="bg-amber-900/20 border border-amber-500 rounded p-3 text-center">
              <div className="text-2xl font-bold text-amber-400">
                {identifiedIssues.filter((i) => i.severity === "medium").length}
              </div>
              <div className="text-sm text-amber-300">Medium</div>
            </div>
            <div className="bg-blue-900/20 border border-blue-500 rounded p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {identifiedIssues.filter((i) => i.severity === "low").length}
              </div>
              <div className="text-sm text-blue-300">Low</div>
            </div>
            <div className="bg-green-900/20 border border-green-500 rounded p-3 text-center">
              <div className="text-2xl font-bold text-green-400">
                {simulationResults.filter((r) => r.success).length}
              </div>
              <div className="text-sm text-green-300">Simulated Fixes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Identified Issues</h3>
          {identifiedIssues.map((issue) => (
            <Card
              key={issue.id}
              className={`bg-dark-50 border-dark-300 cursor-pointer transition-all hover:border-cyan-500 ${
                selectedIssue?.id === issue.id ? "border-cyan-500" : ""
              }`}
              onClick={() => setSelectedIssue(issue)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{issue.title}</h4>
                  <Badge className={getSeverityColor(issue.severity)}>{issue.severity.toUpperCase()}</Badge>
                </div>
                <p className="text-sm text-gray-400 mb-3">{issue.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Category: {issue.category}</span>
                  <span className="text-gray-500">Est. Time: {issue.estimatedTime}min</span>
                  <span className="text-gray-500">Confidence: {(issue.confidence * 100).toFixed(0)}%</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Repair Routes */}
        <div className="space-y-4">
          {selectedIssue ? (
            <>
              <h3 className="text-lg font-semibold">Repair Routes for: {selectedIssue.title}</h3>
              {selectedIssue.routes.map((route) => (
                <Card key={route.id} className="bg-dark-50 border-dark-300">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{route.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getRiskColor(route.riskLevel)}>
                          {route.riskLevel.toUpperCase()} RISK
                        </Badge>
                        <Button
                          onClick={() => runSimulation(selectedIssue, route)}
                          disabled={simulationRunning}
                          size="sm"
                          className="bg-cyan-900/20 text-cyan-400 border-cyan-500"
                        >
                          {simulationRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          Simulate
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{route.description}</p>

                    <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                      <div>
                        <span className="text-gray-500">Success Rate:</span>
                        <div className="font-medium">{(route.successProbability * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Est. Time:</span>
                        <div className="font-medium">{route.estimatedTime}min</div>
                      </div>
                    </div>

                    {route.sideEffects.length > 0 && (
                      <div className="mb-3">
                        <span className="text-xs text-gray-500">Side Effects:</span>
                        <ul className="text-xs text-amber-400 mt-1">
                          {route.sideEffects.map((effect, index) => (
                            <li key={index}>• {effect}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-2">
                      <span className="text-xs text-gray-500">Steps:</span>
                      {route.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400">{index + 1}.</span>
                          <span>{step.action}</span>
                          <Badge variant="outline" className={`text-xs ${getRiskColor(step.riskLevel)}`}>
                            {step.riskLevel}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {simulationRunning && (
                <Card className="bg-dark-50 border-dark-300">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 animate-pulse text-cyan-400" />
                      <span className="font-medium">Running Simulation...</span>
                    </div>
                    <Progress value={simulationProgress} className="h-2" />
                  </CardContent>
                </Card>
              )}

              {simulationResults.length > 0 && (
                <Card className="bg-dark-50 border-dark-300">
                  <CardHeader>
                    <CardTitle className="text-sm">Simulation Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      {simulationResults.map((result, index) => (
                        <div key={index} className="mb-3 p-3 bg-dark-100 rounded">
                          <div className="flex items-center gap-2 mb-2">
                            {result.success ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400" />
                            )}
                            <span className="font-medium">{result.success ? "Success" : "Failed"}</span>
                            <Badge variant="outline">{result.duration.toFixed(1)}min</Badge>
                          </div>
                          <div className="text-xs space-y-1">
                            <div>Confidence: {(result.confidence * 100).toFixed(0)}%</div>
                            {result.recommendations.map((rec, i) => (
                              <div key={i} className="text-gray-400">
                                • {rec}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <h3 className="text-lg font-semibold mb-2">Select an Issue</h3>
              <p className="text-sm">
                Choose an issue from the left to view available repair routes and run simulations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
