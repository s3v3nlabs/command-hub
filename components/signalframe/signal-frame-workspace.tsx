"use client"

/**
 * SignalFrame v2 workspace — ghostnode mil-tech window manager.
 * "+" reticle field, transparent glass windows, grid + magnetic snap,
 * drag-to-edge snap zones with preview, tiling presets, z-order,
 * free-slot auto placement, saved layouts, keyboard control.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useSignalFrame } from "@/hooks/useSignalFrame"
import { EnhancedFrameWindow, type DragFeedback } from "./enhanced-frame-window"
import { FrameTemplateMenu } from "./frame-template-menu"
import { ControlPanel } from "./control-panel"
import { FrameTabs } from "./frame-tabs"
import { TeamCollabPanel } from "./team-collab-panel"
import {
  type Rect,
  type SavedLayout,
  type TilePreset,
  tile,
  zoneRect,
  findFreeSlot,
  clampRect,
  toFractional,
  fromFractional,
  loadLayouts,
  saveLayout,
  deleteLayout,
} from "@/lib/signalframe/window-geometry"

export type WorkspaceBounds = {
  width: number
  height: number
  left: number
  top: number
  deviceType: "mobile" | "tablet" | "desktop"
  pixelRatio: number
}

const TOP_BAR = 40
const TASKBAR = 36
const GRID_STEPS = [12, 24, 48]
const PREFS_KEY = "signalframe_prefs_v2"

export function SignalFrameWorkspace() {
  const [showTemplateMenu, setShowTemplateMenu] = useState(false)
  const [minimizedFrames, setMinimizedFrames] = useState<string[]>([])
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [gridSize, setGridSize] = useState(24)
  const [zOrder, setZOrder] = useState<string[]>([])
  const [feedback, setFeedback] = useState<DragFeedback>(null)
  const [layouts, setLayouts] = useState<SavedLayout[]>([])
  const areaRef = useRef<HTMLDivElement>(null)
  const seenIds = useRef<Set<string> | null>(null)
  const [bounds, setBounds] = useState<WorkspaceBounds>({
    width: 0,
    height: 0,
    left: 0,
    top: 0,
    deviceType: "desktop",
    pixelRatio: 1,
  })

  const {
    frames,
    activeFrameId,
    setActiveFrameId,
    createFrame,
    sendMessage,
    updateFrame,
    deleteFrame,
    clearAllFrames,
    exportFrames,
    mirrorFrame,
    forkFrame,
    muteFrame,
    revealFrame,
  } = useSignalFrame()

  // prefs
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}")
      if (typeof p.snap === "boolean") setSnapEnabled(p.snap)
      if (GRID_STEPS.includes(p.grid)) setGridSize(p.grid)
    } catch {
      /* ignore */
    }
    setLayouts(loadLayouts())
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ snap: snapEnabled, grid: gridSize }))
    } catch {
      /* ignore */
    }
  }, [snapEnabled, gridSize])

  const ws = useMemo(() => ({ width: bounds.width, height: bounds.height }), [bounds.width, bounds.height])

  const measure = useCallback(() => {
    const el = areaRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const width = Math.max(0, Math.floor(r.width))
    const height = Math.max(0, Math.floor(r.height))
    setBounds({
      width,
      height,
      left: r.left,
      top: r.top,
      deviceType: width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop",
      pixelRatio: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
    })
  }, [])

  useEffect(() => {
    measure()
    const el = areaRef.current
    const ro = el && typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null
    if (el && ro) ro.observe(el)
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)
    return () => {
      ro?.disconnect()
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure, true)
    }
  }, [measure])

  // Clamp windows when workspace shrinks (remembered layout is otherwise preserved)
  useEffect(() => {
    if (!ws.width || !ws.height) return
    frames.forEach((f) => {
      const r = clampRect({ ...f.position, ...f.size }, ws)
      if (r.x !== f.position.x || r.y !== f.position.y || r.width !== f.size.width || r.height !== f.size.height) {
        updateFrame(f.id, { position: { x: r.x, y: r.y }, size: { width: r.width, height: r.height } })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.width, ws.height, frames.length])

  // z-order bookkeeping + smart placement of newly spawned frames
  useEffect(() => {
    const ids = frames.map((f) => f.id)
    setZOrder((prev) => {
      const kept = prev.filter((id) => ids.includes(id))
      const added = ids.filter((id) => !kept.includes(id))
      return [...kept, ...added]
    })
    if (!ws.width) return
    if (seenIds.current === null) {
      seenIds.current = new Set(ids)
      return
    }
    for (const f of frames) {
      if (seenIds.current.has(f.id)) continue
      seenIds.current.add(f.id)
      const others = frames.filter((o) => o.id !== f.id && !minimizedFrames.includes(o.id)).map((o) => ({ ...o.position, ...o.size }))
      const size = {
        width: Math.min(f.size.width || 520, Math.max(280, ws.width - 16)),
        height: Math.min(f.size.height || 400, Math.max(200, ws.height - 16)),
      }
      const pos = findFreeSlot(size, others, ws, gridSize)
      updateFrame(f.id, { position: pos, size })
      setActiveFrameId(f.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames.map((f) => f.id).join("|"), ws.width])

  const activate = useCallback(
    (id: string) => {
      setActiveFrameId(id)
      setZOrder((prev) => [...prev.filter((x) => x !== id), id])
    },
    [setActiveFrameId],
  )

  const visibleFrames = frames.filter((f) => !minimizedFrames.includes(f.id))

  const getOtherRects = useCallback(
    (id: string): Rect[] =>
      frames.filter((f) => f.id !== id && !minimizedFrames.includes(f.id)).map((f) => ({ ...f.position, ...f.size })),
    [frames, minimizedFrames],
  )

  const setRect = useCallback(
    (id: string, r: Rect) => updateFrame(id, { position: { x: r.x, y: r.y }, size: { width: r.width, height: r.height } }),
    [updateFrame],
  )

  const handleTile = useCallback(
    (preset: TilePreset) => {
      // focus preset puts the active window in the main slot
      const ordered = [...visibleFrames].sort((a, b) => {
        if (preset === "focus") {
          if (a.id === activeFrameId) return -1
          if (b.id === activeFrameId) return 1
        }
        return zOrder.indexOf(a.id) - zOrder.indexOf(b.id)
      })
      const rects = tile(preset, ordered.length, ws)
      ordered.forEach((f, i) => setRect(f.id, rects[i]))
    },
    [visibleFrames, activeFrameId, zOrder, ws, setRect],
  )

  const handleSaveLayout = (name: string) => {
    const rects: Record<string, Rect> = {}
    frames.forEach((f) => (rects[f.id] = { ...f.position, ...f.size }))
    setLayouts(saveLayout({ name, savedAt: new Date().toISOString(), workspace: ws, rects: toFractional(rects, ws) }))
  }

  const handleRestoreLayout = (name: string) => {
    const l = layouts.find((x) => x.name === name)
    if (!l) return
    frames.forEach((f) => {
      const fr = l.rects[f.id]
      if (fr) setRect(f.id, fromFractional(fr, ws))
    })
    setMinimizedFrames((prev) => prev.filter((id) => !l.rects[id]))
  }

  const minimize = useCallback(
    (id: string) => setMinimizedFrames((prev) => (prev.includes(id) ? prev : [...prev, id])),
    [],
  )
  const restore = (id: string) => {
    setMinimizedFrames((prev) => prev.filter((x) => x !== id))
    activate(id)
  }
  const close = useCallback(
    (id: string) => {
      setMinimizedFrames((prev) => prev.filter((x) => x !== id))
      deleteFrame(id)
    },
    [deleteFrame],
  )

  // Keyboard control
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey || !e.altKey) return
      const id = activeFrameId
      const k = e.key
      if (k === "n" || k === "N") {
        e.preventDefault()
        createFrame()
        return
      }
      if (k === "t" || k === "T") {
        e.preventDefault()
        handleTile("grid")
        return
      }
      if (k === "]" || k === "[") {
        e.preventDefault()
        const vis = visibleFrames.map((f) => f.id)
        if (!vis.length) return
        const i = id ? vis.indexOf(id) : -1
        const next = vis[(i + (k === "]" ? 1 : -1) + vis.length) % vis.length]
        activate(next)
        return
      }
      if (!id || !ws.width) return
      if (k === "ArrowLeft") setRect(id, zoneRect("left", ws))
      else if (k === "ArrowRight") setRect(id, zoneRect("right", ws))
      else if (k === "ArrowUp") setRect(id, zoneRect("maximize", ws))
      else if (k === "ArrowDown") {
        const w = Math.min(560, ws.width - 32)
        const h = Math.min(420, ws.height - 32)
        setRect(id, { x: Math.round((ws.width - w) / 2), y: Math.round((ws.height - h) / 2), width: w, height: h })
      } else if (k === "m" || k === "M") minimize(id)
      else if (k === "w" || k === "W") close(id)
      else return
      e.preventDefault()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [activeFrameId, visibleFrames, ws, createFrame, handleTile, activate, setRect, minimize, close])

  const handleCreateFromTemplate = (templateId: string) => {
    if (templateId === "custom") createFrame("Custom Frame")
    else createFrame(undefined, templateId)
    setShowTemplateMenu(false)
  }

  const previewRect = feedback?.zone ? zoneRect(feedback.zone, ws) : null

  return (
    <div className="ghost-grid-bg relative h-full min-h-0 w-full overflow-hidden" data-snap={snapEnabled ? "on" : "off"}>
      <ControlPanel
        frames={frames}
        viewportInfo={{ width: bounds.width, height: bounds.height, deviceType: bounds.deviceType, pixelRatio: bounds.pixelRatio }}
        bounds={bounds}
        snapEnabled={snapEnabled}
        gridSize={gridSize}
        layouts={layouts}
        onCreateFrame={() => createFrame()}
        onShowTemplateMenu={() => setShowTemplateMenu(true)}
        onExportFrames={exportFrames}
        onClearAllFrames={clearAllFrames}
        onToggleSnap={() => setSnapEnabled((v) => !v)}
        onCycleGrid={() => setGridSize((g) => GRID_STEPS[(GRID_STEPS.indexOf(g) + 1) % GRID_STEPS.length])}
        onTile={handleTile}
        onSaveLayout={handleSaveLayout}
        onRestoreLayout={handleRestoreLayout}
        onDeleteLayout={(n) => setLayouts(deleteLayout(n))}
      />

      {showTemplateMenu && (
        <FrameTemplateMenu onSelect={handleCreateFromTemplate} onClose={() => setShowTemplateMenu(false)} />
      )}

      {/* Window area (between ops bar and taskbar) */}
      <div ref={areaRef} className="absolute left-0 right-0 z-[1]" style={{ top: TOP_BAR, bottom: TASKBAR }}>
        {/* corner telemetry */}
        <div className="pointer-events-none absolute bottom-2 right-3 z-0 text-right font-mono text-[9px] uppercase leading-4 tracking-[0.18em] text-[color:var(--ghost-faint)]">
          <div>ghostnode // signalframe v2</div>
          <div>
            grid {gridSize}px · snap {snapEnabled ? "armed" : "off"} · {visibleFrames.length}/{frames.length} vis
          </div>
        </div>

        {previewRect && (
          <div
            className="ghost-snap-preview"
            style={{ left: previewRect.x, top: previewRect.y, width: previewRect.width, height: previewRect.height }}
          />
        )}
        {feedback?.guidesX.map((x) => <div key={`gx${x}`} className="ghost-guide-x" style={{ left: x }} />)}
        {feedback?.guidesY.map((y) => <div key={`gy${y}`} className="ghost-guide-y" style={{ top: y }} />)}

        {visibleFrames.map((frame) => (
          <EnhancedFrameWindow
            key={frame.id}
            frame={{ ...frame, isMinimized: false }}
            isActive={activeFrameId === frame.id}
            bounds={bounds}
            zIndex={10 + Math.max(0, zOrder.indexOf(frame.id))}
            gridSize={gridSize}
            getOtherRects={getOtherRects}
            onDragFeedback={setFeedback}
            onActivate={activate}
            onClose={close}
            onUpdateTitle={(id, title) => updateFrame(id, { title })}
            onSendMessage={sendMessage}
            onToggleInputMode={(id, mode) => updateFrame(id, { inputMode: mode })}
            onMirror={mirrorFrame}
            onFork={forkFrame}
            onMute={muteFrame}
            onReveal={revealFrame}
            onUpdateFrame={updateFrame}
            onMinimize={minimize}
            snapEnabled={snapEnabled}
          />
        ))}

        {frames.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="ghost-glass ghost-brackets is-active max-w-md p-8 text-center">
              <div className="ghost-label mb-2">signalframe // standby</div>
              <div className="mb-1 font-mono text-sm uppercase tracking-[0.2em] text-[color:var(--ghost-ink)]">
                No frames open
              </div>
              <div className="mb-5 text-xs text-[color:var(--ghost-dim)]">
                Spawn a frame to open an encrypted team channel. Windows snap to the grid, to each other and to screen
                edges.
              </div>
              <div className="flex justify-center gap-2">
                <button type="button" className="ghost-btn" onClick={() => setShowTemplateMenu(true)}>
                  Template
                </button>
                <button type="button" className="ghost-btn" data-on="true" onClick={() => createFrame("WhisperMesh")}>
                  New WhisperMesh frame
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <TeamCollabPanel />

      <FrameTabs
        frames={frames}
        minimizedFrames={minimizedFrames}
        activeFrameId={activeFrameId}
        onActivateFrame={activate}
        onRestoreFrame={restore}
        onCloseFrame={close}
        onMinimizeFrame={minimize}
      />
    </div>
  )
}
