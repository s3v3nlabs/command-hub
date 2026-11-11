"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { TechPanel } from "../ui/tech-panel"
import { Badge } from "../ui/badge"
import { TechButton } from "../ui/tech-button"
import { Search, Clock, Trash2, Download } from "lucide-react"

interface CommandHistoryEntry {
  id: string
  command: string
  timestamp: number
  output?: string
  exitCode?: number
  duration?: number
}

interface CommandHistoryProps {
  className?: string
  maxEntries?: number
  onCommandSelect?: (command: string) => void
}

export function CommandHistory({ className, maxEntries = 100, onCommandSelect }: CommandHistoryProps) {
  const [history, setHistory] = useState<CommandHistoryEntry[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredHistory, setFilteredHistory] = useState<CommandHistoryEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null)

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("terminal_command_history")
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory)
        setHistory(parsed)
        setFilteredHistory(parsed)
      } catch (error) {
        console.error("Failed to parse command history:", error)
      }
    }
  }, [])

  // Save history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("terminal_command_history", JSON.stringify(history))
  }, [history])

  // Filter history based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredHistory(history)
    } else {
      const filtered = history.filter((entry) => entry.command.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredHistory(filtered)
    }
  }, [history, searchQuery])

  // Add command to history
  const addCommand = (command: string, output?: string, exitCode?: number, duration?: number) => {
    const newEntry: CommandHistoryEntry = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      command,
      timestamp: Date.now(),
      output,
      exitCode,
      duration,
    }

    setHistory((prev) => [newEntry, ...prev.slice(0, maxEntries - 1)])
  }

  // Clear all history
  const clearHistory = () => {
    setHistory([])
    setFilteredHistory([])
    setSelectedEntry(null)
  }

  // Export history as JSON
  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `terminal-history-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Format duration
  const formatDuration = (duration?: number) => {
    if (!duration) return null
    if (duration < 1000) return `${duration}ms`
    return `${(duration / 1000).toFixed(2)}s`
  }

  // Get exit code badge variant
  const getExitCodeVariant = (exitCode?: number) => {
    if (exitCode === undefined) return "outline"
    if (exitCode === 0) return "default"
    return "destructive"
  }

  return (
    <TechPanel
      className={cn("flex flex-col", className)}
      title="COMMAND HISTORY"
      cornerAccent
      borderAccent
      actions={
        <div className="flex space-x-2">
          <Badge variant="outline">{filteredHistory.length} ENTRIES</Badge>
          <TechButton variant="outline" size="sm" onClick={exportHistory}>
            <Download size={12} className="mr-1" />
            EXPORT
          </TechButton>
          <TechButton variant="outline" size="sm" onClick={clearHistory}>
            <Trash2 size={12} className="mr-1" />
            CLEAR
          </TechButton>
        </div>
      }
    >
      {/* Search Bar */}
      <div className="flex items-center space-x-2 mb-3 px-1">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-dark-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search command history..."
            className="w-full pl-8 pr-3 py-1.5 bg-dark-100/30 border border-dark-300/30 rounded-sm text-xs font-mono text-dark-800 placeholder-dark-600 focus:outline-none focus:border-dark-400/50"
          />
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-dark-300/80 scrollbar-track-dark-200/30">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-dark-500">
            <Clock size={24} className="mx-auto mb-2 opacity-50" />
            <div className="text-sm">No command history</div>
            <div className="text-xs mt-1">Commands will appear here as you use the terminal</div>
          </div>
        ) : (
          filteredHistory.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "p-2 rounded-sm border transition-all duration-200 cursor-pointer group",
                selectedEntry === entry.id
                  ? "bg-dark-200/20 border-dark-400/50"
                  : "bg-dark-100/10 border-dark-300/20 hover:bg-dark-200/10 hover:border-dark-400/30",
              )}
              onClick={() => {
                setSelectedEntry(entry.id === selectedEntry ? null : entry.id)
                if (onCommandSelect) {
                  onCommandSelect(entry.command)
                }
              }}
            >
              {/* Command and Timestamp */}
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-dark-800 truncate group-hover:text-dark-900">
                    {entry.command}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                  <span className="text-xs text-dark-500 font-mono">{formatTimestamp(entry.timestamp)}</span>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center space-x-2">
                {entry.exitCode !== undefined && (
                  <Badge variant={getExitCodeVariant(entry.exitCode)} className="text-xs">
                    EXIT {entry.exitCode}
                  </Badge>
                )}
                {entry.duration && (
                  <Badge variant="outline" className="text-xs">
                    {formatDuration(entry.duration)}
                  </Badge>
                )}
              </div>

              {/* Expanded Output */}
              {selectedEntry === entry.id && entry.output && (
                <div className="mt-2 pt-2 border-t border-dark-300/20">
                  <div className="text-xs text-dark-600 mb-1 font-mono font-bold">OUTPUT:</div>
                  <div className="bg-dark-100/20 rounded-sm p-2 max-h-32 overflow-y-auto">
                    <pre className="text-xs font-mono text-dark-700 whitespace-pre-wrap">
                      {entry.output.length > 500
                        ? `${entry.output.substring(0, 500)}...\n[Output truncated]`
                        : entry.output}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </TechPanel>
  )
}

// Export singleton instance for global access
export const commandHistory = {
  addCommand: (command: string, output?: string, exitCode?: number, duration?: number) => {
    // This will be replaced by the component instance
    console.log("Command added to history:", { command, output, exitCode, duration })
  },
  getCommands: (): string[] => {
    // Get commands from localStorage
    const saved = localStorage.getItem("terminal_command_history")
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CommandHistoryEntry[]
        return parsed.map((entry) => entry.command)
      } catch {
        return []
      }
    }
    return []
  },
  clear: () => {
    localStorage.removeItem("terminal_command_history")
  },
}
