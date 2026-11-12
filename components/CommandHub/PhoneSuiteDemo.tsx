"use client"

import { useState, useEffect } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Smartphone,
  Battery,
  Wifi,
  Phone,
  MessageSquare,
  Monitor,
  FolderOpen,
  Terminal,
  Scan,
  Download,
  Upload,
  Play,
  Pause,
  RefreshCw,
  Settings,
  Shield,
  Zap,
  Activity,
} from "lucide-react"

interface MockDevice {
  id: string
  name: string
  model: string
  android_version: string
  battery_level: number
  signal_strength: number
  wifi_connected: boolean
  status: "connected" | "disconnected" | "unauthorized"
  is_graphene: boolean
}

export function PhoneSuiteDemo() {
  const [devices, setDevices] = useState<MockDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [lastScan, setLastScan] = useState<Date>(new Date())
  const [callLogs, setCallLogs] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [isScreenMirroring, setIsScreenMirroring] = useState(false)

  // Mock data generation
  useEffect(() => {
    const mockDevices: MockDevice[] = [
      {
        id: "pixel7_001",
        name: "Pixel 7 Pro",
        model: "GP4BC",
        android_version: "14",
        battery_level: 87,
        signal_strength: 4,
        wifi_connected: true,
        status: "connected",
        is_graphene: true,
      },
      {
        id: "pixel6_002",
        name: "Pixel 6",
        model: "GR1YH",
        android_version: "13",
        battery_level: 45,
        signal_strength: 3,
        wifi_connected: false,
        status: "connected",
        is_graphene: true,
      },
    ]

    setDevices(mockDevices)
    setSelectedDevice(mockDevices[0]?.id || null)

    // Mock call logs
    setCallLogs([
      {
        id: 1,
        number: "+1-555-0123",
        type: "incoming",
        duration: 245,
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        id: 2,
        number: "+1-555-0456",
        type: "outgoing",
        duration: 120,
        timestamp: new Date(Date.now() - 7200000),
      },
    ])

    // Mock messages
    setMessages([
      {
        id: 1,
        number: "+1-555-0789",
        content: "Hey, are you coming to the meeting?",
        type: "received",
        timestamp: new Date(Date.now() - 1800000),
      },
      {
        id: 2,
        number: "+1-555-0789",
        content: "Yes, I'll be there in 10 minutes",
        type: "sent",
        timestamp: new Date(Date.now() - 1200000),
      },
    ])
  }, [])

  const handleScanDevices = async () => {
    setIsScanning(true)
    // Simulate scanning delay
    setTimeout(() => {
      setIsScanning(false)
      setLastScan(new Date())
    }, 2000)
  }

  const selectedDeviceData = devices.find((d) => d.id === selectedDevice)

  const getBatteryColor = (level: number) => {
    if (level > 60) return "text-green-400"
    if (level > 30) return "text-yellow-400"
    return "text-red-400"
  }

  const getSignalBars = (strength: number) => {
    return Array.from({ length: 4 }, (_, i) => (
      <div
        key={i}
        className={`w-1 h-3 ${i < strength ? "bg-green-400" : "bg-gray-600"} rounded-sm`}
        style={{ height: `${(i + 1) * 3 + 3}px` }}
      />
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">📱 PHONE SUITE</h1>
          <p className="text-gray-400">GrapheneOS Device Control Interface (Demo Mode)</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-purple-400 border-purple-400/30">
            DEMO MODE
          </Badge>
          <TechButton onClick={handleScanDevices} disabled={isScanning} className="flex items-center space-x-2">
            {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
            <span>{isScanning ? "Scanning..." : "Scan Devices"}</span>
          </TechButton>
        </div>
      </div>

      {/* Device Selection */}
      <TechPanel title="Connected Devices" className="p-4">
        <div className="space-y-3">
          {devices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No devices connected</p>
              <p className="text-sm">Connect your GrapheneOS device via USB</p>
            </div>
          ) : (
            devices.map((device) => (
              <div
                key={device.id}
                className={`p-3 rounded border cursor-pointer transition-all ${
                  selectedDevice === device.id
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-gray-600 hover:border-gray-500"
                }`}
                onClick={() => setSelectedDevice(device.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="font-medium text-white">{device.name}</div>
                      <div className="text-sm text-gray-400">
                        {device.model} • Android {device.android_version}
                      </div>
                    </div>
                    {device.is_graphene && (
                      <Badge variant="outline" className="text-green-400 border-green-400/30">
                        <Shield className="w-3 h-3 mr-1" />
                        GrapheneOS
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Battery className={`w-4 h-4 ${getBatteryColor(device.battery_level)}`} />
                      <span className="text-sm text-gray-400">{device.battery_level}%</span>
                    </div>
                    <div className="flex items-center space-x-1">{getSignalBars(device.signal_strength)}</div>
                    <div className="flex items-center space-x-1">
                      <Wifi className={`w-4 h-4 ${device.wifi_connected ? "text-blue-400" : "text-gray-600"}`} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 text-xs text-gray-500">
          Last scan: {lastScan.toLocaleTimeString()} • {devices.length} device(s) found
        </div>
      </TechPanel>

      {/* Device Control Tabs */}
      {selectedDeviceData && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800 border border-gray-600">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="calls" className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>Calls</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
            </TabsTrigger>
            <TabsTrigger value="screen" className="flex items-center space-x-2">
              <Monitor className="w-4 h-4" />
              <span>Screen</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center space-x-2">
              <FolderOpen className="w-4 h-4" />
              <span>Files</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TechPanel title="Device Status" className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Battery Level</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={selectedDeviceData.battery_level} className="w-20" />
                      <span className={`text-sm ${getBatteryColor(selectedDeviceData.battery_level)}`}>
                        {selectedDeviceData.battery_level}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Signal Strength</span>
                    <div className="flex items-center space-x-1">
                      {getSignalBars(selectedDeviceData.signal_strength)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">WiFi Status</span>
                    <Badge variant={selectedDeviceData.wifi_connected ? "default" : "secondary"}>
                      {selectedDeviceData.wifi_connected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">OS Version</span>
                    <span className="text-white">Android {selectedDeviceData.android_version}</span>
                  </div>
                </div>
              </TechPanel>

              <TechPanel title="Quick Actions" className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <TechButton variant="outline" className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4" />
                    <span>Shell</span>
                  </TechButton>
                  <TechButton variant="outline" className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4" />
                    <span>Screenshot</span>
                  </TechButton>
                  <TechButton variant="outline" className="flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </TechButton>
                  <TechButton variant="outline" className="flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>Reboot</span>
                  </TechButton>
                </div>
              </TechPanel>
            </div>
          </TabsContent>

          <TabsContent value="calls">
            <TechPanel title="Call Logs" className="p-4">
              <div className="space-y-3">
                {callLogs.map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-3 border border-gray-600 rounded">
                    <div className="flex items-center space-x-3">
                      <Phone className={`w-4 h-4 ${call.type === "incoming" ? "text-green-400" : "text-blue-400"}`} />
                      <div>
                        <div className="text-white">{call.number}</div>
                        <div className="text-sm text-gray-400">
                          {call.type} • {Math.floor(call.duration / 60)}:
                          {(call.duration % 60).toString().padStart(2, "0")}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">{call.timestamp.toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
            </TechPanel>
          </TabsContent>

          <TabsContent value="messages">
            <TechPanel title="SMS Messages" className="p-4">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex items-start space-x-3 p-3 border border-gray-600 rounded">
                    <MessageSquare className="w-4 h-4 text-blue-400 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">{msg.number}</span>
                        <span className="text-sm text-gray-400">{msg.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <div className="text-gray-300">{msg.content}</div>
                      <Badge variant={msg.type === "received" ? "default" : "secondary"} className="mt-2">
                        {msg.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TechPanel>
          </TabsContent>

          <TabsContent value="screen">
            <TechPanel title="Screen Mirroring" className="p-4">
              <div className="text-center space-y-4">
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 aspect-[9/16] max-w-xs mx-auto flex items-center justify-center">
                  {isScreenMirroring ? (
                    <div className="text-center">
                      <Monitor className="w-12 h-12 text-blue-400 mx-auto mb-3 animate-pulse" />
                      <p className="text-white">Screen Mirroring Active</p>
                      <p className="text-sm text-gray-400">Demo Mode - No actual screen capture</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Monitor className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400">Screen mirroring inactive</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-center space-x-3">
                  <TechButton
                    onClick={() => setIsScreenMirroring(!isScreenMirroring)}
                    className="flex items-center space-x-2"
                  >
                    {isScreenMirroring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isScreenMirroring ? "Stop" : "Start"} Mirroring</span>
                  </TechButton>
                  <TechButton variant="outline" className="flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Screenshot</span>
                  </TechButton>
                </div>
              </div>
            </TechPanel>
          </TabsContent>

          <TabsContent value="files">
            <TechPanel title="File Transfer" className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-white">Device Storage</h3>
                  <div className="flex space-x-2">
                    <TechButton variant="outline" size="sm" className="flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>Upload</span>
                    </TechButton>
                    <TechButton variant="outline" size="sm" className="flex items-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </TechButton>
                  </div>
                </div>
                <div className="border border-gray-600 rounded-lg p-4">
                  <div className="text-center text-gray-400 py-8">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>File browser in demo mode</p>
                    <p className="text-sm">Connect to real device for file access</p>
                  </div>
                </div>
              </div>
            </TechPanel>
          </TabsContent>
        </Tabs>
      )}

      {/* Demo Mode Notice */}
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Zap className="w-5 h-5 text-purple-400 mt-0.5" />
          <div>
            <h4 className="text-purple-300 font-medium mb-1">Demo Mode Active</h4>
            <p className="text-purple-200/80 text-sm">
              This is a demonstration interface showing PhoneSuite capabilities. To control real GrapheneOS devices,
              download the code locally and set up ADB integration.
            </p>
            <div className="mt-3 flex space-x-3">
              <TechButton size="sm" variant="outline" className="text-purple-300 border-purple-400/30">
                Download Code
              </TechButton>
              <TechButton size="sm" variant="outline" className="text-purple-300 border-purple-400/30">
                Setup Guide
              </TechButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
