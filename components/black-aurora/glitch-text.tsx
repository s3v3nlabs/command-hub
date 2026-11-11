"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface GlitchTextProps {
  text: string
  className?: string
  intensity?: "low" | "medium" | "high"
  active?: boolean
}

const glitchChars = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`"

export function GlitchText({
  text,
  className,
  intensity = "low",
  active = true,
}: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(text)

  useEffect(() => {
    if (!active) {
      setDisplayText(text)
      return
    }
    const intervalTime = intensity === "high" ? 50 : intensity === "medium" ? 100 : 200
    const interval = setInterval(() => {
      const glitchProbability =
        intensity === "high" ? 0.3 : intensity === "medium" ? 0.15 : 0.05
      const newText = text
        .split("")
        .map((char) => {
          if (char === " ") return char
          if (Math.random() < glitchProbability) {
            return glitchChars[Math.floor(Math.random() * glitchChars.length)]!
          }
          return char
        })
        .join("")
      setDisplayText(newText)
      setTimeout(() => setDisplayText(text), 30)
    }, intervalTime)
    return () => clearInterval(interval)
  }, [text, intensity, active])

  return (
    <span className={cn("font-mono tracking-wider", className)} aria-label={text}>
      {displayText}
    </span>
  )
}
