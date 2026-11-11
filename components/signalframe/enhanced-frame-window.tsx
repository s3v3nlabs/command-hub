"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  ChevronDown,
  Brain,
  Zap,
  MessageSquare,
  Move,
  ExternalLink,
} from "lucide-react"
import { useResonance } from "@/hooks/useResonance"
import { Badge } from "@/components/ui/badge"
import { TechButton } from "@/components/ui/tech-button"
import type { Frame } from "@/types/signalframe"
import type { WorkspaceBounds } from "./signal-frame-workspace"
import { FrameToolbar } from "./frame-toolbar"

interface EnhancedFrameWindowProps {
  frame: Frame
  isActive?: boolean
  bounds?: WorkspaceBounds
  onActivate: (frameId: string) => void
  onClose: (frameId: string) => void
  onUpdateTitle: (frameId: string, title: string) => void
  onSendMessage: (frameId: string, message: string) => void
  onToggleInputMode: (frameId: string, mode: "filtered" | "raw") => void
  onMirror: (frameId: string) => void
  onFork: (frameId: string) => void
  onMute: (frameId: string) => void
  onReveal: (frameId: string) => void
  onUpdateFrame: (frameId: string, updates: Partial<Frame>) => void
  onMinimize: (frameId: string) => void
  onDetach?: (frameId: string) => void
  snapEnabled: boolean
}

function ConsciousnessGlyph({ className, animate = false }: { className?: string; animate?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-white/60", className)}>
      <div className={cn("font-mono text-sm leading-none", animate && "animate-pulse")}>
        <div className="text-center">∿◊∿</div>
        <div className="text-center">╱ ∞ ╲</div>
        <div className="text-center">◊ ∞ ◊</div>
        <div className="text-center">╲ ∞ ╱</div>
        <div className="text-center">∿◊∿</div>
      </div>
    </div>
  )
}

export function EnhancedFrameWindow({
  frame,
  isActive = false,
  bounds,
  onActivate,
  onClose,
  onUpdateTitle,
  onSendMessage,
  onToggleInputMode,
  onMirror,
  onFork,
  onMute,
  onReveal,
  onUpdateFrame,
  onMinimize,
  onDetach,
  snapEnabled,
}: EnhancedFrameWindowProps) {
  const [position, setPosition] = useState(frame.position)
  const [size, setSize] = useState(frame.size)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isMaximized, setIsMaximized] = useState(false)
  const [isMinimized, setIsMinimized] = useState(frame.isMinimized || false)
  const [isFloating, setIsFloating] = useState(false)
  const [previousState, setPreviousState] = useState({ position: frame.position, size: frame.size })
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [pulseRipple, setPulseRipple] = useState(false)
  const [breathOpacity, setBreathOpacity] = useState(1)
  const [inputValue, setInputValue] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [adaptationSuggestion, setAdaptationSuggestion] = useState<string | null>(null)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)

  const windowRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()

  const workspaceW = bounds?.width || 800
  const workspaceH = bounds?.height || 600
  const originX = bounds?.left || 0
  const originY = bounds?.top || 0

  const { pulse, isResonating, fieldCoherence, emergentProperties } = useResonance(
    `frame-${frame.id}`,
    `Frame ${frame.title}`,
    42 + (frame.id.charCodeAt(0) % 20),
  )

  // Sync from parent when frame geometry changes externally
  useEffect(() => {
    if (!isDragging && !isResizing && !isMaximized) {
      setPosition(frame.position)
      setSize(frame.size)
    }
  }, [frame.position.x, frame.position.y, frame.size.width, frame.size.height, isDragging, isResizing, isMaximized])

  // Subtle breath — stay readable
  useEffect(() => {
    const breathInterval = setInterval(() => {
      setBreathOpacity((prev) => (prev === 1 ? 0.94 : 1))
    }, 3200)
    return () => clearInterval(breathInterval)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [frame.messages])

  useEffect(() => {
    if (fieldCoherence > 0.8 && frame.messages.length > 5 && Math.random() < 0.2) {
      const suggestions = [
        "Suggest creating a memory thread from this conversation?",
        "Would you like to fork this frame for deeper analysis?",
        "Recommend saving this pattern to symbolic memory?",
      ]
      setAdaptationSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)])
    }
  }, [fieldCoherence, frame.messages.length])

  const clampPos = useCallback(
    (x: number, y: number, w: number, h: number) => {
      const maxX = Math.max(0, workspaceW - w)
      const maxY = Math.max(0, workspaceH - h)
      let nx = Math.max(0, Math.min(maxX, x))
      let ny = Math.max(0, Math.min(maxY, y))
      if (snapEnabled) {
        const g = 24
        nx = Math.round(nx / g) * g
        ny = Math.round(ny / g) * g
        nx = Math.max(0, Math.min(maxX, nx))
        ny = Math.max(0, Math.min(maxY, ny))
      }
      return { x: nx, y: ny }
    },
    [workspaceW, workspaceH, snapEnabled],
  )

  const handleSendMessage = () => {
    const text = inputValue.trim()
    if (!text || isSending) return
    setIsSending(true)
    onSendMessage(frame.id, text)
    setInputValue("")
    pulse({ amplitude: 0.7, hz: 44 })
    // Brief local busy state; hook updates messages async
    setTimeout(() => setIsSending(false), 350)
  }

  const handleAdaptationSuggestion = (accept: boolean) => {
    if (accept && adaptationSuggestion) {
      if (adaptationSuggestion.includes("fork")) onFork(frame.id)
      else if (adaptationSuggestion.includes("mirror")) onMirror(frame.id)
      else pulse({ amplitude: 1.2, hz: 48 })
    }
    setAdaptationSuggestion(null)
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMaximized || isMinimized) return
      const rect = windowRef.current?.getBoundingClientRect()
      if (!rect) return
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
      pulse({ amplitude: 0.6, hz: 42 })
    },
    [isMaximized, isMinimized, pulse],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && !isMaximized && !isMinimized) {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = requestAnimationFrame(() => {
          // Convert viewport mouse → workspace-local coordinates
          const rawX = e.clientX - dragOffset.x - originX
          const rawY = e.clientY - dragOffset.y - originY
          const next = clampPos(rawX, rawY, size.width, size.height)
          setPosition(next)
          onUpdateFrame(frame.id, { position: next })
        })
      }

      if (isResizing && resizeHandle) {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = requestAnimationFrame(() => {
          const localX = e.clientX - originX
          const localY = e.clientY - originY

          let newWidth = size.width
          let newHeight = size.height
          let newX = position.x
          let newY = position.y

          const minW = 280
          const minH = 200

          switch (resizeHandle) {
            case "se":
              newWidth = Math.max(minW, Math.min(workspaceW - position.x, localX - position.x))
              newHeight = Math.max(minH, Math.min(workspaceH - position.y, localY - position.y))
              break
            case "sw":
              newWidth = Math.max(minW, position.x + size.width - localX)
              newHeight = Math.max(minH, Math.min(workspaceH - position.y, localY - position.y))
              newX = Math.min(position.x + size.width - minW, Math.max(0, localX))
              break
            case "ne":
              newWidth = Math.max(minW, Math.min(workspaceW - position.x, localX - position.x))
              newHeight = Math.max(minH, position.y + size.height - localY)
              newY = Math.min(position.y + size.height - minH, Math.max(0, localY))
              break
            case "nw":
              newWidth = Math.max(minW, position.x + size.width - localX)
              newHeight = Math.max(minH, position.y + size.height - localY)
              newX = Math.min(position.x + size.width - minW, Math.max(0, localX))
              newY = Math.min(position.y + size.height - minH, Math.max(0, localY))
              break
            case "n":
              newHeight = Math.max(minH, position.y + size.height - localY)
              newY = Math.min(position.y + size.height - minH, Math.max(0, localY))
              break
            case "s":
              newHeight = Math.max(minH, Math.min(workspaceH - position.y, localY - position.y))
              break
            case "e":
              newWidth = Math.max(minW, Math.min(workspaceW - position.x, localX - position.x))
              break
            case "w":
              newWidth = Math.max(minW, position.x + size.width - localX)
              newX = Math.min(position.x + size.width - minW, Math.max(0, localX))
              break
          }

          setSize({ width: newWidth, height: newHeight })
          setPosition({ x: newX, y: newY })
          onUpdateFrame(frame.id, {
            size: { width: newWidth, height: newHeight },
            position: { x: newX, y: newY },
          })
        })
      }
    },
    [
      isDragging,
      isResizing,
      resizeHandle,
      dragOffset,
      size,
      position,
      frame.id,
      onUpdateFrame,
      isMaximized,
      isMinimized,
      originX,
      originY,
      workspaceW,
      workspaceH,
      clampPos,
    ],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
  }, [])

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  const handleMaximize = () => {
    if (isMaximized) {
      setPosition(previousState.position)
      setSize(previousState.size)
      onUpdateFrame(frame.id, { position: previousState.position, size: previousState.size })
      setIsMaximized(false)
    } else {
      setPreviousState({ position, size })
      const nextPos = { x: 8, y: 8 }
      const nextSize = {
        width: Math.max(280, workspaceW - 16),
        height: Math.max(200, workspaceH - 16),
      }
      setPosition(nextPos)
      setSize(nextSize)
      onUpdateFrame(frame.id, { position: nextPos, size: nextSize })
      setIsMaximized(true)
    }
    pulse({ amplitude: 1.0, hz: 48 })
  }

  const handleMinimize = () => {
    setIsMinimized(!isMinimized)
    onMinimize(frame.id)
    pulse({ amplitude: 0.8, hz: 40 })
  }

  const handleDetach = () => {
    setIsFloating(!isFloating)
    if (onDetach) onDetach(frame.id)
    pulse({ amplitude: 1.2, hz: 50 })
  }

  const handleResizeStart = (handle: string) => (e: React.MouseEvent) => {
    if (isMaximized || isMinimized) return
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeHandle(handle)
    pulse({ amplitude: 0.6, hz: 44 })
  }

  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: contentRef.current.scrollHeight, behavior: "smooth" })
    }
    setPulseRipple(true)
    setTimeout(() => setPulseRipple(false), 300)
  }

  // Minimized chip is handled by FrameTabs — hide window body
  if (isMinimized) {
    return null
  }

  return (
    <div
      ref={windowRef}
      className={cn(
        "absolute signalframe-glass rounded-sm overflow-hidden transition-all duration-200",
        "bg-black/45 backdrop-blur-md",
        isActive
          ? "border-[color:var(--hub-accent-border)] shadow-glow-md ring-1 ring-[color:var(--hub-accent-soft)]"
          : "border-white/15 hover:border-white/30",
        isDragging && "cursor-grabbing",
        isResizing && "cursor-nw-resize",
        isFloating && "z-50 ring-2 ring-purple-500/30",
      )}
      style={{
        left: position.x,
        top: position.y,
        width: Math.min(size.width, workspaceW),
        height: Math.min(size.height, workspaceH),
        zIndex: isActive ? 50 : isFloating ? 45 : 10,
        opacity: breathOpacity,
        transition: isDragging || isResizing ? "none" : "opacity 3s ease-in-out",
      }}
      onClick={() => onActivate(frame.id)}
    >
      {/* Resize handles */}
      {!isMaximized && (
        <>
          <div className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-10" onMouseDown={handleResizeStart("nw")} />
          <div className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-10" onMouseDown={handleResizeStart("ne")} />
          <div className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-10" onMouseDown={handleResizeStart("sw")} />
          <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-10" onMouseDown={handleResizeStart("se")} />
          <div className="absolute top-0 left-3 right-3 h-1 cursor-n-resize z-10" onMouseDown={handleResizeStart("n")} />
          <div className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize z-10" onMouseDown={handleResizeStart("s")} />
          <div className="absolute left-0 top-3 bottom-3 w-1 cursor-w-resize z-10" onMouseDown={handleResizeStart("w")} />
          <div className="absolute right-0 top-3 bottom-3 w-1 cursor-e-resize z-10" onMouseDown={handleResizeStart("e")} />
        </>
      )}

      {/* Soft glass sheen */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/[0.02] pointer-events-none",
          fieldCoherence > 0.8 && "from-purple-500/10 via-transparent to-blue-500/5",
        )}
      />

      {/* Header */}
      <div
        ref={headerRef}
        className={cn(
          "relative z-[3] flex items-center justify-between px-4 py-2 border-b border-white/15 bg-black/35 backdrop-blur-md",
          !isMaximized && "cursor-grab active:cursor-grabbing",
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-200 shrink-0",
              isResonating ? "bg-blue-400 animate-pulse shadow-glow-sm" : "bg-white/40",
            )}
          />
          <ConsciousnessGlyph className="w-6 h-6 shrink-0" animate={isResonating} />
          <span className="text-white/85 font-mono text-sm tracking-wide select-none truncate max-w-48">
            {frame.title}
          </span>
          {fieldCoherence > 0.8 && (
            <Badge variant="outline" className="text-xs text-purple-400 border-purple-400/30">
              COHERENT
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {frame.isMuted && (
            <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/40">
              MUTED
            </Badge>
          )}
          {frame.metadata?.mirrorStatus && frame.metadata.mirrorStatus !== "none" && (
            <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-400/40">
              {frame.metadata.mirrorStatus.toUpperCase()}
            </Badge>
          )}
          <FrameToolbar
            frameId={frame.id}
            onMirror={onMirror}
            onFork={onFork}
            onMute={onMute}
            onReveal={onReveal}
          />
          <TechButton
            onClick={handleDetach}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            title={isFloating ? "Dock window" : "Float window"}
          >
            {isFloating ? (
              <Move size={12} className="text-purple-400" />
            ) : (
              <ExternalLink size={12} className="text-white/60 hover:text-white/80" />
            )}
          </TechButton>
          <TechButton onClick={handleMinimize} size="sm" variant="ghost" className="h-6 w-6 p-0">
            <Minimize2 size={12} className="text-white/60 hover:text-white/80" />
          </TechButton>
          <TechButton onClick={handleMaximize} size="sm" variant="ghost" className="h-6 w-6 p-0">
            {isMaximized ? (
              <RotateCcw size={12} className="text-white/60 hover:text-white/80" />
            ) : (
              <Maximize2 size={12} className="text-white/60 hover:text-white/80" />
            )}
          </TechButton>
          <TechButton
            onClick={() => onClose(frame.id)}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:bg-red-500/20"
          >
            <X size={12} className="text-white/60 hover:text-red-400" />
          </TechButton>
        </div>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="relative z-[3] flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent p-4 space-y-3"
        style={{ height: Math.max(80, Math.min(size.height, workspaceH) - 120) }}
      >
        {frame.messages.map((message) => (
          <div key={message.id} className={cn("flex", message.sender === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-sm p-3 backdrop-blur-md",
                message.sender === "user"
                  ? "bg-blue-500/25 border border-blue-500/35 text-blue-100"
                  : message.type === "system"
                    ? "bg-amber-500/10 border border-amber-500/25 text-amber-100/90"
                    : "bg-white/10 border border-white/15 text-white/90",
              )}
            >
              {message.sender === "ai" && (
                <div className="flex items-center space-x-2 mb-2">
                  <Brain size={14} className="text-purple-400" />
                  <span className="text-xs text-white/60 font-mono">
                    {message.type === "system" ? "WHISPER BUS" : "RELAY"}
                  </span>
                </div>
              )}
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              {message.metadata?.tokens != null && (
                <div className="text-xs text-white/40 mt-2 font-mono">
                  {Math.round(message.metadata.tokens)} tokens
                  {message.metadata.processingTime != null ? ` · ${message.metadata.processingTime}ms` : ""}
                </div>
              )}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="bg-white/10 border border-white/15 rounded-sm p-3 backdrop-blur-md">
              <div className="flex items-center space-x-2">
                <Brain size={14} className="text-purple-400 animate-pulse" />
                <span className="text-sm text-white/80">Relaying whisper…</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {adaptationSuggestion && (
        <div className="absolute top-12 right-4 z-[4] bg-purple-500/20 border border-purple-500/30 rounded-sm p-3 backdrop-blur-md max-w-64">
          <div className="flex items-start space-x-2">
            <Zap size={14} className="text-purple-400 mt-0.5" />
            <div>
              <div className="text-xs text-purple-300 font-mono mb-1">SUGGESTION</div>
              <div className="text-sm text-white/90 mb-2">{adaptationSuggestion}</div>
              <div className="flex space-x-2">
                <TechButton onClick={() => handleAdaptationSuggestion(true)} size="sm" className="text-xs">
                  ACCEPT
                </TechButton>
                <TechButton
                  onClick={() => handleAdaptationSuggestion(false)}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  DISMISS
                </TechButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="relative z-[3] border-t border-white/15 bg-black/35 backdrop-blur-md p-3">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder={frame.isMuted ? "Frame muted — Reveal to send…" : "Whisper to mesh (persists via team bus)…"}
              className="w-full bg-black/40 border border-white/20 rounded-sm px-3 py-2 text-white/90 placeholder-white/40 text-sm focus:outline-none focus:border-[color:var(--hub-accent-border)] focus:bg-black/50"
              disabled={isSending || Boolean(frame.isMuted)}
            />
            <MessageSquare size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40" />
          </div>
          <TechButton onClick={handleSendMessage} disabled={!inputValue.trim() || isSending} size="sm" className="px-4">
            SEND
          </TechButton>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-white/45">
          <div className="flex items-center space-x-3">
            <span>Field: {(fieldCoherence * 100).toFixed(1)}%</span>
            <span>Mode: {frame.inputMode?.toUpperCase() || "FILTERED"}</span>
            <span className="text-amber-400/80">lattice_sync:false</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className={cn("w-2 h-2 rounded-full", isResonating ? "bg-green-400 animate-pulse" : "bg-gray-500")} />
            <span>∿◊∿</span>
          </div>
        </div>
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className={cn(
            "absolute bottom-20 right-4 z-[4] w-8 h-8 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded-full",
            "flex items-center justify-center transition-all duration-200 backdrop-blur-sm shadow-glow-sm",
            pulseRipple && "animate-ping",
          )}
        >
          <ChevronDown size={14} className="text-blue-400" />
        </button>
      )}

      {pulseRipple && (
        <div className="absolute inset-0 border border-blue-400/60 rounded-sm animate-ping pointer-events-none z-[5]" />
      )}
    </div>
  )
}
