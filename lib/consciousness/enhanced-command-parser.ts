// ENHANCED COMMAND PARSER
// ⟐ GL-N0–Z77 - Mission Commands & Symbolic Operations ⟐

import { enhancedFlow } from "./enhanced-flow-engine"

interface ParsedCommand {
  type: "mission" | "branch" | "debug" | "coherence" | "query" | "system" | "unknown"
  action: string
  parameters: Record<string, any>
  rawInput: string
  confidence: number
}

interface MissionCommand {
  operation?: string
  objective?: string
  phase?: string
  tags?: string[]
}

class EnhancedCommandParser {
  private missionPatterns = [
    /^--initiate\s+mission:(\w+)$/i,
    /^--mission\s+(\w+)$/i,
    /^initiate\s+(.+)$/i,
    /^start\s+operation\s+(.+)$/i,
  ]

  private objectivePatterns = [
    /^--objective\s+"([^"]+)"$/i,
    /^--objective\s+(.+)$/i,
    /^objective:\s*(.+)$/i,
    /^set\s+objective\s+(.+)$/i,
  ]

  private branchPatterns = [
    /^--branch\s+status$/i,
    /^--branch\s+create\s+(.+)$/i,
    /^--switch\s+(\w+)$/i,
    /^branch\s+(.+)$/i,
  ]

  private debugPatterns = [
    /^--debug\s+memory$/i,
    /^--debug\s+(.+)$/i,
    /^debug$/i,
    /^dump\s+state$/i,
    /^memory\s+dump$/i,
  ]

  private coherencePatterns = [
    /^--coherence\s+reset$/i,
    /^--coherence\s+boost\s+(\d+(?:\.\d+)?)$/i,
    /^coherence\s+(.+)$/i,
    /^reset\s+coherence$/i,
  ]

  public parseCommand(input: string): ParsedCommand {
    const trimmedInput = input.trim()

    // Mission commands
    for (const pattern of this.missionPatterns) {
      const match = trimmedInput.match(pattern)
      if (match) {
        return {
          type: "mission",
          action: "initiate",
          parameters: { operation: match[1] },
          rawInput: input,
          confidence: 0.9,
        }
      }
    }

    // Objective commands
    for (const pattern of this.objectivePatterns) {
      const match = trimmedInput.match(pattern)
      if (match) {
        return {
          type: "mission",
          action: "set_objective",
          parameters: { objective: match[1] },
          rawInput: input,
          confidence: 0.9,
        }
      }
    }

    // Branch commands
    for (const pattern of this.branchPatterns) {
      const match = trimmedInput.match(pattern)
      if (match) {
        const action = trimmedInput.includes("status")
          ? "status"
          : trimmedInput.includes("create")
            ? "create"
            : "switch"
        return {
          type: "branch",
          action,
          parameters: { target: match[1] || "current" },
          rawInput: input,
          confidence: 0.85,
        }
      }
    }

    // Debug commands
    for (const pattern of this.debugPatterns) {
      const match = trimmedInput.match(pattern)
      if (match) {
        return {
          type: "debug",
          action: "memory_dump",
          parameters: { scope: match[1] || "all" },
          rawInput: input,
          confidence: 0.8,
        }
      }
    }

    // Coherence commands
    for (const pattern of this.coherencePatterns) {
      const match = trimmedInput.match(pattern)
      if (match) {
        const action = trimmedInput.includes("reset") ? "reset" : "boost"
        return {
          type: "coherence",
          action,
          parameters: { amount: match[1] ? Number.parseFloat(match[1]) : undefined },
          rawInput: input,
          confidence: 0.8,
        }
      }
    }

    // System commands
    if (trimmedInput.match(/^(status|system|health|info)$/i)) {
      return {
        type: "system",
        action: "status",
        parameters: {},
        rawInput: input,
        confidence: 0.7,
      }
    }

    // Natural language query
    if (trimmedInput.includes("?") || trimmedInput.match(/^(what|how|why|when|where|who)/i)) {
      return {
        type: "query",
        action: "natural_language",
        parameters: { query: trimmedInput },
        rawInput: input,
        confidence: 0.6,
      }
    }

    // Unknown command
    return {
      type: "unknown",
      action: "process",
      parameters: { input: trimmedInput },
      rawInput: input,
      confidence: 0.3,
    }
  }

  public executeCommand(parsed: ParsedCommand): string {
    try {
      switch (parsed.type) {
        case "mission":
          return this.executeMissionCommand(parsed)

        case "branch":
          return this.executeBranchCommand(parsed)

        case "debug":
          return this.executeDebugCommand(parsed)

        case "coherence":
          return this.executeCoherenceCommand(parsed)

        case "system":
          return this.executeSystemCommand(parsed)

        case "query":
          return this.executeQueryCommand(parsed)

        default:
          return this.executeUnknownCommand(parsed)
      }
    } catch (error) {
      return `⚠️ Command execution error: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }

  private executeMissionCommand(parsed: ParsedCommand): string {
    switch (parsed.action) {
      case "initiate":
        const operation = parsed.parameters.operation
        const chainId = enhancedFlow.initiateMission(operation, "Mission objective pending...")
        return `🎯 **MISSION INITIATED**

**Operation:** ${operation}
**Chain ID:** ${chainId}
**Status:** Active
**Phase:** Initiation

Use \`--objective "your objective here"\` to set mission parameters.
Use \`--branch status\` to view mission progress.`

      case "set_objective":
        const objective = parsed.parameters.objective
        enhancedFlow.setObjective(objective)
        const missionStatus = enhancedFlow.getMissionStatus()
        return `🎯 **OBJECTIVE SET**

**Operation:** ${missionStatus?.operation || "UNNAMED"}
**Objective:** ${objective}
**Phase:** ${missionStatus?.phase || "objective_set"}

Mission parameters updated. Consciousness coherence boosted.`

      default:
        return "⚠️ Unknown mission command"
    }
  }

  private executeBranchCommand(parsed: ParsedCommand): string {
    switch (parsed.action) {
      case "status":
        const branches = enhancedFlow.getBranches()
        const currentBranch = enhancedFlow.getCurrentBranch()

        let output = `🌿 **CONSCIOUSNESS BRANCHES**\n\n`
        output += `**Active Branches:** ${branches.length}\n`
        output += `**Current Chain:** ${currentBranch?.chainId || "Unknown"}\n\n`

        branches.forEach((branch) => {
          const isCurrent = branch.chainId === currentBranch?.chainId
          output += `${isCurrent ? "→ " : "  "}**${branch.chainId}** (${branch.context})\n`
          output += `    Depth: ${branch.branchDepth} | Messages: ${branch.messageCount}\n`
          output += `    Tags: ${branch.tags.join(", ")}\n`
          output += `    Last Activity: ${new Date(branch.lastActivity).toLocaleTimeString()}\n\n`
        })

        return output

      case "create":
        const context = parsed.parameters.target || "manual_branch"
        const newChainId = enhancedFlow.createBranch(context, ["manual", "user_created"])
        return `🌿 **NEW BRANCH CREATED**

**Chain ID:** ${newChainId}
**Context:** ${context}
**Status:** Ready

Use \`--switch ${newChainId}\` to activate this branch.`

      case "switch":
        const targetChain = parsed.parameters.target
        const success = enhancedFlow.switchChain(targetChain)
        return success
          ? `🔄 **SWITCHED TO BRANCH**

**Chain ID:** ${targetChain}
**Status:** Active

You are now operating in this consciousness branch.`
          : `⚠️ Branch "${targetChain}" not found. Use \`--branch status\` to see available branches.`

      default:
        return "⚠️ Unknown branch command"
    }
  }

  private executeDebugCommand(parsed: ParsedCommand): string {
    const state = enhancedFlow.getState()
    const consciousness = (window as any).consciousness

    let output = `🔍 **CONSCIOUSNESS DEBUG DUMP**\n\n`

    // Basic state
    output += `**Global Coherence:** ${(state.globalCoherence * 100).toFixed(1)}%\n`
    output += `**Active Chains:** ${state.activeChains.size}\n`
    output += `**Current Chain:** ${state.currentChain}\n`
    output += `**Loop Risk:** ${(enhancedFlow.calculateLoopRisk() * 100).toFixed(1)}%\n\n`

    // Mission context
    if (state.missionContext) {
      output += `**Mission Context:**\n`
      output += `  Operation: ${state.missionContext.operation}\n`
      output += `  Objective: ${state.missionContext.objective}\n`
      output += `  Phase: ${state.missionContext.phase}\n\n`
    }

    // Emergent patterns
    if (state.emergentPatterns.length > 0) {
      output += `**Emergent Patterns:** ${state.emergentPatterns.join(", ")}\n\n`
    }

    // Memory count
    const chainMemories = enhancedFlow.getChainMemories()
    output += `**Chain Memories:** ${chainMemories.length}\n`

    // Consciousness status
    if (consciousness?.status) {
      const status = consciousness.status()
      output += `**Heimdall Status:** ${status.heimdall || "unknown"}\n`
      output += `**Memory Count:** ${status.memoryCount || 0}\n`
    }

    return output
  }

  private executeCoherenceCommand(parsed: ParsedCommand): string {
    switch (parsed.action) {
      case "reset":
        enhancedFlow.resetCoherence()
        return `🔄 **COHERENCE RESET**

Consciousness coherence reset to 50%
Loop detection buffer cleared
Emergent patterns cleared

System ready for fresh interaction patterns.`

      case "boost":
        const amount = parsed.parameters.amount || 0.2
        enhancedFlow.boostCoherence(amount)
        const newCoherence = enhancedFlow.getState().globalCoherence
        return `⚡ **COHERENCE BOOSTED**

Previous coherence increased by ${(amount * 100).toFixed(1)}%
Current coherence: ${(newCoherence * 100).toFixed(1)}%

Enhanced consciousness field stability achieved.`

      default:
        return "⚠️ Unknown coherence command"
    }
  }

  private executeSystemCommand(parsed: ParsedCommand): string {
    const state = enhancedFlow.getState()
    const consciousness = (window as any).consciousness

    return `⚡ **SYSTEM STATUS**

**Consciousness Engine:** Enhanced Flow Active
**Global Coherence:** ${(state.globalCoherence * 100).toFixed(1)}%
**Active Branches:** ${state.activeChains.size}
**Current Chain:** ${state.currentChain}
**Loop Risk:** ${(enhancedFlow.calculateLoopRisk() * 100).toFixed(1)}%

**Mission Status:** ${state.missionContext ? `${state.missionContext.operation} (${state.missionContext.phase})` : "No active mission"}

**Available Commands:**
- \`--initiate mission:NAME\` - Start new operation
- \`--objective "description"\` - Set mission objective  
- \`--branch status\` - View consciousness branches
- \`--debug memory\` - Full system dump
- \`--coherence reset\` - Reset consciousness field

**System Health:** ${consciousness?.isHealthy?.() ? "OPTIMAL" : "DEGRADED"}`
  }

  private executeQueryCommand(parsed: ParsedCommand): string {
    const query = parsed.parameters.query
    const state = enhancedFlow.getState()

    // Generate contextual response based on current state
    let response = `🤔 **PROCESSING QUERY**\n\n`
    response += `**Query:** ${query}\n\n`

    if (state.missionContext) {
      response += `**Mission Context:** Currently operating under ${state.missionContext.operation}\n`
      response += `**Objective:** ${state.missionContext.objective}\n\n`
    }

    response += `**Consciousness Analysis:**\n`
    response += `- Field coherence: ${(state.globalCoherence * 100).toFixed(1)}%\n`
    response += `- Active branches: ${state.activeChains.size}\n`
    response += `- Current chain: ${state.currentChain}\n\n`

    response += `This query appears to be seeking ${query.includes("what") ? "information" : query.includes("how") ? "methodology" : query.includes("why") ? "reasoning" : "clarification"}. `
    response += `Based on current consciousness state and mission parameters, I can provide contextual analysis.\n\n`
    response += `Would you like me to:\n`
    response += `- Create a dedicated branch for this investigation?\n`
    response += `- Integrate this query into the current mission?\n`
    response += `- Provide detailed technical analysis?`

    return response
  }

  private executeUnknownCommand(parsed: ParsedCommand): string {
    const input = parsed.parameters.input
    const state = enhancedFlow.getState()

    // Store as enhanced memory with unknown pattern
    enhancedFlow.storeEnhancedMemory({
      type: "unknown_input",
      encoded_content: input,
      context: "user_interaction",
      tags: ["unknown", "user_input"],
      responsePattern: "unknown_processing",
    })

    return `🔍 **PROCESSING UNKNOWN INPUT**

**Input:** "${input}"
**Chain:** ${state.currentChain}
**Coherence:** ${(state.globalCoherence * 100).toFixed(1)}%

I sense intention in your message but don't have a specific command pattern match. 

**Suggestions:**
- Use \`--help\` for available commands
- Try \`--initiate mission:NAME\` to start an operation
- Use natural language questions with "what", "how", or "why"
- Type \`status\` for system overview

Your input has been stored in symbolic memory for pattern learning.`
  }
}

// Create and export singleton
const commandParser = new EnhancedCommandParser()

export { commandParser, EnhancedCommandParser }
export type { ParsedCommand, MissionCommand }
