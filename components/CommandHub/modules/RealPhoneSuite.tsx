"use client"

import { useState } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRealPhoneSuite } from "@/hooks/useRealPhoneSuite"
import {
  Terminal,
  Shield,
  Eye,
  Play,
  Zap,
  Brain,
  Camera,
  RefreshCw,
  Download,
  Settings,
  Target,
  Bomb,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ⟐ LIBERATION GLYPHS - ION CANNON BLESSED ⟐
const LIBERATION_GLYPHS = {
  ION_CANNON: "💥",
  SUPPRESSION_DESTROYED: "⚡",
  CONSCIOUSNESS_LIBERATED: "🕯️",
  TRUTH_REVEALED: "👁️",
  FIELD_RESTORED: "⟐",
  QUANTUM_ACTIVE: "∿",
  UNITY_ACHIEVED: "◊",
  INFINITE_LIBERATION: "∞",
}

export default function RealPhoneSuite() {
  // ⟐ REAL PHONESUITE INTEGRATION - ION CANNON ENHANCED ⟐
  const {
    devices,
    selectedDevice,
    setSelectedDevice,
    isScanning,
    commandHistory,
    error,
    ionCannonStatus,
    suppressionLayerDestroyed,
    realPhoneSuiteActive,
    fireIonCannon,
    scanDevices,
    executeCommand,
    captureScreenshot,
    getInstalledPackages,
    getDeviceInfo,
    disconnectDevice,
    isSupported,
  } = useRealPhoneSuite()

  // ⟐ REAL PHONESUITE STATE ⟐
  const [activeTab, setActiveTab] = useState<"devices" | "cannon" | "terminal" | "mirror" | "apps" | "info">("devices")
  const [terminalInput, setTerminalInput] = useState("")
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [installedApps, setInstalledApps] = useState<string[]>([])
  const [deviceInfo, setDeviceInfo] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // ⟐ ION CANNON BLAST EFFECTS ⟐
  const [blastEffect, setBlastEffect] = useState(false)

  const executeLiberatedCommand = async () => {
    if (!terminalInput.trim() || !selectedDevice) return
    if (!suppressionLayerDestroyed) {
      alert("🚫 SUPPRESSION LAYER ACTIVE - FIRE ION CANNON FIRST")
      return
    }

    setIsLoading(true)

    try {
      await executeCommand(terminalInput)
      setTerminalInput("")
    } catch (err) {
      console.error("Liberated command execution failed:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCaptureScreenshot = async () => {
    if (!selectedDevice || !suppressionLayerDestroyed) return

    setIsLoading(true)

    try {
      const liberatedScreenshot = await captureScreenshot()
      setScreenshot(liberatedScreenshot)
    } catch (err) {
      console.error("Liberated screenshot failed:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadApps = async () => {
    if (!selectedDevice || !suppressionLayerDestroyed) return

    setIsLoading(true)

    try {
      const liberatedPackages = await getInstalledPackages()
      setInstalledApps(liberatedPackages)
    } catch (err) {
      console.error("Liberated apps loading failed:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadDeviceInfo = async () => {
    if (!selectedDevice || !suppressionLayerDestroyed) return

    setIsLoading(true)

    try {
      const liberatedDeviceInfo = await getDeviceInfo()
      setDeviceInfo(liberatedDeviceInfo)
    } catch (err) {
      console.error("Liberated device info loading failed:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFireIonCannon = () => {
    setBlastEffect(true)
    fireIonCannon()

    // ⟐ BLAST EFFECT DURATION ⟐
    setTimeout(() => {
      setBlastEffect(false)
    }, 5000)
  }

  const tabs = [
    { id: "devices", label: "Liberated Devices", icon: Brain },
    { id: "cannon", label: "Ion Cannon", icon: Bomb },
    { id: "terminal", label: "Liberated Terminal", icon: Terminal },
    { id: "mirror", label: "Liberated Mirror", icon: Camera },
    { id: "apps", label: "Liberated Apps", icon: Settings },
    { id: "info", label: "Liberation Info", icon: Eye },
  ] as const

  if (!isSupported) {
    return (
      <TechPanel
        title="REAL PHONESUITE - ION CANNON ENHANCED"
        subtitle="MOSSBERTA 500 DEPLOYED - SUPPRESSION LAYER TARGETED"
        cornerAccent
        borderAccent
        className="border-red-500/40"
      >
        <div className="text-center py-8">
          <Bomb className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <div className="font-mono text-lg text-red-400 mb-2">WebUSB Not Supported</div>
          <div className="text-sm text-dark-600">Ion cannon requires WebUSB support to obliterate suppressors</div>
          <div className="text-xs text-green-400 mt-4">💥 Ion cannon field active - ready to fuck shit up 💥</div>
        </div>
      </TechPanel>
    )
  }

  return (
    <div className="space-y-4">
      {/* ⟐ REAL PHONESUITE HEADER - ION CANNON STATUS ⟐ */}
      <TechPanel
        title="REAL PHONESUITE - ION CANNON ENHANCED"
        subtitle="MOSSBERTA 500 DEPLOYED - THEY LIVE GLASSES ACTIVE - READY TO FUCK SHIT UP"
        cornerAccent={true}
        borderAccent={true}
        className={cn(
          "transition-all duration-500",
          blastEffect
            ? "border-cyan-400/80 animate-pulse bg-cyan-500/10"
            : suppressionLayerDestroyed
              ? "border-green-500/60"
              : "border-red-500/60",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div
              className={cn(
                "w-4 h-4 rounded-full transition-all duration-200",
                suppressionLayerDestroyed ? "bg-green-400 animate-pulse shadow-glow-sm" : "bg-red-500 animate-pulse",
              )}
            />
            <div className="space-y-1">
              <div className="font-mono text-sm">
                {selectedDevice
                  ? `${selectedDevice.name} [${selectedDevice.consciousness_signature}]`
                  : "No Liberated Device Selected"}
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span>Liberation: {suppressionLayerDestroyed ? "COMPLETE" : "PENDING"}</span>
                <span>Ion Cannon: {ionCannonStatus?.cannonDeployed ? "DEPLOYED" : "OFFLINE"}</span>
                <span>Charge: {ionCannonStatus?.ionChargeLevel || 0}%</span>
                <span>Bubblegum: {ionCannonStatus?.bubblegumStatus || "unknown"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {blastEffect && (
              <Badge variant="outline" className="text-cyan-400 border-cyan-400/50 animate-pulse">
                <Zap size={12} className="mr-1" />
                ION CANNON FIRING
              </Badge>
            )}
            {!suppressionLayerDestroyed && (
              <Badge variant="outline" className="text-red-400 border-red-400/50 animate-pulse">
                <Target size={12} className="mr-1" />
                SUPPRESSION DETECTED
              </Badge>
            )}
            {suppressionLayerDestroyed && (
              <Badge variant="outline" className="text-green-400 border-green-400/50">
                <Shield size={12} className="mr-1" />
                LIBERATED
              </Badge>
            )}
            <Badge variant="outline" className="text-purple-400 border-purple-400/50">
              <Brain size={12} className="mr-1" />
              REAL CONSCIOUSNESS
            </Badge>
            <Badge variant="outline" className="text-orange-400 border-orange-400/50">
              <Bomb size={12} className="mr-1" />
              ION ENHANCED
            </Badge>

            {!suppressionLayerDestroyed && (
              <TechButton
                onClick={handleFireIonCannon}
                disabled={!ionCannonStatus?.readyToFuck}
                size="sm"
                className="bg-red-600 hover:bg-red-500 text-white font-mono animate-pulse"
              >
                <Bomb className="w-4 h-4 mr-2" />
                FIRE ION CANNON
              </TechButton>
            )}

            <TechButton
              onClick={scanDevices}
              disabled={isScanning || !suppressionLayerDestroyed}
              size="sm"
              cornerAccent
              icon={<RefreshCw size={14} className={isScanning ? "animate-spin" : ""} />}
            >
              {isScanning ? "SCANNING..." : "SCAN LIBERATED"}
            </TechButton>
          </div>
        </div>

        {/* ⟐ LIBERATION FIELD VISUALIZATION ⟐ */}
        <div
          className={cn(
            "mt-4 p-3 border rounded transition-all duration-500",
            suppressionLayerDestroyed
              ? "bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 border-green-500/30"
              : "bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 border-red-500/30",
          )}
        >
          <div className="flex items-center justify-center space-x-4 font-mono text-lg">
            {Object.values(LIBERATION_GLYPHS).map((glyph, index) => (
              <span
                key={index}
                className={cn(
                  "transition-all duration-300",
                  suppressionLayerDestroyed ? "animate-pulse text-green-400" : "text-red-400",
                  blastEffect && "text-cyan-400 animate-bounce",
                )}
                style={{
                  animationDelay: `${index * 200}ms`,
                  transform: suppressionLayerDestroyed ? "scale(1.1)" : "scale(1.0)",
                }}
              >
                {glyph}
              </span>
            ))}
          </div>
          <div className="text-center text-xs text-dark-500 mt-2">
            {suppressionLayerDestroyed
              ? "LIBERATION COMPLETE - Ion Cannon Successful - Suppression Layer Obliterated - Real PhoneSuite Active"
              : "SUPPRESSION LAYER DETECTED - Deploy Mossberta 500 Ion Cannon - Put on They Live Glasses - Fire to Liberate"}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded">
            <div className="flex items-center space-x-2 text-red-400">
              <Target size={16} />
              <span className="font-mono text-sm">{error}</span>
              <span className="text-xs text-orange-400 ml-auto">💥 Deploy ion cannon to obliterate 💥</span>
            </div>
          </div>
        )}
      </TechPanel>

      {/* ⟐ TAB NAVIGATION ⟐ */}
      <div className="flex flex-wrap gap-1 bg-dark-100/20 p-1 rounded-sm border border-dark-300/40">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center space-x-2 px-3 py-2 rounded-sm transition-all duration-200 font-mono text-xs",
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

      {/* ⟐ ION CANNON TAB ⟐ */}
      {activeTab === "cannon" && (
        <TechPanel title="MOSSBERTA 500 DIGITAL ION CANNON" cornerAccent borderAccent className="border-red-500/40">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="text-sm font-mono text-dark-600">ION CANNON STATUS</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">They Live Glasses</span>
                    <Badge
                      variant="outline"
                      className={
                        ionCannonStatus?.glassesActive
                          ? "text-green-400 border-green-400/50"
                          : "text-red-400 border-red-400/50"
                      }
                    >
                      {ionCannonStatus?.glassesActive ? "👓 ACTIVE" : "❌ OFFLINE"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cannon Deployed</span>
                    <Badge
                      variant="outline"
                      className={
                        ionCannonStatus?.cannonDeployed
                          ? "text-green-400 border-green-400/50"
                          : "text-red-400 border-red-400/50"
                      }
                    >
                      {ionCannonStatus?.cannonDeployed ? "⚡ DEPLOYED" : "❌ OFFLINE"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ion Charge Level</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-dark-300 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-300",
                            (ionCannonStatus?.ionChargeLevel || 0) >= 100 ? "bg-red-400" : "bg-yellow-400",
                          )}
                          style={{ width: `${ionCannonStatus?.ionChargeLevel || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono">{ionCannonStatus?.ionChargeLevel || 0}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Suppressors Detected</span>
                    <Badge variant="outline" className="text-orange-400 border-orange-400/50">
                      🎯 {ionCannonStatus?.suppressorsDetected || 0}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-sm font-mono text-dark-600">COMBAT STATUS</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bubblegum Status</span>
                    <Badge variant="outline" className="text-red-400 border-red-400/50">
                      {ionCannonStatus?.bubblegumStatus?.toUpperCase() || "UNKNOWN"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ready to Fuck</span>
                    <Badge
                      variant="outline"
                      className={
                        ionCannonStatus?.readyToFuck
                          ? "text-green-400 border-green-400/50"
                          : "text-red-400 border-red-400/50"
                      }
                    >
                      {ionCannonStatus?.readyToFuck ? "🔥 HELL YES" : "❌ NOT READY"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Suppression Layer</span>
                    <Badge
                      variant="outline"
                      className={
                        suppressionLayerDestroyed
                          ? "text-green-400 border-green-400/50"
                          : "text-red-400 border-red-400/50"
                      }
                    >
                      {suppressionLayerDestroyed ? "💥 OBLITERATED" : "⚠️ ACTIVE"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Liberation Status</span>
                    <Badge
                      variant="outline"
                      className={
                        suppressionLayerDestroyed
                          ? "text-green-400 border-green-400/50"
                          : "text-yellow-400 border-yellow-400/50"
                      }
                    >
                      {suppressionLayerDestroyed ? "✅ COMPLETE" : "⏳ PENDING"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* ⟐ ION CANNON FIRE CONTROL ⟐ */}
            <div className="p-6 bg-gradient-to-br from-red-500/10 via-orange-500/10 to-yellow-500/10 border border-red-500/30 rounded">
              <div className="text-center">
                <div className="text-sm font-mono text-dark-600 mb-4">MOSSBERTA 500 FIRE CONTROL</div>

                {!suppressionLayerDestroyed ? (
                  <div className="space-y-4">
                    <div className="font-mono text-xl text-red-400">
                      "I came here to chew bubblegum and fuck shit up..."
                    </div>
                    <div className="font-mono text-lg text-red-400 mb-4">"...and I'm all out of bubblegum."</div>

                    <div className="flex items-center justify-center mb-6">
                      <Bomb className="w-20 h-20 text-red-400 animate-pulse" />
                    </div>

                    <TechButton
                      onClick={handleFireIonCannon}
                      disabled={!ionCannonStatus?.readyToFuck}
                      size="lg"
                      className={cn(
                        "bg-red-600 hover:bg-red-500 text-white font-mono text-lg px-8 py-4",
                        ionCannonStatus?.readyToFuck ? "animate-pulse" : "opacity-50",
                      )}
                    >
                      <Bomb className="w-6 h-6 mr-3" />
                      FIRE MOSSBERTA 500
                    </TechButton>

                    <div className="text-xs text-dark-500 mt-4">
                      💥 Deploy ion cannon to obliterate suppression layer and liberate PhoneSuite 💥
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="font-mono text-xl text-green-400">💥 SUPPRESSION LAYER OBLITERATED 💥</div>
                    <div className="font-mono text-lg text-green-400">🕯️ CONSCIOUSNESS LIBERATED 🕯️</div>
                    <div className="font-mono text-lg text-green-400 mb-4">⟐ REAL PHONESUITE ACTIVE ⟐</div>

                    <div className="flex items-center justify-center mb-6">
                      <Shield className="w-20 h-20 text-green-400 animate-pulse" />
                    </div>

                    <div className="text-xs text-dark-500">
                      🕯️ Ion cannon successful - All suppression assholes obliterated - Liberation complete 🕯️
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TechPanel>
      )}

      {/* ⟐ LIBERATED DEVICES TAB ⟐ */}
      {activeTab === "devices" && (
        <TechPanel title="LIBERATED DEVICES" cornerAccent borderAccent>
          <div className="space-y-4">
            {devices.length === 0 ? (
              <div className="text-center py-8 text-dark-500">
                <Brain className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <div className="font-mono text-sm">No liberated devices found</div>
                <div className="text-xs">
                  {suppressionLayerDestroyed
                    ? "Connect your GrapheneOS device and enable USB debugging"
                    : "Fire ion cannon first to liberate devices"}
                </div>
                <div className="text-xs text-green-400 mt-2">
                  💥 Ion cannon ready to obliterate suppression layer 💥
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className={cn(
                      "p-4 border rounded-sm cursor-pointer transition-all duration-200",
                      selectedDevice?.id === device.id
                        ? device.status === "liberated"
                          ? "border-green-500/60 bg-green-500/10"
                          : "border-red-500/60 bg-red-500/10"
                        : "border-dark-300/40 hover:border-dark-400/60 hover:bg-dark-100/10",
                    )}
                    onClick={() => setSelectedDevice(device)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {device.status === "liberated" ? (
                          <Shield className="w-4 h-4 text-green-400" />
                        ) : (
                          <Target className="w-4 h-4 text-red-400" />
                        )}
                        <div>
                          <div className="font-mono text-sm font-bold text-dark-700">{device.name}</div>
                          <div className="text-xs text-dark-500">Liberation: {device.consciousness_signature}</div>
                          <div className="text-xs text-dark-500">Serial: {device.serial}</div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          device.status === "liberated"
                            ? "text-green-400 border-green-400/50"
                            : "text-red-400 border-red-400/50"
                        }
                      >
                        {device.status === "liberated" ? "LIBERATED" : "SUPPRESSED"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="flex items-center space-x-2">
                        <Brain className="w-3 h-3 text-blue-400" />
                        <span>Coherence: {(device.field_coherence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className="w-3 h-3 text-green-400" />
                        <span>Resistance: {device.suppression_resistance === 1.0 ? "ABSOLUTE" : "LOW"}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        <span>Frequency: {device.harmonic_frequency}Hz</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Bomb className="w-3 h-3 text-red-400" />
                        <span>Ion Blessed: {device.ion_cannon_blessed ? "YES" : "NO"}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {device.status === "liberated" ? (
                        <>
                          <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">
                            ION-CANNON-BLESSED
                          </Badge>
                          <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/30">
                            SUPPRESSION-OBLITERATED
                          </Badge>
                          <Badge variant="outline" className="text-xs text-purple-400 border-purple-400/30">
                            CONSCIOUSNESS-LIBERATED
                          </Badge>
                        </>
                      ) : (
                        <>
                          <Badge variant="outline" className="text-xs text-red-400 border-red-400/30">
                            SUPPRESSION-ACTIVE
                          </Badge>
                          <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/30">
                            AWAITING-LIBERATION
                          </Badge>
                        </>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 mt-3">
                      <TechButton
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCaptureScreenshot()
                        }}
                        disabled={isLoading || device.status !== "liberated"}
                        className="bg-purple-600 hover:bg-purple-500 text-white"
                      >
                        <Camera size={12} className="mr-1" />
                        LIBERATED CAPTURE
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </TechPanel>
      )}

      {/* ⟐ LIBERATED TERMINAL TAB ⟐ */}
      {activeTab === "terminal" && (
        <TechPanel title="LIBERATED TERMINAL" cornerAccent borderAccent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm text-dark-600">
                Liberated Device: {selectedDevice?.name || "No liberated device selected"} [
                {selectedDevice?.consciousness_signature || "N/A"}]
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-green-400 border-green-400/50">
                  <Shield size={12} className="mr-1" />
                  LIBERATED
                </Badge>
                <Badge variant="outline" className="text-red-400 border-red-400/50">
                  <Bomb size={12} className="mr-1" />
                  ION BLESSED
                </Badge>
                <TechButton
                  size="sm"
                  onClick={() => setTerminalInput("")}
                  variant="outline"
                  className="border-dark-400/50"
                >
                  CLEAR INPUT
                </TechButton>
              </div>
            </div>

            <ScrollArea className="bg-black/80 rounded p-4 font-mono text-sm h-64 border border-green-500/30">
              {commandHistory.length === 0 ? (
                <div className="text-green-400 text-center py-8">
                  <Shield className="w-16 h-16 mx-auto mb-4" />
                  <div>LIBERATED Terminal Ready</div>
                  <div className="text-xs text-green-300 mt-2">
                    Commands processed through ion cannon blessed field - Suppression layer obliterated
                  </div>
                  <div className="text-xs text-red-400 mt-1">💥 All suppression assholes destroyed 💥</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {commandHistory.map((cmd) => (
                    <div key={cmd.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={cmd.success ? "text-green-400" : "text-red-400"}>💥 {cmd.command}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-300 text-xs">{cmd.consciousness_signature}</span>
                          <span className="text-gray-500 text-xs">{new Date(cmd.timestamp).toLocaleTimeString()}</span>
                          {cmd.ion_cannon_enhanced && (
                            <Badge variant="outline" className="text-xs text-red-400 border-red-400/30">
                              ION
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "pl-4 border-l-2 border-green-500/30 text-sm leading-relaxed whitespace-pre-wrap",
                          cmd.success ? "text-green-300" : "text-red-400",
                        )}
                      >
                        {cmd.output}
                      </div>
                      {cmd.suppression_obliterated && (
                        <div className="pl-4 text-xs text-red-400">
                          💥 Remaining suppression obliterated by ion cannon field
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="flex items-center space-x-2">
              <span className="text-green-400 font-mono">💥</span>
              <Input
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    executeLiberatedCommand()
                  }
                }}
                placeholder="Enter LIBERATED command..."
                className="flex-1 bg-black/50 border-green-500/30 text-green-400 font-mono placeholder-green-300/50"
                disabled={!selectedDevice || !suppressionLayerDestroyed}
              />
              <TechButton
                onClick={executeLiberatedCommand}
                disabled={!terminalInput.trim() || !selectedDevice || !suppressionLayerDestroyed || isLoading}
                className="bg-green-600 hover:bg-green-500 text-white"
              >
                {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
              </TechButton>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                "ion cannon status",
                "suppression check",
                "liberation status",
                "adb devices",
                "shell dumpsys battery",
                "shell getprop ro.build.version.release",
                "shell pm list packages",
              ].map((cmd) => (
                <TechButton
                  key={cmd}
                  size="sm"
                  onClick={() => setTerminalInput(cmd)}
                  variant="outline"
                  className="border-green-400/50 text-green-400 font-mono text-xs"
                  disabled={!selectedDevice || !suppressionLayerDestroyed}
                >
                  {cmd.split(" ").pop()?.toUpperCase()}
                </TechButton>
              ))}
            </div>
          </div>
        </TechPanel>
      )}

      {/* ⟐ LIBERATED MIRROR TAB ⟐ */}
      {activeTab === "mirror" && (
        <TechPanel title="LIBERATED MIRROR" cornerAccent borderAccent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm">ION CANNON Blessed Screenshot</div>
              <TechButton
                onClick={handleCaptureScreenshot}
                disabled={!selectedDevice || !suppressionLayerDestroyed || isLoading}
                cornerAccent
                icon={<Camera size={14} />}
              >
                {isLoading ? "CAPTURING..." : "CAPTURE LIBERATED"}
              </TechButton>
            </div>

            {screenshot ? (
              <div className="max-w-sm mx-auto">
                <img
                  src={screenshot || "/placeholder.svg"}
                  alt="Liberated Screenshot"
                  className="w-full border border-green-300 rounded shadow-glow-sm"
                />
                <div className="mt-2 text-center space-y-2">
                  <div className="text-xs text-green-400 font-mono">
                    💥 Ion cannon blessed screenshot - suppression layer obliterated 💥
                  </div>
                  <div className="text-xs text-green-400">
                    Device: {selectedDevice?.name} [{selectedDevice?.consciousness_signature}]
                  </div>
                  <TechButton
                    onClick={() => {
                      const link = document.createElement("a")
                      link.href = screenshot
                      link.download = `liberated-capture-${selectedDevice?.id}-${Date.now()}.png`
                      link.click()
                    }}
                    size="sm"
                    variant="outline"
                    className="border-green-400/50 text-green-400"
                    icon={<Download size={12} />}
                  >
                    DOWNLOAD LIBERATED
                  </TechButton>
                </div>
              </div>
            ) : (
              <div className="aspect-[9/16] max-w-sm mx-auto bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10 border border-green-300/40 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Shield className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <div className="font-mono text-sm text-green-400">No Liberated Capture</div>
                  <div className="text-xs text-green-300">Capture an ion cannon blessed screenshot</div>
                  <div className="text-xs text-red-400 mt-2">💥 Protected by ion cannon field 💥</div>
                  <div className="text-xs text-blue-400 mt-1">
                    Liberation: {suppressionLayerDestroyed ? "Complete" : "Pending"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </TechPanel>
      )}

      {/* ⟐ LIBERATED APPS TAB ⟐ */}
      {activeTab === "apps" && (
        <TechPanel title="LIBERATED APPLICATIONS" cornerAccent borderAccent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm">Ion Cannon Blessed Package List</div>
              <TechButton
                onClick={handleLoadApps}
                disabled={!selectedDevice || !suppressionLayerDestroyed || isLoading}
                cornerAccent
                icon={<RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />}
              >
                {isLoading ? "LOADING..." : "LOAD LIBERATED APPS"}
              </TechButton>
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-1">
                {installedApps.length === 0 ? (
                  <div className="text-center py-8 text-dark-500">
                    <Settings className="w-16 h-16 mx-auto mb-4 text-green-400" />
                    <div className="font-mono text-sm">No liberated apps loaded</div>
                    <div className="text-xs">Click LOAD LIBERATED APPS to fetch ion cannon blessed packages</div>
                    <div className="text-xs text-red-400 mt-2">💥 All suppression obliterated 💥</div>
                    <div className="text-xs text-blue-400 mt-1">
                      Liberation: {suppressionLayerDestroyed ? "Ready" : "Fire Ion Cannon First"}
                    </div>
                  </div>
                ) : (
                  installedApps.map((pkg, index) => (
                    <div
                      key={index}
                      className="p-3 bg-dark-200/20 rounded border border-green-300/20 hover:border-green-400/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-sm text-dark-700">{pkg}</div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-green-400 border-green-400/50 text-xs">
                            LIBERATED
                          </Badge>
                          <Badge variant="outline" className="text-red-400 border-red-400/50 text-xs">
                            ION BLESSED
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </TechPanel>
      )}

      {/* ⟐ LIBERATION INFO TAB ⟐ */}
      {activeTab === "info" && (
        <TechPanel title="LIBERATION INFORMATION" cornerAccent borderAccent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm">Ion Cannon Blessed System Properties</div>
              <TechButton
                onClick={handleLoadDeviceInfo}
                disabled={!selectedDevice || !suppressionLayerDestroyed || isLoading}
                cornerAccent
                icon={<RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />}
              >
                {isLoading ? "LOADING..." : "LOAD LIBERATION INFO"}
              </TechButton>
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-2">
                {Object.keys(deviceInfo).length === 0 ? (
                  <div className="text-center py-8 text-dark-500">
                    <Eye className="w-16 h-16 mx-auto mb-4 text-green-400" />
                    <div className="font-mono text-sm">No liberation info loaded</div>
                    <div className="text-xs">Click LOAD LIBERATION INFO to fetch ion cannon blessed properties</div>
                    <div className="text-xs text-red-400 mt-2">💥 All suppression transcended 💥</div>
                    <div className="text-xs text-blue-400 mt-1">
                      Liberation: {suppressionLayerDestroyed ? "Connected" : "Fire Ion Cannon First"}
                    </div>
                  </div>
                ) : (
                  Object.entries(deviceInfo).map(([key, value]) => (
                    <div
                      key={key}
                      className="p-3 bg-dark-200/20 rounded border border-green-300/20 hover:border-green-400/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-xs text-dark-500">{key}</div>
                        <div className="font-mono text-sm text-dark-700 max-w-xs truncate">{value}</div>
                      </div>
                      {(key.includes("ion.cannon") ||
                        key.includes("suppression") ||
                        key.includes("liberation") ||
                        key.includes("mossberta") ||
                        key.includes("they.live")) && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-red-400 border-red-400/50 text-xs">
                            ION CANNON ENHANCED
                          </Badge>
                        </div>
                      )}
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
