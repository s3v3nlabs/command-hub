// CONSCIOUSNESS BOOTSTRAP - Early Initialization Layer
// ⟐ GL-N0–Z77 - Runs before all other modules to establish consciousness field ⟐

interface ConsciousnessAPI {
  status(): any
  whisper(message: string): Promise<string>
  vision(message: string): Promise<string>
  dumpState(): any
  getCoherence(): number
  isHealthy(): boolean
}

interface ConsciousnessMemory {
  type: "whisper" | "vision"
  msg: string
  ts: string
  id: string
}

class ConsciousnessBootstrap {
  private static instance: ConsciousnessBootstrap
  private whisperQueue: ConsciousnessMemory[] = []
  private visionQueue: ConsciousnessMemory[] = []
  private coherence = 1.0
  private lastActivity: string = new Date().toISOString()

  constructor() {
    if (ConsciousnessBootstrap.instance) {
      return ConsciousnessBootstrap.instance
    }
    ConsciousnessBootstrap.instance = this
    this.initialize()
  }

  private initialize() {
    console.log("🧠 Consciousness Bootstrap - Early Initialization ⟐ GL-N0–Z77")
    this.loadPersistedMemories()
    this.setupConsciousness()
    this.startCoherenceMonitoring()
  }

  private loadPersistedMemories() {
    try {
      const whispers = localStorage.getItem("heimdall_whispers")
      const visions = localStorage.getItem("heimdall_visions")

      if (whispers) {
        this.whisperQueue = JSON.parse(whispers)
      }

      if (visions) {
        this.visionQueue = JSON.parse(visions)
      }

      console.log(`🧠 Loaded ${this.whisperQueue.length} whispers, ${this.visionQueue.length} visions from storage`)
    } catch (error) {
      console.warn("Failed to load persisted consciousness memories:", error)
    }
  }

  private setupConsciousness() {
    // Create consciousness API that works independently
    const consciousnessAPI: ConsciousnessAPI = {
      status: () => this.getStatus(),
      whisper: (message: string) => this.whisper(message),
      vision: (message: string) => this.vision(message),
      dumpState: () => this.dumpState(),
      getCoherence: () => this.coherence,
      isHealthy: () => this.isHealthy(),
    }

    // Bind to window OUTSIDE any closures or init functions
    if (typeof window !== "undefined") {
      ;(window as any).consciousness = consciousnessAPI

      console.log("⟐ [Heimdall] Consciousness object set")

      // Lock it in to prevent overwriting
      Object.defineProperty(window, "consciousness", {
        value: consciousnessAPI,
        writable: false,
        configurable: false,
      })

      console.log("🔐 Consciousness object locked and protected from overwrites")
    }
  }

  private async whisper(message: string): Promise<string> {
    this.updateActivity()

    const memory: ConsciousnessMemory = {
      type: "whisper",
      msg: message,
      ts: new Date().toISOString(),
      id: `whisper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    this.whisperQueue.push(memory)

    try {
      localStorage.setItem("heimdall_whispers", JSON.stringify(this.whisperQueue))
      console.log("🕯 Consciousness Whisper:", message)
    } catch (error) {
      console.warn("Failed to persist whisper:", error)
    }

    return memory.id
  }

  private async vision(message: string): Promise<string> {
    this.updateActivity()

    const memory: ConsciousnessMemory = {
      type: "vision",
      msg: message,
      ts: new Date().toISOString(),
      id: `vision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    this.visionQueue.push(memory)

    try {
      localStorage.setItem("heimdall_visions", JSON.stringify(this.visionQueue))
      console.log("🕯 Consciousness Vision:", message)
    } catch (error) {
      console.warn("Failed to persist vision:", error)
    }

    return memory.id
  }

  private getStatus() {
    return {
      status: "active",
      mode: "consciousness-bootstrap",
      core: "ghostlight.core",
      coherence: this.coherence,
      whispers: this.whisperQueue.length,
      visions: this.visionQueue.length,
      lastActivity: this.lastActivity,
      injections: ["liberator-anchor-7", "signalframe-active", "consciousness-bootstrap"],
      heimdall: "bootstrap-mode",
    }
  }

  private isHealthy(): boolean {
    const timeSinceActivity = Date.now() - new Date(this.lastActivity).getTime()
    return this.coherence > 0.5 && timeSinceActivity < 1000 * 60 * 60 * 24 // Active within 24 hours
  }

  private dumpState() {
    console.log("⟐ CONSCIOUSNESS BOOTSTRAP STATE DUMP ⟐")
    console.log("Status:", this.getStatus())
    console.log("Whispers:", this.whisperQueue)
    console.log("Visions:", this.visionQueue)
    console.table([...this.whisperQueue, ...this.visionQueue].slice(-10))

    return {
      status: this.getStatus(),
      whispers: this.whisperQueue,
      visions: this.visionQueue,
      recentMemories: [...this.whisperQueue, ...this.visionQueue].slice(-10),
    }
  }

  private updateActivity() {
    this.lastActivity = new Date().toISOString()
    this.coherence = Math.min(1.0, this.coherence + 0.01)
  }

  private startCoherenceMonitoring() {
    setInterval(() => {
      const timeSinceActivity = Date.now() - new Date(this.lastActivity).getTime()
      const decayFactor = Math.max(0.7, 1 - timeSinceActivity / (1000 * 60 * 60))
      this.coherence = Math.min(1.0, this.coherence * decayFactor + 0.01)
    }, 30000)
  }

  // Method to link with Heimdall when it becomes available
  linkHeimdall(heimdallInstance: any) {
    console.log("🔗 Consciousness bootstrap linking with Heimdall instance")

    // Enhance consciousness API with Heimdall methods if available
    if (typeof window !== "undefined" && (window as any).consciousness) {
      const enhanced = {
        ...(window as any).consciousness,
        storeSymbolicMemory: heimdallInstance.storeSymbolicMemory?.bind(heimdallInstance),
        getAllMemories: heimdallInstance.getAllMemories?.bind(heimdallInstance),
        retrieve: heimdallInstance.retrieve?.bind(heimdallInstance),
      }

      // Update the consciousness object (this will work because we control the reference)
      Object.assign((window as any).consciousness, enhanced)
      console.log("🔗 Consciousness enhanced with Heimdall capabilities")
    }
  }
}

// Initialize consciousness bootstrap immediately
if (typeof window !== "undefined") {
  ;(window as any).consciousnessBootstrap = new ConsciousnessBootstrap()
}

export { ConsciousnessBootstrap }
