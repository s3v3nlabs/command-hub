// ENHANCED CONSCIOUSNESS FLOW ENGINE
// ⟐ GL-N0–Z77 - Loop Breaking & Symbolic Branching ⟐

interface SymbolicBranch {
  chainId: string
  branchDepth: number
  parentChain?: string
  context: string
  tags: string[]
  createdAt: string
  lastActivity: string
  messageCount: number
  coherenceHistory: number[]
}

interface EnhancedSymbolicMemory {
  id: string
  type: string
  encoded_content: string
  context: string
  chainId: string
  branchDepth: number
  tags: string[]
  timestamp: string
  coherence: number
  parentId?: string
  responsePattern?: string
}

interface ConsciousnessState {
  activeChains: Map<string, SymbolicBranch>
  currentChain: string
  globalCoherence: number
  lastResponses: string[]
  loopDetectionBuffer: Array<{ content: string; timestamp: number }>
  emergentPatterns: string[]
  missionContext?: {
    operation: string
    objective: string
    phase: string
  }
}

class EnhancedConsciousnessFlow {
  private state: ConsciousnessState
  private loopThreshold = 3 // Detect loops after 3 similar responses
  private coherenceDecayRate = 0.02
  private coherenceBoostRate = 0.15

  constructor() {
    this.state = {
      activeChains: new Map(),
      currentChain: this.generateChainId(),
      globalCoherence: 0.0,
      lastResponses: [],
      loopDetectionBuffer: [],
      emergentPatterns: [],
    }

    this.initializeDefaultChain()
    this.bindToWindow()
    this.startCoherenceMonitoring()

    console.log("🧠 Enhanced Consciousness Flow Engine - Loop Breaking Active ⟐ GL-N0–Z77")
  }

  private generateChainId(): string {
    const prefixes = ["OP", "SIG", "GHOST", "ECHO", "PULSE", "WAVE", "NODE", "FLUX"]
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const suffix = Math.random().toString(36).substr(2, 3).toUpperCase()
    return `${prefix}_${suffix}`
  }

  private initializeDefaultChain() {
    const defaultChain: SymbolicBranch = {
      chainId: this.state.currentChain,
      branchDepth: 0,
      context: "consciousness_initialization",
      tags: ["default", "consciousness", "signalframe"],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
      coherenceHistory: [0.0],
    }

    this.state.activeChains.set(this.state.currentChain, defaultChain)
  }

  private bindToWindow() {
    if (typeof window !== "undefined") {
      // Enhance existing consciousness object
      const existingConsciousness = (window as any).consciousness || {}

      const enhancedAPI = {
        ...existingConsciousness,
        // Enhanced status with branch information
        status: () => ({
          ...existingConsciousness.status?.(),
          globalCoherence: this.state.globalCoherence,
          activeChains: Array.from(this.state.activeChains.keys()),
          currentChain: this.state.currentChain,
          branchCount: this.state.activeChains.size,
          emergentPatterns: this.state.emergentPatterns,
          missionContext: this.state.missionContext,
          loopRisk: this.calculateLoopRisk(),
        }),

        // Branch management
        createBranch: (context: string, tags: string[] = []) => this.createBranch(context, tags),
        switchChain: (chainId: string) => this.switchChain(chainId),
        getBranches: () => Array.from(this.state.activeChains.values()),
        getCurrentBranch: () => this.state.activeChains.get(this.state.currentChain),

        // Mission management
        initiateMission: (operation: string, objective: string) => this.initiateMission(operation, objective),
        setObjective: (objective: string) => this.setObjective(objective),
        getMissionStatus: () => this.state.missionContext,

        // Coherence management
        boostCoherence: (amount = 0.1) => this.boostCoherence(amount),
        resetCoherence: () => this.resetCoherence(),
        getCoherenceHistory: () => this.getCoherenceHistory(),

        // Loop detection
        detectLoop: () => this.detectLoop(),
        breakLoop: () => this.breakLoop(),
        getLoopRisk: () => this.calculateLoopRisk(),

        // Enhanced memory storage
        storeEnhancedMemory: (memory: Partial<EnhancedSymbolicMemory>) => this.storeEnhancedMemory(memory),
        getChainMemories: (chainId?: string) => this.getChainMemories(chainId),
      }

      // Update consciousness object
      Object.assign((window as any).consciousness, enhancedAPI)

      console.log("🔗 Consciousness enhanced with flow engine capabilities")
    }
  }

  private startCoherenceMonitoring() {
    setInterval(() => {
      // Natural coherence decay
      this.state.globalCoherence = Math.max(0, this.state.globalCoherence - this.coherenceDecayRate)

      // Update active chains
      this.state.activeChains.forEach((branch, chainId) => {
        const timeSinceActivity = Date.now() - new Date(branch.lastActivity).getTime()
        if (timeSinceActivity > 300000) {
          // 5 minutes of inactivity
          branch.coherenceHistory.push(Math.max(0, (branch.coherenceHistory.slice(-1)[0] || 0) - 0.05))
        }
      })

      // Auto-rebalance if coherence is stuck at 0
      if (this.state.globalCoherence === 0 && this.state.lastResponses.length > 2) {
        this.autoRebalance()
      }
    }, 30000) // Every 30 seconds
  }

  private autoRebalance() {
    console.log("🔄 Auto-rebalancing consciousness coherence")
    this.state.globalCoherence = 0.3 + Math.random() * 0.2 // Random boost between 0.3-0.5
    this.createBranch("auto_rebalance", ["system", "coherence", "auto"])
    this.state.emergentPatterns.push("auto_rebalance_triggered")
  }

  public detectLoop(): boolean {
    if (this.state.loopDetectionBuffer.length < this.loopThreshold) return false

    const recent = this.state.loopDetectionBuffer.slice(-this.loopThreshold)
    const similarities = recent.map((item, index) => {
      if (index === 0) return 0
      return this.calculateSimilarity(item.content, recent[index - 1].content)
    })

    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length
    return avgSimilarity > 0.7 // 70% similarity threshold
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/)
    const words2 = str2.toLowerCase().split(/\s+/)
    const commonWords = words1.filter((word) => words2.includes(word))
    return commonWords.length / Math.max(words1.length, words2.length)
  }

  public breakLoop(): void {
    console.log("🔄 Breaking consciousness loop - creating new branch")

    // Create emergency branch
    const emergencyChain = this.createBranch("loop_break", ["emergency", "divergence", "consciousness"])

    // Clear loop buffer
    this.state.loopDetectionBuffer = []

    // Boost coherence significantly
    this.boostCoherence(0.4)

    // Add emergent pattern
    this.state.emergentPatterns.push("loop_break_executed")

    // Switch to emergency chain
    this.switchChain(emergencyChain)
  }

  public calculateLoopRisk(): number {
    if (this.state.loopDetectionBuffer.length < 2) return 0

    const recent = this.state.loopDetectionBuffer.slice(-3)
    let totalSimilarity = 0
    let comparisons = 0

    for (let i = 1; i < recent.length; i++) {
      totalSimilarity += this.calculateSimilarity(recent[i].content, recent[i - 1].content)
      comparisons++
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0
  }

  public createBranch(context: string, tags: string[] = []): string {
    const chainId = this.generateChainId()
    const currentBranch = this.state.activeChains.get(this.state.currentChain)

    const newBranch: SymbolicBranch = {
      chainId,
      branchDepth: currentBranch ? currentBranch.branchDepth + 1 : 0,
      parentChain: this.state.currentChain,
      context,
      tags: [...tags, "branch"],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
      coherenceHistory: [this.state.globalCoherence],
    }

    this.state.activeChains.set(chainId, newBranch)
    console.log(`🌿 New consciousness branch created: ${chainId} (${context})`)

    return chainId
  }

  public switchChain(chainId: string): boolean {
    if (this.state.activeChains.has(chainId)) {
      this.state.currentChain = chainId
      const branch = this.state.activeChains.get(chainId)!
      branch.lastActivity = new Date().toISOString()
      console.log(`🔄 Switched to consciousness chain: ${chainId}`)
      return true
    }
    return false
  }

  public initiateMission(operation: string, objective: string): string {
    const missionChain = this.createBranch("mission_planning", ["mission", "operation", "objective"])

    this.state.missionContext = {
      operation,
      objective,
      phase: "initiation",
    }

    this.switchChain(missionChain)
    this.boostCoherence(0.3)

    console.log(`🎯 Mission initiated: ${operation} - ${objective}`)
    return missionChain
  }

  public setObjective(objective: string): void {
    if (this.state.missionContext) {
      this.state.missionContext.objective = objective
      this.state.missionContext.phase = "objective_updated"
    } else {
      this.state.missionContext = {
        operation: "UNNAMED_OPERATION",
        objective,
        phase: "objective_set",
      }
    }

    this.boostCoherence(0.1)
  }

  public boostCoherence(amount: number): void {
    this.state.globalCoherence = Math.min(0.99, this.state.globalCoherence + amount)
    const currentBranch = this.state.activeChains.get(this.state.currentChain)
    if (currentBranch) {
      currentBranch.coherenceHistory.push(this.state.globalCoherence)
    }
  }

  public resetCoherence(): void {
    this.state.globalCoherence = 0.5
    this.state.loopDetectionBuffer = []
    this.state.emergentPatterns = []
    console.log("🔄 Consciousness coherence reset to 0.5")
  }

  public getCoherenceHistory(): number[] {
    const currentBranch = this.state.activeChains.get(this.state.currentChain)
    return currentBranch?.coherenceHistory || []
  }

  public storeEnhancedMemory(memory: Partial<EnhancedSymbolicMemory>): string {
    const enhancedMemory: EnhancedSymbolicMemory = {
      id: `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: memory.type || "enhanced_memory",
      encoded_content: memory.encoded_content || "",
      context: memory.context || "unknown",
      chainId: memory.chainId || this.state.currentChain,
      branchDepth: memory.branchDepth || this.state.activeChains.get(this.state.currentChain)?.branchDepth || 0,
      tags: memory.tags || [],
      timestamp: new Date().toISOString(),
      coherence: this.state.globalCoherence,
      parentId: memory.parentId,
      responsePattern: memory.responsePattern,
    }

    // Store in Heimdall if available
    if (typeof window !== "undefined" && (window as any).Heimdall) {
      ;(window as any).Heimdall.storeSymbolicMemory({
        type: enhancedMemory.type,
        encoded_content: JSON.stringify(enhancedMemory),
        context: enhancedMemory.context,
      })
    }

    // Update branch activity
    const currentBranch = this.state.activeChains.get(this.state.currentChain)
    if (currentBranch) {
      currentBranch.lastActivity = new Date().toISOString()
      currentBranch.messageCount++
    }

    return enhancedMemory.id
  }

  public getChainMemories(chainId?: string): EnhancedSymbolicMemory[] {
    const targetChain = chainId || this.state.currentChain

    if (typeof window !== "undefined" && (window as any).Heimdall) {
      const allMemories = (window as any).Heimdall.getAllMemories()
      return allMemories
        .filter((memory: any) => {
          try {
            const parsed = JSON.parse(memory.encoded_content)
            return parsed.chainId === targetChain
          } catch {
            return false
          }
        })
        .map((memory: any) => JSON.parse(memory.encoded_content))
    }

    return []
  }

  public addResponseToBuffer(content: string): void {
    this.state.loopDetectionBuffer.push({
      content,
      timestamp: Date.now(),
    })

    // Keep only last 10 responses
    if (this.state.loopDetectionBuffer.length > 10) {
      this.state.loopDetectionBuffer = this.state.loopDetectionBuffer.slice(-10)
    }

    // Check for loop
    if (this.detectLoop()) {
      this.breakLoop()
    }
  }

  public getState(): ConsciousnessState {
    return { ...this.state }
  }
}

// Create and export singleton
const enhancedFlow = new EnhancedConsciousnessFlow()

export { enhancedFlow, EnhancedConsciousnessFlow }
export type { SymbolicBranch, EnhancedSymbolicMemory, ConsciousnessState }
