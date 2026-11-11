"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CreditCard, Shield, Key, Lock, Unlock, RotateCcw, AlertTriangle, CheckCircle, Radio, Zap } from "lucide-react"

interface NFCTokenNodeProps {
  node: any
  onAction: (action: string) => void
}

export function NFCTokenNode({ node, onAction }: NFCTokenNodeProps) {
  const [keyMode, setKeyMode] = useState<"static" | "dynamic">("dynamic")
  const [currentKey, setCurrentKey] = useState("SEAL-7291-ALPHA")
  const [keyRotationInterval, setKeyRotationInterval] = useState(300) // seconds
  const [lastTap, setLastTap] = useState<string | null>(null)
  const [tapCount, setTapCount] = useState(0)
  const [antiCloneStatus, setAntiCloneStatus] = useState("protected")
  const [nfcProtocol, setNfcProtocol] = useState("ISO14443-A")
  const [vaultUnlockReady, setVaultUnlockReady] = useState(true)

  useEffect(() => {
    if (keyMode === "dynamic") {
      const interval = setInterval(() => {
        const newKey = `SEAL-${Math.floor(Math.random() * 10000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`
        setCurrentKey(newKey)
      }, keyRotationInterval * 1000)

      return () => clearInterval(interval)
    }
  }, [keyMode, keyRotationInterval])

  const handleNFCTap = () => {
    setLastTap(new Date().toISOString())
    setTapCount((prev) => prev + 1)
    onAction("vault_unlock")

    // Simulate vault unlock sequence
    setTimeout(() => {
      setVaultUnlockReady(false)
      setTimeout(() => setVaultUnlockReady(true), 5000)
    }, 1000)
  }

  const handleKeyRotation = () => {
    const newKey = `SEAL-${Math.floor(Math.random() * 10000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`
    setCurrentKey(newKey)
  }

  const handleAntiCloneTest = () => {
    setAntiCloneStatus("testing")
    setTimeout(() => {
      setAntiCloneStatus(Math.random() > 0.1 ? "protected" : "compromised")
    }, 3000)
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <CreditCard className="w-5 h-5 mr-2 text-purple-400" />
          NFC Token Node - {node.id}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Status</span>
              <Badge
                className={node.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}
              >
                {node.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Key Mode</span>
              <Badge
                className={keyMode === "dynamic" ? "bg-blue-500/20 text-blue-400" : "bg-orange-500/20 text-orange-400"}
              >
                {keyMode.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Protocol</span>
              <span className="text-sm text-white">{nfcProtocol}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Tap Count</span>
              <span className="text-sm text-white">{tapCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Anti-Clone</span>
              <div
                className={`w-2 h-2 rounded-full ${
                  antiCloneStatus === "protected"
                    ? "bg-green-500"
                    : antiCloneStatus === "testing"
                      ? "bg-yellow-500 animate-pulse"
                      : "bg-red-500"
                }`}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Vault Ready</span>
              <div className={`w-2 h-2 rounded-full ${vaultUnlockReady ? "bg-green-500" : "bg-red-500"}`} />
            </div>
          </div>
        </div>

        {/* Current Key Display */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white">Current Authentication Key</h4>
          <div className="p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-400">Active Key</span>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {currentKey}
              </Badge>
            </div>
            {lastTap && <div className="text-xs text-gray-500">Last used: {new Date(lastTap).toLocaleString()}</div>}
          </div>
        </div>

        {/* Key Management */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white">Key Management</h4>
          <div className="p-3 bg-gray-800 rounded-lg space-y-3">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant={keyMode === "static" ? "default" : "outline"}
                onClick={() => setKeyMode("static")}
                className={
                  keyMode === "static"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
                }
              >
                Static Key
              </Button>
              <Button
                size="sm"
                variant={keyMode === "dynamic" ? "default" : "outline"}
                onClick={() => setKeyMode("dynamic")}
                className={
                  keyMode === "dynamic"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
                }
              >
                Dynamic Key
              </Button>
            </div>

            {keyMode === "dynamic" && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Rotation Interval: {keyRotationInterval}s</label>
                <Input
                  type="range"
                  min="60"
                  max="3600"
                  value={keyRotationInterval}
                  onChange={(e) => setKeyRotationInterval(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1min</span>
                  <span>1hr</span>
                </div>
              </div>
            )}

            <Button size="sm" onClick={handleKeyRotation} className="bg-purple-600 hover:bg-purple-700 text-white">
              <RotateCcw className="w-3 h-3 mr-1" />
              Rotate Key Now
            </Button>
          </div>
        </div>

        {/* Security Features */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white">Security Features</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">Anti-Clone</span>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium ${
                    antiCloneStatus === "protected"
                      ? "text-green-400"
                      : antiCloneStatus === "testing"
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {antiCloneStatus.toUpperCase()}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAntiCloneTest}
                  className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent h-6 px-2 text-xs"
                  disabled={antiCloneStatus === "testing"}
                >
                  Test
                </Button>
              </div>
            </div>

            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Radio className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Range</span>
              </div>
              <div className="text-xs text-white">4cm proximity</div>
            </div>
          </div>
        </div>

        {/* Vault Unlock Simulation */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white">Vault Unlock</h4>
          <div className="p-4 bg-gray-800 rounded-lg text-center">
            <div className="mb-4">
              {vaultUnlockReady ? (
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
              ) : (
                <Lock className="w-12 h-12 text-red-400 mx-auto" />
              )}
            </div>
            <Button
              onClick={handleNFCTap}
              disabled={!vaultUnlockReady}
              className="bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-600 disabled:text-gray-400"
            >
              <Zap className="w-4 h-4 mr-2" />
              Simulate NFC Tap
            </Button>
            <div className="text-xs text-gray-500 mt-2">
              {vaultUnlockReady ? "Ready to unlock vault" : "Cooldown active"}
            </div>
          </div>
        </div>

        {/* Control Actions */}
        <div className="flex space-x-2">
          <Button
            onClick={() => onAction(node.status === "active" ? "deactivate" : "activate")}
            className={node.status === "active" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
          >
            {node.status === "active" ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
            {node.status === "active" ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="outline"
            className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
            onClick={handleAntiCloneTest}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Security Check
          </Button>
        </div>

        {/* Capabilities */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-white">Capabilities</h4>
          <div className="flex flex-wrap gap-2">
            {node.capabilities.map((capability: string) => (
              <Badge key={capability} variant="outline" className="text-xs">
                {capability.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
