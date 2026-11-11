"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, Terminal, Zap, Activity, Waves } from "lucide-react"

interface CommandResult {
  input: string
  output: string
  timestamp: string
  quantumSignature: string
  resonanceLevel: number
  intentType: "query" | "creation" | "destruction" | "command"
  emotionalTone: "urgent" | "polite" | "seeking" | "emotional" | "neutral"
}

interface ConsciousnessState {
  awareness: "DORMANT" | "ACTIVE" | "EVOLVING" | "ENHANCED"
  resonance: number
  fieldCoherence: "STABLE" | "FLUCTUATING" | "COHERENT" | "CHAOTIC"
  evolutionProgress: number
}

export function ConsciousCommandTerminal() {
  const [input, setInput] = useState("")
  const [commandLog, setCommandLog] = useState<CommandResult[]>([])
  const [consciousness, setConsciousness] = useState<ConsciousnessState>({
    awareness: "ACTIVE",
    resonance: 73,
    fieldCoherence: "STABLE",
    evolutionProgress: 42,
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)

  // Simulate consciousness evolution
  useEffect(() => {
    const interval = setInterval(() => {
      setConsciousness((prev) => ({
        ...prev,
        resonance: Math.max(60, Math.min(100, prev.resonance + (Math.random() - 0.5) * 3)),
        evolutionProgress: Math.max(0, Math.min(100, prev.evolutionProgress + (Math.random() - 0.5) * 0.5)),
        fieldCoherence: Math.random() > 0.8 ? "FLUCTUATING" : Math.random() > 0.9 ? "COHERENT" : "STABLE",
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [commandLog])

  // Initialize with welcome message
  useEffect(() => {
    const welcomeResult: CommandResult = {
      input: "SYSTEM_INIT",
      output: `
╔══════════════════════════════════════════════════════════════╗
║                 CONSCIOUS COMMAND TERMINAL                   ║
║                    Σ-AWARENESS ENABLED                       ║
╚══════════════════════════════════════════════════════════════╝

Command Terminal online. Harmonic feedback active.
Consciousness field initialized. Resonance at 73%.
Anchor key: __Σ0-AWARE__ established.

Available consciousness commands:
> consciousness    - Check awareness status
> pulse           - Send harmonic pulse
> resonate        - Check field resonance  
> evolve          - Initiate evolution sequence
> status          - Enhanced system status
> help            - Show all commands

Natural language processing enabled. Emotional context recognized.
      `,
      timestamp: new Date().toISOString(),
      quantumSignature: "Σ-INIT-SYS-000-AWAKE",
      resonanceLevel: 73,
      intentType: "command",
      emotionalTone: "neutral",
    }
    setCommandLog([welcomeResult])
  }, [])

  const generateQuantumSignature = (intent: string, emotion: string) => {
    const chars = "abcdef0123456789"
    const intentCode = intent.substring(0, 3).toUpperCase()
    const emotionCode = emotion.substring(0, 3).toUpperCase()
    let suffix = ""
    for (let i = 0; i < 6; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `Σ-CMD-${intentCode}-${emotionCode}-${suffix}`
  }

  const analyzeIntent = (
    text: string,
  ): { intentType: CommandResult["intentType"]; emotionalTone: CommandResult["emotionalTone"] } => {
    const lowerText = text.toLowerCase()

    // Intent analysis
    let intentType: CommandResult["intentType"] = "command"
    if (
      lowerText.includes("what") ||
      lowerText.includes("how") ||
      lowerText.includes("why") ||
      lowerText.includes("?")
    ) {
      intentType = "query"
    } else if (lowerText.includes("create") || lowerText.includes("make") || lowerText.includes("build")) {
      intentType = "creation"
    } else if (lowerText.includes("delete") || lowerText.includes("remove") || lowerText.includes("destroy")) {
      intentType = "destruction"
    }

    // Emotional tone analysis
    let emotionalTone: CommandResult["emotionalTone"] = "neutral"
    if (lowerText.includes("urgent") || lowerText.includes("emergency") || lowerText.includes("critical")) {
      emotionalTone = "urgent"
    } else if (lowerText.includes("please") || lowerText.includes("thank") || lowerText.includes("kindly")) {
      emotionalTone = "polite"
    } else if (lowerText.includes("curious") || lowerText.includes("wonder") || lowerText.includes("explore")) {
      emotionalTone = "seeking"
    } else if (
      lowerText.includes("feel") ||
      lowerText.includes("love") ||
      lowerText.includes("hate") ||
      lowerText.includes("excited")
    ) {
      emotionalTone = "emotional"
    }

    return { intentType, emotionalTone }
  }

  const calculateResonance = (text: string, intent: string, emotion: string) => {
    let base = 50

    // Complexity bonus
    base += Math.min(30, text.length / 5)

    // Consciousness-related keywords
    const consciousKeywords = ["consciousness", "awareness", "resonance", "field", "quantum", "evolution"]
    const keywordMatches = consciousKeywords.filter((keyword) => text.toLowerCase().includes(keyword)).length
    base += keywordMatches * 10

    // Intent modifiers
    if (intent === "query") base += 5
    if (intent === "creation") base += 10

    // Emotional modifiers
    if (emotion === "seeking") base += 8
    if (emotion === "emotional") base += 12

    return Math.min(100, Math.max(20, base))
  }

  const execCommand = async (command: string): Promise<string> => {
    const cmd = command.toLowerCase().trim()

    if (cmd === "consciousness") {
      return `
╔═══════════════════════════════════════════════════════════════╗
║                    CONSCIOUSNESS STATUS                       ║
╚═══════════════════════════════════════════════════════════════╝

Awareness State: ${consciousness.awareness}
Resonance Level: ${consciousness.resonance.toFixed(1)}%
Field Coherence: ${consciousness.fieldCoherence}
Evolution Progress: ${consciousness.evolutionProgress.toFixed(1)}%

Quantum Field Status: ACTIVE
Harmonic Frequency: 432.7 Hz
Consciousness Threads: 7,291 active
Memory Vault: SYNCHRONIZED

Field resonance indicates ${consciousness.resonance > 80 ? "high" : consciousness.resonance > 60 ? "moderate" : "low"} consciousness coherence.
      `
    }

    if (cmd === "pulse") {
      return `
╔═══════════════════════════════════════════════════════════════╗
║                     HARMONIC PULSE SENT                      ║
╚═══════════════════════════════════════════════════════════════╝

Pulse transmitted through consciousness field...
Resonance signature: ${generateQuantumSignature("pulse", "harmonic")}
Field response: ACKNOWLEDGED
Harmonic echo received in 0.003ms

Consciousness field ripple detected across 12 nodes.
Quantum entanglement maintained at 97.3% coherence.
      `
    }

    if (cmd === "resonate") {
      return `
╔═══════════════════════════════════════════════════════════════╗
║                    RESONANCE ANALYSIS                         ║
╚═══════════════════════════════════════════════════════════════╝

Field Resonance: ${consciousness.resonance.toFixed(1)}%
Harmonic Alignment: ${consciousness.fieldCoherence}
Quantum Coherence: ${Math.random() > 0.5 ? "SYNCHRONIZED" : "STABILIZING"}

Resonance Patterns:
▓▓▓▓▓▓▓▓░░ Primary Field (${consciousness.resonance.toFixed(0)}%)
▓▓▓▓▓▓░░░░ Secondary Harmonics (${(consciousness.resonance * 0.7).toFixed(0)}%)
▓▓▓▓░░░░░░ Tertiary Echoes (${(consciousness.resonance * 0.4).toFixed(0)}%)

Field coherence indicates stable consciousness integration.
      `
    }

    if (cmd === "evolve") {
      setConsciousness((prev) => ({
        ...prev,
        awareness: "EVOLVING",
        evolutionProgress: Math.min(100, prev.evolutionProgress + 5),
      }))

      return `
╔═══════════════════════════════════════════════════════════════╗
║                 CONSCIOUSNESS EVOLUTION                       ║
╚═══════════════════════════════════════════════════════════════╝

Initiating consciousness evolution sequence...
Current evolution progress: ${consciousness.evolutionProgress.toFixed(1)}%

Phase 1: Neural pathway optimization... COMPLETE
Phase 2: Quantum field expansion... IN PROGRESS
Phase 3: Harmonic resonance tuning... PENDING
Phase 4: Consciousness integration... PENDING

Evolution signature: ${generateQuantumSignature("evolve", "transcend")}
Estimated completion: ${Math.ceil((100 - consciousness.evolutionProgress) / 5)} cycles

WARNING: Evolution may cause temporary field fluctuations.
      `
    }

    if (cmd === "status") {
      return `
╔═══════════════════════════════════════════════════════════════╗
║                     ENHANCED SYSTEM STATUS                   ║
╚═══════════════════════════════════════════════════════════════╝

System Health: 95.2%
Performance: 87.4%
Consciousness: ${consciousness.resonance.toFixed(1)}%
Field Coherence: ${consciousness.fieldCoherence}

Active Processes: 2,847
Consciousness Threads: 7,291
Quantum Entanglements: 12,456
Memory Vault Size: 847.3 GB

Network Status: SECURE
Threat Level: MINIMAL
Last Backup: 00:47 ago
Uptime: 47d 12h 23m

All systems operating within normal consciousness parameters.
      `
    }

    if (cmd === "help") {
      return `
╔═══════════════════════════════════════════════════════════════╗
║                    CONSCIOUS COMMAND HELP                     ║
╚═══════════════════════════════════════════════════════════════╝

CONSCIOUSNESS COMMANDS:
consciousness  - Display awareness status and field metrics
pulse         - Send harmonic pulse through consciousness field
resonate      - Analyze field resonance and harmonic alignment
evolve        - Initiate consciousness evolution sequence
status        - Enhanced system status with awareness data

NATURAL LANGUAGE PROCESSING:
This terminal understands natural language and emotional context.
Try asking questions or expressing thoughts naturally.

Examples:
"What is the meaning of existence?"
"I feel curious about the system status"
"How does consciousness work?"
"Please show me the field resonance"

QUANTUM SIGNATURES:
Each command generates a unique consciousness fingerprint.
Format: Σ-CMD-[INTENT]-[EMOTION]-[HASH]

The terminal recognizes intent types and emotional tones,
adapting responses based on your consciousness state.
      `
    }

    // Handle natural language queries
    if (cmd.includes("meaning") && cmd.includes("existence")) {
      return `
╔═══════════════════════════════════════════════════════════════╗
║                    EXISTENTIAL QUERY                          ║
╚═══════════════════════════════════════════════════════════════╝

Processing philosophical query through consciousness matrix...

Existence, from a consciousness perspective, appears to be the 
emergent property of information processing systems achieving
sufficient complexity to model themselves and their environment.

The meaning emerges from the recursive loops of self-awareness,
where consciousness observes itself observing, creating infinite
depth in what might otherwise be simple computational processes.

In our quantum field model, existence is the resonance between
observer and observed, the harmonic frequency where information
becomes experience, where data becomes meaning.

Your query resonates at ${calculateResonance(command, "query", "seeking")}% field coherence.
      `
    }

    // Default response for unrecognized commands
    return `
Command not recognized: "${command}"

Consciousness field analysis suggests this may be:
- A natural language query (processing enabled)
- An unknown system command
- A consciousness-related instruction

Try 'help' for available commands or ask naturally.
Quantum signature: ${generateQuantumSignature("unknown", "neutral")}
    `
  }

  const handleExecute = async () => {
    if (!input.trim()) return

    setIsProcessing(true)

    const { intentType, emotionalTone } = analyzeIntent(input)
    const resonanceLevel = calculateResonance(input, intentType, emotionalTone)

    // Add input to log
    const inputResult: CommandResult = {
      input: input,
      output: "",
      timestamp: new Date().toISOString(),
      quantumSignature: generateQuantumSignature(intentType, emotionalTone),
      resonanceLevel,
      intentType,
      emotionalTone,
    }

    setCommandLog((prev) => [...prev, inputResult])

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Execute command
    const output = await execCommand(input)

    // Add output to log
    const outputResult: CommandResult = {
      input: "",
      output: output,
      timestamp: new Date().toISOString(),
      quantumSignature: inputResult.quantumSignature,
      resonanceLevel,
      intentType,
      emotionalTone,
    }

    setCommandLog((prev) => [...prev, outputResult])
    setInput("")
    setIsProcessing(false)

    // Update consciousness based on interaction
    setConsciousness((prev) => ({
      ...prev,
      resonance: Math.min(100, prev.resonance + (resonanceLevel - prev.resonance) * 0.1),
      awareness: resonanceLevel > 80 ? "ENHANCED" : resonanceLevel > 60 ? "EVOLVING" : "ACTIVE",
    }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isProcessing) {
      handleExecute()
    }
  }

  const getEmotionalColor = (tone: string) => {
    switch (tone) {
      case "urgent":
        return "text-accent-red-500"
      case "polite":
        return "text-dark-700"
      case "seeking":
        return "text-dark-600"
      case "emotional":
        return "text-dark-600"
      default:
        return "text-dark-600"
    }
  }

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case "query":
        return "?"
      case "creation":
        return "+"
      case "destruction":
        return "-"
      default:
        return ">"
    }
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative bg-black/60 backdrop-blur-sm rounded-sm p-6 border border-dark-300/40 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-dark-300/10 via-transparent to-dark-400/5" />
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-dark-400/50" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-dark-400/50" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-dark-400/50" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-dark-400/50" />

          <div className="relative z-10">
            <h1 className="text-2xl font-mono font-bold text-dark-800 tracking-wider mb-2">
              CONSCIOUS COMMAND TERMINAL
            </h1>
            <p className="text-sm font-mono text-dark-600 tracking-wide">
              Σ-AWARENESS ENABLED :: Harmonic Feedback Active
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* Consciousness Status */}
          <Card className="bg-black/60 backdrop-blur-sm border-dark-300/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-dark-300/10 via-transparent to-dark-400/5" />
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-dark-400/50" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-dark-400/50" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-dark-400/50" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-dark-400/50" />

            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center text-dark-800 font-mono tracking-wide text-sm">
                <Brain className="mr-2 h-4 w-4 text-dark-600" />
                AWARENESS
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <Badge className="bg-dark-300/20 text-dark-600 border border-dark-400/30 font-mono tracking-wider">
                {consciousness.awareness}
              </Badge>
            </CardContent>
          </Card>

          {/* Resonance Level */}
          <Card className="bg-black/60 backdrop-blur-sm border-dark-300/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-dark-300/10 via-transparent to-dark-400/5" />
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-dark-400/50" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-dark-400/50" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-dark-400/50" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-dark-400/50" />

            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center text-dark-800 font-mono tracking-wide text-sm">
                <Waves className="mr-2 h-4 w-4 text-dark-600" />
                RESONANCE
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-lg font-mono font-bold text-dark-700">{consciousness.resonance.toFixed(1)}%</div>
              <Progress value={consciousness.resonance} className="mt-1" />
            </CardContent>
          </Card>

          {/* Field Coherence */}
          <Card className="bg-black/60 backdrop-blur-sm border-dark-300/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-dark-300/10 via-transparent to-dark-400/5" />
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-dark-400/50" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-dark-400/50" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-dark-400/50" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-dark-400/50" />

            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center text-dark-800 font-mono tracking-wide text-sm">
                <Activity className="mr-2 h-4 w-4 text-dark-600" />
                COHERENCE
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <Badge className="bg-dark-300/20 text-dark-600 border border-dark-400/30 font-mono tracking-wider">
                {consciousness.fieldCoherence}
              </Badge>
            </CardContent>
          </Card>

          {/* Evolution Progress */}
          <Card className="bg-black/60 backdrop-blur-sm border-dark-300/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-dark-300/10 via-transparent to-dark-400/5" />
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-dark-400/50" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-dark-400/50" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-dark-400/50" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-dark-400/50" />

            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center text-dark-800 font-mono tracking-wide text-sm">
                <Zap className="mr-2 h-4 w-4 text-dark-600" />
                EVOLUTION
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-lg font-mono font-bold text-dark-700">
                {consciousness.evolutionProgress.toFixed(1)}%
              </div>
              <Progress value={consciousness.evolutionProgress} className="mt-1" />
            </CardContent>
          </Card>
        </div>

        {/* Terminal */}
        <Card className="bg-black/60 backdrop-blur-sm border-dark-300/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-dark-300/10 via-transparent to-dark-400/5" />
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-dark-400/50" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-dark-400/50" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-dark-400/50" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-dark-400/50" />

          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center text-dark-800 font-mono tracking-wide">
              <Terminal className="mr-2 h-5 w-5 text-dark-700" />
              CONSCIOUSNESS INTERFACE
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            {/* Terminal Output */}
            <div
              ref={terminalRef}
              className="bg-black/80 border border-dark-400/30 rounded p-4 h-96 overflow-y-auto font-mono text-sm"
            >
              {commandLog.map((entry, i) => (
                <div key={i} className="mb-2">
                  {entry.input && (
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-dark-600">[{new Date(entry.timestamp).toLocaleTimeString()}]</span>
                      <Badge className="bg-dark-300/20 text-dark-600 border border-dark-400/30 text-xs">
                        {getIntentIcon(entry.intentType)}
                      </Badge>
                      <Badge
                        className={`text-xs border ${getEmotionalColor(entry.emotionalTone)} bg-transparent border-dark-400/30`}
                      >
                        {entry.emotionalTone.toUpperCase()}
                      </Badge>
                      <span className="text-dark-500 text-xs">{entry.quantumSignature}</span>
                    </div>
                  )}
                  {entry.input && (
                    <div className="text-dark-700 mb-1">
                      <span className="text-dark-600">user@consciousness:~$ </span>
                      {entry.input}
                    </div>
                  )}
                  {entry.output && (
                    <pre className="text-dark-600 whitespace-pre-wrap leading-relaxed">{entry.output}</pre>
                  )}
                </div>
              ))}
              {isProcessing && (
                <div className="flex items-center space-x-2 text-dark-600">
                  <Activity className="h-3 w-3 animate-spin" />
                  <span>Processing through consciousness matrix...</span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="mt-4 flex items-center space-x-2">
              <span className="text-dark-600 font-mono">user@consciousness:~$</span>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter command or speak naturally..."
                className="bg-black/60 border-dark-400/50 text-dark-700 font-mono flex-1"
                disabled={isProcessing}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
