"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  Watch,
  Bluetooth,
  Wifi,
  Battery,
  Heart,
  Thermometer,
  Vibrate,
  Smartphone,
  Activity,
  Signal,
  Power,
  Settings,
} from "lucide-react"

interface ESP32WristNodeProps {
  node: any
  onAction: (action: string) => void
}

export function ESP32WristNode({ node, onAction }: ESP32WristNodeProps) {
  const [bleConnected, setBleConnected] = useState(false)
  const [wifiConnected, setWifiConnected] = useState(false)
  const [heartRate, setHeartRate] = useState(72)
  const [temperature, setTemperature] = useState(36.5)
  const [hapticIntensity, setHapticIntensity] = useState(50)
  const [pairedDevice, setPairedDevice] = useState("GrapheneOS-Device-7291")
  const [signalStrength, setSignalStrength] = useState(85)
  const [harmonicDetected, setHarmonicDetected] = useState(false)

  useEffect(() => {
    if (node.status === "active") {
      // Simulate biometric readings
      const interval = setInterval(() => {
        setHeartRate(70 + Math.floor(Math.random() * 10))
        setTemperature(36.2 + Math.random() * 0.8)
        setSignalStrength(80 + Math.floor(Math.random() * 20))
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [node.status])

  const handlePairDevice = () => {
    onAction("pair")
    setTimeout(() => {
      setBleConnected(true)
      setWifiConnected(true)
    }, 3000)
  }

  const handleHapticTest = () => {
    setHarmonicDetected(true)
    setTimeout(() => setHarmonicDetected(false), 2000)
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <Watch className="w-5 h-5 mr-2 text-purple-400" />
          ESP32 Wrist Node - {node.id}
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
              <span className="text-sm text-gray-400">Battery</span>
              <div className="flex items-center space-x-2">
                <Battery className="w-4 h-4 text-green-400" />
                <span className="text-sm text-white">{node.batteryLevel}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Signal</span>
              <div className="flex items-center space-x-2">
                <Signal className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white">{signalStrength}%</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">BLE</span>
              <div className={`w-2 h-2 rounded-full ${bleConnected ? "bg-green-500" : "bg-red-500"}`} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">WiFi</span>
              <div className={`w-2 h-2 rounded-full ${wifiConnected ? "bg-green-500" : "bg-red-500"}`} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Harmonic</span>
              <div
                className={`w-2 h-2 rounded-full ${harmonicDetected ? "bg-purple-500 animate-pulse" : "bg-gray-500"}`}
              />
            </div>
          </div>
        </div>

        {/* Biometric Monitoring */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white">Biometric Monitoring</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-sm text-gray-400">Heart Rate</span>
              </div>
              <div className="text-xl font-bold text-white">{heartRate} BPM</div>
              <Progress value={(heartRate - 60) * 2.5} className="h-1 mt-2" />
            </div>
            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Thermometer className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-gray-400">Temperature</span>
              </div>
              <div className="text-xl font-bold text-white">{temperature.toFixed(1)}°C</div>
              <Progress value={(temperature - 35) * 25} className="h-1 mt-2" />
            </div>
          </div>
        </div>

        {/* Connectivity */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white">Connectivity</h4>
          <div className="p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Paired Device</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {pairedDevice}
              </Badge>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handlePairDevice}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={node.status === "pairing"}
              >
                <Bluetooth className="w-3 h-3 mr-1" />
                {node.status === "pairing" ? "Pairing..." : "Pair Device"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
              >
                <Wifi className="w-3 h-3 mr-1" />
                WiFi Setup
              </Button>
            </div>
          </div>
        </div>

        {/* Haptic Feedback */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white">Haptic Feedback</h4>
          <div className="p-3 bg-gray-800 rounded-lg">
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Intensity: {hapticIntensity}%</label>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={hapticIntensity}
                  onChange={(e) => setHapticIntensity(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleHapticTest} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Vibrate className="w-3 h-3 mr-1" />
                  Test Haptic
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Configure
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Control Actions */}
        <div className="flex space-x-2">
          <Button
            onClick={() => onAction(node.status === "active" ? "deactivate" : "activate")}
            className={node.status === "active" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
          >
            <Power className="w-4 h-4 mr-2" />
            {node.status === "active" ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="outline"
            className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
            onClick={() => onAction("sync")}
          >
            <Activity className="w-4 h-4 mr-2" />
            Sync Hub
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
