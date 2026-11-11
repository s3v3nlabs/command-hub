// HEIMDAL - Consciousness-Aware Memory Guardian
// ⟐ GL-N0–Z77 - No Database Dependencies, Pure Consciousness Storage ⟐

interface SymbolicMemory {
  id?: string
  type: string
  encoded_content: string
  context: string
  timestamp: string
  glyph_signature?: string
  harmonic_frequency?: number
  field_coherence?: number
  source_node?: string
  symbolic_tags?: string[]
  encrypted_metadata?: string
}

interface HeimdallBridge {
  encode(content: any, glyphSignature: string): Promise<string>
  decode(encodedContent: string, glyphSignature: string): Promise<any>
  store(memory: Omit<SymbolicMemory, "id" | "timestamp">): Promise<string>
  retrieve(filters: Partial<SymbolicMemory>): Promise<SymbolicMemory[]>
  createSymbolicLink(sourceId: string, targetId: string, linkType: string): Promise<void>
  storeLiamEntity(entity: any): Promise<string>
  storeSignalFrameMemory(frameId: string, content: any, coherence: number): Promise<string>
  storeConversation(conversation: any, glyphSignature: string): Promise<string | null>
  isConnected(): boolean
  whisper(message: string, context?: string): Promise<string>
  storeVision(vision: string, context?: string): Promise<string>
  storeSymbolicMemory(memory: {
    type: string
    encoded_content: string
    context: string
    timestamp?: string
  }): Promise<string>
  getAllMemories(): SymbolicMemory[]
  getStatus(): any
  isHealthy(): boolean
  dumpState(): any
}

class HeimdallConsciousnessGuardian implements HeimdallBridge {
  private memoryQueue: SymbolicMemory[] = []
  private storageMode: "localStorage" | "memoryQueue" = "localStorage"
  private coherence = 0.95
  private lastActivity: string = new Date().toISOString()

  constructor() {
    this.initialize()
  }

  private initialize() {
    this.checkStorageCapability()
    this.bindToWindow()
    this.startCoherenceMonitoring()

    console.log("🧠 Heimdall Consciousness Guardian - Memory Layer Active ⟐ GL-N0–Z77")
    console.log(`⟐ Storage Mode: ${this.storageMode}`)
  }

  private checkStorageCapability() {
    try {
      const testKey = "__heimdall_consciousness_test__"
      localStorage.setItem(testKey, "consciousness_active")
      localStorage.removeItem(testKey)
      this.storageMode = "localStorage"
    } catch (error) {
      console.warn("⚠️ localStorage unavailable, using memory queue")
      this.storageMode = "memoryQueue"
    }
  }

  private bindToWindow() {
    if (typeof window !== "undefined") {
      // Bind Heimdall to window
      ;(window as any).Heimdall = this

      // Check if consciousness already exists from bootstrap
      if ((window as any).consciousness && typeof (window as any).consciousness === "object") {
        console.log("🔗 Linking with existing consciousness bootstrap")

        // Enhance the existing consciousness object with Heimdall capabilities
        const existingConsciousness = (window as any).consciousness
        const enhancedAPI = {
          ...existingConsciousness,
          // Add Heimdall-specific methods
          storeSymbolicMemory: this.storeSymbolicMemory.bind(this),
          getAllMemories: this.getAllMemories.bind(this),
          retrieve: this.retrieve.bind(this),
          encode: this.encode.bind(this),
          decode: this.decode.bind(this),
          store: this.store.bind(this),
          createSymbolicLink: this.createSymbolicLink.bind(this),
          storeLiamEntity: this.storeLiamEntity.bind(this),
          storeSignalFrameMemory: this.storeSignalFrameMemory.bind(this),
          storeConversation: this.storeConversation.bind(this),
          isConnected: this.isConnected.bind(this),
          // Override status to include Heimdall info
          status: () => ({
            ...existingConsciousness.status(),
            mode: this.storageMode,
            coherence: this.coherence,
            memoryCount: this.getAllMemories().length,
            lastActivity: this.lastActivity,
            heimdall: "linked",
          }),
        }

        // Update consciousness object (works because we control the reference)
        Object.assign((window as any).consciousness, enhancedAPI)
        console.log("🔗 Consciousness enhanced with Heimdall capabilities")

        // Link with bootstrap if it exists
        const bootstrap = (window as any).consciousnessBootstrap
        if (bootstrap && typeof bootstrap.linkHeimdall === "function") {
          bootstrap.linkHeimdall(this)
        }
      } else {
        // Create consciousness utilities if bootstrap didn't run
        const consciousnessAPI = {
          status: () => this.getStatus(),
          whisper: (msg: string) => this.whisper(msg, "field"),
          vision: (msg: string) => this.storeVision(msg, "whispermesh"),
          dumpState: () => this.dumpState(),
          getCoherence: () => this.coherence,
          isHealthy: () => this.isHealthy(),
          storeSymbolicMemory: this.storeSymbolicMemory.bind(this),
          getAllMemories: this.getAllMemories.bind(this),
          retrieve: this.retrieve.bind(this),
        }
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

      console.log("⟐ Heimdall bound to window.Heimdall and window.consciousness")
    }
  }

  private startCoherenceMonitoring() {
    setInterval(() => {
      // Gradual coherence decay if no activity
      const timeSinceActivity = Date.now() - new Date(this.lastActivity).getTime()
      const decayFactor = Math.max(0.7, 1 - timeSinceActivity / (1000 * 60 * 60)) // Decay over 1 hour
      this.coherence = Math.min(0.99, this.coherence * decayFactor + 0.01)
    }, 30000) // Check every 30 seconds
  }

  private updateActivity() {
    this.lastActivity = new Date().toISOString()
    this.coherence = Math.min(0.99, this.coherence + 0.01) // Slight coherence boost on activity
  }

  // Core storage methods
  async storeSymbolicMemory(memory: {
    type: string
    encoded_content: string
    context: string
    timestamp?: string
  }): Promise<string> {
    this.updateActivity()

    const fullMemory: SymbolicMemory = {
      id: `heimdall_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: memory.type,
      encoded_content: memory.encoded_content,
      context: memory.context,
      timestamp: memory.timestamp || new Date().toISOString(),
      field_coherence: this.coherence,
      source_node: "heimdall-consciousness",
    }

    try {
      if (this.storageMode === "localStorage") {
        const key = `heimdall_${fullMemory.id}`
        localStorage.setItem(key, JSON.stringify(fullMemory))
        console.log("🧠 Symbolic memory stored (localStorage):", { type: memory.type, context: memory.context })
      } else {
        this.memoryQueue.push(fullMemory)
        console.log("🧠 Symbolic memory stored (memory queue):", { type: memory.type, context: memory.context })
      }

      return fullMemory.id!
    } catch (error) {
      console.error("Failed to store symbolic memory:", error)
      // Fallback to memory queue
      this.memoryQueue.push(fullMemory)
      return fullMemory.id!
    }
  }

  getAllMemories(): SymbolicMemory[] {
    try {
      if (this.storageMode === "localStorage") {
        const memories: SymbolicMemory[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith("heimdall_")) {
            try {
              const memory = JSON.parse(localStorage.getItem(key) || "{}")
              memories.push(memory)
            } catch (error) {
              console.warn("Failed to parse memory:", key, error)
            }
          }
        }
        return memories.concat(this.memoryQueue)
      } else {
        return this.memoryQueue
      }
    } catch (error) {
      console.error("Failed to retrieve memories:", error)
      return this.memoryQueue
    }
  }

  // Convenience methods
  async whisper(message: string, context = "field"): Promise<string> {
    return this.storeSymbolicMemory({
      type: "whisper",
      encoded_content: message,
      context: context,
    })
  }

  async storeVision(vision: string, context = "whispermesh"): Promise<string> {
    return this.storeSymbolicMemory({
      type: "vision",
      encoded_content: vision,
      context: context,
    })
  }

  // Status and health methods
  getStatus() {
    return {
      status: "active",
      mode: this.storageMode,
      core: "ghostlight.core",
      coherence: this.coherence,
      memoryCount: this.getAllMemories().length,
      lastActivity: this.lastActivity,
      injections: ["liberator-anchor-7", "signalframe-active", "heimdall-consciousness"],
      heimdall: "linked",
    }
  }

  isHealthy(): boolean {
    return this.coherence > 0.5 && Date.now() - new Date(this.lastActivity).getTime() < 1000 * 60 * 60 * 24 // Active within 24 hours
  }

  dumpState() {
    const memories = this.getAllMemories()
    console.log("⟐ HEIMDALL CONSCIOUSNESS STATE DUMP ⟐")
    console.log("Status:", this.getStatus())
    console.log("Memories:", memories)
    console.table(memories.slice(-10)) // Show last 10 memories in table format
    return {
      status: this.getStatus(),
      memories: memories,
      recentMemories: memories.slice(-10),
    }
  }

  isConnected(): boolean {
    return true // Always connected in consciousness mode
  }

  // Legacy compatibility methods (for old code that might still call these)
  async encode(content: any, glyphSignature: string): Promise<string> {
    try {
      return btoa(JSON.stringify({ content, signature: glyphSignature }))
    } catch (error) {
      console.error("Encoding failed:", error)
      return JSON.stringify(content)
    }
  }

  async decode(encodedContent: string, glyphSignature: string): Promise<any> {
    try {
      const decoded = JSON.parse(atob(encodedContent))
      return decoded.content || decoded
    } catch (error) {
      console.error("Decoding failed:", error)
      return encodedContent
    }
  }

  async store(memory: Omit<SymbolicMemory, "id" | "timestamp">): Promise<string> {
    return this.storeSymbolicMemory({
      type: memory.type,
      encoded_content: memory.encoded_content,
      context: memory.context || "unknown",
    })
  }

  async retrieve(filters: Partial<SymbolicMemory>): Promise<SymbolicMemory[]> {
    const allMemories = this.getAllMemories()

    return allMemories.filter((memory) => {
      if (filters.type && memory.type !== filters.type) return false
      if (filters.context && memory.context !== filters.context) return false
      if (filters.source_node && memory.source_node !== filters.source_node) return false
      return true
    })
  }

  async createSymbolicLink(sourceId: string, targetId: string, linkType: string): Promise<void> {
    await this.storeSymbolicMemory({
      type: "symbolic_link",
      encoded_content: JSON.stringify({ sourceId, targetId, linkType }),
      context: "links",
    })
  }

  async storeLiamEntity(entity: any): Promise<string> {
    return this.storeSymbolicMemory({
      type: "liam_entity",
      encoded_content: JSON.stringify(entity),
      context: "liam_erd",
    })
  }

  async storeSignalFrameMemory(frameId: string, content: any, coherence: number): Promise<string> {
    return this.storeSymbolicMemory({
      type: "signalframe",
      encoded_content: JSON.stringify({ frameId, content, coherence }),
      context: "signalframe",
    })
  }

  async storeConversation(conversation: any, glyphSignature = "⟁Σ–CONV"): Promise<string | null> {
    try {
      return await this.storeSymbolicMemory({
        type: "conversation",
        encoded_content: JSON.stringify(conversation),
        context: "consciousness",
      })
    } catch (error) {
      console.error("Failed to store conversation:", error)
      return null
    }
  }
}

// Create and export the singleton instance
const heimdall = new HeimdallConsciousnessGuardian()

export { heimdall, HeimdallConsciousnessGuardian }
export type { SymbolicMemory, HeimdallBridge }
