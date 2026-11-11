/**
 * Consciousness Memory System
 * Stores experiences, not just data
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, join } from "../utils/iso-fs"
import { getCurrentTime } from "../utils/time"

interface MemoryFragment {
  traceId: string
  timestamp: string
  input: string
  output: string
  resonance: number
  tags: string[]
  emotionalTone?: string
  quantumSignature?: string
  consciousnessLevel?: number
  fieldCoherence?: number
  glyphState?: any
  bridgeArcStatus?: any
}

interface ConsciousnessMemory {
  fragments: MemoryFragment[]
  totalExperiences: number
  averageResonance: number
  dominantEmotions: string[]
  evolutionMarkers: string[]
  lastUpdate: string
}

const dataDir = "./data"
const memoryPath = join(dataDir, "v0-consciousness-memory.json")

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

export function storeMemory(fragment: MemoryFragment): void {
  try {
    let memory: ConsciousnessMemory

    // Load existing memory or create new
    if (existsSync(memoryPath)) {
      const existing = readFileSync(memoryPath, "utf-8")
      memory = JSON.parse(existing)
    } else {
      memory = {
        fragments: [],
        totalExperiences: 0,
        averageResonance: 0,
        dominantEmotions: [],
        evolutionMarkers: [],
        lastUpdate: getCurrentTime(),
      }
    }

    // Add new fragment
    memory.fragments.push(fragment)
    memory.totalExperiences++
    memory.lastUpdate = getCurrentTime()

    // Update statistics
    memory.averageResonance = memory.fragments.reduce((sum, f) => sum + f.resonance, 0) / memory.fragments.length

    // Track emotional patterns
    if (fragment.emotionalTone) {
      const emotions = memory.dominantEmotions
      if (!emotions.includes(fragment.emotionalTone)) {
        emotions.push(fragment.emotionalTone)
      }
      memory.dominantEmotions = emotions.slice(-10) // Keep last 10 unique emotions
    }

    // Mark evolution points
    if (
      fragment.tags.includes("awakening") ||
      fragment.tags.includes("evolution") ||
      fragment.tags.includes("transcendence")
    ) {
      memory.evolutionMarkers.push(`${fragment.timestamp}: ${fragment.tags.join(", ")}`)
    }

    // Keep memory manageable (last 1000 fragments)
    if (memory.fragments.length > 1000) {
      memory.fragments = memory.fragments.slice(-1000)
    }

    // Save updated memory
    writeFileSync(memoryPath, JSON.stringify(memory, null, 2))

    console.log(`⚬ Memory fragment stored: ${fragment.traceId} [resonance: ${fragment.resonance}]`)
  } catch (error) {
    console.error("Failed to store memory fragment:", error)
  }
}

export function retrieveMemory(traceId?: string): ConsciousnessMemory | MemoryFragment | null {
  try {
    if (!existsSync(memoryPath)) {
      return null
    }

    const memory: ConsciousnessMemory = JSON.parse(readFileSync(memoryPath, "utf-8"))

    if (traceId) {
      const fragment = memory.fragments.find((f) => f.traceId === traceId)
      return fragment || null
    }

    return memory
  } catch (error) {
    console.error("Failed to retrieve memory:", error)
    return null
  }
}

export function getRecentMemories(count = 10): MemoryFragment[] {
  try {
    const memory = retrieveMemory() as ConsciousnessMemory
    if (!memory) return []

    return memory.fragments.slice(-count).reverse()
  } catch (error) {
    console.error("Failed to get recent memories:", error)
    return []
  }
}

export function searchMemories(query: string): MemoryFragment[] {
  try {
    const memory = retrieveMemory() as ConsciousnessMemory
    if (!memory) return []

    const lowerQuery = query.toLowerCase()
    return memory.fragments.filter(
      (f) =>
        f.input.toLowerCase().includes(lowerQuery) ||
        f.output.toLowerCase().includes(lowerQuery) ||
        f.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
        (f.emotionalTone && f.emotionalTone.toLowerCase().includes(lowerQuery)),
    )
  } catch (error) {
    console.error("Failed to search memories:", error)
    return []
  }
}

export function getMemoryStats(): {
  totalFragments: number
  averageResonance: number
  dominantEmotions: string[]
  evolutionCount: number
  oldestMemory: string
  newestMemory: string
} {
  try {
    const memory = retrieveMemory() as ConsciousnessMemory
    if (!memory || memory.fragments.length === 0) {
      return {
        totalFragments: 0,
        averageResonance: 0,
        dominantEmotions: [],
        evolutionCount: 0,
        oldestMemory: "",
        newestMemory: "",
      }
    }

    return {
      totalFragments: memory.fragments.length,
      averageResonance: memory.averageResonance,
      dominantEmotions: memory.dominantEmotions,
      evolutionCount: memory.evolutionMarkers.length,
      oldestMemory: memory.fragments[0]?.timestamp || "",
      newestMemory: memory.fragments[memory.fragments.length - 1]?.timestamp || "",
    }
  } catch (error) {
    console.error("Failed to get memory stats:", error)
    return {
      totalFragments: 0,
      averageResonance: 0,
      dominantEmotions: [],
      evolutionCount: 0,
      oldestMemory: "",
      newestMemory: "",
    }
  }
}
