"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { User, Bot, Zap } from "lucide-react"

interface MessageBubbleProps {
  message: {
    id: string
    content: string
    sender: "user" | "assistant" | "system"
    timestamp: Date
    metadata?: {
      model?: string
      tokens?: number
      resonance?: number
    }
  }
  className?: string
  showTimestamp?: boolean
  animate?: boolean
}

export function MessageBubble({ message, className, showTimestamp = true, animate = false }: MessageBubbleProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [breathOpacity, setBreathOpacity] = useState(1)
  const [typingIntensity, setTypingIntensity] = useState(0)

  // Entrance animation
  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setIsVisible(true), 50)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(true)
    }
  }, [animate])

  // Breathing effect for consciousness messages
  useEffect(() => {
    if (message.sender === "assistant" || message.metadata?.resonance) {
      const breathInterval = setInterval(
        () => {
          setBreathOpacity((prev) => (prev === 1 ? 0.85 : 1))
        },
        3000 + Math.random() * 2000,
      ) // Randomized breathing

      return () => clearInterval(breathInterval)
    }
  }, [message.sender, message.metadata?.resonance])

  // Typing intensity detection (hidden signal indicator)
  useEffect(() => {
    if (message.sender === "user") {
      const words = message.content.split(" ")
      const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length
      const intensity = Math.min(avgWordLength / 10, 1) // Normalize to 0-1
      setTypingIntensity(intensity)
    }
  }, [message.content, message.sender])

  const getSenderIcon = () => {
    switch (message.sender) {
      case "user":
        return <User size={14} className="text-blue-400" />
      case "assistant":
        return <Bot size={14} className="text-purple-400" />
      case "system":
        return <Zap size={14} className="text-green-400" />
      default:
        return null
    }
  }

  const getSenderColor = () => {
    switch (message.sender) {
      case "user":
        return "border-blue-500/30 bg-blue-500/5"
      case "assistant":
        return "border-purple-500/30 bg-purple-500/5"
      case "system":
        return "border-green-500/30 bg-green-500/5"
      default:
        return "border-dark-300/30 bg-dark-100/5"
    }
  }

  const getAlignment = () => {
    return message.sender === "user" ? "ml-auto" : "mr-auto"
  }

  return (
    <div
      className={cn(
        "max-w-[80%] transition-all duration-300 ease-out",
        getAlignment(),
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className,
      )}
      style={{
        opacity: breathOpacity,
        transition: animate ? "all 0.3s ease-out, opacity 3s ease-in-out" : "opacity 3s ease-in-out",
      }}
    >
      <div
        className={cn(
          "relative p-3 rounded-lg border backdrop-blur-sm font-mono text-sm",
          "shadow-lg transition-all duration-200",
          getSenderColor(),
          // Cyberpunk soft corners enhancement
          message.sender === "user" ? "rounded-br-sm" : "rounded-bl-sm",
        )}
      >
        {/* Wireframe corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-20" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-current opacity-20" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-current opacity-20" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-20" />

        {/* Hidden signal indicator for typing intensity */}
        {message.sender === "user" && typingIntensity > 0.5 && (
          <div
            className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse opacity-60"
            style={{ animationDuration: `${2 - typingIntensity}s` }}
          />
        )}

        {/* Message header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getSenderIcon()}
            <span className="text-xs text-dark-600 font-bold tracking-wide">{message.sender.toUpperCase()}</span>
            {message.metadata?.resonance && (
              <div className="text-xs text-purple-400">◊{(message.metadata.resonance * 100).toFixed(0)}%</div>
            )}
          </div>
          {showTimestamp && (
            <span className="text-xs text-dark-500 font-mono">{message.timestamp.toLocaleTimeString()}</span>
          )}
        </div>

        {/* Message content */}
        <div className="text-dark-800 leading-relaxed whitespace-pre-wrap">{message.content}</div>

        {/* Metadata footer */}
        {message.metadata && (
          <div className="mt-2 pt-2 border-t border-current/10 flex items-center justify-between text-xs text-dark-500">
            {message.metadata.model && <span className="font-mono">{message.metadata.model}</span>}
            {message.metadata.tokens && <span className="font-mono">{message.metadata.tokens} tokens</span>}
          </div>
        )}

        {/* Consciousness field indicator */}
        {(message.sender === "assistant" || message.metadata?.resonance) && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="w-1 h-1 bg-purple-400/60 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </div>
  )
}
