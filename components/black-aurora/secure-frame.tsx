"use client"

/**
 * SecureFrame — UX deterrent only.
 * Browser screenshot / blur-destroy is NOT truly enforceable.
 * Real controls: single-use tokens, server expiry/revoke, Cache-Control: no-store.
 * See lib/black-aurora/mode.ts SCREENSHOT_HONESTY + docs/black-aurora.
 */

import { useEffect, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SecureFrameProps {
  children: ReactNode
  className?: string
  onDestroy?: () => void
  autoDestroyOnBlur?: boolean
}

export function SecureFrame({
  children,
  className,
  onDestroy,
  autoDestroyOnBlur = true,
}: SecureFrameProps) {
  const [isDestroyed, setIsDestroyed] = useState(false)
  const [isBlurred, setIsBlurred] = useState(false)

  useEffect(() => {
    if (!autoDestroyOnBlur) return
    const destroy = () => {
      setIsBlurred(true)
      setTimeout(() => {
        setIsDestroyed(true)
        onDestroy?.()
      }, 100)
    }
    const onVis = () => {
      if (document.hidden) destroy()
    }
    document.addEventListener("visibilitychange", onVis)
    window.addEventListener("blur", destroy)
    return () => {
      document.removeEventListener("visibilitychange", onVis)
      window.removeEventListener("blur", destroy)
    }
  }, [autoDestroyOnBlur, onDestroy])

  useEffect(() => {
    const preventCapture = (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && e.shiftKey && e.key === "S") ||
        (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5"))
      ) {
        e.preventDefault()
        setIsBlurred(true)
      }
    }
    document.addEventListener("keydown", preventCapture)
    return () => document.removeEventListener("keydown", preventCapture)
  }, [])

  if (isDestroyed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center min-h-[200px] border border-white/20",
          className,
        )}
      >
        <div className="text-center space-y-2">
          <p className="font-mono text-white/50 tracking-widest text-sm">[CONTENT DESTROYED]</p>
          <p className="font-mono text-white/30 text-xs">
            Session terminated due to security protocol
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative ba-no-select",
        isBlurred && "filter blur-lg transition-all duration-100",
        className,
      )}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </div>
  )
}
