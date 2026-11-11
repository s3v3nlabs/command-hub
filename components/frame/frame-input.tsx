"use client"

import type React from "react"
import { useState, useRef, type KeyboardEvent } from "react"
import { SendIcon } from "@/components/ui/icons"

interface FrameInputProps {
  onSendMessage: (content: string) => void
  placeholder?: string
}

export function FrameInput({ onSendMessage, placeholder = "Type your message..." }: FrameInputProps) {
  const [content, setContent] = useState("")
  const [isRawMode, setIsRawMode] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (content.trim()) {
      onSendMessage(content)
      setContent("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)

    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  return (
    <div className="border-t border-gray-700/50 bg-gray-800/30">
      <div className="flex items-center gap-2 p-2 text-xs">
        <button
          onClick={() => setIsRawMode(!isRawMode)}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            isRawMode
              ? "bg-orange-600/20 text-orange-400 border border-orange-500/30"
              : "bg-gray-700/50 text-gray-400 border border-gray-600/30"
          }`}
        >
          {isRawMode ? "Raw Echo" : "Filtered"}
        </button>
        <span className="text-gray-500">{isRawMode ? "Direct relay mode" : "Processed output mode"}</span>
      </div>

      <div className="flex items-end gap-2 p-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-gray-900/50 border border-gray-600/50 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
          rows={1}
        />

        <button
          onClick={handleSend}
          disabled={!content.trim()}
          className="p-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-600/30 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  )
}
