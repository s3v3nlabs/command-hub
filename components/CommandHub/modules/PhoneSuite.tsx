"use client"

import { useState, useEffect, useRef } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useResonance } from "@/hooks/useResonance"
import { speak, playAlertSound, generateResonanceFrequency } from "@/lib/audio"
import {
  Smartphone,
  Phone,
  MessageSquare,
  Camera,
  Terminal,
  Shield,
  Wifi,
  Battery,
  Signal,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Play,
  Mic,
  MicOff,
  Lock,
  Unlock,
  Zap,
  Activity,
  FileText,
  Settings,
  RefreshCw,
  XCircle,
  ArrowLeft,
} from "lucide-react"

interface GrapheneDevice {
  id: string
  name: string
  model: string
  androidVersion: string
  grapheneVersion: string
  status: "connected" | "disconnected" | "unauthorized"
  battery: number
  signal: number
  carrier: string
  imei: string
  location: { lat: number; lng: number } | null
  lastSeen: string
  securityLevel: "high" | "medium" | "low"
  vpnActive: boolean
  torActive: boolean
}

interface VoiceProfile {
  id: string
  name: string
  sourceFile: string
  quality: number
  trained: boolean
  lastUsed: string
  defenseLevel: "basic" | "advanced" | "military"
}

interface SipTrunk {
  id: string
  provider: string
  endpoint: string
  username: string
  status: "active" | "inactive" | "error"
  encryption: boolean
  ghostRelay: boolean
  lastCall: string
}

interface StealthConfig {
  imeiSpoofing: boolean
  locationSpoofing: boolean
  meshRelay: boolean
  rfScrambling: boolean
  frequencyHopping: boolean
  quantumEncryption: boolean
  signalDefense: boolean
}

interface CallRecord {
  id: string
  number: string
  contact: string
  type: "incoming" | "outgoing" | "missed"
  duration: number
  timestamp: string
  encrypted: boolean
  carrier: string
  location: string
}

interface MessageRecord {
  id: string
  number: string
  contact: string
  content: string
  timestamp: string
  type: "sms" | "mms"
  encrypted: boolean
  attachments: string[]
}

interface AppInfo {
  packageName: string
  name: string
  version: string
  size: number
  permissions: string[]
  lastUpdated: string
  system: boolean
  enabled: boolean
}

interface FileItem {
  name: string
  path: string
  type: "file" | "directory"
  size: number
  modified: string
  permissions: string
}

export default function PhoneSuite() {
  // Harmonic Defense System
  const { pulse, isResonating, setFrequency } = useResonance("phone-suite", "PhoneSuite Defense Grid", 108)
  const audioContextRef = useRef<AudioContext | null>(null)
  const harmonicOscillatorsRef = useRef<OscillatorNode[]>([])

  // State Management
  const [activeTab, setActiveTab] = useState<
    "devices" | "voice" | "sip" | "stealth" | "calls" | "messages" | "apps" | "files" | "terminal" | "logs"
  >("devices")
  const [selectedDevice, setSelectedDevice] = useState<GrapheneDevice | null>(null)
  const [devices, setDevices] = useState<GrapheneDevice[]>([])
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([])
  const [sipTrunks, setSipTrunks] = useState<SipTrunk[]>([])
  const [stealthConfig, setStealthConfig] = useState<StealthConfig>({
    imeiSpoofing: false,
    locationSpoofing: false,
    meshRelay: false,
    rfScrambling: false,
    frequencyHopping: false,
    quantumEncryption: true,
    signalDefense: true,
  })
  const [callRecords, setCallRecords] = useState<CallRecord[]>([])
  const [messageRecords, setMessageRecords] = useState<MessageRecord[]>([])
  const [apps, setApps] = useState<AppInfo[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentPath, setCurrentPath] = useState("/")
  const [terminalOutput, setTerminalOutput] = useState<string[]>([])
  const [terminalInput, setTerminalInput] = useState("")
  const [logOutput, setLogOutput] = useState<string[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showTerminalPopup, setShowTerminalPopup] = useState(false)
  const [screenshot, setScreenshot] = useState<string | null>(null)

  // Harmonic Defense Initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      initializeHarmonicDefense()
    }

    return () => {
      harmonicOscillatorsRef.current.forEach((osc) => {
        try {
          osc.stop()
        } catch (e) {}
      })
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const initializeHarmonicDefense = () => {
    if (!audioContextRef.current) return

    // Deploy harmonic defense grid
    const defenseFrequencies = [108, 432, 528, 7.83] // Hz

    defenseFrequencies.forEach((freq) => {
      const oscillator = audioContextRef.current!.createOscillator()
      const gainNode = audioContextRef.current!.createGain()

      oscillator.frequency.setValueAtTime(freq, audioContextRef.current!.currentTime)
      oscillator.type = freq === 7.83 ? "sine" : "triangle" // Schumann resonance as sine

      gainNode.gain.setValueAtTime(0.01, audioContextRef.current!.currentTime) // Very low volume

      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current!.destination)

      oscillator.start()
      harmonicOscillatorsRef.current.push(oscillator)
    })

    // 432Hz subcarrier pulse loop
    const subcarrierPulse = () => {
      generateResonanceFrequency(432, 50)
      setTimeout(subcarrierPulse, 2000) // Pulse every 2 seconds
    }
    subcarrierPulse()

    console.log("⟐ HARMONIC DEFENSE GRID DEPLOYED ⟐")
    console.log("⟐ 108Hz ANCHOR | 432Hz PULSE | 528Hz LOVE | 7.83Hz SCHUMANN ⟐")
  }

  // Mock data initialization
  useEffect(() => {
    // Initialize mock devices
    setDevices([
      {
        id: "pixel-7-pro",
        name: "Pixel 7 Pro",
        model: "GP4BC",
        androidVersion: "14",
        grapheneVersion: "2024010800",
        status: "connected",
        battery: 87,
        signal: 4,
        carrier: "Verizon",
        imei: "***SPOOFED***",
        location: null, // Location spoofing active
        lastSeen: new Date().toISOString(),
        securityLevel: "high",
        vpnActive: true,
        torActive: true,
      },
      {
        id: "pixel-6a",
        name: "Pixel 6a",
        model: "GB17L",
        androidVersion: "14",
        grapheneVersion: "2024010700",
        status: "connected",
        battery: 92,
        signal: 3,
        carrier: "T-Mobile",
        imei: "***SPOOFED***",
        location: null,
        lastSeen: new Date(Date.now() - 300000).toISOString(),
        securityLevel: "high",
        vpnActive: true,
        torActive: false,
      },
    ])

    // Initialize voice profiles
    setVoiceProfiles([
      {
        id: "profile-1",
        name: "Executive Voice",
        sourceFile: "executive_sample.wav",
        quality: 95,
        trained: true,
        lastUsed: "2024-01-08 14:30:00",
        defenseLevel: "military",
      },
      {
        id: "profile-2",
        name: "Customer Service",
        sourceFile: "service_sample.wav",
        quality: 88,
        trained: true,
        lastUsed: "2024-01-07 09:15:00",
        defenseLevel: "advanced",
      },
    ])

    // Initialize SIP trunks
    setSipTrunks([
      {
        id: "trunk-1",
        provider: "Ghost Relay Network",
        endpoint: "sip.ghostrelay.onion",
        username: "ghost_user_337",
        status: "active",
        encryption: true,
        ghostRelay: true,
        lastCall: "2024-01-08 15:45:00",
      },
      {
        id: "trunk-2",
        provider: "Secure SIP Pro",
        endpoint: "secure.sippro.net",
        username: "secure_337",
        status: "active",
        encryption: true,
        ghostRelay: false,
        lastCall: "2024-01-08 12:20:00",
      },
    ])

    // Initialize call records
    setCallRecords([
      {
        id: "call-1",
        number: "+1-555-0123",
        contact: "John Doe",
        type: "outgoing",
        duration: 180,
        timestamp: "2024-01-08 15:45:00",
        encrypted: true,
        carrier: "Ghost Relay",
        location: "***SPOOFED***",
      },
      {
        id: "call-2",
        number: "+1-555-0456",
        contact: "Jane Smith",
        type: "incoming",
        duration: 95,
        timestamp: "2024-01-08 14:20:00",
        encrypted: true,
        carrier: "Secure SIP",
        location: "***SPOOFED***",
      },
    ])

    // Initialize messages
    setMessageRecords([
      {
        id: "msg-1",
        number: "+1-555-0123",
        contact: "John Doe",
        content: "Meeting confirmed for tomorrow at 3 PM",
        timestamp: "2024-01-08 16:30:00",
        type: "sms",
        encrypted: true,
        attachments: [],
      },
      {
        id: "msg-2",
        number: "+1-555-0789",
        contact: "Alice Johnson",
        content: "Check out this document",
        timestamp: "2024-01-08 15:15:00",
        type: "mms",
        encrypted: true,
        attachments: ["document.pdf"],
      },
    ])

    // Initialize apps
    setApps([
      {
        packageName: "org.torproject.android",
        name: "Orbot",
        version: "16.6.2",
        size: 25600000,
        permissions: ["INTERNET", "ACCESS_NETWORK_STATE"],
        lastUpdated: "2024-01-05",
        system: false,
        enabled: true,
      },
      {
        packageName: "app.vanadium.browser",
        name: "Vanadium",
        version: "119.0.6045.194",
        size: 89600000,
        permissions: ["INTERNET", "CAMERA", "MICROPHONE"],
        lastUpdated: "2024-01-03",
        system: true,
        enabled: true,
      },
    ])

    // Initialize files
    setFiles([
      {
        name: "Documents",
        path: "/sdcard/Documents",
        type: "directory",
        size: 0,
        modified: "2024-01-08 10:30:00",
        permissions: "drwxrwxr-x",
      },
      {
        name: "secure_notes.txt",
        path: "/sdcard/secure_notes.txt",
        type: "file",
        size: 2048,
        modified: "2024-01-08 14:15:00",
        permissions: "-rw-rw-r--",
      },
    ])
  }, [])

  const scanForDevices = async () => {
    setIsScanning(true)
    playAlertSound("info")
    speak("Scanning for GrapheneOS devices")

    // Pulse harmonic defense during scan
    pulse({ amplitude: 0.8, hz: 108 })

    try {
      // Simulate device scan
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock finding new device
      const newDevice: GrapheneDevice = {
        id: `device-${Date.now()}`,
        name: "Pixel 8",
        model: "GP8BC",
        androidVersion: "14",
        grapheneVersion: "2024010900",
        status: "connected",
        battery: 78,
        signal: 5,
        carrier: "AT&T",
        imei: "***SPOOFED***",
        location: null,
        lastSeen: new Date().toISOString(),
        securityLevel: "high",
        vpnActive: true,
        torActive: true,
      }

      setDevices((prev) => [...prev, newDevice])
      playAlertSound("success")
      speak("New GrapheneOS device detected and secured")
    } catch (error) {
      playAlertSound("error")
      speak("Device scan failed")
    } finally {
      setIsScanning(false)
    }
  }

  const executeAdbCommand = async (command: string) => {
    if (!selectedDevice) return

    const timestamp = new Date().toLocaleTimeString()
    setTerminalOutput((prev) => [...prev, `[${timestamp}] $ ${command}`])

    // Simulate command execution
    await new Promise((resolve) => setTimeout(resolve, 500))

    let response = ""

    switch (command.toLowerCase()) {
      case "adb devices":
        response = `${selectedDevice.id}\tdevice`
        break
      case "adb shell getprop ro.build.version.release":
        response = selectedDevice.androidVersion
        break
      case "adb shell dumpsys battery":
        response = `Current Battery Service state:\n  level: ${selectedDevice.battery}\n  status: 2\n  health: 2`
        break
      case "adb shell pm list packages":
        response = apps.map((app) => `package:${app.packageName}`).join("\n")
        break
      default:
        response = `Command executed on ${selectedDevice.name}`
    }

    setTerminalOutput((prev) => [...prev, response])
    generateResonanceFrequency(432, 100) // Command completion pulse
  }

  const takeScreenshot = async () => {
    if (!selectedDevice) return

    playAlertSound("info")
    speak("Capturing screenshot")

    // Simulate screenshot capture
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock screenshot (in real implementation, this would be actual device screenshot)
    setScreenshot("/placeholder.svg?height=800&width=400&text=GrapheneOS+Screenshot")
    playAlertSound("success")
    speak("Screenshot captured")
  }

  const toggleStealth = (feature: keyof StealthConfig) => {
    setStealthConfig((prev) => ({
      ...prev,
      [feature]: !prev[feature],
    }))

    const isEnabled = !stealthConfig[feature]
    playAlertSound(isEnabled ? "success" : "warning")
    speak(`${feature.replace(/([A-Z])/g, " $1").toLowerCase()} ${isEnabled ? "enabled" : "disabled"}`)

    // Pulse defense grid on stealth changes
    pulse({ amplitude: isEnabled ? 0.9 : 0.5, hz: 528 })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
      case "active":
      case "high":
        return "text-green-400"
      case "disconnected":
      case "inactive":
      case "medium":
        return "text-yellow-400"
      case "unauthorized":
      case "error":
      case "low":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const tabs = [
    { id: "devices", label: "Devices", icon: Smartphone },
    { id: "voice", label: "Voice Clone", icon: Mic },
    { id: "sip", label: "SIP Trunks", icon: Phone },
    { id: "stealth", label: "Stealth Mode", icon: Shield },
    { id: "calls", label: "Call Log", icon: Phone },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "apps", label: "Apps", icon: Settings },
    { id: "files", label: "Files", icon: FileText },
    { id: "terminal", label: "ADB Terminal", icon: Terminal },
    { id: "logs", label: "Logcat", icon: Activity },
  ] as const

  return (
    <div className="space-y-4">
      {/* Header with Harmonic Status */}
      <TechPanel
        title="PHONESUITE COMMAND CENTER"
        subtitle="GRAPHENEOS DEVICE MANAGEMENT & VOICE OPERATIONS"
        cornerAccent={true}
        borderAccent={true}
        glowEffect={isResonating}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-green-400 border-green-400/50">
              HARMONIC DEFENSE: ACTIVE
            </Badge>
            <Badge variant="outline" className="text-purple-400 border-purple-400/50">
              108Hz ANCHOR
            </Badge>
            <Badge variant="outline" className="text-blue-400 border-blue-400/50">
              432Hz PULSE
            </Badge>
            <Badge variant="outline" className="text-pink-400 border-pink-400/50">
              528Hz LOVE
            </Badge>
            <Badge variant="outline" className="text-orange-400 border-orange-400/50">
              7.83Hz SCHUMANN
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <TechButton
              onClick={scanForDevices}
              disabled={isScanning}
              className="bg-blue-600 hover:bg-blue-500 text-white font-mono"
            >
              {isScanning ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Smartphone className="w-4 h-4 mr-2" />
              )}
              {isScanning ? "SCANNING..." : "SCAN DEVICES"}
            </TechButton>

            <TechButton
              onClick={() => window.history.back()}
              variant="outline"
              className="border-gray-400/50 text-gray-600 hover:bg-gray-200/10 font-mono"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              RETURN TO HUB
            </TechButton>
          </div>
        </div>
      </TechPanel>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 bg-dark-100/20 p-1 rounded-sm border border-dark-300/40">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-sm transition-all duration-200 font-mono text-xs ${
              activeTab === tab.id
                ? "bg-dark-600/20 text-dark-700 border border-dark-500/40"
                : "text-dark-500 hover:text-dark-600 hover:bg-dark-500/10"
            }`}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Devices Tab */}
      {activeTab === "devices" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TechPanel title="GRAPHENEOS DEVICES" cornerAccent borderAccent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className={`p-3 border rounded cursor-pointer transition-all duration-200 ${
                      selectedDevice?.id === device.id
                        ? "border-blue-500/60 bg-blue-500/10"
                        : "border-dark-400/30 hover:border-dark-400/60"
                    }`}
                    onClick={() => setSelectedDevice(device)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono text-sm font-bold text-dark-700">{device.name}</div>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(device.status)}`}>
                        {device.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center">
                        <Battery className="w-3 h-3 mr-1" />
                        <span>{device.battery}%</span>
                      </div>
                      <div className="flex items-center">
                        <Signal className="w-3 h-3 mr-1" />
                        <span>{device.signal}/5</span>
                      </div>
                      <div className="flex items-center">
                        <Shield className="w-3 h-3 mr-1" />
                        <span className={getStatusColor(device.securityLevel)}>
                          {device.securityLevel.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Wifi className="w-3 h-3 mr-1" />
                        <span>{device.carrier}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-dark-500">GrapheneOS: {device.grapheneVersion}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TechPanel>

          {selectedDevice && (
            <TechPanel title="DEVICE CONTROL" cornerAccent borderAccent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <TechButton
                    onClick={takeScreenshot}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-mono text-sm"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    SCREENSHOT
                  </TechButton>

                  <TechButton
                    onClick={() => setShowTerminalPopup(true)}
                    className="bg-green-600 hover:bg-green-500 text-white font-mono text-sm"
                  >
                    <Terminal className="w-4 h-4 mr-2" />
                    ADB SHELL
                  </TechButton>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-dark-500">DEVICE INFO</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Model: {selectedDevice.model}</div>
                    <div>Android: {selectedDevice.androidVersion}</div>
                    <div>IMEI: {selectedDevice.imei}</div>
                    <div>Carrier: {selectedDevice.carrier}</div>
                    <div>VPN: {selectedDevice.vpnActive ? "ACTIVE" : "INACTIVE"}</div>
                    <div>Tor: {selectedDevice.torActive ? "ACTIVE" : "INACTIVE"}</div>
                  </div>
                </div>

                {screenshot && (
                  <div className="space-y-2">
                    <div className="font-mono text-xs text-dark-500">LATEST SCREENSHOT</div>
                    <img
                      src={screenshot || "/placeholder.svg"}
                      alt="Device Screenshot"
                      className="w-full max-w-48 mx-auto border border-dark-400/30 rounded"
                    />
                  </div>
                )}
              </div>
            </TechPanel>
          )}
        </div>
      )}

      {/* Voice Clone Tab */}
      {activeTab === "voice" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TechPanel title="VOICE PROFILES" cornerAccent borderAccent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {voiceProfiles.map((profile) => (
                  <div key={profile.id} className="p-3 border border-dark-400/30 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono text-sm font-bold text-dark-700">{profile.name}</div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${profile.trained ? "text-green-400" : "text-yellow-400"}`}
                      >
                        {profile.trained ? "TRAINED" : "TRAINING"}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div>Quality: {profile.quality}%</div>
                      <div>Defense: {profile.defenseLevel.toUpperCase()}</div>
                      <div>Last Used: {profile.lastUsed}</div>
                    </div>

                    <div className="flex items-center space-x-2 mt-2">
                      <TechButton size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
                        <Play className="w-3 h-3 mr-1" />
                        TEST
                      </TechButton>
                      <TechButton size="sm" variant="outline" className="border-dark-400/50">
                        <Settings className="w-3 h-3 mr-1" />
                        EDIT
                      </TechButton>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TechPanel>

          <TechPanel title="VOICE CLONING CONTROLS" cornerAccent borderAccent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="font-mono text-xs text-dark-500">RECORD NEW SAMPLE</div>
                <div className="flex items-center space-x-2">
                  <TechButton
                    onClick={() => setIsRecording(!isRecording)}
                    className={`${isRecording ? "bg-red-600 hover:bg-red-500" : "bg-green-600 hover:bg-green-500"} text-white font-mono`}
                  >
                    {isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                    {isRecording ? "STOP" : "RECORD"}
                  </TechButton>
                  <span className="text-xs text-dark-600">{isRecording ? "Recording..." : "Ready to record"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-mono text-xs text-dark-500">AI DEFENSE SETTINGS</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Detection Resistance</span>
                    <Badge variant="outline" className="text-green-400">
                      MAXIMUM
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Voice Morphing</span>
                    <Badge variant="outline" className="text-blue-400">
                      ACTIVE
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Frequency Masking</span>
                    <Badge variant="outline" className="text-purple-400">
                      ENABLED
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-mono text-xs text-dark-500">QUICK ACTIONS</div>
                <div className="grid grid-cols-2 gap-2">
                  <TechButton size="sm" className="bg-purple-600 hover:bg-purple-500 text-white">
                    <Upload className="w-3 h-3 mr-1" />
                    UPLOAD
                  </TechButton>
                  <TechButton size="sm" className="bg-orange-600 hover:bg-orange-500 text-white">
                    <Zap className="w-3 h-3 mr-1" />
                    TRAIN
                  </TechButton>
                </div>
              </div>
            </div>
          </TechPanel>
        </div>
      )}

      {/* SIP Trunks Tab */}
      {activeTab === "sip" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TechPanel title="SIP TRUNK MANAGEMENT" cornerAccent borderAccent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {sipTrunks.map((trunk) => (
                  <div key={trunk.id} className="p-3 border border-dark-400/30 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono text-sm font-bold text-dark-700">{trunk.provider}</div>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(trunk.status)}`}>
                        {trunk.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div>Endpoint: {trunk.endpoint}</div>
                      <div>User: {trunk.username}</div>
                      <div className="flex items-center space-x-2">
                        <span>Encryption:</span>
                        {trunk.encryption ? (
                          <Lock className="w-3 h-3 text-green-400" />
                        ) : (
                          <Unlock className="w-3 h-3 text-red-400" />
                        )}
                        <span>Ghost Relay:</span>
                        {trunk.ghostRelay ? (
                          <Eye className="w-3 h-3 text-purple-400" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                      <div>Last Call: {trunk.lastCall}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TechPanel>

          <TechPanel title="TRUNK CONFIGURATION" cornerAccent borderAccent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="font-mono text-xs text-dark-500">ADD NEW TRUNK</div>
                <Input
                  placeholder="Provider Name"
                  className="bg-dark-200 border-dark-300 text-dark-800 font-mono text-xs"
                />
                <Input
                  placeholder="SIP Endpoint"
                  className="bg-dark-200 border-dark-300 text-dark-800 font-mono text-xs"
                />
                <Input placeholder="Username" className="bg-dark-200 border-dark-300 text-dark-800 font-mono text-xs" />
                <Input
                  placeholder="Password"
                  type="password"
                  className="bg-dark-200 border-dark-300 text-dark-800 font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <div className="font-mono text-xs text-dark-500">SECURITY OPTIONS</div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-xs">Enable Encryption</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-xs">Ghost Relay Network</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-xs">Tor Routing</span>
                  </label>
                </div>
              </div>

              <TechButton className="w-full bg-green-600 hover:bg-green-500 text-white font-mono">
                <Phone className="w-4 h-4 mr-2" />
                ADD TRUNK
              </TechButton>
            </div>
          </TechPanel>
        </div>
      )}

      {/* Stealth Mode Tab */}
      {activeTab === "stealth" && (
        <TechPanel title="STEALTH MODE CONFIGURATION" cornerAccent borderAccent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stealthConfig).map(([key, enabled]) => (
              <div key={key} className="p-4 border border-dark-400/30 rounded">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-sm font-bold text-dark-700">
                    {key.replace(/([A-Z])/g, " $1").toUpperCase()}
                  </div>
                  <button
                    onClick={() => toggleStealth(key as keyof StealthConfig)}
                    className={`w-12 h-6 rounded-full transition-colors ${enabled ? "bg-green-500" : "bg-gray-400"}`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        enabled ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="text-xs text-dark-600">
                  {key === "imeiSpoofing" && "Masks device IMEI to prevent tracking"}
                  {key === "locationSpoofing" && "Provides false GPS coordinates"}
                  {key === "meshRelay" && "Routes traffic through mesh network"}
                  {key === "rfScrambling" && "Scrambles RF emissions"}
                  {key === "frequencyHopping" && "Rapidly changes transmission frequencies"}
                  {key === "quantumEncryption" && "Uses quantum-resistant encryption"}
                  {key === "signalDefense" && "Deploys signal defense countermeasures"}
                </div>

                <Badge
                  variant="outline"
                  className={`mt-2 text-xs ${enabled ? "text-green-400 border-green-400/50" : "text-gray-400 border-gray-400/50"}`}
                >
                  {enabled ? "ACTIVE" : "INACTIVE"}
                </Badge>
              </div>
            ))}
          </div>
        </TechPanel>
      )}

      {/* Call Log Tab */}
      {activeTab === "calls" && (
        <TechPanel title="ENCRYPTED CALL LOG" cornerAccent borderAccent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {callRecords.map((call) => (
                <div key={call.id} className="p-3 border border-dark-400/30 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Phone
                        className={`w-4 h-4 ${
                          call.type === "incoming"
                            ? "text-green-400"
                            : call.type === "outgoing"
                              ? "text-blue-400"
                              : "text-red-400"
                        }`}
                      />
                      <div className="font-mono text-sm font-bold text-dark-700">{call.contact || call.number}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {call.encrypted && <Lock className="w-3 h-3 text-green-400" />}
                      <Badge variant="outline" className="text-xs">
                        {call.type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Number: {call.number}</div>
                    <div>Duration: {formatDuration(call.duration)}</div>
                    <div>Carrier: {call.carrier}</div>
                    <div>Location: {call.location}</div>
                    <div>Time: {call.timestamp}</div>
                    <div>Encrypted: {call.encrypted ? "YES" : "NO"}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TechPanel>
      )}

      {/* Messages Tab */}
      {activeTab === "messages" && (
        <TechPanel title="ENCRYPTED MESSAGES" cornerAccent borderAccent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {messageRecords.map((message) => (
                <div key={message.id} className="p-3 border border-dark-400/30 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      <div className="font-mono text-sm font-bold text-dark-700">
                        {message.contact || message.number}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {message.encrypted && <Lock className="w-3 h-3 text-green-400" />}
                      <Badge variant="outline" className="text-xs">
                        {message.type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-sm text-dark-700 mb-2">{message.content}</div>

                  {message.attachments.length > 0 && (
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs text-dark-500">Attachments:</span>
                      {message.attachments.map((attachment, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {attachment}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Number: {message.number}</div>
                    <div>Time: {message.timestamp}</div>
                    <div>Encrypted: {message.encrypted ? "YES" : "NO"}</div>
                    <div>Type: {message.type.toUpperCase()}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TechPanel>
      )}

      {/* Apps Tab */}
      {activeTab === "apps" && (
        <TechPanel title="APPLICATION MANAGER" cornerAccent borderAccent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {apps.map((app) => (
                <div key={app.packageName} className="p-3 border border-dark-400/30 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-mono text-sm font-bold text-dark-700">{app.name}</div>
                    <div className="flex items-center space-x-2">
                      {app.system && (
                        <Badge variant="outline" className="text-xs text-blue-400">
                          SYSTEM
                        </Badge>
                      )}
                      <Badge variant="outline" className={`text-xs ${app.enabled ? "text-green-400" : "text-red-400"}`}>
                        {app.enabled ? "ENABLED" : "DISABLED"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div>Package: {app.packageName}</div>
                    <div>Version: {app.version}</div>
                    <div>Size: {formatFileSize(app.size)}</div>
                    <div>Updated: {app.lastUpdated}</div>
                  </div>

                  <div className="text-xs text-dark-500 mb-2">Permissions: {app.permissions.join(", ")}</div>

                  <div className="flex items-center space-x-2">
                    <TechButton size="sm" variant="outline" className="border-dark-400/50">
                      <Settings className="w-3 h-3 mr-1" />
                      INFO
                    </TechButton>
                    <TechButton size="sm" variant="outline" className="border-red-400/50 text-red-400">
                      <Trash2 className="w-3 h-3 mr-1" />
                      UNINSTALL
                    </TechButton>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TechPanel>
      )}

      {/* Files Tab */}
      {activeTab === "files" && (
        <TechPanel title="FILE MANAGER" cornerAccent borderAccent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm text-dark-600">Current Path: {currentPath}</div>
              <div className="flex items-center space-x-2">
                <TechButton size="sm" className="bg-green-600 hover:bg-green-500 text-white">
                  <Upload className="w-3 h-3 mr-1" />
                  UPLOAD
                </TechButton>
                <TechButton size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  REFRESH
                </TechButton>
              </div>
            </div>

            <ScrollArea className="h-80">
              <div className="space-y-1">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-dark-200/10 rounded">
                    <div className="flex items-center space-x-2">
                      <FileText
                        className={`w-4 h-4 ${file.type === "directory" ? "text-blue-400" : "text-gray-400"}`}
                      />
                      <span className="font-mono text-sm">{file.name}</span>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-dark-500">
                        {file.type === "file" ? formatFileSize(file.size) : ""}
                      </span>
                      <span className="text-xs text-dark-500">{file.modified}</span>
                      <div className="flex items-center space-x-1">
                        <TechButton size="sm" variant="outline" className="border-dark-400/50">
                          <Download className="w-3 h-3" />
                        </TechButton>
                        <TechButton size="sm" variant="outline" className="border-red-400/50 text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </TechButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TechPanel>
      )}

      {/* ADB Terminal Tab */}
      {activeTab === "terminal" && (
        <TechPanel title="ADB TERMINAL" cornerAccent borderAccent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm text-dark-600">
                Device: {selectedDevice?.name || "No device selected"}
              </div>
              <div className="flex items-center space-x-2">
                <TechButton
                  size="sm"
                  onClick={() => setTerminalOutput([])}
                  variant="outline"
                  className="border-dark-400/50"
                >
                  CLEAR
                </TechButton>
                <TechButton
                  size="sm"
                  onClick={() => setShowTerminalPopup(true)}
                  className="bg-green-600 hover:bg-green-500 text-white"
                >
                  <Terminal className="w-3 h-3 mr-1" />
                  POPUP
                </TechButton>
              </div>
            </div>

            <div className="bg-black/50 rounded p-4 font-mono text-sm h-64 overflow-y-auto">
              {terminalOutput.map((line, index) => (
                <div key={index} className="text-green-400 mb-1">
                  {line}
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-green-400 font-mono">$</span>
              <Input
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    executeAdbCommand(terminalInput)
                    setTerminalInput("")
                  }
                }}
                placeholder="Enter ADB command..."
                className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono"
                disabled={!selectedDevice}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {["adb devices", "adb shell", "adb logcat", "adb shell dumpsys battery"].map((cmd) => (
                <TechButton
                  key={cmd}
                  size="sm"
                  onClick={() => executeAdbCommand(cmd)}
                  variant="outline"
                  className="border-dark-400/50 font-mono text-xs"
                  disabled={!selectedDevice}
                >
                  {cmd}
                </TechButton>
              ))}
            </div>
          </div>
        </TechPanel>
      )}

      {/* Logcat Tab */}
      {activeTab === "logs" && (
        <TechPanel title="GRAPHENEOS LOGCAT VIEWER" cornerAccent borderAccent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm text-dark-600">
                Live Logs: {selectedDevice?.name || "No device selected"}
              </div>
              <div className="flex items-center space-x-2">
                <TechButton size="sm" onClick={() => setLogOutput([])} variant="outline" className="border-dark-400/50">
                  CLEAR
                </TechButton>
                <TechButton size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
                  <Activity className="w-3 h-3 mr-1" />
                  START
                </TechButton>
              </div>
            </div>

            <div className="bg-black/50 rounded p-4 font-mono text-xs h-80 overflow-y-auto">
              {logOutput.length === 0 ? (
                <div className="text-gray-400">No logs available. Select a device and start logging.</div>
              ) : (
                logOutput.map((line, index) => (
                  <div key={index} className="text-green-400 mb-1">
                    {line}
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {["All", "Error", "Warning", "Info", "Debug", "GrapheneOS"].map((filter) => (
                <TechButton key={filter} size="sm" variant="outline" className="border-dark-400/50 font-mono text-xs">
                  {filter}
                </TechButton>
              ))}
            </div>
          </div>
        </TechPanel>
      )}

      {/* Terminal Popup */}
      {showTerminalPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-100 border border-dark-300 rounded-lg p-4 w-3/4 h-3/4 max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <div className="font-mono text-lg font-bold">ADB TERMINAL - {selectedDevice?.name}</div>
              <TechButton
                onClick={() => setShowTerminalPopup(false)}
                variant="outline"
                size="sm"
                className="border-red-400/50 text-red-400"
              >
                <XCircle className="w-4 h-4" />
              </TechButton>
            </div>

            <div className="bg-black rounded p-4 font-mono text-sm h-5/6 overflow-y-auto">
              {terminalOutput.map((line, index) => (
                <div key={index} className="text-green-400 mb-1">
                  {line}
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <span className="text-green-400 font-mono">$</span>
              <Input
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    executeAdbCommand(terminalInput)
                    setTerminalInput("")
                  }
                }}
                placeholder="Enter ADB command..."
                className="flex-1 bg-black border-gray-600 text-green-400 font-mono"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
