"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

// Define the type for our memory vault entries
type MemoryVaultEntry = {
  id: string
  module: string
  suggestion: string
  approved: boolean
  timestamp: Date
}

export function SelfHealingAgentCore() {
  // State for toggles
  const [autonomyMode, setAutonomyMode] = useState(false)
  const [showLogs, setShowLogs] = useState(true)

  // Memory vault for storing suggestions
  const [memoryVault, setMemoryVault] = useState<MemoryVaultEntry[]>([
    {
      id: "1",
      module: "NetworkVisualizer",
      suggestion: "Add null check before accessing array elements",
      approved: true,
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
    },
    {
      id: "2",
      module: "ThreatMap",
      suggestion: "Implement fallback for invalid coordinates",
      approved: false,
      timestamp: new Date(Date.now() - 43200000), // 12 hours ago
    },
  ])

  // Mock modules for random selection
  const mockModules = ["ReconScanner", "ZeroDayPulse", "LeakMonitor", "NetworkVisualizer", "ThreatMap", "SystemHealth"]

  // Mock suggestions for random selection
  const mockSuggestions = [
    "Add array length validation before iteration",
    "Implement error boundary for component crashes",
    "Add fallback values for undefined props",
    "Improve null checking on nested objects",
    "Add type guards for external data",
    "Implement retry logic for failed API calls",
    "Add defensive copy for mutable objects",
    "Implement circuit breaker for external services",
  ]

  // Function to log a mock AI proposal
  const logMockProposal = () => {
    const randomModule = mockModules[Math.floor(Math.random() * mockModules.length)]
    const randomSuggestion = mockSuggestions[Math.floor(Math.random() * mockSuggestions.length)]

    const newEntry: MemoryVaultEntry = {
      id: Date.now().toString(),
      module: randomModule,
      suggestion: randomSuggestion,
      approved: false,
      timestamp: new Date(),
    }

    setMemoryVault((prev) => [newEntry, ...prev])
  }

  // Function to approve the last entry
  const approveLastEntry = () => {
    if (memoryVault.length === 0) return

    setMemoryVault((prev) => {
      const updated = [...prev]
      updated[0] = { ...updated[0], approved: true }
      return updated
    })
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Self-Healing Agent Core</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="autonomy-mode" className="font-medium">
            LLM Autonomy Mode
          </Label>
          <Switch id="autonomy-mode" checked={autonomyMode} onCheckedChange={setAutonomyMode} />
        </div>

        <div className="flex gap-2">
          <Button onClick={logMockProposal} className="flex-1">
            Log Mock AI Proposal
          </Button>
          <Button
            onClick={approveLastEntry}
            variant="outline"
            className="flex-1"
            disabled={memoryVault.length === 0 || memoryVault[0].approved}
          >
            Approve Last Entry
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-logs" className="font-medium">
            Show Logs
          </Label>
          <Switch id="show-logs" checked={showLogs} onCheckedChange={setShowLogs} />
        </div>

        {showLogs && (
          <div className="border rounded-md p-1">
            <div className="bg-muted p-2 text-sm font-medium">Memory Vault Entries</div>
            <ScrollArea className="h-[200px] p-2">
              {memoryVault.length > 0 ? (
                <div className="space-y-3">
                  {memoryVault.map((entry) => (
                    <div key={entry.id} className="border rounded-md p-3 bg-card">
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="outline">{entry.module}</Badge>
                        <Badge variant={entry.approved ? "success" : "secondary"}>
                          {entry.approved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{entry.suggestion}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(entry.timestamp)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No entries in memory vault
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
