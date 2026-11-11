"use client"

import { useEffect, useRef, useState } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Radio, Wifi, WifiOff } from "lucide-react"

interface SignalPanelProps {
  className?: string
}

export function SignalPanel({ className }: SignalPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [signalStrength, setSignalStrength] = useState(75) // 0-100
  const [noiseLevel, setNoiseLevel] = useState(15) // 0-100
  const [activeFrequency, setActiveFrequency] = useState(432.8) // MHz

  // Draw the signal waveform
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set line style
    ctx.lineWidth = 2
    ctx.strokeStyle = signalStrength > 50 ? "#22c55e" : "#f59e0b"

    // Draw waveform
    ctx.beginPath()

    const amplitude = (canvas.height / 2) * (signalStrength / 100)
    const frequency = 0.01 + noiseLevel / 1000
    const noise = noiseLevel / 100

    for (let x = 0; x < canvas.width; x++) {
      // Create a complex waveform with some randomness for noise
      const y =
        Math.sin(x * frequency) * amplitude * 0.5 +
        Math.sin(x * frequency * 2) * amplitude * 0.3 +
        Math.sin(x * frequency * 3) * amplitude * 0.2 +
        (Math.random() * 2 - 1) * noise * amplitude +
        canvas.height / 2

      if (x === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }

    ctx.stroke()

    // Draw horizontal center line
    ctx.beginPath()
    ctx.strokeStyle = "#64748b33"
    ctx.moveTo(0, canvas.height / 2)
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()

    // Draw frequency markers
    ctx.fillStyle = "#64748b"
    ctx.font = "10px monospace"
    ctx.textAlign = "center"

    const markers = 5
    for (let i = 0; i <= markers; i++) {
      const x = (canvas.width / markers) * i
      const freq = (activeFrequency - 1 + (i * 2) / markers).toFixed(1)

      ctx.beginPath()
      ctx.moveTo(x, canvas.height - 15)
      ctx.lineTo(x, canvas.height - 10)
      ctx.stroke()

      ctx.fillText(`${freq}`, x, canvas.height - 2)
    }
  }, [signalStrength, noiseLevel, activeFrequency])

  // Simulate changing signal strength and noise
  useEffect(() => {
    const timer = setInterval(() => {
      // Randomly adjust signal strength and noise
      setSignalStrength((prev) => {
        const change = Math.random() * 10 - 5 // -5 to +5
        return Math.max(0, Math.min(100, prev + change))
      })

      setNoiseLevel((prev) => {
        const change = Math.random() * 6 - 3 // -3 to +3
        return Math.max(5, Math.min(40, prev + change))
      })

      // Occasionally change frequency
      if (Math.random() > 0.9) {
        setActiveFrequency((prev) => {
          const change = Math.random() * 0.4 - 0.2 // -0.2 to +0.2
          return Number.parseFloat((prev + change).toFixed(1))
        })
      }
    }, 2000)

    return () => clearInterval(timer)
  }, [])

  return (
    <TechPanel
      variant="default"
      cornerAccent
      borderAccent
      title="SIGNAL PANEL"
      className={cn("flex flex-col", className)}
      actions={
        <div className="flex items-center space-x-2">
          {signalStrength > 30 ? (
            <Wifi size={14} className="text-dark-500" />
          ) : (
            <WifiOff size={14} className="text-dark-500" />
          )}
          <Badge variant={signalStrength > 50 ? "success" : signalStrength > 30 ? "warning" : "danger"}>
            {signalStrength.toFixed(0)}%
          </Badge>
        </div>
      }
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Radio size={14} className="text-dark-500" />
          <span className="text-xs font-mono">{activeFrequency.toFixed(1)} MHz</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono">NOISE:</span>
          <Badge variant="outline" className="text-[10px]">
            {noiseLevel.toFixed(0)}%
          </Badge>
        </div>
      </div>

      <div className="flex-1 bg-black rounded-sm overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </TechPanel>
  )
}
