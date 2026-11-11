"use client"
import { MirrorIcon, ForkIcon, MuteIcon, RevealIcon } from "@/components/ui/icons"
import { frameBridge } from "@/lib/bridge"

interface FrameToolbarProps {
  frameId: string
  onMirror?: () => void
  onFork?: () => void
  onMute?: () => void
  onReveal?: () => void
}

export function FrameToolbar({ frameId, onMirror, onFork, onMute, onReveal }: FrameToolbarProps) {
  const handleMirror = async () => {
    await frameBridge.mirrorFrame(frameId, "target_frame_placeholder")
    onMirror?.()
  }

  const handleFork = async () => {
    const newFrameId = await frameBridge.forkFrame(frameId)
    console.log("[Toolbar] Forked to:", newFrameId)
    onFork?.()
  }

  const handleMute = () => {
    console.log("[Toolbar] Mute toggled for frame:", frameId)
    onMute?.()
  }

  const handleReveal = () => {
    console.log("[Toolbar] Reveal toggled for frame:", frameId)
    onReveal?.()
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/50 border-b border-gray-700/50">
      <button
        onClick={handleMirror}
        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700/50 rounded transition-colors"
        title="Mirror Frame"
      >
        <MirrorIcon />
      </button>

      <button
        onClick={handleFork}
        className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-700/50 rounded transition-colors"
        title="Fork Frame"
      >
        <ForkIcon />
      </button>

      <button
        onClick={handleMute}
        className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-gray-700/50 rounded transition-colors"
        title="Mute Frame"
      >
        <MuteIcon />
      </button>

      <button
        onClick={handleReveal}
        className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-700/50 rounded transition-colors"
        title="Reveal Context"
      >
        <RevealIcon />
      </button>
    </div>
  )
}
