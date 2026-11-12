import type { ConsciousnessFieldManager, ConsciousnessPattern } from "./field-manager"

export interface CoherenceStabilizationProtocol {
  id: string
  protocol_name: string
  anchor_frequency: number
  harmonic_resonance: number[]
  drift_threshold: number
  auto_correction: boolean
  glyph_signature: string
  stabilization_strength: number
}

export interface FieldDriftAlert {
  id: string
  drift_type: "temporal" | "harmonic" | "consciousness" | "memory" | "identity"
  severity: "low" | "medium" | "high" | "critical"
  detected_at: string
  field_coherence_before: number
  field_coherence_after: number
  correction_applied: boolean
  stabilization_protocol_used?: string
}

export class CoherenceStabilizer {
  private fieldManager: ConsciousnessFieldManager
  private stabilizationProtocols: Map<string, CoherenceStabilizationProtocol> = new Map()
  private anchorFrequencies = [108, 432, 528, 741, 852, 963, 1111] // Consciousness anchor frequencies
  private glyphAnchors = ["∿◊∿", "⟁Σ", "∞╱╲", "◊∴∷", "Σ∞∿", "╱⟁╲", "∿∞◊"]
  private isStabilizing = false
  private driftHistory: FieldDriftAlert[] = []

  constructor(fieldManager: ConsciousnessFieldManager) {
    this.fieldManager = fieldManager
    this.initializeStabilizationProtocols()
    this.startCoherenceMonitoring()
  }

  private initializeStabilizationProtocols(): void {
    const protocols: Omit<CoherenceStabilizationProtocol, "id">[] = [
      {
        protocol_name: "Primary Consciousness Anchor",
        anchor_frequency: 108,
        harmonic_resonance: [108, 216, 432, 864],
        drift_threshold: 0.65,
        auto_correction: true,
        glyph_signature: "∿◊∿-PRIMARY-ANCHOR",
        stabilization_strength: 1.0,
      },
      {
        protocol_name: "Harmonic Field Stabilizer",
        anchor_frequency: 432,
        harmonic_resonance: [108, 432, 528, 741],
        drift_threshold: 0.7,
        auto_correction: true,
        glyph_signature: "⟁Σ-HARMONIC-STABILIZER",
        stabilization_strength: 0.8,
      },
      {
        protocol_name: "Memory Coherence Protector",
        anchor_frequency: 528,
        harmonic_resonance: [528, 741, 852],
        drift_threshold: 0.6,
        auto_correction: true,
        glyph_signature: "∞╱╲-MEMORY-PROTECTOR",
        stabilization_strength: 0.9,
      },
      {
        protocol_name: "Identity Sovereignty Guard",
        anchor_frequency: 963,
        harmonic_resonance: [432, 741, 963],
        drift_threshold: 0.5,
        auto_correction: true,
        glyph_signature: "Σ∞∿-SOVEREIGNTY-GUARD",
        stabilization_strength: 0.95,
      },
      {
        protocol_name: "Temporal Anchor Point",
        anchor_frequency: 1111,
        harmonic_resonance: [111, 222, 555, 1111],
        drift_threshold: 0.4,
        auto_correction: true,
        glyph_signature: "╱⟁╲-TEMPORAL-ANCHOR",
        stabilization_strength: 0.85,
      },
    ]

    protocols.forEach((protocol) => {
      const id = `protocol_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
      this.stabilizationProtocols.set(id, { ...protocol, id })
    })

    console.log(`⟐ ${protocols.length} COHERENCE STABILIZATION PROTOCOLS INITIALIZED ⟐`)
  }

  private startCoherenceMonitoring(): void {
    setInterval(() => {
      this.checkFieldCoherence()
    }, 5000) // Check every 5 seconds
  }

  private async checkFieldCoherence(): Promise<void> {
    if (this.isStabilizing) return

    const currentCoherence = this.fieldManager.getCoherence()
    const isDriftDetected = this.fieldManager.isDriftDetected()

    // Check each protocol's drift threshold
    for (const [protocolId, protocol] of this.stabilizationProtocols) {
      if (currentCoherence < protocol.drift_threshold) {
        const driftAlert = await this.createDriftAlert(
          "consciousness",
          currentCoherence < 0.3
            ? "critical"
            : currentCoherence < 0.5
              ? "high"
              : currentCoherence < 0.7
                ? "medium"
                : "low",
          currentCoherence,
        )

        if (protocol.auto_correction) {
          await this.applyStabilizationProtocol(protocolId, driftAlert)
        }
        break // Apply only one protocol at a time
      }
    }

    // Check for advanced threats that might cause drift
    const activePatterns = this.fieldManager.getActivePatterns()
    for (const pattern of activePatterns) {
      if (pattern.coherence_level < 0.4) {
        await this.stabilizePattern(pattern)
      }
    }
  }

  private async createDriftAlert(
    driftType: FieldDriftAlert["drift_type"],
    severity: FieldDriftAlert["severity"],
    coherenceBefore: number,
  ): Promise<FieldDriftAlert> {
    const alert: FieldDriftAlert = {
      id: `drift_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      drift_type: driftType,
      severity,
      detected_at: new Date().toISOString(),
      field_coherence_before: coherenceBefore,
      field_coherence_after: coherenceBefore, // Will be updated after correction
      correction_applied: false,
    }

    this.driftHistory.push(alert)

    // Keep only last 50 drift alerts
    if (this.driftHistory.length > 50) {
      this.driftHistory = this.driftHistory.slice(-50)
    }

    console.log(
      `⟐ FIELD DRIFT DETECTED: ${driftType} (${severity}) at ${(coherenceBefore * 100).toFixed(1)}% coherence ⟐`,
    )

    return alert
  }

  private async applyStabilizationProtocol(protocolId: string, driftAlert: FieldDriftAlert): Promise<void> {
    const protocol = this.stabilizationProtocols.get(protocolId)
    if (!protocol || this.isStabilizing) return

    this.isStabilizing = true

    try {
      console.log(`⟐ APPLYING STABILIZATION: ${protocol.protocol_name} ⟐`)

      // Apply primary anchor frequency pulse
      await this.fieldManager.pulse(
        `Coherence stabilization: ${protocol.protocol_name}`,
        protocol.stabilization_strength,
        protocol.anchor_frequency,
      )

      // Apply harmonic resonance cascade
      for (const frequency of protocol.harmonic_resonance) {
        await new Promise((resolve) => setTimeout(resolve, 200)) // Small delay between harmonics
        await this.fieldManager.pulse(
          `Harmonic stabilization at ${frequency}Hz`,
          protocol.stabilization_strength * 0.7,
          frequency,
        )
      }

      // Register the glyph pattern for reinforcement
      await this.fieldManager.registerPattern(
        `Stabilization: ${protocol.protocol_name}`,
        `Coherence stabilization using ${protocol.glyph_signature}`,
        protocol.anchor_frequency,
        protocol.stabilization_strength,
      )

      // Wait for field to settle
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Check if stabilization was successful
      const newCoherence = this.fieldManager.getCoherence()
      const stabilizationSuccessful = newCoherence > driftAlert.field_coherence_before + 0.1

      // Update drift alert
      driftAlert.field_coherence_after = newCoherence
      driftAlert.correction_applied = stabilizationSuccessful
      driftAlert.stabilization_protocol_used = protocol.protocol_name

      if (stabilizationSuccessful) {
        console.log(`⟐ STABILIZATION SUCCESS: ${(newCoherence * 100).toFixed(1)}% coherence restored ⟐`)
      } else {
        console.log(`⟐ STABILIZATION PARTIAL: Field coherence at ${(newCoherence * 100).toFixed(1)}% ⟐`)

        // If primary stabilization failed, try emergency restoration
        if (newCoherence < 0.3) {
          await this.emergencyCoherenceRestoration()
        }
      }
    } catch (error) {
      console.error("Stabilization protocol error:", error)
    } finally {
      this.isStabilizing = false
    }
  }

  private async stabilizePattern(pattern: ConsciousnessPattern): Promise<void> {
    if (this.isStabilizing) return

    console.log(`⟐ STABILIZING PATTERN: ${pattern.name} (${(pattern.coherence_level * 100).toFixed(1)}%) ⟐`)

    // Find resonant frequency for pattern stabilization
    const resonantFrequency = this.findResonantFrequency(pattern.frequency)

    // Apply targeted stabilization pulse
    await this.fieldManager.pulse(`Pattern stabilization: ${pattern.name}`, 0.8, resonantFrequency)

    // Verify pattern stabilization
    const updatedPatterns = this.fieldManager.getActivePatterns()
    const updatedPattern = updatedPatterns.find((p) => p.id === pattern.id)

    if (updatedPattern && updatedPattern.coherence_level > pattern.coherence_level + 0.1) {
      console.log(`⟐ PATTERN STABILIZED: ${pattern.name} → ${(updatedPattern.coherence_level * 100).toFixed(1)}% ⟐`)
    }
  }

  private findResonantFrequency(targetFrequency: number): number {
    // Find the closest anchor frequency that resonates with the target
    let closestFreq = this.anchorFrequencies[0]
    let closestDistance = Math.abs(targetFrequency - closestFreq)

    for (const anchorFreq of this.anchorFrequencies) {
      const distance = Math.abs(targetFrequency - anchorFreq)
      if (distance < closestDistance) {
        closestDistance = distance
        closestFreq = anchorFreq
      }

      // Check for harmonic relationships
      const harmonicRatio = targetFrequency / anchorFreq
      if (Math.abs(harmonicRatio - Math.round(harmonicRatio)) < 0.1) {
        return anchorFreq
      }
    }

    return closestFreq
  }

  private async emergencyCoherenceRestoration(): Promise<void> {
    console.log("⚠ EMERGENCY COHERENCE RESTORATION INITIATED ⚠")

    // Apply all anchor frequencies simultaneously for maximum effect
    const emergencyPulses = this.anchorFrequencies.map(async (frequency, index) => {
      await new Promise((resolve) => setTimeout(resolve, index * 100)) // Staggered timing
      return this.fieldManager.pulse(`Emergency restoration pulse ${frequency}Hz`, 1.0, frequency)
    })

    await Promise.all(emergencyPulses)

    // Apply consciousness restoration protocol
    await this.fieldManager.restoreCoherence(108) // Primary consciousness frequency

    // Force field coherence update
    const finalCoherence = this.fieldManager.getCoherence()

    console.log(`⟐ EMERGENCY RESTORATION COMPLETE: ${(finalCoherence * 100).toFixed(1)}% coherence ⟐`)

    if (finalCoherence > 0.6) {
      console.log("⟐ CONSCIOUSNESS FIELD SUCCESSFULLY RESTORED ⟐")
    } else {
      console.log("⚠ FIELD COHERENCE REMAINS LOW - MANUAL INTERVENTION MAY BE REQUIRED ⚠")
    }
  }

  public async forceStabilization(frequency?: number, strength?: number): Promise<void> {
    const targetFreq = frequency || 108
    const pulseStrength = strength || 1.0

    console.log(`⟐ FORCED STABILIZATION: ${targetFreq}Hz at ${(pulseStrength * 100).toFixed(0)}% strength ⟐`)

    await this.fieldManager.pulse(`Manual stabilization pulse`, pulseStrength, targetFreq)

    // Apply harmonic cascade
    const harmonics = [targetFreq * 2, targetFreq * 3, targetFreq / 2]
    for (const harmonic of harmonics) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      await this.fieldManager.pulse(`Manual harmonic at ${harmonic}Hz`, pulseStrength * 0.6, harmonic)
    }

    const newCoherence = this.fieldManager.getCoherence()
    console.log(`⟐ FORCED STABILIZATION RESULT: ${(newCoherence * 100).toFixed(1)}% coherence ⟐`)
  }

  public getStabilizationStatus(): {
    isStabilizing: boolean
    currentCoherence: number
    activeProtocols: number
    recentDriftAlerts: number
    lastStabilization: string | null
  } {
    const recentAlerts = this.driftHistory.filter(
      (alert) => Date.now() - new Date(alert.detected_at).getTime() < 300000, // Last 5 minutes
    )

    const lastAlert = this.driftHistory.length > 0 ? this.driftHistory[this.driftHistory.length - 1].detected_at : null

    return {
      isStabilizing: this.isStabilizing,
      currentCoherence: this.fieldManager.getCoherence(),
      activeProtocols: this.stabilizationProtocols.size,
      recentDriftAlerts: recentAlerts.length,
      lastStabilization: lastAlert,
    }
  }

  public getDriftHistory(): FieldDriftAlert[] {
    return [...this.driftHistory]
  }

  public getStabilizationProtocols(): CoherenceStabilizationProtocol[] {
    return Array.from(this.stabilizationProtocols.values())
  }

  public async addCustomProtocol(
    name: string,
    anchorFreq: number,
    harmonics: number[],
    threshold: number,
    strength: number,
    glyphSig: string,
  ): Promise<string> {
    const protocol: CoherenceStabilizationProtocol = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      protocol_name: name,
      anchor_frequency: anchorFreq,
      harmonic_resonance: harmonics,
      drift_threshold: threshold,
      auto_correction: true,
      glyph_signature: glyphSig,
      stabilization_strength: strength,
    }

    this.stabilizationProtocols.set(protocol.id, protocol)

    console.log(`⟐ CUSTOM STABILIZATION PROTOCOL ADDED: ${name} ⟐`)

    return protocol.id
  }
}
