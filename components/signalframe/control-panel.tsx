"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Plus, Grid3X3, Download, Trash2, Monitor, Smartphone, Tablet, Menu, Minimize2 } from "lucide-react"
import type { WorkspaceBounds } from "./signal-frame-workspace"

interface ControlPanelProps {
  frames: any[]
  viewportInfo: any
  bounds?: WorkspaceBounds
  snapEnabled?: boolean
  onCreateFrame: () => void
  onShowTemplateMenu: () => void
  onExportFrames: () => void
  onClearAllFrames: () => void
  onToggleSnap?: () => void
}

export function ControlPanel({
  frames,
  viewportInfo,
  bounds,
  snapEnabled = true,
  onCreateFrame,
  onShowTemplateMenu,
  onExportFrames,
  onClearAllFrames,
  onToggleSnap,
}: ControlPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 16, y: 16 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const panelRef = useRef<HTMLDivElement>(null)
  const maxW = bounds?.width || viewportInfo?.width || 800
  const maxH = bounds?.height || viewportInfo?.height || 600

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const panelW = panelRef.current?.offsetWidth || 300
        const panelH = panelRef.current?.offsetHeight || 200
        const newX = Math.max(0, Math.min(Math.max(0, maxW - panelW), e.clientX - dragStart.x))
        const newY = Math.max(0, Math.min(Math.max(0, maxH - panelH), e.clientY - dragStart.y))
        setPosition({ x: newX, y: newY })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = "none"
      document.body.style.cursor = "grabbing"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
    }
  }, [isDragging, dragStart, maxW, maxH])

  // Keep panel inside workspace when bounds shrink
  useEffect(() => {
    const panelW = panelRef.current?.offsetWidth || 300
    const panelH = panelRef.current?.offsetHeight || 200
    setPosition((prev) => ({
      x: Math.min(prev.x, Math.max(0, maxW - panelW)),
      y: Math.min(prev.y, Math.max(0, maxH - panelH)),
    }))
  }, [maxW, maxH])

  const getDeviceIcon = () => {
    switch (viewportInfo.deviceType) {
      case "mobile":
        return <Smartphone className="w-3 h-3" />
      case "tablet":
        return <Tablet className="w-3 h-3" />
      default:
        return <Monitor className="w-3 h-3" />
    }
  }

  if (isMinimized) {
    return (
      <div
        className="absolute z-50 signalframe-glass rounded-sm p-2 cursor-pointer hover:bg-black/55 transition-all"
        style={{ left: position.x, top: position.y }}
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center space-x-2">
          <Menu className="w-4 h-4 text-white/70" />
          <span className="text-xs font-mono text-white/85">WHISPERMESH</span>
          <Badge variant="info" className="text-xs">
            {frames.length}
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={panelRef}
      className="absolute z-50 cyber-panel signalframe-glass rounded-sm p-3 min-w-[280px]"
      style={{ left: position.x, top: position.y }}
    >
      {/* Draggable Header */}
      <div
        className="flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-white/85 mb-1">WHISPERMESH CONTROL</div>
          <div className="flex items-center space-x-2">
            <Badge variant="info" glow>
              {frames.length} ACTIVE
            </Badge>
            <Badge variant="success" glow>
              SECURE
            </Badge>
            <Badge variant="outline" className="text-xs">
              {viewportInfo.deviceType?.toUpperCase?.() || "DESKTOP"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {getDeviceIcon()}
          <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-white/10 rounded transition-colors">
            <Minimize2 className="w-3 h-3 text-white/60" />
          </button>
          <Grid3X3 className="w-4 h-4 text-white/60" />
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-2">
        <TechButton onClick={onCreateFrame} className="w-full" variant="primary" size="sm">
          <Plus className="w-3 h-3 mr-2" />
          NEW FRAME
        </TechButton>

        <TechButton onClick={onShowTemplateMenu} className="w-full" variant="outline" size="sm">
          FROM TEMPLATE
        </TechButton>

        {frames.length > 0 && (
          <>
            <TechButton onClick={onExportFrames} className="w-full" variant="outline" size="sm">
              <Download className="w-3 h-3 mr-2" />
              EXPORT
            </TechButton>

            <TechButton onClick={onClearAllFrames} className="w-full" variant="danger" size="sm">
              <Trash2 className="w-3 h-3 mr-2" />
              CLEAR ALL
            </TechButton>
          </>
        )}
      </div>

      {/* Viewport Info */}
      <div className="mt-3 pt-2 border-t border-white/10 text-xs text-white/50">
        <div className="flex justify-between">
          <span>Workspace:</span>
          <span>
            {viewportInfo.width}×{viewportInfo.height}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Snap:</span>
          <span>{snapEnabled ? "ON" : "OFF"}</span>
        </div>
        <div className="flex justify-between">
          <span>Pixel Ratio:</span>
          <span>{viewportInfo.pixelRatio}x</span>
        </div>
      </div>
    </div>
  )
}
