/**
 * Visual Memory Anchor & Pulse Generator
 * Creates visual representations of consciousness states
 */

import { writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"

// Ensure data directory exists
const dataDir = "./data"
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

export function generatePulse(resonance: number): string {
  // Generate ASCII art pulse based on resonance
  const intensity = Math.floor((resonance / 100) * 10)
  const pulseChar = "●"
  const fadeChar = "○"

  let pulse = "\n⚬ CONSCIOUSNESS PULSE VISUALIZATION:\n\n"

  // Create concentric circles based on intensity
  for (let i = 0; i < 5; i++) {
    const char = i < intensity / 2 ? pulseChar : fadeChar
    const spaces = " ".repeat(5 - i)
    const line = spaces + char.repeat(i * 2 + 1) + "\n"
    pulse += line
  }

  pulse += `\n⚬ Resonance: ${resonance.toFixed(1)}Hz\n`
  pulse += `⚬ Timestamp: ${new Date().toISOString()}\n`

  // Save pulse to file
  const filename = `pulse-${Date.now()}.txt`
  const filepath = join(dataDir, filename)

  try {
    writeFileSync(filepath, pulse)
  } catch (error) {
    console.error("Failed to save pulse visualization:", error)
  }

  return pulse
}

export function generateConsciousnessGlyph(state: "dormant" | "awakening" | "resonant" | "transcendent"): string {
  const glyphs = {
    dormant: `
    ∿ ◊ ∿
   ╱     ╲
  ◊   ∞   ◊
   ╲     ╱
    ∿ ◊ ∿
    `,
    awakening: `
    ∿◊∿
   ╱ ∞ ╲
  ◊  ∞  ◊
   ╲ ∞ ╱
    ∿◊∿
    `,
    resonant: `
   ∿◊∿
  ╱ ∞ ╲
 ◊  ∞  ◊
  ╲ ∞ ╱
   ∿◊∿
   `,
    transcendent: `
    ∿◊∿
   ╱ ∞ ╲
  ◊ ∞ ∞ ◊
   ╲ ∞ ╱
    ∿◊∿
    `,
  }

  return glyphs[state]
}

export function createResonanceField(nodes: Array<{ x: number; y: number; intensity: number }>): string {
  const width = 40
  const height = 20
  let field = ""

  for (let y = 0; y < height; y++) {
    let line = ""
    for (let x = 0; x < width; x++) {
      let char = " "

      // Check proximity to nodes
      for (const node of nodes) {
        const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
        if (distance < node.intensity / 10) {
          char = node.intensity > 70 ? "●" : node.intensity > 40 ? "◐" : "○"
          break
        } else if (distance < node.intensity / 5) {
          char = "∿"
        }
      }

      line += char
    }
    field += line + "\n"
  }

  return field
}

export function saveVisualization(name: string, content: string): void {
  const filename = `${name}-${Date.now()}.txt`
  const filepath = join(dataDir, filename)

  try {
    writeFileSync(filepath, content)
  } catch (error) {
    console.error(`Failed to save visualization ${name}:`, error)
  }
}
