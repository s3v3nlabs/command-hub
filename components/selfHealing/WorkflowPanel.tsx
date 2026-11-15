"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { analyzeDrift } from "@/lib/selfHealing/AgentCore"
import { storeProposal, getProposals } from "@/lib/selfHealing/Vault"
import { getMultiModelResponses } from "@/lib/selfHealing/BuildShipHarness"
import { logVault } from "@/lib/vaultWriter"
import { speak, playAudioBlob } from "@/lib/audio"

export default function SelfHealingWorkflow() {
  const [status, setStatus] = useState("idle")
  const [logs, setLogs] = useState<string[]>([])
  const [proposals, setProposals] = useState<any[]>([])
  const [selectedProposal, setSelectedProposal] = useState<any>(null)
  const [modelResponses, setModelResponses] = useState<any[]>([])
  // Hub API token + Commander token (minted via POST /api/commander/token). Memory only, never persisted.
  const [hubToken, setHubToken] = useState("")
  const [commanderToken, setCommanderToken] = useState("")

  // Add a log entry
  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
    logVault(message)
  }

  // Load proposals on mount
  useEffect(() => {
    const loadProposals = async () => {
      const loadedProposals = await getProposals(5)
      setProposals(loadedProposals)
    }
    loadProposals()
  }, [])

  // Simulate detecting an issue
  const detectIssue = async () => {
    setStatus("detecting")
    addLog("🔍 Scanning for system anomalies...")

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const testInput = "Warning: Connection timeout detected in module X. Potential signal pattern drift."
    const analysis = analyzeDrift(testInput)

    addLog(`⚠️ Issue detected: ${analysis.notes} (confidence: ${analysis.confidence.toFixed(2)})`)
    setStatus("analyzing")

    // Store the proposal
    const proposal = {
      type: "issue_detection",
      input: testInput,
      analysis,
      timestamp: new Date().toISOString(),
    }

    await storeProposal(proposal)
    setSelectedProposal(proposal)

    // Refresh proposals
    const loadedProposals = await getProposals(5)
    setProposals(loadedProposals)

    // Play voice alert
    try {
      const audioBlob = await speak(
        `Alert: ${analysis.notes} detected with confidence ${Math.round(analysis.confidence * 100)}%`,
      )
      if (audioBlob) {
        await playAudioBlob(audioBlob)
      }
    } catch (error) {
      addLog("⚠️ Voice alert failed: LMNT key may not be configured")
    }

    setStatus("analyzed")
  }

  // Get AI recommendations
  const getRecommendations = async () => {
    if (!selectedProposal) return

    setStatus("consulting")
    addLog("🧠 Consulting AI panel for recommendations...")

    const prompt = `System issue detected: ${selectedProposal.analysis.notes}. Recommend action.`
    const responses = await getMultiModelResponses(prompt)

    setModelResponses(responses)
    addLog(`✅ Received ${responses.length} model recommendations`)

    // Find consensus
    const consensus = findConsensus(responses)
    addLog(`📊 AI consensus: ${consensus.action} (agreement: ${consensus.agreement.toFixed(2)})`)

    setStatus("recommended")
  }

  // Authorize and execute repair
  const authorizeRepair = async () => {
    if (!selectedProposal || modelResponses.length === 0) return

    setStatus("authorizing")
    addLog("🔐 Requesting authorization from Governor...")

    // Get consensus action
    const consensus = findConsensus(modelResponses)

    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (hubToken) headers.Authorization = `Bearer ${hubToken}`
    const proposal = { ...selectedProposal, action: consensus.action }

    // F3: replay FIRST (server-side, deterministic, simulated — the patch is not executed)
    const rp = await fetch("/api/self-healing", { method: "POST", headers, body: JSON.stringify({ stage: "replay", proposal }) })
      .then((r) => r.json())
      .catch((e) => ({ ok: false, error: String(e) }))
    if (!rp.ok || !rp.passed) {
      addLog(`🔄 Replay ${rp.ok ? "FAILED" : "unavailable"}: ${rp.error ?? (rp.checks || []).filter((c: any) => !c.ok).map((c: any) => c.check).join(", ")}`)
      setStatus("denied")
      return
    }
    addLog(`🔄 Replay passed (simulated) · replayId ${rp.replayId} · patch ${String(rp.patchHash).slice(0, 12)}…`)

    // F2: authorisation happens on the server with a Commander token bound to patch + replay
    const authResult = await fetch("/api/self-healing", {
      method: "POST",
      headers,
      body: JSON.stringify({ stage: "heal", action: "heal", proposal, replayId: rp.replayId, commanderToken: commanderToken || null }),
    })
      .then((r) => r.json())
      .catch((e) => ({ ok: false, approved: false, error: String(e) }))

    addLog(
      `🔒 Authorization ${authResult.approved ? "GRANTED" : "DENIED"}: ${authResult.approved ? authResult.reason : authResult.error}` +
        (authResult.approved ? "" : ` — mint a Commander token for action "heal", target "patch:${rp.patchHash}", ref "${rp.replayId}"`),
    )

    if (authResult.approved) {
      setStatus("executing")
      addLog("🔧 Executing repair action (simulated — no system change is made)...")
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const replayResult = { replayResult: { success: true } }

      // Play voice confirmation
      try {
        const message = replayResult.replayResult.success
          ? "Simulated repair completed after replay and Commander approval"
          : "Repair action failed verification"
        const audioBlob = await speak(message)
        if (audioBlob) {
          await playAudioBlob(audioBlob)
        }
      } catch (error) {
        addLog("⚠️ Voice alert failed: LMNT key may not be configured")
      }

      setStatus(replayResult.replayResult.success ? "completed" : "failed")
    } else {
      setStatus("denied")
    }
  }

  // Reset the workflow
  const resetWorkflow = () => {
    setStatus("idle")
    setSelectedProposal(null)
    setModelResponses([])
  }

  // Find consensus among model responses
  const findConsensus = (responses: any[]) => {
    const actions = responses.map((r) => {
      // Extract the action from the response (before the colon)
      const actionPart = r.response.split(":")[0].trim()
      return actionPart
    })

    // Count occurrences of each action
    const actionCounts: Record<string, number> = {}
    actions.forEach((action) => {
      actionCounts[action] = (actionCounts[action] || 0) + 1
    })

    // Find the most common action
    let maxCount = 0
    let consensusAction = ""

    Object.entries(actionCounts).forEach(([action, count]) => {
      if (count > maxCount) {
        maxCount = count
        consensusAction = action
      }
    })

    // Calculate agreement level
    const agreement = maxCount / responses.length

    return {
      action: consensusAction,
      agreement,
      counts: actionCounts,
    }
  }

  return (
    <Card className="w-full bg-black border border-gray-800 text-white shadow-lg">
      <CardHeader className="border-b border-gray-800 bg-gray-900 p-4">
        <CardTitle className="text-lg font-mono flex items-center">
          <span className="mr-2">🔄</span>
          Self-Healing Workflow
          <Badge
            className="ml-auto"
            variant={
              status === "idle"
                ? "outline"
                : status === "completed"
                  ? "success"
                  : status === "failed" || status === "denied"
                    ? "destructive"
                    : "default"
            }
          >
            {status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <input
            type="password"
            value={hubToken}
            onChange={(e) => setHubToken(e.target.value)}
            placeholder="Hub API token"
            autoComplete="off"
            className="w-36 rounded border border-gray-700 bg-black px-2 py-1 text-xs text-gray-200"
          />
          <input
            type="password"
            value={commanderToken}
            onChange={(e) => setCommanderToken(e.target.value)}
            placeholder="Commander token"
            autoComplete="off"
            className="w-44 rounded border border-gray-700 bg-black px-2 py-1 text-xs text-gray-200"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={detectIssue}
            disabled={status !== "idle" && status !== "completed" && status !== "failed" && status !== "denied"}
            className="bg-blue-900 hover:bg-blue-800 text-white border border-blue-700"
          >
            1. Detect Issue
          </Button>
          <Button
            onClick={getRecommendations}
            disabled={status !== "analyzed"}
            className="bg-purple-900 hover:bg-purple-800 text-white border border-purple-700"
          >
            2. Get AI Recommendations
          </Button>
          <Button
            onClick={authorizeRepair}
            disabled={status !== "recommended"}
            className="bg-green-900 hover:bg-green-800 text-white border border-green-700"
          >
            3. Authorize & Execute
          </Button>
          <Button
            onClick={resetWorkflow}
            disabled={status === "idle"}
            className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
          >
            Reset Workflow
          </Button>
        </div>

        {/* Log display */}
        <div className="mt-4 border border-gray-800 rounded-md bg-gray-900 p-2 h-48 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-gray-500 p-2">No activity logs yet. Start the workflow to see logs.</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="py-1 border-b border-gray-800 last:border-0">
                {log}
              </div>
            ))
          )}
        </div>

        {/* AI Panel Responses */}
        {modelResponses.length > 0 && (
          <div className="mt-4 border border-gray-800 rounded-md bg-gray-900 p-2">
            <div className="font-bold mb-2">AI Panel Recommendations:</div>
            {modelResponses.map((response, i) => (
              <div key={i} className="mb-2 pb-2 border-b border-gray-800 last:border-0">
                <div className="flex justify-between">
                  <span className="font-bold">{response.model}</span>
                  <span>Confidence: {response.confidence}</span>
                </div>
                <div className="text-sm">{response.response}</div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Proposals */}
        {proposals.length > 0 && (
          <div className="mt-4">
            <div className="font-bold mb-2">Recent Proposals:</div>
            <div className="border border-gray-800 rounded-md bg-gray-900 p-2 max-h-32 overflow-y-auto">
              {proposals.map((proposal, i) => (
                <div key={i} className="text-xs mb-1 pb-1 border-b border-gray-800 last:border-0">
                  {proposal.timestamp}: {proposal.analysis?.notes || proposal.type}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
