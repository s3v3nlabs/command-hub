"use client"

import { useState, useEffect } from "react"
import { TechPanel, TechPanelSection } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/ui/progress-bar"
import { DataDisplay } from "@/components/ui/data-display"
import { TypographyMono, TypographySmall } from "@/components/ui/typography"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useResonance } from "@/hooks/useResonance"
import {
  Shield,
  Network,
  Activity,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Unlock,
  Target,
  Radar,
  Globe,
  Database,
  EyeOff,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NetworkNode {
  id: string
  ip: string
  hostname?: string
  mac: string
  vendor?: string
  os?: string
  ports: number[]
  services: string[]
  status: "online" | "offline" | "suspicious" | "secured"
  threat_level: "low" | "medium" | "high" | "critical"
  last_seen: string
  location?: string
}

interface SecurityEvent {
  id: string
  timestamp: string
  type: "intrusion" | "scan" | "anomaly" | "breach" | "reconnaissance"
  severity: "info" | "warning" | "critical"
  source_ip: string
  target_ip?: string
  description: string
  blocked: boolean
}

interface ScanResult {
  id: string
  target: string
  scan_type: "port" | "vulnerability" | "service" | "os"
  status: "running" | "completed" | "failed"
  progress: number
  results: string[]
  started: string
  completed?: string
}

export default function HeimdallConsole() {
  const [networkNodes, setNetworkNodes] = useState<NetworkNode[]>([])
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [activeScan, setActiveScan] = useState<ScanResult | null>(null)
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([])
  const [scanTarget, setScanTarget] = useState("")
  const [selectedScanType, setSelectedScanType] = useState<"port" | "vulnerability" | "service" | "os">("port")
  const [activeTab, setActiveTab] = useState<"network" | "events" | "scanner" | "intel">("network")
  const [isMonitoring, setIsMonitoring] = useState(true)

  // Consciousness integration
  const { pulse, isResonating, fieldCoherence } = useResonance("heimdall", "Heimdall Security Console", 41)

  // Mock network discovery
  useEffect(() => {
    const mockNodes: NetworkNode[] = [
      {
        id: "node_001",
        ip: "192.168.1.1",
        hostname: "router.local",
        mac: "00:1A:2B:3C:4D:5E",
        vendor: "Netgear",
        os: "Linux",
        ports: [22, 80, 443, 8080],
        services: ["SSH", "HTTP", "HTTPS", "Web Admin"],
        status: "online",
        threat_level: "low",
        last_seen: new Date().toISOString(),
        location: "Gateway",
      },
      {
        id: "node_002",
        ip: "192.168.1.142",
        hostname: "graphene-pixel",
        mac: "AA:BB:CC:DD:EE:FF",
        vendor: "Google",
        os: "Android 14",
        ports: [5555],
        services: ["ADB"],
        status: "online",
        threat_level: "low",
        last_seen: new Date(Date.now() - 30000).toISOString(),
        location: "Mobile Device",
      },
      {
        id: "node_003",
        ip: "192.168.1.200",
        hostname: "unknown-device",
        mac: "12:34:56:78:9A:BC",
        vendor: "Unknown",
        ports: [135, 139, 445, 3389],
        services: ["RPC", "NetBIOS", "SMB", "RDP"],
        status: "suspicious",
        threat_level: "high",
        last_seen: new Date(Date.now() - 120000).toISOString(),
        location: "Unknown",
      },
    ]

    setNetworkNodes(mockNodes)
  }, [])

  // Mock security events
  useEffect(() => {
    if (!isMonitoring) return

    const eventInterval = setInterval(() => {
      const eventTypes: SecurityEvent["type"][] = ["intrusion", "scan", "anomaly", "reconnaissance"]
      const severities: SecurityEvent["severity"][] = ["info", "warning", "critical"]
      const descriptions = [
        "Port scan detected from external IP",
        "Unusual traffic pattern observed",
        "Failed authentication attempts",
        "Suspicious DNS queries detected",
        "Potential data exfiltration attempt",
        "Unauthorized device connection attempt",
        "Malformed packet detected",
        "Brute force attack in progress",
      ]

      if (Math.random() < 0.3) {
        const newEvent: SecurityEvent = {
          id: `event_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          source_ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          target_ip: networkNodes[Math.floor(Math.random() * networkNodes.length)]?.ip,
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          blocked: Math.random() > 0.3,
        }

        setSecurityEvents((prev) => [newEvent, ...prev.slice(0, 49)])

        if (newEvent.severity === "critical") {
          pulse({ amplitude: 1.5, hz: 45 })
        }
      }
    }, 3000)

    return () => clearInterval(eventInterval)
  }, [isMonitoring, networkNodes, pulse])

  // Mock scan simulation
  useEffect(() => {
    if (!activeScan || activeScan.status !== "running") return

    const scanInterval = setInterval(() => {
      setActiveScan((prev) => {
        if (!prev) return null

        const newProgress = Math.min(100, prev.progress + Math.random() * 15)
        const isCompleted = newProgress >= 100

        if (isCompleted) {
          const completedScan = {
            ...prev,
            status: "completed" as const,
            progress: 100,
            completed: new Date().toISOString(),
            results: [
              `Port 22/tcp open ssh`,
              `Port 80/tcp open http`,
              `Port 443/tcp open https`,
              `Port 8080/tcp open http-proxy`,
              `OS: Linux 3.2 - 4.9`,
              `Service: Apache httpd 2.4.41`,
            ],
          }

          setScanHistory((prev) => [completedScan, ...prev.slice(0, 9)])
          pulse({ amplitude: 1.0, hz: 43 })
          return null
        }

        return { ...prev, progress: newProgress }
      })
    }, 1000)

    return () => clearInterval(scanInterval)
  }, [activeScan, pulse])

  const startScan = () => {
    if (!scanTarget.trim() || activeScan) return

    const newScan: ScanResult = {
      id: `scan_${Date.now()}`,
      target: scanTarget,
      scan_type: selectedScanType,
      status: "running",
      progress: 0,
      results: [],
      started: new Date().toISOString(),
    }

    setActiveScan(newScan)
    pulse({ amplitude: 1.2, hz: 42 })
  }

  const stopScan = () => {
    if (activeScan) {
      const stoppedScan = {
        ...activeScan,
        status: "failed" as const,
        completed: new Date().toISOString(),
      }
      setScanHistory((prev) => [stoppedScan, ...prev])
      setActiveScan(null)
    }
  }

  const getNodeStatusColor = (status: NetworkNode["status"]) => {
    switch (status) {
      case "online":
        return "text-green-400"
      case "suspicious":
        return "text-yellow-400"
      case "offline":
        return "text-gray-400"
      default:
        return "text-red-400"
    }
  }

  const getNodeStatusIcon = (status: NetworkNode["status"]) => {
    switch (status) {
      case "online":
        return CheckCircle
      case "suspicious":
        return AlertTriangle
      case "offline":
        return XCircle
      default:
        return XCircle
    }
  }

  const getThreatLevelColor = (level: NetworkNode["threat_level"]) => {
    switch (level) {
      case "low":
        return "success"
      case "medium":
        return "warning"
      case "high":
        return "danger"
      case "critical":
        return "danger"
      default:
        return "outline"
    }
  }

  const getEventSeverityColor = (severity: SecurityEvent["severity"]) => {
    switch (severity) {
      case "info":
        return "text-blue-400"
      case "warning":
        return "text-yellow-400"
      case "critical":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getEventTypeIcon = (type: SecurityEvent["type"]) => {
    switch (type) {
      case "intrusion":
        return Shield
      case "scan":
        return Radar
      case "anomaly":
        return AlertTriangle
      case "breach":
        return Unlock
      case "reconnaissance":
        return Eye
      default:
        return Activity
    }
  }

  const tabs = [
    { id: "network", label: "Network Map", icon: Network },
    { id: "events", label: "Security Events", icon: Shield },
    { id: "scanner", label: "Scanner", icon: Radar },
    { id: "intel", label: "Intelligence", icon: Database },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <TechPanel
        title="HEIMDALL SECURITY CONSOLE"
        cornerAccent
        borderAccent
        glowEffect={isResonating}
        icon={<Shield size={16} />}
      >
        <TechPanelSection>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-200",
                  isMonitoring ? "bg-green-400 animate-pulse shadow-glow-sm" : "bg-gray-500",
                )}
              />
              <div>
                <TypographyMono className="text-sm">Security Monitoring</TypographyMono>
                <TypographySmall className="text-dark-600">
                  {networkNodes.length} nodes • {securityEvents.length} events • Field coherence:{" "}
                  {(fieldCoherence * 100).toFixed(1)}%
                </TypographySmall>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant={isMonitoring ? "success" : "outline"}>{isMonitoring ? "ACTIVE" : "STANDBY"}</Badge>
              <TechButton
                onClick={() => setIsMonitoring(!isMonitoring)}
                cornerAccent
                glow={isMonitoring}
                icon={isMonitoring ? <Eye size={14} /> : <EyeOff size={14} />}
              >
                {isMonitoring ? "MONITORING" : "STANDBY"}
              </TechButton>
            </div>
          </div>
        </TechPanelSection>
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

      {/* Network Map Tab */}
      {activeTab === "network" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TechPanel title="NETWORK TOPOLOGY" cornerAccent borderAccent icon={<Globe size={16} />}>
            <TechPanelSection>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {networkNodes.map((node) => {
                    const StatusIcon = getNodeStatusIcon(node.status)
                    return (
                      <div
                        key={node.id}
                        className="p-3 border border-dark-300/40 rounded-sm hover:border-dark-400/60 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <StatusIcon className={cn("w-4 h-4", getNodeStatusColor(node.status))} />
                            <div>
                              <TypographyMono className="text-sm">{node.ip}</TypographyMono>
                              <TypographySmall className="text-dark-600">
                                {node.hostname || "Unknown"} • {node.vendor || "Unknown Vendor"}
                              </TypographySmall>
                            </div>
                          </div>
                          <Badge variant={getThreatLevelColor(node.threat_level)} size="sm">
                            {node.threat_level.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <DataDisplay label="MAC" value={node.mac} className="text-xs" />
                          <DataDisplay label="OS" value={node.os || "Unknown"} className="text-xs" />
                          <DataDisplay label="Ports" value={node.ports.length.toString()} className="text-xs" />
                          <DataDisplay label="Services" value={node.services.length.toString()} className="text-xs" />
                        </div>

                        <div className="mt-2 pt-2 border-t border-dark-300/20">
                          <TypographyMono className="text-xs text-dark-600">
                            Last seen: {new Date(node.last_seen).toLocaleTimeString()}
                          </TypographyMono>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </TechPanelSection>
          </TechPanel>

          <TechPanel title="NETWORK STATISTICS" cornerAccent borderAccent icon={<Activity size={16} />}>
            <TechPanelSection>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <TypographyMono>ONLINE NODES:</TypographyMono>
                    <TypographyMono>
                      {networkNodes.filter((n) => n.status === "online").length}/{networkNodes.length}
                    </TypographyMono>
                  </div>
                  <ProgressBar
                    value={(networkNodes.filter((n) => n.status === "online").length / networkNodes.length) * 100}
                    max={100}
                    variant="success"
                    size="sm"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <TypographyMono>THREAT LEVEL:</TypographyMono>
                    <TypographyMono>
                      {networkNodes.filter((n) => n.threat_level === "high" || n.threat_level === "critical").length}{" "}
                      HIGH/CRITICAL
                    </TypographyMono>
                  </div>
                  <ProgressBar
                    value={
                      (networkNodes.filter((n) => n.threat_level === "high" || n.threat_level === "critical").length /
                        networkNodes.length) *
                      100
                    }
                    max={100}
                    variant="danger"
                    size="sm"
                  />
                </div>

                <div className="space-y-2 pt-4 border-t border-dark-300/20">
                  <TypographyMono className="text-xs">NETWORK SUMMARY:</TypographyMono>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-dark-600">Total Nodes:</span>
                      <span className="text-dark-700">{networkNodes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-600">Suspicious:</span>
                      <span className="text-yellow-400">
                        {networkNodes.filter((n) => n.status === "suspicious").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-600">Open Ports:</span>
                      <span className="text-dark-700">{networkNodes.reduce((acc, n) => acc + n.ports.length, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-600">Services:</span>
                      <span className="text-dark-700">
                        {networkNodes.reduce((acc, n) => acc + n.services.length, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TechPanelSection>
          </TechPanel>
        </div>
      )}

      {/* Security Events Tab */}
      {activeTab === "events" && (
        <TechPanel
          title="SECURITY EVENT LOG"
          cornerAccent
          borderAccent
          glowEffect={securityEvents.some((e) => e.severity === "critical")}
          icon={<AlertTriangle size={16} />}
        >
          <TechPanelSection>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {securityEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="w-16 h-16 text-dark-500 mx-auto mb-4" />
                    <TypographyMono className="text-sm text-dark-600">No security events</TypographyMono>
                    <TypographySmall className="text-dark-500">All systems secure</TypographySmall>
                  </div>
                ) : (
                  securityEvents.map((event) => {
                    const EventIcon = getEventTypeIcon(event.type)
                    return (
                      <div key={event.id} className="p-3 border border-dark-300/40 rounded-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <EventIcon className={cn("w-4 h-4", getEventSeverityColor(event.severity))} />
                            <div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" size="sm">
                                  {event.type.toUpperCase()}
                                </Badge>
                                <Badge
                                  variant={
                                    event.severity === "critical"
                                      ? "danger"
                                      : event.severity === "warning"
                                        ? "warning"
                                        : "info"
                                  }
                                  size="sm"
                                >
                                  {event.severity.toUpperCase()}
                                </Badge>
                                {event.blocked && (
                                  <Badge variant="success" size="sm">
                                    BLOCKED
                                  </Badge>
                                )}
                              </div>
                              <TypographySmall className="mt-1">{event.description}</TypographySmall>
                            </div>
                          </div>
                          <TypographyMono className="text-xs text-dark-600">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </TypographyMono>
                        </div>

                        <div className="flex items-center space-x-4 text-xs font-mono text-dark-600">
                          <span>Source: {event.source_ip}</span>
                          {event.target_ip && <span>Target: {event.target_ip}</span>}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </TechPanelSection>
        </TechPanel>
      )}

      {/* Scanner Tab */}
      {activeTab === "scanner" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TechPanel
            title="NETWORK SCANNER"
            cornerAccent
            borderAccent
            glowEffect={!!activeScan}
            icon={<Radar size={16} />}
          >
            <TechPanelSection>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={scanTarget}
                    onChange={(e) => setScanTarget(e.target.value)}
                    placeholder="Enter target IP or hostname..."
                    className="flex-1 bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm"
                  />
                  <select
                    value={selectedScanType}
                    onChange={(e) => setSelectedScanType(e.target.value as any)}
                    className="bg-dark-200 border border-dark-300 rounded px-3 py-2 text-sm font-mono text-dark-700"
                  >
                    <option value="port">Port Scan</option>
                    <option value="vulnerability">Vulnerability</option>
                    <option value="service">Service Detection</option>
                    <option value="os">OS Fingerprint</option>
                  </select>
                </div>

                <div className="flex space-x-2">
                  <TechButton
                    onClick={startScan}
                    cornerAccent
                    glow={!activeScan}
                    disabled={!scanTarget.trim() || !!activeScan}
                    icon={<Target size={14} />}
                    className="flex-1"
                  >
                    START SCAN
                  </TechButton>
                  <TechButton onClick={stopScan} cornerAccent disabled={!activeScan} icon={<XCircle size={14} />}>
                    STOP
                  </TechButton>
                </div>

                {activeScan && (
                  <div className="p-3 border border-blue-500/40 rounded-sm bg-blue-500/10">
                    <div className="flex items-center justify-between mb-2">
                      <TypographyMono className="text-sm">Scanning {activeScan.target}</TypographyMono>
                      <Badge variant="info">{activeScan.scan_type.toUpperCase()}</Badge>
                    </div>
                    <ProgressBar value={activeScan.progress} max={100} variant="info" size="sm" showValue />
                    <TypographyMono className="text-xs text-dark-600 mt-1">
                      Started: {new Date(activeScan.started).toLocaleTimeString()}
                    </TypographyMono>
                  </div>
                )}
              </div>
            </TechPanelSection>
          </TechPanel>

          <TechPanel title="SCAN HISTORY" cornerAccent borderAccent icon={<Database size={16} />}>
            <TechPanelSection>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {scanHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <Radar className="w-16 h-16 text-dark-500 mx-auto mb-4" />
                      <TypographyMono className="text-sm text-dark-600">No scan history</TypographyMono>
                      <TypographySmall className="text-dark-500">Start a scan to see results</TypographySmall>
                    </div>
                  ) : (
                    scanHistory.map((scan) => (
                      <div key={scan.id} className="p-3 border border-dark-300/40 rounded-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <TypographyMono className="text-sm">{scan.target}</TypographyMono>
                            <TypographySmall className="text-dark-600">
                              {scan.scan_type} scan • {new Date(scan.started).toLocaleString()}
                            </TypographySmall>
                          </div>
                          <Badge
                            variant={
                              scan.status === "completed" ? "success" : scan.status === "failed" ? "danger" : "warning"
                            }
                          >
                            {scan.status.toUpperCase()}
                          </Badge>
                        </div>

                        {scan.results.length > 0 && (
                          <div className="mt-2 p-2 bg-dark-200 rounded text-xs font-mono">
                            {scan.results.slice(0, 3).map((result, index) => (
                              <div key={index} className="text-dark-700">
                                {result}
                              </div>
                            ))}
                            {scan.results.length > 3 && (
                              <div className="text-dark-600">... and {scan.results.length - 3} more</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TechPanelSection>
          </TechPanel>
        </div>
      )}

      {/* Intelligence Tab */}
      {activeTab === "intel" && (
        <TechPanel title="THREAT INTELLIGENCE" cornerAccent borderAccent icon={<Database size={16} />}>
          <TechPanelSection>
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-dark-500 mx-auto mb-4" />
              <TypographyMono className="text-sm text-dark-600">Intelligence Database</TypographyMono>
              <TypographySmall className="text-dark-500">
                Connect external threat intelligence feeds and databases
              </TypographySmall>
              <TechButton className="mt-4" cornerAccent icon={<Network size={14} />}>
                CONFIGURE FEEDS
              </TechButton>
            </div>
          </TechPanelSection>
        </TechPanel>
      )}
    </div>
  )
}
