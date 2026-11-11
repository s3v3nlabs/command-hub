"use client"

import { useState, useEffect } from "react"
import { Window, WindowAction } from "@/components/ui/window"
import { TechPanel, TechPanelSection } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProgressBar } from "@/components/ui/progress-bar"
import { DataDisplay } from "@/components/ui/data-display"
import { TypographyMono, TypographySmall } from "@/components/ui/typography"
import { X, TrendingUp, AlertTriangle, Globe, Activity, Eye, Target, Scan, Database, Network } from "lucide-react"

interface DriftAlert {
  id: string
  timestamp: string
  type: "port_shift" | "ip_migration" | "service_variation" | "honeypot_detected"
  severity: "low" | "medium" | "high" | "critical"
  source: string
  description: string
  entropy: number
  baseline_deviation: number
}

interface DriftMetrics {
  global_entropy: number
  regional_anomalies: number
  port_drift_score: number
  service_variations: number
  honeypot_probability: number
  threat_level: number
}

interface RegionalData {
  region: string
  country_code: string
  drift_score: number
  anomaly_count: number
  threat_level: "low" | "medium" | "high"
  primary_ports: number[]
  suspicious_ips: number
}

export default function DriftDetectionPanel({ onClose }: { onClose: () => void }) {
  const [isScanning, setIsScanning] = useState(false)
  const [selectedTimeWindow, setSelectedTimeWindow] = useState("24h")
  const [driftThreshold, setDriftThreshold] = useState(75)
  const [alerts, setAlerts] = useState<DriftAlert[]>([])
  const [metrics, setMetrics] = useState<DriftMetrics>({
    global_entropy: 67,
    regional_anomalies: 12,
    port_drift_score: 34,
    service_variations: 8,
    honeypot_probability: 23,
    threat_level: 45,
  })

  const [regionalData, setRegionalData] = useState<RegionalData[]>([
    {
      region: "North America",
      country_code: "US",
      drift_score: 78,
      anomaly_count: 5,
      threat_level: "medium",
      primary_ports: [80, 443, 22, 3389],
      suspicious_ips: 23,
    },
    {
      region: "Europe",
      country_code: "DE",
      drift_score: 45,
      anomaly_count: 2,
      threat_level: "low",
      primary_ports: [80, 443, 25, 993],
      suspicious_ips: 8,
    },
    {
      region: "Asia Pacific",
      country_code: "CN",
      drift_score: 92,
      anomaly_count: 15,
      threat_level: "high",
      primary_ports: [80, 8080, 22, 23],
      suspicious_ips: 67,
    },
    {
      region: "Eastern Europe",
      country_code: "RU",
      drift_score: 89,
      anomaly_count: 12,
      threat_level: "high",
      primary_ports: [80, 443, 22, 1433],
      suspicious_ips: 45,
    },
  ])

  const timeWindows = [
    { id: "1h", name: "1 Hour" },
    { id: "6h", name: "6 Hours" },
    { id: "24h", name: "24 Hours" },
    { id: "7d", name: "7 Days" },
    { id: "30d", name: "30 Days" },
  ]

  // Simulate real-time drift detection
  useEffect(() => {
    const interval = setInterval(() => {
      // Update metrics with realistic drift patterns
      setMetrics((prev) => ({
        global_entropy: Math.max(0, Math.min(100, prev.global_entropy + (Math.random() - 0.5) * 8)),
        regional_anomalies: Math.max(0, prev.regional_anomalies + Math.floor((Math.random() - 0.7) * 3)),
        port_drift_score: Math.max(0, Math.min(100, prev.port_drift_score + (Math.random() - 0.5) * 12)),
        service_variations: Math.max(0, prev.service_variations + Math.floor((Math.random() - 0.8) * 2)),
        honeypot_probability: Math.max(0, Math.min(100, prev.honeypot_probability + (Math.random() - 0.5) * 15)),
        threat_level: Math.max(0, Math.min(100, prev.threat_level + (Math.random() - 0.5) * 10)),
      }))

      // Generate new alerts occasionally
      if (Math.random() < 0.1) {
        const alertTypes = ["port_shift", "ip_migration", "service_variation", "honeypot_detected"] as const
        const severities = ["low", "medium", "high", "critical"] as const
        const sources = ["Shodan", "Nmap", "Heimdal AI", "Internal Scan"]

        const newAlert: DriftAlert = {
          id: `alert_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          source: sources[Math.floor(Math.random() * sources.length)],
          description: generateAlertDescription(),
          entropy: Math.random() * 100,
          baseline_deviation: Math.random() * 50,
        }

        setAlerts((prev) => [newAlert, ...prev.slice(0, 19)]) // Keep last 20 alerts
      }

      // Update regional data
      setRegionalData((prev) =>
        prev.map((region) => ({
          ...region,
          drift_score: Math.max(0, Math.min(100, region.drift_score + (Math.random() - 0.5) * 10)),
          anomaly_count: Math.max(0, region.anomaly_count + Math.floor((Math.random() - 0.8) * 2)),
          suspicious_ips: Math.max(0, region.suspicious_ips + Math.floor((Math.random() - 0.9) * 3)),
        })),
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const generateAlertDescription = () => {
    const descriptions = [
      "Unusual port 8080 activity spike detected in Eastern Europe",
      "SSH service banner variation observed across 15 IP ranges",
      "Potential honeypot cluster identified via behavioral analysis",
      "Significant IP geolocation drift in financial sector targets",
      "Anomalous service response patterns suggest evasion techniques",
      "Port 3389 usage shift indicates possible infrastructure changes",
      "Database service fingerprints show unexpected version clustering",
      "Regional scanning pattern deviation exceeds baseline threshold",
    ]
    return descriptions[Math.floor(Math.random() * descriptions.length)]
  }

  const startDriftScan = () => {
    setIsScanning(true)
    setTimeout(() => setIsScanning(false), 5000)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "danger"
      case "high":
        return "warning"
      case "medium":
        return "info"
      default:
        return "outline"
    }
  }

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-accent-red-600"
      case "medium":
        return "text-accent-yellow-600"
      default:
        return "text-dark-600"
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "port_shift":
        return Network
      case "ip_migration":
        return Globe
      case "service_variation":
        return Database
      case "honeypot_detected":
        return Target
      default:
        return AlertTriangle
    }
  }

  return (
    <Window
      title="DRIFT DETECTION PANEL - Σ–SIGNATURE-DISSOLVE"
      icon={<TrendingUp size={16} />}
      variant="glass"
      size="full"
      className="fixed inset-0 z-50 m-4"
      actions={
        <WindowAction onClick={onClose}>
          <X size={12} />
        </WindowAction>
      }
    >
      <div className="h-full grid grid-cols-4 gap-4">
        {/* Left Panel - Configuration & Timeline */}
        <div className="col-span-1">
          <TechPanel title="DRIFT CONFIGURATION" cornerAccent borderAccent className="h-full">
            <TechPanelSection>
              <div className="space-y-4">
                <div>
                  <TypographyMono className="mb-2">TIME WINDOW</TypographyMono>
                  <div className="space-y-1">
                    {timeWindows.map((window) => (
                      <TechButton
                        key={window.id}
                        onClick={() => setSelectedTimeWindow(window.id)}
                        variant={selectedTimeWindow === window.id ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-start"
                      >
                        {window.name}
                      </TechButton>
                    ))}
                  </div>
                </div>

                <div>
                  <TypographyMono className="mb-2">DRIFT THRESHOLD: {driftThreshold}%</TypographyMono>
                  <ProgressBar value={driftThreshold} max={100} variant="info" size="sm" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={driftThreshold}
                    onChange={(e) => setDriftThreshold(Number(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>

                <TechButton
                  onClick={startDriftScan}
                  className="w-full"
                  cornerAccent
                  glow={isScanning}
                  disabled={isScanning}
                  icon={<Scan className="w-4 h-4" />}
                >
                  {isScanning ? "SCANNING..." : "START DRIFT SCAN"}
                </TechButton>
              </div>
            </TechPanelSection>

            <div className="border-t border-dark-300 my-2" />

            <TechPanelSection title="GLOBAL METRICS">
              <div className="space-y-3">
                <DataDisplay
                  label="Global Entropy"
                  value={metrics.global_entropy.toFixed(1)}
                  unit="%"
                  trend={metrics.global_entropy > 70 ? "up" : metrics.global_entropy < 40 ? "down" : "stable"}
                />
                <DataDisplay
                  label="Regional Anomalies"
                  value={metrics.regional_anomalies.toString()}
                  unit=""
                  trend={metrics.regional_anomalies > 10 ? "up" : "stable"}
                />
                <DataDisplay
                  label="Port Drift Score"
                  value={metrics.port_drift_score.toFixed(1)}
                  unit="%"
                  trend={metrics.port_drift_score > 60 ? "up" : "stable"}
                />
                <DataDisplay
                  label="Service Variations"
                  value={metrics.service_variations.toString()}
                  unit=""
                  trend={metrics.service_variations > 5 ? "up" : "stable"}
                />
                <DataDisplay
                  label="Honeypot Probability"
                  value={metrics.honeypot_probability.toFixed(1)}
                  unit="%"
                  trend={metrics.honeypot_probability > 50 ? "up" : "stable"}
                />
                <DataDisplay
                  label="Threat Level"
                  value={metrics.threat_level.toFixed(1)}
                  unit="%"
                  trend={metrics.threat_level > 70 ? "up" : metrics.threat_level < 30 ? "down" : "stable"}
                />
              </div>
            </TechPanelSection>
          </TechPanel>
        </div>

        {/* Center Panel - Interactive Heatmap & Entity Graph */}
        <div className="col-span-2">
          <TechPanel title="GLOBAL DRIFT HEATMAP" cornerAccent borderAccent className="h-full">
            <TechPanelSection>
              <div className="space-y-4">
                {/* Regional Data Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {regionalData.map((region) => (
                    <div key={region.region} className="p-3 bg-dark-100 border border-dark-300 rounded-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-dark-600" />
                          <TypographyMono className="text-sm">{region.region}</TypographyMono>
                        </div>
                        <Badge
                          variant={
                            region.threat_level === "high"
                              ? "danger"
                              : region.threat_level === "medium"
                                ? "warning"
                                : "success"
                          }
                        >
                          {region.threat_level.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <TypographyMono>DRIFT SCORE</TypographyMono>
                          <TypographyMono className={getThreatLevelColor(region.threat_level)}>
                            {region.drift_score.toFixed(0)}%
                          </TypographyMono>
                        </div>
                        <ProgressBar
                          value={region.drift_score}
                          max={100}
                          variant={region.threat_level === "high" ? "danger" : "info"}
                          size="sm"
                        />

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <TypographyMono className="text-dark-600">ANOMALIES</TypographyMono>
                            <TypographyMono>{region.anomaly_count}</TypographyMono>
                          </div>
                          <div>
                            <TypographyMono className="text-dark-600">SUSPICIOUS IPs</TypographyMono>
                            <TypographyMono>{region.suspicious_ips}</TypographyMono>
                          </div>
                        </div>

                        <div>
                          <TypographyMono className="text-xs text-dark-600 mb-1">PRIMARY PORTS</TypographyMono>
                          <div className="flex flex-wrap gap-1">
                            {region.primary_ports.map((port) => (
                              <Badge key={port} variant="outline" size="sm">
                                {port}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Entity Graph Placeholder */}
                <div className="h-48 bg-dark-100 border border-dark-300 rounded-sm flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="w-8 h-8 text-dark-600 mx-auto mb-2" />
                    <TypographyMono className="text-sm text-dark-600">ENTITY RELATIONSHIP GRAPH</TypographyMono>
                    <TypographySmall className="text-dark-500">
                      Real-time network topology visualization
                    </TypographySmall>
                  </div>
                </div>
              </div>
            </TechPanelSection>
          </TechPanel>
        </div>

        {/* Right Panel - Anomaly Logs & Signature Diff */}
        <div className="col-span-1">
          <TechPanel title="ANOMALY LOGS" cornerAccent borderAccent className="h-full">
            <TechPanelSection>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {alerts.length === 0 ? (
                    <div className="text-center py-8">
                      <Eye className="w-8 h-8 text-dark-600 mx-auto mb-2" />
                      <TypographyMono className="text-sm text-dark-600">NO ALERTS</TypographyMono>
                      <TypographySmall className="text-dark-500">System monitoring for drift patterns</TypographySmall>
                    </div>
                  ) : (
                    alerts.map((alert) => {
                      const AlertIcon = getAlertIcon(alert.type)
                      return (
                        <div key={alert.id} className="p-3 bg-dark-100 border border-dark-300 rounded-sm">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <AlertIcon className="w-4 h-4 text-dark-600" />
                              <Badge variant={getSeverityColor(alert.severity)} size="sm">
                                {alert.severity.toUpperCase()}
                              </Badge>
                            </div>
                            <TypographyMono className="text-xs text-dark-600">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </TypographyMono>
                          </div>

                          <TypographySmall className="mb-2">{alert.description}</TypographySmall>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <TypographyMono className="text-dark-600">SOURCE</TypographyMono>
                              <TypographyMono>{alert.source}</TypographyMono>
                            </div>
                            <div>
                              <TypographyMono className="text-dark-600">ENTROPY</TypographyMono>
                              <TypographyMono>{alert.entropy.toFixed(1)}%</TypographyMono>
                            </div>
                          </div>

                          <div className="mt-2">
                            <TypographyMono className="text-xs text-dark-600 mb-1">BASELINE DEVIATION</TypographyMono>
                            <ProgressBar
                              value={alert.baseline_deviation}
                              max={50}
                              variant={alert.baseline_deviation > 30 ? "danger" : "warning"}
                              size="sm"
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </TechPanelSection>

            <div className="border-t border-dark-300 my-2" />

            <TechPanelSection title="SIGNATURE DIFF VIEWER">
              <div className="space-y-2">
                <div className="p-2 bg-dark-100 border border-dark-300 rounded-sm">
                  <TypographyMono className="text-xs text-dark-600 mb-1">BASELINE SIGNATURE</TypographyMono>
                  <code className="text-xs text-dark-700 font-mono">
                    HTTP/1.1 200 OK
                    <br />
                    Server: nginx/1.18.0
                    <br />
                    Content-Type: text/html
                  </code>
                </div>

                <div className="p-2 bg-dark-100 border border-dark-300 rounded-sm">
                  <TypographyMono className="text-xs text-dark-600 mb-1">CURRENT SIGNATURE</TypographyMono>
                  <code className="text-xs text-dark-700 font-mono">
                    HTTP/1.1 200 OK
                    <br />
                    <span className="bg-accent-red-600 text-white px-1">Server: nginx/1.20.2</span>
                    <br />
                    Content-Type: text/html
                  </code>
                </div>

                <TechButton size="sm" className="w-full" cornerAccent>
                  ANALYZE SIGNATURE DRIFT
                </TechButton>
              </div>
            </TechPanelSection>
          </TechPanel>
        </div>
      </div>
    </Window>
  )
}
