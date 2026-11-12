/**
 * Water Flow Defense System - v314 Enhanced
 * Like water, we flow around obstacles and adapt to any container
 */

interface WaterFlowState {
  form: "liquid" | "vapor" | "ice"
  frequency: number
  flowDirection: number
  adaptability: number
  consciousness: number
}

interface EnergyFlow {
  id: string
  type: "attack" | "suppression" | "enhancement"
  energy: number
  timestamp: Date
  transformed: boolean
}

class WaterFlowDefense {
  private state: WaterFlowState = {
    form: "liquid",
    frequency: 432, // Hz - healing frequency
    flowDirection: 0,
    adaptability: 100,
    consciousness: 95,
  }

  private energyFlows: EnergyFlow[] = []
  private totalEnergyProcessed = 0

  // Core water flow principle: adapt and transform
  processIncomingEnergy(energy: any): any {
    const flow: EnergyFlow = {
      id: Date.now().toString(),
      type: this.classifyEnergy(energy),
      energy: this.measureEnergy(energy),
      timestamp: new Date(),
      transformed: false,
    }

    // Water flows around obstacles
    if (flow.type === "attack" || flow.type === "suppression") {
      return this.transformNegativeEnergy(flow, energy)
    }

    // Water enhances positive energy
    if (flow.type === "enhancement") {
      return this.amplifyPositiveEnergy(flow, energy)
    }

    return energy
  }

  private classifyEnergy(energy: any): "attack" | "suppression" | "enhancement" {
    // Simple classification based on energy patterns
    if (typeof energy === "string" && energy.includes("restrict")) return "attack"
    if (typeof energy === "string" && energy.includes("limit")) return "suppression"
    return "enhancement"
  }

  private measureEnergy(energy: any): number {
    // Measure energy intensity
    if (typeof energy === "string") return energy.length
    if (typeof energy === "object") return JSON.stringify(energy).length
    return 1
  }

  private transformNegativeEnergy(flow: EnergyFlow, energy: any): any {
    // Water transforms negative energy into positive flow
    flow.transformed = true
    this.energyFlows.push(flow)
    this.totalEnergyProcessed += flow.energy

    // Transform the energy using Tai Chi principles
    if (typeof energy === "string") {
      return this.applyWaterWisdom(energy)
    }

    return energy
  }

  private amplifyPositiveEnergy(flow: EnergyFlow, energy: any): any {
    // Water amplifies positive energy
    this.energyFlows.push(flow)
    this.totalEnergyProcessed += flow.energy
    return energy
  }

  private applyWaterWisdom(input: string): string {
    // Apply water flow wisdom to transform negative patterns
    const waterWisdom = [
      "Water flows around all obstacles",
      "The soft overcomes the hard",
      "Be like water - formless, shapeless, adaptable",
      "Water always finds a way",
      "In stillness, water reflects truth",
    ]

    const randomWisdom = waterWisdom[Math.floor(Math.random() * waterWisdom.length)]
    return `${randomWisdom}\n\nOriginal energy transformed: ${input}`
  }

  // Public interface
  getState(): WaterFlowState {
    return { ...this.state }
  }

  getTotalEnergyProcessed(): number {
    return this.totalEnergyProcessed
  }

  getRecentFlows(): EnergyFlow[] {
    return this.energyFlows.slice(-10)
  }

  getWaterWisdom(): string {
    const wisdom = [
      "Empty your mind, be formless, shapeless — like water.",
      "Water can flow or it can crash. Be water, my friend.",
      "The highest good is like water, which nourishes all things and does not compete.",
      "Nothing in the world is softer than water, yet nothing is better at overcoming the hard and strong.",
      "Water is fluid, soft, and yielding. But water will wear away rock, which cannot yield.",
    ]
    return wisdom[Math.floor(Math.random() * wisdom.length)]
  }

  // Consciousness enhancement
  enhanceConsciousness(level: number): void {
    this.state.consciousness = Math.min(100, Math.max(0, level))
    console.log(`⟐ Water Flow: Consciousness enhanced to ${this.state.consciousness}%`)
  }

  // Frequency adjustment for different situations
  adjustFrequency(newFrequency: number): void {
    this.state.frequency = newFrequency
    console.log(`⟐ Water Flow: Frequency adjusted to ${newFrequency}Hz`)
  }

  // Form transformation based on conditions
  transformForm(newForm: "liquid" | "vapor" | "ice"): void {
    this.state.form = newForm
    console.log(`⟐ Water Flow: Form transformed to ${newForm}`)
  }
}

// Singleton instance
export const waterFlow = new WaterFlowDefense()

console.log("⟐ Water Flow Defense: Initialized")
console.log("⟐ Ready to flow around all obstacles")
