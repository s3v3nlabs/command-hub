"use client"

import { useState, useEffect, useRef } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { adbTools, type ADBDevice, type APKInfo, type ScreenCapture } from "@/lib/graphene/adbTools"
import {
  Smartphone,
  Wifi,
  Usb,
  Battery,
  ImageIcon,
  Download,
  Upload,
  RefreshCw,
  Terminal,
  LucideComponent as ImageIconComponent,
  Package,
  Trash2,
  Play,
  Square,
  Monitor,
} from "lucide-react"

export default function GrapheneBridge() {
  const [devices, setDevices] = useState<ADBDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<ADBDevice | null>(null)
  const [installedPackages, setInstalledPackages] = useState<APKInfo[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [lastScreenshot, setLastScreenshot] = useState<ScreenCapture | null>(null)
  const [apkFile, setApkFile] = useState<File | null>(null)
  const [shellCommand, setShellCommand] = useState("")
  const [shellOutput, setShellOutput] = useState("")
  const [activeTab, setActiveTab] = useState<"devices" | "packages" | "camera" | "shell">("devices")
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    scanDevices()
  }, [])

  useEffect(() => {
    if (selectedDevice) {
      loadInstalledPackages()
    }
  }, [selectedDevice])

  const scanDevices = async () => {
    setIsScanning(true)
    try {
      const deviceList = await adbTools.getDevices()
      setDevices(deviceList)
      if (deviceList.length > 0 && !selectedDevice) {
        setSelectedDevice(deviceList[0])
      }
    } catch (error) {
      console.error("Failed to scan devices:", error)
    } finally {
      setIsScanning(false)
    }
  }

  const loadInstalledPackages = async () => {
    if (!selectedDevice) return

    try {
      const packages = await adbTools.getInstalledPackages(selectedDevice.id)
      setInstalledPackages(packages)
    } catch (error) {
      console.error("Failed to load packages:", error)
    }
  }

  const installAPK = async () => {
    if (!selectedDevice || !apkFile) return

    try {
      const success = await adbTools.installAPK(selectedDevice.id, apkFile.name)
      if (success) {
        await loadInstalledPackages()
        setApkFile(null)
      }
    } catch (error) {
      console.error("Failed to install APK:", error)
    }
  }

  const uninstallPackage = async (packageName: string) => {
    if (!selectedDevice) return

    try {
      const success = await adbTools.uninstallPackage(selectedDevice.id, packageName)
      if (success) {
        await loadInstalledPackages()
      }
    } catch (error) {
      console.error("Failed to uninstall package:", error)
    }
  }

  const captureScreen = async () => {
    if (!selectedDevice) return

    try {
      const screenshot = await adbTools.captureScreen(selectedDevice.id)
      setLastScreenshot(screenshot)
    } catch (error) {
      console.error("Failed to capture screen:", error)
    }
  }

  const startCameraStream = async () => {
    if (!selectedDevice) return

    try {
      // Not implemented: ADB has no camera-stream API here. Use scrcpy (`scrcpy --video-source=camera`) on the host.
      throw new Error("Camera streaming is not implemented in the hub — use scrcpy --video-source=camera")
    } catch (error) {
      console.error("Failed to start camera stream:", error)
    }
  }

  const stopCameraStream = async () => {
    if (!selectedDevice) return

    try {
      setIsStreaming(false)
    } catch (error) {
      console.error("Failed to stop camera stream:", error)
    }
  }

  const executeShellCommand = async () => {
    if (!selectedDevice || !shellCommand.trim()) return

    try {
      const output = await adbTools.executeShellCommand(selectedDevice.id, shellCommand)
      setShellOutput((prev) => `${prev}\n$ ${shellCommand}\n${output}`)
      setShellCommand("")
    } catch (error) {
      console.error("Failed to execute command:", error)
      setShellOutput((prev) => `${prev}\n$ ${shellCommand}\nError: ${error}`)
    }
  }

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case "device":
        return "text-green-400 border-green-400/50"
      case "offline":
        return "text-red-400 border-red-400/50"
      case "unauthorized":
        return "text-yellow-400 border-yellow-400/50"
      default:
        return "text-gray-400 border-gray-400/50"
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB"]
    if (bytes === 0) return "0 B"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const tabs = [
    { id: "devices", label: "Devices", icon: Smartphone },
    { id: "packages", label: "Packages", icon: Package },
    { id: "camera", label: "Camera", icon: ImageIcon },
    { id: "shell", label: "Shell", icon: Terminal },
  ] as const

  return (
    <div className="space-y-4">
      {/* Header */}
      <TechPanel title="GRAPHENEOS BRIDGE" subtitle="ADB DEVICE MANAGEMENT" cornerAccent={true} borderAccent={true}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${adbTools.isADBConnected() ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
              />
              <span className="font-mono text-sm text-dark-600">
                ADB {adbTools.isADBConnected() ? "CONNECTED" : "DISCONNECTED"}
              </span>
            </div>
            <span className="font-mono text-sm text-dark-500">
              {devices.length} device{devices.length !== 1 ? "s" : ""} detected
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {selectedDevice && (
              <Badge variant="outline" className="border-dark-400/50 text-dark-600 font-mono text-xs">
                {selectedDevice.model}
              </Badge>
            )}
            <TechButton
              size="sm"
              onClick={scanDevices}
              disabled={isScanning}
              className="bg-dark-600 hover:bg-dark-500 text-black font-mono text-xs"
            >
              {isScanning ? (
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3 mr-1" />
              )}
              SCAN
            </TechButton>
          </div>
        </div>
      </TechPanel>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-dark-100/20 p-1 rounded-sm border border-dark-300/40">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-sm transition-all duration-200 font-mono text-sm ${
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
          <TechPanel title="CONNECTED DEVICES" cornerAccent borderAccent>
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
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4 text-dark-600" />
                        <div>
                          <div className="font-mono text-sm font-bold text-dark-700">{device.model}</div>
                          <div className="font-mono text-xs text-dark-500">{device.id}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs ${getDeviceStatusColor(device.status)}`}>
                        {device.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          {device.transport === "usb" ? <Usb className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                          <span className="text-dark-500">{device.transport.toUpperCase()}</span>
                        </div>
                        {device.batteryLevel && (
                          <div className="flex items-center space-x-1">
                            <Battery className="w-3 h-3" />
                            <span className="text-dark-500">{device.batteryLevel}%</span>
                          </div>
                        )}
                      </div>
                      {device.isGrapheneOS && (
                        <Badge variant="outline" className="text-xs border-green-400/50 text-green-400">
                          GRAPHENEOS
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TechPanel>

          {selectedDevice && (
            <TechPanel title="DEVICE INFO" cornerAccent borderAccent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-dark-500">MODEL</span>
                  <span className="font-mono text-xs text-dark-700">{selectedDevice.model}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-dark-500">ANDROID</span>
                  <span className="font-mono text-xs text-dark-700">{selectedDevice.androidVersion}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-dark-500">API LEVEL</span>
                  <span className="font-mono text-xs text-dark-700">{selectedDevice.apiLevel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-dark-500">PRODUCT</span>
                  <span className="font-mono text-xs text-dark-700">{selectedDevice.product}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-dark-500">TRANSPORT</span>
                  <span className="font-mono text-xs text-dark-700">{selectedDevice.transport.toUpperCase()}</span>
                </div>
                {selectedDevice.batteryLevel && (
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-dark-500">BATTERY</span>
                    <span className="font-mono text-xs text-dark-700">{selectedDevice.batteryLevel}%</span>
                  </div>
                )}
              </div>
            </TechPanel>
          )}
        </div>
      )}

      {/* Packages Tab */}
      {activeTab === "packages" && selectedDevice && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TechPanel title="APK MANAGEMENT" cornerAccent borderAccent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-mono text-xs text-dark-500">INSTALL APK</label>
                <div className="flex space-x-2">
                  <Input
                    type="file"
                    accept=".apk"
                    onChange={(e) => setApkFile(e.target.files?.[0] || null)}
                    className="flex-1 bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm"
                  />
                  <TechButton
                    onClick={installAPK}
                    disabled={!apkFile}
                    className="bg-dark-600 hover:bg-dark-500 text-black font-mono text-xs"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    INSTALL
                  </TechButton>
                </div>
              </div>

              <div className="pt-2 border-t border-dark-400/30">
                <div className="font-mono text-xs text-dark-500 mb-2">QUICK ACTIONS</div>
                <div className="grid grid-cols-2 gap-2">
                  <TechButton
                    size="sm"
                    variant="outline"
                    className="border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    BACKUP
                  </TechButton>
                  <TechButton
                    size="sm"
                    variant="outline"
                    onClick={loadInstalledPackages}
                    className="border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    REFRESH
                  </TechButton>
                </div>
              </div>
            </div>
          </TechPanel>

          <TechPanel title="INSTALLED PACKAGES" cornerAccent borderAccent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {installedPackages.map((pkg) => (
                  <div key={pkg.packageName} className="p-2 border border-dark-400/30 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-mono text-sm font-bold text-dark-700 truncate">
                        {pkg.packageName.split(".").pop()}
                      </div>
                      <TechButton
                        size="sm"
                        variant="outline"
                        onClick={() => uninstallPackage(pkg.packageName)}
                        className="border-red-400/50 text-red-400 hover:bg-red-400/10 font-mono text-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                      </TechButton>
                    </div>
                    <div className="font-mono text-xs text-dark-500 mb-1">{pkg.packageName}</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-dark-600">v{pkg.versionName}</span>
                      <span className="text-dark-500">{formatFileSize(pkg.size)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TechPanel>
        </div>
      )}

      {/* Camera Tab */}
      {activeTab === "camera" && selectedDevice && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TechPanel title="CAMERA STREAM" cornerAccent borderAccent>
            <div className="space-y-4">
              <div className="aspect-video bg-dark-200/20 border border-dark-400/30 rounded flex items-center justify-center">
                {isStreaming ? (
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 text-dark-600 animate-pulse" />
                    <div className="font-mono text-sm text-dark-600">LIVE STREAM ACTIVE</div>
                    <div className="font-mono text-xs text-dark-500">1920x1080 @ 30fps</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Monitor className="w-12 h-12 mx-auto mb-2 text-dark-500" />
                    <div className="font-mono text-sm text-dark-500">Camera stream inactive</div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                {!isStreaming ? (
                  <TechButton
                    onClick={startCameraStream}
                    className="flex-1 bg-dark-600 hover:bg-dark-500 text-black font-mono text-sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    START STREAM
                  </TechButton>
                ) : (
                  <TechButton
                    onClick={stopCameraStream}
                    variant="outline"
                    className="flex-1 border-red-400/50 text-red-400 hover:bg-red-400/10 font-mono text-sm"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    STOP STREAM
                  </TechButton>
                )}
                <TechButton
                  onClick={captureScreen}
                  variant="outline"
                  className="border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-sm"
                >
                  <ImageIconComponent className="w-4 h-4 mr-2" />
                  SCREENSHOT
                </TechButton>
              </div>
            </div>
          </TechPanel>

          <TechPanel title="CAPTURE HISTORY" cornerAccent borderAccent>
            <div className="space-y-3">
              {lastScreenshot ? (
                <div className="p-3 border border-dark-400/30 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-mono text-sm text-dark-700">Latest Screenshot</div>
                    <Badge variant="outline" className="text-xs border-dark-400/30 text-dark-600">
                      {lastScreenshot.format.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-dark-500 space-y-1">
                    <div>Resolution: {lastScreenshot.resolution}</div>
                    <div>Size: {formatFileSize(lastScreenshot.size)}</div>
                    <div>Time: {lastScreenshot.timestamp.toLocaleTimeString()}</div>
                  </div>
                  <TechButton
                    size="sm"
                    variant="outline"
                    className="w-full mt-2 border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    DOWNLOAD
                  </TechButton>
                </div>
              ) : (
                <div className="text-center py-8 text-dark-500">
                  <ImageIconComponent className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-mono text-sm">No captures yet</div>
                </div>
              )}
            </div>
          </TechPanel>
        </div>
      )}

      {/* Shell Tab */}
      {activeTab === "shell" && selectedDevice && (
        <TechPanel title="ADB SHELL" cornerAccent borderAccent>
          <div className="space-y-4">
            <ScrollArea className="h-64 bg-dark-200/20 border border-dark-400/30 rounded p-3">
              <pre className="font-mono text-xs text-dark-600 whitespace-pre-wrap">
                {shellOutput || "ADB Shell ready. Enter commands below."}
              </pre>
            </ScrollArea>

            <div className="flex space-x-2">
              <Input
                value={shellCommand}
                onChange={(e) => setShellCommand(e.target.value)}
                placeholder="Enter ADB shell command..."
                className="flex-1 bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm"
                onKeyPress={(e) => e.key === "Enter" && executeShellCommand()}
              />
              <TechButton
                onClick={executeShellCommand}
                disabled={!shellCommand.trim()}
                className="bg-dark-600 hover:bg-dark-500 text-black font-mono text-sm"
              >
                <Terminal className="w-4 h-4 mr-2" />
                EXECUTE
              </TechButton>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {["getprop ro.build.version.release", "pm list packages", "df /data", "ps"].map((cmd) => (
                <TechButton
                  key={cmd}
                  size="sm"
                  variant="outline"
                  onClick={() => setShellCommand(cmd)}
                  className="border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
                >
                  {cmd.split(" ")[0]}
                </TechButton>
              ))}
            </div>
          </div>
        </TechPanel>
      )}
    </div>
  )
}
