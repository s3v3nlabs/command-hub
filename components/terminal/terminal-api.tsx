"use client"

import { useState } from "react"
import { useTerminal } from "./terminal-context"
import { TechPanel } from "../ui/tech-panel"
import { TechButton } from "../ui/tech-button"
import { Badge } from "../ui/badge"
import { cn } from "@/lib/utils"
import { X, Power, PowerOff, Globe, Key, Lock } from "lucide-react"

export function TerminalApi({ className }: { className?: string }) {
  const { apiIntegrations, addApiIntegration, removeApiIntegration, toggleApiIntegration } = useTerminal()
  const [showAddApi, setShowAddApi] = useState(false)
  const [newApiName, setNewApiName] = useState("")
  const [newApiEndpoint, setNewApiEndpoint] = useState("")
  const [newApiToken, setNewApiToken] = useState("")
  const [newApiCommands, setNewApiCommands] = useState("")
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({})

  const handleAddApi = () => {
    if (!newApiName || !newApiEndpoint || !newApiCommands) return

    addApiIntegration({
      name: newApiName,
      endpoint: newApiEndpoint,
      authToken: newApiToken || undefined,
      enabled: true,
      commands: newApiCommands.split(",").map((cmd) => cmd.trim()),
    })

    // Reset form
    setNewApiName("")
    setNewApiEndpoint("")
    setNewApiToken("")
    setNewApiCommands("")
    setShowAddApi(false)
  }

  const toggleShowToken = (id: string) => {
    setShowTokens((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <TechPanel
      className={cn("flex flex-col", className)}
      variant="default"
      cornerAccent
      borderAccent
      title="API INTEGRATIONS"
      actions={
        <div className="flex space-x-2">
          <Badge variant="outline">{apiIntegrations.length} APIS</Badge>
          <TechButton variant="outline" size="sm" onClick={() => setShowAddApi(!showAddApi)}>
            {showAddApi ? "CANCEL" : "ADD API"}
          </TechButton>
        </div>
      }
    >
      {showAddApi ? (
        <div className="p-2 space-y-3">
          <div className="text-sm font-bold">Add API Integration</div>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-dark-600 block mb-1">API Name</label>
              <input
                type="text"
                value={newApiName}
                onChange={(e) => setNewApiName(e.target.value)}
                className="w-full bg-dark-100/30 border border-dark-300/30 rounded-sm px-2 py-1 text-xs"
                placeholder="Threat Intelligence API"
              />
            </div>
            <div>
              <label className="text-xs text-dark-600 block mb-1">Endpoint URL</label>
              <input
                type="text"
                value={newApiEndpoint}
                onChange={(e) => setNewApiEndpoint(e.target.value)}
                className="w-full bg-dark-100/30 border border-dark-300/30 rounded-sm px-2 py-1 text-xs"
                placeholder="https://api.example.com/v1"
              />
            </div>
            <div>
              <label className="text-xs text-dark-600 block mb-1">Auth Token (Optional)</label>
              <input
                type="text"
                value={newApiToken}
                onChange={(e) => setNewApiToken(e.target.value)}
                className="w-full bg-dark-100/30 border border-dark-300/30 rounded-sm px-2 py-1 text-xs"
                placeholder="API key or token"
              />
            </div>
            <div>
              <label className="text-xs text-dark-600 block mb-1">Commands (comma-separated)</label>
              <input
                type="text"
                value={newApiCommands}
                onChange={(e) => setNewApiCommands(e.target.value)}
                className="w-full bg-dark-100/30 border border-dark-300/30 rounded-sm px-2 py-1 text-xs"
                placeholder="threat, intel, lookup"
              />
            </div>
            <div className="flex justify-end pt-2">
              <TechButton variant="outline" size="sm" onClick={handleAddApi}>
                ADD INTEGRATION
              </TechButton>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {apiIntegrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-dark-500 text-sm">
              <div>No API integrations configured</div>
              <TechButton variant="outline" size="sm" className="mt-2" onClick={() => setShowAddApi(true)}>
                ADD API INTEGRATION
              </TechButton>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {apiIntegrations.map((api) => (
                <div
                  key={api.id}
                  className="border border-dark-300/30 rounded-sm p-2 bg-dark-100/10 hover:bg-dark-100/20 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm flex items-center">
                        {api.name}
                        <Globe size={12} className="ml-2 text-dark-600" />
                      </div>
                      <div className="text-xs text-dark-600 mt-1 flex items-center">
                        <span className="truncate max-w-[200px]">{api.endpoint}</span>
                      </div>
                      {api.authToken && (
                        <div className="text-xs mt-1 flex items-center">
                          <Key size={12} className="mr-1 text-dark-600" />
                          <span className="font-mono">{showTokens[api.id] ? api.authToken : "••••••••••••••••"}</span>
                          <button
                            className="ml-1 text-dark-500 hover:text-dark-800"
                            onClick={() => toggleShowToken(api.id)}
                          >
                            {showTokens[api.id] ? <Lock size={12} /> : <Key size={12} />}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        className={cn("p-1 rounded-sm", api.enabled ? "text-dark-800" : "text-dark-500")}
                        onClick={() => toggleApiIntegration(api.id)}
                        title={api.enabled ? "Disable" : "Enable"}
                      >
                        {api.enabled ? <Power size={14} /> : <PowerOff size={14} />}
                      </button>
                      <button
                        className="p-1 rounded-sm text-dark-500 hover:text-dark-800"
                        onClick={() => removeApiIntegration(api.id)}
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {api.commands.map((cmd) => (
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
