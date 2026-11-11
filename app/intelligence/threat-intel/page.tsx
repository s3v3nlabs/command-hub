"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import ThreatIntelHub from "@/components/CommandHub/modules/ThreatIntelHub"
import { TechPanel, TechPanelSection } from "@/components/ui/tech-panel"
import { Badge } from "@/components/ui/badge"
import { TypographyMono, TypographySmall } from "@/components/ui/typography"
import { Shield, Activity, AlertTriangle, CheckCircle, XCircle, Zap, Database, Eye, Server } from "lucide-react"

export default function ThreatIntelPage() {
  const [apiStatus] = useState({
    virustotal: process.env.NEXT_PUBLIC_VIRUSTOTAL_API_KEY ? "configured" : "missing",
    abuseipdb: process.env.NEXT_PUBLIC_ABUSEIPDB_API_KEY ? "configured" : "missing",
    greynoise: process.env.NEXT_PUBLIC_GREYNOISE_API_KEY ? "configured" : "missing",
    otx: process.env.NEXT_PUBLIC_OTX_API_KEY ? "configured" : "missing",
    censys: process.env.NEXT_PUBLIC_CENSYS_API_ID ? "configured" : "missing",
    threatcrowd: "available", // No API key needed
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "configured":
        return <CheckCircle size={14} className="text-green-400" />
      case "available":
        return <CheckCircle size={14} className="text-blue-400" />
      case "missing":
        return <XCircle size={14} className="text-red-400" />
      default:
        return <AlertTriangle size={14} className="text-yellow-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "configured":
        return "CONFIGURED"
      case "available":
        return "AVAILABLE"
      case "missing":
        return "API KEY MISSING"
      default:
        return "UNKNOWN"
    }
  }

  const sources = [
    {
      name: "VirusTotal",
      key: "virustotal",
      description: "Malware detection and URL/IP analysis",
      icon: Shield,
      freeLimit: "500/day",
      capabilities: ["File analysis", "URL scanning", "IP reputation", "Domain analysis"],
    },
    {
      name: "AbuseIPDB",
      key: "abuseipdb",
      description: "IP abuse reporting and reputation scoring",
      icon: AlertTriangle,
      freeLimit: "1000/day",
      capabilities: ["IP reputation", "Abuse reports", "Geolocation", "ISP information"],
    },
    {
      name: "GreyNoise",
      key: "greynoise",
      description: "Internet noise classification and scanner detection",
      icon: Activity,
      freeLimit: "50/day",
      capabilities: ["Scanner detection", "Noise classification", "RIOT data", "CVE tracking"],
    },
    {
      name: "AlienVault OTX",
      key: "otx",
      description: "Open threat exchange with pulse data",
      icon: Eye,
      freeLimit: "Unlimited",
      capabilities: ["Threat pulses", "IOC data", "Malware analysis", "Passive DNS"],
    },
    {
      name: "Censys",
      key: "censys",
      description: "Internet-wide scanning and certificate analysis",
      icon: Server,
      freeLimit: "250/month",
      capabilities: ["Port scanning", "Certificate analysis", "Service detection", "ASN data"],
    },
    {
      name: "ThreatCrowd",
      key: "threatcrowd",
      description: "Crowdsourced threat intelligence",
      icon: Database,
      freeLimit: "Unlimited",
      capabilities: ["Domain analysis", "IP analysis", "Malware hashes", "References"],
    },
  ]

  const configuredSources = sources.filter(
    (source) =>
      apiStatus[source.key as keyof typeof apiStatus] === "configured" ||
      apiStatus[source.key as keyof typeof apiStatus] === "available",
  ).length

  return (
    <div className="hub-shell flex bg-dark-base">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="THREAT INTELLIGENCE HUB" />
        <main className="hub-shell-scroll p-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Analysis Panel */}
            <div className="xl:col-span-2">
              <ThreatIntelHub />
            </div>

            {/* Status and Configuration Panel */}
            <div className="space-y-6">
              {/* System Status */}
              <TechPanel title="SYSTEM STATUS" cornerAccent borderAccent icon={<Activity size={16} />}>
                <TechPanelSection>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <TypographyMono className="text-sm">ACTIVE SOURCES:</TypographyMono>
                      <Badge
                        variant={configuredSources >= 4 ? "success" : configuredSources >= 2 ? "warning" : "danger"}
                      >
                        {configuredSources}/6
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <TypographyMono className="text-sm">SYSTEM STATUS:</TypographyMono>
                      <Badge variant="success">OPERATIONAL</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <TypographyMono className="text-sm">MOCK DATA:</TypographyMono>
                      <Badge variant="outline">ENABLED</Badge>
                    </div>

                    <div className="pt-3 border-t border-dark-300/20">
                      <TypographySmall className="text-dark-600">
                        System works with mock data when API keys are not configured. Add API keys to get real threat
                        intelligence data.
                      </TypographySmall>
                    </div>
                  </div>
                </TechPanelSection>
              </TechPanel>

              {/* API Sources Status */}
              <TechPanel title="INTELLIGENCE SOURCES" cornerAccent borderAccent icon={<Database size={16} />}>
                <TechPanelSection>
                  <div className="space-y-3">
                    {sources.map((source) => {
                      const status = apiStatus[source.key as keyof typeof apiStatus]
                      const SourceIcon = source.icon

                      return (
                        <div key={source.key} className="border border-dark-300/20 rounded p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <SourceIcon size={16} />
                              <div>
                                <TypographyMono className="text-sm font-bold">{source.name}</TypographyMono>
                                <TypographySmall className="text-dark-600">{source.freeLimit}</TypographySmall>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(status)}
                              <Badge variant="outline" className="text-xs">
                                {getStatusText(status)}
                              </Badge>
                            </div>
                          </div>

                          <TypographySmall className="mb-2">{source.description}</TypographySmall>

                          <div className="flex flex-wrap gap-1">
                            {source.capabilities.slice(0, 3).map((capability) => (
                              <Badge key={capability} variant="outline" className="text-xs">
                                {capability}
                              </Badge>
                            ))}
                            {source.capabilities.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{source.capabilities.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </TechPanelSection>
              </TechPanel>

              {/* Quick Setup Guide */}
              <TechPanel title="QUICK SETUP" cornerAccent borderAccent icon={<Zap size={16} />}>
                <TechPanelSection>
                  <div className="space-y-3">
                    <TypographyMono className="text-sm mb-2">RECOMMENDED SETUP ORDER:</TypographyMono>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                          1
                        </Badge>
                        <span>AlienVault OTX (Free, Unlimited)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                          2
                        </Badge>
                        <span>VirusTotal (Free, 500/day)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                          3
                        </Badge>
                        <span>AbuseIPDB (Free, 1000/day)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                          4
                        </Badge>
                        <span>GreyNoise (Free, 50/day)</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-dark-300/20">
                      <TypographySmall className="text-dark-600">
                        Start with OTX + VirusTotal for 90% of functionality. ThreatCrowd works immediately (no API key
                        needed).
                      </TypographySmall>
                    </div>
                  </div>
                </TechPanelSection>
              </TechPanel>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
