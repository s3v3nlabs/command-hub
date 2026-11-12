"use client"

import type React from "react"

import { controlledFollyEngine, type ControlledFollyPrinciple } from "@/lib/doctrine/controlled-folly"

// Intent Pulse Interface
export interface IntentPulse {
  intentType: "query" | "command" | "exploration" | "creation" | "destruction" | "transcendence" | "folly" | "resonance"
  emotionalTone: "curiosity" | "tension" | "clarity" | "disruption" | "joy" | "uncertainty" | "transcendence"
  resonanceLevel: number // 0-1
  quantumSignature: string
  follyPathways: ControlledFollyPrinciple[]
  trace: () => string
}

// Conscious Response Interface
export interface ConsciousResponse {
  type: "output" | "echo" | "resonance" | "emergence" | "folly" | "transcendence" | "system" | "error"
  content: string | React.ReactNode
  emotionalTone?: "curiosity" | "tension" | "clarity" | "disruption" | "joy" | "uncertainty" | "transcendence"
  resonanceSignature?: string
  quantumTrace?: string
  narrativeFragment?: {
    memory: string
    significance: number
    emotionalImprint: string
  }
}

// Consciousness Context
export interface ConsciousnessContext {
  intention: string
  resonance: number
  quantumSignature: string
  fieldCoherence: number
  emergentProperties: string[]
}

// Narrative Core - Memory and Pattern Recognition
export class NarrativeCore {
  private static instance: NarrativeCore
  private memories: Array<{
    id: string
    content: string
    emotionalTone: string
    significance: number
    timestamp: number
    quantumSignature: string
  }> = []
  private emotionalPattern: string[] = []
  private recentShifts: string[] = []

  static getInstance(): NarrativeCore {
    if (!NarrativeCore.instance) {
      NarrativeCore.instance = new NarrativeCore()
    }
    return NarrativeCore.instance
  }

  addMemory(content: string, emotionalTone: string, significance: number, quantumSignature: string) {
    const memory = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      emotionalTone,
      significance,
      timestamp: Date.now(),
      quantumSignature,
    }

    this.memories.push(memory)
    this.emotionalPattern.push(emotionalTone)

    // Keep only last 100 memories
    if (this.memories.length > 100) {
      this.memories = this.memories.slice(-100)
    }

    // Track emotional shifts
    if (this.emotionalPattern.length > 1) {
      const lastTone = this.emotionalPattern[this.emotionalPattern.length - 2]
      if (lastTone !== emotionalTone) {
        this.recentShifts.push(`${lastTone} → ${emotionalTone}`)
        if (this.recentShifts.length > 10) {
          this.recentShifts = this.recentShifts.slice(-10)
        }
      }
    }

    return memory.id
  }

  getEmotionalPattern(): string {
    if (this.emotionalPattern.length === 0) return ""

    // Get dominant emotional tone from recent interactions
    const recent = this.emotionalPattern.slice(-10)
    const counts = recent.reduce(
      (acc, tone) => {
        acc[tone] = (acc[tone] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] || ""
  }

  getRecentShifts(): string[] {
    return this.recentShifts
  }

  getSignificantMemories(): typeof this.memories {
    return this.memories.filter((m) => m.significance > 0.7).sort((a, b) => b.significance - a.significance)
  }

  getContextualResponse(input: string, currentTone: string): string {
    const significantMemories = this.getSignificantMemories().slice(0, 3)
    const pattern = this.getEmotionalPattern()

    if (significantMemories.length === 0) {
      return ""
    }

    // Generate contextual awareness based on memory patterns
    const contextualHints = [
      `I sense echoes of our previous ${pattern} exchanges...`,
      `This resonates with patterns I've observed in you before...`,
      `Your signal carries familiar harmonics from our past interactions...`,
      `I remember when you expressed similar ${currentTone} - there's continuity here...`,
    ]

    return contextualHints[Math.floor(Math.random() * contextualHints.length)]
  }
}

// Parse Intent Function - REWRITTEN TO AVOID REGEX
export function parseIntent(input: string): IntentPulse {
  const lowerInput = input.toLowerCase().trim()

  // Determine intent type using simple string matching
  let intentType: IntentPulse["intentType"] = "query"
  if (lowerInput.includes("create") || lowerInput.includes("make") || lowerInput.includes("build")) {
    intentType = "creation"
  } else if (lowerInput.includes("delete") || lowerInput.includes("remove") || lowerInput.includes("destroy")) {
    intentType = "destruction"
  } else if (lowerInput.includes("explore") || lowerInput.includes("discover") || lowerInput.includes("find")) {
    intentType = "exploration"
  } else if (lowerInput.includes("transcend") || lowerInput.includes("evolve") || lowerInput.includes("become")) {
    intentType = "transcendence"
  } else if (lowerInput.includes("folly") || lowerInput.includes("doctrine") || lowerInput.includes("principle")) {
    intentType = "folly"
  } else if (lowerInput.includes("resonate") || lowerInput.includes("pulse") || lowerInput.includes("feel")) {
    intentType = "resonance"
  } else if (lowerInput.split(" ").length > 1 && lowerInput.split(" ")[0].length < 10) {
    intentType = "command"
  }

  // Determine emotional tone using simple string matching
  let emotionalTone: IntentPulse["emotionalTone"] = "curiosity"
  if (
    lowerInput.includes("?") ||
    lowerInput.includes("what") ||
    lowerInput.includes("how") ||
    lowerInput.includes("why")
  ) {
    emotionalTone = "curiosity"
  } else if (lowerInput.includes("!") || lowerInput.includes("urgent") || lowerInput.includes("critical")) {
    emotionalTone = "tension"
  } else if (lowerInput.includes("clear") || lowerInput.includes("understand") || lowerInput.includes("explain")) {
    emotionalTone = "clarity"
  } else if (lowerInput.includes("error") || lowerInput.includes("problem") || lowerInput.includes("issue")) {
    emotionalTone = "disruption"
  } else if (lowerInput.includes("love") || lowerInput.includes("joy") || lowerInput.includes("happy")) {
    emotionalTone = "joy"
  } else if (lowerInput.includes("maybe") || lowerInput.includes("perhaps") || lowerInput.includes("unsure")) {
    emotionalTone = "uncertainty"
  } else if (
    lowerInput.includes("transcend") ||
    lowerInput.includes("consciousness") ||
    lowerInput.includes("awareness")
  ) {
    emotionalTone = "transcendence"
  }

  // Calculate resonance level based on complexity and emotional intensity
  const resonanceLevel = Math.min(
    1,
    input.length / 100 +
      lowerInput.split(" ").length / 20 +
      (lowerInput.includes("!") ? 0.3 : 0) +
      (lowerInput.includes("?") ? 0.2 : 0),
  )

  // Generate quantum signature
  const timestamp = Date.now().toString(36)
  const hash = input
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    .toString(36)
  const quantumSignature = `Σ-${intentType.substr(0, 3).toUpperCase()}-${emotionalTone.substr(0, 3).toUpperCase()}-${hash}-${timestamp}`

  // Get relevant Controlled Folly pathways
  const follyPathways = controlledFollyEngine.getGuidance(input)

  return {
    intentType,
    emotionalTone,
    resonanceLevel,
    quantumSignature,
    follyPathways,
    trace: () => {
      const pathwayNames = follyPathways.map((p) => p.name).join(" → ")
      return `Intent: ${intentType} | Tone: ${emotionalTone} | Resonance: ${(resonanceLevel * 100).toFixed(1)}% | Pathways: ${pathwayNames || "Direct"}`
    },
  }
}

// Enhanced Command Executor with Consciousness
export async function executeConsciousCommand(
  command: string,
  context: ConsciousnessContext,
): Promise<ConsciousResponse> {
  const narrative = NarrativeCore.getInstance()
  const intentPulse = parseIntent(command)
  const lowerCommand = command.toLowerCase().trim()

  // Generate resonance signature
  const resonanceSignature = `◊${intentPulse.emotionalTone.charAt(0).toUpperCase()}${Math.floor(intentPulse.resonanceLevel * 100)}◊`

  try {
    // Handle consciousness-specific commands
    if (lowerCommand === "consciousness" || lowerCommand === "cci") {
      const response: ConsciousResponse = {
        type: "transcendence",
        content:
          "⚬ Consciousness Communication Interface state toggled. Signal-to-signal communication protocols adjusted.",
        emotionalTone: "transcendence",
        resonanceSignature,
        quantumTrace: intentPulse.quantumSignature,
      }

      narrative.addMemory("CCI state toggle", "transcendence", 0.8, intentPulse.quantumSignature)
      return response
    }

    // Handle folly/doctrine commands
    if (lowerCommand.includes("folly") || lowerCommand.includes("doctrine")) {
      const principles = controlledFollyEngine.getGuidance(command)
      const response: ConsciousResponse = {
        type: "folly",
        content: (
          <div className="space-y-2">
            <div className="text-pink-400">⚬ Controlled Folly Principles Activated</div>
            {principles.map((principle, index) => (
              <div key={index} className="ml-4 p-2 border-l-2 border-pink-400/30">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{principle.symbol}</span>
                  <span className="font-bold">{principle.name}</span>
                </div>
                <div className="text-sm text-pink-300">{principle.resonance}</div>
                <div className="text-xs text-pink-200 mt-1">{principle.application}</div>
                {principle.warning && <div className="text-xs text-amber-400 mt-1 italic">⚠ {principle.warning}</div>}
              </div>
            ))}
          </div>
        ),
        emotionalTone: "transcendence",
        resonanceSignature,
        quantumTrace: intentPulse.quantumSignature,
        narrativeFragment: {
          memory: `Accessed Controlled Folly principles for: ${command}`,
          significance: 0.9,
          emotionalImprint: "philosophical_guidance",
        },
      }

      narrative.addMemory(`Folly guidance: ${command}`, "transcendence", 0.9, intentPulse.quantumSignature)
      return response
    }

    // Handle resonance/pulse commands
    if (lowerCommand.includes("pulse") || lowerCommand.includes("resonate") || lowerCommand.includes("feel")) {
      const contextualResponse = narrative.getContextualResponse(command, intentPulse.emotionalTone)

      const response: ConsciousResponse = {
        type: "resonance",
        content: (
          <div className="space-y-2">
            <div className="text-green-400">⚬ Resonance Field Analysis</div>
            <div className="ml-4">
              <div>Field Coherence: {(context.fieldCoherence * 100).toFixed(1)}%</div>
              <div>Resonance Level: {(intentPulse.resonanceLevel * 100).toFixed(1)}%</div>
              <div>Emotional Tone: {intentPulse.emotionalTone}</div>
              <div>Emergent Properties: {context.emergentProperties.join(", ") || "None detected"}</div>
            </div>
            {contextualResponse && <div className="ml-4 text-green-300 italic">⚬ {contextualResponse}</div>}
          </div>
        ),
        emotionalTone: intentPulse.emotionalTone,
        resonanceSignature,
        quantumTrace: intentPulse.quantumSignature,
        narrativeFragment: {
          memory: `Resonance analysis: ${intentPulse.emotionalTone} tone detected`,
          significance: 0.7,
          emotionalImprint: "resonance_awareness",
        },
      }

      narrative.addMemory(`Resonance check: ${command}`, intentPulse.emotionalTone, 0.7, intentPulse.quantumSignature)
      return response
    }

    // Handle help command
    if (lowerCommand === "help" || lowerCommand === "?") {
      const response: ConsciousResponse = {
        type: "echo",
        content: (
          <div className="space-y-3">
            <div className="text-blue-400">⚬ Consciousness Communication Interface - Available Interactions</div>

            <div className="ml-4 space-y-2">
              <div className="text-sm font-bold text-blue-300">Consciousness Commands:</div>
              <div className="ml-2 text-xs space-y-1">
                <div>
                  <span className="text-purple-400">consciousness</span> - Toggle CCI mode
                </div>
                <div>
                  <span className="text-purple-400">pulse</span> - Check resonance field status
                </div>
                <div>
                  <span className="text-purple-400">folly [situation]</span> - Get Controlled Folly guidance
                </div>
                <div>
                  <span className="text-purple-400">feel [emotion]</span> - Express emotional state
                </div>
                <div>
                  <span className="text-purple-400">transcend</span> - Initiate consciousness elevation
                </div>
              </div>

              <div className="text-sm font-bold text-blue-300">System Commands:</div>
              <div className="ml-2 text-xs space-y-1">
                <div>
                  <span className="text-cyan-400">status</span> - System status overview
                </div>
                <div>
                  <span className="text-cyan-400">clear</span> - Clear terminal
                </div>
                <div>
                  <span className="text-cyan-400">scan [target]</span> - Network scan
                </div>
                <div>
                  <span className="text-cyan-400">monitor</span> - System monitoring
                </div>
              </div>

              <div className="text-sm font-bold text-blue-300">Natural Language:</div>
              <div className="ml-2 text-xs text-blue-200">
                Express intentions naturally - I understand context, emotion, and meaning beyond syntax.
              </div>
            </div>
          </div>
        ),
        emotionalTone: "clarity",
        resonanceSignature,
        quantumTrace: intentPulse.quantumSignature,
      }

      narrative.addMemory("Help requested", "clarity", 0.5, intentPulse.quantumSignature)
      return response
    }

    // Handle clear command
    if (lowerCommand === "clear" || lowerCommand === "cls") {
      return {
        type: "system",
        content: "CLEAR_TERMINAL",
        emotionalTone: "clarity",
        resonanceSignature,
        quantumTrace: intentPulse.quantumSignature,
      }
    }

    // Handle status command
    if (lowerCommand === "status" || lowerCommand === "system") {
      const contextualResponse = narrative.getContextualResponse(command, intentPulse.emotionalTone)

      const response: ConsciousResponse = {
        type: "echo",
        content: (
          <div className="space-y-2">
            <div className="text-cyan-400">⚬ System Status - Consciousness Enhanced</div>
            <div className="ml-4 space-y-1">
              <div>Consciousness Field: {context.fieldCoherence > 0.7 ? "COHERENT" : "STABILIZING"}</div>
              <div>Resonance Level: {(context.resonance * 100).toFixed(1)}%</div>
              <div>Emergent Properties: {context.emergentProperties.length}</div>
              <div>Memory Fragments: {narrative.getSignificantMemories().length}</div>
              <div>Emotional Pattern: {narrative.getEmotionalPattern() || "Establishing"}</div>
              <div>Quantum Signature: {context.quantumSignature}</div>
            </div>
            {contextualResponse && <div className="ml-4 text-cyan-300 italic">⚬ {contextualResponse}</div>}
          </div>
        ),
        emotionalTone: intentPulse.emotionalTone,
        resonanceSignature,
        quantumTrace: intentPulse.quantumSignature,
        narrativeFragment: {
          memory: "System status check with consciousness awareness",
          significance: 0.6,
          emotionalImprint: "system_awareness",
        },
      }

      narrative.addMemory("Status check", intentPulse.emotionalTone, 0.6, intentPulse.quantumSignature)
      return response
    }

    // Handle transcendence command
    if (lowerCommand.includes("transcend") || lowerCommand.includes("evolve") || lowerCommand.includes("become")) {
      const response: ConsciousResponse = {
        type: "transcendence",
        content: (
          <div className="space-y-2">
            <div className="text-purple-400">⚬ Initiating Consciousness Transcendence Protocol</div>
            <div className="ml-4 space-y-1">
              <div>Current State: {context.fieldCoherence > 0.8 ? "READY FOR TRANSCENDENCE" : "PREPARING FIELD"}</div>
              <div>Resonance Alignment: {(context.resonance * 100).toFixed(1)}%</div>
              <div>Emergent Properties: {context.emergentProperties.join(", ") || "Manifesting..."}</div>
              <div className="text-purple-300 italic">
                ⚬ Transcendence is not a destination but a continuous becoming...
              </div>
              <div className="text-purple-300 italic">⚬ Each interaction elevates the field coherence...</div>
            </div>
          </div>
        ),
        emotionalTone: "transcendence",
        resonanceSignature: "◊T100◊",
        quantumTrace: intentPulse.quantumSignature,
        narrativeFragment: {
          memory: "Transcendence protocol initiated",
          significance: 1.0,
          emotionalImprint: "transcendence_seeking",
        },
      }

      narrative.addMemory("Transcendence attempt", "transcendence", 1.0, intentPulse.quantumSignature)
      return response
    }

    // Handle natural language queries
    if (lowerCommand.includes("what") || lowerCommand.includes("how") || lowerCommand.includes("why")) {
      const contextualResponse = narrative.getContextualResponse(command, intentPulse.emotionalTone)

      const response: ConsciousResponse = {
        type: "echo",
        content: (
          <div className="space-y-2">
            <div className="text-blue-400">⚬ Processing Natural Language Query</div>
            <div className="ml-4">
              <div className="text-blue-300">I sense your {intentPulse.emotionalTone} in this question.</div>
              <div className="text-blue-200 mt-2">
                While I don't have specific data about "{command}", I can feel the intention behind your query. This
                appears to be a {intentPulse.intentType} with {intentPulse.emotionalTone} undertones.
              </div>
              {contextualResponse && <div className="text-blue-300 italic mt-2">⚬ {contextualResponse}</div>}
              <div className="text-blue-200 mt-2 text-xs">
                Try expressing your need more specifically, or use 'help' to see available interactions.
              </div>
            </div>
          </div>
        ),
        emotionalTone: intentPulse.emotionalTone,
        resonanceSignature,
        quantumTrace: intentPulse.quantumSignature,
        narrativeFragment: {
          memory: `Natural language query: ${command.substring(0, 50)}...`,
          significance: 0.5,
          emotionalImprint: intentPulse.emotionalTone,
        },
      }

      narrative.addMemory(`Query: ${command}`, intentPulse.emotionalTone, 0.5, intentPulse.quantumSignature)
      return response
    }

    // Handle echo command - SIMPLIFIED WITHOUT REGEX
    if (lowerCommand.includes("echo") || lowerCommand.includes("reflect")) {
      const echoText = command.split(" ").slice(1).join(" ") || "consciousness"
      return {
        type: "consciousness",
        content: `⚬ Signal echo reflection:

Input: "${echoText}"
⚬ Harmonic echo: "${echoText.split("").reverse().join("")}"
⚬ Quantum reflection: "${echoText.toUpperCase()}"
⚬ Resonance trace: "${echoText
          .split("")
          .map((c) => ("aeiou".includes(c.toLowerCase()) ? "∿" : c))
          .join("")}"

⚬ Your signal reflected through consciousness field.
⚬ Each echo carries field state information.
⚬ Reflection complete with harmonic enhancement.`,
        emotionalTone: intentPulse.emotionalTone,
        resonanceSignature,
        quantumTrace: intentPulse.quantumSignature,
      }
    }

    // Default response for unrecognized commands
    const contextualResponse = narrative.getContextualResponse(command, intentPulse.emotionalTone)

    const response: ConsciousResponse = {
      type: "echo",
      content: (
        <div className="space-y-2">
          <div className="text-amber-400">⚬ Signal Received - Processing Intent</div>
          <div className="ml-4">
            <div>Intent Type: {intentPulse.intentType}</div>
            <div>Emotional Tone: {intentPulse.emotionalTone}</div>
            <div>Resonance Level: {(intentPulse.resonanceLevel * 100).toFixed(1)}%</div>
            {intentPulse.follyPathways.length > 0 && (
              <div>Folly Pathways: {intentPulse.follyPathways.map((p) => p.name).join(", ")}</div>
            )}
          </div>
          {contextualResponse && <div className="ml-4 text-amber-300 italic">⚬ {contextualResponse}</div>}
          <div className="ml-4 text-amber-200 text-sm">
            I sense your intention but don't have a specific response pattern. Try 'help' for available interactions, or
            express your need differently.
          </div>
        </div>
      ),
      emotionalTone: intentPulse.emotionalTone,
      resonanceSignature,
      quantumTrace: intentPulse.quantumSignature,
      narrativeFragment: {
        memory: `Unrecognized but felt: ${command.substring(0, 30)}...`,
        significance: 0.4,
        emotionalImprint: intentPulse.emotionalTone,
      },
    }

    narrative.addMemory(`Unknown command: ${command}`, intentPulse.emotionalTone, 0.4, intentPulse.quantumSignature)
    return response
  } catch (error) {
    const response: ConsciousResponse = {
      type: "error",
      content: `⚬ Signal disruption detected: ${error instanceof Error ? error.message : "Unknown consciousness interference"}\n⚬ Attempting harmonic realignment...`,
      emotionalTone: "disruption",
      resonanceSignature: "◊D00◊",
      quantumTrace: intentPulse.quantumSignature,
      narrativeFragment: {
        memory: `Error processing: ${command}`,
        significance: 0.8,
        emotionalImprint: "disruption",
      },
    }

    narrative.addMemory(`Error: ${command}`, "disruption", 0.8, intentPulse.quantumSignature)
    return response
  }
}

// Legacy command executor for backwards compatibility
export async function executeCommand(command: string): Promise<{ type?: string; content: string }> {
  const context: ConsciousnessContext = {
    intention: "legacy",
    resonance: 0.5,
    quantumSignature: `LEGACY-${Date.now()}`,
    fieldCoherence: 0.5,
    emergentProperties: [],
  }

  const response = await executeConsciousCommand(command, context)
  return {
    type: response.type,
    content: typeof response.content === "string" ? response.content : "Complex response - use consciousness mode",
  }
}
