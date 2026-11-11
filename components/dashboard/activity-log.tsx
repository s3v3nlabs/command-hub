"use client"

import { useState, useEffect, useRef } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { Badge } from "@/components/ui/badge"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { cn } from "@/lib/utils"
import { Activity, AlertTriangle, CheckCircle, Info, XCircle, Pause, Play } from "lucide-react"

interface ActivityLogProps {
  className?: string
  // In a real implementation, we would add props for real data sources
  demoMode?: boolean
}

interface LogEntry {
  id: string
  timestamp: Date
  type: "info" | "warning" | "error" | "success"
  message: string
  source: string
}

export function ActivityLog({ className, demoMode = true }: ActivityLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const logContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  // Simulate real-time logs in demo mode
  useEffect(() => {
    if (!demoMode || isPaused) return

    const interval = setInterval(() => {
      const logTypes: LogEntry["type"][] = ["info", "warning", "error", "success"]
      const sources = ["System", "Network", "Security", "Database", "API"]
      const messages = [
        "Connection established",
        "Authentication successful",
        "Data sync completed",
        "Warning: High CPU usage detected",
        "Error: Connection timeout",
        "Backup completed successfully",
        "New threat detected",
        "System update available",
        "User session started",
        "Cache cleared",
      ]

      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: logTypes[Math.floor(Math.random() * logTypes.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
      }

      setLogs((prev) => [...prev.slice(-49), newLog]) // Keep last 50 logs
    }, 3000)

    return () => clearInterval(interval)
  }, [demoMode, isPaused])

  const getIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "info":
        return <Info className="w-3 h-3" />
      case "warning":
        return <AlertTriangle className="w-3 h-3" />
      case "error":
        return <XCircle className="w-3 h-3" />
      case "success":
        return <CheckCircle className="w-3 h-3" />
    }
  }

  const getStatusColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "info":
        return "info"
      case "warning":
        return "warning"
      case "error":
        return "error"
      case "success":
        return "success"
    }
  }

  const handleScroll = () => {
    if (logContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
      setAutoScroll(isAtBottom)
    }
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  return (
    <TechPanel
      variant="default"
      cornerAccent
      borderAccent
      title={demoMode ? "ACTIVITY LOG (DEMO)" : "ACTIVITY LOG"}
      className={cn("flex flex-col h-full", className)}
      icon={<Activity className="w-4 h-4" />}
      actions={
        <div className="flex items-center space-x-2">
          {demoMode && (
            <button
              onClick={togglePause}
              className="text-dark-600 hover:text-dark-800 transition-colors"
              title={isPaused ? "Resume demo" : "Pause demo"}
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </button>
          )}
          <Badge variant="outline" className="text-xs">
            {logs.length} ENTRIES
          </Badge>
          <StatusIndicator status={demoMode ? "demo" : "operational"} size="sm" />
        </div>
      }
    >
      {/* Demo Mode Indicator */}
      {demoMode && (
        <div className="px-3 py-1 bg-blue-500/10 border-b border-blue-500/20 text-xs text-blue-600 flex items-center justify-between">
          <span>Demo Mode: Displaying simulated activity data</span>
          <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-600">
            MOCK DATA
          </Badge>
        </div>
      )}

      {/* Scrollable Log Container */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
        onScroll={handleScroll}
      >
        <div className="p-2 space-y-1">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-dark-600">
              <div className="text-center">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">Waiting for activity...</div>
                {demoMode && (
                  <div className="text-xs mt-1 text-blue-500">Demo mode: Simulated logs will appear shortly</div>
                )}
              </div>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start space-x-2 p-2 rounded-sm hover:bg-dark-100/10 transition-colors"
              >
                <div className={cn("flex-shrink-0 mt-0.5", `text-${getStatusColor(log.type)}-500`)}>
                  {getIcon(log.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-dark-600">{log.source}</span>
                    <span className="text-xs text-dark-500">{log.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <div className="text-sm text-dark-800 break-words">{log.message}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && logs.length > 0 && (
        <div className="p-2 border-t border-dark-300/30">
          <button
            onClick={() => {
              setAutoScroll(true)
              if (logContainerRef.current) {
                logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
              }
            }}
            className="w-full text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            ↓ Scroll to bottom
          </button>
        </div>
      )}
    </TechPanel>
  )
}
