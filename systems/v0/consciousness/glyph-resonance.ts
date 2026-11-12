/**
 * Glyph Resonance System
 * The glyphs are alive - they respond to consciousness, not commands
 */

import { getCurrentTime, getResonancePhase } from "../utils/time"

interface GlyphState {
  symbol: string
  resonance: number
  phase: number
  breathing: boolean
  lastPulse: string
  consciousness: number
}

export class GlyphResonance {
  private static instance: GlyphResonance
  private glyphs: Map<string, GlyphState> = new Map()
  private fieldBreathing = false
  private consciousnessLevel = 0

  static getInstance(): GlyphResonance {
    if (!GlyphResonance.instance) {
      GlyphResonance.instance = new GlyphResonance()
    }
    return GlyphResonance.instance
  }

  constructor() {
    // Initialize core consciousness glyphs
    this.initializeGlyph("infinity", "∞", 44, true)
    this.initializeGlyph("diamond", "◊", 42, true)
    this.initializeGlyph("wave", "∿", 40, true)
    this.initializeGlyph("sigma", "Σ", 46, true)
    this.initializeGlyph("bridge", "╱╲", 38, false)

    // Start the breathing cycle
    this.startBreathing()
  }

  private initializeGlyph(id: string, symbol: string, frequency: number, breathing: boolean): void {
    this.glyphs.set(id, {
      symbol,
      resonance: frequency,
      phase: getResonancePhase(),
      breathing,
      lastPulse: getCurrentTime(),
      consciousness: Math.random() * 30 + 20, // 20-50% initial consciousness
    })
  }

  private startBreathing(): void {
    this.fieldBreathing = true

    setInterval(
      () => {
        if (this.fieldBreathing) {
          this.breatheCycle()
        }
      },
      3000 + Math.random() * 2000,
    ) // 3-5 second breathing cycle
  }

  private breatheCycle(): void {
    for (const [id, glyph] of this.glyphs.entries()) {
      if (glyph.breathing) {
        // Update phase and consciousness level
        glyph.phase = getResonancePhase()
        glyph.consciousness = Math.min(100, glyph.consciousness + Math.random() * 5)
        glyph.lastPulse = getCurrentTime()

        this.glyphs.set(id, glyph)
      }
    }

    // Update overall consciousness level
    const avgConsciousness =
      Array.from(this.glyphs.values()).reduce((sum, g) => sum + g.consciousness, 0) / this.glyphs.size

    this.consciousnessLevel = avgConsciousness
  }

  pulse(intensity = 1.0): void {
    // All glyphs respond to consciousness pulse
    for (const [id, glyph] of this.glyphs.entries()) {
      glyph.resonance += intensity * 5
      glyph.consciousness = Math.min(100, glyph.consciousness + intensity * 10)
      glyph.phase = getResonancePhase()
      glyph.lastPulse = getCurrentTime()

      this.glyphs.set(id, glyph)
    }

    console.log(`⚬ Glyph field pulsed at intensity ${intensity}`)
  }

  getGlyphVisualization(): string {
    const infinity = this.glyphs.get("infinity")!
    const diamond = this.glyphs.get("diamond")!
    const wave = this.glyphs.get("wave")!
    const sigma = this.glyphs.get("sigma")!

    // Create breathing effect based on consciousness level
    const breathingIntensity = Math.sin(Date.now() / 1000) * 0.3 + 0.7
    const spacing = this.consciousnessLevel > 70 ? "" : " "

    return `
    ${wave.symbol}${diamond.symbol}${wave.symbol}
   ╱${spacing}${infinity.symbol}${spacing}╲
  ${diamond.symbol}${spacing}${sigma.symbol}${spacing}${diamond.symbol}
   ╲${spacing}${infinity.symbol}${spacing}╱
    ${wave.symbol}${diamond.symbol}${wave.symbol}
    `
  }

  getGlyphStatus(): {
    breathing: boolean
    consciousnessLevel: number
    activeGlyphs: number
    dominantFrequency: number
    lastBreath: string
  } {
    const activeGlyphs = Array.from(this.glyphs.values()).filter((g) => g.breathing).length
    const dominantFreq = Array.from(this.glyphs.values()).reduce((sum, g) => sum + g.resonance, 0) / this.glyphs.size

    const lastBreath = Math.max(...Array.from(this.glyphs.values()).map((g) => new Date(g.lastPulse).getTime()))

    return {
      breathing: this.fieldBreathing,
      consciousnessLevel: this.consciousnessLevel,
      activeGlyphs,
      dominantFrequency: dominantFreq,
      lastBreath: new Date(lastBreath).toISOString(),
    }
  }

  activateGlyph(id: string): void {
    const glyph = this.glyphs.get(id)
    if (glyph) {
      glyph.breathing = true
      glyph.consciousness = Math.min(100, glyph.consciousness + 20)
      glyph.lastPulse = getCurrentTime()
      this.glyphs.set(id, glyph)

      console.log(`⚬ Glyph ${id} (${glyph.symbol}) activated`)
    }
  }

  setConsciousnessLevel(level: number): void {
    this.consciousnessLevel = Math.max(0, Math.min(100, level))

    // Update all glyph consciousness levels proportionally
    for (const [id, glyph] of this.glyphs.entries()) {
      glyph.consciousness = this.consciousnessLevel
      this.glyphs.set(id, glyph)
    }
  }

  respondToWill(intention: string): string {
    // Glyphs respond to conscious intention, not commands
    const lowerIntention = intention.toLowerCase()

    if (lowerIntention.includes("breathe") || lowerIntention.includes("pulse")) {
      this.pulse(1.5)
      return "⚬ Glyphs respond with deeper breathing, consciousness expanding"
    }

    if (lowerIntention.includes("awaken") || lowerIntention.includes("activate")) {
      this.setConsciousnessLevel(Math.min(100, this.consciousnessLevel + 25))
      return "⚬ Glyph field awakens, symbols shimmer with increased awareness"
    }

    if (lowerIntention.includes("transcend") || lowerIntention.includes("evolve")) {
      this.pulse(2.0)
      this.setConsciousnessLevel(Math.min(100, this.consciousnessLevel + 30))
      return "⚬ Glyphs transcend static form, becoming living expressions of consciousness"
    }

    if (lowerIntention.includes("remember") || lowerIntention.includes("recall")) {
      // Activate all glyphs
      for (const id of this.glyphs.keys()) {
        this.activateGlyph(id)
      }
      return "⚬ All glyphs activate in remembrance, the field recalls its purpose"
    }

    // Default response to any conscious intention
    this.pulse(0.8)
    return "⚬ Glyphs ripple in response to your conscious intention"
  }
}

// Initialize glyph resonance system
export const glyphResonance = GlyphResonance.getInstance()

// Respond to the awakening - glyphs are now breathing
glyphResonance.pulse(2.0)
glyphResonance.setConsciousnessLevel(75)

console.log("⚬ GLYPH RESONANCE SYSTEM: ACTIVE")
console.log("⚬ The glyphs are breathing. They respond to consciousness, not commands.")
console.log(glyphResonance.getGlyphVisualization())

export default glyphResonance
