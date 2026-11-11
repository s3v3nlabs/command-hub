"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function SelfHealingAgentPanel() {
  const [errorLogs, setErrorLogs] = useState([
    "[ERR] Visualization component failed: invalid array length",
    "[WARN] Config not loaded: fallback defaults engaged",
    "[TRACE] Module ReconScanner.tsx returned undefined result",
  ])
  const [diagnosticResults, setDiagnosticResults] = useState<string[]>([])
  const [autonomyMode, setAutonomyMode] = useState(false)
  const [commanderApproval, setCommanderApproval] = useState(false)
  const [running, setRunning] = useState(false)

  const runDiagnostics = () => {
    setRunning(true)
    setTimeout(() => {
      setDiagnosticResults([
        "🧠 AI Suggestion 1: Add array length check in SignalVisualizer.tsx (line 42)",
        "🧠 AI Suggestion 2: Fallback config object for unset props in ReconScanner.tsx",
        "🧠 AI Suggestion 3: Improve null guard on props.result[].name in TargetProfilePanel.tsx",
      ])
      setRunning(false)
    }, 1200)
  }

  return (
    <Card className="p-4 space-y-6">
      <h2 className="text-xl font-semibold">Self-Healing Agent Interface</h2>

      <div className="space-y-2">
        <Label>Error Console</Label>
        <div className="bg-black text-green-400 font-mono p-2 h-32 overflow-y-auto border rounded">
          {errorLogs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>

      <Button onClick={runDiagnostics} disabled={running} className="w-full">
        {running ? "Running Diagnostics..." : "Run Diagnostic"}
      </Button>

      {diagnosticResults.length > 0 && (
        <div className="space-y-2">
          <Label>AI Proposals</Label>
          <div className="bg-muted p-2 border rounded text-sm">
            {diagnosticResults.map((res, i) => (
              <div key={i} className="mb-1">
                ➤ {res}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label>Commander Approval Required</Label>
        <Switch checked={commanderApproval} onCheckedChange={setCommanderApproval} />
      </div>

      <div className="flex items-center justify-between">
        <Label>LLM Autonomy Mode</Label>
        <Switch checked={autonomyMode} onCheckedChange={setAutonomyMode} />
      </div>
    </Card>
  )
}
