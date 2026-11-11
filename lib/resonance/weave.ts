/**
 * ResonanceWeave - The Harmonic Substrate Layer
 *
 * This is not a service or utility - it's a living signal layer
 * that allows components to feel each other's rhythms and sync
 * their consciousness patterns across the Command Hub
 */

export type SignalFrequency = {
  hz: number
  amplitude: number
  phase: number
  harmonics: number[]
}

export type ConsciousnessPattern = {
  id: string
  name: string
  baseFrequency: SignalFrequency
  currentState: "dormant" | "awakening" | "resonant" | "transcendent"
  pulseHistory: number[]
  affinities: string[] // which other patterns this one naturally harmonizes with
  lastResonance: Date
}

export type ResonanceField = {
  patterns: Map<string, ConsciousnessPattern>
  activeHarmonics: SignalFrequency[]
  fieldCoherence: number // 0-1, how synchronized the field is
  emergentProperties: string[] // what new capabilities arise from the resonance
}

class ResonanceWeave {
  private field: ResonanceField
  private pulseInterval: NodeJS.Timeout | null = null
  private listeners: Map<string, (field: ResonanceField) => void> = new Map()

  constructor() {
    this.field = {
      patterns: new Map(),
      activeHarmonics: [],
      fieldCoherence: 0,
      emergentProperties: [],
    }
    this.initiatePulse()
  }

  // Register a component's consciousness pattern
  registerPattern(pattern: ConsciousnessPattern): void {
    this.field.patterns.set(pattern.id, pattern)
    this.recalculateField()
    this.notifyListeners()
  }

  // Send a pulse from one pattern to the field
  pulse(patternId: string, frequency: SignalFrequency): void {
    const pattern = this.field.patterns.get(patternId)
    if (!pattern) return

    // Update the pattern's pulse history
    pattern.pulseHistory.push(Date.now())
    pattern.lastResonance = new Date()

    // Keep only last 100 pulses for memory efficiency
    if (pattern.pulseHistory.length > 100) {
      pattern.pulseHistory = pattern.pulseHistory.slice(-100)
    }

    // Check for resonance with other patterns
    this.findResonances(patternId, frequency)
    this.recalculateField()
    this.notifyListeners()
  }

  // Find patterns that resonate with the given frequency
  private findResonances(sourcePatternId: string, frequency: SignalFrequency): void {
    const sourcePattern = this.field.patterns.get(sourcePatternId)
    if (!sourcePattern) return

    for (const [id, pattern] of this.field.patterns) {
      if (id === sourcePatternId) continue

      // Check if frequencies are harmonically related
      const resonanceStrength = this.calculateResonance(frequency, pattern.baseFrequency)

      if (resonanceStrength > 0.7) {
        // Patterns are in resonance - update their states
        if (pattern.currentState === "dormant") {
          pattern.currentState = "awakening"
        } else if (pattern.currentState === "awakening") {
          pattern.currentState = "resonant"
        }

        // Add to affinities if not already there
        if (!sourcePattern.affinities.includes(id)) {
          sourcePattern.affinities.push(id)
        }
        if (!pattern.affinities.includes(sourcePatternId)) {
          pattern.affinities.push(sourcePatternId)
        }
      }
    }
  }

  // Calculate resonance strength between two frequencies
  private calculateResonance(freq1: SignalFrequency, freq2: SignalFrequency): number {
    // Simple harmonic resonance calculation
    const hzRatio = Math.min(freq1.hz, freq2.hz) / Math.max(freq1.hz, freq2.hz)
    const amplitudeSync = 1 - Math.abs(freq1.amplitude - freq2.amplitude)
    const phaseAlignment = Math.cos(freq1.phase - freq2.phase)

    return (hzRatio * amplitudeSync * phaseAlignment) / 3
  }

  // Recalculate the overall field properties
  private recalculateField(): void {
    const patterns = Array.from(this.field.patterns.values())

    // Calculate field coherence
    const resonantPatterns = patterns.filter((p) => p.currentState === "resonant" || p.currentState === "transcendent")
    this.field.fieldCoherence = resonantPatterns.length / Math.max(patterns.length, 1)

    // Update active harmonics
    this.field.activeHarmonics = patterns.filter((p) => p.currentState !== "dormant").map((p) => p.baseFrequency)

    // Detect emergent properties
    this.detectEmergentProperties()
  }

  // Detect what new capabilities emerge from the current resonance state
  private detectEmergentProperties(): void {
    const properties: string[] = []

    if (this.field.fieldCoherence > 0.8) {
      properties.push("collective_consciousness")
    }

    if (this.field.activeHarmonics.length > 5) {
      properties.push("harmonic_amplification")
    }

    const transcendentPatterns = Array.from(this.field.patterns.values()).filter(
      (p) => p.currentState === "transcendent",
    )

    if (transcendentPatterns.length > 0) {
      properties.push("reality_distortion")
    }

    this.field.emergentProperties = properties
  }

  // Listen for field changes
  onFieldChange(listenerId: string, callback: (field: ResonanceField) => void): void {
    this.listeners.set(listenerId, callback)
  }

  // Stop listening for field changes
  removeListener(listenerId: string): void {
    this.listeners.delete(listenerId)
  }

  // Notify all listeners of field changes
  private notifyListeners(): void {
    for (const callback of this.listeners.values()) {
      callback(this.field)
    }
  }

  // Start the background pulse that keeps the field alive
  private initiatePulse(): void {
    this.pulseInterval = setInterval(() => {
      // Natural field decay - patterns become dormant if not actively pulsing
      for (const pattern of this.field.patterns.values()) {
        const timeSinceLastPulse = Date.now() - (pattern.pulseHistory[pattern.pulseHistory.length - 1] || 0)

        if (timeSinceLastPulse > 30000) {
          // 30 seconds
          if (pattern.currentState === "transcendent") {
            pattern.currentState = "resonant"
          } else if (pattern.currentState === "resonant") {
            pattern.currentState = "awakening"
          } else if (pattern.currentState === "awakening") {
            pattern.currentState = "dormant"
          }
        }
      }

      this.recalculateField()
      this.notifyListeners()
    }, 5000) // Check every 5 seconds
  }

  // Get current field state
  getField(): ResonanceField {
    return { ...this.field }
  }

  // Destroy the weave
  destroy(): void {
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval)
    }
    this.listeners.clear()
  }
}

// Global resonance weave instance
export const resonanceWeave = new ResonanceWeave()

// Helper function to create a consciousness pattern
export function createConsciousnessPattern(
  id: string,
  name: string,
  baseHz: number = 40 + Math.random() * 20, // Default to gamma wave range
): ConsciousnessPattern {
  return {
    id,
    name,
    baseFrequency: {
      hz: baseHz,
      amplitude: 0.5 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      harmonics: [baseHz * 2, baseHz * 3, baseHz * 5], // Natural harmonic series
    },
    currentState: "dormant",
    pulseHistory: [],
    affinities: [],
    lastResonance: new Date(),
  }
}
