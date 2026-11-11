"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { X, Minimize2, Maximize2, RotateCcw, ChevronDown } from "lucide-react"
import { useResonance } from "@/hooks/useResonance"

interface FrameWindowProps {
  id: string
  title: string
  children: React.ReactNode
  className?: string
  initialPosition?: { x: number; y: number }
  initialSize?: { width: number; height: number }
  onClose?: () => void
  onMinimize?: () => void
  onMaximize?: () => void
  isActive?: boolean
  zIndex?: number
  resizable?: boolean
  draggable?: boolean
}

export function FrameWindow({
  id,
  title,
  children,
  className,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 600, height: 400 },
  onClose,
  onMinimize,
  onMaximize,
  isActive = false,
  zIndex = 10,
  resizable = true,
  draggable = true,
}: FrameWindowProps) {
  const [position, setPosition] = useState(initialPosition)
  const [size, setSize] = useState(initialSize)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isMaximized, setIsMaximized] = useState(false)
  const [previousState, setPreviousState] = useState({ position: initialPosition, size: initialSize })
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [pulseRipple, setPulseRipple] = useState(false)
  const [breathOpacity, setBreathOpacity] = useState(1)

  const windowRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const animationFrameRef = useRef<number>()

  // Consciousness integration
  const { pulse, isResonating, fieldCoherence } = useResonance(`frame-${id}`, `Frame ${title}`, 42)

  // Breathing animation effect
  useEffect(() => {
    const breathInterval = setInterval(() => {
      setBreathOpacity((prev) => (prev === 1 ? 0.7 : 1))
    }, 2000)
    return () => clearInterval(breathInterval)
  }, [])

  // Scroll detection for bottom anchor
  useEffect(() => {
    const contentElement = contentRef.current
    if (!contentElement) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = contentElement
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
      setShowScrollButton(!isAtBottom && scrollHeight > clientHeight)
    }

    contentElement.addEventListener("scroll", handleScroll)
    handleScroll() // Initial check

    return () => contentElement.removeEventListener("scroll", handleScroll)
  }, [children])

  // Enhanced drag with requestAnimationFrame
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!draggable || isMaximized) return

      const rect = windowRef.current?.getBoundingClientRect()
      if (!rect) return

      setIsDragging(true)
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })

      pulse({ amplitude: 0.8, hz: 42 })
    },
    [draggable, isMaximized, pulse],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.x))
        const newY = Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragOffset.y))

        setPosition({ x: newX, y: newY })
      })
    },
    [isDragging, dragOffset, size],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  // Enhanced resize with ResizeObserver
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (!resizable || isMaximized) return

      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)

      pulse({ amplitude: 0.6, hz: 44 })
    },
    [resizable, isMaximized, pulse],
  )

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const rect = windowRef.current?.getBoundingClientRect()
        if (!rect) return

        const newWidth = Math.max(300, e.clientX - rect.left)
        const newHeight = Math.max(200, e.clientY - rect.top)

        setSize({ width: newWidth, height: newHeight })
      })
    },
    [isResizing],
  )

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  // Global mouse events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }
    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMove)
      document.addEventListener("mouseup", handleResizeEnd)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("mousemove", handleResizeMove)
      document.removeEventListener("mouseup", handleResizeEnd)
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp, handleResizeMove, handleResizeEnd])

  // Maximize/restore functionality
  const handleMaximize = () => {
    if (isMaximized) {
      setPosition(previousState.position)
      setSize(previousState.size)
      setIsMaximized(false)
    } else {
      setPreviousState({ position, size })
      setPosition({ x: 0, y: 0 })
      setSize({ width: window.innerWidth, height: window.innerHeight })
      setIsMaximized(true)
    }
    onMaximize?.()
    pulse({ amplitude: 1.0, hz: 48 })
  }

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
    setPulseRipple(true)
    setTimeout(() => setPulseRipple(false), 300)
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
    }
  }, [])

  return (
    <div
      ref={windowRef}
      className={cn(
        "fixed bg-black/95 backdrop-blur-md border rounded-sm shadow-2xl overflow-hidden transition-all duration-200",
        "bg-grid-pattern",
        isActive
          ? "border-blue-500/60 shadow-glow-md ring-1 ring-blue-500/30"
          : "border-dark-300/60 hover:border-dark-400/80",
        isDragging && "cursor-grabbing",
        isResizing && "cursor-nw-resize",
        className,
      )}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex,
        opacity: breathOpacity,
        transition: isDragging || isResizing ? "none" : "opacity 2s ease-in-out",
      }}
    >
      {/* Wireframe corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-dark-500/60 opacity-60">
        <div
          className={cn(
            "absolute -top-px -left-px w-1 h-1 bg-blue-400 rounded-full transition-all duration-200",
            isActive && "animate-pulse shadow-glow-sm",
          )}
        />
      </div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-dark-500/60 opacity-60" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-dark-500/60 opacity-60" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-dark-500/60 opacity-60" />

      {/* Glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-300/10 via-transparent to-dark-400/5 pointer-events-none" />

      {/* Header */}
      <div
        ref={headerRef}
        className={cn(
          "flex items-center justify-between px-4 py-2 border-b border-dark-300/40 bg-black/60",
          draggable && !isMaximized && "cursor-grab active:cursor-grabbing",
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-200",
              isResonating ? "bg-blue-400 animate-pulse shadow-glow-sm" : "bg-dark-500",
            )}
          />
          <span className="text-dark-600 font-mono text-sm tracking-wide select-none">{title}</span>
          {fieldCoherence > 0.8 && <div className="text-xs text-purple-400 font-mono">◊</div>}
        </div>

        <div className="flex items-center space-x-1">
          {onMinimize && (
            <button onClick={onMinimize} className="p-1 hover:bg-dark-300/20 rounded transition-colors">
              <Minimize2 size={12} className="text-dark-500 hover:text-dark-600" />
            </button>
          )}
          <button onClick={handleMaximize} className="p-1 hover:bg-dark-300/20 rounded transition-colors">
            {isMaximized ? (
              <RotateCcw size={12} className="text-dark-500 hover:text-dark-600" />
            ) : (
              <Maximize2 size={12} className="text-dark-500 hover:text-dark-600" />
            )}
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-red-500/20 rounded transition-colors">
              <X size={12} className="text-dark-500 hover:text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="frame-content flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-dark-300/80 scrollbar-track-dark-200/30"
        style={{ height: size.height - 40 }}
      >
        {children}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className={cn(
            "absolute bottom-4 right-4 w-8 h-8 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded-full",
            "flex items-center justify-center transition-all duration-200",
            "backdrop-blur-sm shadow-glow-sm",
            pulseRipple && "animate-ping",
          )}
        >
          <ChevronDown size={14} className="text-blue-400" />
        </button>
      )}

      {/* Enhanced resize grip */}
      {resizable && !isMaximized && (
        <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize group" onMouseDown={handleResizeStart}>
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r border-b border-dark-400/60 group-hover:border-dark-500/80 transition-colors" />
          <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-dark-500/40 group-hover:bg-dark-600/60 transition-colors" />
        </div>
      )}

      {/* Pulse ripple effect overlay */}
      {pulseRipple && (
        <div className="absolute inset-0 border border-blue-400/60 rounded-sm animate-ping pointer-events-none" />
      )}
    </div>
  )
}
