"use client"

import { useState, useCallback, useMemo } from "react"
import type { Frame } from "@/types/frame"
import { FrameWindow } from "@/components/frame/frame-window"
import { useFrame } from "@/hooks/useFrame"

interface FrameManagerProps {
  initialFrames?: Frame[]
}

export function FrameManager({ initialFrames = [] }: FrameManagerProps) {
  const [frames, setFrames] = useState<Frame[]>(initialFrames)
  const [activeFrameId, setActiveFrameId] = useState<string | null>(null)

  // Pre-calculate frame hooks outside the map function
  const frameHooks = useMemo(() => {
    return frames.map((frame) => useFrame(frame))
  }, [frames])

  const createNewFrame = useCallback(() => {
    const newFrame: Frame = {
      id: `frame_${Date.now()}`,
      title: `Frame ${frames.length + 1}`,
      messages: [],
      metadata: {
        sourcePingCount: 0,
        syncState: "offline",
        mirrorStatus: "inactive",
        timestampDrift: 0,
        lastActivity: new Date(),
        memoryContext: [],
      },
      isActive: true,
      position: {
        x: 100 + frames.length * 50,
        y: 100 + frames.length * 50,
      },
      size: { width: 600, height: 500 },
    }

    setFrames((prev) => prev.map((f) => ({ ...f, isActive: false })).concat(newFrame))
    setActiveFrameId(newFrame.id)
  }, [frames.length])

  const closeFrame = useCallback(
    (frameId: string) => {
      setFrames((prev) => prev.filter((f) => f.id !== frameId))
      if (activeFrameId === frameId) {
        setActiveFrameId(null)
      }
    },
    [activeFrameId],
  )

  const updateFrame = useCallback((frameId: string, updates: Partial<Frame>) => {
    setFrames((prev) => prev.map((f) => (f.id === frameId ? { ...f, ...updates } : f)))
  }, [])

  const activateFrame = useCallback((frameId: string) => {
    setFrames((prev) =>
      prev.map((f) => ({
        ...f,
        isActive: f.id === frameId,
      })),
    )
    setActiveFrameId(frameId)
  }, [])

  return (
    <div className="relative w-full h-full">
      {/* Frame Creation Button */}
      <button
        onClick={createNewFrame}
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-600/30 hover:text-blue-300 transition-colors"
      >
        + New Frame
      </button>

      {/* Frame Windows */}
      {frames.map((frame, index) => {
        const frameHook = frameHooks[index]

        return (
          <div key={frame.id} onClick={() => activateFrame(frame.id)}>
            <FrameWindow
              frame={frameHook.frame}
              onUpdateTitle={frameHook.updateTitle}
              onSendMessage={frameHook.addMessage}
              onClose={() => closeFrame(frame.id)}
              onPositionChange={frameHook.setPosition}
              onSizeChange={frameHook.setSize}
            />
          </div>
        )
      })}

      {/* Frame Counter */}
      <div className="fixed bottom-4 left-4 z-50 px-3 py-1 bg-gray-900/80 border border-gray-700/50 rounded text-gray-400 text-sm">
        {frames.length} active frames
      </div>
    </div>
  )
}
