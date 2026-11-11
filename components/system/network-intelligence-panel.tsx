"use client"

import { useState, useEffect } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { Badge } from "@/components/ui/badge"
import { TechButton } from "@/components/ui/tech-button"
import { cn } from "@/lib/utils"
import { Globe, MapPin, Monitor, Clock, Cpu, Activity, Shield, Zap, RefreshCw, Eye } from "lucide-react"

interface NetworkStatus {
  ip: string
  vpnDetected: boolean
  proxyDetected: boolean
  latency: number
  browser: string
  platform: string
  location: {
    city: string
    region: string
    country: string
    timezone: string
  }
  connection: {
    type: string
    effectiveType: string
    downlink: number
    rtt: number
  }
  session: {
    uptime: string
    startTime: string
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  security: {
    https: boolean
    cookiesEnabled: boolean
    doNotTrack: boolean
  }
}

interface NetworkIntelligencePanelProps {
  className?: string
  isFloating?: boolean
  onToggleFloat?: () => void
}

export function NetworkIntelligencePanel({
  className,
  isFloating = false,
  onToggleFloat,
}: NetworkIntelligencePanelProps) {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(10000) // 10 seconds

  // Gather network intelligence
  const gatherNetworkIntelligence = async () => {
    setIsLoading(true)

    try {
      // Get basic browser info
      const userAgent = navigator.userAgent
      const platform = navigator.platform
      const browser = getBrowserInfo(userAgent)

      // Get connection info
      const connection =
        (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

      // Get memory info
      const memory = (performance as any).memory

      // Get location (using a free IP geolocation service)
      let locationData = {
        city: "Unknown",
        region: "Unknown",
        country: "Unknown",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ip: "Unknown",
      }

      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json")
        const ipData = await ipResponse.json()

        const geoResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`)
        const geoData = await geoResponse.json()

        locationData = {
          city: geoData.city || "Unknown",
          region: geoData.region || "Unknown",
          country: geoData.country_name || "Unknown",
          timezone: geoData.timezone || locationData.timezone,
          ip: ipData.ip,
        }
      } catch (error) {
        console.warn("Failed to get location data:", error)
      }

      // Calculate session uptime
      const sessionStart = sessionStorage.getItem("session_start") || Date.now().toString()
      if (!sessionStorage.getItem("session_start")) {
        sessionStorage.setItem("session_start", sessionStart)
      }

      const uptime = Date.now() - Number.parseInt(sessionStart)
      const uptimeString = formatUptime(uptime)

      // Detect VPN/Proxy (basic heuristics)
      const vpnDetected = await detectVPN(locationData.ip)
      const proxyDetected = detectProxy()

      // Measure latency to v0.app
      const latency = await measureLatency("https://v0.dev")

      const status: NetworkStatus = {
        ip: locationData.ip,
        vpnDetected,
        proxyDetected,
        latency,
        browser,
        platform,
        location: {
          city: locationData.city,
          region: locationData.region,
          country: locationData.country,
          timezone: locationData.timezone,
        },
        connection: {
          type: connection?.type || "unknown",
          effectiveType: connection?.effectiveType || "unknown",
          downlink: connection?.downlink || 0,
          rtt: connection?.rtt || 0,
        },
        session: {
          uptime: uptimeString,
          startTime: new Date(Number.parseInt(sessionStart)).toLocaleString(),
        },
        memory: {
          used: memory?.usedJSHeapSize || 0,
          total: memory?.totalJSHeapSize || 0,
          percentage: memory ? Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100) : 0,
        },
        security: {
          https: window.location.protocol === "https:",
          cookiesEnabled: navigator.cookieEnabled,
          doNotTrack: navigator.doNotTrack === "1",
        },
      }

      setNetworkStatus(status)
      setLastUpdate(new Date())

      // Store in window.signalframe for external access
      if (typeof window !== "undefined") {
        if (!(window as any).signalframe) {
          ;(window as any).signalframe = {}
        }
        ;(window as any).signalframe.getNetStatus = () => status
      }
    } catch (error) {
      console.error("Failed to gather network intelligence:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper functions
  const getBrowserInfo = (userAgent: string): string => {
    if (userAgent.includes("Chrome")) return "Chrome"
    if (userAgent.includes("Firefox")) return "Firefox"
    if (userAgent.includes("Safari")) return "Safari"
    if (userAgent.includes("Edge")) return "Edge"
    return "Unknown"
  }

  const detectVPN = async (ip: string): Promise<boolean> => {
    // Basic VPN detection - in production you'd use a proper service
    try {
      // Check if IP is in common VPN ranges or has VPN-like characteristics
      const response = await fetch(`https://ipapi.co/${ip}/json/`)
      const data = await response.json()
      return (
        data.org?.toLowerCase().includes("vpn") ||
        data.org?.toLowerCase().includes("proxy") ||
        data.org?.toLowerCase().includes("hosting")
      )
    } catch {
      return false
    }
  }

  const detectProxy = (): boolean => {
    // Basic proxy detection
    return (
      !!(window as any).navigator.connection?.type === "cellular" &&
      (window as any).navigator.connection?.effectiveType === "4g"
    )
  }

  const measureLatency = async (url: string): Promise<number> => {
    try {
      const start = performance.now()
      await fetch(url, { method: "HEAD", mode: "no-cors" })
      return Math.round(performance.now() - start)
    } catch {
      return -1
    }
  }

  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Auto-refresh effect
  useEffect(() => {
    gatherNetworkIntelligence()

    if (autoRefresh) {
      const interval = setInterval(gatherNetworkIntelligence, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const getConnectionQuality = () => {
    if (!networkStatus) return { color: "gray", text: "UNKNOWN" }

    const { latency, connection } = networkStatus

    if (latency < 50 && connection.effectiveType === "4g") {
      return { color: "green", text: "EXCELLENT" }
    } else if (latency < 100 && connection.effectiveType !== "slow-2g") {
      return { color: "blue", text: "GOOD" }
    } else if (latency < 200) {
      return { color: "yellow", text: "FAIR" }
    } else {
      return { color: "red", text: "POOR" }
    }
  }

  const connectionQuality = getConnectionQuality()

  return (
    <TechPanel
      title="NETWORK INTELLIGENCE"
      subtitle="LIVE SYSTEM METADATA"
      cornerAccent={true}
      borderAccent={true}
      className={cn("min-w-80", isFloating && "fixed top-4 right-4 z-50 shadow-2xl ring-2 ring-blue-500/30", className)}
      icon={<Globe className="w-4 h-4" />}
      actions={
        <div className="flex items-center space-x-2">
          <TechButton
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
            variant={autoRefresh ? "default" : "outline"}
            className="text-xs"
          >
            {autoRefresh ? <Activity className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
          </TechButton>
          <TechButton
            onClick={gatherNetworkIntelligence}
            size="sm"
            variant="outline"
            className="text-xs"
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
          </TechButton>
          {onToggleFloat && (
            <TechButton onClick={onToggleFloat} size="sm" variant="outline" className="text-xs">
              <Eye className="w-3 h-3" />
            </TechButton>
          )}
        </div>
      }
    >
      {isLoading && !networkStatus ? (
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            <span className="text-sm text-white/60">Gathering intelligence...</span>
          </div>
        </div>
      ) : networkStatus ? (
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Globe className="w-3 h-3 text-blue-400" />
                <span className="text-xs font-mono text-white/60">IP ADDRESS</span>
              </div>
              <div className="text-sm font-mono text-white/90">{networkStatus.ip}</div>
              <div className="flex space-x-1">
                {networkStatus.vpnDetected && (
                  <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400/30">
                    VPN
                  </Badge>
                )}
                {networkStatus.proxyDetected && (
                  <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/30">
                    PROXY
                  </Badge>
                )}
                {networkStatus.security.https && (
                  <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">
                    HTTPS
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Activity className="w-3 h-3 text-green-400" />
                <span className="text-xs font-mono text-white/60">CONNECTION</span>
              </div>
              <div className="text-sm font-mono text-white/90">
                {networkStatus.connection.effectiveType?.toUpperCase() || "UNKNOWN"}
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs border-opacity-30",
                  connectionQuality.color === "green" && "text-green-400 border-green-400/30",
                  connectionQuality.color === "blue" && "text-blue-400 border-blue-400/30",
                  connectionQuality.color === "yellow" && "text-yellow-400 border-yellow-400/30",
                  connectionQuality.color === "red" && "text-red-400 border-red-400/30",
                  connectionQuality.color === "gray" && "text-gray-400 border-gray-400/30",
                )}
              >
                {connectionQuality.text}
              </Badge>
            </div>
          </div>

          {/* Location & Platform */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-3 h-3 text-purple-400" />
                <span className="text-xs font-mono text-white/60">LOCATION</span>
              </div>
              <div className="text-sm font-mono text-white/90">
                {networkStatus.location.city}, {networkStatus.location.region}
              </div>
              <div className="text-xs font-mono text-white/50">{networkStatus.location.country}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Monitor className="w-3 h-3 text-cyan-400" />
                <span className="text-xs font-mono text-white/60">PLATFORM</span>
              </div>
              <div className="text-sm font-mono text-white/90">{networkStatus.browser}</div>
              <div className="text-xs font-mono text-white/50">{networkStatus.platform}</div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-xs font-mono text-white/60">LATENCY</span>
              </div>
              <div className="text-sm font-mono text-white/90">
                {networkStatus.latency > 0 ? `${networkStatus.latency}ms` : "N/A"}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3 text-blue-400" />
                <span className="text-xs font-mono text-white/60">UPTIME</span>
              </div>
              <div className="text-sm font-mono text-white/90">{networkStatus.session.uptime}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Cpu className="w-3 h-3 text-red-400" />
                <span className="text-xs font-mono text-white/60">MEMORY</span>
              </div>
              <div className="text-sm font-mono text-white/90">{formatBytes(networkStatus.memory.used)}</div>
              <div className="text-xs font-mono text-white/50">{networkStatus.memory.percentage}%</div>
            </div>
          </div>

          {/* Security Status */}
          <div className="border-t border-white/10 pt-3">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-3 h-3 text-green-400" />
              <span className="text-xs font-mono text-white/60">SECURITY STATUS</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">
                HTTPS: {networkStatus.security.https ? "YES" : "NO"}
              </Badge>
              <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/30">
                COOKIES: {networkStatus.security.cookiesEnabled ? "YES" : "NO"}
              </Badge>
              <Badge variant="outline" className="text-xs text-purple-400 border-purple-400/30">
                DNT: {networkStatus.security.doNotTrack ? "YES" : "NO"}
              </Badge>
            </div>
          </div>

          {/* Last Update */}
          <div className="border-t border-white/10 pt-2">
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
              <div className="flex items-center space-x-1">
                <div
                  className={cn("w-2 h-2 rounded-full", autoRefresh ? "bg-green-400 animate-pulse" : "bg-gray-500")}
                />
                <span>{autoRefresh ? "AUTO" : "MANUAL"}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 text-white/60">
          <div className="text-center">
            <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">Failed to gather network intelligence</div>
          </div>
        </div>
      )}
    </TechPanel>
  )
}
