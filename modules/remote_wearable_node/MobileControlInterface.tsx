"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  X,
  Smartphone,
  Shield,
  Lock,
  Unlock,
  Power,
  AlertTriangle,
  Bluetooth,
  Battery,
  Signal,
  EyeOff,
} from "lucide-react"

interface MobileControlInterfaceProps {
  nodes: any[]
  onClose: () => void
  onNodeAction: (nodeId: string, action: string) => void
}

export function MobileControlInterface({ nodes, onClose, onNodeAction }: MobileControlInterfaceProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [encryptionEnabled, setEncryptionEnabled] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState("connected")
  const [commandBuffer, setCommandBuffer] = useState("")
  const [executionLog, setExecutionLog] = useState<string[]>([
    "[12:34:56] Mobile interface initialized",
    "[12:34:57] E2E encryption enabled",
    "[12:34:58] Connected to CommandHub",
  ])

  const handleNodeCommand = (nodeId: string, command: string) => {
    onNodeAction(nodeId, command)
    const timestamp = new Date().toLocaleTimeString()
    setExecutionLog((prev) => [...prev, `[${timestamp}] ${command} executed on ${nodeId}`])
  }

  const handleBatchCommand = () => {
    if (!commandBuffer.trim()) return

    const timestamp = new Date().toLocaleTimeString()
    setExecutionLog((prev) => [...prev, `[${timestamp}] Batch command: ${commandBuffer}`])
    setCommandBuffer("")
  }

  const handleEmergencyShutdown = () => {
    nodes.forEach((node) => {
      onNodeAction(node.id, "emergency_shutdown")
    })
    const timestamp = new Date().toLocaleTimeString()
    setExecutionLog((prev) => [...prev, `[${timestamp}] EMERGENCY SHUTDOWN - All nodes deactivated`])
  }

  const getNodeStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "pairing":
        return "bg-blue-500 animate-pulse"
      case "listening":
        return "bg-purple-500"
      case "shielded":
        return "bg-orange-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-6 h-6 text-blue-400" />
              <div>
                <h2 className="text-xl font-bold text-white">GrapheneOS Mobile Control</h2>
                <p className="text-sm text-gray-400">Secure Wearable Node Management</p>
              </div>
            </div>
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Connection Status */}
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${connectionStatus === "connected" ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <span className="text-sm text-gray-400">Connection</span>
                  <Badge
                    className={
                      connectionStatus === "connected" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }
                  >
                    {connectionStatus.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className={`w-4 h-4 ${encryptionEnabled ? "text-green-400" : "text-red-400"}`} />
                  <span className="text-sm text-gray-400">Encryption</span>
                  <Badge
                    className={encryptionEnabled ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
                  >
                    {encryptionEnabled ? "AES-256" : "DISABLED"}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Signal className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-400">Signal</span>
                  <span className="text-sm text-white">-42dBm</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Battery className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-400">Device Battery</span>
                  <span className="text-sm text-white">89%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Node Control Panel */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Node Control</h3>

              {/* Node List */}
              <div className="space-y-2">
                {nodes.map((node) => (
                  <Card key={node.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getNodeStatusColor(node.status)}`} />
                          <span className="text-sm font-medium text-white">{node.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {node.type.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-400">{node.id}</span>
                        {node.batteryLevel && (
                          <div className="flex items-center space-x-1">
                            <Battery className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-white">{node.batteryLevel}%</span>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleNodeCommand(node.id, node.status === "active" ? "deactivate" : "activate")
                          }
                          className={
                            node.status === "active" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                          }
                        >
                          <Power className="w-3 h-3 mr-1" />
                          {node.status === "active" ? "Stop" : "Start"}
                        </Button>

                        {node.type === "esp32_wrist" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleNodeCommand(node.id, "pair")}
                            className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
                          >
                            <Bluetooth className="w-3 h-3 mr-1" />
                            Pair
                          </Button>
                        )}

                        {node.type === "nfc_token" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleNodeCommand(node.id, "rotate_key")}
                            className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
                          >
                            <Lock className="w-3 h-3 mr-1" />
                            Rotate
                          </Button>
                        )}

                        {node.type === "faraday_relay" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleNodeCommand(node.id, "shield")}
                            className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            Shield
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Batch Commands */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Batch Commands</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Enter batch commands (one per line)..."
                    value={commandBuffer}
                    onChange={(e) => setCommandBuffer(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-500 font-mono text-sm"
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleBatchCommand}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={!commandBuffer.trim()}
                    >
                      Execute Batch
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCommandBuffer("")}
                      className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
                    >
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Execution Log & Security */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Execution Log</h3>

              {/* Log Display */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-3">
                  <div className="h-64 overflow-y-auto bg-black rounded p-2 font-mono text-xs">
                    {executionLog.map((entry, index) => (
                      <div key={index} className="text-green-400 mb-1">
                        {entry}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Security Controls */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Security Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">End-to-End Encryption</span>
                    <Button
                      size="sm"
                      onClick={() => setEncryptionEnabled(!encryptionEnabled)}
                      className={encryptionEnabled ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                    >
                      {encryptionEnabled ? <Lock className="w-3 h-3 mr-1" /> : <Unlock className="w-3 h-3 mr-1" />}
                      {encryptionEnabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Stealth Mode</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
                    >
                      <EyeOff className="w-3 h-3 mr-1" />
                      Active
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Remote Wipe</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-900/30 bg-transparent"
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Armed
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Controls */}
              <Card className="bg-red-900/20 border-red-700">
                <CardHeader>
                  <CardTitle className="text-red-400 text-sm flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Emergency Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={handleEmergencyShutdown} className="w-full bg-red-600 hover:bg-red-700 text-white">
                    <Power className="w-4 h-4 mr-2" />
                    Emergency Shutdown All Nodes
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-red-600 text-red-400 hover:bg-red-900/30 bg-transparent"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Disconnect Mobile Interface
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
