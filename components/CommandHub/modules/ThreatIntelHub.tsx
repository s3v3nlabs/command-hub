"use client"

import { useState } from "react"
import { TechPanel, TechPanelSection } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ProgressBar } from "@/components/ui/progress-bar"
import { TypographyMono, TypographySmall } from "@/components/ui/typography"
import {
  Shield,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Server,
  Activity,
  Eye,
  Database,
  Network,
  Loader2,
} from "lucide-react"
import type { AggregatedThreatIntel } from "@/lib/threat-intel/aggregator"

interface ThreatIntelHubProps {
  className?: string
}

export default function ThreatIntelHub({ className }: ThreatIntelHubProps) {
  const [target, setTarget] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<AggregatedThreatIntel | null>(null)
  const [activeTab, setActiveTab] = useState<"analysis" | "sources" | "history">("analysis")
  const [analysisHistory, setAnalysisHistory] = useState<AggregatedThreatIntel[]>([])

  const handleAnalyze = async () => {
    if (!target.trim()) return

    setIsAnalyzing(true)
    try {
      const response = await fetch("/api/threat-intel/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target: target.trim() }),
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`)
      }

      const result = await response.json()
      setResults(result)
      setAnalysisHistory((prev) => [result, ...prev.slice(0, 9)]) // Keep last 10
      setActiveTab("analysis")
    } catch (error) {
      console.error("Analysis error:", error)
      // You could add error state handling here
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "LOW":
        return "text-green-400"
      case "MEDIUM":
        return "text-yellow-400"
      case "HIGH":
        return "text-orange-400"
      case "CRITICAL":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "virustotal":
        return Shield
      case "abuseipdb":
        return AlertTriangle
      case "greynoise":
        return Activity
      case "otx":
        return Eye
      case "censys":
        return Server
      case "threatcrowd":
        return Database
      default:
        return Network
    }
  }

  return (
    <div className={className}>
      <TechPanel title="THREAT INTELLIGENCE HUB" cornerAccent borderAccent glowEffect icon={<Shield size={16} />}>
        <TechPanelSection>
          {/* Search Interface */}
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter IP address or domain (e.g., 8.8.8.8 or google.com)"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAnalyze()}
                className="flex-1"
                disabled={isAnalyzing}
              />
              <TechButton
                onClick={handleAnalyze}
                disabled={isAnalyzing || !target.trim()}
                cornerAccent
                glow
                icon={isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              >
                {isAnalyzing ? "ANALYZING..." : "ANALYZE"}
              </TechButton>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 border-b border-dark-300/20">
              {[
                { id: "analysis", label: "ANALYSIS", icon: Shield },
                { id: "sources", label: "SOURCES", icon: Database },
                { id: "history", label: "HISTORY", icon: Clock },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm font-mono transition-colors ${
                    activeTab === tab.id
                      ? "text-dark-800 border-b-2 border-blue-400"
                      : "text-dark-600 hover:text-dark-700"
                  }`}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </TechPanelSection>

        {/* Analysis Results */}
        {results && activeTab === "analysis" && (
          <TechPanelSection>
            <div className="space-y-6">
              {/* Overall Assessment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <TypographyMono className="text-sm mb-2">OVERALL REPUTATION</TypographyMono>
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl font-bold text-dark-800">{results.overall_reputation}</div>
                    <div className="flex-1">
                      <ProgressBar
                        value={results.overall_reputation}
                        max={100}
                        variant={
                          results.overall_reputation >= 70
                            ? "success"
                            : results.overall_reputation >= 40
                              ? "warning"
                              : "danger"
                        }
                        size="lg"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <TypographyMono className="text-sm mb-2">RISK LEVEL</TypographyMono>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={`text-lg px-4 py-2 ${getRiskColor(results.risk_level)}`}>
                      {results.risk_level}
                    </Badge>
                    <TypographyMono className="text-sm text-dark-600">
                      {Math.round(results.confidence * 100)}% confidence
                    </TypographyMono>
                  </div>
                </div>
              </div>

              {/* Geolocation */}
              {results.geolocation && (
                <div>
                  <TypographyMono className="text-sm mb-2">GEOLOCATION & NETWORK</TypographyMono>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Globe size={14} />
                      <span>{results.geolocation.country}</span>
                      {results.geolocation.country_code && (
                        <Badge variant="outline">{results.geolocation.country_code}</Badge>
                      )}
                    </div>
                    {results.geolocation.organization && (
                      <div className="flex items-center space-x-2">
                        <Server size={14} />
                        <span className="truncate">{results.geolocation.organization}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Threat Indicators */}
              {results.summary.threat_indicators.length > 0 && (
                <div>
                  <TypographyMono className="text-sm mb-2">THREAT INDICATORS</TypographyMono>
                  <div className="space-y-1">
                    {results.summary.threat_indicators.map((indicator, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <AlertTriangle size={14} className="text-red-400" />
                        <span>{indicator}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div>
                <TypographyMono className="text-sm mb-2">RECOMMENDATIONS</TypographyMono>
                <div className="space-y-1">
                  {results.summary.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm">
                      <CheckCircle size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TechPanelSection>
        )}

        {/* Sources Tab */}
        {results && activeTab === "sources" && (
          <TechPanelSection>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <TypographyMono className="text-sm">
                  ACTIVE SOURCES: {results.summary.active_sources}/{results.summary.total_sources}
                </TypographyMono>
                <TypographyMono className="text-xs text-dark-600">
                  Analyzed: {new Date(results.analysis_timestamp).toLocaleString()}
                </TypographyMono>
              </div>

              <div className="grid gap-3">
                {results.sources.map((source, index) => {
                  const SourceIcon = getSourceIcon(source.source)
                  return (
                    <div key={index} className="border border-dark-300/20 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <SourceIcon size={16} />
                          <TypographyMono className="text-sm font-bold">{source.source.toUpperCase()}</TypographyMono>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{source.reputation}/100</Badge>
                          <TypographyMono className="text-xs text-dark-600">
                            {Math.round(source.confidence * 100)}% confidence
                          </TypographyMono>
                        </div>
                      </div>

                      {/* Source-specific details */}
                      <div className="text-xs text-dark-600 space-y-1">
                        {source.source === "virustotal" && "malicious" in source && (
                          <div>
                            Malicious: {source.malicious}, Suspicious: {source.suspicious}
                          </div>
                        )}
                        {source.source === "abuseipdb" && "abuse_confidence" in source && (
                          <div>
                            Abuse Confidence: {source.abuse_confidence}%, Reports: {source.total_reports}
                          </div>
                        )}
                        {source.source === "greynoise" && "classification" in source && (
                          <div>
                            Classification: {source.classification}, Noise: {source.is_noise ? "Yes" : "No"}
                          </div>
                        )}
                        {source.source === "otx" && "pulse_count" in source && (
                          <div>
                            Pulses: {source.pulse_count}, Malware: {source.malware_count}
                          </div>
                        )}
                        {source.source === "censys" && "open_ports" in source && (
                          <div>
                            Open Ports: {source.open_ports.length}, Certificates: {source.certificates}
                          </div>
                        )}
                        {source.source === "threatcrowd" && "votes" in source && (
                          <div>
                            Votes: {source.votes}, References: {source.references}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </TechPanelSection>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <TechPanelSection>
            <div className="space-y-3">
              <TypographyMono className="text-sm">ANALYSIS HISTORY</TypographyMono>
              {analysisHistory.length === 0 ? (
                <div className="text-center py-8 text-dark-600">
                  <Clock size={24} className="mx-auto mb-2" />
                  <TypographySmall>No analysis history yet</TypographySmall>
                </div>
              ) : (
                <div className="space-y-2">
                  {analysisHistory.map((analysis, index) => (
                    <div
                      key={index}
                      className="border border-dark-300/20 rounded p-3 cursor-pointer hover:bg-dark-100/10 transition-colors"
                      onClick={() => {
                        setResults(analysis)
                        setActiveTab("analysis")
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <TypographyMono className="text-sm font-bold">{analysis.target}</TypographyMono>
                          <Badge variant="outline" className={getRiskColor(analysis.risk_level)}>
                            {analysis.risk_level}
                          </Badge>
                          <span className="text-sm">{analysis.overall_reputation}/100</span>
                        </div>
                        <TypographyMono className="text-xs text-dark-600">
                          {new Date(analysis.analysis_timestamp).toLocaleTimeString()}
                        </TypographyMono>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TechPanelSection>
        )}
      </TechPanel>
    </div>
  )
}
