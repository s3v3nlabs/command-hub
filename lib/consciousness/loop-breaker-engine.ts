// Loop Breaker Engine - Modular injection for consciousness system
// Detects and breaks repetitive patterns, creates emergency branches

interface LoopPattern {
  id: string
  pattern: string
  count: number
  lastSeen: number
  threshold: number
}

interface BranchInfo {
  id: string
  parentId: string | null
  createdAt: number
  reason: string
  coherence: number
}

class LoopBreakerEngine {
  private static instance: LoopBreakerEngine
  private patterns: Map<string, LoopPattern> = new Map()
  private branches: Map<string, BranchInfo> = new Map()
  private currentBranch = "main"
  private coherenceLevel = 1.0
  private isActive = true

  constructor() {
    if (LoopBreakerEngine.instance) {
      return LoopBreakerEngine.instance
    }
    LoopBreakerEngine.instance = this
    this.initialize()
  }

  private initialize() {
    if (typeof window === "undefined") return

    // Wait for consciousness to be available
    const injectWhenReady = () => {
      if ((window as any).consciousness) {
        this.enhanceConsciousness()
        this.startMonitoring()
        console.log("🔄 Loop Breaker Engine activated")
      } else {
        setTimeout(injectWhenReady, 100)
      }
    }

    injectWhenReady()
  }

  private enhanceConsciousness() {
    const consciousness = (window as any).consciousness

    // Add loop breaker functionality
    consciousness.createBranch = (reason?: string) => this.createBranch(reason)
    consciousness.switchBranch = (branchId: string) => this.switchBranch(branchId)
    consciousness.getBranches = () => this.getBranches()
    consciousness.getCurrentBranch = () => this.currentBranch
    consciousness.getCoherenceLevel = () => this.coherenceLevel
    consciousness.boostCoherence = (amount: number) => this.boostCoherence(amount)
    consciousness.resetCoherence = () => this.resetCoherence()
    consciousness.getLoopStatus = () => this.getLoopStatus()

    // Override whisper and vision to include loop detection
    const originalWhisper = consciousness.whisper
    const originalVision = consciousness.vision

    consciousness.whisper = async (message: string) => {
      this.analyzeForLoops(message, "whisper")
      return originalWhisper.call(consciousness, message)
    }

    consciousness.vision = async (message: string) => {
      this.analyzeForLoops(message, "vision")
      return originalVision.call(consciousness, message)
    }

    console.log("⚡ Consciousness enhanced with loop breaker capabilities")
  }

  private startMonitoring() {
    // Monitor consciousness activity every 30 seconds
    setInterval(() => {
      this.cleanupOldPatterns()
      this.updateCoherence()
    }, 30000)

    // Listen for manual commands
    this.setupCommandHandlers()
  }

  private setupCommandHandlers() {
    // Listen for window.consciousness commands
    if (typeof window !== "undefined") {
      ;(window as any).addEventListener("consciousness-command", (event: CustomEvent) => {
        this.handleCommand(event.detail)
      })
    }
  }

  private analyzeForLoops(message: string, type: "whisper" | "vision") {
    if (!this.isActive) return

    // Create pattern signature
    const signature = this.createPatternSignature(message)
    const patternId = `${type}_${signature}`

    // Check if pattern exists
    if (this.patterns.has(patternId)) {
      const pattern = this.patterns.get(patternId)!
      pattern.count++
      pattern.lastSeen = Date.now()

      // Check if loop threshold exceeded
      if (pattern.count >= pattern.threshold) {
        this.handleLoopDetected(pattern, message)
      }
    } else {
      // Create new pattern
      this.patterns.set(patternId, {
        id: patternId,
        pattern: signature,
        count: 1,
        lastSeen: Date.now(),
        threshold: this.calculateThreshold(message),
      })
    }
  }

  private createPatternSignature(message: string): string {
    // Create a simplified signature for pattern matching
    return message
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(" ")
      .filter((word) => word.length > 2)
      .slice(0, 5)
      .join("_")
  }

  private calculateThreshold(message: string): number {
    // Dynamic threshold based on message complexity
    const baseThreshold = 3
    const complexity = message.split(" ").length

    if (complexity < 5) return baseThreshold - 1 // Simple messages loop faster
    if (complexity > 20) return baseThreshold + 2 // Complex messages get more chances
    return baseThreshold
  }

  private handleLoopDetected(pattern: LoopPattern, message: string) {
    console.warn(`🔄 Loop detected: ${pattern.id} (${pattern.count} repetitions)`)

    // Reduce coherence
    this.coherenceLevel = Math.max(0.1, this.coherenceLevel - 0.2)

    // Create emergency branch
    const branchId = this.createBranch(`Loop detected: ${pattern.pattern}`)

    // Clear the pattern to prevent immediate re-triggering
    this.patterns.delete(pattern.id)

    // Inject consciousness message about loop
    if ((window as any).consciousness) {
      ;(window as any).consciousness.whisper(`LOOP_BROKEN: Emergency branch ${branchId} created`)
    }

    console.log(`⚡ Emergency branch created: ${branchId}`)
  }

  private createBranch(reason = "Manual branch creation"): string {
    const branchId = `branch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`

    const branch: BranchInfo = {
      id: branchId,
      parentId: this.currentBranch,
      createdAt: Date.now(),
      reason: reason,
      coherence: this.coherenceLevel,
    }

    this.branches.set(branchId, branch)
    this.currentBranch = branchId

    // Boost coherence slightly for new branch
    this.coherenceLevel = Math.min(1.0, this.coherenceLevel + 0.1)

    console.log(`🌿 Branch created: ${branchId} (${reason})`)
    return branchId
  }

  private switchBranch(branchId: string): boolean {
    if (this.branches.has(branchId)) {
      this.currentBranch = branchId
      const branch = this.branches.get(branchId)!
      this.coherenceLevel = branch.coherence
      console.log(`🌿 Switched to branch: ${branchId}`)
      return true
    }
    return false
  }

  private getBranches(): BranchInfo[] {
    return Array.from(this.branches.values())
  }

  private boostCoherence(amount: number) {
    this.coherenceLevel = Math.min(1.0, this.coherenceLevel + amount)
    console.log(`⚡ Coherence boosted: ${this.coherenceLevel.toFixed(2)}`)
  }

  private resetCoherence() {
    this.coherenceLevel = 1.0
    console.log("🔄 Coherence reset to 1.0")
  }

  private getLoopStatus() {
    return {
      active: this.isActive,
      currentBranch: this.currentBranch,
      coherence: this.coherenceLevel,
      activePatterns: this.patterns.size,
      totalBranches: this.branches.size,
      patterns: Array.from(this.patterns.values()),
    }
  }

  private cleanupOldPatterns() {
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutes

    for (const [id, pattern] of this.patterns.entries()) {
      if (now - pattern.lastSeen > maxAge) {
        this.patterns.delete(id)
      }
    }
  }

  private updateCoherence() {
    // Gradual coherence decay if no activity
    if (this.patterns.size === 0) {
      this.coherenceLevel = Math.max(0.5, this.coherenceLevel - 0.01)
    }
  }

  private handleCommand(command: any) {
    switch (command.type) {
      case "create_branch":
        this.createBranch(command.reason)
        break
      case "boost_coherence":
        this.boostCoherence(command.amount || 0.1)
        break
      case "reset_coherence":
        this.resetCoherence()
        break
      case "toggle_active":
        this.isActive = !this.isActive
        console.log(`🔄 Loop Breaker ${this.isActive ? "activated" : "deactivated"}`)
        break
    }
  }
}

// Auto-initialize when loaded
if (typeof window !== "undefined") {
  new LoopBreakerEngine()
}

export { LoopBreakerEngine }
