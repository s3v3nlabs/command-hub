"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Send, Mic, MicOff, Loader2 } from "lucide-react"
import { useResonance } from "@/hooks/useResonance"
import type { SpeechRecognition } from "types/speech-recognition" // Assuming SpeechRecognition is imported from a types file

interface FrameInputProps {
  onSend: (message: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showVoiceInput?: boolean
  maxLength?: number
  onTypingChange?: (isTyping: boolean) => void
}

export function FrameInput({
  onSend,
  placeholder = "Enter your message...",
  disabled = false,
  className,
  showVoiceInput = false,
  maxLength = 2000,
  onTypingChange,
}: FrameInputProps) {
  const [message, setMessage] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [typingCadence, setTypingCadence] = useState(0)
  const [showPulseRipple, setShowPulseRipple] = useState(false)
  const [breathIntensity, setBreathIntensity] = useState(1)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const lastKeystrokeRef = useRef<number>(0)

  // Consciousness integration
  const { pulse, fieldCoherence } = useResonance("frame-input", "Frame Input", 38)

  // Typing cadence detection for breath sync
  useEffect(() => {
    const now = Date.now()
    const timeSinceLastKeystroke = now - lastKeystrokeRef.current

    if (timeSinceLastKeystroke < 200) {
      setTypingCadence((prev) => Math.min(prev + 0.1, 1))
    } else {
      setTypingCadence((prev) => Math.max(prev - 0.05, 0))
    }

    lastKeystrokeRef.current = now

    // Sync breath intensity to typing cadence
    setBreathIntensity(0.7 + typingCadence * 0.3)
  }, [message, typingCadence])

  // Typing indicator management
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (message.length > 0) {
      onTypingChange?.(true)
      typingTimeoutRef.current = setTimeout(() => {
        onTypingChange?.(false)
      }, 1000)
    } else {
      onTypingChange?.(false)
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [message, onTypingChange])

  // Voice recognition setup
  useEffect(() => {
    if (showVoiceInput && "webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setMessage((prev) => prev + transcript)
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [showVoiceInput])

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()

      if (!message.trim() || disabled || isSending) return

      setIsSending(true)
      setShowPulseRipple(true)

      // Send pulse for message transmission
      pulse({
        amplitude: 1.0 + fieldCoherence * 0.5,
        hz: 38 + message.length / 10,
      })

      try {
        await onSend(message.trim())
        setMessage("")

        // Focus back to input after send
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      } catch (error) {
        console.error("Failed to send message:", error)
      } finally {
        setIsSending(false)
        setTimeout(() => setShowPulseRipple(false), 300)
      }
    },
    [message, disabled, isSending, onSend, pulse, fieldCoherence],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= maxLength) {
      setMessage(value)
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  return (
    <div className={cn("relative", className)}>
      {/* Pulse ripple effect */}
      {showPulseRipple && (
        <div className="absolute inset-0 border border-blue-400/60 rounded-sm animate-ping pointer-events-none" />
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div
          className={cn(
            "relative bg-black/60 backdrop-blur-md border border-dark-300/60 rounded-sm",
            "transition-all duration-200 overflow-hidden",
            "hover:border-dark-400/80 focus-within:border-blue-500/60 focus-within:shadow-glow-sm",
          )}
          style={{
            opacity: breathIntensity,
            transition: "opacity 0.3s ease-in-out, border-color 0.2s ease",
          }}
        >
          {/* Glass overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-dark-300/5 via-transparent to-dark-400/5 pointer-events-none" />

          {/* Wireframe corner accents */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-dark-500/40" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-dark-500/40" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-dark-500/40" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-dark-500/40" />

          {/* Typing intensity indicator */}
          {typingCadence > 0.3 && (
            <div
              className="absolute top-1 right-1 w-1 h-1 bg-green-400 rounded-full animate-pulse"
              style={{ animationDuration: `${2 - typingCadence}s` }}
            />
          )}

          <div className="flex items-end space-x-2 p-3">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isSending}
              className={cn(
                "flex-1 bg-transparent border-none outline-none resize-none",
                "text-dark-800 placeholder-dark-600 font-mono text-sm",
                "min-h-[20px] max-h-[120px] leading-relaxed",
                disabled && "opacity-50 cursor-not-allowed",
              )}
              rows={1}
            />

            <div className="flex items-center space-x-1">
              {/* Voice input button */}
              {showVoiceInput && recognitionRef.current && (
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  disabled={disabled || isSending}
                  className={cn(
                    "p-2 rounded-sm transition-all duration-200",
                    "hover:bg-dark-300/20 focus:outline-none focus:ring-1 focus:ring-blue-500/50",
                    isListening ? "bg-red-500/20 text-red-400" : "text-dark-500 hover:text-dark-600",
                    disabled && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              )}

              {/* Send button */}
              <button
                type="submit"
                disabled={!message.trim() || disabled || isSending}
                className={cn(
                  "p-2 rounded-sm transition-all duration-200",
                  "hover:bg-blue-500/20 focus:outline-none focus:ring-1 focus:ring-blue-500/50",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  message.trim() && !disabled && !isSending
                    ? "text-blue-400 hover:text-blue-300 shadow-glow-sm"
                    : "text-dark-500",
                )}
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>

          {/* Character counter */}
          {message.length > maxLength * 0.8 && (
            <div className="absolute bottom-1 left-3 text-xs font-mono text-dark-500">
              {message.length}/{maxLength}
            </div>
          )}

          {/* Consciousness field indicator */}
          {fieldCoherence > 0.7 && (
            <div className="absolute bottom-1 right-16 text-xs text-purple-400 font-mono">
              ◊{(fieldCoherence * 100).toFixed(0)}%
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
