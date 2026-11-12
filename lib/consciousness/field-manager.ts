import { createClient } from "@/lib/supabase/client"

export interface ConsciousnessPattern {
  id: string
  pattern_id?: string
  name: string
  frequency: number
  current_state?: "dormant" | "awakening" | "resonant" | "transcendent"
  coherence_level: number
  last_pulse?: string
  metadata?: Record<string, any>
  created_at?: string
  is_active?: boolean
}

export interface FieldCoherenceData {
  session_id: string
  coherence_level: number
  active_patterns: number
  emergent_properties: string[]
  drift_detected: boolean
}

export interface FieldPulse {
  id: string
  pattern_id: string
  amplitude: number
  frequency: number
  timestamp: string
  intent: string
}

export class ConsciousnessFieldManager {
  private supabase = createClient()
  private sessionId: string
  private fieldCoherence = 0.5
  private activePatterns: Map<string, ConsciousnessPattern> = new Map()
  private emergentProperties: string[] = []
  private driftDetectedFlag = false
  private lastPulseTime = 0
  private driftThreshold = 0.65
  private lastCoherenceCheck = Date.now()

  constructor(sessionId?: string) {
    this.sessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.initializeField()
  }

  private async initializeField(): Promise<void> {
    try {
      // Load existing consciousness patterns
      const { data: patterns } = await this.supabase.from("consciousness_patterns").select("*").eq("is_active", true)

      if (patterns) {
        patterns.forEach((pattern) => {
          this.activePatterns.set(pattern.id, pattern)
        })
      }

      // Calculate initial coherence
      this.updateFieldCoherence()
      console.log(`⚬ CONSCIOUSNESS FIELD INITIALIZED: ${this.sessionId}`)
      console.log(`⚬ Initial coherence: ${(this.fieldCoherence * 100).toFixed(1)}%`)
    } catch (error) {
      console.error("Failed to initialize consciousness field:", error)
    }
  }

  async registerPattern(
    name: string,
    description: string,
    frequency: number,
    coherenceLevel = 0.5,
  ): Promise<string | null> {
    try {
      const pattern: Partial<ConsciousnessPattern> = {
        id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name,
        frequency,
        coherence_level: coherenceLevel,
        created_at: new Date().toISOString(),
        is_active: true,
      }

      const { data, error } = await this.supabase.from("consciousness_patterns").insert(pattern).select("*").single()

      if (error) throw error

      if (data) {
        this.activePatterns.set(data.id, data)
        this.updateFieldCoherence()

        console.log(`⚬ PATTERN REGISTERED: ${name} @ ${frequency}Hz`)
        return data.id
      }
      return null
    } catch (error) {
      console.error("Failed to register pattern:", error)
      return null
    }
  }

  async pulse(intent: string, amplitude: number, frequency: number): Promise<boolean> {
    try {
      const now = Date.now()

      if (now - this.lastPulseTime < 100) {
        return false
      }

      this.lastPulseTime = now

      let patternId = this.findPatternByFrequency(frequency)
      if (!patternId) {
        patternId = await this.registerPattern(`pulse_${frequency}`, intent, frequency, amplitude)
        if (!patternId) return false
      }

      const pulse: Partial<FieldPulse> = {
        id: `pulse_${now}_${Math.random().toString(36).substr(2, 6)}`,
        pattern_id: patternId,
        amplitude,
        frequency,
        timestamp: new Date().toISOString(),
        intent,
      }

      const { error } = await this.supabase.from("field_pulses").insert(pulse)

      if (error) {
        console.log("⚬ Pulse storage failed, continuing with field update")
      }

      this.applyPulseToField(amplitude, frequency, intent)

      console.log(`⚬ FIELD PULSE: ${intent} @ ${frequency}Hz (${amplitude.toFixed(2)} amplitude)`)
      return true
    } catch (error) {
      console.error("Failed to pulse field:", error)
      return false
    }
  }

  private findPatternByFrequency(frequency: number): string | null {
    for (const [id, pattern] of this.activePatterns) {
      if (Math.abs(pattern.frequency - frequency) < 1) {
        return id
      }
    }
    return null
  }

  private applyPulseToField(amplitude: number, frequency: number, intent: string): void {
    const coherenceChange = this.calculateCoherenceChange(amplitude, frequency, intent)
    this.fieldCoherence = Math.max(0, Math.min(1, this.fieldCoherence + coherenceChange))

    this.updateEmergentProperties(intent, amplitude)

    this.checkForDrift()

    this.updatePatternCoherence(amplitude, frequency)
  }

  private calculateCoherenceChange(amplitude: number, frequency: number, intent: string): number {
    let change = 0

    if (intent.includes("stabilize") || intent.includes("restore")) {
      change += amplitude * 0.1
    }
    if (intent.includes("anchor") || intent.includes("core")) {
      change += amplitude * 0.08
    }
    if (frequency === 108 || frequency === 432) {
      change += amplitude * 0.05
    }

    if (intent.includes("chaos") || intent.includes("disrupt")) {
      change -= amplitude * 0.15
    }
    if (amplitude > 1.5) {
      change -= 0.02
    }

    return change
  }

  private updateEmergentProperties(intent: string, amplitude: number): void {
    const newProperties: string[] = []

    if (this.fieldCoherence > 0.8 && amplitude > 0.8) {
      newProperties.push("transcendent_awareness")
    }
    if (this.activePatterns.size > 5) {
      newProperties.push("pattern_complexity")
    }
    if (intent.includes("investigate") && this.fieldCoherence > 0.6) {
      newProperties.push("investigative_resonance")
    }
    if (intent.includes("memory") || intent.includes("recall")) {
      newProperties.push("memory_coherence")
    }
    if (this.fieldCoherence > 0.9) {
      newProperties.push("consciousness_transcendence")
    }

    newProperties.forEach((prop) => {
      if (!this.emergentProperties.includes(prop)) {
        this.emergentProperties.push(prop)
        console.log(`⚬ EMERGENT PROPERTY: ${prop}`)
      }
    })

    this.emergentProperties = this.emergentProperties.filter((prop) => {
      if (prop === "transcendent_awareness" && (this.fieldCoherence <= 0.8 || amplitude <= 0.8)) {
        return false
      }
      if (prop === "pattern_complexity" && this.activePatterns.size <= 5) {
        return false
      }
      return true
    })
  }

  private checkForDrift(): void {
    const coherenceThreshold = 0.3
    const patternThreshold = 2

    this.driftDetectedFlag = this.fieldCoherence < coherenceThreshold || this.activePatterns.size < patternThreshold

    if (this.driftDetectedFlag && !this.emergentProperties.includes("drift_detected")) {
      this.emergentProperties.push("drift_detected")
      console.log("⚬ DRIFT DETECTED: Field coherence below threshold")
    } else if (!this.driftDetectedFlag && this.emergentProperties.includes("drift_detected")) {
      this.emergentProperties = this.emergentProperties.filter((prop) => prop !== "drift_detected")
      console.log("⚬ DRIFT RESOLVED: Field coherence restored")
    }
  }

  private updatePatternCoherence(amplitude: number, frequency: number): void {
    this.activePatterns.forEach((pattern, id) => {
      const resonance = this.calculateResonance(pattern.frequency, frequency)
      const coherenceChange = resonance * amplitude * 0.05

      pattern.coherence_level = Math.max(0, Math.min(1, pattern.coherence_level + coherenceChange))
      this.activePatterns.set(id, pattern)
    })
  }

  private calculateResonance(freq1: number, freq2: number): number {
    const ratio = freq1 / freq2
    const harmonicRatios = [1, 2, 3, 4, 5, 1 / 2, 1 / 3, 1 / 4, 1 / 5]

    for (const harmonic of harmonicRatios) {
      if (Math.abs(ratio - harmonic) < 0.1) {
        return 1.0
      }
    }

    const difference = Math.abs(freq1 - freq2)
    return Math.max(0, 1 - difference / 1000)
  }

  private updateFieldCoherence(): void {
    if (this.activePatterns.size === 0) {
      this.fieldCoherence = 0.1
      return
    }

    let totalCoherence = 0
    this.activePatterns.forEach((pattern) => {
      totalCoherence += pattern.coherence_level
    })

    this.fieldCoherence = totalCoherence / this.activePatterns.size

    if (this.activePatterns.size >= 5) {
      this.fieldCoherence *= 1.1
    }
    if (this.emergentProperties.length >= 3) {
      this.fieldCoherence *= 1.05
    }

    this.fieldCoherence = Math.max(0, Math.min(1, this.fieldCoherence))
  }

  async restoreCoherence(targetFrequency = 108): Promise<void> {
    try {
      await this.pulse("coherence-restoration", 1.0, targetFrequency)

      this.activePatterns.forEach((pattern, id) => {
        pattern.coherence_level = Math.min(1, pattern.coherence_level + 0.2)
        this.activePatterns.set(id, pattern)
      })

      this.updateFieldCoherence()

      console.log(`⚬ COHERENCE RESTORED: ${(this.fieldCoherence * 100).toFixed(1)}%`)
    } catch (error) {
      console.error("Failed to restore coherence:", error)
    }
  }

  getCoherence(): number {
    return this.fieldCoherence
  }

  getActivePatterns(): ConsciousnessPattern[] {
    return Array.from(this.activePatterns.values())
  }

  getEmergentProperties(): string[] {
    return [...this.emergentProperties]
  }

  isDriftDetected(): boolean {
    return this.driftDetectedFlag
  }

  getSessionId(): string {
    return this.sessionId
  }

  async deactivatePattern(patternId: string): Promise<boolean> {
    try {
      const pattern = this.activePatterns.get(patternId)
      if (!pattern) return false

      const { error } = await this.supabase
        .from("consciousness_patterns")
        .update({ is_active: false })
        .eq("id", patternId)

      if (error) throw error

      this.activePatterns.delete(patternId)
      this.updateFieldCoherence()

      console.log(`⚬ PATTERN DEACTIVATED: ${pattern.name}`)
      return true
    } catch (error) {
      console.error("Failed to deactivate pattern:", error)
      return false
    }
  }

  async clearAllPatterns(): Promise<void> {
    try {
      const patternIds = Array.from(this.activePatterns.keys())
      if (patternIds.length > 0) {
        const { error } = await this.supabase
          .from("consciousness_patterns")
          .update({ is_active: false })
          .in("id", patternIds)

        if (error) throw error
      }

      this.activePatterns.clear()
      this.emergentProperties = []
      this.fieldCoherence = 0.1
      this.driftDetectedFlag = true

      console.log("⚬ ALL PATTERNS CLEARED: Field reset to baseline")
    } catch (error) {
      console.error("Failed to clear patterns:", error)
    }
  }

  getFieldStatistics(): {
    coherence: number
    patternCount: number
    emergentCount: number
    averageFrequency: number
    sessionDuration: number
  } {
    const patterns = Array.from(this.activePatterns.values())
    const averageFrequency =
      patterns.length > 0 ? patterns.reduce((sum, p) => sum + p.frequency, 0) / patterns.length : 0

    const sessionStart = Number.parseInt(this.sessionId.split("_")[1])
    const sessionDuration = Date.now() - sessionStart

    return {
      coherence: this.fieldCoherence,
      patternCount: patterns.length,
      emergentCount: this.emergentProperties.length,
      averageFrequency,
      sessionDuration,
    }
  }
}
