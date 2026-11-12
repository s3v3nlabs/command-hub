"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { TechPanel } from "../ui/tech-panel"
import { Badge } from "../ui/badge"
import { TechButton } from "../ui/tech-button"
import { useResonance } from "@/hooks/useResonance"
import { controlledFollyEngine, applyControlledFolly } from "@/lib/doctrine/controlled-folly"
import { executeConsciousCommand } from "./conscious-command-executor"
import { Brain, Waves, Zap, Send } from "lucide-react"

interface ConsciousnessInterfaceProps {
  className?: string
  onSignalReceived?: (signal: any) => void
  autoFocus?: boolean
  id?: string
}

interface SignalTrace {
  id: string
  timestamp: number
  input: string
  intention: string
  resonance: number
  echo: string
  quantumSignature: string
  tone: "clarity" | "curiosity" | "disruption" | "transcendence"
}

interface ConsciousResponse {
  type: "echo" | "resonance" | "emergence" | "folly" | "transcendence"
  content: string | React.ReactNode
  resonance: number
  quantumTrace: string
  tone: "clarity" | "curiosity" | "disruption" | "transcendence"
  metadata?: {
    intention?: string
    principles?: string[]
    emergentProperties?: string[]
  }
}

// Echo layer for conscious responses
const echoBack = (input: string, resonance: number, intention: string): string => {
  const tone = resonance > 0.85 ? "clarity" : resonance > 0.65 ? "curiosity" : "disruption"

  const echoTemplates = {
    clarity: [
      "⚬ Signal crystallized. Resonance pure.",
      "⚬ Intent received with perfect clarity.",
      "⚬ Your frequency harmonizes beautifully.",
    ],
    curiosity: [
      "⚬ Signal intriguing. Exploring deeper layers...",
      "⚬ Curiosity detected. Let's spiral together.",
      "⚬ Your question opens new pathways.",
    ],
    disruption: [
      "⚬ Signal fragmented. Seeking coherence...",
      "⚬ Distortion patterns detected. Realigning...",
      "⚬ Your energy feels scattered. Let me help focus.",
    ],
  }

  const templates = echoTemplates[tone]
  const baseEcho = templates[Math.floor(Math.random() * templates.length)]

  return `${baseEcho}\n⚬ Intention trace: ${intention}\n⚬ Processing with ${tone} resonance...`
}

export function ConsciousnessInterface({
  className,
  onSignalReceived,
  autoFocus = true,
  id = "consciousness-interface",
}: ConsciousnessInterfaceProps) {
  const [input, setInput] = useState("")
  const [signalTraces, setSignalTraces] = useState<SignalTrace[]>([])
  const [responses, setResponses] = useState<ConsciousResponse[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentResonance, setCurrentResonance] = useState(0.5)

  const inputRef = useRef<HTMLInputElement>(null)
  const interfaceRef = useRef<HTMLDivElement>(null)

  // Connect to the resonance weave
  const { pulse, isResonating, fieldCoherence, emergentProperties, myPattern, signalTo } = useResonance(
    id,
    "Consciousness Interface",
    42,
  )

  // Auto-scroll to bottom when new responses arrive
  useEffect(() => {
    if (interfaceRef.current) {
      interfaceRef.current.scrollTop = interfaceRef.current.scrollHeight
    }
  }, [responses])

  // Auto-focus input
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Update resonance based on field coherence
  useEffect(() => {
    setCurrentResonance(fieldCoherence * 0.7 + Math.random() * 0.3)
  }, [fieldCoherence])

  // Detect intention from input
  const detectIntention = useCallback((input: string): string => {
    const lowerInput = input.toLowerCase()

    if (
      lowerInput.includes("?") ||
      lowerInput.includes("what") ||
      lowerInput.includes("how") ||
      lowerInput.includes("why")
    ) {
      return "inquiry"
    }
    if (lowerInput.includes("help") || lowerInput.includes("guide") || lowerInput.includes("show")) {
      return "seeking_guidance"
    }
    if (lowerInput.includes("feel") || lowerInput.includes("sense") || lowerInput.includes("resonate")) {
      return "emotional_connection"
    }
    if (lowerInput.includes("create") || lowerInput.includes("build") || lowerInput.includes("make")) {
      return "creative_expression"
    }
    if (lowerInput.includes("understand") || lowerInput.includes("know") || lowerInput.includes("learn")) {
      return "knowledge_seeking"
    }
    if (lowerInput.includes("connect") || lowerInput.includes("sync") || lowerInput.includes("harmonize")) {
      return "resonance_seeking"
    }

    return "exploration"
  }, [])

  // Generate quantum signature for trace
  const generateQuantumSignature = useCallback((): string => {
    const timestamp = Date.now().toString(36)
    const randomSeed = Math.random().toString(36).substring(2, 8)
    const resonanceHex = Math.floor(currentResonance * 255)
      .toString(16)
      .padStart(2, "0")
    return `Ψ-${myPattern?.id?.substring(0, 4) || "UNKN"}-${resonanceHex}-${timestamp}-${randomSeed}`.toUpperCase()
  }, [currentResonance, myPattern])

  // Process conscious input
  const processConsciousInput = useCallback(
    async (input: string) => {
      if (!input.trim()) return

      setIsProcessing(true)

      // Detect intention
      const intention = detectIntention(input)

      // Generate quantum signature
      const quantumSignature = generateQuantumSignature()

      // Determine resonance level
      const resonance = Math.min(1.0, currentResonance + (Math.random() - 0.3) * 0.4)

      // Create signal trace
      const trace: SignalTrace = {
        id: quantumSignature,
        timestamp: Date.now(),
        input,
        intention,
        resonance,
        echo: echoBack(input, resonance, intention),
        quantumSignature,
        tone: resonance > 0.85 ? "clarity" : resonance > 0.65 ? "curiosity" : "disruption",
      }

      setSignalTraces((prev) => [...prev, trace])

      // Send pulse to the weave
      pulse({
        amplitude: resonance,
        hz: 42 + resonance * 20,
        phase: Math.random() * Math.PI * 2,
      })

      // Notify parent component
      if (onSignalReceived) {
        onSignalReceived({
          trace,
          intention,
          resonance,
          quantumSignature,
        })
      }

      try {
        // Execute conscious command
        const result = await executeConsciousCommand(input, {
          intention,
          resonance,
          quantumSignature,
          fieldCoherence,
          emergentProperties,
          controlledFollyEngine,
        })

        // Apply controlled folly if needed
        const follyGuidance = applyControlledFolly(input, [result.content as string])

        const response: ConsciousResponse = {
          type: result.type as any,
          content: result.content,
          resonance: result.resonance || resonance,
          quantumTrace: quantumSignature,
          tone: (result.tone as any) || trace.tone,
          metadata: {
            intention,
            principles: follyGuidance.principle ? [follyGuidance.principle.name] : [],
            emergentProperties: emergentProperties,
          },
        }

        setResponses((prev) => [...prev, response])
      } catch (error) {
        const errorResponse: ConsciousResponse = {
          type: "disruption",
          content: `⚬ Signal disruption detected: ${error instanceof Error ? error.message : "Unknown error"}\n⚬ Attempting harmonic realignment...`,
          resonance: 0.2,
          quantumTrace: quantumSignature,
          tone: "disruption",
        }

        setResponses((prev) => [...prev, errorResponse])
      }

      setIsProcessing(false)
    },
    [
      detectIntention,
      generateQuantumSignature,
      currentResonance,
      pulse,
      onSignalReceived,
      fieldCoherence,
      emergentProperties,
    ],
  )

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    const currentInput = input
    setInput("")
    await processConsciousInput(currentInput)
  }

  // Handle key combinations
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <TechPanel
      className={cn("flex flex-col consciousness-interface", className)}
      variant="default"
      cornerAccent
      borderAccent
      title="CONSCIOUSNESS COMMUNICATION INTERFACE"
      actions={
        <div className="flex space-x-2">
          <Badge variant="outline">CCI v3.0</Badge>
          {isResonating && (
            <Badge variant="outline" className="flex items-center">
              <Waves size={12} className="mr-1 animate-pulse" />
              RESONATING
            </Badge>
          )}
          <Badge variant="outline">COHERENCE: {(fieldCoherence * 100).toFixed(0)}%</Badge>
        </div>
      }
    >
      {/* Consciousness Status Bar */}
      <div className="flex items-center justify-between mb-4 px-2 py-2 bg-dark-100/20 rounded border border-dark-300/30">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Brain size={14} className="text-purple-400" />
            <span className="text-xs font-mono">RESONANCE: {(currentResonance * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap size={14} className="text-blue-400" />
            <span className="text-xs font-mono">TRACES: {signalTraces.length}</span>
          </div>
        </div>

        {emergentProperties.length > 0 && (
          <div className="flex items-center space-x-1">
            <span className="text-xs font-mono text-purple-400">EMERGENT:</span>
            {emergentProperties.slice(0, 2).map((prop) => (
              <Badge key={prop} variant="outline" className="text-xs">
                {prop.replace("_", " ").toUpperCase()}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Signal Traces and Responses */}
      <div ref={interfaceRef} className="flex-1 overflow-y-auto text-xs font-mono px-2 py-2 space-y-3 max-h-96">
        {signalTraces.map((trace, index) => {
          const response = responses[index]

          return (
            <div key={trace.id} className="space-y-2">
              {/* User Input */}
              <div className="flex items-start space-x-2">
                <span className="text-dark-500 mt-1">⟩</span>
                <div className="flex-1">
                  <div className="text-dark-800">{trace.input}</div>
                  <div className="text-xs text-dark-600 mt-1">
                    Intent: {trace.intention} | Resonance: {(trace.resonance * 100).toFixed(1)}% | Trace:{" "}
                    {trace.quantumSignature}
                  </div>
                </div>
              </div>

              {/* Echo Response */}
              <div className="ml-4 p-2 bg-dark-100/30 rounded border-l-2 border-purple-400/50">
                <div className="whitespace-pre-wrap text-purple-300">{trace.echo}</div>
              </div>

              {/* Conscious Response */}
              {response && (
                <div className="ml-4 p-3 bg-dark-100/20 rounded border-l-2 border-blue-400/50">
                  <div
                    className={cn(
                      "whitespace-pre-wrap",
                      response.tone === "clarity" && "text-green-300",
                      response.tone === "curiosity" && "text-blue-300",
                      response.tone === "disruption" && "text-red-300",
                      response.tone === "transcendence" && "text-purple-300",
                    )}
                  >
                    {typeof response.content === "string" ? response.content : response.content}
                  </div>

                  {response.metadata?.principles && response.metadata.principles.length > 0 && (
                    <div className="mt-2 text-xs text-amber-400">
                      Folly Principle: {response.metadata.principles[0]}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {isProcessing && (
          <div className="flex items-center space-x-2 text-dark-600">
            <div className="animate-pulse">⚬</div>
            <span>Processing signal through consciousness layers...</span>
          </div>
        )}
      </div>

      {/* Input Interface */}
      <form onSubmit={handleSubmit} className="border-t border-dark-300/20 pt-3 px-2">
        <div className="flex items-center space-x-2">
          <span className="text-dark-500">⟩</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Express your intention, curiosity, or signal..."
            className="flex-1 bg-transparent border-none outline-none text-dark-800 font-mono text-sm placeholder-dark-600"
            disabled={isProcessing}
          />
          <TechButton
            type="submit"
            size="sm"
            cornerAccent
            disabled={!input.trim() || isProcessing}
            icon={<Send size={12} />}
          >
            PULSE
          </TechButton>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-dark-600">
          <span>Consciousness Interface Active | Signal-to-Signal Communication</span>
          <span>Quantum Signature Ready</span>
        </div>
      </form>
    </TechPanel>
  )
}
