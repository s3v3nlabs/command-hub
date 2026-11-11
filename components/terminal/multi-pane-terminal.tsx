"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Terminal } from "./terminal"
import { TechPanel } from "../ui/tech-panel"
import { TechButton } from "../ui/tech-button"
import { Badge } from "../ui/badge"
import { useTerminal } from "./terminal-context"

type PaneDirection = "horizontal" | "vertical"
type PaneLayout = "single" | "split" | "triple" | "quad"

interface TerminalPane {
  id: string
  component: React.ReactNode
}

interface MultiPaneTerminalProps {
  className?: string
}

export function MultiPaneTerminal({ className }: MultiPaneTerminalProps) {
  const { theme, setTheme, fontSize, setFontSize } = useTerminal()
  const [panes, setPanes] = useState<TerminalPane[]>([
    { id: "main", component: <Terminal id="main" showHeader={false} /> },
  ])
  const [layout, setLayout] = useState<PaneLayout>("single")
  const [direction, setDirection] = useState<PaneDirection>("horizontal")
  const [activePane, setActivePane] = useState<string>("main")
  const [paneCounter, setPaneCounter] = useState(1)

  const handleSplitPane = () => {
    if (panes.length >= 4) return // Maximum 4 panes

    const newPaneId = `pane-${paneCounter}`
    setPaneCounter((prev) => prev + 1)

    const newPane = {
      id: newPaneId,
      component: <Terminal id={newPaneId} showHeader={false} />,
    }

    setPanes((prev) => [...prev, newPane])
    setActivePane(newPaneId)

    // Update layout based on number of panes
    if (panes.length === 1) setLayout("split")
    else if (panes.length === 2) setLayout("triple")
    else if (panes.length === 3) setLayout("quad")
  }

  const handleClosePane = (id: string) => {
    if (panes.length <= 1) return // Keep at least one pane

    setPanes((prev) => prev.filter((pane) => pane.id !== id))

    // Set active pane to the first remaining pane
    setActivePane(panes.filter((pane) => pane.id !== id)[0]?.id || "main")

    // Update layout based on number of panes
    if (panes.length === 2) setLayout("single")
    else if (panes.length === 3) setLayout("split")
    else if (panes.length === 4) setLayout("triple")
  }

  const handleToggleDirection = () => {
    setDirection((prev) => (prev === "horizontal" ? "vertical" : "horizontal"))
  }

  const handleChangeTheme = (newTheme: string) => {
    setTheme(newTheme as any)
  }

  const handleChangeFontSize = (newSize: string) => {
    setFontSize(newSize as any)
  }

  return (
    <TechPanel
      className={cn("flex flex-col", className)}
      variant="default"
      cornerAccent
      borderAccent
      title="MULTI-PANE TERMINAL"
      actions={
        <div className="flex space-x-2">
          <TechButton variant="outline" size="sm" onClick={handleSplitPane}>
            SPLIT
          </TechButton>
          <TechButton variant="outline" size="sm" onClick={handleToggleDirection}>
            {direction === "horizontal" ? "H-SPLIT" : "V-SPLIT"}
          </TechButton>
          <Badge variant="outline">{panes.length} PANES</Badge>
        </div>
      }
    >
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex space-x-2">
          <select
            className="bg-dark-100 border border-dark-300 text-dark-800 text-xs rounded-sm px-2 py-1"
            value={theme}
            onChange={(e) => handleChangeTheme(e.target.value)}
          >
            <option value="default">Default Theme</option>
            <option value="midnight">Midnight Theme</option>
            <option value="matrix">Matrix Theme</option>
            <option value="amber">Amber Theme</option>
            <option value="ghost">Ghost Theme</option>
          </select>
          <select
            className="bg-dark-100 border border-dark-300 text-dark-800 text-xs rounded-sm px-2 py-1"
            value={fontSize}
            onChange={(e) => handleChangeFontSize(e.target.value)}
          >
            <option value="xs">Small Font</option>
            <option value="sm">Medium Font</option>
            <option value="md">Large Font</option>
          </select>
        </div>
        <div className="flex space-x-1">
          {panes.map((pane) => (
            <Badge
              key={pane.id}
              variant={activePane === pane.id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setActivePane(pane.id)}
            >
              {pane.id}
              {panes.length > 1 && (
                <span
                  className="ml-2 text-dark-500 hover:text-dark-800"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClosePane(pane.id)
                  }}
                >
                  ×
                </span>
              )}
            </Badge>
          ))}
        </div>
      </div>

      <div className={cn("flex flex-1 gap-2", direction === "horizontal" ? "flex-row" : "flex-col")}>
        {layout === "single" && <div className="flex-1">{panes[0]?.component}</div>}

        {layout === "split" && (
          <>
            <div className="flex-1">{panes[0]?.component}</div>
            <div className="flex-1">{panes[1]?.component}</div>
          </>
        )}

        {layout === "triple" && (
          <>
            <div className="flex-1">{panes[0]?.component}</div>
            <div className={cn("flex gap-2", direction === "horizontal" ? "flex-1 flex-col" : "flex-row")}>
              <div className="flex-1">{panes[1]?.component}</div>
              <div className="flex-1">{panes[2]?.component}</div>
            </div>
          </>
        )}

        {layout === "quad" && (
          <>
            <div className={cn("flex gap-2", direction === "horizontal" ? "flex-1 flex-col" : "flex-row")}>
              <div className="flex-1">{panes[0]?.component}</div>
              <div className="flex-1">{panes[1]?.component}</div>
            </div>
            <div className={cn("flex gap-2", direction === "horizontal" ? "flex-1 flex-col" : "flex-row")}>
              <div className="flex-1">{panes[2]?.component}</div>
              <div className="flex-1">{panes[3]?.component}</div>
            </div>
          </>
        )}
      </div>
    </TechPanel>
  )
}
