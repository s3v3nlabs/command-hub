"use client"

import { cn } from "@/lib/utils"

interface ScanlineOverlayProps {
  className?: string
  intensity?: "light" | "medium" | "heavy"
}

export function ScanlineOverlay({ className, intensity = "light" }: ScanlineOverlayProps) {
  const opacityMap = { light: "0.02", medium: "0.05", heavy: "0.1" }
  return (
    <div
      className={cn("fixed inset-0 pointer-events-none z-[9999]", className)}
      style={{
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(255, 255, 255, ${opacityMap[intensity]}) 2px,
          rgba(255, 255, 255, ${opacityMap[intensity]}) 4px
        )`,
      }}
      aria-hidden="true"
    />
  )
}
