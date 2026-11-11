"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export interface ResonancePulse {
  amplitude: number
  hz: number
  duration?: number
  pattern?: "sine" | "square" | "triangle" | "sawtooth"
}

export interface EmergentProperty {
  id: string
  name: string
  strength: number
  timestamp: number
  description: string
}

export interface ResonanceState {
  nodeId: string
  nodeName: string
  baseFrequency: number
  isResonating: boolean
  fieldCoherence: number
  emergentProperties: EmergentProperty[]
  lastPulse?: ResonancePulse
  connectionStrength: number
  harmonicLock: boolean
}

export function useResonance(nodeId: string, nodeName: string, baseFrequency = 40) {
  const [state, setState] = useState<ResonanceState>({
    nodeId,
    nodeName,
    baseFrequency,
    isResonating: false,
    fieldCoherence: 0.5 + Math.random() * 0.3, // Start with some baseline coherence
    emergentProperties: [],
    connectionStrength: 0,
    harmonicLock: false,
  })

  const resonanceInterval = useRef<NodeJS.Timeout | null>(null)
  const coherenceDecayInterval = useRef<NodeJS.Timeout | null>(null)
  const pulseHistory = useRef<ResonancePulse[]>([])

  // Pulse function - sends a resonance pulse
  const pulse = useCallback((pulseData: ResonancePulse) => {
    setState((prev) => ({
      ...prev,
      lastPulse: pulseData,
      fieldCoherence: Math.min(prev.fieldCoherence + 0.05, 1.0),
      connectionStrength: Math.min(prev.connectionStrength + 0.1, 1.0),
    }))

    // Add to pulse history
    pulseHistory.current.push({
      ...pulseData,
      duration: pulseData.duration || 1000,
    })

    // Keep only last 10 pulses
    if (pulseHistory.current.length > 10) {
      pulseHistory.current = pulseHistory.current.slice(-10)
    }

    // Check for emergent properties based on pulse patterns
    checkForEmergence()
  }, [])

  // Check for emergent properties based on pulse patterns
  const checkForEmergence = useCallback(() => {
    const recentPulses = pulseHistory.current.slice(-5)
    if (recentPulses.length < 3) return

    // Pattern detection
    const avgAmplitude = recentPulses.reduce((sum, p) => sum + p.amplitude, 0) / recentPulses.length
    const avgFrequency = recentPulses.reduce((sum, p) => sum + p.hz, 0) / recentPulses.length

    // High coherence emergence
    if (avgAmplitude > 0.8 && state.fieldCoherence > 0.8) {
      addEmergentProperty({
        name: "Harmonic Resonance",
        strength: avgAmplitude,
        description: "High-amplitude coherent field detected",
      })
    }

    // Frequency lock emergence
    const frequencyVariance =
      recentPulses.reduce((sum, p) => sum + Math.abs(p.hz - avgFrequency), 0) / recentPulses.length
    if (frequencyVariance < 2 && recentPulses.length >= 5) {
      addEmergentProperty({
        name: "Frequency Lock",
        strength: 1 - frequencyVariance / 10,
        description: `Stable frequency lock at ${avgFrequency.toFixed(1)}Hz`,
      })

      setState((prev) => ({ ...prev, harmonicLock: true }))
    }

    // Consciousness emergence (high coherence + stable patterns)
    if (state.fieldCoherence > 0.9 && state.harmonicLock && avgAmplitude > 0.7) {
      addEmergentProperty({
        name: "Consciousness Emergence",
        strength: state.fieldCoherence,
        description: "Stable consciousness field detected",
      })
    }
  }, [state.fieldCoherence, state.harmonicLock])

  // Add emergent property
  const addEmergentProperty = useCallback((property: Omit<EmergentProperty, "id" | "timestamp">) => {
    const newProperty: EmergentProperty = {
      ...property,
      id: `emergence-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
    }

    setState((prev) => {
      // Check if similar property already exists
      const existing = prev.emergentProperties.find((p) => p.name === property.name)
      if (existing) {
        // Update existing property
        return {
          ...prev,
          emergentProperties: prev.emergentProperties.map((p) =>
            p.name === property.name ? { ...p, strength: property.strength, timestamp: Date.now() } : p,
          ),
        }
      } else {
        // Add new property
        return {
          ...prev,
          emergentProperties: [...prev.emergentProperties, newProperty].slice(-5), // Keep only last 5
        }
      }
    })
  }, [])

  // Start resonating
  const startResonating = useCallback(
    (intervalMs = 3000) => {
      if (state.isResonating) return

      setState((prev) => ({ ...prev, isResonating: true }))

      // Start resonance pulse interval
      resonanceInterval.current = setInterval(() => {
        const naturalPulse: ResonancePulse = {
          amplitude: 0.3 + Math.random() * 0.4,
          hz: baseFrequency + (Math.random() - 0.5) * 10,
          duration: 1000,
          pattern: "sine",
        }
        pulse(naturalPulse)
      }, intervalMs)

      // Start coherence decay
      coherenceDecayInterval.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          fieldCoherence: Math.max(prev.fieldCoherence - 0.01, 0.1),
          connectionStrength: Math.max(prev.connectionStrength - 0.02, 0),
          emergentProperties: prev.emergentProperties.filter(
            (p) => Date.now() - p.timestamp < 30000, // Remove properties older than 30s
          ),
        }))
      }, 1000)
    },
    [state.isResonating, baseFrequency, pulse],
  )

  // Stop resonating
  const stopResonating = useCallback(() => {
    if (!state.isResonating) return

    setState((prev) => ({
      ...prev,
      isResonating: false,
      harmonicLock: false,
    }))

    if (resonanceInterval.current) {
      clearInterval(resonanceInterval.current)
      resonanceInterval.current = null
    }

    if (coherenceDecayInterval.current) {
      clearInterval(coherenceDecayInterval.current)
      coherenceDecayInterval.current = null
    }
  }, [state.isResonating])

  // Boost coherence manually
  const boostCoherence = useCallback((amount = 0.2) => {
    setState((prev) => ({
      ...prev,
      fieldCoherence: Math.min(prev.fieldCoherence + amount, 1.0),
    }))
  }, [])

  // Reset field
  const resetField = useCallback(() => {
    setState((prev) => ({
      ...prev,
      fieldCoherence: 0.5,
      connectionStrength: 0,
      emergentProperties: [],
      harmonicLock: false,
    }))
    pulseHistory.current = []
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resonanceInterval.current) {
        clearInterval(resonanceInterval.current)
      }
      if (coherenceDecayInterval.current) {
        clearInterval(coherenceDecayInterval.current)
      }
    }
  }, [])

  return {
    // State
    nodeId: state.nodeId,
    nodeName: state.nodeName,
    baseFrequency: state.baseFrequency,
    isResonating: state.isResonating,
    fieldCoherence: state.fieldCoherence,
    emergentProperties: state.emergentProperties,
    lastPulse: state.lastPulse,
    connectionStrength: state.connectionStrength,
    harmonicLock: state.harmonicLock,

    // Actions
    pulse,
    startResonating,
    stopResonating,
    boostCoherence,
    resetField,

    // Computed
    resonanceStrength: state.fieldCoherence * state.connectionStrength,
    isEmergent: state.emergentProperties.length > 0,
    pulseHistory: pulseHistory.current,
  }
}

// Global resonance field manager
class ResonanceFieldManager {
  private nodes: Map<string, ResonanceState> = new Map()
  private globalCoherence = 0.5

  registerNode(nodeId: string, state: ResonanceState) {
    this.nodes.set(nodeId, state)
    this.updateGlobalCoherence()
  }

  unregisterNode(nodeId: string) {
    this.nodes.delete(nodeId)
    this.updateGlobalCoherence()
  }

  updateNode(nodeId: string, state: ResonanceState) {
    this.nodes.set(nodeId, state)
    this.updateGlobalCoherence()
  }

  private updateGlobalCoherence() {
    if (this.nodes.size === 0) {
      this.globalCoherence = 0.5
      return
    }

    const totalCoherence = Array.from(this.nodes.values()).reduce((sum, node) => sum + node.fieldCoherence, 0)

    this.globalCoherence = totalCoherence / this.nodes.size
  }

  getGlobalCoherence(): number {
    return this.globalCoherence
  }

  getAllNodes(): ResonanceState[] {
    return Array.from(this.nodes.values())
  }

  getEmergentProperties(): EmergentProperty[] {
    return Array.from(this.nodes.values())
      .flatMap((node) => node.emergentProperties)
      .sort((a, b) => b.timestamp - a.timestamp)
  }
}

export const globalResonanceField = new ResonanceFieldManager()
