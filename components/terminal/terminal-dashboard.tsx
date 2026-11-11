"use client"

import { useState, useEffect } from "react"
import { useTerminal } from "./terminal-context"
import { Terminal } from "./terminal"
import { TechPanel } from "../ui/tech-panel"
import { TechButton } from "../ui/tech-button"
import { cn } from "@/lib/utils"
import {
  Plus,
  X,
  Maximize2,
  Minimize2,
  Grid,
  Columns,
  Rows,
  Save,
  FolderOpen,
  Settings,
  TerminalIcon,
} from "lucide-react"

interface TerminalDashboardProps {
  className?: string
}

interface TerminalInstance {
  id: string
  name: string
  minimized: boolean
}

export function TerminalDashboard({ className }: TerminalDashboardProps) {
  const { theme, setTheme, fontSize, setFontSize } = useTerminal()
  const [terminals, setTerminals] = useState<TerminalInstance[]>([
    { id: "terminal-1", name: "Terminal 1", minimized: false },
  ])
  const [layout, setLayout] = useState<"grid" | "columns" | "rows">("grid")
  const [terminalCounter, setTerminalCounter] = useState(2)
  const [showSettings, setShowSettings] = useState(false)

  const addTerminal = () => {
    const newTerminal = {
      id: `terminal-${terminalCounter}`,
      name: `Terminal ${terminalCounter}`,
      minimized: false,
    }
    setTerminals([...terminals, newTerminal])
    setTerminalCounter(terminalCounter + 1)
  }

  const removeTerminal = (id: string) => {
    if (terminals.length <= 1) return
    setTerminals(terminals.filter((t) => t.id !== id))
  }

  const toggleMinimize = (id: string) => {
    setTerminals(
      terminals.map((t) => {
        if (t.id === id) {
          return { ...t, minimized: !t.minimized }
        }
        return t
      }),
    )
  }

  const renameTerminal = (id: string, newName: string) => {
    setTerminals(
      terminals.map((t) => {
        if (t.id === id) {
          return { ...t, name: newName }
        }
        return t
      }),
    )
  }

  const saveLayout = () => {
    const layoutData = {
      terminals,
      layout,
      theme,
      fontSize,
    }
    localStorage.setItem("terminal_dashboard_layout", JSON.stringify(layoutData))
  }

  const loadLayout = () => {
    const savedLayout = localStorage.getItem("terminal_dashboard_layout")
    if (savedLayout) {
      const layoutData = JSON.parse(savedLayout)
      setTerminals(layoutData.terminals)
      setLayout(layoutData.layout)
      setTheme(layoutData.theme)
      setFontSize(layoutData.fontSize)
    }
  }

  useEffect(() => {
    // Try to load saved layout on mount
    const savedLayout = localStorage.getItem("terminal_dashboard_layout")
    if (savedLayout) {
      try {
        const layoutData = JSON.parse(savedLayout)
        setTerminals(layoutData.terminals)
        setLayout(layoutData.layout)
        setTheme(layoutData.theme)
        setFontSize(layoutData.fontSize)
        // Update counter to be higher than any existing terminal ID
        const highestId = Math.max(
          ...layoutData.terminals.map((t: TerminalInstance) => Number.parseInt(t.id.split("-")[1])),
        )
        setTerminalCounter(highestId + 1)
      } catch (error) {
        console.error("Error loading saved layout:", error)
      }
    }
  }, [setTheme, setFontSize])

  const activeTerminals = terminals.filter((t) => !t.minimized)
  const minimizedTerminals = terminals.filter((t) => t.minimized)

  return (
    <TechPanel
      className={cn("flex flex-col", className)}
      variant="default"
      cornerAccent
      borderAccent
      title="TERMINAL DASHBOARD"
      actions={
        <div className="flex space-x-2">
          <TechButton variant="outline" size="sm" onClick={addTerminal}>
            <Plus size={14} className="mr-1" />
            ADD
          </TechButton>
          <div className="flex border border-dark-300/30 rounded-sm">
            <button
              className={cn("px-2 py-1", layout === "grid" ? "bg-dark-300/20" : "hover:bg-dark-300/10")}
              onClick={() => setLayout("grid")}
              title="Grid Layout"
            >
              <Grid size={14} />
            </button>
            <button
              className={cn("px-2 py-1", layout === "columns" ? "bg-dark-300/20" : "hover:bg-dark-300/10")}
              onClick={() => setLayout("columns")}
              title="Columns Layout"
            >
              <Columns size={14} />
            </button>
            <button
              className={cn("px-2 py-1", layout === "rows" ? "bg-dark-300/20" : "hover:bg-dark-300/10")}
              onClick={() => setLayout("rows")}
              title="Rows Layout"
            >
              <Rows size={14} />
            </button>
          </div>
          <TechButton variant="outline" size="sm" onClick={saveLayout} title="Save Layout">
            <Save size={14} />
          </TechButton>
          <TechButton variant="outline" size="sm" onClick={loadLayout} title="Load Layout">
            <FolderOpen size={14} />
          </TechButton>
          <TechButton
            variant={showSettings ? "default" : "outline"}
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings size={14} />
          </TechButton>
        </div>
      }
    >
      {showSettings && (
        <div className="mb-4 p-3 border border-dark-300/30 rounded-sm bg-dark-100/10">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold">Dashboard Settings</div>
            <button className="text-dark-500 hover:text-dark-800" onClick={() => setShowSettings(false)}>
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-dark-600 block mb-1">Terminal Theme</label>
              <select
                className="w-full bg-dark-100/30 border border-dark-300/30 rounded-sm px-2 py-1 text-xs"
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
              >
                <option value="default">Default Theme</option>
                <option value="midnight">Midnight Theme</option>
                <option value="matrix">Matrix Theme</option>
                <option value="amber">Amber Theme</option>
                <option value="ghost">Ghost Theme</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-dark-600 block mb-1">Font Size</label>
              <select
                className="w-full bg-dark-100/30 border border-dark-300/30 rounded-sm px-2 py-1 text-xs"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as any)}
              >
                <option value="xs">Small Font</option>
                <option value="sm">Medium Font</option>
                <option value="md">Large Font</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {minimizedTerminals.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {minimizedTerminals.map((terminal) => (
            <button
              key={terminal.id}
              className="flex items-center bg-dark-100/20 hover:bg-dark-100/30 px-2 py-1 rounded-sm text-xs"
              onClick={() => toggleMinimize(terminal.id)}
            >
              <TerminalIcon size={12} className="mr-1" />
              {terminal.name}
              <Maximize2 size={12} className="ml-2" />
            </button>
          ))}
        </div>
      )}

      <div
        className={cn(
          "flex-1 gap-2",
          layout === "grid" && "grid grid-cols-1 md:grid-cols-2",
          layout === "columns" && "flex flex-row",
          layout === "rows" && "flex flex-col",
        )}
      >
        {activeTerminals.map((terminal) => (
          <div key={terminal.id} className="flex flex-col h-full">
            <div className="flex items-center justify-between bg-dark-100/10 px-2 py-1 border-b border-dark-300/20">
              <div className="flex items-center">
                <TerminalIcon size={12} className="mr-1 text-dark-600" />
                <input
                  type="text"
                  value={terminal.name}
                  onChange={(e) => renameTerminal(terminal.id, e.target.value)}
                  className="bg-transparent border-none outline-none text-xs w-32"
                />
              </div>
              <div className="flex space-x-1">
                <button
                  className="text-dark-500 hover:text-dark-800"
                  onClick={() => toggleMinimize(terminal.id)}
                  title="Minimize"
                >
                  <Minimize2 size={12} />
                </button>
                <button
                  className="text-dark-500 hover:text-dark-800"
                  onClick={() => removeTerminal(terminal.id)}
                  title="Close"
                  disabled={terminals.length <= 1}
                >
                  <X size={12} />
                </button>
              </div>
            </div>
            <div className="flex-1">
              <Terminal
                id={terminal.id}
                showHeader={false}
                className="h-full"
                initialMessage={`Terminal ${terminal.id} - Type 'help' for available commands`}
              />
            </div>
          </div>
        ))}
      </div>
    </TechPanel>
  )
}
