"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Filter, Activity, Eye, EyeOff } from "lucide-react"

interface SignalLog {
  id: string
  timestamp: string
  frequency: string
  protocol: string
  strength: number
  content: string
  repeating: boolean
}

export default function SigintPage() {
  const [protocolFilter, setProtocolFilter] = useState("ALL")
  const [signalDriftMode, setSignalDriftMode] = useState(false)
  const [signalLogs, setSignalLogs] = useState<SignalLog[]>([
    {
      id: "1",
      timestamp: "14:32:15",
      frequency: "146.52 MHz",
      protocol: "FM",
      strength: 85,
      content: "Emergency services coordination",
      repeating: false,
    },
    {
      id: "2",
      timestamp: "14:32:18",
      frequency: "462.675 MHz",
      protocol: "Digital",
      strength: 45,
      content: "Encrypted data transmission",
      repeating: true,
    },
  ])
  const [spectrumData, setSpectrumData] = useState<number[]>(new Array(50).fill(0))

  // Simulate live signal logs polling every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      const newLog: SignalLog = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        frequency: `${(Math.random() * 500 + 100).toFixed(2)} MHz`,
        protocol: ["AM", "FM", "Digital"][Math.floor(Math.random() * 3)],
        strength: Math.floor(Math.random() * 100),
        content: [
          "Voice communication detected",
          "Data burst transmission",
          "Repeater identification",
          "Emergency broadcast",
          "Encrypted payload",
        ][Math.floor(Math.random() * 5)],
        repeating: Math.random() > 0.7,
      }

      setSignalLogs((prev) => [newLog, ...prev.slice(0, 9)])
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  // Animate spectrum analyzer
  useEffect(() => {
    const interval = setInterval(() => {
      setSpectrumData((prev) => prev.map(() => Math.random() * 100))
    }, 200)

    return () => clearInterval(interval)
  }, [])

  const filteredLogs = signalLogs.filter((log) => protocolFilter === "ALL" || log.protocol === protocolFilter)

  const getSignalStyle = (log: SignalLog) => {
    if (!signalDriftMode) return {}

    if (log.strength < 50) {
      return { filter: "blur(1px)", opacity: 0.6 }
    }

    if (log.repeating) {
      return {
        outline: "2px solid #10b981",
        outlineOffset: "2px",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
      }
    }

    return {}
  }

  return (
    <div className="hub-shell flex bg-dark-base text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="SIGINT - SIGNAL INTELLIGENCE" />
        <main className="flex-1 overflow-auto p-6 space-y-6">
          {/* Controls */}
          <TechPanel cornerAccent borderAccent>
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter size={16} />
                  <select
                    value={protocolFilter}
                    onChange={(e) => setProtocolFilter(e.target.value)}
                    className="bg-dark-base border border-green-400/30 rounded px-3 py-1 text-green-400 focus:outline-none focus:border-green-400"
                  >
                    <option value="ALL">All Protocols</option>
                    <option value="AM">AM</option>
                    <option value="FM">FM</option>
                    <option value="Digital">Digital</option>
                  </select>
                </div>

                <TechButton
                  onClick={() => setSignalDriftMode(!signalDriftMode)}
                  variant={signalDriftMode ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  {signalDriftMode ? <Eye size={16} /> : <EyeOff size={16} />}
                  Signal Drift Mode
                </TechButton>
              </div>

              <Badge variant="outline" className="text-green-400">
                {filteredLogs.length} Active Signals
              </Badge>
            </div>
          </TechPanel>

          {/* Spectrum Analyzer */}
          <TechPanel title="SPECTRUM ANALYZER" cornerAccent borderAccent>
            <div className="h-32 flex items-end justify-between gap-1 p-4 bg-black/30 rounded">
              {spectrumData.map((value, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-t from-green-400 via-yellow-400 to-red-400 w-2 transition-all duration-200"
                  style={{ height: `${value}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>100 MHz</span>
              <span>300 MHz</span>
              <span>500 MHz</span>
            </div>
          </TechPanel>

          {/* Live Signal Logs */}
          <TechPanel title="LIVE SIGNAL LOGS" cornerAccent borderAccent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-dark-100/10 p-3 rounded border border-dark-300/20 transition-all duration-300"
                  style={getSignalStyle(log)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {log.protocol}
                      </Badge>
                      <span className="font-mono text-sm text-green-400">{log.frequency}</span>
                      <span className="text-xs text-gray-400">{log.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {log.repeating && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          REPEAT
                        </Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <Activity size={12} />
                        <span
                          className={`text-xs ${
                            log.strength > 70
                              ? "text-green-400"
                              : log.strength > 40
                                ? "text-yellow-400"
                                : "text-red-400"
                          }`}
                        >
                          {log.strength}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-300">{log.content}</p>
                </div>
              ))}
            </div>
          </TechPanel>
        </main>
      </div>
    </div>
  )
}
