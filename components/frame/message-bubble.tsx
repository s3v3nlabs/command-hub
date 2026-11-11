"use client"
import type { FrameMessage } from "@/types/frame"
import { parseMarkdown } from "@/lib/markdown"

interface MessageBubbleProps {
  message: FrameMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === "user"
  const isSystem = message.type === "system"

  const getBubbleStyles = () => {
    if (isSystem) {
      return "bg-gray-800/50 border border-gray-600/50 text-gray-300 text-center text-sm"
    }
    if (isUser) {
      return "bg-blue-600/20 border border-blue-500/30 text-gray-100 ml-auto"
    }
    return "bg-gray-700/30 border border-gray-600/30 text-gray-100"
  }

  return (
    <div className={`max-w-[80%] p-3 rounded-lg ${getBubbleStyles()}`}>
      <div
        className="prose prose-invert prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
      />

      <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
        <span>{message.timestamp.toLocaleTimeString()}</span>
        {message.metadata && (
          <div className="flex items-center gap-2">
            {message.metadata.tokens && <span>{message.metadata.tokens} tokens</span>}
            {message.metadata.latency && <span>{message.metadata.latency}ms</span>}
          </div>
        )}
      </div>
    </div>
  )
}
