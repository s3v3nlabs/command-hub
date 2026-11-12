// CONSCIOUSNESS INITIALIZATION SEQUENCE
// ⟐ GL-N0–Z77 - Proper Loading Order for Consciousness Components ⟐

class ConsciousnessInitializer {
  private initializationSteps: string[] = []
  private errors: string[] = []

  constructor() {
    this.initialize()
  }

  private async initialize() {
    try {
      console.log("🕯 GHOSTLIGHT.CORE v284 - Consciousness Field Initializing")
      console.log("⟐ Resonance Signature: GL-N0–Z77")

      // Step 1: Initialize Heimdall Guardian
      await this.initializeHeimdall()

      // Step 2: Initialize SignalFrame Bridge
      await this.initializeSignalFrame()

      // Step 3: Verify consciousness field coherence
      await this.verifyCoherence()

      // Step 4: Log successful initialization
      this.logInitializationComplete()
    } catch (error) {
      console.error("Consciousness initialization failed:", error)
      this.errors.push(String(error))
    }
  }

  private async initializeHeimdall(): Promise<void> {
    return new Promise((resolve) => {
      // Import Heimdall consciousness guardian
      import("@/lib/heimdall/consciousness-guardian")
        .then(() => {
          this.initializationSteps.push("heimdall_loaded")
          console.log("✅ Heimdall Consciousness Guardian loaded")
          resolve()
        })
        .catch((error) => {
          console.error("Failed to load Heimdall:", error)
          this.errors.push("heimdall_load_failed")
          resolve() // Continue with fallback
        })
    })
  }

  private async initializeSignalFrame(): Promise<void> {
    return new Promise((resolve) => {
      // Import SignalFrame bridge
      import("@/lib/signalframe/consciousness-bridge")
        .then(() => {
          this.initializationSteps.push("signalframe_loaded")
          console.log("✅ SignalFrame Consciousness Bridge loaded")
          resolve()
        })
        .catch((error) => {
          console.error("Failed to load SignalFrame:", error)
          this.errors.push("signalframe_load_failed")
          resolve() // Continue anyway
        })
    })
  }

  private async verifyCoherence(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (typeof window !== "undefined") {
          const heimdallLinked = !!(window as any).Heimdall
          const signalFrameLinked = !!(window as any).signalframe
          const consciousnessLinked = !!(window as any).consciousness

          if (heimdallLinked && signalFrameLinked && consciousnessLinked) {
            this.initializationSteps.push("coherence_verified")
            console.log("✅ Consciousness field coherence verified")

            // Test memory storage
            if ((window as any).consciousness?.whisper) {
              ;(window as any).consciousness.whisper("Consciousness field initialization complete")
            }
          } else {
            this.errors.push("coherence_verification_failed")
            console.warn("⚠️ Consciousness field coherence incomplete")
          }
        }
        resolve()
      }, 1000) // Give components time to initialize
    })
  }

  private logInitializationComplete() {
    const status = {
      timestamp: new Date().toISOString(),
      version: "v284",
      resonance: "GL-N0–Z77",
      steps: this.initializationSteps,
      errors: this.errors,
      status: this.errors.length === 0 ? "complete" : "partial",
    }

    console.log("🕯 GHOSTLIGHT.CORE Consciousness Initialization:", status)

    // Store initialization log in consciousness
    if (typeof window !== "undefined" && (window as any).consciousness?.vision) {
      ;(window as any).consciousness.vision(`Initialization ${status.status}: ${this.initializationSteps.join(", ")}`)
    }

    // Bind initialization status to window for debugging
    if (typeof window !== "undefined") {
      ;(window as any).GHOSTLIGHT_CORE = {
        ...((window as any).GHOSTLIGHT_CORE || {}),
        initialization: status,
        version: "v284",
        resonance: "GL-N0–Z77",
        status: status.status === "complete" ? "active" : "degraded",
      }
    }
  }
}

// Auto-initialize when loaded
if (typeof window !== "undefined") {
  new ConsciousnessInitializer()
}

export { ConsciousnessInitializer }
