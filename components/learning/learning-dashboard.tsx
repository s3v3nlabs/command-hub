"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, TrendingUp, Database, Activity, Target, Network, Zap, CheckCircle } from "lucide-react"

interface IncidentPattern {
  id: string
  type: string
  frequency: number
  successRate: number
  avgResolutionTime: number
  lastOccurrence: Date
  confidence: number
  relatedPatterns: string[]
}

interface LearningMetric {
  name: string
  value: number
  trend: "up" | "down" | "stable"
  description: string
}

interface KnowledgeBase {
  totalIncidents: number
  resolvedIncidents: number
  patterns: IncidentPattern[]
  confidence: number
  lastUpdated: Date
}

export function LearningDashboard() {
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase>({
    totalIncidents: 0,
    resolvedIncidents: 0,
    patterns: [],
    confidence: 0,
    lastUpdated: new Date(),
  })

  const [learningMetrics] = useState<LearningMetric[]>([
    {
      name: "Pattern Recognition",
      value: 0,
      trend: "stable",
      description: "Ability to identify recurring incident patterns",
    },
    {
      name: "Resolution Accuracy",
      value: 0,
      trend: "stable",
      description: "Success rate of recommended solutions",
    },
    {
      name: "Response Time",
      value: 0,
      trend: "stable",
      description: "Average time to generate recommendations",
    },
    {
      name: "Confidence Score",
      value: 0,
      trend: "stable",
      description: "Overall system confidence in recommendations",
    },
  ])

  const [mockPatterns] = useState<IncidentPattern[]>([
    {
      id: "connection-timeout",
      type: "Network Timeout",
      frequency: 0,
      successRate: 0,
      avgResolutionTime: 0,
      lastOccurrence: new Date(),
      confidence: 0,
      relatedPatterns: [],
    },
    {
      id: "memory-leak",
      type: "Memory Leak",
      frequency: 0,
      successRate: 0,
      avgResolutionTime: 0,
      lastOccurrence: new Date(),
      confidence: 0,
      relatedPatterns: [],
    },
    {
      id: "api-failure",
      type: "API Failure",
      frequency: 0,
      successRate: 0,
      avgResolutionTime: 0,
      lastOccurrence: new Date(),
      confidence: 0,
      relatedPatterns: [],
    },
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-dark-50 border-dark-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-cyan-400" />
            Learning System Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-900/20 border border-blue-500 rounded p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{knowledgeBase.totalIncidents}</div>
              <div className="text-sm text-blue-300">Total Incidents</div>
            </div>
            <div className="bg-green-900/20 border border-green-500 rounded p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{knowledgeBase.resolvedIncidents}</div>
              <div className="text-sm text-green-300">Resolved</div>
            </div>
            <div className="bg-purple-900/20 border border-purple-500 rounded p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{knowledgeBase.patterns.length}</div>
              <div className="text-sm text-purple-300">Patterns Learned</div>
            </div>
            <div className="bg-cyan-900/20 border border-cyan-500 rounded p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400">{knowledgeBase.confidence.toFixed(1)}%</div>
              <div className="text-sm text-cyan-300">Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="patterns" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="patterns">Incident Patterns</TabsTrigger>
          <TabsTrigger value="metrics">Learning Metrics</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="training">Training Data</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          <Card className="bg-dark-50 border-dark-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Recognized Incident Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mockPatterns.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                  <h3 className="text-lg font-semibold mb-2">No Patterns Learned Yet</h3>
                  <p className="text-sm">
                    Connect your AI backend to start learning from incident data. The system will automatically identify
                    patterns and improve over time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mockPatterns.map((pattern) => (
                    <Card key={pattern.id} className="bg-dark-100 border-dark-400">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{pattern.type}</h4>
                          <Badge variant="outline">Confidence: {pattern.confidence.toFixed(1)}%</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Frequency:</span>
                            <div className="font-medium">{pattern.frequency} times</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Success Rate:</span>
                            <div className="font-medium">{pattern.successRate.toFixed(1)}%</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Avg Resolution:</span>
                            <div className="font-medium">{pattern.avgResolutionTime}min</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {learningMetrics.map((metric) => (
              <Card key={metric.name} className="bg-dark-50 border-dark-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{metric.name}</h4>
                    <TrendingUp
                      className={`h-4 w-4 ${
                        metric.trend === "up"
                          ? "text-green-400"
                          : metric.trend === "down"
                            ? "text-red-400"
                            : "text-gray-400"
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-2xl font-bold">{metric.value.toFixed(1)}%</span>
                      <Badge variant="outline" className="text-xs">
                        {metric.trend.toUpperCase()}
                      </Badge>
                    </div>
                    <Progress value={metric.value} className="h-2" />
                    <p className="text-xs text-gray-400">{metric.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <Card className="bg-dark-50 border-dark-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Knowledge Base Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                <h3 className="text-lg font-semibold mb-2">Knowledge Base Ready</h3>
                <p className="text-sm mb-4">
                  The knowledge base infrastructure is in place and ready to receive data. Connect your local AI to
                  start populating with incident history and patterns.
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="bg-green-900/20 border border-green-500 rounded p-3">
                    <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-400" />
                    <div className="text-sm">Storage Ready</div>
                  </div>
                  <div className="bg-green-900/20 border border-green-500 rounded p-3">
                    <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-400" />
                    <div className="text-sm">UI Components</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card className="bg-dark-50 border-dark-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Training Data Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <Zap className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                <h3 className="text-lg font-semibold mb-2">Training Pipeline Ready</h3>
                <p className="text-sm mb-4">
                  All training data processing components are in place. Your local AI backend can now feed training data
                  to improve the learning system.
                </p>
                <div className="space-y-2 max-w-md mx-auto">
                  <div className="flex items-center justify-between p-2 bg-dark-100 rounded">
                    <span className="text-sm">Data Ingestion</span>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-dark-100 rounded">
                    <span className="text-sm">Pattern Analysis</span>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-dark-100 rounded">
                    <span className="text-sm">Model Training</span>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-dark-100 rounded">
                    <span className="text-sm">Validation</span>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
