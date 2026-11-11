"use client"

/** SignalFrame v2 taskbar — every frame, minimized ones dimmed. Click = focus / restore. */

import { X } from "lucide-react"
import type { Frame } from "@/types/signalframe"

interface FrameTabsProps {
  frames: Frame[]
  minimizedFrames: string[]
  activeFrameId: string | null
  onActivateFrame: (frameId: string) => void
  onRestoreFrame: (frameId: string) => void
  onCloseFrame: (frameId: string) => void
  onMinimizeFrame?: (frameId: string) => void
}

export function FrameTabs({
  frames,
  minimizedFrames,
  activeFrameId,
  onActivateFrame,
  onRestoreFrame,
  onCloseFrame,
  onMinimizeFrame,
}: FrameTabsProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000] flex h-9 items-center gap-1 border-t border-[color:var(--ghost-line)] bg-black/60 px-2 backdrop-blur-md">
      <span className="ghost-label mr-2 hidden whitespace-nowrap sm:inline">tasks</span>
      <div className="ghost-scroll flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {frames.length === 0 && <span className="ghost-label">no frames</span>}
        {frames.map((f) => {
          const min = minimizedFrames.includes(f.id)
          const active = activeFrameId === f.id && !min
          return (
            <div
              key={f.id}
              className="group flex shrink-0 items-center gap-1.5 rounded-[2px] border px-2 py-0.5"
              style={{
                borderColor: active ? "var(--ghost-accent)" : "var(--ghost-line)",
                background: active ? "var(--ghost-accent-soft)" : "transparent",
                opacity: min ? 0.55 : 1,
              }}
            >
              <button
                type="button"
                className="max-w-[140px] truncate font-mono text-[10px] uppercase tracking-[0.1em] text-[color:var(--ghost-ink)]"
                onClick={() => {
                  if (min) onRestoreFrame(f.id)
                  else if (active && onMinimizeFrame) onMinimizeFrame(f.id)
                  else onActivateFrame(f.id)
                }}
                title={min ? "Restore" : active ? "Minimize" : "Focus"}
              >
                {f.title}
              </button>
              <span className="font-mono text-[9px] text-[color:var(--ghost-faint)]">{f.messages.length}</span>
              <button
                type="button"
                className="ghost-icon-btn danger h-4 w-4 opacity-0 group-hover:opacity-100"
                onClick={() => onCloseFrame(f.id)}
                title="Close"
              >
                <X size={10} />
              </button>
            </div>
          )
        })}
      </div>
      <span className="ghost-chip hidden md:inline-flex">lattice_sync:false</span>
    </div>
  )
}
