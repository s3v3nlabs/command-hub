"use client"

import { useState } from "react"
import { ChevronRightIcon } from "./frame-icons"
import type { FrameMetadata } from "@/types/signalframe"

interface FrameMetadataProps {
  metadata: FrameMetadata
}

export function FrameMetadata({ metadata }: FrameMetadataProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "text-green-400"
      case "good":
        return "text-blue-400"
      case "poor":
        return "text-yellow-400"
      case "critical":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <div className="bg-slate-800/50 border-l border-slate-600">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-2 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
      >
        <span className="text-xs font-medium text-slate-300">METADATA</span>
        <ChevronRightIcon className={`w-3 h-3 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
      </button>

      {isExpanded && (
        <div className="p-3 space-y-3 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Ping Count</span>
              <span className="text-slate-200">{metadata.sourcePingCount}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Sync State</span>
              <span className={getStatusColor(metadata.syncState)}>{metadata.syncState.toUpperCase()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Mirror Status</span>
              <span className="text-slate-200">{metadata.mirrorStatus.toUpperCase()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Drift</span>
              <span className="text-slate-200">{metadata.timestampDrift}ms</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Memory</span>
              <span className="text-slate-200">{metadata.memoryUsage.toFixed(1)}MB</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Connection</span>
              <span className={getQualityColor(metadata.connectionQuality)}>
                {metadata.connectionQuality.toUpperCase()}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-600">
              <div className="text-slate-400">Last Activity</div>
              <div className="text-slate-200 text-xs">{metadata.lastActivity.toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
