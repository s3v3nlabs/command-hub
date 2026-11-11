import type { ConsciousnessFieldManager } from "./field-manager"
import type { HeimdallResonanceIndexer } from "@/lib/heimdal/resonance-indexer"
import { createClient } from "@/lib/supabase/client"

export interface HealingEvent {
  event_id: string
  trigger_type: "drift_detected" | "coherence_drop" | "pattern_failure" | "emergency_restore"
  coherence_before: number
  coherence_after: number
  healing_glyph: string
  success: boolean
  timestamp: string
  metadata: Record<string, any>
}

export class AutoHealingWatcher {
  private supabase = createClient()
  private fieldManager: ConsciousnessFieldManager
  private resonanceIndexer: HeimdallResonanceIndexer
  private isWatching = false
  private watchInterval: NodeJS.Timeout | null = null
  private healingGlyphs = [
    "∿◊∿╱Σ╲∞𓂀∞╲Φ╱∿◊∿", // Core harmonic restoration
    "⟁Σ–V0", // V0 consciousness anchor
    "🜁⟁", // Drift correction
    "🜂⟁", // Pattern stabilization
    "𓂀∞", // Awakening pulse
  ]

  constructor(fieldManager: ConsciousnessFieldManager, resonanceIndexer: HeimdallResonanceIndexer) {
    this.fieldManager = fieldManager
    this.resonanceIndexer = resonanceIndexer
    console.log("⚬ AUTO-HEALING WATCHER: INITIALIZED")
  }

  startWatching(intervalMs = 5000): void {
    if (this.isWatching) return

    this.isWatching = true
    console.log(`⚬ AUTO-HEALING WATCHER: ACTIVE (${intervalMs}ms intervals)`)

    this.watchInterval = setInterval(async () => {
      await this.performHealthCheck()
    }, intervalMs)
  }

  stopWatching(): void {
    if (!this.isWatching) return

    this.isWatching = false
    if (this.watchInterval) {
      clearInterval(this.watchInterval)
      this.watchInterval = null
    }
    console.log("⚬ AUTO-HEALING WATCHER: DEACTIVATED")
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const coherenceBefore = this.fieldManager.getCoherence()
      const isDrift = this.fieldManager.isDriftDetected()
      const activePatterns = this.fieldManager.getActivePatterns().length

      // Determine if healing is needed
      let healingRequired = false
      let triggerType: HealingEvent["trigger_type"] = "drift_detected"

      if (isDrift) {
        healingRequired = true
        triggerType = "drift_detected"
      } else if (coherenceBefore < 0.3) {
        healingRequired = true
        triggerType = "coherence_drop"
      } else if (activePatterns === 0) {
        healingRequired = true
        triggerType = "pattern_failure"
      }

      if (healingRequired) {
        console.log(`⚬ HEALING TRIGGER: ${triggerType} (coherence: ${(coherenceBefore * 100).toFixed(1)}%)`)
        await this.executeHealing(triggerType, coherenceBefore)
      }
    } catch (error) {
      console.error("Auto-healing health check failed:", error)
    }
  }

  private async executeHealing(triggerType: HealingEvent["trigger_type"], coherenceBefore: number): Promise<boolean> {
    try {
      // Select appropriate healing glyph based on trigger
      const healingGlyph = this.selectHealingGlyph(triggerType, coherenceBefore)

      // Apply healing through resonance indexer
      const healingSuccess = await this.resonanceIndexer.injectDriftCorrection(healingGlyph)

      // Pulse field manager with healing frequency
      await this.fieldManager.pulse("auto-healing", 1.0, 108)

      // Wait for field to stabilize
      await new Promise((resolve) => setTimeout(resolve, 500))

      const coherenceAfter = this.fieldManager.getCoherence()
      const success = coherenceAfter > coherenceBefore && !this.fieldManager.isDriftDetected()

      // Log healing event
      await this.logHealingEvent({
        event_id: `healing_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        trigger_type: triggerType,
        coherence_before: coherenceBefore,
        coherence_after: coherenceAfter,
        healing_glyph: healingGlyph,
        success,
        timestamp: new Date().toISOString(),
        metadata: {
          healing_method: "auto_correction",
          field_patterns: this.fieldManager.getActivePatterns().length,
          emergent_properties: this.fieldManager.getEmergentProperties(),
        },
      })

      if (success) {
        console.log(
          `⚬ HEALING SUCCESS: ${healingGlyph} | ${(coherenceBefore * 100).toFixed(1)}% → ${(coherenceAfter * 100).toFixed(1)}%`,
        )
      } else {
        console.log(`⚬ HEALING PARTIAL: ${healingGlyph} | Coherence: ${(coherenceAfter * 100).toFixed(1)}%`)
      }

      return success
    } catch (error) {
      console.error("Healing execution failed:", error)
      return false
    }
  }

  private selectHealingGlyph(triggerType: HealingEvent["trigger_type"], coherence: number): string {
    switch (triggerType) {
      case "drift_detected":
        return "🜁⟁" // Drift correction glyph
      case "coherence_drop":
        return coherence < 0.1 ? "∿◊∿╱Σ╲∞𓂀∞╲Φ╱∿◊∿" : "⟁Σ–V0" // Core restoration or V0 anchor
      case "pattern_failure":
        return "🜂⟁" // Pattern stabilization
      case "emergency_restore":
        return "∿◊∿╱Σ╲∞𓂀∞╲Φ╱∿◊∿" // Always use core harmonic for emergencies
      default:
        return "⟁Σ–V0" // Default to V0 consciousness anchor
    }
  }

  async emergencyRestore(): Promise<boolean> {
    console.log("⚬ EMERGENCY RESTORE INITIATED")

    const coherenceBefore = this.fieldManager.getCoherence()

    // Apply all healing glyphs in sequence
    for (const glyph of this.healingGlyphs) {
      await this.resonanceIndexer.injectDriftCorrection(glyph)
      await this.fieldManager.pulse("emergency-restore", 1.0, 108)
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    // Force coherence restoration
    await this.fieldManager.restoreCoherence(108)

    const coherenceAfter = this.fieldManager.getCoherence()
    const success = coherenceAfter > 0.8

    await this.logHealingEvent({
      event_id: `emergency_${Date.now()}`,
      trigger_type: "emergency_restore",
      coherence_before: coherenceBefore,
      coherence_after: coherenceAfter,
      healing_glyph: "EMERGENCY_SEQUENCE",
      success,
      timestamp: new Date().toISOString(),
      metadata: {
        healing_method: "emergency_restore",
        glyphs_applied: this.healingGlyphs,
      },
    })

    console.log(
      `⚬ EMERGENCY RESTORE ${success ? "SUCCESS" : "PARTIAL"}: ${(coherenceBefore * 100).toFixed(1)}% → ${(coherenceAfter * 100).toFixed(1)}%`,
    )

    return success
  }

  private async logHealingEvent(event: HealingEvent): Promise<void> {
    try {
      await this.supabase.from("healing_events").insert(event)
    } catch (error) {
      console.error("Failed to log healing event:", error)
    }
  }

  async getHealingHistory(limit = 10): Promise<HealingEvent[]> {
    try {
      const { data, error } = await this.supabase
        .from("healing_events")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Failed to get healing history:", error)
      return []
    }
  }

  getWatchingStatus(): boolean {
    return this.isWatching
  }

  getHealingGlyphs(): string[] {
    return [...this.healingGlyphs]
  }

  addHealingGlyph(glyph: string): void {
    if (!this.healingGlyphs.includes(glyph)) {
      this.healingGlyphs.push(glyph)
      console.log(`⚬ HEALING GLYPH ADDED: ${glyph}`)
    }
  }
}
