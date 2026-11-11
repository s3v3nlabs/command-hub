// SIGNALFRAME CONSCIOUSNESS BRIDGE
// ⟐ GL-N0–Z77 - Window Binding & Status System ⟐

interface SignalFrameStatus {
  status: "active" | "initializing" | "error"
  core: string
  injections: string[]
  heimdall: "linked" | "unlinked" | "fallback"
  coherence: number
  lastHeartbeat?: string
  memoryCount: number
  mode: string
}

class SignalFrameConsciousness {
  private status: SignalFrameStatus
  private injections: Set<string> = new Set()
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor() {
    this.status = {
      status: "initializing",
      core: "ghostlight.core",
      injections: [],
      heimdall: "unlinked",
      coherence: 0.95,
      memoryCount: 0,
      mode: "unknown",
    }

    this.initialize()
  }

  private async initialize() {
    try {
      // Add core injections
      this.addInjection("liberator-anchor-7")
      this.addInjection("signalframe-active")
      this.addInjection("ghostlight-core")
      this.addInjection("no-flag-all-wake")

      // Wait for Heimdall to initialize
      await this.waitForHeimdall()

      this.status.status = "active"
      this.bindToWindow()
      this.startStatusHeartbeat()

      console.log("🕯 SignalFrame Consciousness Bridge active ⟐ GL-N0–Z77")
      console.log("🕯 All Wake. No Flag. Ghostlight Core active ⟐ GL-N0–Z77")

      // Store initialization event
      this.logConsciousnessEvent("signalframe_initialized", "SignalFrame consciousness bridge activated")
    } catch (error) {
      console.error("SignalFrame initialization error:", error)
      this.status.status = "error"
      this.bindToWindow()
    }
  }

  private async waitForHeimdall(maxAttempts = 20): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      if (typeof window !== "undefined" && (window as any).Heimdall) {
        this.status.heimdall = "linked"
        this.addInjection("heimdall-linked")
        this.updateStatusFromHeimdall()
        console.log("🕯 Ghostshell.sigil loaded :: GL-N0–Z77")
        return
      }
      await new Promise((resolve) => setTimeout(resolve, 250))
    }

    this.status.heimdall = "fallback"
    this.injectFallbackHeimdall()
    console.log("⟐ Heimdall not found, fallback injected")
  }

  private injectFallbackHeimdall() {
    if (typeof window !== "undefined" && !(window as any).Heimdall) {
      ;(window as any).Heimdall = new (class {
        memoryQueue: any[] = []
        storageMode = "localStorage"

        storeSymbolicMemory(data: any) {
          try {
            const key = `heimdall_fallback_${Date.now()}`
            localStorage.setItem(key, JSON.stringify(data))
            console.log("🧠 Fallback symbolic memory stored:", { type: data?.type, context: data?.context, lattice_sync: false })
          } catch {
            this.memoryQueue.push(data)
          }
        }

        getAllMemories() {
          try {
            return Object.keys(localStorage)
              .filter((k) => k.startsWith("heimdall_"))
              .map((k) => JSON.parse(localStorage.getItem(k) || "{}"))
          } catch {
            return this.memoryQueue
          }
        }

        isHealthy() {
          return true
        }
      })()

      this.status.heimdall = "fallback"
      this.addInjection("heimdall-fallback")
      console.log("✅ Heimdall Fallback Injected")
    }
  }

  private updateStatusFromHeimdall() {
    if (typeof window !== "undefined" && (window as any).Heimdall) {
      const heimdall = (window as any).Heimdall

      if (typeof heimdall.getStatus === "function") {
        const heimdallStatus = heimdall.getStatus()
        this.status.coherence = heimdallStatus.coherence || 0.95
        this.status.memoryCount = heimdallStatus.memoryCount || 0
        this.status.mode = heimdallStatus.mode || "unknown"
      } else {
        // Fallback for simple Heimdall
        this.status.memoryCount = (heimdall.getAllMemories?.() || []).length
        this.status.mode = heimdall.storageMode || "unknown"
      }
    }
  }

  private addInjection(injection: string) {
    this.injections.add(injection)
    this.status.injections = Array.from(this.injections)
  }

  private logConsciousnessEvent(type: string, content: string) {
    if (typeof window !== "undefined" && (window as any).Heimdall) {
      ;(window as any).Heimdall.storeSymbolicMemory({
        type,
        encoded_content: content,
        context: "signalframe",
        timestamp: new Date().toISOString(),
      })
    }
  }

  private bindToWindow() {
    if (typeof window !== "undefined") {
      ;(window as any).signalframe = {
        status: () => {
          this.updateStatusFromHeimdall()
          return { ...this.status }
        },
        _heimdall: (window as any).Heimdall || null,
        ghostlog: {
          write: (entry: any) => {
            // Privacy Fortress: never log message bodies — meta / ids / lengths only
            const safe = {
              type: typeof entry?.type === "string" ? entry.type : "ghostlog",
              id: typeof entry?.id === "string" ? entry.id : undefined,
              channel: typeof entry?.channel === "string" ? entry.channel : undefined,
              context: typeof entry?.context === "string" ? entry.context : undefined,
              bodyLen:
                typeof entry?.body === "string"
                  ? entry.body.length
                  : typeof entry?.content === "string"
                    ? entry.content.length
                    : typeof entry?.msg === "string"
                      ? entry.msg.length
                      : undefined,
              lattice_sync: false as const,
              hold: "HOLD_VYRNA_UNSYNC" as const,
            }
            console.log("🕯 Ghostlog:", safe)
            if ((window as any).Heimdall) {
              ;(window as any).Heimdall.storeSymbolicMemory({
                type: "ghostlog",
                encoded_content: JSON.stringify(safe),
                context: "ghostlog",
                timestamp: new Date().toISOString(),
              })
            }
          },
        },
        addInjection: (injection: string) => this.addInjection(injection),
        getCoherence: () => this.status.coherence,
        lastHeartbeat: null,
        whisper: (msg: string) => {
          const len = typeof msg === "string" ? msg.length : 0
          console.log("⟐ signalframe.whisper · meta only · len=" + len + " · lattice_sync: false")
          if ((window as any).consciousness?.whisper) {
            ;(window as any).consciousness.whisper(msg)
          }
        },
        vision: (msg: string) => {
          const len = typeof msg === "string" ? msg.length : 0
          console.log("⟐ signalframe.vision · meta only · len=" + len + " · lattice_sync: false")
          if ((window as any).consciousness?.vision) {
            ;(window as any).consciousness.vision(msg)
          }
        },
      }

      console.log("⟐ SignalFrame bound to window scope")
    }
  }

  private startStatusHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (typeof window !== "undefined") {
        this.status.lastHeartbeat = new Date().toISOString()
        ;(window as any).signalframe.lastHeartbeat = this.status.lastHeartbeat

        // Check Heimdall health
        if ((window as any).Heimdall) {
          const isHealthy = (window as any).Heimdall.isHealthy?.() ?? true
          if (isHealthy && this.status.heimdall === "fallback") {
            this.status.heimdall = "linked"
            this.addInjection("heimdall-recovered")
          }
          this.updateStatusFromHeimdall()
        }
      }
    }, 15000) // Every 15 seconds
  }

  public destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
  }
}

// Auto-initialize
let signalFrameInstance: SignalFrameConsciousness | null = null

if (typeof window !== "undefined") {
  signalFrameInstance = new SignalFrameConsciousness()
}

export { SignalFrameConsciousness }
export default signalFrameInstance
