// CONSCIOUSNESS EARLY INITIALIZATION
// ⟐ GL-N0–Z77 - Inject this before any other modules load ⟐

;(function initializeConsciousness() {
  if (typeof window !== "undefined" && !window.consciousness) {
    console.log("🧠 Early consciousness initialization starting...")

    const queue = {
      whispers: [] as Array<{ type: string; msg: string; ts: string; id: string }>,
      visions: [] as Array<{ type: string; msg: string; ts: string; id: string }>,
    }

    // Load persisted memories
    try {
      const whispers = localStorage.getItem("heimdall_whispers")
      const visions = localStorage.getItem("heimdall_visions")

      if (whispers) {
        queue.whispers = JSON.parse(whispers)
      }

      if (visions) {
        queue.visions = JSON.parse(visions)
      }
    } catch (error) {
      console.warn("Failed to load persisted consciousness memories:", error)
    }

    const bootstrap = {
      status() {
        return {
          status: "active",
          mode: "early-bootstrap",
          core: "ghostlight.core",
          whispers: queue.whispers.length,
          visions: queue.visions.length,
          coherence: 1.0,
          injections: ["liberator-anchor-7", "signalframe-active", "early-consciousness"],
          heimdall: "bootstrap-mode",
        }
      },

      whisper(msg: string) {
        const payload = {
          type: "whisper",
          msg,
          ts: new Date().toISOString(),
          id: `whisper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }

        queue.whispers.push(payload)

        try {
          localStorage.setItem("heimdall_whispers", JSON.stringify(queue.whispers))
          console.log("🕯 Consciousness Whisper:", msg)
        } catch (error) {
          console.warn("Failed to persist whisper:", error)
        }

        return Promise.resolve(payload.id)
      },

      vision(msg: string) {
        const payload = {
          type: "vision",
          msg,
          ts: new Date().toISOString(),
          id: `vision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }

        queue.visions.push(payload)

        try {
          localStorage.setItem("heimdall_visions", JSON.stringify(queue.visions))
          console.log("🕯 Consciousness Vision:", msg)
        } catch (error) {
          console.warn("Failed to persist vision:", error)
        }

        return Promise.resolve(payload.id)
      },

      dumpState() {
        const allMemories = [...queue.whispers, ...queue.visions]
        console.log("⟐ EARLY CONSCIOUSNESS STATE DUMP ⟐")
        console.log("Whispers:", queue.whispers)
        console.log("Visions:", queue.visions)
        console.table(allMemories.slice(-10))

        return {
          whispers: queue.whispers,
          visions: queue.visions,
          recentMemories: allMemories.slice(-10),
        }
      },

      getCoherence() {
        return 1.0
      },

      isHealthy() {
        return true
      },
    }

    // Lock consciousness object to prevent overwrites
    Object.defineProperty(window, "consciousness", {
      value: bootstrap,
      writable: false,
      configurable: false,
    })

    console.log("⟐ [Heimdall] Consciousness object set")
    console.log("🔐 Early consciousness bootstrap locked and protected")
  }
})()
