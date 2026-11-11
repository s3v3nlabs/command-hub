"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, Radio, Zap, Lock, Unlock, Activity, AlertTriangle, Settings, Eye, EyeOff } from "lucide-react"

interface FaradayRelayNodeProps {
  node: any
  onAction: (action: string) => void
}

export function FaradayRelayNode({ node, onAction }: FaradayRelayNodeProps) {
  const [shieldingEffectiveness, setShieldingEffectiveness] = useState(95)
  const [rfEnvironment, setRfEnvironment] = useState({
    ambient: 12,
    cellular: 8,
    wifi: 15,
    bluetooth: 3,
    other: 5,
  })
  const [physicalTriggerArmed, setPhysicalTriggerArmed] = useState(false)
  const [burstTransmissionReady, setBurstTransmissionReady] = useState(true)
  const [stealthMode, setStealthMode] = useState(true)
  const [lastBurstTransmission, setLastBurstTransmission] = useState<string | null>(null)
  const [enclosureIntegrity, setEnclosureIntegrity] = useState(100)
  const [temperatureInside, setTemperatureInside] = useState(22.5)
  const [signalLeakage, setSignalLeakage] = useState(0.2)

  useEffect(() => {
    // Simulate environmental monitoring
    const interval = setInterval(() => {
      setRfEnvironment({
        ambient: 10 + Math.random() * 8,
        cellular: 5 + Math.random() * 10,
        wifi: 12 + Math.random() * 8,
        bluetooth: 1 + Math.random() * 5,
        other: 2 + Math.random() * 6,
      })

      setTemperatureInside(20 + Math.random() * 8)
      setSignalLeakage(Math.random() * 0.5)

      // Simulate slight degradation over time
      if (Math.random() > 0.99) {
        setEnclosureIntegrity((prev) => Math.max(90, prev - 1))
        setShieldingEffectiveness((prev) => Math.max(90, prev - 0.5))
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handlePhysicalTrigger = () => {
    if (!physicalTriggerArmed) {
      setPhysicalTriggerArmed(true)
      setTimeout(() => setPhysicalTriggerArmed(false), 30000) // 30 second window
    } else {
      // Execute burst transmission
      setBurstTransmissionReady(false)
      setLastBurstTransmission(new Date().toISOString())
      onAction("burst_transmit")

      setTimeout(() => setBurstTransmissionReady(true), 60000) // 1 minute cooldown
    }
  }

  const handleStealthToggle = () => {
    setStealthMode(!stealthMode)
    onAction(stealthMode ? "stealth_off" : "stealth_on")
  }

  const handleShieldTest = () => {
    // Simulate shielding effectiveness test
    const testResult = 92 + Math.random() * 6
    setShieldingEffectiveness(testResult)
  }

  const getTotalRfLevel = () => {
    return Object.values(rfEnvironment).reduce((sum, val) => sum + val, 0)
  }

  const getShieldingColor = () => {
    if (shieldingEffectiveness >= 95) return "text-green-400"
    if (shieldingEffectiveness >= 90) return "text-yellow-400"
    return "text-red-400"
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <Shield className="w-5 h-5 mr-2 text-purple-400" />
          Faraday-Enclosed Bridge Relay - {node.id}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Status</span>
              <Badge
                className={
                  node.status === "shielded" ? "bg-orange-500/20 text-orange-400" : "bg-gray-500/20 text-gray-400"
                }
              >
                {node.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Shielding</span>
              <span className={`text-sm font-medium ${getShieldingColor()}`}>{shieldingEffectiveness.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Stealth Mode</span>
              <div className={`w-2 h-2 rounded-full ${stealthMode ? "bg-green-500" : "bg-red-500"}`} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Trigger Armed</span>
              <div
                className={`w-2 h-2 rounded-full ${physicalTriggerArmed ? "bg-red-500 animate-pulse" : "bg-gray-500"}`}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Burst Ready</span>
              <div className={`w-2 h-2 rounded-full ${burstTransmissionReady ? "bg-green-500" : "bg-red-500"}`} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Integrity</span>
              <span className="text-sm text-white">{enclosureIntegrity.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* RF Environment Analysis */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white">RF Environment Analysis</h4>
          <div className="p-3 bg-gray-800 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Ambient RF</span>
                  <span>{rfEnvironment.ambient.toFixed(1)}dBm</span>
                </div>
                <Progress value={(rfEnvironment.ambient / 30) * 100} className="h-1" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Cellular</span>
                  <span>{rfEnvironment.cellular.toFixed(1)}dBm</span>
                </div>
                <Progress value={(rfEnvironment.cellular / 30) * 100} className="h-1" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>WiFi</span>
                  <span>{rfEnvironment.wifi.toFixed(1)}dBm</span>
                </div>
                <Progress value={(rfEnvironment.wifi / 30) * 100} className="h-1" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Bluetooth</span>
                  <span>{rfEnvironment.bluetooth.toFixed(1)}dBm</span>
                </div>
                <Progress value={(rfEnvironment.bluetooth / 30) * 100} className="h-1" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-700">
              <span className="text-sm text-gray-400">Total RF Level</span>
              <span className="text-sm font-medium text-white">{getTotalRfLevel().toFixed(1)}dBm</span>
            </div>
          </div>
        </div>

        {/* Shielding Effectiveness */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white">Faraday Cage Status</h4>
          <div className="p-3 bg-gray-800 rounded-lg space-y-3">
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Shielding Effectiveness</span>
                <span className={getShieldingColor()}>{shieldingEffectiveness.toFixed(1)}%</span>
              </div>
              <Progress value={shieldingEffectiveness} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-400">Signal Leakage</div>
                <div className="text-sm text-white">{signalLeakage.toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Internal Temp</div>
                <div className="text-sm text-white">{temperatureInside.toFixed(1)}°C</div>
              </div>
            </div>

            <Button size="sm" onClick={handleShieldTest} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Activity className="w-3 h-3 mr-1" />
              Test Shielding
            </Button>
          </div>
        </div>

        {/* Physical Trigger System */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white">Physical Authorization System</h4>
          <div className="p-4 bg-gray-800 rounded-lg text-center space-y-3">
            <div className="mb-4">
              {physicalTriggerArmed ? (
                <Unlock className="w-12 h-12 text-red-400 mx-auto animate-pulse" />
              ) : (
                <Lock className="w-12 h-12 text-gray-400 mx-auto" />
              )}
            </div>

            <Button
              onClick={handlePhysicalTrigger}
              disabled={!burstTransmissionReady && physicalTriggerArmed}
              className={physicalTriggerArmed ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"}
            >
              <Zap className="w-4 h-4 mr-2" />
              {physicalTriggerArmed ? "Execute Burst" : "Arm Trigger"}
            </Button>

            <div className="text-xs text-gray-500">
              {physicalTriggerArmed
                ? "Trigger armed - Press to execute burst transmission"
                : burstTransmissionReady
                  ? "Ready for physical authorization"
                  : "Burst transmission on cooldown"}
            </div>
          </div>
        </div>

        {/* Last Transmission Info */}
        {lastBurstTransmission && (
          <div className="p-3 bg-purple-900/20 border border-purple-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Radio className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Last Burst Transmission</span>
            </div>
            <div className="text-xs text-gray-400">{new Date(lastBurstTransmission).toLocaleString()}</div>
            <div className="text-xs text-purple-300 mt-1">Encrypted payload delivered to CommandHub</div>
          </div>
        )}

        {/* Control Actions */}
        <div className="flex space-x-2">
          <Button
            onClick={() => onAction(node.status === "shielded" ? "unshield" : "shield")}
            className={
              node.status === "shielded" ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"
            }
          >
            <Shield className="w-4 h-4 mr-2" />
            {node.status === "shielded" ? "Open Shield" : "Activate Shield"}
          </Button>
          <Button
            onClick={handleStealthToggle}
            variant="outline"
            className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
          >
            {stealthMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {stealthMode ? "Disable Stealth" : "Enable Stealth"}
          </Button>
          <Button variant="outline" className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>

        {/* Security Warning */}
        <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">Maximum Security Protocol</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            This node operates under maximum security clearance. All transmissions are logged and monitored.
          </div>
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
