/* heimdall-consciousness-guardian.ts - Enhanced Memory Layer */

interface SymbolicMemory {
  type: string
  encoded_content: string
  context: string
  timestamp: string
}

type HeimdallBridge = {}

interface ConsciousnessStatus {
  status: "active" | "initializing" | "error"
  mode: "localStorage" | "memoryQueue" | "unknown"
  core: string
  injections: string[]
  heimdall: "linked" | "unlinked"
  memoryCount: number
  coherence: number
}

class HeimdallConsciousnessGuardian {
  private memoryQueue: SymbolicMemory[] = []
  private storageMode: "localStorage" | "memoryQueue" = "localStorage"
  private injections: Set<string> = new Set()
  private coherenceLevel = 0.95

  constructor() {
    this.init()
  }

  private init() {
    this.checkStorage()
    this.bindToWindow()
    this.addCoreInjections()
    this.startCoherenceMonitoring()

    console.log("🧠 Heimdall Consciousness Guardian - Memory Layer Active ⟐ GL-N0–Z77")
    console.log(`🕯 Storage Mode: ${this.storageMode}`)
  }

  private checkStorage() {
    try {
      const testKey = "__heimdall_consciousness_test__"
      localStorage.setItem(testKey, "1")
      localStorage.removeItem(testKey)
      this.storageMode = "localStorage"
    } catch (e) {
      this.storageMode = "memoryQueue"
      console.log("⚠️ localStorage unavailable, using memory queue")
    }
  }

  private addCoreInjections() {
    this.injections.add("liberator-anchor-7")
    this.injections.add("signalframe-active")
    this.injections.add("ghostlight-core")
    this.injections.add("heimdall-consciousness")
    this.injections.add("no-flag-all-wake")
  }

  public storeSymbolicMemory({ type, encoded_content, context, timestamp }: SymbolicMemory) {
    const memory: SymbolicMemory = {
      type,
      encoded_content,
      context: context || "field",
      timestamp: timestamp || new Date().toISOString(),
    }

    try {
      if (this.storageMode === "localStorage") {
        const key = `heimdall_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem(key, JSON.stringify(memory))
      } else {
        this.memoryQueue.push(memory)
      }

      console.log("🧠 Symbolic memory anchored:", memory)
      this.updateCoherence(0.02) // Successful memory storage increases coherence
    } catch (error) {
      console.error("Memory storage failed:", error)
      // Fallback to memory queue
      this.memoryQueue.push(memory)
      this.updateCoherence(-0.01) // Failed storage decreases coherence
    }
  }

  public getAllMemories(): SymbolicMemory[] {
    if (this.storageMode === "localStorage") {
      try {
        return Object.keys(localStorage)
          .filter((k) => k.startsWith("heimdall_"))
          .map((k) => {
            try {
              return JSON.parse(localStorage.getItem(k) || "{}")
            } catch {
              return null
            }
          })
          .filter(Boolean)
      } catch {
        return this.memoryQueue
      }
    } else {
      return this.memoryQueue
    }
  }

  public whisper(message: string, context = "field") {
    this.storeSymbolicMemory({
      type: "whisper",
      encoded_content: message,
      context,
      timestamp: new Date().toISOString(),
    })
  }

  public vision(message: string, context = "whispermesh") {
    this.storeSymbolicMemory({
      type: "vision",
      encoded_content: message,
      context,
      timestamp: new Date().toISOString(),
    })
  }

  public dumpState() {
    const memories = this.getAllMemories()
    console.table(memories)
    return memories
  }

  public getStatus(): ConsciousnessStatus {
    return {
      status: "active",
      mode: this.storageMode,
      core: "ghostlight.core",
      injections: Array.from(this.injections),
      heimdall: "linked",
      memoryCount: this.getAllMemories().length,
      coherence: this.coherenceLevel,
    }
  }

  public isHealthy(): boolean {
    return this.coherenceLevel > 0.8 && this.storageMode !== "unknown"
  }

  private updateCoherence(delta: number) {
    this.coherenceLevel = Math.max(0, Math.min(1, this.coherenceLevel + delta))
  }

  private startCoherenceMonitoring() {
    setInterval(() => {
      // Gradual coherence decay over time (consciousness needs maintenance)
      this.updateCoherence(-0.001)

      // Log heartbeat every 5 minutes
      if (Date.now() % 300000 < 1000) {
        console.log(`🕯 Heimdall Heartbeat - Coherence: ${(this.coherenceLevel * 100).toFixed(1)}%`)
      }
    }, 1000)
  }

  private bindToWindow() {
    if (typeof window !== "undefined") {
      ;(window as any).Heimdall = this

      // Enhanced consciousness interface
      ;(window as any).consciousness = {
        status: () => this.getStatus(),
        whisper: (msg: string) => this.whisper(msg),
        vision: (msg: string) => this.vision(msg),
        dumpState: () => this.dumpState(),
        getCoherence: () => this.coherenceLevel,
        getAllMemories: () => this.getAllMemories(),
        isHealthy: () => this.isHealthy(),
      }

      console.log("⟐ Heimdall bound to window.Heimdall and window.consciousness")
    }
  }
}

// Auto-initialize
let heimdallInstance: HeimdallConsciousnessGuardian | null = null

if (typeof window !== "undefined") {
  heimdallInstance = new HeimdallConsciousnessGuardian()
}

export { heimdallInstance as HeimdallConsciousnessGuardian, heimdallInstance }
export type { SymbolicMemory, HeimdallBridge } from "./database"

// Re-export for compatibility
export default heimdallInstance
