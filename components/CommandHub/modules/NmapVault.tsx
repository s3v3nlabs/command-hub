"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import {
  Upload,
  Search,
  Download,
  Tag,
  Trash2,
  Eye,
  AlertTriangle,
  Shield,
  Target,
  Clock,
  Users,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Window } from "@/components/ui/window"
import { TechPanel } from "@/components/ui/tech-panel"
import { parseNmapXML, parseNmapText, type NmapScan } from "@/lib/nmap/parser"
import { CVELinker, type CVEDetails, type ServiceVulnerability } from "@/lib/cve/cve-linker"
import { HeimdallBridge, type HeimdallAnalysisRequest } from "@/lib/heimdal/bridge"

interface StoredScan {
  id: string
  name: string
  timestamp: string
  scan_data: NmapScan
  vulnerabilities: ServiceVulnerability[]
  risk_score: number
  tags: string[]
  heimdall_analysis?: {
    threat_probability: number
    attack_vectors: string[]
    confidence_score: number
    recommended_actions: string[]
    time_to_threat: number
  }
}

interface CVEModalData {
  cve: CVEDetails
  service: string
  port: number
}

export default function NmapVault() {
  const [storedScans, setStoredScans] = useState<StoredScan[]>([])
  const [selectedScan, setSelectedScan] = useState<StoredScan | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRisk, setFilterRisk] = useState<"all" | "low" | "medium" | "high" | "critical">("all")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showCVEModal, setShowCVEModal] = useState(false)
  const [cveModalData, setCVEModalData] = useState<CVEModalData | null>(null)
  const [newTag, setNewTag] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cveLinker = new CVELinker()
  const heimdallBridge = new HeimdallBridge()

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    for (const file of files) {
      try {
        const content = await file.text()
        let scanData: NmapScan

        // Progress simulation
        setUploadProgress(20)

        // Parse based on file extension or content
        if (file.name.endsWith(".xml") || content.includes("<?xml")) {
          scanData = parseNmapXML(content)
        } else {
          scanData = parseNmapText(content)
        }

        setUploadProgress(40)

        // Analyze vulnerabilities
        const vulnerabilities: ServiceVulnerability[] = []
        scanData.hosts.forEach((host) => {
          host.ports.forEach((port) => {
            if (port.service) {
              const vuln = cveLinker.analyzeService(port.service, port.version, port.port)
              if (vuln.cves.length > 0) {
                vulnerabilities.push(vuln)
              }
            }
          })
        })

        setUploadProgress(60)

        // Calculate risk score
        const riskScore = cveLinker.calculateRiskScore(vulnerabilities)

        setUploadProgress(80)

        // Get Heimdall analysis
        let heimdallAnalysis
        try {
          const analysisRequest: HeimdallAnalysisRequest = {
            drift_data: {
              port_anomalies: vulnerabilities.length / Math.max(scanData.hosts.length, 1),
              service_variation_score: new Set(vulnerabilities.map((v) => v.service)).size / 10,
              vulnerability_density:
                vulnerabilities.filter((v) => v.exploitable).length / Math.max(vulnerabilities.length, 1),
              risk_score: riskScore,
            },
            historical_patterns: [],
            current_threat_landscape: { global_threat_level: 0.6 },
            target_profile: { host_count: scanData.hosts.length, service_count: vulnerabilities.length },
          }

          const prediction = await heimdallBridge.predictThreatEvolution(analysisRequest)
          heimdallAnalysis = {
            threat_probability: prediction.threat_probability,
            attack_vectors: prediction.attack_vector,
            confidence_score: prediction.confidence_score,
            recommended_actions: prediction.recommended_actions,
            time_to_threat: prediction.time_to_threat,
          }
        } catch (error) {
          console.error("Heimdall analysis failed:", error)
        }

        setUploadProgress(100)

        // Store the scan
        const newScan: StoredScan = {
          id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name.replace(/\.(xml|nmap|txt)$/, ""),
          timestamp: new Date().toISOString(),
          scan_data: scanData,
          vulnerabilities,
          risk_score: riskScore,
          tags: [],
          heimdall_analysis: heimdallAnalysis,
        }

        setStoredScans((prev) => [newScan, ...prev])

        // Auto-select the new scan
        setSelectedScan(newScan)
      } catch (error) {
        console.error("Failed to process file:", file.name, error)
      }
    }

    setIsUploading(false)
    setUploadProgress(0)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const filteredScans = storedScans.filter((scan) => {
    const matchesSearch =
      scan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesRisk =
      filterRisk === "all" ||
      (filterRisk === "low" && scan.risk_score < 3) ||
      (filterRisk === "medium" && scan.risk_score >= 3 && scan.risk_score < 6) ||
      (filterRisk === "high" && scan.risk_score >= 6 && scan.risk_score < 8) ||
      (filterRisk === "critical" && scan.risk_score >= 8)

    return matchesSearch && matchesRisk
  })

  const handleCVEClick = (cveId: string, service: string, port: number) => {
    const cve = cveLinker.getCVEDetails(cveId)
    if (cve) {
      setCVEModalData({ cve, service, port })
      setShowCVEModal(true)
    }
  }

  const addTag = (scanId: string) => {
    if (!newTag.trim()) return

    setStoredScans((prev) =>
      prev.map((scan) => (scan.id === scanId ? { ...scan, tags: [...scan.tags, newTag.trim()] } : scan)),
    )
    setNewTag("")
  }

  const removeTag = (scanId: string, tagToRemove: string) => {
    setStoredScans((prev) =>
      prev.map((scan) =>
        scan.id === scanId ? { ...scan, tags: scan.tags.filter((tag) => tag !== tagToRemove) } : scan,
      ),
    )
  }

  const deleteScan = (scanId: string) => {
    setStoredScans((prev) => prev.filter((scan) => scan.id !== scanId))
    if (selectedScan?.id === scanId) {
      setSelectedScan(null)
    }
  }

  const exportScan = (scan: StoredScan) => {
    const exportData = {
      scan_metadata: {
        name: scan.name,
        timestamp: scan.timestamp,
        risk_score: scan.risk_score,
        tags: scan.tags,
      },
      nmap_data: scan.scan_data,
      vulnerabilities: scan.vulnerabilities,
      cve_details: scan.vulnerabilities.flatMap((v) => v.cves).map((cveId) => cveLinker.getCVEDetails(cveId)),
      heimdall_analysis: scan.heimdall_analysis,
      threat_intelligence: cveLinker.generateThreatIntelligence(scan.vulnerabilities.flatMap((v) => v.cves)),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${scan.name}_analysis.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getRiskColor = (score: number) => {
    if (score >= 8) return "text-red-400"
    if (score >= 6) return "text-orange-400"
    if (score >= 3) return "text-yellow-400"
    return "text-green-400"
  }

  const getRiskBadgeColor = (score: number) => {
    if (score >= 8) return "bg-red-500/20 text-red-400 border-red-500/30"
    if (score >= 6) return "bg-orange-500/20 text-orange-400 border-orange-500/30"
    if (score >= 3) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    return "bg-green-500/20 text-green-400 border-green-500/30"
  }

  return (
    <Window title="Σ-NMAP-VAULT" subtitle="CVE-Aware Network Scan Storage + Intel Panel">
      <div className="flex h-full">
        {/* Left Sidebar - Saved Scans */}
        <div className="w-80 border-r border-cyan-500/20 flex flex-col">
          <div className="p-4 border-b border-cyan-500/20">
            <div className="flex gap-2 mb-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border-cyan-500/30"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Scan
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".xml,.nmap,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {isUploading && (
              <div className="mb-4">
                <div className="text-sm text-cyan-400 mb-2">Processing scan...</div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search scans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black/50 border-cyan-500/30"
              />
            </div>

            <div className="flex gap-1">
              {(["all", "low", "medium", "high", "critical"] as const).map((risk) => (
                <Button
                  key={risk}
                  variant={filterRisk === risk ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilterRisk(risk)}
                  className={`text-xs ${filterRisk === risk ? "bg-cyan-500/20 text-cyan-400" : "text-gray-400"}`}
                >
                  {risk}
                </Button>
              ))}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredScans.map((scan) => (
                <Card
                  key={scan.id}
                  className={`mb-2 cursor-pointer transition-all ${
                    selectedScan?.id === scan.id
                      ? "bg-cyan-500/10 border-cyan-500/50"
                      : "bg-black/30 border-gray-700 hover:border-cyan-500/30"
                  }`}
                  onClick={() => setSelectedScan(scan)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm truncate">{scan.name}</div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            exportScan(scan)
                          }}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-cyan-400"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteScan(scan.id)
                          }}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`text-xs ${getRiskBadgeColor(scan.risk_score)}`}>
                        Risk: {scan.risk_score.toFixed(1)}
                      </Badge>
                      <div className="text-xs text-gray-400">{scan.scan_data.hosts.length} hosts</div>
                    </div>

                    <div className="text-xs text-gray-400 mb-2">{new Date(scan.timestamp).toLocaleDateString()}</div>

                    {scan.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {scan.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center Panel - Scan Details */}
        <div className="flex-1 flex flex-col">
          {selectedScan ? (
            <>
              <div className="p-4 border-b border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-cyan-400">{selectedScan.name}</h2>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getRiskBadgeColor(selectedScan.risk_score)}`}>
                      Risk Score: {selectedScan.risk_score.toFixed(1)}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {selectedScan.scan_data.hosts.length} hosts
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    {selectedScan.vulnerabilities.length} vulnerabilities
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(selectedScan.timestamp).toLocaleString()}
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addTag(selectedScan.id)}
                      className="h-8 text-sm bg-black/50 border-cyan-500/30"
                    />
                    <Button
                      size="sm"
                      onClick={() => addTag(selectedScan.id)}
                      className="h-8 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedScan.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-red-500/20"
                        onClick={() => removeTag(selectedScan.id, tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                {/* Hosts and Ports */}
                <div className="space-y-4">
                  {selectedScan.scan_data.hosts.map((host, hostIndex) => (
                    <Card key={hostIndex} className="bg-black/30 border-gray-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-cyan-400">
                          {host.ip}
                          {host.hostname && <span className="text-sm text-gray-400 ml-2">({host.hostname})</span>}
                        </CardTitle>
                        {host.os && <CardDescription className="text-gray-400">OS: {host.os}</CardDescription>}
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2">
                          {host.ports.map((port, portIndex) => {
                            const vulnerability = selectedScan.vulnerabilities.find(
                              (v) => v.port === port.port && v.service === port.service,
                            )

                            return (
                              <div
                                key={portIndex}
                                className={`p-3 rounded border ${
                                  vulnerability ? "bg-red-500/10 border-red-500/30" : "bg-gray-800/50 border-gray-600"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-xs">
                                      {port.port}/{port.protocol}
                                    </Badge>
                                    <div className="text-sm">
                                      <span className="text-cyan-400">{port.service}</span>
                                      {port.version && <span className="text-gray-400 ml-2">v{port.version}</span>}
                                    </div>
                                    <Badge
                                      variant={port.state === "open" ? "default" : "secondary"}
                                      className="text-xs"
                                    >
                                      {port.state}
                                    </Badge>
                                  </div>

                                  {vulnerability && (
                                    <div className="flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4 text-red-400" />
                                      <span className={`text-sm font-medium ${getRiskColor(vulnerability.risk_score)}`}>
                                        Risk: {vulnerability.risk_score.toFixed(1)}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {vulnerability && vulnerability.cves.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {vulnerability.cves.map((cveId) => (
                                      <Button
                                        key={cveId}
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCVEClick(cveId, port.service || "", port.port)}
                                        className="h-6 text-xs bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                                      >
                                        {cveId}
                                      </Button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a scan to view details</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Heimdall Analysis */}
        {selectedScan && (
          <div className="w-80 border-l border-cyan-500/20 p-4">
            <TechPanel title="HEIMDALL ANALYSIS" className="mb-4">
              {selectedScan.heimdall_analysis ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Threat Probability</div>
                    <div className="flex items-center gap-2">
                      <Progress value={selectedScan.heimdall_analysis.threat_probability} className="flex-1 h-2" />
                      <span
                        className={`text-sm font-medium ${getRiskColor(selectedScan.heimdall_analysis.threat_probability / 10)}`}
                      >
                        {selectedScan.heimdall_analysis.threat_probability.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-1">Confidence Score</div>
                    <div className="flex items-center gap-2">
                      <Progress value={selectedScan.heimdall_analysis.confidence_score} className="flex-1 h-2" />
                      <span className="text-sm text-cyan-400">
                        {selectedScan.heimdall_analysis.confidence_score.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-2">Time to Threat</div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <span className="text-orange-400">
                        {selectedScan.heimdall_analysis.time_to_threat.toFixed(1)} hours
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-2">Attack Vectors</div>
                    <div className="space-y-1">
                      {selectedScan.heimdall_analysis.attack_vectors.map((vector, index) => (
                        <Badge key={index} variant="outline" className="text-xs block w-fit">
                          {vector}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-2">Recommended Actions</div>
                    <div className="space-y-1 text-xs">
                      {selectedScan.heimdall_analysis.recommended_actions.map((action, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Zap className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Heimdall analysis unavailable</p>
                </div>
              )}
            </TechPanel>

            <TechPanel title="SCAN SUMMARY">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Hosts:</span>
                  <span className="text-cyan-400">{selectedScan.scan_data.hosts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Open Ports:</span>
                  <span className="text-cyan-400">
                    {selectedScan.scan_data.hosts.reduce(
                      (sum, host) => sum + host.ports.filter((p) => p.state === "open").length,
                      0,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Vulnerabilities:</span>
                  <span className={getRiskColor(selectedScan.risk_score)}>{selectedScan.vulnerabilities.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Exploitable:</span>
                  <span className="text-red-400">
                    {selectedScan.vulnerabilities.filter((v) => v.exploitable).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">CVEs Found:</span>
                  <span className="text-orange-400">
                    {selectedScan.vulnerabilities.reduce((sum, v) => sum + v.cves.length, 0)}
                  </span>
                </div>
              </div>
            </TechPanel>
          </div>
        )}
      </div>

      {/* CVE Details Modal */}
      {showCVEModal && cveModalData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] bg-black border-cyan-500/30">
            <CardHeader className="border-b border-cyan-500/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-cyan-400">{cveModalData.cve.id}</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setShowCVEModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </Button>
              </div>
              <CardDescription>
                {cveModalData.service} on port {cveModalData.port}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ScrollArea className="max-h-96">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2">Description</h3>
                    <p className="text-gray-300">{cveModalData.cve.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-cyan-400 mb-2">Severity</h4>
                      <Badge className={getRiskBadgeColor(cveModalData.cve.score)}>
                        {cveModalData.cve.severity} ({cveModalData.cve.score})
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-400 mb-2">Exploit Available</h4>
                      <Badge variant={cveModalData.cve.exploit_available ? "destructive" : "secondary"}>
                        {cveModalData.cve.exploit_available ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-cyan-400 mb-2">CVSS Vector</h4>
                    <code className="text-sm bg-gray-800 p-2 rounded block">{cveModalData.cve.vector}</code>
                  </div>

                  <div>
                    <h4 className="font-semibold text-cyan-400 mb-2">Affected Products</h4>
                    <div className="flex flex-wrap gap-1">
                      {cveModalData.cve.affected_products.map((product) => (
                        <Badge key={product} variant="outline" className="text-xs">
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {cveModalData.cve.threat_actors.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-cyan-400 mb-2">Known Threat Actors</h4>
                      <div className="flex flex-wrap gap-1">
                        {cveModalData.cve.threat_actors.map((actor) => (
                          <Badge key={actor} className="bg-red-500/20 text-red-400 border-red-500/30">
                            {actor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-cyan-400 mb-2">References</h4>
                    <div className="space-y-2">
                      {cveModalData.cve.references.map((ref, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {ref.source}
                          </Badge>
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 text-sm truncate"
                          >
                            {ref.url}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </Window>
  )
}
