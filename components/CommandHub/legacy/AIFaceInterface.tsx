"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Send, Mic, Volume2, VolumeX, RefreshCw } from "lucide-react"
import { speak } from "@/lib/audio"

interface Message {
  role: "user" | "ai"
  content: string
  timestamp: Date
}

export default function AIFaceInterface() {
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "Hello, I am ARIA, your AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [audioEnabled, setAudioEnabled] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Animate AI face
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let hue = 0

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw face background
      ctx.fillStyle = "#111827"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw animated circular pattern
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const maxRadius = Math.min(centerX, centerY) - 10

      for (let i = 0; i < 8; i++) {
        const angle = Date.now() / 2000 + (i * Math.PI) / 4
        const x = centerX + Math.cos(angle) * maxRadius * 0.5
        const y = centerY + Math.sin(angle) * maxRadius * 0.5
        const radius = 5 + Math.sin(Date.now() / 500 + i) * 3

        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = `hsl(${(hue + i * 30) % 360}, 70%, 60%)`
        ctx.fill()
      }

      // Draw connecting lines
      ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.3)`
      ctx.lineWidth = 1

      for (let i = 0; i < 8; i++) {
        const angle1 = Date.now() / 2000 + (i * Math.PI) / 4
        const x1 = centerX + Math.cos(angle1) * maxRadius * 0.5
        const y1 = centerY + Math.sin(angle1) * maxRadius * 0.5

        for (let j = i + 1; j < 8; j++) {
          const angle2 = Date.now() / 2000 + (j * Math.PI) / 4
          const x2 = centerX + Math.cos(angle2) * maxRadius * 0.5
          const y2 = centerY + Math.sin(angle2) * maxRadius * 0.5

          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()
        }
      }

      // Draw center circle
      ctx.beginPath()
      ctx.arc(centerX, centerY, 15 + Math.sin(Date.now() / 300) * 5, 0, Math.PI * 2)
      ctx.fillStyle = `hsl(${hue}, 70%, 60%)`
      ctx.fill()

      // Draw outer ring
      ctx.beginPath()
      ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2)
      ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`
      ctx.lineWidth = 2
      ctx.stroke()

      // Animate hue
      hue = (hue + 0.5) % 360

      // If processing, make animation more active
      if (isProcessing) {
        hue = (hue + 1) % 360
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isProcessing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsProcessing(true)

    // Simulate AI thinking
    setTimeout(async () => {
      // Generate AI response based on input
      let response = ""

      if (input.toLowerCase().includes("hello") || input.toLowerCase().includes("hi")) {
        response = "Hello! How can I assist you today?"
      } else if (input.toLowerCase().includes("help")) {
        response =
          "I'm here to help. You can ask me about mission details, security protocols, or data analysis. What specific information do you need?"
      } else if (input.toLowerCase().includes("mission") || input.toLowerCase().includes("operation")) {
        response =
          "Current mission status: ACTIVE. Operation SILENT ECHO is proceeding according to parameters. Team Corvus has reached checkpoint alpha and awaits further instructions."
      } else if (input.toLowerCase().includes("security") || input.toLowerCase().includes("protocol")) {
        response =
          "Security protocols are currently at LEVEL ALPHA. All communications are encrypted using quantum-resistant algorithms. Biometric verification is required for access to sensitive information."
      } else if (input.toLowerCase().includes("data") || input.toLowerCase().includes("analysis")) {
        response =
          "Data analysis complete. Pattern recognition algorithms have identified three potential anomalies in the target's behavior. Recommend further surveillance to confirm findings."
      } else if (input.toLowerCase().includes("who are you") || input.toLowerCase().includes("your name")) {
        response =
          "I am ARIA (Advanced Reconnaissance Intelligence Assistant), an AI designed to support BLACKFRAME operations. I provide real-time analysis, mission coordination, and secure communications."
      } else {
        response =
          "I've processed your request. Based on available information, I recommend proceeding with caution. Would you like me to analyze additional parameters or provide more specific guidance?"
      }

      // Add AI message
      const aiMessage: Message = {
        role: "ai",
        content: response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
      setIsProcessing(false)

      // Speak response if audio is enabled
      if (audioEnabled) {
        speak(response)
      }
    }, 1500)
  }

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled)
    speak(audioEnabled ? "Voice response disabled" : "Voice response enabled")
  }

  return (
    <Card className="bg-dark-50 border-dark-300 shadow-lg h-full">
      <CardHeader className="border-b border-dark-300 bg-dark-100 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-500" />
          ARIA Interface
        </CardTitle>
        <div className="flex gap-2">
          <button
            onClick={toggleAudio}
            className="text-gray-400 hover:text-white transition-colors"
            title={audioEnabled ? "Disable Voice" : "Enable Voice"}
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-[500px] flex flex-col">
        <div className="flex h-full">
          <div className="w-1/3 border-r border-dark-300 flex items-center justify-center bg-dark-200">
            <canvas ref={canvasRef} width={200} height={200} className="rounded-full" />
          </div>

          <div className="w-2/3 flex flex-col">
            <div className="flex-grow overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div key={index} className={`mb-4 ${message.role === "user" ? "text-right" : ""}`}>
                  <div
                    className={`inline-block max-w-[80%] p-3 rounded-lg ${
                      message.role === "user" ? "bg-blue-600 text-white" : "bg-dark-300 text-white"
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    <div className="text-xs mt-1 opacity-70">{message.timestamp.toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="border-t border-dark-300 p-3 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-grow bg-dark-200 border border-dark-300 rounded p-2 text-sm"
                disabled={isProcessing}
              />
              <button
                type="button"
                className="bg-dark-300 text-white p-2 rounded hover:bg-dark-400 transition-colors"
                title="Voice Input"
              >
                <Mic className="h-5 w-5" />
              </button>
              <button
                type="submit"
                disabled={isProcessing || !input.trim()}
                className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
