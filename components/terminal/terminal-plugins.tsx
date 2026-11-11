"use client"

import { useState } from "react"
import { useTerminal } from "./terminal-context"
import { TechPanel } from "../ui/tech-panel"
import { TechButton } from "../ui/tech-button"
import { Badge } from "../ui/badge"
import { cn } from "@/lib/utils"
import { X, Power, PowerOff } from "lucide-react"

export function TerminalPlugins({ className }: { className?: string }) {
  const { plugins, togglePlugin, uninstallPlugin, installPlugin } = useTerminal()
  const [showAddPlugin, setShowAddPlugin] = useState(false)
  const [newPluginName, setNewPluginName] = useState("")
  const [newPluginDescription, setNewPluginDescription] = useState("")
  const [newPluginVersion, setNewPluginVersion] = useState("1.0.0")
  const [newPluginCommands, setNewPluginCommands] = useState("")

  const handleAddPlugin = () => {
    if (!newPluginName || !newPluginDescription || !newPluginVersion || !newPluginCommands) return

    installPlugin({
      name: newPluginName,
      description: newPluginDescription,
      version: newPluginVersion,
      commands: newPluginCommands.split(",").map((cmd) => cmd.trim()),
      enabled: true,
      hooks: {},
    })

    // Reset form
    setNewPluginName("")
    setNewPluginDescription("")
    setNewPluginVersion("1.0.0")
    setNewPluginCommands("")
    setShowAddPlugin(false)
  }

  return (
    <TechPanel
      className={cn("flex flex-col", className)}
      variant="default"
      cornerAccent
      borderAccent
      title="TERMINAL PLUGINS"
      actions={
        <div className="flex space-x-2">
          <Badge variant="outline">{plugins.length} PLUGINS</Badge>
          <TechButton variant="outline" size="sm" onClick={() => setShowAddPlugin(!showAddPlugin)}>
            {showAddPlugin ? "CANCEL" : "ADD PLUGIN"}
          </TechButton>
        </div>
      }
    >
      {showAddPlugin ? (
        <div className="p-2 space-y-3">
          <div className="text-sm font-bold">Install New Plugin</div>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-dark-600 block mb-1">Plugin Name</label>
              <input
                type="text"
                value={newPluginName}
                onChange={(e) => setNewPluginName(e.target.value)}
                className="w-full bg-dark-100/30 border border-dark-300/30 rounded-sm px-2 py-1 text-xs"
                placeholder="Security Scanner"
              />
            </div>
            <div>
              <label className="text-xs text-dark-600 block mb-1">Description</label>
              <input
                type="text"
                value={newPluginDescription}
                onChange={(e) => setNewPluginDescription(e.target.value)}
                className="w-full bg-dark-100/30 border border-dark-300/30 rounded-sm px-2 py-1 text-xs"
                placeholder="Advanced security scanning capabilities"
              />
            </div>
            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="text-xs text-dark-600 block mb-1">Version</label>
                <input
                  type="text"
                  value={newPluginVersion}
                  onChange={(e) => setNewPluginVersion(e.target.value)}
                  className="w-full bg-dark-100/30 border border-dark-300/30 rounded-sm px-2 py-1 text-xs"
                  placeholder="1.0.0"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-dark-600 block mb-1">Commands (comma-separated)</label>
                <input
                  type="text"
                  value={newPluginCommands}
                  onChange={(e) => setNewPluginCommands(e.target.value)}
                  className="w-full bg-dark-100/30 border border-dark-300/30 rounded-sm px-2 py-1 text-xs"
                  placeholder="scan, analyze, report"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <TechButton variant="outline" size="sm" onClick={handleAddPlugin}>
                INSTALL
              </TechButton>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {plugins.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-dark-500 text-sm">
              <div>No plugins installed</div>
              <TechButton variant="outline" size="sm" className="mt-2" onClick={() => setShowAddPlugin(true)}>
                INSTALL PLUGIN
              </TechButton>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {plugins.map((plugin) => (
                <div
                  key={plugin.id}
                  className="border border-dark-300/30 rounded-sm p-2 bg-dark-100/10 hover:bg-dark-100/20 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm flex items-center">
                        {plugin.name}
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          v{plugin.version}
                        </Badge>
                      </div>
                      <div className="text-xs text-dark-600 mt-1">{plugin.description}</div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        className={cn("p-1 rounded-sm", plugin.enabled ? "text-dark-800" : "text-dark-500")}
                        onClick={() => togglePlugin(plugin.id)}
                        title={plugin.enabled ? "Disable" : "Enable"}
                      >
                        {plugin.enabled ? <Power size={14} /> : <PowerOff size={14} />}
                      </button>
                      <button
                        className="p-1 rounded-sm text-dark-500 hover:text-dark-800"
                        onClick={() => uninstallPlugin(plugin.id)}
                        title="Uninstall"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {plugin.commands.map((cmd) => (
                      <Badge key={cmd} variant="outline" className="text-[10px]">
                        {cmd}
                      </Badge>
                    ))}
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
