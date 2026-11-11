"use client"

import { useState, useEffect, useCallback } from "react"
import { TechPanel, TechPanelSection } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { DataDisplay } from "@/components/ui/data-display"
import { TypographyMono, TypographySmall } from "@/components/ui/typography"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useResonance } from "@/hooks/useResonance"
import { Terminal } from "@/components/terminal/terminal"
import { Window } from "@/components/ui/window"
import {
  Smartphone,
  Usb,
  Wifi,
  Monitor,
  FolderOpen,
  TerminalIcon,
  Play,
  Zap,
  Activity,
  Eye,
  Phone,
  MessageSquare,
  Camera,
  Battery,
  Cpu,
  HardDrive,
  Clock,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Shield,
  Mic,
  MicOff,
  Router,
  Shuffle,
  Lock,
  Maximize2,
  Network,
  Satellite,
  Radio,
  Settings,
  Globe,
  MapPin,
  Navigation,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import type { ADBDevice, CallLog, SMSMessage, ScreenCapture } from "@/lib/graphene/adbTools"

interface ADBCommand {
  id: string
  command: string
  timestamp: string
  output: string
  success: boolean
}

interface SIPTrunkConfig {
  id: string
  name: string
  server: string
  port: number
  username: string
  password: string
  protocol: "UDP" | "TCP" | "TLS"
  status: "connected" | "disconnected" | "error"
  latency: number
  encryption: boolean
}

interface VoiceProfile {
  id: string
  name: string
  sourceFile: string
  modelPath: string
  quality: number
  trained: boolean
  lastUsed: Date
}

interface AntiTrackingConfig {
  imeiSpoofing: boolean
  locationSpoofing: boolean
  callRouting: boolean
  meshRelay: boolean
  vpnTunneling: boolean
  signalScrambling: boolean
  frequencyHopping: boolean
  currentIMEI: string
  spoofedIMEI: string
  relayNodes: number
  encryptionLevel: "AES256" | "ChaCha20" | "Quantum"
}

export default function PhoneSuite() {
  const router = useRouter()
  const [selectedDevice, setSelectedDevice] = useState<ADBDevice | null>(null)
  const [devices, setDevices] = useState<ADBDevice[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isMirroring, setIsMirroring] = useState(false)
  const [commandHistory, setCommandHistory] = useState<ADBCommand[]>([])
  const [currentCommand, setCurrentCommand] = useState("")
  const [logcatOutput, setLogcatOutput] = useState<string[]>([])
  const [isLogcatRunning, setIsLogcatRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<
    "overview" | "calls" | "messages" | "mirror" | "terminal" | "files" | "voice" | "sip" | "stealth"
  >("overview")
  const [callLog, setCallLog] = useState<CallLog[]>([])
  const [messages, setMessages] = useState<SMSMessage[]>([])
  const [batteryInfo, setBatteryInfo] = useState<{ level: number; status: string; temperature: number } | null>(null)
  const [systemInfo, setSystemInfo] = useState<{
    cpuUsage: number
    memoryUsage: number
    storageUsage: number
    uptime: string
  } | null>(null)
  const [screenshot, setScreenshot] = useState<ScreenCapture | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // New state for advanced features
  const [showTerminalPopup, setShowTerminalPopup] = useState(false)
  const [sipTrunks, setSipTrunks] = useState<SIPTrunkConfig[]>([
    {
      id: "trunk1",
      name: "Ghost Relay Alpha",
      server: "relay.ghost-net.onion",
      port: 5060,
      username: "phantom_user",
      password: "encrypted_pass",
      protocol: "TLS",
      status: "connected",
      latency: 45,
      encryption: true,
    },
    {
      id: "trunk2",
      name: "Shadow Network Beta",
      server: "shadow.darkweb.tor",
      port: 5061,
      username: "shadow_ops",
      password: "quantum_key",
      protocol: "TCP",
      status: "disconnected",
      latency: 0,
      encryption: true,
    },
  ])
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([
    {
      id: "profile1",
      name: "Business Executive",
      sourceFile: "/voices/exec_sample.wav",
      modelPath: "/models/exec_voice.pt",
      quality: 95,
      trained: true,
      lastUsed: new Date(),
    },
    {
      id: "profile2",
      name: "Tech Support",
      sourceFile: "/voices/tech_sample.wav",
      modelPath: "/models/tech_voice.pt",
      quality: 87,
      trained: true,
      lastUsed: new Date(Date.now() - 86400000),
    },
  ])
  const [antiTracking, setAntiTracking] = useState<AntiTrackingConfig>({
    imeiSpoofing: true,
    locationSpoofing: true,
    callRouting: true,
    meshRelay: true,
    vpnTunneling: true,
    signalScrambling: false,
    frequencyHopping: false,
    currentIMEI: "352094087982671",
    spoofedIMEI: "358240051111110",
    relayNodes: 7,
    encryptionLevel: "AES256",
  })
  const [isVoiceCloningActive, setIsVoiceCloningActive] = useState(false)
  const [selectedVoiceProfile, setSelectedVoiceProfile] = useState<string>("profile1")

  // Consciousness integration
  const { pulse, isResonating, fieldCoherence } = useResonance("phonesuite", "PhoneSuite Control", 38)

  const scanForDevices = useCallback(async () => {
    setIsScanning(true)
    setError(null)
    pulse({ amplitude: 0.8, hz: 38 })

    try {
      const response = await fetch("/api/adb/devices")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to scan for devices")
      }

      setDevices(data.devices || [])
      if (data.adbAvailable === false) {
        setError(data.hint || "adb not available on this machine")
      }
      if ((data.devices || []).length > 0 && !selectedDevice) {
        setSelectedDevice(data.devices[0])
      }
    } catch (error) {
      console.error("Failed to scan for devices:", error)
      setError(error instanceof Error ? error.message : "Failed to scan for devices")
    } finally {
      setIsScanning(false)
    }
  }, [pulse, selectedDevice])

  const loadDeviceData = useCallback(async (deviceId: string) => {
    if (!deviceId) return

    setIsLoading(true)
    try {
      // Load battery info
      const batteryResponse = await fetch(`/api/adb/${deviceId}/battery`)
      if (batteryResponse.ok) {
        const batteryData = await batteryResponse.json()
        setBatteryInfo(batteryData.battery)
      }

      // Load system info
      const systemResponse = await fetch(`/api/adb/${deviceId}/system`)
      if (systemResponse.ok) {
        const systemData = await systemResponse.json()
        setSystemInfo(systemData.system)
      }

      // Load call log
      const callsResponse = await fetch(`/api/adb/${deviceId}/calls`)
      if (callsResponse.ok) {
        const callsData = await callsResponse.json()
        setCallLog(callsData.calls)
      }

      // Load messages
      const messagesResponse = await fetch(`/api/adb/${deviceId}/messages`)
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json()
        setMessages(messagesData.messages)
      }
    } catch (error) {
      console.error("Failed to load device data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const executeADBCommand = async () => {
    if (!currentCommand.trim() || !selectedDevice) return

    pulse({ amplitude: 0.6, hz: 36 })
    setIsLoading(true)

    try {
      const response = await fetch(`/api/adb/${selectedDevice.id}/shell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: currentCommand }),
      })

      const data = await response.json()

      const command: ADBCommand = {
        id: `cmd_${Date.now()}`,
        command: currentCommand,
        timestamp: new Date().toISOString(),
        output: response.ok ? data.output : data.error,
        success: response.ok,
      }

      setCommandHistory((prev) => [command, ...prev.slice(0, 19)])
      setCurrentCommand("")
    } catch (error) {
      const command: ADBCommand = {
        id: `cmd_${Date.now()}`,
        command: currentCommand,
        timestamp: new Date().toISOString(),
        output: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        success: false,
      }
      setCommandHistory((prev) => [command, ...prev.slice(0, 19)])
    } finally {
      setIsLoading(false)
    }
  }

  const captureScreenshot = async () => {
    if (!selectedDevice) return

    setIsLoading(true)
    pulse({ amplitude: 1.0, hz: 40 })

    try {
      const response = await fetch(`/api/adb/${selectedDevice.id}/screenshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "png" }),
      })

      const data = await response.json()

      if (response.ok) {
        setScreenshot(data.screenshot)
      } else {
        setError(data.error || "Failed to capture screenshot")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to capture screenshot")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleVoiceCloning = () => {
    setIsVoiceCloningActive(!isVoiceCloningActive)
    pulse({ amplitude: 0.9, hz: 42 })
  }

  const connectSIPTrunk = async (trunkId: string) => {
    setSipTrunks((prev) =>
      prev.map((trunk) =>
        trunk.id === trunkId ? { ...trunk, status: "connected", latency: Math.floor(Math.random() * 100) + 20 } : trunk,
      ),
    )
    pulse({ amplitude: 0.7, hz: 35 })
  }

  const toggleAntiTrackingFeature = (feature: keyof AntiTrackingConfig) => {
    if (typeof antiTracking[feature] === "boolean") {
      setAntiTracking((prev) => ({
        ...prev,
        [feature]: !prev[feature],
      }))
      pulse({ amplitude: 0.8, hz: 39 })
    }
  }

  const spoofIMEI = () => {
    const newIMEI = Math.floor(Math.random() * 900000000000000) + 100000000000000
    setAntiTracking((prev) => ({
      ...prev,
      spoofedIMEI: newIMEI.toString(),
    }))
    pulse({ amplitude: 1.0, hz: 44 })
  }

  // Auto-scan for devices on mount
  useEffect(() => {
    scanForDevices()
  }, [scanForDevices])

  // Load device data when device is selected
  useEffect(() => {
    if (selectedDevice) {
      loadDeviceData(selectedDevice.id)
    }
  }, [selectedDevice, loadDeviceData])

  // Auto-refresh device data every 30 seconds
  useEffect(() => {
    if (!selectedDevice) return

    const interval = setInterval(() => {
      loadDeviceData(selectedDevice.id)
    }, 30000)

    return () => clearInterval(interval)
  }, [selectedDevice, loadDeviceData])

  const getConnectionIcon = (type: ADBDevice["transport"]) => {
    switch (type) {
      case "usb":
        return Usb
      case "wifi":
        return Wifi
      default:
        return Smartphone
    }
  }

  const getStatusColor = (status: ADBDevice["status"]) => {
    switch (status) {
      case "device":
        return "text-green-400"
      case "unauthorized":
        return "text-yellow-400"
      case "offline":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusBadge = (status: ADBDevice["status"]) => {
    switch (status) {
      case "device":
        return "success"
      case "unauthorized":
        return "warning"
      case "offline":
        return "danger"
      default:
        return "outline"
    }
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Eye },
    { id: "calls", label: "Calls", icon: Phone },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "mirror", label: "Mirror", icon: Monitor },
    { id: "terminal", label: "Terminal", icon: TerminalIcon },
    { id: "voice", label: "Voice", icon: Mic },
    { id: "sip", label: "SIP Trunks", icon: Router },
    { id: "stealth", label: "Stealth", icon: Shield },
    { id: "files", label: "Files", icon: FolderOpen },
  ] as const

  return (
    <div className="h-full bg-black text-gray-100 p-6 space-y-6">
      {/* Header with Return Button */}
      <TechPanel
        title="GRAPHENEOS PHONESUITE"
        cornerAccent
        borderAccent
        glowEffect={selectedDevice?.status === "device"}
        icon={<Smartphone size={16} />}
        className="bg-black/90 border-gray-800"
      >
        <TechPanelSection>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <TechButton
                onClick={() => router.push("/command-hub")}
                size="sm"
                cornerAccent
                icon={<ArrowLeft size={14} />}
                className="bg-gray-900 hover:bg-gray-800 border-gray-700"
              >
                COMMAND HUB
              </TechButton>
              <div
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-200",
                  selectedDevice?.status === "device" ? "bg-green-400 animate-pulse shadow-glow-sm" : "bg-gray-500",
                )}
              />
              <div>
                <TypographyMono className="text-sm text-gray-100">
                  {selectedDevice ? selectedDevice.model : "No Device Selected"}
                </TypographyMono>
                {selectedDevice && (
                  <TypographySmall className="text-gray-400">
                    {selectedDevice.isGrapheneOS ? "GrapheneOS" : "Android"} {selectedDevice.androidVersion} • API{" "}
                    {selectedDevice.apiLevel}
                  </TypographySmall>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {error && (
                <Badge variant="danger" className="flex items-center space-x-1 bg-red-900/50 border-red-700">
                  <AlertTriangle size={12} />
                  <span>ERROR</span>
                </Badge>
              )}
              {selectedDevice && (
                <>
                  <Badge variant={getStatusBadge(selectedDevice.status)} className="bg-gray-900 border-gray-700">
                    {selectedDevice.status.toUpperCase()}
                  </Badge>
                  {batteryInfo && (
                    <DataDisplay
                      label="Battery"
                      value={batteryInfo.level.toString()}
                      unit="%"
                      trend={batteryInfo.level > 50 ? "up" : batteryInfo.level < 20 ? "down" : "stable"}
                      className="text-xs text-gray-300"
                    />
                  )}
                </>
              )}
              <TechButton
                onClick={scanForDevices}
                size="sm"
                cornerAccent
                disabled={isScanning}
                icon={<RefreshCw size={14} className={isScanning ? "animate-spin" : ""} />}
                className="bg-gray-900 hover:bg-gray-800 border-gray-700"
              >
                {isScanning ? "SCANNING..." : "REFRESH"}
              </TechButton>
              <TechButton
                onClick={() => setShowTerminalPopup(true)}
                size="sm"
                cornerAccent
                icon={<Maximize2 size={14} />}
                className="bg-gray-900 hover:bg-gray-800 border-gray-700"
              >
                TERMINAL
              </TechButton>
            </div>
          </div>
        </TechPanelSection>
      </TechPanel>

      {/* Terminal Popup Window */}
      {showTerminalPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <Window
            title="ADVANCED PHONESUITE TERMINAL"
            variant="terminal"
            size="large"
            onClose={() => setShowTerminalPopup(false)}
            onMinimize={() => setShowTerminalPopup(false)}
            className="w-[90vw] h-[80vh] bg-black border-gray-800"
          >
            <div className="h-full bg-black text-green-400 font-mono">
              <Terminal
                className="h-full bg-black border-none"
                initialMessage="PhoneSuite Advanced Terminal - ADB, Voice Cloning, SIP Trunking Ready"
                showHeader={false}
              />
            </div>
          </Window>
        </div>
      )}

      {error && (
        <TechPanel title="ERROR" cornerAccent borderAccent className="border-red-500/40 bg-black/90">
          <TechPanelSection>
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle size={16} />
              <TypographyMono className="text-sm">{error}</TypographyMono>
            </div>
          </TechPanelSection>
        </TechPanel>
      )}

      {/* Device List */}
      {devices.length > 0 && (
        <TechPanel
          title="CONNECTED DEVICES"
          cornerAccent
          borderAccent
          icon={<Smartphone size={16} />}
          className="bg-black/90 border-gray-800"
        >
          <TechPanelSection>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map((device) => {
                const ConnectionIcon = getConnectionIcon(device.transport)
                return (
                  <div
                    key={device.id}
                    className={cn(
                      "p-4 border rounded-sm cursor-pointer transition-all duration-200 bg-gray-900/50",
                      selectedDevice?.id === device.id
                        ? "border-blue-500/60 bg-blue-500/10"
                        : "border-gray-700 hover:border-gray-600 hover:bg-gray-800/50",
                    )}
                    onClick={() => setSelectedDevice(device)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <ConnectionIcon size={16} className="text-gray-400" />
                        <Badge
                          variant={device.isGrapheneOS ? "success" : "outline"}
                          size="sm"
                          className="bg-gray-800 border-gray-600"
                        >
                          {device.isGrapheneOS ? "GRAPHENE" : "ANDROID"}
                        </Badge>
                      </div>
                      <Badge variant={getStatusBadge(device.status)} size="sm" className="bg-gray-800 border-gray-600">
                        {device.status.toUpperCase()}
                      </Badge>
                    </div>
                    <TypographyMono className="text-sm mb-1 text-gray-100">{device.model}</TypographyMono>
                    <TypographySmall className="text-gray-400">
                      {device.product} • {device.transport.toUpperCase()}
                    </TypographySmall>
                    {device.resolution && (
                      <TypographySmall className="text-gray-500">
                        {device.resolution} • {device.density}dpi
                      </TypographySmall>
                    )}
                  </div>
                )
              })}
            </div>
          </TechPanelSection>
        </TechPanel>
      )}

      {selectedDevice && (
        <>
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-900/50 p-1 rounded-sm border border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-sm transition-all duration-200 font-mono text-sm",
                  activeTab === tab.id
                    ? "bg-gray-800 text-gray-100 border border-gray-700"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50",
                )}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Device Info */}
              <TechPanel
                title="DEVICE STATUS"
                cornerAccent
                borderAccent
                icon={<Activity size={16} />}
                className="bg-black/90 border-gray-800"
              >
                <TechPanelSection>
                  <div className="space-y-4">
                    {batteryInfo && (
                      <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded border border-gray-800">
                        <div className="flex items-center space-x-2">
                          <Battery size={16} className="text-green-400" />
                          <TypographyMono className="text-sm text-gray-100">Battery</TypographyMono>
                        </div>
                        <div className="text-right">
                          <TypographyMono className="text-sm text-gray-100">{batteryInfo.level}%</TypographyMono>
                          <TypographySmall className="text-gray-400">{batteryInfo.status}</TypographySmall>
                        </div>
                      </div>
                    )}

                    {systemInfo && (
                      <>
                        <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded border border-gray-800">
                          <div className="flex items-center space-x-2">
                            <Cpu size={16} className="text-blue-400" />
                            <TypographyMono className="text-sm text-gray-100">CPU Usage</TypographyMono>
                          </div>
                          <TypographyMono className="text-sm text-gray-100">
                            {systemInfo.cpuUsage.toFixed(1)}%
                          </TypographyMono>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded border border-gray-800">
                          <div className="flex items-center space-x-2">
                            <HardDrive size={16} className="text-purple-400" />
                            <TypographyMono className="text-sm text-gray-100">Memory</TypographyMono>
                          </div>
                          <TypographyMono className="text-sm text-gray-100">
                            {systemInfo.memoryUsage.toFixed(1)}%
                          </TypographyMono>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded border border-gray-800">
                          <div className="flex items-center space-x-2">
                            <Clock size={16} className="text-yellow-400" />
                            <TypographyMono className="text-sm text-gray-100">Uptime</TypographyMono>
                          </div>
                          <TypographyMono className="text-sm text-gray-100">{systemInfo.uptime}</TypographyMono>
                        </div>
                      </>
                    )}
                  </div>
                </TechPanelSection>
              </TechPanel>

              {/* Quick Actions */}
              <TechPanel
                title="QUICK ACTIONS"
                cornerAccent
                borderAccent
                icon={<Zap size={16} />}
                className="bg-black/90 border-gray-800"
              >
                <TechPanelSection>
                  <div className="grid grid-cols-2 gap-3">
                    <TechButton
                      onClick={captureScreenshot}
                      cornerAccent
                      disabled={isLoading}
                      icon={<Camera size={14} />}
                      className="bg-gray-900 hover:bg-gray-800 border-gray-700"
                    >
                      SCREENSHOT
                    </TechButton>
                    <TechButton
                      onClick={() => setActiveTab("terminal")}
                      cornerAccent
                      icon={<TerminalIcon size={14} />}
                      className="bg-gray-900 hover:bg-gray-800 border-gray-700"
                    >
                      TERMINAL
                    </TechButton>
                    <TechButton
                      onClick={() => setActiveTab("voice")}
                      cornerAccent
                      icon={<Mic size={14} />}
                      className="bg-gray-900 hover:bg-gray-800 border-gray-700"
                    >
                      VOICE CLONE
                    </TechButton>
                    <TechButton
                      onClick={() => setActiveTab("stealth")}
                      cornerAccent
                      icon={<Shield size={14} />}
                      className="bg-gray-900 hover:bg-gray-800 border-gray-700"
                    >
                      STEALTH MODE
                    </TechButton>
                  </div>
                </TechPanelSection>
              </TechPanel>
            </div>
          )}

          {activeTab === "voice" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TechPanel
                title="VOICE CLONING CONTROL"
                cornerAccent
                borderAccent
                icon={<Mic size={16} />}
                className="bg-black/90 border-gray-800"
              >
                <TechPanelSection>
                  <div className="mb-3 rounded border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-300">
                    UI mock only: these toggles change nothing on a device. Voice cloning is not implemented and will not be.
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded border border-gray-800">
                      <div className="flex items-center space-x-2">
                        {isVoiceCloningActive ? (
                          <Mic size={16} className="text-green-400" />
                        ) : (
                          <MicOff size={16} className="text-red-400" />
                        )}
                        <TypographyMono className="text-sm text-gray-100">Voice Cloning</TypographyMono>
                      </div>
                      <TechButton
                        onClick={toggleVoiceCloning}
                        size="sm"
                        cornerAccent
                        className={cn(
                          "border-gray-700",
                          isVoiceCloningActive ? "bg-green-900 hover:bg-green-800" : "bg-red-900 hover:bg-red-800",
                        )}
                      >
                        {isVoiceCloningActive ? "ACTIVE" : "INACTIVE"}
                      </TechButton>
                    </div>

                    <div className="space-y-2">
                      <TypographyMono className="text-sm text-gray-300">Voice Profiles:</TypographyMono>
                      {voiceProfiles.map((profile) => (
                        <div
                          key={profile.id}
                          className={cn(
                            "p-3 bg-gray-900/50 rounded border cursor-pointer transition-all duration-200",
                            selectedVoiceProfile === profile.id
                              ? "border-blue-500/60 bg-blue-500/10"
                              : "border-gray-800 hover:border-gray-700",
                          )}
                          onClick={() => setSelectedVoiceProfile(profile.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <TypographyMono className="text-sm text-gray-100">{profile.name}</TypographyMono>
                              <TypographySmall className="text-gray-400">Quality: {profile.quality}%</TypographySmall>
                            </div>
                            <Badge
                              variant={profile.trained ? "success" : "warning"}
                              size="sm"
                              className="bg-gray-800 border-gray-600"
                            >
                              {profile.trained ? "TRAINED" : "TRAINING"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TechPanelSection>
              </TechPanel>

              <TechPanel
                title="VOICE DEFENSE SYSTEMS"
                cornerAccent
                borderAccent
                icon={<Shield size={16} />}
                className="bg-black/90 border-gray-800"
              >
                <TechPanelSection>
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-900/50 rounded border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <TypographyMono className="text-sm text-gray-100">AI Voice Detection</TypographyMono>
                        <Badge variant="success" size="sm" className="bg-green-900 border-green-700">
                          ACTIVE
                        </Badge>
                      </div>
                      <TypographySmall className="text-gray-400">
                        Real-time detection of synthetic voices
                      </TypographySmall>
                    </div>

                    <div className="p-3 bg-gray-900/50 rounded border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <TypographyMono className="text-sm text-gray-100">Voice Scrambling</TypographyMono>
                        <TechButton size="sm" cornerAccent className="bg-gray-800 hover:bg-gray-700 border-gray-600">
                          ENABLE
                        </TechButton>
                      </div>
                      <TypographySmall className="text-gray-400">
                        Scramble outgoing voice to prevent cloning
                      </TypographySmall>
                    </div>

                    <div className="p-3 bg-gray-900/50 rounded border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <TypographyMono className="text-sm text-gray-100">Biometric Verification</TypographyMono>
                        <Badge variant="warning" size="sm" className="bg-yellow-900 border-yellow-700">
                          STANDBY
                        </Badge>
                      </div>
                      <TypographySmall className="text-gray-400">Multi-factor voice authentication</TypographySmall>
                    </div>
                  </div>
                </TechPanelSection>
              </TechPanel>
            </div>
          )}

          {activeTab === "sip" && (
            <TechPanel
              title="SIP TRUNK MANAGEMENT"
              cornerAccent
              borderAccent
              icon={<Router size={16} />}
              className="bg-black/90 border-gray-800"
            >
              <div className="mb-3 rounded border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-300">
                UI mock only: no SIP trunk is connected. For real outbound calls use the AI Caller (/ai-caller).
              </div>
              <TechPanelSection>
                <div className="space-y-4">
                  {sipTrunks.map((trunk) => (
                    <div key={trunk.id} className="p-4 bg-gray-900/50 rounded border border-gray-800">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Network
                            size={16}
                            className={trunk.status === "connected" ? "text-green-400" : "text-red-400"}
                          />
                          <div>
                            <TypographyMono className="text-sm text-gray-100">{trunk.name}</TypographyMono>
                            <TypographySmall className="text-gray-400">
                              {trunk.server}:{trunk.port}
                            </TypographySmall>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={trunk.status === "connected" ? "success" : "danger"}
                            size="sm"
                            className={
                              trunk.status === "connected"
                                ? "bg-green-900 border-green-700"
                                : "bg-red-900 border-red-700"
                            }
                          >
                            {trunk.status.toUpperCase()}
                          </Badge>
                          {trunk.status === "connected" && (
                            <DataDisplay
                              label="Latency"
                              value={trunk.latency.toString()}
                              unit="ms"
                              className="text-xs"
                            />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                        <div className="text-center">
                          <TypographySmall className="text-gray-400">Protocol</TypographySmall>
                          <TypographyMono className="text-xs text-gray-100">{trunk.protocol}</TypographyMono>
                        </div>
                        <div className="text-center">
                          <TypographySmall className="text-gray-400">Encryption</TypographySmall>
                          <TypographyMono className="text-xs text-gray-100">
                            {trunk.encryption ? "AES256" : "None"}
                          </TypographyMono>
                        </div>
                        <div className="text-center">
                          <TypographySmall className="text-gray-400">User</TypographySmall>
                          <TypographyMono className="text-xs text-gray-100">{trunk.username}</TypographyMono>
                        </div>
                        <div className="text-center">
                          <TypographySmall className="text-gray-400">Status</TypographySmall>
                          <div className="flex items-center justify-center space-x-1">
                            {trunk.encryption && <Lock size={12} className="text-green-400" />}
                            <Globe size={12} className="text-blue-400" />
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <TechButton
                          onClick={() => connectSIPTrunk(trunk.id)}
                          size="sm"
                          cornerAccent
                          disabled={trunk.status === "connected"}
                          className="bg-gray-800 hover:bg-gray-700 border-gray-600"
                        >
                          {trunk.status === "connected" ? "CONNECTED" : "CONNECT"}
                        </TechButton>
                        <TechButton
                          size="sm"
                          cornerAccent
                          icon={<Settings size={12} />}
                          className="bg-gray-800 hover:bg-gray-700 border-gray-600"
                        >
                          CONFIG
                        </TechButton>
                        <TechButton
                          size="sm"
                          cornerAccent
                          icon={<Shuffle size={12} />}
                          className="bg-gray-800 hover:bg-gray-700 border-gray-600"
                        >
                          ROTATE
                        </TechButton>
                      </div>
                    </div>
                  ))}

                  <TechButton
                    cornerAccent
                    icon={<Router size={14} />}
                    className="w-full bg-gray-800 hover:bg-gray-700 border-gray-600"
                  >
                    ADD NEW SIP TRUNK
                  </TechButton>
                </div>
              </TechPanelSection>
            </TechPanel>
          )}

          {activeTab === "stealth" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TechPanel
                title="ANTI-TRACKING SYSTEMS"
                cornerAccent
                borderAccent
                icon={<Shield size={16} />}
                className="bg-black/90 border-gray-800"
              >
                <TechPanelSection>
                  <div className="mb-3 rounded border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-300">
                    UI mock only: these toggles change nothing on a device. IMEI and location spoofing are not implemented and will not be.
                  </div>
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-900/50 rounded border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Smartphone size={16} className="text-blue-400" />
                          <TypographyMono className="text-sm text-gray-100">IMEI Spoofing</TypographyMono>
                        </div>
                        <TechButton
                          onClick={() => toggleAntiTrackingFeature("imeiSpoofing")}
                          size="sm"
                          cornerAccent
                          className={cn(
                            "border-gray-700",
                            antiTracking.imeiSpoofing
                              ? "bg-green-900 hover:bg-green-800"
                              : "bg-red-900 hover:bg-red-800",
                          )}
                        >
                          {antiTracking.imeiSpoofing ? "ON" : "OFF"}
                        </TechButton>
                      </div>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Real IMEI:</span>
                          <span className="text-gray-300 font-mono">{antiTracking.currentIMEI}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Spoofed:</span>
                          <span className="text-green-400 font-mono">{antiTracking.spoofedIMEI}</span>
                        </div>
                      </div>
                      <TechButton
                        onClick={spoofIMEI}
                        size="sm"
                        cornerAccent
                        icon={<Shuffle size={12} />}
                        className="mt-2 bg-gray-800 hover:bg-gray-700 border-gray-600"
                      >
                        GENERATE NEW
                      </TechButton>
                    </div>

                    <div className="p-3 bg-gray-900/50 rounded border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <MapPin size={16} className="text-red-400" />
                          <TypographyMono className="text-sm text-gray-100">Location Spoofing</TypographyMono>
                        </div>
                        <TechButton
                          onClick={() => toggleAntiTrackingFeature("locationSpoofing")}
                          size="sm"
                          cornerAccent
                          className={cn(
                            "border-gray-700",
                            antiTracking.locationSpoofing
                              ? "bg-green-900 hover:bg-green-800"
                              : "bg-red-900 hover:bg-red-800",
                          )}
                        >
                          {antiTracking.locationSpoofing ? "ON" : "OFF"}
                        </TechButton>
                      </div>
                      <TypographySmall className="text-gray-400">GPS coordinates randomization active</TypographySmall>
                    </div>

                    <div className="p-3 bg-gray-900/50 rounded border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Navigation size={16} className="text-purple-400" />
                          <TypographyMono className="text-sm text-gray-100">Mesh Relay Network</TypographyMono>
                        </div>
                        <TechButton
                          onClick={() => toggleAntiTrackingFeature("meshRelay")}
                          size="sm"
                          cornerAccent
                          className={cn(
                            "border-gray-700",
                            antiTracking.meshRelay ? "bg-green-900 hover:bg-green-800" : "bg-red-900 hover:bg-red-800",
                          )}
                        >
                          {antiTracking.meshRelay ? "ON" : "OFF"}
                        </TechButton>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Active Nodes:</span>
                        <span className="text-green-400 font-mono">{antiTracking.relayNodes}</span>
                      </div>
                    </div>
                  </div>
                </TechPanelSection>
              </TechPanel>

              <TechPanel
                title="SIGNAL DEFENSE"
                cornerAccent
                borderAccent
                icon={<Radio size={16} />}
                className="bg-black/90 border-gray-800"
              >
                <TechPanelSection>
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-900/50 rounded border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Radio size={16} className="text-yellow-400" />
                          <TypographyMono className="text-sm text-gray-100">Signal Scrambling</TypographyMono>
                        </div>
                        <TechButton
                          onClick={() => toggleAntiTrackingFeature("signalScrambling")}
                          size="sm"
                          cornerAccent
                          className={cn(
                            "border-gray-700",
                            antiTracking.signalScrambling
                              ? "bg-green-900 hover:bg-green-800"
                              : "bg-red-900 hover:bg-red-800",
                          )}
                        >
                          {antiTracking.signalScrambling ? "ON" : "OFF"}
                        </TechButton>
                      </div>
                      <TypographySmall className="text-gray-400">RF signature obfuscation</TypographySmall>
                    </div>

                    <div className="p-3 bg-gray-900/50 rounded border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Satellite size={16} className="text-cyan-400" />
                          <TypographyMono className="text-sm text-gray-100">Frequency Hopping</TypographyMono>
                        </div>
                        <TechButton
                          onClick={() => toggleAntiTrackingFeature("frequencyHopping")}
                          size="sm"
                          cornerAccent
                          className={cn(
                            "border-gray-700",
                            antiTracking.frequencyHopping
                              ? "bg-green-900 hover:bg-green-800"
                              : "bg-red-900 hover:bg-red-800",
                          )}
                        >
                          {antiTracking.frequencyHopping ? "ON" : "OFF"}
                        </TechButton>
                      </div>
                      <TypographySmall className="text-gray-400">Dynamic frequency switching</TypographySmall>
                    </div>

                    <div className="p-3 bg-gray-900/50 rounded border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <TypographyMono className="text-sm text-gray-100">Encryption Level</TypographyMono>
                        <Badge variant="success" size="sm" className="bg-green-900 border-green-700">
                          {antiTracking.encryptionLevel}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <TechButton
                          size="sm"
                          cornerAccent
                          className={cn(
                            "text-xs border-gray-700",
                            antiTracking.encryptionLevel === "AES256" ? "bg-green-900" : "bg-gray-800",
                          )}
                          onClick={() => setAntiTracking((prev) => ({ ...prev, encryptionLevel: "AES256" }))}
                        >
                          AES256
                        </TechButton>
                        <TechButton
                          size="sm"
                          cornerAccent
                          className={cn(
                            "text-xs border-gray-700",
                            antiTracking.encryptionLevel === "ChaCha20" ? "bg-green-900" : "bg-gray-800",
                          )}
                          onClick={() => setAntiTracking((prev) => ({ ...prev, encryptionLevel: "ChaCha20" }))}
                        >
                          ChaCha20
                        </TechButton>
                        <TechButton
                          size="sm"
                          cornerAccent
                          className={cn(
                            "text-xs border-gray-700",
                            antiTracking.encryptionLevel === "Quantum" ? "bg-green-900" : "bg-gray-800",
                          )}
                          onClick={() => setAntiTracking((prev) => ({ ...prev, encryptionLevel: "Quantum" }))}
                        >
                          Quantum
                        </TechButton>
                      </div>
                    </div>
                  </div>
                </TechPanelSection>
              </TechPanel>
            </div>
          )}

          {activeTab === "calls" && (
            <TechPanel
              title="CALL LOG"
              cornerAccent
              borderAccent
              icon={<Phone size={16} />}
              className="bg-black/90 border-gray-800"
            >
              <TechPanelSection>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {callLog.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {isLoading ? "Loading call log..." : "No calls found"}
                      </div>
                    ) : (
                      callLog.map((call) => (
                        <div
                          key={call.id}
                          className="flex items-center justify-between p-3 bg-gray-900/50 rounded border border-gray-800"
                        >
                          <div className="flex items-center space-x-3">
                            <Phone
                              size={16}
                              className={cn(
                                call.type === "incoming" && "text-green-400",
                                call.type === "outgoing" && "text-blue-400",
                                call.type === "missed" && "text-red-400",
                              )}
                            />
                            <div>
                              <TypographyMono className="text-sm text-gray-100">{call.number}</TypographyMono>
                              {call.name && <TypographySmall className="text-gray-400">{call.name}</TypographySmall>}
                            </div>
                          </div>
                          <div className="text-right">
                            <TypographyMono className="text-sm text-gray-100">
                              {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, "0")}
                            </TypographyMono>
                            <TypographySmall className="text-gray-400">
                              {call.timestamp.toLocaleString()}
                            </TypographySmall>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TechPanelSection>
            </TechPanel>
          )}

          {activeTab === "messages" && (
            <TechPanel
              title="SMS MESSAGES"
              cornerAccent
              borderAccent
              icon={<MessageSquare size={16} />}
              className="bg-black/90 border-gray-800"
            >
              <TechPanelSection>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {isLoading ? "Loading messages..." : "No messages found"}
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div key={message.id} className="p-3 bg-gray-900/50 rounded border border-gray-800">
                          <div className="flex items-center justify-between mb-2">
                            <TypographyMono className="text-sm text-gray-100">{message.address}</TypographyMono>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant={message.type === "inbox" ? "outline" : "success"}
                                size="sm"
                                className="bg-gray-800 border-gray-600"
                              >
                                {message.type.toUpperCase()}
                              </Badge>
                              {!message.read && (
                                <Badge variant="warning" size="sm" className="bg-yellow-900 border-yellow-700">
                                  UNREAD
                                </Badge>
                              )}
                            </div>
                          </div>
                          <TypographySmall className="text-gray-300 mb-2">{message.body}</TypographySmall>
                          <TypographySmall className="text-gray-500">
                            {message.timestamp.toLocaleString()}
                          </TypographySmall>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TechPanelSection>
            </TechPanel>
          )}

          {activeTab === "mirror" && (
            <TechPanel
              title="SCREEN MIRROR"
              cornerAccent
              borderAccent
              icon={<Monitor size={16} />}
              className="bg-black/90 border-gray-800"
            >
              <TechPanelSection>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <TypographyMono className="text-sm text-gray-100">Screen Capture</TypographyMono>
                    <TechButton
                      onClick={captureScreenshot}
                      cornerAccent
                      disabled={isLoading}
                      icon={<Camera size={14} />}
                      className="bg-gray-900 hover:bg-gray-800 border-gray-700"
                    >
                      {isLoading ? "CAPTURING..." : "CAPTURE"}
                    </TechButton>
                  </div>

                  {screenshot ? (
                    <div className="max-w-sm mx-auto">
                      <img
                        src={`data:image/${screenshot.format};base64,${screenshot.data}`}
                        alt="Device Screenshot"
                        className="w-full border border-gray-700 rounded"
                      />
                      <div className="mt-2 text-center">
                        <TypographySmall className="text-gray-400">
                          {screenshot.resolution} • {(screenshot.size / 1024 / 1024).toFixed(2)}MB
                        </TypographySmall>
                        <TypographySmall className="text-gray-500">
                          {screenshot.timestamp.toLocaleString()}
                        </TypographySmall>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[9/16] max-w-sm mx-auto bg-gray-900/50 border border-gray-800 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Monitor className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                        <TypographyMono className="text-sm text-gray-500">No Screenshot</TypographyMono>
                        <TypographySmall className="text-gray-600">Capture a screenshot to view</TypographySmall>
                      </div>
                    </div>
                  )}
                </div>
              </TechPanelSection>
            </TechPanel>
          )}

          {activeTab === "terminal" && (
            <TechPanel
              title="ADB TERMINAL"
              cornerAccent
              borderAccent
              icon={<TerminalIcon size={16} />}
              className="bg-black/90 border-gray-800"
            >
              <TechPanelSection>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={currentCommand}
                      onChange={(e) => setCurrentCommand(e.target.value)}
                      placeholder="Enter ADB shell command..."
                      className="flex-1 bg-gray-900 border-gray-700 text-gray-100 font-mono text-sm"
                      onKeyPress={(e) => e.key === "Enter" && executeADBCommand()}
                      disabled={isLoading}
                    />
                    <TechButton
                      onClick={executeADBCommand}
                      cornerAccent
                      disabled={!currentCommand.trim() || isLoading}
                      icon={<Play size={14} />}
                      className="bg-gray-900 hover:bg-gray-800 border-gray-700"
                    >
                      {isLoading ? "EXECUTING..." : "EXECUTE"}
                    </TechButton>
                  </div>

                  <ScrollArea className="h-64 bg-gray-900 border border-gray-800 rounded p-3">
                    <div className="space-y-2 font-mono text-xs">
                      {commandHistory.length === 0 ? (
                        <div className="text-gray-500 text-center py-8">No commands executed yet</div>
                      ) : (
                        commandHistory.map((cmd) => (
                          <div key={cmd.id} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <TypographyMono className={cmd.success ? "text-green-400" : "text-red-400"}>
                                $ {cmd.command}
                              </TypographyMono>
                              <TypographyMono className="text-gray-600 text-xs">
                                {new Date(cmd.timestamp).toLocaleTimeString()}
                              </TypographyMono>
                            </div>
                            <div
                              className={cn(
                                "pl-2 border-l border-gray-700",
                                cmd.success ? "text-gray-300" : "text-red-400",
                              )}
                            >
                              {cmd.output}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>

                  {/* Quick Commands */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <TechButton
                      onClick={() => setCurrentCommand("getprop ro.build.version.release")}
                      size="sm"
                      cornerAccent
                      className="text-xs bg-gray-900 hover:bg-gray-800 border-gray-700"
                    >
                      ANDROID VER
                    </TechButton>
                    <TechButton
                      onClick={() => setCurrentCommand("dumpsys battery")}
                      size="sm"
                      cornerAccent
                      className="text-xs bg-gray-900 hover:bg-gray-800 border-gray-700"
                    >
                      BATTERY
                    </TechButton>
                    <TechButton
                      onClick={() => setCurrentCommand("pm list packages")}
                      size="sm"
                      cornerAccent
                      className="text-xs bg-gray-900 hover:bg-gray-800 border-gray-700"
                    >
                      PACKAGES
                    </TechButton>
                    <TechButton
                      onClick={() => setCurrentCommand("df -h")}
                      size="sm"
                      cornerAccent
                      className="text-xs bg-gray-900 hover:bg-gray-800 border-gray-700"
                    >
                      STORAGE
                    </TechButton>
                  </div>
                </div>
              </TechPanelSection>
            </TechPanel>
          )}
        </>
      )}
    </div>
  )
}
