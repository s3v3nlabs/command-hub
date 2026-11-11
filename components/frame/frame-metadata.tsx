"use client"
import type { FrameMetadata } from "@/types/frame"
import { ChevronRightIcon } from "@/components/ui/icons"

interface FrameMetadataProps {
  metadata: FrameMetadata
  isOpen: boolean
  onToggle: () => void
}

export function FrameMetadataDrawer({ metadata, isOpen, onToggle }: FrameMetadataProps) {
  const getSyncStateColor = (state: FrameMetadata["syncState"]) => {
    switch (state) {
      case "synced":
        return "text-green-400"
      case "syncing":
        return "text-yellow-400"
      case "offline":
        return "text-gray-400"
      case "error":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getMirrorStatusColor = (status: FrameMetadata["mirrorStatus"]) => {
    switch (status) {
      case "active":
        return "text-blue-400"
      case "pending":
        return "text-yellow-400"
      case "inactive":
        return "text-gray-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <div
      className={`absolute right-0 top-0 h-full bg-gray-900/95 border-l border-gray-700/50 transition-all duration-300 ${
        isOpen ? "w-64" : "w-8"
      }`}
    >
      <button
        onClick={onToggle}
        className={`absolute left-0 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-200 transition-transform duration-300 ${
          isOpen ? "rotate-180" : ""
        }`}
      >
        <ChevronRightIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 text-sm">
          <div className="border-b border-gray-700/50 pb-2">
            <h3 className="text-gray-200 font-medium mb-2">Frame Metadata</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wide">Source Ping Count</label>
              <div className="text-gray-200 font-mono">{metadata.sourcePingCount}</div>
            </div>

            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wide">Sync State</label>
              <div className={`font-medium ${getSyncStateColor(metadata.syncState)}`}>{metadata.syncState}</div>
            </div>

            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wide">Mirror Status</label>
              <div className={`font-medium ${getMirrorStatusColor(metadata.mirrorStatus)}`}>
                {metadata.mirrorStatus}
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wide">Timestamp Drift</label>
              <div className="text-gray-200 font-mono">{metadata.timestampDrift}ms</div>
            </div>

            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wide">Last Activity</label>
              <div className="text-gray-200 text-xs">{metadata.lastActivity.toLocaleTimeString()}</div>
            </div>

            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wide">Memory Context</label>
              <div className="text-gray-200 text-xs">{metadata.memoryContext.length} items</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
