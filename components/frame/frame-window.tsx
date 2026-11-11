"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import type { Frame } from "@/types/frame"
import { FrameToolbar } from "./frame-toolbar"
import { FrameMetadataDrawer } from "./frame-metadata"
import { MessageBubble } from "./message-bubble"
import { FrameInput } from "./frame-input"
import { EditIcon, CloseIcon } from "@/components/ui/icons"

interface FrameWindowProps {
  frame: Frame
  onUpdateTitle: (title: string) => void
  onSendMessage: (content: string) => void
  onClose: () => void
  onPositionChange: (position: { x: number; y: number }) => void
  onSizeChange: (size: { width: number; height: number }) => void
}

export function FrameWindow({
  frame,
  onUpdateTitle,
  onSendMessage,
  onClose,
  onPositionChange,
  onSizeChange,
}: FrameWindowProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState(frame.title)
  const [isMetadataOpen, setIsMetadataOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const windowRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [frame.messages])

  const handleTitleSave = () => {
    onUpdateTitle(tempTitle)
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave()
    } else if (e.key === "Escape") {
      setTempTitle(frame.title)
      setIsEditingTitle(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true)
      const rect = windowRef.current?.getBoundingClientRect()
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onPositionChange({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset, onPositionChange])

  return (
    <div
      ref={windowRef}
      className="absolute bg-gray-900/95 border border-gray-700/50 rounded-lg shadow-2xl backdrop-blur-sm"
      style={{
        left: frame.position.x,
        top: frame.position.y,
        width: frame.size.width,
        height: frame.size.height,
        zIndex: frame.isActive ? 50 : 10,
      }}
    >
      {/* Title Bar */}
      <div
        className="flex items-center justify-between p-3 border-b border-gray-700/50 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 flex-1">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-100 text-sm focus:outline-none focus:border-blue-500"
              autoFocus
            />
          ) : (
            <h2 className="text-gray-100 font-medium">{frame.title}</h2>
          )}

          <button
            onClick={() => setIsEditingTitle(!isEditingTitle)}
            className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <EditIcon className="w-3 h-3" />
          </button>
        </div>

        <button onClick={onClose} className="p-1 text-gray-400 hover:text-red-400 transition-colors">
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Toolbar */}
      <FrameToolbar frameId={frame.id} />

      {/* Main Content Area */}
      <div className="flex h-[calc(100%-8rem)] relative">
        {/* Messages Area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isMetadataOpen ? "mr-64" : "mr-8"}`}>
          <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {frame.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        </div>

        {/* Metadata Drawer */}
        <FrameMetadataDrawer
          metadata={frame.metadata}
          isOpen={isMetadataOpen}
          onToggle={() => setIsMetadataOpen(!isMetadataOpen)}
        />
      </div>

      {/* Input Area */}
      <FrameInput onSendMessage={onSendMessage} />
    </div>
  )
}
