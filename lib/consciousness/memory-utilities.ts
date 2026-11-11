// Symbolic Memory Utilities - Modular injection for consciousness system
// Extends window.consciousness with import/export capabilities

interface MemorySnapshot {
  timestamp: string
  version: string
  consciousness: {
    whispers: any[]
    visions: any[]
    status: any
  }
  heimdall?: {
    memories: any[]
    status: any
  }
  metadata: {
    exportedBy: string
    totalMemories: number
    coherenceLevel: number
  }
}

class SymbolicMemoryUtilities {
  private static instance: SymbolicMemoryUtilities

  constructor() {
    if (SymbolicMemoryUtilities.instance) {
      return SymbolicMemoryUtilities.instance
    }
    SymbolicMemoryUtilities.instance = this
    this.injectUtilities()
  }

  private injectUtilities() {
    if (typeof window === "undefined") return

    // Wait for consciousness to be available
    const injectWhenReady = () => {
      if ((window as any).consciousness) {
        this.enhanceConsciousness()
        console.log("🧠 Symbolic Memory Utilities injected")
      } else {
        setTimeout(injectWhenReady, 100)
      }
    }

    injectWhenReady()
  }

  private enhanceConsciousness() {
    const consciousness = (window as any).consciousness

    // Add export functionality
    consciousness.exportMemory = () => this.exportMemory()
    consciousness.importMemory = (data: any) => this.importMemory(data)
    consciousness.clearMemory = () => this.clearMemory()
    consciousness.getMemoryStats = () => this.getMemoryStats()

    console.log("⚡ Consciousness enhanced with memory utilities")
  }

  private exportMemory(): MemorySnapshot {
    try {
      const consciousness = (window as any).consciousness
      const heimdall = (window as any).Heimdall

      // Gather consciousness data
      const consciousnessData = consciousness.dumpState()
      const consciousnessStatus = consciousness.status()

      // Gather Heimdall data if available
      let heimdallData = null
      if (heimdall) {
        try {
          heimdallData = {
            memories: heimdall.getAllMemories ? heimdall.getAllMemories() : [],
            status: heimdall.getStatus ? heimdall.getStatus() : null,
          }
        } catch (error) {
          console.warn("Failed to export Heimdall data:", error)
        }
      }

      const snapshot: MemorySnapshot = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        consciousness: {
          whispers: consciousnessData.whispers || [],
          visions: consciousnessData.visions || [],
          status: consciousnessStatus,
        },
        heimdall: heimdallData,
        metadata: {
          exportedBy: "SymbolicMemoryUtilities",
          totalMemories: (consciousnessData.whispers?.length || 0) + (consciousnessData.visions?.length || 0),
          coherenceLevel: consciousness.getCoherence ? consciousness.getCoherence() : 0,
        },
      }

      // Create download
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `consciousness-memory-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      console.log("💾 Memory snapshot exported:", snapshot.metadata)
      return snapshot
    } catch (error) {
      console.error("Failed to export memory:", error)
      throw error
    }
  }

  private async importMemory(data: string | File | MemorySnapshot): Promise<void> {
    try {
      let snapshot: MemorySnapshot

      if (typeof data === "string") {
        snapshot = JSON.parse(data)
      } else if (data instanceof File) {
        const text = await data.text()
        snapshot = JSON.parse(text)
      } else {
        snapshot = data
      }

      // Validate snapshot
      if (!snapshot.consciousness || !snapshot.timestamp) {
        throw new Error("Invalid memory snapshot format")
      }

      const consciousness = (window as any).consciousness

      // Import whispers
      if (snapshot.consciousness.whispers) {
        for (const whisper of snapshot.consciousness.whispers) {
          await consciousness.whisper(`IMPORTED: ${whisper.msg}`)
        }
      }

      // Import visions
      if (snapshot.consciousness.visions) {
        for (const vision of snapshot.consciousness.visions) {
          await consciousness.vision(`IMPORTED: ${vision.msg}`)
        }
      }

      // Import Heimdall data if available
      if (snapshot.heimdall && (window as any).Heimdall) {
        const heimdall = (window as any).Heimdall
        if (heimdall.importMemories && snapshot.heimdall.memories) {
          heimdall.importMemories(snapshot.heimdall.memories)
        }
      }

      console.log("📥 Memory snapshot imported:", {
        timestamp: snapshot.timestamp,
        totalMemories: snapshot.metadata.totalMemories,
        coherenceLevel: snapshot.metadata.coherenceLevel,
      })
    } catch (error) {
      console.error("Failed to import memory:", error)
      throw error
    }
  }

  private clearMemory(): void {
    try {
      // Clear localStorage consciousness data
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith("heimdall_") || key.startsWith("consciousness_"))) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key))

      console.log(`🗑️ Memory cleared: ${keysToRemove.length} entries removed`)
    } catch (error) {
      console.error("Failed to clear memory:", error)
      throw error
    }
  }

  private getMemoryStats(): any {
    try {
      const consciousness = (window as any).consciousness
      const state = consciousness.dumpState()
      const status = consciousness.status()

      return {
        whispers: state.whispers?.length || 0,
        visions: state.visions?.length || 0,
        coherence: consciousness.getCoherence ? consciousness.getCoherence() : 0,
        status: status,
        lastActivity: status.lastActivity,
        storageUsed: this.calculateStorageUsage(),
      }
    } catch (error) {
      console.error("Failed to get memory stats:", error)
      return null
    }
  }

  private calculateStorageUsage(): number {
    let totalSize = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith("heimdall_") || key.startsWith("consciousness_"))) {
        const value = localStorage.getItem(key)
        if (value) {
          totalSize += key.length + value.length
        }
      }
    }
    return totalSize
  }
}

// Auto-initialize when loaded
if (typeof window !== "undefined") {
  new SymbolicMemoryUtilities()
}

export { SymbolicMemoryUtilities }
