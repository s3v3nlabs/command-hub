"use client"

import { WindowAction } from "@/components/ui/window"
import { Copy, GitBranch, VolumeX, Eye } from "lucide-react"

interface FrameToolbarProps {
  frameId: string
  onMirror: (frameId: string) => void
  onFork: (frameId: string) => void
  onMute: (frameId: string) => void
  onReveal: (frameId: string) => void
}

export function FrameToolbar({ frameId, onMirror, onFork, onMute, onReveal }: FrameToolbarProps) {
  return (
    <div className="flex items-center space-x-1">
      <WindowAction onClick={() => onMirror(frameId)} title="Mirror Frame">
        <Copy className="w-3 h-3" />
      </WindowAction>
      <WindowAction onClick={() => onFork(frameId)} title="Fork Frame">
        <GitBranch className="w-3 h-3" />
      </WindowAction>
      <WindowAction onClick={() => onMute(frameId)} title="Mute Frame">
        <VolumeX className="w-3 h-3" />
      </WindowAction>
      <WindowAction onClick={() => onReveal(frameId)} title="Reveal Hidden Content">
        <Eye className="w-3 h-3" />
      </WindowAction>
    </div>
  )
}
