"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface TerminalTextProps {
  text: string
  className?: string
  speed?: number
  onComplete?: () => void
  showCursor?: boolean
  delay?: number
}

export function TerminalText({
  text,
  className,
  speed = 50,
  onComplete,
  showCursor = true,
  delay = 0,
}: TerminalTextProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [isComplete, setIsComplete] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    const delayTimer = setTimeout(() => setHasStarted(true), delay)
    return () => clearTimeout(delayTimer)
  }, [delay])

  useEffect(() => {
    if (!hasStarted) return
    if (displayedText.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1))
      }, speed)
      return () => clearTimeout(timer)
    }
    setIsComplete(true)
    onComplete?.()
  }, [displayedText, text, speed, onComplete, hasStarted])

  return (
    <span className={cn("font-mono", className)}>
      {displayedText}
      {showCursor && !isComplete && <span className="ba-cursor-blink ml-0.5">_</span>}
    </span>
  )
}
