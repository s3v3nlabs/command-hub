"use client"

import { useState } from "react"
import { useTerminal } from "./terminal-context"
import { TechPanel } from "../ui/tech-panel"
import { TechButton } from "../ui/tech-button"
import { Badge } from "../ui/badge"
import { cn } from "@/lib/utils"
import { X, Play } from "lucide-react"

export function TerminalMacros({ className }: { className?: string }) {
  const { macros, createMacro, deleteMacro, executeMacro } = useTerminal()
  const [showAddMacro, setShowAddMacro] = useState(false)
  const [newMacroName, setNewMacroName] = useState("")
  const [newMacroDescription, setNewMacroDescription] = useState("")
  const [newMacroCommands, setNewMacroCommands] = useState("")
  const [editingMacro, setEditingMacro] = useState<string | null>(null)

  const handleAddMacro = () => {
    if (!newMacroName || !newMacroCommands) return

    createMacro(
      newMacroName,
      newMacroCommands.split("\n").filter((cmd) => cmd.trim()),
      newMacroDescription || undefined,
    )

    // Reset form
    setNewMacroName("")
    setNewMacroDescription("")
    setNewMacroCommands("")
    setShowAddMacro(false)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <TechPanel
      className={cn("flex flex-col", className)}
      variant="default"
      cornerAccent
      borderAccent
      title="TERMINAL MACROS"
      actions={
        <div className="flex space-x-2">
          <Badge variant="outline">{macros.length} MACROS</Badge>
          <TechButton variant="outline" size="sm" onClick={() => setShowAddMacro(!showAddMacro)}>
            {showAddMacro ? "CANCEL" : "CREATE MACRO"}
          </TechButton>
        </div>
      }
    >
      {showAddMacro ? (
        <div className="p-2 space-y-3">
          <div className="text-sm font-bold">Create New Macro</div>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-dark-600 block mb-1">Macro Name</label>
              <input
                type="text"
                value={newMacroName}
                onChange={(e) => setNewMacroName(e.target.value)}
                className="w-full bg-dark-100/30 border border-dark-300/30 rounded-sm px-2 py-1 text-xs"
                placeholder="Network Diagnostics"
              />
            </div>
            <div>
              <label className="text-xs text-dark-600 block mb-1">Description (Optional)</label>
              <input
                type="text"
                value={newMacroDescription}
                onChange={(e) => setNewMacroDescription(e.target.value)}
                className="w-full bg-dark-100/30 border border-dark-300/30 rounded-sm px-2 py-1 text-xs"
                placeholder="Run comprehensive network diagnostics"
              />
            </div>
            <div>
              <label className="text-xs text-dark-600 block mb-1">Commands (one per line)</label>
              <textarea
                value={newMacroCommands}
                onChange={(e) => setNewMacroCommands(e.target.value)}
                className="w-full bg-dark-100/30 border border-dark-300/30 rounded-sm px-2 py-1 text-xs font-mono h-32"
                placeholder="network status
netmap topology
trace 192.168.1.1
firewall status"
              />
            </div>
            <div className="flex justify-end pt-2">
              <TechButton variant="outline" size="sm" onClick={handleAddMacro}>
                CREATE MACRO
              </TechButton>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {macros.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-dark-500 text-sm">
              <div>No macros created</div>
              <TechButton variant="outline" size="sm" className="mt-2" onClick={() => setShowAddMacro(true)}>
                CREATE MACRO
              </TechButton>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {macros.map((macro) => (
                <div
                  key={macro.id}
                  className="border border-dark-300/30 rounded-sm p-2 bg-dark-100/10 hover:bg-dark-100/20 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm">{macro.name}</div>
                      {macro.description && <div className="text-xs text-dark-600 mt-1">{macro.description}</div>}
                      <div className="text-xs text-dark-500 mt-1">Created: {formatDate(macro.createdAt)}</div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        className="p-1 rounded-sm text-dark-600 hover:text-dark-800"
                        onClick={() => executeMacro(macro.id)}
                        title="Run Macro"
                      >
                        <Play size={14} />
                      </button>
                      <button
                        className="p-1 rounded-sm text-dark-500 hover:text-dark-800"
                        onClick={() => deleteMacro(macro.id)}
                        title="Delete"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 bg-dark-100/20 p-1 rounded-sm">
                    <div className="text-xs font-mono whitespace-pre-wrap">
                      {macro.commands.map((cmd, i) => (
                        <div key={i} className="py-0.5">
                          {cmd}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </TechPanel>
  )
}
