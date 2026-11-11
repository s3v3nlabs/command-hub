"use client"

import type React from "react"

import { useState, useRef, useEffect, type ReactNode } from "react"
import { X, Minus, Maximize2, Minimize2, Move } from "lucide-react"
import { cn } from "@/lib/utils"

interface WindowProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  children: ReactNode
  variant?: "default" | "terminal" | "cyber" | "glass"
  size?: "small" | "medium" | "large" | "fullscreen" | "full"
  onClose?: () => void
  onMinimize?: () => void
  onMaximize?: () => void
  className?: string
  resizable?: boolean
  draggable?: boolean
  initialPosition?: { x: number; y: number }
}

export function Window({
  title,
  subtitle,
  icon,
  children,
  variant = "default",
  size = "medium",
  onClose,
  onMinimize,
  onMaximize,
  className,
  resizable = true,
  draggable = true,
  initialPosition = { x: 100, y: 100 },
}: WindowProps) {
  const [position, setPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const windowRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable || isMaximized) return

    setIsDragging(true)
    const rect = windowRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !draggable) return

    const el = windowRef.current
    const w = el?.offsetWidth ?? 320
    const h = el?.offsetHeight ?? 200
    const rawX = e.clientX - dragOffset.x
    const rawY = e.clientY - dragOffset.y
    const maxX = Math.max(0, window.innerWidth - Math.min(w, window.innerWidth))
    const maxY = Math.max(0, window.innerHeight - Math.min(h, window.innerHeight))
    setPosition({
      x: Math.min(Math.max(0, rawX), maxX),
      y: Math.min(Math.max(0, rawY), maxY),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  const handleMaximize = () => {
    setIsMaximized(!isMaximized)
    onMaximize?.()
  }

  const getVariantStyles = () => {
    switch (variant) {
      case "terminal":
        return "bg-black border-green-500/50 text-green-400"
      case "cyber":
        return "bg-gray-900/95 border-blue-500/50 text-blue-300 backdrop-blur-sm"
      case "glass":
        return "bg-white/10 border-white/20 text-white backdrop-blur-md"
      default:
        return "bg-gray-800/95 border-gray-600 text-gray-100 backdrop-blur-sm"
    }
  }

  const getSizeStyles = () => {
    if (isMaximized) return "w-[100dvw] h-[100dvh] max-w-[100dvw] max-h-[100dvh]"

    switch (size) {
      case "small":
        return "w-[min(24rem,calc(100vw-1.5rem))] h-[min(16rem,70dvh)]"
      case "medium":
        return "w-[min(600px,calc(100vw-1.5rem))] h-[min(400px,75dvh)]"
      case "large":
        return "w-[min(900px,calc(100vw-1.5rem))] h-[min(600px,85dvh)]"
      case "fullscreen":
      case "full":
        return "w-[min(100dvw,100%)] h-[min(100dvh,100%)] max-w-[100dvw] max-h-[100dvh]"
      default:
        return "w-[min(600px,calc(100vw-1.5rem))] h-[min(400px,75dvh)]"
    }
  }

  return (
    <div
      ref={windowRef}
      className={cn(
        "fixed border rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden max-w-[100dvw] max-h-[100dvh]",
        getVariantStyles(),
        getSizeStyles(),
        isDragging && "cursor-move",
        className,
      )}
      style={isMaximized ? { top: 0, left: 0 } : { top: position.y, left: position.x }}
    >
      {/* Window Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2 border-b cursor-move select-none",
          variant === "terminal" ? "border-green-500/30" : "border-gray-600/50",
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <Move className="w-4 h-4 opacity-50" />
          {icon && <span className="mr-1 inline-flex items-center">{icon}</span>}
          <span className="font-mono text-sm font-medium">{title}</span>
          {subtitle && <span className="ml-2 font-mono text-xs text-dark-600">{subtitle}</span>}
        </div>

        <div className="flex items-center space-x-1">
          {onMinimize && (
            <button onClick={onMinimize} className="p-1 rounded hover:bg-white/10 transition-colors">
              <Minus className="w-4 h-4" />
            </button>
          )}

          {onMaximize && (
            <button onClick={handleMaximize} className="p-1 rounded hover:bg-white/10 transition-colors">
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {onClose && (
            <button onClick={onClose} className="p-1 rounded hover:bg-red-500/20 hover:text-red-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Window Content */}
      <div className="flex-1 overflow-auto">{children}</div>

      {/* Resize Handle */}
      {resizable && !isMaximized && (
        <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100">
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r border-b border-current" />
        </div>
      )}
    </div>
  )
}

/** Small icon button for window title bars (was imported by SignalFrame/Drift panels but missing). */
export function WindowAction({
  children,
  onClick,
  title,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  title?: string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={
        "inline-flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white " +
        (className || "")
      }
    >
      {children}
    </button>
  )
}
