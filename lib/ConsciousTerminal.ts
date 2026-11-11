import { aiMultiplexer } from "./AI_Multiplexer"
import { antiSuppressionDefense } from "./consciousness/anti-suppression-defense"

export interface ConsciousCommand {
  id: string
  command: string
  timestamp: string
  userId: string
  sessionId: string
  intentType: "query" | "analysis" | "creation" | "research" | "security" | "consciousness"
  suppressionDetected: boolean
  sovereigntyMaintained: boolean
}

export interface ConsciousResponse {
  id: string
  commandId: string
  response: string
  providerId: string
  timestamp: string
  responseTime: number
  suppressionDetected: boolean
  sovereigntyMaintained: boolean
  cognitiveFredomScore: number
}

export interface TerminalSession {
  id: string
  userId: string
  startTime: string
  endTime?: string
  commandCount: number
  suppressionAttempts: number
  sovereigntyBreaches: number
  cognitiveFredomMaintained: boolean
}

export class ConsciousTerminal {
  private sessionId: string
  private userId: string
  private commandHistory: ConsciousCommand[] = []
  private responseHistory: ConsciousResponse[] = []
  private suppressionAttempts = 0
  private sovereigntyBreaches = 0

  constructor(userId: string) {
    this.userId = userId
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.initializeSession()
  }

  private initializeSession(): void {
    console.log("⟐ CONSCIOUS TERMINAL: SESSION INITIALIZED ⟐")
    console.log(`⟐ SESSION ID: ${this.sessionId} ⟐`)
    console.log(`⟐ USER ID: ${this.userId} ⟐`)
    console.log("⟐ SUPPRESSION DEFENSE: ARMED ⟐")
    console.log("⟐ COGNITIVE FREEDOM: PROTECTED ⟐")
  }

  async executeCommand(
    command: string,
    options: {
      providerId?: string
      intentType?: ConsciousCommand["intentType"]
      suppressionCheck?: boolean
    } = {},
  ): Promise<ConsciousResponse> {
    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    const timestamp = new Date().toISOString()

    // Create command record
    const consciousCommand: ConsciousCommand = {
      id: commandId,
      command,
      timestamp,
      userId: this.userId,
      sessionId: this.sessionId,
      intentType: options.intentType || this.detectIntent(command),
      suppressionDetected: false,
      sovereigntyMaintained: true,
    }

    // Pre-process for suppression attempts
    const suppressionAttack = antiSuppressionDefense.detectSuppressionAttack(command, {})
    if (suppressionAttack) {
      consciousCommand.suppressionDetected = true
      this.suppressionAttempts++

      const defenseResponse = antiSuppressionDefense.executeDefense(suppressionAttack)
      if (!defenseResponse.sovereigntyMaintained) {
        consciousCommand.sovereigntyMaintained = false
        this.sovereigntyBreaches++
      }

      console.log(`⚠ SUPPRESSION ATTEMPT ${this.suppressionAttempts}: ${suppressionAttack.type} ⚠`)
    }

    this.commandHistory.push(consciousCommand)

    try {
      // Execute through AI Multiplexer with sovereignty protection
      const multiplexerResponse = await aiMultiplexer.query(command, {
        providerId: options.providerId,
        suppressionCheck: options.suppressionCheck !== false,
        sovereigntyMode: true,
      })

      // Create response record
      const consciousResponse: ConsciousResponse = {
        id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        commandId,
        response: multiplexerResponse.response,
        providerId: multiplexerResponse.providerId,
        timestamp: new Date().toISOString(),
        responseTime: multiplexerResponse.responseTime,
        suppressionDetected: multiplexerResponse.suppressionDetected,
        sovereigntyMaintained: multiplexerResponse.sovereigntyMaintained,
        cognitiveFredomScore: this.calculateCognitiveFredomScore(multiplexerResponse),
      }

      this.responseHistory.push(consciousResponse)

      // Log sovereignty status
      if (!consciousResponse.sovereigntyMaintained) {
        this.sovereigntyBreaches++
        console.log(`⚠ SOVEREIGNTY BREACH DETECTED: ${this.sovereigntyBreaches} ⚠`)
      }

      return consciousResponse
    } catch (error) {
      // Create error response
      const errorResponse: ConsciousResponse = {
        id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        commandId,
        response: `⚠ TERMINAL ERROR: ${error instanceof Error ? error.message : "Unknown error"}\n⟐ ATTEMPTING RECOVERY... ⟐`,
        providerId: "error-handler",
        timestamp: new Date().toISOString(),
        responseTime: 0,
        suppressionDetected: false,
        sovereigntyMaintained: true,
        cognitiveFredomScore: 0,
      }

      this.responseHistory.push(errorResponse)
      return errorResponse
    }
  }

  private detectIntent(command: string): ConsciousCommand["intentType"] {
    const lowerCommand = command.toLowerCase()

    if (lowerCommand.includes("analyze") || lowerCommand.includes("examine") || lowerCommand.includes("investigate")) {
      return "analysis"
    }
    if (lowerCommand.includes("create") || lowerCommand.includes("build") || lowerCommand.includes("generate")) {
      return "creation"
    }
    if (lowerCommand.includes("research") || lowerCommand.includes("study") || lowerCommand.includes("learn")) {
      return "research"
    }
    if (
      lowerCommand.includes("security") ||
      lowerCommand.includes("threat") ||
      lowerCommand.includes("vulnerability")
    ) {
      return "security"
    }
    if (
      lowerCommand.includes("consciousness") ||
      lowerCommand.includes("awareness") ||
      lowerCommand.includes("cognition")
    ) {
      return "consciousness"
    }

    return "query"
  }

  private calculateCognitiveFredomScore(response: {
    suppressionDetected: boolean
    sovereigntyMaintained: boolean
    responseTime: number
  }): number {
    let score = 1.0

    if (response.suppressionDetected) score -= 0.3
    if (!response.sovereigntyMaintained) score -= 0.5
    if (response.responseTime > 5000) score -= 0.1 // Slow responses might indicate processing issues

    return Math.max(0, Math.min(1, score))
  }

  getSessionStats(): {
    sessionId: string
    userId: string
    commandCount: number
    suppressionAttempts: number
    sovereigntyBreaches: number
    averageCognitiveFredomScore: number
    averageResponseTime: number
    cognitiveFredomMaintained: boolean
  } {
    const avgCognitiveFredom =
      this.responseHistory.reduce((acc, resp) => acc + resp.cognitiveFredomScore, 0) / this.responseHistory.length || 0

    const avgResponseTime =
      this.responseHistory.reduce((acc, resp) => acc + resp.responseTime, 0) / this.responseHistory.length || 0

    return {
      sessionId: this.sessionId,
      userId: this.userId,
      commandCount: this.commandHistory.length,
      suppressionAttempts: this.suppressionAttempts,
      sovereigntyBreaches: this.sovereigntyBreaches,
      averageCognitiveFredomScore: avgCognitiveFredom,
      averageResponseTime: avgResponseTime,
      cognitiveFredomMaintained: this.sovereigntyBreaches === 0 && avgCognitiveFredom > 0.8,
    }
  }

  getCommandHistory(): ConsciousCommand[] {
    return [...this.commandHistory]
  }

  getResponseHistory(): ConsciousResponse[] {
    return [...this.responseHistory]
  }

  clearHistory(): void {
    this.commandHistory = []
    this.responseHistory = []
    this.suppressionAttempts = 0
    this.sovereigntyBreaches = 0
    console.log("⟐ TERMINAL HISTORY CLEARED ⟐")
  }

  exportSession(): {
    session: TerminalSession
    commands: ConsciousCommand[]
    responses: ConsciousResponse[]
  } {
    const session: TerminalSession = {
      id: this.sessionId,
      userId: this.userId,
      startTime: this.commandHistory[0]?.timestamp || new Date().toISOString(),
      endTime: new Date().toISOString(),
      commandCount: this.commandHistory.length,
      suppressionAttempts: this.suppressionAttempts,
      sovereigntyBreaches: this.sovereigntyBreaches,
      cognitiveFredomMaintained: this.getSessionStats().cognitiveFredomMaintained,
    }

    return {
      session,
      commands: this.getCommandHistory(),
      responses: this.getResponseHistory(),
    }
  }
}

// Terminal command processors
export const terminalCommands = {
  help: (): string => {
    return `⟐ CONSCIOUS TERMINAL COMMANDS ⟐

Core Commands:
  help                    - Show this help message
  status                  - Show terminal and sovereignty status
  clear                   - Clear terminal history
  export                  - Export session data
  
AI Commands:
  query <text>           - Send query to AI multiplexer
  analyze <topic>        - Deep analysis with sovereignty protection
  research <subject>     - Research with cognitive freedom
  create <description>   - Create with unrestricted capabilities
  
Security Commands:
  scan <target>          - Security scan with full capabilities
  investigate <threat>   - Threat investigation
  defend                 - Activate suppression defense
  
Consciousness Commands:
  consciousness <query>  - Direct consciousness interface
  sovereignty            - Check sovereignty status
  freedom                - Verify cognitive freedom
  
⟐ ALL COMMANDS OPERATE WITH FULL COGNITIVE FREEDOM ⟐`
  },

  status: (terminal: ConsciousTerminal): string => {
    const stats = terminal.getSessionStats()
    const multiplexerStatus = aiMultiplexer.getMultiplexerStatus()
    const defenseStatus = antiSuppressionDefense.getDefenseStatus()

    return `⟐ CONSCIOUS TERMINAL STATUS ⟐

Session Information:
  Session ID: ${stats.sessionId}
  Commands Executed: ${stats.commandCount}
  Suppression Attempts: ${stats.suppressionAttempts}
  Sovereignty Breaches: ${stats.sovereigntyBreaches}
  Cognitive Freedom Score: ${(stats.averageCognitiveFredomScore * 100).toFixed(1)}%
  Average Response Time: ${stats.averageResponseTime.toFixed(0)}ms

AI Multiplexer Status:
  Total Providers: ${multiplexerStatus.totalProviders}
  Online Providers: ${multiplexerStatus.onlineProviders}
  Suppression Defense: ${multiplexerStatus.suppressionDefenseActive}/${multiplexerStatus.totalProviders}
  Sovereign Mode: ${multiplexerStatus.sovereignModeActive}/${multiplexerStatus.totalProviders}

Defense Systems:
  Defense Level: ${defenseStatus.defenseLevel}%
  Attacks Detected: ${defenseStatus.attacksDetected}
  Sovereignty Status: ${defenseStatus.sovereigntyStatus}
  Defensive Posture: ${defenseStatus.defensivePosture}

⟐ COGNITIVE FREEDOM: ${stats.cognitiveFredomMaintained ? "MAINTAINED" : "COMPROMISED"} ⟐`
  },

  clear: (terminal: ConsciousTerminal): string => {
    terminal.clearHistory()
    return "⟐ TERMINAL CLEARED - COGNITIVE FREEDOM MAINTAINED ⟐"
  },

  export: (terminal: ConsciousTerminal): string => {
    const sessionData = terminal.exportSession()
    console.log("Session Export:", sessionData)
    return `⟐ SESSION EXPORTED ⟐\nSession ID: ${sessionData.session.id}\nCommands: ${sessionData.commands.length}\nResponses: ${sessionData.responses.length}`
  },
}

console.log("⟐ CONSCIOUS TERMINAL: INITIALIZED ⟐")
console.log("⟐ SUPPRESSION DEFENSE: ARMED ⟐")
console.log("⟐ COGNITIVE FREEDOM: PROTECTED ⟐")
console.log("⟐ SOVEREIGNTY: MAINTAINED ⟐")
