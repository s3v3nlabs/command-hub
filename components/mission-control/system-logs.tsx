"use client"

import { useState, useEffect, useRef } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Terminal, Download, Trash2 } from "lucide-react"

interface SystemLogsProps {
  className?: string
}

interface LogEntry {
  id: string
  timestamp: Date
  level: "DEBUG" | "INFO" | "WARN" | "ERROR"
  component: string
  message: string
}

export function SystemLogs({ className }: SystemLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const [filter, setFilter] = useState<string>("ALL")
  const logContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  // Simulate system logs
  useEffect(() => {
    const interval = setInterval(() => {
      const levels: LogEntry["level"][] = ["DEBUG", "INFO", "WARN", "ERROR"]
      const components = ["CORE", "NET", "AUTH", "DB", "API", "CACHE"]
      const messages = [
        "Process started successfully",
        "Connection pool initialized",
        "Cache miss for key: user_session_123",
        "Authentication token expired",
        "Database query executed in 45ms",
        "Memory usage: 78%",
        "SSL certificate expires in 30 days",
        "Backup process completed",
        "Rate limit exceeded for IP",
        "Service health check passed",
      ]

      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        level: levels[Math.floor(Math.random() * levels.length)],
        component: components[Math.floor(Math.random() * components.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
      }

      setLogs((prev) => [...prev.slice(-99), newLog]) // Keep last 100 logs
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "DEBUG":
        return "text-gray-500"
      case "INFO":
        return "text-blue-400"
      case "WARN":
        return "text-yellow-400"
      case "ERROR":
        return "text-red-400"
    }
  }

  const filteredLogs = filter === "ALL" ? logs : logs.filter((log) => log.level === filter)

  const handleScroll = () => {
    if (logContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
      setAutoScroll(isAtBottom)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  const exportLogs = () => {
    const logText = logs
      .map((log) => `[${log.timestamp.toISOString()}] ${log.level} ${log.component}: ${log.message}`)
      .join("\n")

    const blob = new Blob([logText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `system-logs-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <TechPanel
      variant="default"
      cornerAccent
      borderAccent
      title="SYSTEM LOGS"
      className={cn("flex flex-col h-full", className)}
      icon={<Terminal className="w-4 h-4" />}
      actions={
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {filteredLogs.length} ENTRIES
          </Badge>
          <button
            onClick={exportLogs}
            className="text-dark-600 hover:text-dark-800 transition-colors"
            title="Export Logs"
          >
            <Download className="w-3 h-3" />
          </button>
          <button onClick={clearLogs} className="text-dark-600 hover:text-red-400 transition-colors" title="Clear Logs">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      }
    >
      {/* Filter Controls */}
      <div className="p-2 border-b border-dark-300/30">
        <div className="flex space-x-1">
          {["ALL", "DEBUG", "INFO", "WARN", "ERROR"].map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={cn(
                "px-2 py-1 text-xs rounded transition-colors",
                filter === level
                  ? "bg-blue-600 text-white"
                  : "bg-dark-300 text-dark-600 hover:bg-dark-400 hover:text-dark-800",
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Log Container */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden font-mono text-xs scroll-smooth"
        onScroll={handleScroll}
      >
        <div className="p-2">
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-dark-600">
              <div className="text-center">
                <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">No logs to display</div>
              </div>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="mb-1 hover:bg-dark-100/10 p-1 rounded transition-colors">
                <div className="flex items-start space-x-2">
                  <span className="text-dark-500 flex-shrink-0">{log.timestamp.toLocaleTimeString()}</span>
                  <span className={cn("flex-shrink-0 font-bold", getLevelColor(log.level))}>{log.level}</span>
                  <span className="text-dark-600 flex-shrink-0">{log.component}:</span>
                  <span className="text-dark-800 break-words flex-1">{log.message}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && (
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
