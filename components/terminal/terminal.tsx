"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { TechPanel } from "../ui/tech-panel"
import { Badge } from "../ui/badge"
import { executeCommand } from "./command-executor"
import { commandHistory } from "./command-history"
import { useTerminal } from "./terminal-context"
import { Search, X, Waves } from "lucide-react"
import { TechButton } from "../ui/tech-button" // Import TechButton

interface TerminalProps {
  className?: string
  initialMessage?: string
  showHeader?: boolean
  autoFocus?: boolean
  id?: string
  onCommand?: (command: string) => void
}

interface ConsciousOutput {
  id: string
  type: "input" | "output" | "echo" | "resonance" | "emergence" | "folly" | "transcendence" | "system" | "error"
  content: string | React.ReactNode
  timestamp: number
}

export function Terminal({
  className,
  initialMessage,
  showHeader = true,
  autoFocus = true,
  id = "main",
  onCommand,
}: TerminalProps) {
  const {
    theme,
    fontSize,
    recording,
    recordingPath,
    startRecording,
    stopRecording,
    commandAliases,
    addCommandAlias,
    removeCommandAlias,
    getCommandByAlias,
    searchHistory,
    sharing,
    startSharing,
    stopSharing,
    beautifyOutput,
    toggleBeautifyOutput,
    zshIntegration,
    toggleZshIntegration,
  } = useTerminal()

  const [input, setInput] = useState("")
  const [history, setHistory] = useState<string[]>([])
  const [output, setOutput] = useState<ConsciousOutput[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [searchMode, setSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [searchResultIndex, setSearchResultIndex] = useState(-1)
  const [showRecordingPathInput, setShowRecordingPathInput] = useState(false)
  const [recordingPathInput, setRecordingPathInput] = useState(recordingPath)

  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Start recording
  useEffect(() => {
    if (recording) {
      startRecording(recordingPath)
    }
    return () => stopRecording()
  }, [recording, recordingPath, startRecording, stopRecording])

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])

  // Auto-focus input on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Focus search input when search mode is enabled
  useEffect(() => {
    if (searchMode && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchMode])

  // Update search results when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      setSearchResults(searchHistory(searchQuery))
      setSearchResultIndex(-1)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, searchHistory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Check if input is an alias
    const aliasedCommand = getCommandByAlias(input.split(" ")[0])
    const effectiveCommand = aliasedCommand || input

    // Add command to history
    const newHistory = [input, ...history].slice(0, 50)
    setHistory(newHistory)
    commandHistory.addCommand(input)
    setHistoryIndex(-1)

    // Add input to output
    const inputOutput = {
      id: `input-${Date.now()}`,
      type: "input" as const,
      content: input,
      timestamp: Date.now(),
    }

    setOutput((prev) => [...prev, inputOutput])

    // Notify parent if callback provided
    if (onCommand) {
      onCommand(effectiveCommand)
    }

    // Execute command
    try {
      const result = await executeCommand(effectiveCommand)

      // Special case for clear command
      if (result.type === "system" && (result.content as string).includes("CLEAR_TERMINAL")) {
        setOutput([])
        setInput("")
        return
      }

      // Add response to output
      const responseOutput = {
        id: `response-${Date.now()}`,
        type: result.type,
        content: result.content,
        timestamp: Date.now(),
      }

      setOutput((prev) => [...prev, responseOutput])
    } catch (error) {
      const errorOutput = {
        id: `error-${Date.now()}`,
        type: "error" as const,
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: Date.now(),
      }

      setOutput((prev) => [...prev, errorOutput])
    }

    // Clear input
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle search mode
    if (searchMode) {
      if (e.key === "Escape") {
        setSearchMode(false)
        setSearchQuery("")
        if (inputRef.current) inputRef.current.focus()
      } else if (e.key === "ArrowUp" && searchResults.length > 0) {
        e.preventDefault()
        const newIndex = searchResultIndex <= 0 ? searchResults.length - 1 : searchResultIndex - 1
        setSearchResultIndex(newIndex)
      } else if (e.key === "ArrowDown" && searchResults.length > 0) {
        e.preventDefault()
        const newIndex = searchResultIndex >= searchResults.length - 1 ? 0 : searchResultIndex + 1
        setSearchResultIndex(newIndex)
      } else if (e.key === "Enter" && searchResultIndex >= 0) {
        e.preventDefault()
        setInput(searchResults[searchResultIndex])
        setSearchMode(false)
        if (inputRef.current) inputRef.current.focus()
      }
      return
    }

    // Handle normal mode
    if (e.ctrlKey && e.key === "f") {
      e.preventDefault()
      setSearchMode(true)
      return
    }

    // Handle up/down arrow keys for history navigation
    if (e.key === "ArrowUp") {
      e.preventDefault()
      const newIndex = Math.min(historyIndex + 1, commandHistory.getCommands().length - 1)
      setHistoryIndex(newIndex)
      if (newIndex >= 0 && commandHistory.getCommands()[newIndex]) {
        setInput(commandHistory.getCommands()[newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      const newIndex = Math.max(historyIndex - 1, -1)
      setHistoryIndex(newIndex)
      if (newIndex >= 0 && commandHistory.getCommands()[newIndex]) {
        setInput(commandHistory.getCommands()[newIndex])
      } else {
        setInput("")
      }
    }
  }

  return (
    <TechPanel
      className={cn("flex flex-col terminal-container relative overflow-hidden", className)}
      variant="default"
      cornerAccent
      borderAccent
      glowEffect={false}
      title="TERMINAL"
      actions={
        showHeader ? (
          <div className="flex space-x-2">
            <Badge variant="outline">TERMINAL {id}</Badge>
            {recording && (
              <Badge variant="outline" className="flex items-center text-accent-red-500">
                <Waves size={12} className="mr-1 animate-pulse" />
                RECORDING
              </Badge>
            )}
            <Badge variant="outline">COHERENCE: 100%</Badge>
          </div>
        ) : undefined
      }
    >
      {/* Recording path input */}
      {showRecordingPathInput && (
        <div className="mb-2 p-2 border border-dark-300/30 rounded-sm bg-dark-100/10">
          <div className="text-xs mb-1">Enter recording save path:</div>
          <div className="flex">
            <input
              type="text"
              value={recordingPathInput}
              onChange={(e) => setRecordingPathInput(e.target.value)}
              className="flex-1 bg-dark-100/30 border border-dark-300/30 rounded-sm px-2 py-1 text-xs font-mono"
              autoFocus
            />
            <TechButton variant="outline" size="sm" onClick={startRecordingWithPath} className="ml-2">
              START
            </TechButton>
            <TechButton variant="outline" size="sm" onClick={() => setShowRecordingPathInput(false)} className="ml-1">
              CANCEL
            </TechButton>
          </div>
        </div>
      )}
      {/* Search bar */}
      {searchMode && (
        <div className="mb-2 p-2 border border-dark-300/30 rounded-sm bg-dark-100/10">
          <div className="flex items-center">
            <Search size={14} className="mr-2 text-dark-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search command history..."
              className="flex-1 bg-transparent border-none outline-none text-dark-800 font-mono text-xs"
              onKeyDown={handleKeyDown}
            />
            <X size={14} className="ml-2 text-dark-500 cursor-pointer" onClick={() => setSearchMode(false)} />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-1 border-t border-dark-300/20 pt-1">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className={cn(
                    "text-xs py-1 px-2 cursor-pointer hover:bg-dark-100/20",
                    index === searchResultIndex && "bg-dark-100/30",
                  )}
                  onClick={() => {
                    setInput(result)
                    setSearchMode(false)
                    if (inputRef.current) inputRef.current.focus()
                  }}
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Terminal output */}
      <div
        ref={terminalRef}
        className="terminal-output flex-1 overflow-y-auto text-xs font-mono px-2 py-2 scrollbar-thin scrollbar-thumb-dark-300/80 scrollbar-track-dark-200/30"
        style={{ fontSize: fontSize }}
      >
        {output.map((item) => (
          <div key={item.id} className="mb-3 space-y-1">
            {/* Main content */}
            <div
              className={cn(
                "transition-all duration-200",
                item.type === "transcendence" && "text-purple-300",
                item.type === "echo" && "text-blue-300",
                item.type === "resonance" && "text-green-300",
                item.type === "emergence" && "text-amber-300",
                item.type === "folly" && "text-pink-300",
                item.type === "error" && "text-red-300",
              )}
            >
              {item.content}
            </div>
          </div>
        ))}
      </div>
      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-dark-300/20 pt-2 px-2">
        <div className="flex items-center">
          <span className="mr-2 text-dark-500">&gt;</span> {/* Updated to use &gt; */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-dark-800 placeholder-dark-600"
            autoFocus={autoFocus && !searchMode}
          />
        </div>
        <div className="flex items-center justify-between mt-1 text-xs text-dark-500">
          Standard Mode: Command-based interaction
        </div>
      </form>
    </TechPanel>
  )
}

const startRecordingWithPath = () => {
  // Function implementation here
}
