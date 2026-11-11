"use client"

import { useState, useEffect } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useWebADB } from "@/hooks/useWebADB"
import { useTerminal } from "@/components/terminal/terminal-context"
import { useResonance } from "@/hooks/useResonance"
import {
  Smartphone,
  Terminal,
  Camera,
  RefreshCw,
  Eye,
  Play,
  Download,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function BrowserPhoneSuite() {
  const {
    devices,
    selectedDevice,
    setSelectedDevice,
    isScanning,
    commandHistory,
    isSupported,
    error,
    scanDevices,
    executeCommand,
    captureScreenshot,
    getInstalledPackages,
    getDeviceInfo,
    disconnectDevice,
  } = useWebADB()

  const { addCommandAlias } = useTerminal()
  const { pulse, isResonating } = useResonance("browser-phonesuite", "Browser PhoneSuite", 108)

  const [activeTab, setActiveTab] = useState<"devices" | "terminal" | "mirror" | "apps" | "info">("devices")
  const [terminalInput, setTerminalInput] = useState("")
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [installedApps, setInstalledApps] = useState<string[]>([])
  const [deviceInfo, setDeviceInfo] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Initialize ADB aliases for terminal integration
  useEffect(() => {
    if (selectedDevice) {
      addCommandAlias("adb", `webadb-${selectedDevice.id}`, "WebADB command for selected device")
      addCommandAlias("screenshot", `webadb-screenshot-${selectedDevice.id}`, "Capture screenshot via WebADB")
      addCommandAlias("packages", `webadb-packages-${selectedDevice.id}`, "List installed packages via WebADB")
    }
  }, [selectedDevice, addCommandAlias])

  const handleExecuteCommand = async () => {
    if (!terminalInput.trim() || !selectedDevice) return

    setIsLoading(true)
    pulse({ amplitude: 0.8, hz: 108 })

    try {
      await executeCommand(terminalInput)
      setTerminalInput("")
    } catch (err) {
      console.error("Command execution failed:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCaptureScreenshot = async () => {
    if (!selectedDevice) return

    setIsLoading(true)
    pulse({ amplitude: 1.0, hz: 432 })

    try {
      const screenshotData = await captureScreenshot()
      setScreenshot(screenshotData)
    } catch (err) {
      console.error("Screenshot capture failed:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadApps = async () => {
    if (!selectedDevice) return

    setIsLoading(true)

    try {
      const packages = await getInstalledPackages()
      setInstalledApps(packages)
    } catch (err) {
      console.error("Failed to load apps:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadDeviceInfo = async () => {
    if (!selectedDevice) return

    setIsLoading(true)

    try {
      const info = await getDeviceInfo()
      setDeviceInfo(info)
    } catch (err) {
      console.error("Failed to load device info:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "unauthorized":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case "disconnected":
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "text-green-400 border-green-400/50"
      case "unauthorized":
        return "text-yellow-400 border-yellow-400/50"
      case "disconnected":
        return "text-red-400 border-red-400/50"
      default:
        return "text-gray-400 border-gray-400/50"
    }
  }

  const tabs = [
    { id: "devices", label: "Devices", icon: Smartphone },
    { id: "terminal", label: "Terminal", icon: Terminal },
    { id: "mirror", label: "Mirror", icon: Camera },
    { id: "apps", label: "Apps", icon: Settings },
    { id: "info", label: "Info", icon: Eye },
  ] as const

  if (!isSupported) {
    return (
      <TechPanel
        title="BROWSER PHONESUITE"
        subtitle="WEBADB INTEGRATION"
        cornerAccent
        borderAccent
        className="border-red-500/40"
      >
        <div className="text-center py-8">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <div className="font-mono text-lg text-red-400 mb-2">WebUSB Not Supported</div>
          <div className="text-sm text-dark-600">
            This browser does not support WebUSB. Please use Chrome/Edge with HTTPS.
          </div>
        </div>
      </TechPanel>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <TechPanel
        title="BROWSER PHONESUITE"
        subtitle="WEBADB GRAPHENEOS INTEGRATION"
        cornerAccent
        borderAccent
        glowEffect={isResonating}
        icon={<Smartphone size={16} />}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-200",
                selectedDevice?.status === "connected" ? "bg-green-400 animate-pulse shadow-glow-sm" : "bg-gray-500",
              )}
            />
            <div>
              <div className="font-mono text-sm">
                {selectedDevice ? `${selectedDevice.name} [${selectedDevice.symbolKey}]` : "No Device Selected"}
              </div>
              {selectedDevice && <div className="text-xs text-dark-600">Serial: {selectedDevice.serial}</div>}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {error && (
              <Badge variant="outline" className="text-red-400 border-red-400/50">
                <AlertTriangle size={12} className="mr-1" />
                ERROR
              </Badge>
            )}
            <Badge variant="outline" className="text-purple-400 border-purple-400/50">
              <Zap size={12} className="mr-1" />
              WEBADB
            </Badge>
            <TechButton
              onClick={scanDevices}
              disabled={isScanning}
              size="sm"
              cornerAccent
              icon={<RefreshCw size={14} className={isScanning ? "animate-spin" : ""} />}
            >
              {isScanning ? "SCANNING..." : "SCAN"}
            </TechButton>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle size={16} />
              <span className="font-mono text-sm">{error}</span>
            </div>
          </div>
        )}
      </TechPanel>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-dark-100/20 p-1 rounded-sm border border-dark-300/40">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-sm transition-all duration-200 font-mono text-sm",
              activeTab === tab.id
                ? "bg-dark-600/20 text-dark-700 border border-dark-500/40"
                : "text-dark-500 hover:text-dark-600 hover:bg-dark-500/10",
            )}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Devices Tab */}
      {activeTab === "devices" && (
        <TechPanel title="CONNECTED DEVICES" cornerAccent borderAccent>
          <div className="space-y-4">
            {devices.length === 0 ? (
              <div className="text-center py-8 text-dark-500">
                <Smartphone className="w-16 h-16 mx-auto mb-4" />
                <div className="font-mono text-sm">No devices found</div>
                <div className="text-xs">Connect a device and click SCAN</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className={cn(
                      "p-4 border rounded-sm cursor-pointer transition-all duration-200",
                      selectedDevice?.id === device.id
                        ? "border-blue-500/60 bg-blue-500/10"
                        : "border-dark-300/40 hover:border-dark-400/60 hover:bg-dark-100/10",
                    )}
                    onClick={() => setSelectedDevice(device)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(device.status)}
                        <div className="font-mono text-sm font-bold">{device.name}</div>
                      </div>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(device.status)}`}>
                        {device.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div>Serial: {device.serial}</div>
                      <div>Symbol: {device.symbolKey}</div>
                    </div>

                    {device.status === "connected" && (
                      <div className="flex items-center space-x-2 mt-3">
                        <TechButton
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCaptureScreenshot()
                          }}
                          disabled={isLoading}
                          className="bg-purple-600 hover:bg-purple-500 text-white"
                        >
                          <Camera size={12} className="mr-1" />
                          SCREENSHOT
                        </TechButton>
                        <TechButton
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            disconnectDevice(device.id)
                          }}
                          variant="outline"
                          className="border-red-400/50 text-red-400"
                        >
                          DISCONNECT
                        </TechButton>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TechPanel>
      )}

      {/* Terminal Tab */}
      {activeTab === "terminal" && (
        <TechPanel title="WEBADB TERMINAL" cornerAccent borderAccent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExecuteCommand()}
                placeholder="Enter ADB command..."
                className="flex-1 bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm"
                disabled={!selectedDevice || isLoading}
              />
              <TechButton
                onClick={handleExecuteCommand}
                disabled={!terminalInput.trim() || !selectedDevice || isLoading}
                cornerAccent
                icon={<Play size={14} />}
              >
                {isLoading ? "EXECUTING..." : "EXECUTE"}
              </TechButton>
            </div>

            <ScrollArea className="h-64 bg-black/50 rounded p-3">
              <div className="space-y-2 font-mono text-xs">
                {commandHistory.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">No commands executed yet</div>
                ) : (
                  commandHistory.map((cmd) => (
                    <div key={cmd.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={cmd.success ? "text-green-400" : "text-red-400"}>$ {cmd.command}</span>
                        <span className="text-gray-500 text-xs">{new Date(cmd.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div
                        className={cn("pl-2 border-l border-gray-600", cmd.success ? "text-gray-300" : "text-red-400")}
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
              {[
                "shell getprop ro.build.version.release",
                "shell dumpsys battery",
                "shell pm list packages",
                "shell df -h",
              ].map((cmd) => (
                <TechButton
                  key={cmd}
                  onClick={() => setTerminalInput(cmd)}
                  size="sm"
                  variant="outline"
                  className="border-dark-400/50 text-dark-600 font-mono text-xs"
                  disabled={!selectedDevice}
                >
                  {cmd.split(" ").pop()?.toUpperCase()}
                </TechButton>
              ))}
            </div>
          </div>
        </TechPanel>
      )}

      {/* Mirror Tab */}
      {activeTab === "mirror" && (
        <TechPanel title="DEVICE MIRROR" cornerAccent borderAccent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm">Screen Capture</div>
              <TechButton
                onClick={handleCaptureScreenshot}
                disabled={!selectedDevice || isLoading}
                cornerAccent
                icon={<Camera size={14} />}
              >
                {isLoading ? "CAPTURING..." : "CAPTURE"}
              </TechButton>
            </div>

            {screenshot ? (
              <div className="max-w-sm mx-auto">
                <img
                  src={screenshot || "/placeholder.svg"}
                  alt="Device Screenshot"
                  className="w-full border border-dark-300 rounded"
                />
                <div className="mt-2 text-center">
                  <TechButton
                    onClick={() => {
                      const link = document.createElement("a")
                      link.href = screenshot
                      link.download = `screenshot-${selectedDevice?.serial}-${Date.now()}.png`
                      link.click()
                    }}
                    size="sm"
                    variant="outline"
                    className="border-dark-400/50"
                    icon={<Download size={12} />}
                  >
                    DOWNLOAD
                  </TechButton>
                </div>
              </div>
            ) : (
              <div className="aspect-[9/16] max-w-sm mx-auto bg-dark-100/20 border border-dark-300/40 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-dark-500 mx-auto mb-4" />
                  <div className="font-mono text-sm text-dark-500">No Screenshot</div>
                  <div className="text-xs text-dark-400">Capture a screenshot to view</div>
                </div>
              </div>
            )}
          </div>
        </TechPanel>
      )}

      {/* Apps Tab */}
      {activeTab === "apps" && (
        <TechPanel title="INSTALLED APPLICATIONS" cornerAccent borderAccent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm">Package List</div>
              <TechButton
                onClick={handleLoadApps}
                disabled={!selectedDevice || isLoading}
                cornerAccent
                icon={<RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />}
              >
                {isLoading ? "LOADING..." : "LOAD APPS"}
              </TechButton>
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-1">
                {installedApps.length === 0 ? (
                  <div className="text-center py-8 text-dark-500">
                    <Settings className="w-16 h-16 mx-auto mb-4" />
                    <div className="font-mono text-sm">No apps loaded</div>
                    <div className="text-xs">Click LOAD APPS to fetch package list</div>
                  </div>
                ) : (
                  installedApps.map((pkg, index) => (
                    <div key={index} className="p-2 bg-dark-200/20 rounded border border-dark-300/20">
                      <div className="font-mono text-sm">{pkg}</div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </TechPanel>
      )}

      {/* Info Tab */}
      {activeTab === "info" && (
        <TechPanel title="DEVICE INFORMATION" cornerAccent borderAccent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm">System Properties</div>
              <TechButton
                onClick={handleLoadDeviceInfo}
                disabled={!selectedDevice || isLoading}
                cornerAccent
                icon={<RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />}
              >
                {isLoading ? "LOADING..." : "LOAD INFO"}
              </TechButton>
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-2">
                {Object.keys(deviceInfo).length === 0 ? (
                  <div className="text-center py-8 text-dark-500">
                    <Eye className="w-16 h-16 mx-auto mb-4" />
                    <div className="font-mono text-sm">No device info loaded</div>
                    <div className="text-xs">Click LOAD INFO to fetch system properties</div>
                  </div>
                ) : (
                  Object.entries(deviceInfo).map(([key, value]) => (
                    <div key={key} className="p-2 bg-dark-200/20 rounded border border-dark-300/20">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-xs text-dark-500">{key}</div>
                        <div className="font-mono text-sm text-dark-700">{value}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </TechPanel>
      )}
    </div>
  )
}
