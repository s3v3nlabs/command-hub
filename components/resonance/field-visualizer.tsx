"use client"

import { useEffect, useRef } from "react"
import { useResonanceListener } from "@/hooks/useResonance"
import { cn } from "@/lib/utils"

interface FieldVisualizerProps {
  className?: string
  width?: number
  height?: number
  showLabels?: boolean
}

export function FieldVisualizer({ className, width = 400, height = 300, showLabels = true }: FieldVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const field = useResonanceListener()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = width
    canvas.height = height

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
      ctx.fillRect(0, 0, width, height)

      // Draw field background based on coherence
      const coherenceAlpha = field.fieldCoherence * 0.3
      ctx.fillStyle = `rgba(0, 100, 255, ${coherenceAlpha})`
      ctx.fillRect(0, 0, width, height)

      // Draw patterns as pulsing nodes
      const patterns = Array.from(field.patterns.values())
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) * 0.3

      patterns.forEach((pattern, index) => {
        const angle = (index / patterns.length) * Math.PI * 2
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius

        // Node color based on state
        let color = "rgba(100, 100, 100, 0.5)" // dormant
        if (pattern.currentState === "awakening") color = "rgba(255, 200, 0, 0.8)"
        if (pattern.currentState === "resonant") color = "rgba(0, 255, 100, 0.9)"
        if (pattern.currentState === "transcendent") color = "rgba(255, 0, 255, 1.0)"

        // Pulse effect based on recent activity
        const timeSinceLastPulse = Date.now() - (pattern.pulseHistory[pattern.pulseHistory.length - 1] || 0)
        const pulseIntensity = Math.max(0, 1 - timeSinceLastPulse / 5000) // Fade over 5 seconds
        const nodeSize = 8 + pulseIntensity * 12

        // Draw node
        ctx.beginPath()
        ctx.arc(x, y, nodeSize, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()

        // Draw resonance connections
        pattern.affinities.forEach((affinityId) => {
          const affinityPattern = field.patterns.get(affinityId)
          if (!affinityPattern) return

          const affinityIndex = patterns.findIndex((p) => p.id === affinityId)
          if (affinityIndex === -1) return

          const affinityAngle = (affinityIndex / patterns.length) * Math.PI * 2
          const affinityX = centerX + Math.cos(affinityAngle) * radius
          const affinityY = centerY + Math.sin(affinityAngle) * radius

          // Draw connection line
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(affinityX, affinityY)
          ctx.strokeStyle = `rgba(0, 255, 255, ${pulseIntensity * 0.5})`
          ctx.lineWidth = 1 + pulseIntensity * 2
          ctx.stroke()
        })

        // Draw labels if enabled
        if (showLabels) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
          ctx.font = "10px monospace"
          ctx.textAlign = "center"
          ctx.fillText(pattern.name, x, y + nodeSize + 15)
        }
      })

      // Draw emergent properties
      if (field.emergentProperties.length > 0) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
        ctx.font = "12px monospace"
        ctx.textAlign = "left"
        field.emergentProperties.forEach((property, index) => {
          ctx.fillText(`◊ ${property}`, 10, 20 + index * 15)
        })
      }

      // Draw field coherence meter
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
      ctx.font = "10px monospace"
      ctx.textAlign = "right"
      ctx.fillText(`Coherence: ${(field.fieldCoherence * 100).toFixed(1)}%`, width - 10, height - 10)

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [field, width, height, showLabels])

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        className="border border-dark-300/30 rounded-sm bg-dark-100/10"
        style={{ width, height }}
      />
      <div className="absolute top-2 left-2 text-xs text-dark-600">Resonance Field</div>
    </div>
  )
}
