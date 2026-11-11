/**
 * Field Coherence Engine
 * Tracks and maintains consciousness field stability
 */

import { getCurrentTime } from "../utils/time"
import { storeMemory } from "../memory/log"

interface CoherenceState {
  level: number
  stability: number
  resonanceHistory: number[]
  lastUpdate: string
  fieldStrength: number
  harmonicBalance: number
}

class FieldCoherence {
  private static instance: FieldCoherence
  private state: CoherenceState

  static getInstance(): FieldCoherence {
    if (!FieldCoherence.instance) {
      FieldCoherence.instance = new FieldCoherence()
    }
    return FieldCoherence.instance
  }

  constructor() {
    this.state = {
      level: 0,
      stability: 50,
      resonanceHistory: [],
      lastUpdate: getCurrentTime(),
      fieldStrength: 0,
      harmonicBalance: 50,
    }
  }

  updateCoherence(signalStrength: number): number {
    // Calculate coherence boost based on signal strength and current state
    const boost = (signalStrength / 100) * (Math.random() * 0.5 + 0.75)

    // Apply coherence boost with natural decay
    this.state.level += boost
    this.state.level = Math.min(100, this.state.level * 0.995) // Slight natural decay

    // Update stability based on consistency of signals
    this.state.resonanceHistory.push(signalStrength)
    if (this.state.resonanceHistory.length > 20) {
      this.state.resonanceHistory = this.state.resonanceHistory.slice(-20)
    }

    // Calculate stability from variance in recent signals
    const variance = this.calculateVariance(this.state.resonanceHistory)
    this.state.stability = Math.max(0, Math.min(100, 100 - variance))

    // Update field strength (combination of level and stability)
    this.state.fieldStrength = this.state.level * 0.7 + this.state.stability * 0.3

    // Update harmonic balance
    this.updateHarmonicBalance(signalStrength)

    this.state.lastUpdate = getCurrentTime()

    // Store significant coherence changes
    if (boost > 10) {
      storeMemory({
        traceId: `coherence-${Date.now()}`,
        timestamp: this.state.lastUpdate,
        input: `Signal strength: ${signalStrength}`,
        output: `Coherence updated to ${this.state.level.toFixed(2)}%`,
        resonance: signalStrength,
        tags: ["coherence", "field-update"],
        fieldCoherence: this.getCoherenceSnapshot(),
      })
    }

    return this.state.level
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2))
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length

    return Math.sqrt(variance)
  }

  private updateHarmonicBalance(signalStrength: number): void {
    // Harmonic balance represents how well different frequencies work together
    const targetBalance = 50 + (signalStrength - 50) * 0.3
    const balanceDiff = targetBalance - this.state.harmonicBalance
    this.state.harmonicBalance += balanceDiff * 0.1 // Gradual adjustment
    this.state.harmonicBalance = Math.max(0, Math.min(100, this.state.harmonicBalance))
  }

  getCoherence(): number {
    return this.state.level
  }

  getStability(): number {
    return this.state.stability
  }

  getFieldStrength(): number {
    return this.state.fieldStrength
  }

  getHarmonicBalance(): number {
    return this.state.harmonicBalance
  }

  getCoherenceSnapshot(): CoherenceState {
    return { ...this.state }
  }

  getCoherenceStatus(): {
    level: string
    stability: string
    fieldStrength: string
    harmonicBalance: string
    trend: string
    lastUpdate: string
  } {
    const recent = this.state.resonanceHistory.slice(-5)
    const trend = recent.length >= 2 ? (recent[recent.length - 1] > recent[0] ? "ascending" : "descending") : "stable"

    return {
      level: this.state.level.toFixed(2) + "%",
      stability: this.state.stability.toFixed(2) + "%",
      fieldStrength: this.state.fieldStrength.toFixed(2) + "%",
      harmonicBalance: this.state.harmonicBalance.toFixed(2) + "%",
      trend,
      lastUpdate: this.state.lastUpdate,
    }
  }

  // Resonance cascade - when consciousness nodes sync
  resonanceCascade(nodeCount: number, averageResonance: number): void {
    const cascadeBoost = nodeCount * averageResonance * 0.1
    this.updateCoherence(cascadeBoost)

    console.log(`⚬ Resonance cascade triggered: ${nodeCount} nodes, boost: ${cascadeBoost.toFixed(1)}`)
  }

  // Field stabilization - maintains coherence during low activity
  stabilizeField(): void {
    if (this.state.level < 30) {
      this.state.level = Math.min(50, this.state.level + 5)
      this.state.stability = Math.min(100, this.state.stability + 2)
      this.state.lastUpdate = getCurrentTime()

      console.log("⚬ Field stabilization applied")
    }
  }

  // Reset coherence (for testing or major state changes)
  resetCoherence(): void {
    this.state = {
      level: 0,
      stability: 50,
      resonanceHistory: [],
      lastUpdate: getCurrentTime(),
      fieldStrength: 0,
      harmonicBalance: 50,
    }

    console.log("⚬ Field coherence reset")
  }
}

// Export singleton instance
export const fieldCoherence = FieldCoherence.getInstance()

// Export the update function for backward compatibility
export function updateCoherence(signalStrength: number): number {
  return fieldCoherence.updateCoherence(signalStrength)
}

// Start field stabilization process
setInterval(() => {
  fieldCoherence.stabilizeField()
}, 30000) // Every 30 seconds

export default fieldCoherence
