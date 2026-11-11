"use client"

import { Badge } from "@/components/ui/badge"
import { X, Maximize2 } from "lucide-react"
import type { Frame } from "@/types/signalframe"

interface FrameTabsProps {
  frames: Frame[]
  minimizedFrames: string[]
  activeFrameId: string | null
  onActivateFrame: (frameId: string) => void
  onRestoreFrame: (frameId: string) => void
  onCloseFrame: (frameId: string) => void
}

export function FrameTabs({
  frames,
  minimizedFrames,
  activeFrameId,
  onActivateFrame,
  onRestoreFrame,
  onCloseFrame,
}: FrameTabsProps) {
  const minimizedFramesList = frames.filter((frame) => minimizedFrames.includes(frame.id))

  if (minimizedFramesList.length === 0) return null

  return (
    <div className="absolute top-0 left-0 right-0 z-40 signalframe-glass border-b border-[color:var(--hub-accent-border)] p-2">
      <div className="flex items-center space-x-2 overflow-x-auto">
        <span className="text-xs font-mono text-white/50 whitespace-nowrap">MINIMIZED:</span>
        {minimizedFramesList.map((frame) => (
          <div
            key={frame.id}
            className={`flex items-center space-x-2 px-3 py-1 rounded-sm border transition-all cursor-pointer group ${
              activeFrameId === frame.id
                ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                : "bg-black/30 border-white/15 text-white/70 hover:bg-black/45"
            }`}
            onClick={() => onActivateFrame(frame.id)}
          >
            <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
            <span className="text-xs font-mono whitespace-nowrap max-w-[120px] truncate">{frame.title}</span>
            <Badge variant="outline" className="text-xs">
              {frame.messages.length}
            </Badge>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRestoreFrame(frame.id)
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-current/20 rounded"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCloseFrame(frame.id)
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
