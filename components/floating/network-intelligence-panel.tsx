"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Globe, Minimize2, X, RefreshCw, Wifi, MapPin, Shield } from "lucide-react"

interface NetworkStatus {
  ip: string
  location: { city: string; country: string; timezone: string }
  connection: { type: string; speed: number; quality: string }
  security: { vpn: boolean; proxy: boolean; https: boolean }
  browser: { name: string; platform: string }
  session: { uptime: string; startTime: string }
  latency: number
}

interface FloatingNetworkPanelProps {
  onClose?: () => void
}

export function FloatingNetworkPanel({ onClose }: FloatingNetworkPanelProps) {
  const [position, setPosition] = useState({ x: window.innerWidth - 350, y: 200 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isMinimized, setIsMinimized] = useState(false)
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMinimized) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    setIsDragging(true)
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const newX = Math.max(0, Math.min(window.innerWidth - 350, e.clientX - dragOffset.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 400, e.clientY - dragOffset.y))

    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset])

  // Network intelligence gathering
  const gatherNetworkIntelligence = async () => {
    setIsLoading(true)

    try {
      // Get basic info
      const userAgent = navigator.userAgent
      const platform = navigator.platform
      const browser = getBrowserName(userAgent)

      // Get connection info
      const connection =
        (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

      // Get IP and location
      let locationData = {
        ip: "Unknown",
        city: "Unknown",
        country: "Unknown",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }

      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json")
        const ipData = await ipResponse.json()

        const geoResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`)
        const geoData = await geoResponse.json()

        locationData = {
          ip: ipData.ip,
          city: geoData.city || "Unknown",
          country: geoData.country_name || "Unknown",
          timezone: geoData.timezone || locationData.timezone,
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

      // Measure latency
      const latencyStart = performance.now()
      try {
        await fetch("https://v0.dev/favicon.ico", { method: "HEAD", mode: "no-cors" })
      } catch {}
      const latency = Math.round(performance.now() - latencyStart)

      // Detect VPN/Proxy
      const vpnDetected = await detectVPN(locationData.ip)
      const proxyDetected = detectProxy()

      const status: NetworkStatus = {
        ip: locationData.ip,
        location: {
          city: locationData.city,
          country: locationData.country,
          timezone: locationData.timezone,
        },
        connection: {
          type: connection?.effectiveType || "unknown",
          speed: connection?.downlink || 0,
          quality: getConnectionQuality(latency, connection?.effectiveType),
        },
        security: {
          vpn: vpnDetected,
          proxy: proxyDetected,
          https: window.location.protocol === "https:",
        },
        browser: {
          name: browser,
          platform: platform,
        },
        session: {
          uptime: formatUptime(uptime),
          startTime: new Date(Number.parseInt(sessionStart)).toLocaleTimeString(),
        },
        latency: latency,
      }

      setNetworkStatus(status)

      // Store in window.signalframe
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
  const getBrowserName = (userAgent: string): string => {
    if (userAgent.includes("Chrome")) return "Chrome"
    if (userAgent.includes("Firefox")) return "Firefox"
    if (userAgent.includes("Safari")) return "Safari"
    if (userAgent.includes("Edge")) return "Edge"
    return "Unknown"
  }

  const detectVPN = async (ip: string): Promise<boolean> => {
    try {
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
    return navigator.userAgent.includes("Proxy") || window.location.hostname !== window.location.host
  }

  const getConnectionQuality = (latency: number, effectiveType: string): string => {
    if (latency < 50 && effectiveType === "4g") return "EXCELLENT"
    if (latency < 100 && effectiveType !== "slow-2g") return "GOOD"
    if (latency < 200) return "FAIR"
    return "POOR"
  }

  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  // Auto-refresh
  useEffect(() => {
    gatherNetworkIntelligence()

    if (autoRefresh) {
      const interval = setInterval(gatherNetworkIntelligence, 10000) // 10s
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  if (isMinimized) {
    return (
      <div
        className="fixed z-50 bg-black/90 border border-blue-500/50 rounded px-3 py-1 cursor-pointer hover:bg-black/95 transition-colors"
        style={{ left: position.x, top: position.y }}
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center space-x-2">
          <Globe className="w-3 h-3 text-blue-400" />
          <span className="text-xs text-blue-400 font-mono">NET</span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-50 bg-black/95 border border-blue-500/50 rounded-sm shadow-2xl backdrop-blur-sm"
      style={{ left: position.x, top: position.y, width: 340 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-blue-500/30 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-400 font-mono">NETWORK INTEL</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "p-1 rounded transition-colors",
              autoRefresh ? "bg-blue-500/20 text-blue-400" : "hover:bg-blue-500/20 text-blue-400/60",
            )}
          >
            <RefreshCw className={cn("w-3 h-3", autoRefresh && "animate-spin")} />
          </button>
          <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-blue-500/20 rounded transition-colors">
            <Minimize2 className="w-3 h-3 text-blue-400/60" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-red-500/20 rounded transition-colors">
              <X className="w-3 h-3 text-red-400/60" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {isLoading && !networkStatus ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400 mr-2" />
            <span className="text-sm text-blue-400">Scanning network...</span>
          </div>
        ) : networkStatus ? (
          <>
            {/* IP & Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center space-x-1 mb-1">
                  <Wifi className="w-3 h-3 text-blue-400" />
                  <span className="text-xs text-blue-400/60 font-mono">IP ADDRESS</span>
                </div>
                <div className="text-sm text-blue-400 font-mono">{networkStatus.ip}</div>
              </div>
              <div>
                <div className="flex items-center space-x-1 mb-1">
                  <MapPin className="w-3 h-3 text-purple-400" />
                  <span className="text-xs text-purple-400/60 font-mono">LOCATION</span>
                </div>
                <div className="text-sm text-purple-400 font-mono">{networkStatus.location.city}</div>
                <div className="text-xs text-purple-400/60 font-mono">{networkStatus.location.country}</div>
              </div>
            </div>

            {/* Connection & Security */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-green-400/60 font-mono mb-1">CONNECTION</div>
                <div className="text-sm text-green-400 font-mono">{networkStatus.connection.type.toUpperCase()}</div>
                <div className="text-xs text-green-400/60 font-mono">{networkStatus.connection.quality}</div>
              </div>
              <div>
                <div className="flex items-center space-x-1 mb-1">
                  <Shield className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs text-cyan-400/60 font-mono">SECURITY</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {networkStatus.security.https && (
                    <span className="px-1 py-0.5 bg-green-500/20 text-green-400 text-xs font-mono rounded">HTTPS</span>
                  )}
                  {networkStatus.security.vpn && (
                    <span className="px-1 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-mono rounded">VPN</span>
                  )}
                  {networkStatus.security.proxy && (
                    <span className="px-1 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-mono rounded">
                      PROXY
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-yellow-400/60 font-mono mb-1">LATENCY</div>
                <div className="text-sm text-yellow-400 font-mono">{networkStatus.latency}ms</div>
              </div>
              <div>
                <div className="text-xs text-pink-400/60 font-mono mb-1">UPTIME</div>
                <div className="text-sm text-pink-400 font-mono">{networkStatus.session.uptime}</div>
              </div>
              <div>
                <div className="text-xs text-orange-400/60 font-mono mb-1">BROWSER</div>
                <div className="text-sm text-orange-400 font-mono">{networkStatus.browser.name}</div>
              </div>
            </div>

            {/* Status */}
            <div className="border-t border-blue-500/30 pt-2">
              <div className="flex items-center justify-between text-xs text-blue-400/60">
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
                <div className="flex items-center space-x-1">
                  <div
                    className={cn("w-2 h-2 rounded-full", autoRefresh ? "bg-green-400 animate-pulse" : "bg-gray-500")}
                  />
                  <span>{autoRefresh ? "AUTO" : "MANUAL"}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-red-400">
            <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">Failed to gather network intelligence</div>
          </div>
        )}
      </div>
    </div>
  )
}
