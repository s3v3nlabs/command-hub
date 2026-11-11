"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Activity, Eye, Lock, Unlock } from "lucide-react"

interface Message {
  id: string
  channel: string
  timestamp: string
  encrypted: boolean
  decryptedPreview: string
  fullContent: string
  entropy: number
  signalStrength: number
}

export default function MessagesPage() {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const [showTracePanel, setShowTracePanel] = useState(false)
  const [messages] = useState<Message[]>([
    {
      id: "1",
      channel: "ALPHA-7",
      timestamp: "14:32:15",
      encrypted: true,
      decryptedPreview: "Operation status update...",
      fullContent: "Operation BLACKFRAME status: Phase 2 initiated. All units report green. Proceed with caution.",
      entropy: 0.85,
      signalStrength: 78,
    },
    {
      id: "2",
      channel: "BRAVO-3",
      timestamp: "14:31:42",
      encrypted: false,
      decryptedPreview: "Weather report for sector 7...",
      fullContent: "Weather conditions favorable. Visibility 10km. Wind speed 15 knots from northwest.",
      entropy: 0.32,
      signalStrength: 92,
    },
    {
      id: "3",
      channel: "CHARLIE-1",
      timestamp: "14:30:18",
      encrypted: true,
      decryptedPreview: "Asset movement detected...",
      fullContent: "Multiple assets converging on coordinates 34.0522°N 118.2437°W. Recommend immediate surveillance.",
      entropy: 0.91,
      signalStrength: 65,
    },
  ])

  const renderMarkdown = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code class="bg-gray-800 px-1 rounded">$1</code>')
  }

  const getEntropyColor = (entropy: number) => {
    if (entropy > 0.8) return "text-red-400"
    if (entropy > 0.6) return "text-yellow-400"
    return "text-green-400"
  }

  const generateSignalGraph = (strength: number) => {
    const points = Array.from({ length: 20 }, (_, i) => {
      const base = strength + Math.sin(i * 0.5) * 10
      const noise = (Math.random() - 0.5) * 15
      return Math.max(0, Math.min(100, base + noise))
    })
    return points
  }

  return (
    <div className="hub-shell flex bg-dark-base text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="MESSAGES - SECURE COMMUNICATIONS" />
        <main className="hub-shell-scroll p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Messages List */}
            <div className="lg:col-span-2 space-y-4">
              <TechPanel title="INTERCEPTED MESSAGES" cornerAccent borderAccent>
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`bg-dark-100/10 p-4 rounded border transition-all cursor-pointer ${
                        selectedMessage === message.id
                          ? "border-green-400 bg-green-400/10"
                          : "border-dark-300/20 hover:border-green-400/50"
                      }`}
                      onClick={() => setSelectedMessage(message.id)}
                    >
                      {/* Message Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-green-400">
                            {message.channel}
                          </Badge>
                          <span className="text-xs text-gray-400 font-mono">{message.timestamp}</span>
                          {message.encrypted ? (
                            <Lock size={12} className="text-red-400" />
                          ) : (
                            <Unlock size={12} className="text-green-400" />
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <TechButton
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowTracePanel(true)
                              setSelectedMessage(message.id)
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Activity size={12} />
                            Trace Signal
                          </TechButton>
                        </div>
                      </div>

                      {/* Decrypted Preview */}
                      <div className="mb-2">
                        <div className="text-sm text-gray-300">{message.decryptedPreview}</div>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">Entropy:</span>
                            <span className={getEntropyColor(message.entropy)}>
                              {(message.entropy * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity size={10} />
                            <span
                              className={`${
                                message.signalStrength > 70
                                  ? "text-green-400"
                                  : message.signalStrength > 40
                                    ? "text-yellow-400"
                                    : "text-red-400"
                              }`}
                            >
                              {message.signalStrength}%
                            </span>
                          </div>
                        </div>

                        {message.entropy > 0.8 && (
                          <Badge variant="outline" className="text-red-400">
                            HIGH ENTROPY
                          </Badge>
                        )}
                      </div>

                      {/* Noise Detection Overlay */}
                      {message.entropy > 0.8 && (
                        <div className="mt-2 p-2 bg-red-400/10 border border-red-400/30 rounded">
                          <div className="text-xs text-red-400 flex items-center gap-1">
                            <Eye size={10} />
                            High-entropy pattern detected - possible noise or advanced encryption
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TechPanel>

              {/* Full Message Content */}
              {selectedMessage && (
                <TechPanel title="MESSAGE CONTENT" cornerAccent borderAccent>
                  {(() => {
                    const message = messages.find((m) => m.id === selectedMessage)
                    if (!message) return null

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant="default">{message.channel}</Badge>
                          <span className="text-gray-400">{message.timestamp}</span>
                          <Badge variant={message.encrypted ? "outline" : "default"}>
                            {message.encrypted ? "ENCRYPTED" : "PLAINTEXT"}
                          </Badge>
                        </div>

                        <div
                          className="bg-dark-100/10 p-4 rounded border border-dark-300/20 text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(message.fullContent),
                          }}
                        />
                      </div>
                    )
                  })()}
                </TechPanel>
              )}
            </div>

            {/* Signal Trace Panel */}
            {showTracePanel && selectedMessage && (
              <div className="space-y-4">
                <TechPanel title="SIGNAL TRACE" cornerAccent borderAccent>
                  {(() => {
                    const message = messages.find((m) => m.id === selectedMessage)
                    if (!message) return null

                    const signalData = generateSignalGraph(message.signalStrength)

                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-bold text-green-400">Channel {message.channel}</h4>
                          <TechButton onClick={() => setShowTracePanel(false)} variant="outline" size="sm">
                            Close
                          </TechButton>
                        </div>

                        {/* Signal Strength Graph */}
                        <div className="bg-black/30 p-4 rounded">
                          <div className="h-24 flex items-end justify-between gap-1">
                            {signalData.map((value, index) => (
                              <div
                                key={index}
                                className="bg-gradient-to-t from-green-400 via-yellow-400 to-red-400 w-2 transition-all duration-200"
                                style={{ height: `${value}%` }}
                              />
                            ))}
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-2">
                            <span>-10s</span>
                            <span>Now</span>
                          </div>
                        </div>

                        {/* Signal Metrics */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Signal Strength:</span>
                            <span className="text-green-400">{message.signalStrength}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Frequency:</span>
                            <span className="text-green-400">462.675 MHz</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Modulation:</span>
                            <span className="text-green-400">Digital</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Encryption:</span>
                            <span className={message.encrypted ? "text-red-400" : "text-green-400"}>
                              {message.encrypted ? "AES-256" : "None"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </TechPanel>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
