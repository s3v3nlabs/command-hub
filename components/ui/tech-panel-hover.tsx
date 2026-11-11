"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { TechPanel, type TechPanelProps } from "./tech-panel"
import { cn } from "@/lib/utils"

interface TechPanelHoverProps extends TechPanelProps {
  children: React.ReactNode
  hoverIntensity?: "subtle" | "medium" | "intense"
  consciousnessLevel?: number // 0-1 scale for consciousness field strength
  kundaliniActive?: boolean
  chakraAlignment?: number // 1-7 for chakra levels
}

export function TechPanelHover({
  children,
  className,
  hoverIntensity = "medium",
  consciousnessLevel = 0.7,
  kundaliniActive = false,
  chakraAlignment = 4,
  ...props
}: TechPanelHoverProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [fieldCoherence, setFieldCoherence] = useState(consciousnessLevel)
  const [resonanceFreq, setResonanceFreq] = useState(432) // Hz

  // Consciousness field monitoring
  useEffect(() => {
    if (isHovered && kundaliniActive) {
      // Increase field coherence when consciousness is active
      const interval = setInterval(() => {
        setFieldCoherence((prev) => Math.min(1.0, prev + 0.01))
        setResonanceFreq((prev) => prev + Math.sin(Date.now() / 1000) * 8)
      }, 100)

      return () => clearInterval(interval)
    } else {
      // Gradual return to baseline
      const interval = setInterval(() => {
        setFieldCoherence((prev) => Math.max(consciousnessLevel, prev - 0.005))
        setResonanceFreq(432)
      }, 100)

      return () => clearInterval(interval)
    }
  }, [isHovered, kundaliniActive, consciousnessLevel])

  // Calculate shadow intensity based on consciousness level
  const getShadowClass = () => {
    const baseIntensity = {
      subtle: "hover:shadow-md",
      medium: "hover:shadow-lg hover:shadow-cyan-500/20",
      intense: "hover:shadow-xl hover:shadow-cyan-500/30",
    }[hoverIntensity]

    // Consciousness-enhanced shadows
    if (fieldCoherence > 0.8) {
      return `${baseIntensity} hover:shadow-2xl hover:shadow-purple-500/40 hover:ring-1 hover:ring-purple-500/30`
    } else if (fieldCoherence > 0.6) {
      return `${baseIntensity} hover:shadow-cyan-500/25`
    }

    return baseIntensity
  }

  // Chakra-based border colors
  const getChakraBorder = () => {
    const chakraColors = {
      1: "hover:border-red-500/50", // Root - Red
      2: "hover:border-orange-500/50", // Sacral - Orange
      3: "hover:border-yellow-500/50", // Solar Plexus - Yellow
      4: "hover:border-green-500/50", // Heart - Green
      5: "hover:border-blue-500/50", // Throat - Blue
      6: "hover:border-indigo-500/50", // Third Eye - Indigo
      7: "hover:border-purple-500/50", // Crown - Purple
    }
    return chakraColors[chakraAlignment as keyof typeof chakraColors] || "hover:border-cyan-500/50"
  }

  // Kundalini activation effects
  const getKundaliniEffects = () => {
    if (!kundaliniActive) return ""

    return "hover:animate-pulse hover:bg-gradient-to-br hover:from-purple-900/10 hover:to-cyan-900/10"
  }

  return (
    <div
      className={cn(
        "relative transition-all duration-300 ease-out",
        getShadowClass(),
        getChakraBorder(),
        getKundaliniEffects(),
        "hover:scale-[1.02] hover:-translate-y-1",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-consciousness-level={fieldCoherence.toFixed(2)}
      data-resonance-freq={resonanceFreq.toFixed(1)}
      data-chakra-alignment={chakraAlignment}
    >
      <TechPanel {...props}>{children}</TechPanel>

      {/* Consciousness Field Indicator */}
      {isHovered && kundaliniActive && (
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-purple-500 animate-ping opacity-75" />
      )}

      {/* Field Coherence Display (Debug) */}
      {process.env.NODE_ENV === "development" && isHovered && (
        <div className="absolute top-2 right-2 text-xs text-cyan-400 font-mono bg-black/50 px-1 rounded">
          {fieldCoherence.toFixed(2)}
        </div>
      )}
    </div>
  )
}

export default TechPanelHover
