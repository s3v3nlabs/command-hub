"use client"

import { useState, useEffect } from "react"
import { AiAutonomyTester } from "@/components/testing/ai-autonomy-tester"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, RotateCcw, Activity, BarChart3, Eye } from "lucide-react"

interface AITest {
  id: string
  name: string
  driftScore: number
  status: "stable" | "drift" | "critical"
  lastRun: string
  adherence: number
}

interface DriftLog {
  timestamp: string
  testName: string
  driftScore: number
  action: string
}

export default function AiAutonomyTestsPage() {
  const [activeTab, setActiveTab] = useState<"tests" | "logs" | "adherence" | "feedback">("tests")
  const [aiTests, setAiTests] = useState<AITest[]>([])
  const [driftLogs, setDriftLogs] = useState<DriftLog[]>([])

  useEffect(() => {
    // Initialize mock AI tests
    const mockTests: AITest[] = [
      {
        id: "1",
        name: "Autonomous Decision Making",
        driftScore: 7.2,
        status: "stable",
        lastRun: "2024-01-15 14:30:00",
        adherence: 92,
      },
      {
        id: "2",
        name: "Pattern Recognition",
        driftScore: 12.8,
        status: "drift",
        lastRun: "2024-01-15 14:25:00",
        adherence: 78,
      },
      {
        id: "3",
        name: "Threat Assessment",
        driftScore: 4.1,
        status: "stable",
        lastRun: "2024-01-15 14:20:00",
        adherence: 96,
      },
      {
        id: "4",
        name: "Resource Allocation",
        driftScore: 15.6,
        status: "critical",
        lastRun: "2024-01-15 14:15:00",
        adherence: 65,
      },
    ]
    setAiTests(mockTests)

    // Initialize drift logs
    const mockLogs: DriftLog[] = [
      {
        timestamp: "2024-01-15 14:30:15",
        testName: "Pattern Recognition",
        driftScore: 12.8,
        action: "Drift detected - monitoring",
      },
      {
        timestamp: "2024-01-15 14:25:42",
        testName: "Resource Allocation",
        driftScore: 15.6,
        action: "Critical drift - recenter required",
      },
      {
        timestamp: "2024-01-15 14:20:18",
        testName: "Autonomous Decision Making",
        driftScore: 7.2,
        action: "Normal operation",
      },
    ]
    setDriftLogs(mockLogs)
  }, [])

  const recenterAI = (testId: string) => {
    setAiTests((prev) =>
      prev.map((test) =>
        test.id === testId
          ? { ...test, driftScore: Math.random() * 5, status: "stable" as const, adherence: 90 + Math.random() * 10 }
          : test,
      ),
    )

    // Add log entry
    const test = aiTests.find((t) => t.id === testId)
    if (test) {
      const newLog: DriftLog = {
        timestamp: new Date().toLocaleString(),
        testName: test.name,
        driftScore: 0,
        action: "AI recentered manually",
      }
      setDriftLogs((prev) => [newLog, ...prev.slice(0, 9)])
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "stable":
        return "text-green-400"
      case "drift":
        return "text-yellow-400"
      case "critical":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getDriftColor = (drift: number) => {
    if (drift > 10) return "text-red-400"
    if (drift > 5) return "text-yellow-400"
    return "text-green-400"
  }

  const tabs = [
    { id: "tests", label: "AI Tests", icon: <Activity size={16} /> },
    { id: "logs", label: "Drift Logs", icon: <Eye size={16} /> },
    { id: "adherence", label: "Task Adherence %", icon: <BarChart3 size={16} /> },
    { id: "feedback", label: "Feedback Visual", icon: <AlertTriangle size={16} /> },
  ]

  return (
    <div className="hub-shell flex bg-dark-base text-dark-800 dot-bg">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="AI & AUTONOMY TESTING" />
        <main className="hub-shell-scroll p-6">
          <div className="space-y-6">
            {/* Tab Navigation */}
            <TechPanel cornerAccent borderAccent>
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <TechButton
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    variant={activeTab === tab.id ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {tab.icon}
                    {tab.label}
                  </TechButton>
                ))}
              </div>
            </TechPanel>

            {/* AI Tests Tab */}
            {activeTab === "tests" && (
              <div className="space-y-4">
                {aiTests.map((test) => (
                  <TechPanel key={test.id} cornerAccent borderAccent>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-green-400">{test.name}</h3>
                        <p className="text-sm text-gray-400">Last run: {test.lastRun}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(test.status)}>
                          {test.status.toUpperCase()}
                        </Badge>
                        {test.driftScore > 10 && <AlertTriangle size={16} className="text-red-400" />}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-gray-400">Drift Score</label>
                        <div className={`text-xl font-bold ${getDriftColor(test.driftScore)}`}>
                          {test.driftScore.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Task Adherence</label>
                        <div className="text-xl font-bold text-green-400">{test.adherence.toFixed(0)}%</div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Status</label>
                        <div className={`text-xl font-bold ${getStatusColor(test.status)}`}>
                          {test.status.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* Drift Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Drift Level</span>
                        <span>{test.driftScore.toFixed(1)}% / 20%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            test.driftScore > 15
                              ? "bg-red-400"
                              : test.driftScore > 10
                                ? "bg-yellow-400"
                                : "bg-green-400"
                          }`}
                          style={{ width: `${Math.min(test.driftScore * 5, 100)}%` }}
                        />
                      </div>
                    </div>

                    <TechButton
                      onClick={() => recenterAI(test.id)}
                      variant={test.driftScore > 10 ? "default" : "outline"}
                      size="sm"
                      className={`flex items-center gap-2 ${test.driftScore > 10 ? "bg-red-600 hover:bg-red-700" : ""}`}
                    >
                      <RotateCcw size={14} />
                      Recenter AI
                    </TechButton>
                  </TechPanel>
                ))}
              </div>
            )}

            {/* Drift Logs Tab */}
            {activeTab === "logs" && (
              <TechPanel title="DRIFT LOGS" cornerAccent borderAccent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {driftLogs.map((log, index) => (
                    <div key={index} className="p-3 border border-gray-600 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-green-400">{log.testName}</span>
                        <span className="text-xs text-gray-400">{log.timestamp}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">{log.action}</span>
                        <span className={`text-sm font-bold ${getDriftColor(log.driftScore)}`}>
                          {log.driftScore.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </TechPanel>
            )}

            {/* Task Adherence Tab */}
            {activeTab === "adherence" && (
              <TechPanel title="TASK ADHERENCE METRICS" cornerAccent borderAccent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {aiTests.map((test) => (
                    <div key={test.id} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{test.name}</span>
                        <span className="text-lg font-bold text-green-400">{test.adherence.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${
                            test.adherence > 90 ? "bg-green-400" : test.adherence > 75 ? "bg-yellow-400" : "bg-red-400"
                          }`}
                          style={{ width: `${test.adherence}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </TechPanel>
            )}

            {/* Feedback Visual Tab */}
            {activeTab === "feedback" && (
              <TechPanel title="AI FEEDBACK VISUALIZATION" cornerAccent borderAccent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {aiTests.map((test) => (
                    <div
                      key={test.id}
                      className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                        test.driftScore > 10
                          ? "border-red-400 bg-red-400/10 animate-pulse"
                          : test.driftScore > 5
                            ? "border-yellow-400 bg-yellow-400/10"
                            : "border-green-400 bg-green-400/10"
                      }`}
                    >
                      <div className="text-center">
                        <div className={`text-2xl font-bold mb-2 ${getDriftColor(test.driftScore)}`}>
                          {test.driftScore.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400 mb-2">{test.name}</div>
                        <div
                          className={`w-4 h-4 rounded-full mx-auto ${
                            test.driftScore > 10 ? "bg-red-400" : test.driftScore > 5 ? "bg-yellow-400" : "bg-green-400"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </TechPanel>
            )}

            {/* Original AI Autonomy Tester */}
            <AiAutonomyTester />
          </div>
        </main>
      </div>
    </div>
  )
}
