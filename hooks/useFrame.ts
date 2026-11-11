"use client"

import { useState, useCallback } from "react"
import type { Frame, FrameMessage, FrameMetadata } from "@/types/frame"
import { frameBridge } from "@/lib/bridge"

export function useFrame(initialFrame?: Partial<Frame>) {
  const [frame, setFrame] = useState<Frame>(() => ({
    id: initialFrame?.id || `frame_${Date.now()}`,
    title: initialFrame?.title || "New Frame",
    messages: initialFrame?.messages || [],
    metadata: initialFrame?.metadata || {
      sourcePingCount: 0,
      syncState: "offline",
      mirrorStatus: "inactive",
      timestampDrift: 0,
      lastActivity: new Date(),
      memoryContext: [],
    },
    isActive: initialFrame?.isActive || false,
    position: initialFrame?.position || { x: 100, y: 100 },
    size: initialFrame?.size || { width: 600, height: 500 },
  }))

  const updateTitle = useCallback((title: string) => {
    setFrame((prev) => ({ ...prev, title }))
  }, [])

  const addMessage = useCallback(
    async (content: string, type: "user" | "assistant" | "system" = "user") => {
      const message: FrameMessage = {
        id: `msg_${Date.now()}`,
        content,
        timestamp: new Date(),
        type,
      }

      setFrame((prev) => ({
        ...prev,
        messages: [...prev.messages, message],
        metadata: {
          ...prev.metadata,
          lastActivity: new Date(),
        },
      }))

      // Send to bridge
      if (type === "user") {
        await frameBridge.sendMessage(frame.id, content)
      }
    },
    [frame.id],
  )

  const updateMetadata = useCallback((updates: Partial<FrameMetadata>) => {
    setFrame((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, ...updates },
    }))
  }, [])

  const setPosition = useCallback((position: { x: number; y: number }) => {
    setFrame((prev) => ({ ...prev, position }))
  }, [])

  const setSize = useCallback((size: { width: number; height: number }) => {
    setFrame((prev) => ({ ...prev, size }))
  }, [])

  return {
    frame,
    updateTitle,
    addMessage,
    updateMetadata,
    setPosition,
    setSize,
  }
}
