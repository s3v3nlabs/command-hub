"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { speak, playAudioBlob } from "@/lib/audio"
import { Badge } from "@/components/ui/badge"

export default function VoiceAlertTest() {
  const [text, setText] = useState("System alert: Anomaly detected in security module.")
  const [status, setStatus] = useState<"idle" | "generating" | "playing" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const handlePlay = async () => {
    if (!text.trim()) return

    setStatus("generating")
    setError(null)
    addLog(`Generating voice for: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`)

    try {
      const audioBlob = await speak(text)

      if (!audioBlob) {
        throw new Error("Failed to generate audio - no blob returned")
      }

      addLog("Audio generated successfully, playing...")
      setStatus("playing")

      await playAudioBlob(audioBlob)

      addLog("Audio playback completed")
      setStatus("idle")
    } catch (err) {
      console.error("Voice alert error:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Failed to generate or play audio: ${errorMessage}`)
      addLog(`ERROR: ${errorMessage}`)
      setStatus("error")
    }
  }

  const presetMessages = [
    "Warning: Security breach detected in sector 7.",
    "Critical alert: System resources at 95% capacity.",
    "Information: Scheduled maintenance will begin in 10 minutes.",
    "Alert: Unusual network activity detected from IP 192.168.1.45.",
    "Emergency: Immediate evacuation required. This is not a drill.",
  ]

  return (
    <Card className="w-full bg-black border border-gray-800 text-white shadow-lg">
      <CardHeader className="border-b border-gray-800 bg-gray-900 p-4">
        <CardTitle className="text-lg font-mono flex items-center">
          <span className="mr-2">🔊</span>
          Voice Alert Test
          <Badge
            className="ml-auto"
            variant={status === "idle" ? "outline" : status === "error" ? "destructive" : "default"}
          >
            {status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div>
          <label className="block text-sm mb-1">Alert Message</label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text for voice alert..."
            className="bg-gray-900 border-gray-700 text-white"
            rows={3}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handlePlay}
            disabled={status === "generating" || status === "playing" || !text.trim()}
            className="bg-blue-900 hover:bg-blue-800 text-white border border-blue-700"
          >
            {status === "generating" ? "Generating..." : status === "playing" ? "Playing..." : "Play Alert"}
          </Button>

          <Button
            onClick={() => setText("")}
            disabled={!text.trim()}
            className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
          >
            Clear
          </Button>
        </div>

        {error && <div className="p-2 bg-red-900/50 border border-red-800 rounded text-sm">{error}</div>}

        <div className="mt-4">
          <div className="text-sm font-semibold mb-2">Preset Messages</div>
          <div className="flex flex-wrap gap-2">
            {presetMessages.map((message, i) => (
              <Button
                key={i}
                onClick={() => setText(message)}
                variant="outline"
                className="text-xs border-gray-700 hover:bg-gray-800"
              >
                {message.substring(0, 20)}...
              </Button>
            ))}
          </div>
        </div>

        {/* Log display */}
        <div className="mt-4">
          <div className="text-sm font-semibold mb-1">Activity Log</div>
          <div className="border border-gray-800 rounded-md bg-gray-900 p-2 h-32 overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-gray-500 p-2">No activity logs yet.</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="py-1 border-b border-gray-800 last:border-0">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
