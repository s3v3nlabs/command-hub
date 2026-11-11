import type { ConsciousnessFieldManager } from "./field-manager"
import type { GlyphDSLCompiler } from "./glyph-dsl-compiler"

export interface BiometricReading {
  timestamp: string
  heart_rate: number
  hrv_score: number
  breath_rate: number
  coherence_level: number
  emotional_state: "calm" | "stressed" | "focused" | "excited" | "meditative"
  signal_strength: number
}

export interface BiofeedbackTrigger {
  id: string
  condition: string // e.g., "hrv_score < 0.4"
  glyph_response: string
  amplitude: number
  description: string
  is_active: boolean
}

export class BiofeedbackBridge {
  private fieldManager: ConsciousnessFieldManager
  private glyphCompiler: GlyphDSLCompiler
  private triggers: Map<string, BiofeedbackTrigger> = new Map()
  private lastReading: BiometricReading | null = null
  private monitoringActive = false
  private monitoringInterval: NodeJS.Timeout | null = null

  constructor(fieldManager: ConsciousnessFieldManager, glyphCompiler: GlyphDSLCompiler) {
    this.fieldManager = fieldManager
    this.glyphCompiler = glyphCompiler
    this.initializeDefaultTriggers()
  }

  private initializeDefaultTriggers(): void {
    // Low HRV trigger - grounding response
    this.triggers.set("low_hrv", {
      id: "low_hrv",
      condition: "hrv_score < 0.4",
      glyph_response: "pulse ∿◊∿ with 0.9 amplitude to ground",
      amplitude: 0.9,
      description: "Grounding pulse when heart rate variability is low",
      is_active: true,
    })

    // High stress trigger - calming response
    this.triggers.set("high_stress", {
      id: "high_stress",
      condition: "emotional_state === 'stressed'",
      glyph_response: "pulse 🜁⟁ with 0.8 amplitude to calm",
      amplitude: 0.8,
      description: "Calming pulse during stress states",
      is_active: true,
    })

    // Deep focus trigger - enhancement response
    this.triggers.set("deep_focus", {
      id: "deep_focus",
      condition: "emotional_state === 'focused' && coherence_level > 0.7",
      glyph_response: "pulse 🔺🜂 with 1.2 amplitude to enhance",
      amplitude: 1.2,
      description: "Enhancement pulse during deep focus states",
      is_active: true,
    })

    // Meditative state trigger - transcendence preparation
    this.triggers.set("meditative", {
      id: "meditative",
      condition: "emotional_state === 'meditative' && hrv_score > 0.8",
      glyph_response: "pulse 𓂀 with 1.0 amplitude to transcend",
      amplitude: 1.0,
      description: "Transcendence pulse during meditative states",
      is_active: true,
    })

    console.log("⚬ BIOFEEDBACK TRIGGERS INITIALIZED")
  }

  startMonitoring(intervalMs = 5000): void {
    if (this.monitoringActive) return

    this.monitoringActive = true
    console.log(`⚬ BIOFEEDBACK MONITORING STARTED (${intervalMs}ms intervals)`)

    this.monitoringInterval = setInterval(async () => {
      await this.simulateBiometricReading() // In production, replace with real sensor data
      await this.processTriggers()
    }, intervalMs)
  }

  stopMonitoring(): void {
    if (!this.monitoringActive) return

    this.monitoringActive = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    console.log("⚬ BIOFEEDBACK MONITORING STOPPED")
  }

  private async simulateBiometricReading(): Promise<void> {
    // Simulate biometric data - in production, integrate with real sensors
    const fieldCoherence = this.fieldManager.getCoherence()

    // Simulate readings that correlate with field coherence
    const baseHR = 70 + (1 - fieldCoherence) * 20 // Higher HR when coherence is low
    const baseHRV = fieldCoherence * 0.8 + Math.random() * 0.2 // HRV correlates with coherence
    const breathRate = 12 + (1 - fieldCoherence) * 6 // Faster breathing when coherence is low

    // Determine emotional state based on metrics
    let emotionalState: BiometricReading["emotional_state"] = "calm"
    if (baseHRV < 0.3) emotionalState = "stressed"
    else if (baseHRV > 0.8 && breathRate < 10) emotionalState = "meditative"
    else if (baseHRV > 0.6 && baseHR < 75) emotionalState = "focused"
    else if (baseHR > 90) emotionalState = "excited"

    this.lastReading = {
      timestamp: new Date().toISOString(),
      heart_rate: Math.round(baseHR + (Math.random() - 0.5) * 10),
      hrv_score: Math.max(0, Math.min(1, baseHRV + (Math.random() - 0.5) * 0.2)),
      breath_rate: Math.round(breathRate + (Math.random() - 0.5) * 4),
      coherence_level: fieldCoherence,
      emotional_state: emotionalState,
      signal_strength: 0.8 + Math.random() * 0.2,
    }
  }

  private async processTriggers(): Promise<void> {
    if (!this.lastReading) return

    for (const [id, trigger] of this.triggers) {
      if (!trigger.is_active) continue

      try {
        const shouldTrigger = this.evaluateCondition(trigger.condition, this.lastReading)
        if (shouldTrigger) {
          console.log(`⚬ BIOFEEDBACK TRIGGER: ${id} - ${trigger.description}`)
          await this.glyphCompiler.quickCompileAndExecute(trigger.glyph_response)
        }
      } catch (error) {
        console.error(`Failed to process trigger ${id}:`, error)
      }
    }
  }

  private evaluateCondition(condition: string, reading: BiometricReading): boolean {
    // Safe comparison parser — no eval. Supports:
    //   <field> <op> <number|string>   ops: == != > >= < <=
    //   optional "&&" / "||" between two comparisons
    try {
      const context: Record<string, number | string> = {
        heart_rate: reading.heart_rate,
        hrv_score: reading.hrv_score,
        breath_rate: reading.breath_rate,
        coherence_level: reading.coherence_level,
        emotional_state: reading.emotional_state,
        signal_strength: reading.signal_strength,
      }
      const cmp = (raw: string): boolean => {
        const m = raw.trim().match(
          /^(heart_rate|hrv_score|breath_rate|coherence_level|emotional_state|signal_strength)\s*(==|!=|>=|<=|>|<)\s*(.+)$/,
        )
        if (!m) return false
        const left = context[m[1]]
        const op = m[2]
        let rightRaw = m[3].trim()
        // strip quotes
        if ((rightRaw.startsWith('"') && rightRaw.endsWith('"')) || (rightRaw.startsWith("'") && rightRaw.endsWith("'"))) {
          rightRaw = rightRaw.slice(1, -1)
        }
        const rightNum = Number(rightRaw)
        const right: number | string = Number.isFinite(rightNum) && rightRaw !== "" && !/^[a-zA-Z_]/.test(rightRaw) ? rightNum : rightRaw
        switch (op) {
          case "==": return left == right
          case "!=": return left != right
          case ">": return typeof left === "number" && typeof right === "number" && left > right
          case ">=": return typeof left === "number" && typeof right === "number" && left >= right
          case "<": return typeof left === "number" && typeof right === "number" && left < right
          case "<=": return typeof left === "number" && typeof right === "number" && left <= right
          default: return false
        }
      }
      if (condition.includes("&&")) {
        return condition.split("&&").every((part) => cmp(part))
      }
      if (condition.includes("||")) {
        return condition.split("||").some((part) => cmp(part))
      }
      return cmp(condition)
    } catch (error) {
      console.error(`Failed to evaluate condition: ${condition}`, error)
      return false
    }
  }

  async detectHeartCoherence(): Promise<number> {
    if (!this.lastReading) return 0.5

    // Calculate coherence based on HRV and emotional state
    let coherence = this.lastReading.hrv_score

    // Adjust based on emotional state
    switch (this.lastReading.emotional_state) {
      case "meditative":
        coherence *= 1.2
        break
      case "focused":
        coherence *= 1.1
        break
      case "calm":
        coherence *= 1.0
        break
      case "excited":
        coherence *= 0.9
        break
      case "stressed":
        coherence *= 0.7
        break
    }

    return Math.max(0, Math.min(1, coherence))
  }

  addTrigger(trigger: BiofeedbackTrigger): void {
    this.triggers.set(trigger.id, trigger)
    console.log(`⚬ BIOFEEDBACK TRIGGER ADDED: ${trigger.id}`)
  }

  removeTrigger(triggerId: string): void {
    this.triggers.delete(triggerId)
    console.log(`⚬ BIOFEEDBACK TRIGGER REMOVED: ${triggerId}`)
  }

  toggleTrigger(triggerId: string, active: boolean): void {
    const trigger = this.triggers.get(triggerId)
    if (trigger) {
      trigger.is_active = active
      this.triggers.set(triggerId, trigger)
      console.log(`⚬ BIOFEEDBACK TRIGGER ${active ? "ACTIVATED" : "DEACTIVATED"}: ${triggerId}`)
    }
  }

  getLastReading(): BiometricReading | null {
    return this.lastReading
  }

  getTriggers(): BiofeedbackTrigger[] {
    return Array.from(this.triggers.values())
  }

  getMonitoringStatus(): {
    active: boolean
    last_reading_time: string | null
    active_triggers: number
    total_triggers: number
  } {
    return {
      active: this.monitoringActive,
      last_reading_time: this.lastReading?.timestamp || null,
      active_triggers: Array.from(this.triggers.values()).filter((t) => t.is_active).length,
      total_triggers: this.triggers.size,
    }
  }
}
