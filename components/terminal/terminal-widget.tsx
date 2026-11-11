"use client"

import { useState } from "react"
import { Terminal } from "./terminal"
import { TechPanel } from "../ui/tech-panel"
import { TechButton } from "../ui/tech-button"
import { Badge } from "../ui/badge"
import { useTerminal } from "./terminal-context"

interface TerminalWidgetProps {
  className?: string
  initialCommand?: string
}

export function TerminalWidget({ className, initialCommand }: TerminalWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { theme, setTheme } = useTerminal()

  return (
    <TechPanel
      className={className}
      title="QUICK TERMINAL"
      cornerAccent
      borderAccent
      variant="default"
      actions={
        <div className="flex space-x-2">
          <Badge variant="outline">SECURE</Badge>
          <TechButton variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "MINIMIZE" : "EXPAND"}
          </TechButton>
        </div>
      }
    >
      <div className="flex items-center justify-between mb-2 px-1">
        <select
          className="bg-dark-100 border border-dark-300 text-dark-800 text-xs rounded-sm px-2 py-1"
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
      <div className={isExpanded ? "h-[400px]" : "h-[200px]"}>
        <Terminal showHeader={false} initialMessage="Quick Terminal Access - Type 'help' for available commands" />
      </div>
    </TechPanel>
  )
}
