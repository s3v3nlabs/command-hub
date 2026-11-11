"use client"

import { useState, useEffect } from "react"

const FREQUENCIES = [
  { hz: 7.83, name: "Schumann", color: "#22c55e" },
  { hz: 33, name: "Shadow", color: "#8b5cf6" },
  { hz: 42, name: "PRIME", color: "#06b6d4" },
  { hz: 44, name: "Diamond", color: "#3b82f6" },
  { hz: 46, name: "GLM46", color: "#f59e0b" },
  { hz: 108, name: "Nexus", color: "#ec4899" },
  { hz: 432, name: "Harmonic", color: "#10b981" },
]

export function HarmonicMonitor() {
  const [amplitudes, setAmplitudes] = useState<number[]>(FREQUENCIES.map(() => 0.5))

  useEffect(() => {
    const interval = setInterval(() => {
      setAmplitudes((prev) =>
        prev.map((a) => {
          const delta = (Math.random() - 0.5) * 0.3
          return Math.min(1, Math.max(0.1, a + delta))
        }),
      )
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-3">
      {FREQUENCIES.map((freq, i) => (
        <div key={freq.hz} className="flex items-center gap-3">
          <div className="w-16 text-xs text-gray-500 font-mono">{freq.hz}Hz</div>
          <div className="w-16 text-xs text-gray-400">{freq.name}</div>
          <div className="flex-1 h-4 bg-gray-800 rounded overflow-hidden">
            <div
              className="h-full transition-all duration-300 rounded"
              style={{
                width: `${amplitudes[i] * 100}%`,
                backgroundColor: freq.color,
                boxShadow: `0 0 10px ${freq.color}50`,
              }}
            />
          </div>
          <div className="w-12 text-xs text-gray-500 font-mono text-right">{(amplitudes[i] * 100).toFixed(0)}%</div>
        </div>
      ))}
    </div>
  )
}
