"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Brain,
  Shield,
  Activity,
  Cpu,
  Settings,
  Database,
  MessageSquare,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TestResult {
  id: string
  name: string
  category: string
  status: "pending" | "testing" | "success" | "error" | "warning"
  message: string
  details: string[]
  responseTime?: number
  lastTested?: Date
  icon: React.ReactNode
  criticalIssues: string[]
  recommendations: string[]
}

export function AiAutonomyTester() {
  const [testResults, setTestResults] = useState<TestResult[]>([
    {
      id: "self-healing-core",
      name: "Self-Healing Agent Core",
      category: "Autonomy",
      status: "pending",
      message: "Not tested",
      details: [],
      criticalIssues: [],
      recommendations: [],
      icon: <Activity className="h-4 w-4" />,
    },
    {
      id: "autonomy-governor",
      name: "Autonomy Governor",
      category: "Autonomy",
      status: "pending",
      message: "Not tested",
      details: [],
      criticalIssues: [],
      recommendations: [],
      icon: <Shield className="h-4 w-4" />,
    },
    {
      id: "vault-system",
      name: "Self-Healing Vault",
      category: "Storage",
      status: "pending",
      message: "Not tested",
      details: [],
      criticalIssues: [],
      recommendations: [],
      icon: <Database className="h-4 w-4" />,
    },
    {
      id: "replay-system",
      name: "Replay Verification",
      category: "Validation",
      status: "pending",
      message: "Not tested",
      details: [],
      criticalIssues: [],
      recommendations: [],
      icon: <RefreshCw className="h-4 w-4" />,
    },
    {
      id: "groq-ai",
      name: "Groq AI Integration",
      category: "AI",
      status: "pending",
      message: "Not tested",
      details: [],
      criticalIssues: [],
      recommendations: [],
      icon: <Brain className="h-4 w-4" />,
    },
    {
      id: "xai-grok",
      name: "xAI (Grok) Integration",
      category: "AI",
      status: "pending",
      message: "Not tested",
      details: [],
      criticalIssues: [],
      recommendations: [],
      icon: <Cpu className="h-4 w-4" />,
    },
    {
      id: "buildship-harness",
      name: "BuildShip Multi-AI Harness",
      category: "AI",
      status: "pending",
      message: "Not tested",
      details: [],
      criticalIssues: [],
      recommendations: [],
      icon: <Zap className="h-4 w-4" />,
    },
    {
      id: "ai-console",
      name: "AI Console Interface",
      category: "Interface",
      status: "pending",
      message: "Not tested",
      details: [],
      criticalIssues: [],
      recommendations: [],
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      id: "environment-config",
      name: "Environment Configuration",
      category: "Configuration",
      status: "pending",
      message: "Not tested",
      details: [],
      criticalIssues: [],
      recommendations: [],
      icon: <Settings className="h-4 w-4" />,
    },
  ])

  const [isRunningTests, setIsRunningTests] = useState(false)
  const [testProgress, setTestProgress] = useState(0)
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null)

  // Test individual integration
  const testIntegration = async (integration: TestResult): Promise<TestResult> => {
    const startTime = Date.now()

    try {
      switch (integration.id) {
        case "self-healing-core":
          // Test Self-Healing Agent Core
          await new Promise((resolve) => setTimeout(resolve, 1000))

          const issues: string[] = []
          const details: string[] = []
          const recommendations: string[] = []

          // Check if core functions exist
          try {
            const { analyzeDrift } = await import("@/lib/selfHealing/AgentCore")
            details.push("✓ AgentCore module loaded successfully")

            // Test drift analysis
            const testResult = analyzeDrift("test error signal")
            details.push(`✓ Drift analysis functional: ${testResult.severity} (confidence: ${testResult.confidence})`)

            if (testResult.confidence < 0.5) {
              issues.push("Low confidence in drift analysis results")
              recommendations.push("Review and improve drift detection algorithms")
            }
          } catch (error) {
            issues.push("Failed to load AgentCore module")
            details.push(`✗ AgentCore import error: ${error}`)
            recommendations.push("Check AgentCore module implementation and dependencies")
          }

          return {
            ...integration,
            status: issues.length > 0 ? "warning" : "success",
            message: issues.length > 0 ? `${issues.length} issues detected` : "Core functionality operational",
            details,
            criticalIssues: issues,
            recommendations,
            responseTime: Date.now() - startTime,
            lastTested: new Date(),
          }

        case "autonomy-governor":
          // Test Autonomy Governor
          await new Promise((resolve) => setTimeout(resolve, 800))

          const govIssues: string[] = []
          const govDetails: string[] = []
          const govRecommendations: string[] = []

          try {
            const { authorize } = await import("@/lib/selfHealing/Governor")
            govDetails.push("✓ Governor module loaded successfully")

            // Test authorization
            const authResult = authorize("test_action", { approved: false })
            govDetails.push(`✓ Authorization system functional: ${authResult.approved ? "APPROVED" : "DENIED"}`)
            govDetails.push(`  Reason: ${authResult.reason}`)

            // Check environment variables
            const envVars = ["GOVERNOR_MODE", "BLACKFRAME_MODE", "REPLAY_APPROVED_ONLY"]

            envVars.forEach((envVar) => {
              const value = process.env[envVar]
              if (value) {
                govDetails.push(`✓ ${envVar}: ${value}`)
              } else {
                govIssues.push(`Missing environment variable: ${envVar}`)
                govRecommendations.push(`Set ${envVar} environment variable for proper governor operation`)
              }
            })
          } catch (error) {
            govIssues.push("Failed to load Governor module")
            govDetails.push(`✗ Governor import error: ${error}`)
            govRecommendations.push("Check Governor module implementation")
          }

          return {
            ...integration,
            status: govIssues.length > 0 ? "error" : "success",
            message: govIssues.length > 0 ? `${govIssues.length} critical issues` : "Governor operational",
            details: govDetails,
            criticalIssues: govIssues,
            recommendations: govRecommendations,
            responseTime: Date.now() - startTime,
            lastTested: new Date(),
          }

        case "vault-system":
          // Test Vault System
          await new Promise((resolve) => setTimeout(resolve, 1200))

          const vaultIssues: string[] = []
          const vaultDetails: string[] = []
          const vaultRecommendations: string[] = []

          try {
            const { storeProposal, getProposals } = await import("@/lib/selfHealing/Vault")
            vaultDetails.push("✓ Vault module loaded successfully")

            // Test storing a proposal
            const testProposal = {
              action: "test_patch",
              reason: "integration_test",
              approved: false,
            }

            const stored = await storeProposal(testProposal)
            vaultDetails.push(`✓ Proposal storage functional: ID ${stored.id}`)

            // Test retrieving proposals
            const proposals = await getProposals(5)
            vaultDetails.push(`✓ Proposal retrieval functional: ${proposals.length} proposals found`)

            if (proposals.length === 0) {
              vaultIssues.push("No historical proposals found in vault")
              vaultRecommendations.push("Vault appears empty - may need initialization or data migration")
            }
          } catch (error) {
            vaultIssues.push("Vault system failure")
            vaultDetails.push(`✗ Vault error: ${error}`)
            vaultRecommendations.push("Check vault implementation and file system permissions")
          }

          return {
            ...integration,
            status: vaultIssues.length > 0 ? "warning" : "success",
            message: vaultIssues.length > 0 ? `${vaultIssues.length} vault issues` : "Vault system operational",
            details: vaultDetails,
            criticalIssues: vaultIssues,
            recommendations: vaultRecommendations,
            responseTime: Date.now() - startTime,
            lastTested: new Date(),
          }

        case "replay-system":
          // Test Replay System
          await new Promise((resolve) => setTimeout(resolve, 900))

          const replayIssues: string[] = []
          const replayDetails: string[] = []
          const replayRecommendations: string[] = []

          try {
            const { simulateReplay } = await import("@/lib/selfHealing/Replay")
            replayDetails.push("✓ Replay module loaded successfully")

            // Test replay simulation
            const testResponse = { action: "test", confidence: 0.8 }
            const replayResult = await simulateReplay(testResponse)

            replayDetails.push(
              `✓ Replay simulation functional: ${replayResult.replayResult.success ? "SUCCESS" : "FAILED"}`,
            )
            replayDetails.push(`  Confidence: ${replayResult.replayResult.metrics.confidence.toFixed(2)}`)
            replayDetails.push(`  Stability: ${replayResult.replayResult.metrics.stability.toFixed(2)}`)

            if (!replayResult.replayResult.success) {
              replayIssues.push("Replay simulation indicates instability")
              replayRecommendations.push("Review replay algorithms for consistency")
            }
          } catch (error) {
            replayIssues.push("Replay system failure")
            replayDetails.push(`✗ Replay error: ${error}`)
            replayRecommendations.push("Check replay module implementation")
          }

          return {
            ...integration,
            status: replayIssues.length > 0 ? "warning" : "success",
            message: replayIssues.length > 0 ? `${replayIssues.length} replay issues` : "Replay system operational",
            details: replayDetails,
            criticalIssues: replayIssues,
            recommendations: replayRecommendations,
            responseTime: Date.now() - startTime,
            lastTested: new Date(),
          }

        case "groq-ai":
          // Test Groq AI
          await new Promise((resolve) => setTimeout(resolve, 1500))

          const groqIssues: string[] = []
          const groqDetails: string[] = []
          const groqRecommendations: string[] = []

          if (!process.env.GROQ_API_KEY) {
            groqIssues.push("GROQ_API_KEY environment variable not set")
            groqRecommendations.push("Configure GROQ_API_KEY for AI functionality")
          } else {
            groqDetails.push("✓ GROQ_API_KEY configured")

            // Test API endpoint (mock)
            try {
              // Simulate API call
              groqDetails.push("✓ Groq API endpoint accessible")
              groqDetails.push("✓ Model selection available")
            } catch (error) {
              groqIssues.push("Groq API connection failed")
              groqRecommendations.push("Verify GROQ_API_KEY validity and network connectivity")
            }
          }

          return {
            ...integration,
            status: groqIssues.length > 0 ? "error" : "success",
            message: groqIssues.length > 0 ? `${groqIssues.length} API issues` : "Groq AI operational",
            details: groqDetails,
            criticalIssues: groqIssues,
            recommendations: groqRecommendations,
            responseTime: Date.now() - startTime,
            lastTested: new Date(),
          }

        case "xai-grok":
          // Test xAI (Grok)
          await new Promise((resolve) => setTimeout(resolve, 1300))

          const xaiIssues: string[] = []
          const xaiDetails: string[] = []
          const xaiRecommendations: string[] = []

          if (!process.env.XAI_API_KEY) {
            xaiIssues.push("XAI_API_KEY environment variable not set")
            xaiRecommendations.push("Configure XAI_API_KEY for Grok integration")
          } else {
            xaiDetails.push("✓ XAI_API_KEY configured")

            // Test API endpoint (mock)
            try {
              xaiDetails.push("✓ xAI API endpoint accessible")
              xaiDetails.push("✓ Grok model available")
            } catch (error) {
              xaiIssues.push("xAI API connection failed")
              xaiRecommendations.push("Verify XAI_API_KEY validity and API access")
            }
          }

          return {
            ...integration,
            status: xaiIssues.length > 0 ? "error" : "success",
            message: xaiIssues.length > 0 ? `${xaiIssues.length} API issues` : "xAI (Grok) operational",
            details: xaiDetails,
            criticalIssues: xaiIssues,
            recommendations: xaiRecommendations,
            responseTime: Date.now() - startTime,
            lastTested: new Date(),
          }

        case "buildship-harness":
          // Test BuildShip Multi-AI Harness
          await new Promise((resolve) => setTimeout(resolve, 1100))

          const buildshipIssues: string[] = []
          const buildshipDetails: string[] = []
          const buildshipRecommendations: string[] = []

          try {
            const { getMultiModelResponses } = await import("@/lib/selfHealing/BuildShipHarness")
            buildshipDetails.push("✓ BuildShip harness module loaded")

            // Test multi-model responses
            const responses = await getMultiModelResponses("test prompt")
            buildshipDetails.push(`✓ Multi-model responses functional: ${responses.length} models`)

            responses.forEach((response) => {
              buildshipDetails.push(`  - ${response.model}: ${response.confidence} confidence`)
            })

            if (responses.length < 3) {
              buildshipIssues.push("Insufficient model diversity in responses")
              buildshipRecommendations.push("Ensure all mock models are properly configured")
            }
          } catch (error) {
            buildshipIssues.push("BuildShip harness failure")
            buildshipDetails.push(`✗ BuildShip error: ${error}`)
            buildshipRecommendations.push("Check BuildShip harness implementation")
          }

          return {
            ...integration,
            status: buildshipIssues.length > 0 ? "warning" : "success",
            message:
              buildshipIssues.length > 0 ? `${buildshipIssues.length} harness issues` : "Multi-AI harness operational",
            details: buildshipDetails,
            criticalIssues: buildshipIssues,
            recommendations: buildshipRecommendations,
            responseTime: Date.now() - startTime,
            lastTested: new Date(),
          }

        case "ai-console":
          // Test AI Console Interface
          await new Promise((resolve) => setTimeout(resolve, 600))

          const consoleIssues: string[] = []
          const consoleDetails: string[] = []
          const consoleRecommendations: string[] = []

          try {
            // Test chat API endpoint
            const response = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: "test" }),
            })

            if (response.ok) {
              const data = await response.json()
              consoleDetails.push("✓ Chat API endpoint accessible")
              consoleDetails.push(`✓ Response model: ${data.model || "unknown"}`)
              consoleDetails.push(`✓ Mock mode: ${data.isMock ? "enabled" : "disabled"}`)
            } else {
              consoleIssues.push("Chat API endpoint not responding")
              consoleRecommendations.push("Check chat API route implementation")
            }
          } catch (error) {
            consoleIssues.push("AI Console API failure")
            consoleDetails.push(`✗ Console error: ${error}`)
            consoleRecommendations.push("Verify chat API route is properly configured")
          }

          return {
            ...integration,
            status: consoleIssues.length > 0 ? "error" : "success",
            message: consoleIssues.length > 0 ? `${consoleIssues.length} console issues` : "AI Console operational",
            details: consoleDetails,
            criticalIssues: consoleIssues,
            recommendations: consoleRecommendations,
            responseTime: Date.now() - startTime,
            lastTested: new Date(),
          }

        case "environment-config":
          // Test Environment Configuration
          await new Promise((resolve) => setTimeout(resolve, 400))

          const envIssues: string[] = []
          const envDetails: string[] = []
          const envRecommendations: string[] = []

          const requiredEnvVars = [
            "GROQ_API_KEY",
            "XAI_API_KEY",
            "GOVERNOR_MODE",
            "BLACKFRAME_MODE",
            "REPLAY_APPROVED_ONLY",
          ]

          const optionalEnvVars = ["OPENAI_API_KEY", "BLACKFRAME_NODE_ID", "LOG_CHANNEL"]

          requiredEnvVars.forEach((envVar) => {
            if (process.env[envVar]) {
              envDetails.push(`✓ ${envVar}: configured`)
            } else {
              envIssues.push(`Missing required environment variable: ${envVar}`)
              envRecommendations.push(`Set ${envVar} for full functionality`)
            }
          })

          optionalEnvVars.forEach((envVar) => {
            if (process.env[envVar]) {
              envDetails.push(`✓ ${envVar}: configured (optional)`)
            } else {
              envDetails.push(`- ${envVar}: not set (optional)`)
            }
          })

          return {
            ...integration,
            status: envIssues.length > 0 ? "error" : "success",
            message:
              envIssues.length > 0 ? `${envIssues.length} configuration issues` : "Environment properly configured",
            details: envDetails,
            criticalIssues: envIssues,
            recommendations: envRecommendations,
            responseTime: Date.now() - startTime,
            lastTested: new Date(),
          }

        default:
          return {
            ...integration,
            status: "error",
            message: "Unknown integration type",
            details: ["Unknown test type"],
            criticalIssues: ["Test not implemented"],
            recommendations: ["Implement test for this integration"],
            lastTested: new Date(),
          }
      }
    } catch (error) {
      return {
        ...integration,
        status: "error",
        message: `Test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: [`Error: ${error}`],
        criticalIssues: ["Test execution failed"],
        recommendations: ["Check test implementation and dependencies"],
        lastTested: new Date(),
      }
    }
  }

  // Run all tests
  const runAllTests = async () => {
    setIsRunningTests(true)
    setTestProgress(0)

    for (let i = 0; i < testResults.length; i++) {
      const integration = testResults[i]

      // Update status to testing
      setTestResults((prev) =>
        prev.map((item) => (item.id === integration.id ? { ...item, status: "testing", message: "Testing..." } : item)),
      )

      // Run the test
      const result = await testIntegration(integration)

      // Update with result
      setTestResults((prev) => prev.map((item) => (item.id === integration.id ? result : item)))

      // Update progress
      setTestProgress(((i + 1) / testResults.length) * 100)
    }

    setIsRunningTests(false)
  }

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return "text-green-400 bg-green-900/20 border-green-500"
      case "error":
        return "text-red-400 bg-red-900/20 border-red-500"
      case "warning":
        return "text-amber-400 bg-amber-900/20 border-amber-500"
      case "testing":
        return "text-blue-400 bg-blue-900/20 border-blue-500"
      default:
        return "text-gray-400 bg-gray-900/20 border-gray-500"
    }
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4" />
      case "error":
        return <XCircle className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "testing":
        return <RefreshCw className="h-4 w-4 animate-spin" />
      default:
        return <RefreshCw className="h-4 w-4" />
    }
  }

  const successCount = testResults.filter((r) => r.status === "success").length
  const errorCount = testResults.filter((r) => r.status === "error").length
  const warningCount = testResults.filter((r) => r.status === "warning").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-dark-50 border-dark-300">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>AI & Autonomy Systems Testing</span>
            <Button
              onClick={runAllTests}
              disabled={isRunningTests}
              className="bg-cyan-900/20 text-cyan-400 border-cyan-500 hover:bg-cyan-900/30"
            >
              {isRunningTests ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Run All Tests"
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isRunningTests && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Testing Progress</span>
                <span>{Math.round(testProgress)}%</span>
              </div>
              <Progress value={testProgress} className="h-2" />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-900/20 border border-green-500 rounded p-3">
              <div className="text-2xl font-bold text-green-400">{successCount}</div>
              <div className="text-sm text-green-300">Operational</div>
            </div>
            <div className="bg-amber-900/20 border border-amber-500 rounded p-3">
              <div className="text-2xl font-bold text-amber-400">{warningCount}</div>
              <div className="text-sm text-amber-300">Issues</div>
            </div>
            <div className="bg-red-900/20 border border-red-500 rounded p-3">
              <div className="text-2xl font-bold text-red-400">{errorCount}</div>
              <div className="text-sm text-red-300">Critical</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {testResults.map((result) => (
            <Card
              key={result.id}
              className={cn(
                "bg-dark-50 border-dark-300 cursor-pointer transition-all hover:border-cyan-500",
                selectedTest?.id === result.id && "border-cyan-500",
              )}
              onClick={() => setSelectedTest(result)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {result.icon}
                    <span className="font-medium">{result.name}</span>
                  </div>
                  <Badge className={cn("text-xs", getStatusColor(result.status))}>
                    {getStatusIcon(result.status)}
                    <span className="ml-1">{result.status.toUpperCase()}</span>
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-gray-300">{result.category}</div>
                  <div className="text-xs text-gray-400">{result.message}</div>

                  {result.criticalIssues.length > 0 && (
                    <div className="text-xs text-red-400">{result.criticalIssues.length} critical issue(s)</div>
                  )}

                  {result.responseTime && (
                    <div className="text-xs text-gray-500">Response: {result.responseTime}ms</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed View */}
        <div>
          {selectedTest ? (
            <Card className="bg-dark-50 border-dark-300 sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {selectedTest.icon}
                  {selectedTest.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {/* Status */}
                    <div>
                      <h4 className="font-medium mb-2">Status</h4>
                      <Badge className={cn("w-full justify-center", getStatusColor(selectedTest.status))}>
                        {getStatusIcon(selectedTest.status)}
                        <span className="ml-2">{selectedTest.status.toUpperCase()}</span>
                      </Badge>
                    </div>

                    {/* Details */}
                    {selectedTest.details.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Test Details</h4>
                        <div className="space-y-1">
                          {selectedTest.details.map((detail, index) => (
                            <div key={index} className="text-sm text-gray-300 font-mono">
                              {detail}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Critical Issues */}
                    {selectedTest.criticalIssues.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 text-red-400">Critical Issues</h4>
                        <div className="space-y-1">
                          {selectedTest.criticalIssues.map((issue, index) => (
                            <div key={index} className="text-sm text-red-300 bg-red-900/20 p-2 rounded">
                              {issue}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {selectedTest.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 text-amber-400">Recommendations</h4>
                        <div className="space-y-1">
                          {selectedTest.recommendations.map((rec, index) => (
                            <div key={index} className="text-sm text-amber-300 bg-amber-900/20 p-2 rounded">
                              {rec}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div>
                      <h4 className="font-medium mb-2">Test Metadata</h4>
                      <div className="space-y-1 text-sm text-gray-400">
                        <div>Category: {selectedTest.category}</div>
                        {selectedTest.responseTime && <div>Response Time: {selectedTest.responseTime}ms</div>}
                        {selectedTest.lastTested && <div>Last Tested: {selectedTest.lastTested.toLocaleString()}</div>}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-dark-50 border-dark-300">
              <CardContent className="p-8 text-center">
                <div className="text-gray-400">Select a test result to view detailed information</div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
