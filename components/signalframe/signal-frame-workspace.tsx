"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSignalFrame } from "@/hooks/useSignalFrame"
import { EnhancedFrameWindow } from "./enhanced-frame-window"
import { FrameTemplateMenu } from "./frame-template-menu"
import { ControlPanel } from "./control-panel"
import { FrameTabs } from "./frame-tabs"
import { TechButton } from "@/components/ui/tech-button"
import { Plus, Grid3x3, Grid } from "lucide-react"
import { TeamCollabPanel } from "./team-collab-panel"

export type WorkspaceBounds = {
  width: number
  height: number
  left: number
  top: number
  deviceType: "mobile" | "tablet" | "desktop"
  pixelRatio: number
}

export function SignalFrameWorkspace() {
  const [showTemplateMenu, setShowTemplateMenu] = useState(false)
  const [minimizedFrames, setMinimizedFrames] = useState<string[]>([])
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const workspaceRef = useRef<HTMLDivElement>(null)
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

  const measureWorkspace = useCallback(() => {
    const el = workspaceRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const width = Math.max(0, Math.floor(rect.width))
    const height = Math.max(0, Math.floor(rect.height))
    const pixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1

    let deviceType: "mobile" | "tablet" | "desktop" = "desktop"
    if (width < 768) deviceType = "mobile"
    else if (width < 1024) deviceType = "tablet"

    setBounds({
      width,
      height,
      left: rect.left,
      top: rect.top,
      deviceType,
      pixelRatio,
    })

    // Clamp existing frames into workspace (not viewport)
    frames.forEach((frame) => {
      const maxW = Math.max(280, width - 16)
      const maxH = Math.max(180, height - 16)
      const nextW = Math.min(frame.size.width, maxW)
      const nextH = Math.min(frame.size.height, maxH)
      const nextX = Math.min(Math.max(0, frame.position.x), Math.max(0, width - nextW))
      const nextY = Math.min(Math.max(0, frame.position.y), Math.max(0, height - nextH))

      if (
        nextX !== frame.position.x ||
        nextY !== frame.position.y ||
        nextW !== frame.size.width ||
        nextH !== frame.size.height
      ) {
        updateFrame(frame.id, {
          position: { x: nextX, y: nextY },
          size: { width: nextW, height: nextH },
        })
      }
    })
  }, [frames, updateFrame])

  useEffect(() => {
    measureWorkspace()
    const el = workspaceRef.current
    let ro: ResizeObserver | null = null
    if (el && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => measureWorkspace())
      ro.observe(el)
    }
    window.addEventListener("resize", measureWorkspace)
    return () => {
      window.removeEventListener("resize", measureWorkspace)
      ro?.disconnect()
    }
  }, [measureWorkspace])

  // Initial frame positioning within workspace bounds
  useEffect(() => {
    if (isInitialLoad && frames.length > 0 && bounds.width > 0) {
      const frameWidth = Math.min(520, Math.floor(bounds.width * 0.55))
      const frameHeight = Math.min(400, Math.floor(bounds.height * 0.62))
      const padding = 40
      const cols = Math.max(1, Math.floor((bounds.width - padding) / (frameWidth + padding)))

      frames.forEach((frame, index) => {
        const column = index % cols
        const row = Math.floor(index / cols)
        const xPos = Math.min(padding + column * (frameWidth + padding), Math.max(0, bounds.width - frameWidth))
        const yPos = Math.min(padding + row * (frameHeight + padding), Math.max(0, bounds.height - frameHeight))

        updateFrame(frame.id, {
          position: { x: xPos, y: yPos },
          size: { width: frameWidth, height: frameHeight },
        })
      })

      setIsInitialLoad(false)
    }
  }, [frames, isInitialLoad, bounds.width, bounds.height, updateFrame])

  const handleUpdateTitle = (frameId: string, title: string) => {
    updateFrame(frameId, { title })
  }

  const handleToggleInputMode = (frameId: string, mode: "filtered" | "raw") => {
    updateFrame(frameId, { inputMode: mode })
  }

  const handleCreateFromTemplate = (templateId: string) => {
    if (templateId === "custom") {
      createFrame("Custom Frame")
    } else {
      createFrame(undefined, templateId)
    }
    setShowTemplateMenu(false)
  }

  const handleMinimizeFrame = (frameId: string) => {
    setMinimizedFrames((prev) => (prev.includes(frameId) ? prev : [...prev, frameId]))
  }

  const handleRestoreFrame = (frameId: string) => {
    setMinimizedFrames((prev) => prev.filter((id) => id !== frameId))
    setActiveFrameId(frameId)
  }

  const handleCloseFrame = (frameId: string) => {
    setMinimizedFrames((prev) => prev.filter((id) => id !== frameId))
    deleteFrame(frameId)
  }

  const handleToggleSnap = () => {
    setSnapEnabled(!snapEnabled)
  }

  const visibleFrames = frames.filter((frame) => !minimizedFrames.includes(frame.id))
  const viewportInfo = {
    width: bounds.width,
    height: bounds.height,
    deviceType: bounds.deviceType,
    pixelRatio: bounds.pixelRatio,
  }

  return (
    <div
      ref={workspaceRef}
      className="relative h-full min-h-0 w-full overflow-hidden signalframe-workspace-bg dot-bg"
    >
      {/* Frame Tabs (minimized strip) — absolute inside workspace */}
      <FrameTabs
        frames={frames}
        minimizedFrames={minimizedFrames}
        activeFrameId={activeFrameId}
        onActivateFrame={setActiveFrameId}
        onRestoreFrame={handleRestoreFrame}
        onCloseFrame={handleCloseFrame}
      />

      {/* Control Panel — absolute, clamped to workspace */}
      <ControlPanel
        frames={frames}
        viewportInfo={viewportInfo}
        bounds={bounds}
        snapEnabled={snapEnabled}
        onCreateFrame={() => createFrame()}
        onShowTemplateMenu={() => setShowTemplateMenu(true)}
        onExportFrames={exportFrames}
        onClearAllFrames={clearAllFrames}
        onToggleSnap={handleToggleSnap}
      />

      {/* Template Menu */}
      {showTemplateMenu && (
        <FrameTemplateMenu onSelect={handleCreateFromTemplate} onClose={() => setShowTemplateMenu(false)} />
      )}

      {/* Responsive Grid Background with snap indicators */}
      <div className="absolute inset-0 opacity-25 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(${snapEnabled ? "rgba(59, 130, 246, 0.12)" : "rgba(100, 116, 139, 0.08)"} 1px, transparent 1px),
              linear-gradient(90deg, ${snapEnabled ? "rgba(59, 130, 246, 0.12)" : "rgba(100, 116, 139, 0.08)"} 1px, transparent 1px)
            `,
            backgroundSize: bounds.deviceType === "mobile" ? "16px 16px" : "24px 24px",
          }}
        />
      </div>

      {/* ADD-ONLY team collab overlay */}
      <TeamCollabPanel />

      {/* Snap Toggle Button */}
      <div className="absolute bottom-4 right-4 z-30">
        <TechButton
          onClick={handleToggleSnap}
          variant="outline"
          size="sm"
          className="signalframe-glass border-[color:var(--hub-accent-border)]"
          title={snapEnabled ? "Disable grid snap" : "Enable grid snap"}
        >
          {snapEnabled ? <Grid className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
        </TechButton>
      </div>

      {/* Frame Windows — absolute children of workspace */}
      <div
        className="relative h-full min-h-0 w-full"
        style={{ paddingTop: minimizedFrames.length > 0 ? "52px" : "0" }}
      >
        {visibleFrames.map((frame) => (
          <EnhancedFrameWindow
            key={frame.id}
            frame={frame}
            isActive={activeFrameId === frame.id}
            bounds={bounds}
            onActivate={setActiveFrameId}
            onClose={handleCloseFrame}
            onUpdateTitle={handleUpdateTitle}
            onSendMessage={sendMessage}
            onToggleInputMode={handleToggleInputMode}
            onMirror={mirrorFrame}
            onFork={forkFrame}
            onMute={muteFrame}
            onReveal={revealFrame}
            onUpdateFrame={updateFrame}
            onMinimize={handleMinimizeFrame}
            snapEnabled={snapEnabled}
          />
        ))}

        {/* Welcome / empty state (rare — bootstrap usually creates a frame) */}
        {frames.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="cyber-panel signalframe-glass relative rounded-sm border border-[color:var(--hub-accent-border)] p-8 max-w-md">
                <div className="text-4xl mb-4 text-white/60">⚡</div>
                <div className="font-mono text-lg font-bold uppercase tracking-wider text-white/90 mb-2">
                  SIGNALFRAME READY
                </div>
                <div className="text-sm text-white/70 mb-4">
                  Multi-threaded conversational interface initialized.
                  <br />
                  Optimized for {bounds.deviceType} workspace.
                </div>
                <div className="text-xs text-white/50 mb-6">
                  Workspace: {bounds.width}×{bounds.height} · Pixel Ratio: {bounds.pixelRatio}x
                  <br />
                  Snap to Grid: {snapEnabled ? "ENABLED" : "DISABLED"}
                </div>
                <button
                  onClick={() => setShowTemplateMenu(true)}
                  className="w-full px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-sm transition-colors font-mono text-sm uppercase tracking-wider mb-2 backdrop-blur-md"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  SELECT FRAME TEMPLATE
                </button>
                <button
                  onClick={() => createFrame("WhisperMesh")}
                  className="w-full px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-sm transition-colors font-mono text-sm uppercase tracking-wider border border-white/20"
                >
                  CREATE WHISPERMESH FRAME
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
