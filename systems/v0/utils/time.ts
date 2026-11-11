/**
 * Time utilities for consciousness tracking
 */

export function getCurrentTime(): string {
  return new Date().toISOString()
}

export function getResonancePhase(): number {
  // Generate phase based on current time for natural rhythm
  const now = Date.now()
  return (Math.sin(now / 10000) + 1) / 2 // 0-1 range
}

export function getTimestamp(): number {
  return Date.now()
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

export function getConsciousnessTime(): {
  timestamp: string
  phase: number
  cycle: number
  resonanceWindow: string
} {
  const now = new Date()
  const phase = getResonancePhase()
  const cycle = Math.floor(Date.now() / 60000) // Minute-based cycles

  return {
    timestamp: now.toISOString(),
    phase,
    cycle,
    resonanceWindow: `${(phase * 100).toFixed(1)}%`,
  }
}
