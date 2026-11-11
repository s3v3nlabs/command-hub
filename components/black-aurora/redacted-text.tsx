"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface RedactedTextProps {
  text: string
  className?: string
  revealable?: boolean
  revealDuration?: number
}

export function RedactedText({
  text,
  className,
  revealable = false,
  revealDuration = 2000,
}: RedactedTextProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const redactedText = text.replace(/[^\s]/g, "█")

  const handleReveal = () => {
    if (!revealable) return
    setIsRevealed(true)
    setTimeout(() => setIsRevealed(false), revealDuration)
  }

  return (
    <span
      className={cn(
        "font-mono tracking-tight",
        revealable && "cursor-pointer hover:opacity-80",
        className,
      )}
      onClick={handleReveal}
      onKeyDown={(e) => e.key === "Enter" && handleReveal()}
      role={revealable ? "button" : undefined}
      tabIndex={revealable ? 0 : undefined}
      aria-label={revealable ? "Click to reveal redacted text" : "Redacted text"}
    >
      {isRevealed ? text : redactedText}
    </span>
  )
}
