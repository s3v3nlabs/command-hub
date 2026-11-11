"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface TimestampFooterProps {
  className?: string
  showLive?: boolean
}

export function TimestampFooter({ className, showLive = true }: TimestampFooterProps) {
  const [timestamp, setTimestamp] = useState("")

  useEffect(() => {
    const update = () => {
      setTimestamp(new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC")
    }
    update()
    if (!showLive) return
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [showLive])

  return (
    <div
      className={cn(
        "w-full py-2 text-center border-t border-white/20",
        "font-mono text-xs tracking-wider text-white/40",
        className,
      )}
    >
      <span className="mr-4">TIMESTAMP:</span>
      <span>{timestamp}</span>
    </div>
  )
}
