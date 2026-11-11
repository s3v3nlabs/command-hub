"use client"

/**
 * SignalFrame v2 window — ghostnode mil-tech glass.
 * Pointer-event drag/resize (mouse, pen, touch), grid snap, magnetic edge snap,
 * drag-to-edge snap zones, double-click maximize, z-order via parent.
 * Geometry is kept local while dragging and committed once on release (perf).
 */

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { X, Minus, Square, Copy as RestoreIcon, Send } from "lucide-react"
import type { Frame } from "@/types/signalframe"
import type { WorkspaceBounds } from "./signal-frame-workspace"
import { FrameToolbar } from "./frame-toolbar"
import {
  type Rect,
  type SnapZone,
  MIN_W,
  MIN_H,
  clamp,
  snapValue,
  magnetSnap,
  detectSnapZone,
  zoneRect,
  clampRect,
} from "@/lib/signalframe/window-geometry"

export type DragFeedback = { zone: SnapZone; guidesX: number[]; guidesY: number[] } | null

interface EnhancedFrameWindowProps {
  frame: Frame
  isActive?: boolean
  bounds?: WorkspaceBounds
  zIndex?: number
  gridSize?: number
  getOtherRects?: (frameId: string) => Rect[]
  onDragFeedback?: (feedback: DragFeedback) => void
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

type Gesture =
  | { kind: "drag"; startX: number; startY: number; orig: Rect }
  | { kind: "resize"; handle: string; startX: number; startY: number; orig: Rect }
  | null

const HANDLES: Array<{ h: string; cls: string }> = [
  { h: "nw", cls: "top-0 left-0 w-3 h-3 cursor-nw-resize" },
  { h: "ne", cls: "top-0 right-0 w-3 h-3 cursor-ne-resize" },
  { h: "sw", cls: "bottom-0 left-0 w-3 h-3 cursor-sw-resize" },
  { h: "se", cls: "bottom-0 right-0 w-3 h-3 cursor-se-resize" },
  { h: "n", cls: "top-0 left-3 right-3 h-1.5 cursor-n-resize" },
  { h: "s", cls: "bottom-0 left-3 right-3 h-1.5 cursor-s-resize" },
  { h: "w", cls: "left-0 top-3 bottom-3 w-1.5 cursor-w-resize" },
  { h: "e", cls: "right-0 top-3 bottom-3 w-1.5 cursor-e-resize" },
]

export function EnhancedFrameWindow({
  frame,
  isActive = false,
  bounds,
  zIndex = 10,
  gridSize = 24,
  getOtherRects,
  onDragFeedback,
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
  snapEnabled,
}: EnhancedFrameWindowProps) {
  const ws = { width: bounds?.width || 800, height: bounds?.height || 600 }
  const [rect, setRect] = useState<Rect>({ ...frame.position, ...frame.size })
  const [gesture, setGesture] = useState<Gesture>(null)
  const [isMaximized, setIsMaximized] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(frame.title)
  const [inputValue, setInputValue] = useState("")
  const prevRect = useRef<Rect | null>(null)
  const pendingZone = useRef<SnapZone>(null)
  const rafRef = useRef<number | undefined>(undefined)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Sync from parent when geometry changes externally (tiling, layout restore, clamp)
  useEffect(() => {
    if (!gesture) setRect({ ...frame.position, ...frame.size })
  }, [frame.position.x, frame.position.y, frame.size.width, frame.size.height, gesture])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [frame.messages.length])

  const commit = useCallback(
    (r: Rect) => {
      onUpdateFrame(frame.id, { position: { x: r.x, y: r.y }, size: { width: r.width, height: r.height } })
    },
    [frame.id, onUpdateFrame],
  )

  const beginDrag = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button,input")) return
    if (e.button !== 0) return
    onActivate(frame.id)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    let orig = rect
    if (isMaximized && prevRect.current) {
      // Un-maximize on drag: keep pointer at same relative x on the restored window
      const restored = prevRect.current
      const relX = (e.clientX - (bounds?.left || 0) - rect.x) / rect.width
      orig = { ...restored, x: e.clientX - (bounds?.left || 0) - restored.width * relX, y: 0 }
      setIsMaximized(false)
      setRect(orig)
    }
    setGesture({ kind: "drag", startX: e.clientX, startY: e.clientY, orig })
  }

  const beginResize = (handle: string) => (e: React.PointerEvent) => {
    if (isMaximized) return
    e.preventDefault()
    e.stopPropagation()
    onActivate(frame.id)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setGesture({ kind: "resize", handle, startX: e.clientX, startY: e.clientY, orig: rect })
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!gesture) return
    const cx = e.clientX
    const cy = e.clientY
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const dx = cx - gesture.startX
      const dy = cy - gesture.startY
      const o = gesture.orig
      if (gesture.kind === "drag") {
        let x = o.x + dx
        let y = o.y + dy
        if (snapEnabled) {
          x = snapValue(x, gridSize)
          y = snapValue(y, gridSize)
        }
        const others = getOtherRects ? getOtherRects(frame.id) : []
        const m = snapEnabled ? magnetSnap({ x, y, width: o.width, height: o.height }, others, ws) : null
        if (m) {
          x = m.x
          y = m.y
        }
        x = clamp(x, 0, Math.max(0, ws.width - o.width))
        y = clamp(y, 0, Math.max(0, ws.height - o.height))
        const localX = cx - (bounds?.left || 0)
        const localY = cy - (bounds?.top || 0)
        const zone = snapEnabled ? detectSnapZone(localX, localY, ws) : null
        pendingZone.current = zone
        onDragFeedback?.({ zone, guidesX: m?.guidesX || [], guidesY: m?.guidesY || [] })
        setRect({ x, y, width: o.width, height: o.height })
      } else {
        const h = gesture.handle
        let { x, y, width, height } = o
        if (h.includes("e")) width = o.width + dx
        if (h.includes("s")) height = o.height + dy
        if (h.includes("w")) {
          width = o.width - dx
          x = o.x + dx
        }
        if (h.includes("n")) {
          height = o.height - dy
          y = o.y + dy
        }
        if (snapEnabled) {
          if (h.includes("e")) width = snapValue(x + width, gridSize) - x
          if (h.includes("s")) height = snapValue(y + height, gridSize) - y
          if (h.includes("w")) {
            const nx = snapValue(x, gridSize)
            width += x - nx
            x = nx
          }
          if (h.includes("n")) {
            const ny = snapValue(y, gridSize)
            height += y - ny
            y = ny
          }
        }
        if (width < MIN_W) {
          if (h.includes("w")) x -= MIN_W - width
          width = MIN_W
        }
        if (height < MIN_H) {
          if (h.includes("n")) y -= MIN_H - height
          height = MIN_H
        }
        x = Math.max(0, x)
        y = Math.max(0, y)
        width = Math.min(width, ws.width - x)
        height = Math.min(height, ws.height - y)
        setRect({ x, y, width, height })
      }
    })
  }

  const endGesture = (e: React.PointerEvent) => {
    if (!gesture) return
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    let final = rect
    const zone = pendingZone.current
    if (gesture.kind === "drag" && zone) {
      prevRect.current = gesture.orig
      final = zoneRect(zone, ws)
      setIsMaximized(zone === "maximize")
    }
    pendingZone.current = null
    onDragFeedback?.(null)
    setGesture(null)
    setRect(final)
    commit(final)
  }

  const toggleMaximize = () => {
    if (isMaximized && prevRect.current) {
      const r = clampRect(prevRect.current, ws)
      setIsMaximized(false)
      setRect(r)
      commit(r)
    } else {
      prevRect.current = rect
      const r = zoneRect("maximize", ws)
      setIsMaximized(true)
      setRect(r)
      commit(r)
    }
  }

  const handleSend = () => {
    const text = inputValue.trim()
    if (!text || frame.isMuted) return
    onSendMessage(frame.id, text)
    setInputValue("")
  }

  const commitTitle = () => {
    const t = titleDraft.trim()
    if (t && t !== frame.title) onUpdateTitle(frame.id, t.slice(0, 80))
    setEditingTitle(false)
  }

  if (frame.isMinimized) return null

  const w = Math.min(rect.width, ws.width)
  const h = Math.min(rect.height, ws.height)

  return (
    <div
      role="dialog"
      aria-label={frame.title}
      className={cn(
        "ghost-glass ghost-brackets absolute flex flex-col overflow-hidden rounded-[2px]",
        isActive && "is-active",
        gesture?.kind === "drag" && "cursor-grabbing select-none",
      )}
      style={{
        left: rect.x,
        top: rect.y,
        width: w,
        height: h,
        zIndex,
        transition: gesture ? "none" : "left 120ms ease-out, top 120ms ease-out, width 120ms ease-out, height 120ms ease-out",
        willChange: gesture ? "left, top, width, height" : undefined,
      }}
      onPointerDown={() => !isActive && onActivate(frame.id)}
    >
      {!isMaximized &&
        HANDLES.map(({ h: hd, cls }) => (
          <div
            key={hd}
            className={cn("absolute z-10 touch-none", cls)}
            onPointerDown={beginResize(hd)}
            onPointerMove={onPointerMove}
            onPointerUp={endGesture}
            onPointerCancel={endGesture}
          />
        ))}

      {/* Title bar */}
      <div
        className={cn(
          "ghost-titlebar relative z-[3] flex h-8 shrink-0 touch-none items-center justify-between gap-2 px-2",
          !isMaximized ? "cursor-grab" : "cursor-default",
        )}
        onPointerDown={beginDrag}
        onPointerMove={onPointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest("button,input")) return
          toggleMaximize()
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn("h-1.5 w-1.5 shrink-0 rounded-full", isActive ? "bg-[color:var(--ghost-accent)]" : "bg-white/25")}
          />
          <span className="font-mono text-[10px] text-[color:var(--ghost-faint)]">
            SF-{frame.id.slice(-4).toUpperCase()}
          </span>
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle()
                if (e.key === "Escape") setEditingTitle(false)
              }}
              className="ghost-input h-5 max-w-44 py-0 font-mono text-[11px]"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTitleDraft(frame.title)
                setEditingTitle(true)
              }}
              className="truncate font-mono text-[11px] uppercase tracking-[0.12em] text-[color:var(--ghost-ink)] hover:text-white"
              title="Rename"
            >
              {frame.title}
            </button>
          )}
          {frame.isMuted && <span className="ghost-chip warn">muted</span>}
          {frame.metadata?.mirrorStatus && frame.metadata.mirrorStatus !== "none" && (
            <span className="ghost-chip">{frame.metadata.mirrorStatus}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <FrameToolbar frameId={frame.id} onMirror={onMirror} onFork={onFork} onMute={onMute} onReveal={onReveal} />
          <span className="mx-1 h-3 w-px bg-white/10" />
          <button type="button" className="ghost-icon-btn" title="Minimize" onClick={() => onMinimize(frame.id)}>
            <Minus size={12} />
          </button>
          <button
            type="button"
            className="ghost-icon-btn"
            title={isMaximized ? "Restore (double-click title)" : "Maximize (double-click title)"}
            onClick={toggleMaximize}
          >
            {isMaximized ? <RestoreIcon size={11} /> : <Square size={10} />}
          </button>
          <button type="button" className="ghost-icon-btn danger" title="Close" onClick={() => onClose(frame.id)}>
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="ghost-scroll relative z-[3] min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {frame.messages.map((m) => (
          <div key={m.id} className={cn("flex", m.sender === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[86%] rounded-[2px] border px-2.5 py-2",
                m.sender === "user"
                  ? "border-[color:var(--ghost-line-strong)] bg-white/[0.06] text-[color:var(--ghost-ink)]"
                  : m.type === "system"
                    ? "border-dashed border-[color:var(--ghost-line)] bg-transparent text-[color:var(--ghost-dim)]"
                    : "border-[color:var(--ghost-line)] bg-black/30 text-[color:var(--ghost-ink)]",
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--ghost-faint)]">
                <span>{m.sender === "user" ? "operator" : m.type === "system" ? "bus" : "relay"}</span>
                <span>
                  {(() => {
                    const d = new Date(m.timestamp)
                    return isNaN(d.getTime()) ? "" : d.toTimeString().slice(0, 8)
                  })()}
                </span>
              </div>
              <div className="whitespace-pre-wrap break-words text-[12px] leading-relaxed">{m.content}</div>
              {m.metadata?.tokens != null && (
                <div className="mt-1 font-mono text-[9px] text-[color:var(--ghost-faint)]">
                  {Math.round(m.metadata.tokens)} tok
                  {m.metadata.processingTime != null ? ` · ${m.metadata.processingTime}ms` : ""}
                  {m.metadata.model ? ` · ${m.metadata.model}` : ""}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="relative z-[3] shrink-0 border-t border-[color:var(--ghost-line)] bg-black/25 px-2 py-2">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={frame.isMuted ? "Muted — Reveal to send" : "Transmit to mesh…"}
            className="ghost-input font-mono"
            disabled={Boolean(frame.isMuted)}
            aria-label="Message"
          />
          <button
            type="button"
            className="ghost-btn"
            onClick={handleSend}
            disabled={!inputValue.trim() || Boolean(frame.isMuted)}
          >
            <Send size={11} /> TX
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-[color:var(--ghost-faint)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hover:text-[color:var(--ghost-ink)]"
              onClick={() => onToggleInputMode(frame.id, frame.inputMode === "raw" ? "filtered" : "raw")}
              title="Toggle input mode"
            >
              mode:{frame.inputMode || "filtered"}
            </button>
            {frame.preferSeat && <span>seat:{frame.preferSeat}</span>}
            <span>msgs:{frame.messages.length}</span>
          </div>
          <span>
            {Math.round(rect.x)},{Math.round(rect.y)} · {Math.round(w)}×{Math.round(h)}
          </span>
        </div>
      </div>
    </div>
  )
}
