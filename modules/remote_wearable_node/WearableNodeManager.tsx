"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Radio,
  Shield,
  Zap,
  Lock,
  Activity,
  Smartphone,
  Watch,
  CreditCard,
  Speaker,
  AlertTriangle,
  XCircle,
  Volume2,
} from "lucide-react"
import { ESP32WristNode } from "./nodes/ESP32WristNode"
import { NFCTokenNode } from "./nodes/NFCTokenNode"
import { AudioTriggeredNode } from "./nodes/AudioTriggeredNode"
import { FaradayRelayNode } from "./nodes/FaradayRelayNode"
import { MobileControlInterface } from "./MobileControlInterface"
import { SymbolicVaultInterface } from "./SymbolicVaultInterface"

interface WearableNode {
  id: string
  type: "esp32_wrist" | "nfc_token" | "audio_triggered" | "faraday_relay"
  name: string
  status: "active" | "inactive" | "pairing" | "error" | "shielded" | "listening"
  batteryLevel?: number
  signalStrength?: number
  lastSync?: string
  harmonicFreq?: number
  securityLevel: "low" | "medium" | "high" | "maximum"
  capabilities: string[]
}

export default function WearableNodeManager() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [showMobileInterface, setShowMobileInterface] = useState(false)
  const [showVaultInterface, setShowVaultInterface] = useState(false)
  const [vaultStatus, setVaultStatus] = useState<"sealed" | "unlocking" | "open">("sealed")
  const [harmonicFreq, setHarmonicFreq] = useState(108)
  const [driftStabilized, setDriftStabilized] = useState(true)
  const [eidosKeeperActive, setEidosKeeperActive] = useState(true)

  const [nodes, setNodes] = useState<WearableNode[]>([
    {
      id: "Σ-ESP-WR1ST",
      type: "esp32_wrist",
      name: "ESP32 Wrist Node",
      status: "inactive",
      batteryLevel: 87,
      signalStrength: 0,
      harmonicFreq: 108,
      securityLevel: "medium",
      capabilities: ["ble", "wifi", "haptic_feedback", "secure_handshake"],
    },
    {
      id: "Σ-NFC-SEAL",
      type: "nfc_token",
      name: "NFC Token Node",
      status: "inactive",
      securityLevel: "high",
      capabilities: ["nfc_unlock", "vault_trigger", "keypair_verification"],
    },
    {
      id: "Σ-TONE-CAPSULE",
      type: "audio_triggered",
      name: "Audio-Triggered Pocket Node",
      status: "listening",
      batteryLevel: 92,
      harmonicFreq: 108,
      securityLevel: "medium",
      capabilities: ["audio_detection", "harmonic_match", "eidos_activation"],
    },
    {
      id: "Σ-FIELD-SHELL",
      type: "faraday_relay",
      name: "Faraday-Enclosed Bridge Relay",
      status: "shielded",
      securityLevel: "maximum",
      capabilities: ["rf_shielding", "burst_transmission", "physical_authorization"],
    },
  ])

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "esp32_wrist":
        return Watch
      case "nfc_token":
        return CreditCard
      case "audio_triggered":
        return Speaker
      case "faraday_relay":
        return Shield
      default:
        return Radio
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "pairing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "listening":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "shielded":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case "maximum":
        return "text-red-400"
      case "high":
        return "text-orange-400"
      case "medium":
        return "text-yellow-400"
      default:
        return "text-gray-400"
    }
  }

  const handleNodeAction = (nodeId: string, action: string) => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id === nodeId) {
          switch (action) {
            case "activate":
              return { ...node, status: "active", lastSync: new Date().toISOString() }
            case "deactivate":
              return { ...node, status: "inactive", signalStrength: 0 }
            case "pair":
              return { ...node, status: "pairing" }
            case "shield":
              return { ...node, status: "shielded" }
            default:
              return node
          }
        }
        return node
      }),
    )
  }

  const handleVaultUnlock = async () => {
    setVaultStatus("unlocking")
    // Simulate vault unlock sequence
    setTimeout(() => {
      setVaultStatus("open")
      setTimeout(() => setVaultStatus("sealed"), 30000) // Auto-seal after 30 seconds
    }, 3000)
  }

  const renderNodeDetails = () => {
    const node = nodes.find((n) => n.id === selectedNode)
    if (!node) return null

    switch (node.type) {
      case "esp32_wrist":
        return <ESP32WristNode node={node} onAction={(action) => handleNodeAction(node.id, action)} />
      case "nfc_token":
        return <NFCTokenNode node={node} onAction={(action) => handleNodeAction(node.id, action)} />
      case "audio_triggered":
        return <AudioTriggeredNode node={node} onAction={(action) => handleNodeAction(node.id, action)} />
      case "faraday_relay":
        return <FaradayRelayNode node={node} onAction={(action) => handleNodeAction(node.id, action)} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              <span className="text-purple-400">Σ</span>-WEARABLE NODE RELAY
            </h1>
            <p className="text-gray-400">Remote Tactical Intelligence Network</p>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${eidosKeeperActive ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-xs text-gray-400">EIDOS-KEEPER</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${driftStabilized ? "bg-green-500" : "bg-yellow-500"}`} />
                <span className="text-xs text-gray-400">DRIFT-STABILIZER</span>
              </div>
              <div className="flex items-center space-x-2">
                <Volume2 className="w-3 h-3 text-purple-400" />
                <span className="text-xs text-gray-400">{harmonicFreq}Hz</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowVaultInterface(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Lock className="w-4 h-4 mr-2" />
              Symbolic Vault
            </Button>
            <Button onClick={() => setShowMobileInterface(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Smartphone className="w-4 h-4 mr-2" />
              Mobile Control
            </Button>
          </div>
        </div>

        {/* System Status Bar */}
        <Card className="bg-gray-900 border-gray-700 mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-sm font-medium text-white">Vault Status</div>
                  <Badge className={getStatusColor(vaultStatus)}>{vaultStatus.toUpperCase()}</Badge>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-sm font-medium text-white">Active Nodes</div>
                  <div className="text-lg font-bold text-green-400">
                    {nodes.filter((n) => n.status === "active").length}/{nodes.length}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Radio className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-sm font-medium text-white">Signal Range</div>
                  <div className="text-lg font-bold text-blue-400">
                    {Math.max(...nodes.map((n) => n.signalStrength || 0))}%
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-sm font-medium text-white">Power Level</div>
                  <div className="text-lg font-bold text-yellow-400">
                    {Math.round(
                      nodes.reduce((acc, n) => acc + (n.batteryLevel || 0), 0) /
                        nodes.filter((n) => n.batteryLevel).length || 0,
                    )}
                    %
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Node List */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Wearable Nodes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {nodes.map((node) => {
                  const Icon = getNodeIcon(node.type)
                  return (
                    <div
                      key={node.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedNode === node.id
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-gray-600 hover:border-gray-500"
                      }`}
                      onClick={() => setSelectedNode(node.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-medium text-white">{node.name}</span>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(node.status)}`}>{node.status}</Badge>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">{node.id}</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Shield className={`w-3 h-3 ${getSecurityLevelColor(node.securityLevel)}`} />
                          <span className="text-xs text-gray-400">{node.securityLevel}</span>
                        </div>
                        {node.batteryLevel && (
                          <div className="flex items-center space-x-1">
                            <div className="w-4 h-2 bg-gray-700 rounded-sm">
                              <div
                                className="h-full bg-green-500 rounded-sm"
                                style={{ width: `${node.batteryLevel}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400">{node.batteryLevel}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Harmonic Control */}
            <Card className="bg-gray-900 border-gray-700 mt-4">
              <CardHeader>
                <CardTitle className="text-white">Harmonic Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Primary Frequency: {harmonicFreq}Hz
                  </label>
                  <Input
                    type="range"
                    min="50"
                    max="1000"
                    value={harmonicFreq}
                    onChange={(e) => setHarmonicFreq(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>50Hz</span>
                    <span>1000Hz</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
                    onClick={() => setHarmonicFreq(108)}
                  >
                    108Hz
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
                    onClick={() => setHarmonicFreq(432)}
                  >
                    432Hz
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
                    onClick={() => setHarmonicFreq(528)}
                  >
                    528Hz
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
                    onClick={() => setHarmonicFreq(963)}
                  >
                    963Hz
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Node Details */}
          <div className="lg:col-span-2">
            {selectedNode ? (
              renderNodeDetails()
            ) : (
              <Card className="bg-gray-900 border-gray-700 h-full flex items-center justify-center">
                <CardContent className="text-center">
                  <Radio className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-400 mb-2">Select a Wearable Node</h3>
                  <p className="text-gray-500">Choose a node from the list to view details and controls</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Emergency Controls */}
        <Card className="bg-red-900/20 border-red-700 mt-6">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Emergency Protocols
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-900/30 bg-transparent"
                onClick={() => {
                  setNodes((prev) => prev.map((node) => ({ ...node, status: "inactive" })))
                  setVaultStatus("sealed")
                }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Emergency Shutdown
              </Button>
              <Button
                variant="outline"
                className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/30 bg-transparent"
                onClick={() => setVaultStatus("sealed")}
              >
                <Lock className="w-4 h-4 mr-2" />
                Vault Lockdown
              </Button>
              <Button
                variant="outline"
                className="border-orange-600 text-orange-400 hover:bg-orange-900/30 bg-transparent"
                onClick={() => {
                  const faradayNode = nodes.find((n) => n.type === "faraday_relay")
                  if (faradayNode) handleNodeAction(faradayNode.id, "shield")
                }}
              >
                <Shield className="w-4 h-4 mr-2" />
                Faraday Shield All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Control Interface Modal */}
        {showMobileInterface && (
          <MobileControlInterface
            nodes={nodes}
            onClose={() => setShowMobileInterface(false)}
            onNodeAction={handleNodeAction}
          />
        )}

        {/* Symbolic Vault Interface Modal */}
        {showVaultInterface && (
          <SymbolicVaultInterface
            vaultStatus={vaultStatus}
            onClose={() => setShowVaultInterface(false)}
            onUnlock={handleVaultUnlock}
            harmonicFreq={harmonicFreq}
          />
        )}
      </div>
    </div>
  )
}
