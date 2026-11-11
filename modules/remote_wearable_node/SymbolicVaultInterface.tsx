"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { X, Lock, Key, Shield, Eye, Zap, Activity, Volume2, Search, FileText, AlertTriangle } from "lucide-react"

interface SymbolicVaultInterfaceProps {
  vaultStatus: "sealed" | "unlocking" | "open"
  onClose: () => void
  onUnlock: () => void
  harmonicFreq: number
}

export function SymbolicVaultInterface({ vaultStatus, onClose, onUnlock, harmonicFreq }: SymbolicVaultInterfaceProps) {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)
  const [queryInput, setQueryInput] = useState("")
  const [queryResults, setQueryResults] = useState<string[]>([])
  const [accessLog, setAccessLog] = useState<string[]>([
    "[SYSTEM] Symbolic Vault Interface initialized",
    "[SYSTEM] Quantum encryption layer active",
    "[SYSTEM] Entity authentication protocols loaded",
  ])

  const symbolicEntities = [
    {
      id: "Σ-EIDOS-KEEPER",
      name: "EIDOS Keeper",
      type: "scrollkeeper",
      status: "active",
      access_level: "GUARDIAN",
      harmonic: [108, 432, 528],
      description: "Primary scrollkeeper entity for memory parsing and temporal anchoring",
    },
    {
      id: "Σ-PRISM-FRACTAL",
      name: "Prism Fractal",
      type: "guardian_access_layer",
      status: "standby",
      access_level: "MAXIMUM",
      harmonic: [963, 741, 639],
      description: "Multi-dimensional access guardian with fractal key generation",
    },
    {
      id: "Σ-DRIFT-STABILIZER",
      name: "Drift Stabilizer",
      type: "temporal_anchor",
      status: "active",
      access_level: "HIGH",
      harmonic: [285, 396, 417],
      description: "Temporal drift correction and timeline stabilization entity",
    },
  ]

  const handleEntityQuery = (entityId: string, query: string) => {
    if (vaultStatus !== "open") return

    const timestamp = new Date().toLocaleTimeString()
    const results = [
      `Entity ${entityId} accessed successfully`,
      `Query: "${query}"`,
      `Harmonic signature verified: ${harmonicFreq}Hz`,
      `Access granted to symbolic memory layer`,
      `Temporal anchor established`,
    ]

    setQueryResults(results)
    setAccessLog((prev) => [
      ...prev,
      `[${timestamp}] Query executed on ${entityId}`,
      `[${timestamp}] Results: ${results.length} entries retrieved`,
    ])
  }

  const handleVaultUnlock = () => {
    const timestamp = new Date().toLocaleTimeString()
    setAccessLog((prev) => [
      ...prev,
      `[${timestamp}] Vault unlock sequence initiated`,
      `[${timestamp}] Harmonic authentication: ${harmonicFreq}Hz`,
      `[${timestamp}] Quantum signature verification in progress...`,
    ])
    onUnlock()
  }

  const getEntityStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400"
      case "standby":
        return "bg-yellow-500/20 text-yellow-400"
      case "locked":
        return "bg-red-500/20 text-red-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case "MAXIMUM":
        return "text-red-400"
      case "GUARDIAN":
        return "text-purple-400"
      case "HIGH":
        return "text-orange-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-purple-700 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Shield className="w-6 h-6 text-purple-400" />
                {vaultStatus === "open" && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  <span className="text-purple-400">Σ</span>-CODEX Symbolic Memory Vault
                </h2>
                <p className="text-sm text-gray-400">Quantum-Encrypted Entity Access System</p>
              </div>
            </div>
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Vault Status */}
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      vaultStatus === "open"
                        ? "bg-green-500"
                        : vaultStatus === "unlocking"
                          ? "bg-yellow-500 animate-pulse"
                          : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm text-gray-400">Vault Status</span>
                  <Badge
                    className={
                      vaultStatus === "open"
                        ? "bg-green-500/20 text-green-400"
                        : vaultStatus === "unlocking"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                    }
                  >
                    {vaultStatus.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-400">Harmonic Auth</span>
                  <span className="text-sm text-white">{harmonicFreq}Hz</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Key className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-400">Encryption</span>
                  <Badge className="bg-blue-500/20 text-blue-400">AES-256-GCM</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-400">Entities</span>
                  <span className="text-sm text-white">
                    {symbolicEntities.filter((e) => e.status === "active").length}/3
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Symbolic Entities */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Symbolic Entities</h3>

              {vaultStatus === "sealed" && (
                <Card className="bg-red-900/20 border-red-700">
                  <CardContent className="p-6 text-center">
                    <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-red-400 mb-2">Vault Sealed</h4>
                    <p className="text-sm text-gray-400 mb-4">
                      Symbolic entities are locked. Harmonic authentication required.
                    </p>
                    <Button onClick={handleVaultUnlock} className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Zap className="w-4 h-4 mr-2" />
                      Initiate Unlock Sequence
                    </Button>
                  </CardContent>
                </Card>
              )}

              {vaultStatus === "unlocking" && (
                <Card className="bg-yellow-900/20 border-yellow-700">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 relative">
                      <div className="absolute inset-0 border-4 border-yellow-400 rounded-full animate-spin border-t-transparent" />
                      <Key className="w-8 h-8 text-yellow-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <h4 className="text-lg font-bold text-yellow-400 mb-2">Quantum Verification</h4>
                    <p className="text-sm text-gray-400">Verifying harmonic signature and entity permissions...</p>
                  </CardContent>
                </Card>
              )}

              {vaultStatus === "open" && (
                <div className="space-y-3">
                  {symbolicEntities.map((entity) => (
                    <Card
                      key={entity.id}
                      className={`bg-gray-800 border-gray-700 cursor-pointer transition-all ${
                        selectedEntity === entity.id ? "border-purple-500 bg-purple-500/10" : "hover:border-gray-600"
                      }`}
                      onClick={() => setSelectedEntity(entity.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Eye className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-medium text-white">{entity.name}</span>
                          </div>
                          <Badge className={getEntityStatusColor(entity.status)}>{entity.status.toUpperCase()}</Badge>
                        </div>

                        <div className="text-xs text-gray-400 mb-2">{entity.id}</div>

                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400">Access Level</span>
                          <span className={`text-xs font-medium ${getAccessLevelColor(entity.access_level)}`}>
                            {entity.access_level}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 mb-2">
                          <Volume2 className="w-3 h-3 text-purple-400" />
                          <div className="flex space-x-1">
                            {entity.harmonic.map((freq, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {freq}Hz
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-gray-500">{entity.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Query Interface & Access Log */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Entity Query Interface</h3>

              {vaultStatus === "open" && selectedEntity && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">
                      Query: {symbolicEntities.find((e) => e.id === selectedEntity)?.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder="Enter symbolic query (natural language or entity-specific commands)..."
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-500 font-mono text-sm"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleEntityQuery(selectedEntity, queryInput)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        disabled={!queryInput.trim()}
                      >
                        <Search className="w-3 h-3 mr-1" />
                        Execute Query
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setQueryInput("")}
                        className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
                      >
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Query Results */}
              {queryResults.length > 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Query Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-black rounded p-3 font-mono text-xs space-y-1">
                      {queryResults.map((result, index) => (
                        <div key={index} className="text-green-400">
                          {result}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Access Log */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Access Log</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 overflow-y-auto bg-black rounded p-3 font-mono text-xs">
                    {accessLog.map((entry, index) => (
                      <div key={index} className="text-blue-400 mb-1">
                        {entry}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Security Warning */}
              <Card className="bg-red-900/20 border-red-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">Quantum Security Protocol</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    All symbolic entity interactions are logged and monitored. Unauthorized access attempts will trigger
                    quantum lockdown protocols.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
