"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Upload,
  Map,
  Database,
  Zap,
  FileText,
  Brain,
  Activity,
  Globe,
  Search,
  Settings,
  Download,
  RefreshCw,
  MapPin,
  Building,
  User,
  Target,
  Satellite,
  Radar,
  Shield,
  AlertTriangle,
} from "lucide-react"

import KeplerModule from "@/components/maps/kepler-module"
import KeplerNodeConsole from "@/components/consoles/kepler-node-console"
import { heimdallParser } from "@/lib/heimdal/data-parser"
import { keplerStore } from "@/lib/storage/kepler-store"
import { parseUpload } from "@/lib/data-packs/parse-upload"

interface Dataset {
  id: string
  name: string
  data: any
  metadata: {
    source: string
    entityCount: number
    tags: string[]
    createdAt: string
    updatedAt: string
  }
}

interface Entity {
  id: string
  name: string
  type: "person" | "organization" | "location" | "patent" | "technology" | "unknown"
  latitude?: number
  longitude?: number
  confidence: number
  metadata: Record<string, any>
  source: string
}

export default function KeplerIntelligencePage() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeView, setActiveView] = useState<"map" | "grid" | "list">("map")
  const [threatLevel, setThreatLevel] = useState<"low" | "medium" | "high" | "critical">("medium")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize with sample intelligence data
  useEffect(() => {
    loadSampleIntelligenceData()
  }, [])

  const loadSampleIntelligenceData = useCallback(async () => {
    setIsProcessing(true)
    setProcessingStatus("Initializing Heimdal Intelligence Network...")

    const sampleData = {
      id: "heimdal_intelligence",
      name: "Heimdal Intelligence Network",
      data: {
        info: {
          id: "heimdal_intelligence",
          label: "Heimdal Intelligence Network",
          color: [0, 255, 128] as [number, number, number],
        },
        data: {
          fields: [
            { name: "name", type: "string" },
            { name: "type", type: "string" },
            { name: "latitude", type: "real" },
            { name: "longitude", type: "real" },
            { name: "confidence", type: "real" },
            { name: "threat_level", type: "string" },
            { name: "metadata", type: "string" },
            { name: "source", type: "string" },
          ],
          rows: [
            [
              "Sandia National Laboratories",
              "organization",
              35.0844,
              -106.5348,
              0.95,
              "high",
              '{"classification":"defense_contractor","clearance":"top_secret"}',
              "heimdal_scan",
            ],
            [
              "Los Alamos National Laboratory",
              "organization",
              35.8869,
              -106.2978,
              0.93,
              "critical",
              '{"classification":"nuclear_facility","projects":["manhattan","stockpile"]}',
              "heimdal_scan",
            ],
            [
              "CBMM Brazil Mining Complex",
              "organization",
              -19.5936,
              -46.9408,
              0.88,
              "medium",
              '{"resource":"niobium","global_supply":"85%","strategic_importance":"critical"}',
              "operation_tumbleweed",
            ],
            [
              "DARPA Advanced Research",
              "organization",
              38.9072,
              -77.0369,
              0.97,
              "critical",
              '{"classification":"black_projects","budget":"classified","focus":"emerging_tech"}',
              "heimdal_scan",
            ],
            [
              "MIT Lincoln Laboratory",
              "organization",
              42.3601,
              -71.0589,
              0.91,
              "high",
              '{"classification":"defense_research","specialization":"radar_systems"}',
              "heimdal_scan",
            ],
            [
              "Quantum Computing Research Node",
              "technology",
              37.4419,
              -122.143,
              0.84,
              "high",
              '{"type":"quantum_supremacy","applications":["cryptography","simulation"]}',
              "tech_intelligence",
            ],
            [
              "Advanced Materials Division",
              "technology",
              35.0844,
              -106.5348,
              0.89,
              "medium",
              '{"focus":"metamaterials","applications":["stealth","energy"]}',
              "heimdal_scan",
            ],
            [
              "Niobium Superconductor Network",
              "technology",
              -19.5936,
              -46.9408,
              0.86,
              "high",
              '{"applications":["quantum_computing","energy_storage","transportation"]}',
              "operation_tumbleweed",
            ],
          ],
        },
      },
      metadata: {
        source: "heimdal_intelligence_network",
        entityCount: 8,
        tags: ["intelligence", "defense", "research", "strategic"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }

    setDatasets([sampleData])

    // Convert to entities
    const sampleEntities: Entity[] = sampleData.data.data.rows.map((row, index) => ({
      id: `entity_${index}`,
      name: String(row[0]),
      type: String(row[1]) as Entity["type"],
      latitude: Number(row[2]),
      longitude: Number(row[3]),
      confidence: Number(row[4]),
      metadata: {
        threat_level: row[5],
        ...JSON.parse(String(row[6])),
      },
      source: String(row[7]),
    }))

    setEntities(sampleEntities)
    setProcessingStatus("✓ Heimdal Intelligence Network Online")

    setTimeout(() => {
      setIsProcessing(false)
      setProcessingStatus("")
    }, 2000)
  }, [])

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsProcessing(true)
    setProcessingStatus("Parsing intelligence files...")

    try {
      for (const file of Array.from(files)) {
        setProcessingStatus(`Processing ${file.name}...`)

        // Structured geo data first (GeoJSON / JSON array / CSV with lat+lng); free text falls back to entity extraction.
        let parsedData: Awaited<ReturnType<typeof heimdallParser.parseFile>>
        try {
          const fc = parseUpload(file.name, await file.text())
          const pts = fc.features.filter((f) => f.geometry?.type === "Point")
          if (!pts.length) throw new Error("no point features")
          parsedData = {
            entities: pts.map((f, i) => ({
              id: `geo_${Date.now()}_${i}`,
              name: String(f.properties.name ?? `point ${i + 1}`),
              type: "location" as const,
              latitude: (f.geometry!.coordinates as number[])[1],
              longitude: (f.geometry!.coordinates as number[])[0],
              confidence: Number(f.properties.weight ?? 0.5),
              metadata: { ...f.properties, threat_level: f.properties.severity },
              source: file.name,
            })),
            relationships: [],
            metadata: { filename: file.name, parseDate: new Date().toISOString(), entityCount: pts.length },
          } as any
        } catch {
          parsedData = await heimdallParser.parseFile(file)
        }
        setProcessingStatus("Converting to Kepler intelligence format...")

        const datasetId = `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const keplerDataset = heimdallParser.toKeplerDataset(parsedData, datasetId)

        setProcessingStatus("Storing in Heimdal vault...")

        await keplerStore.storeDataset({
          id: datasetId,
          name: file.name,
          data: keplerDataset,
          metadata: {
            source: file.name,
            entityCount: parsedData.entities.length,
            tags: ["uploaded", "parsed", ...Array.from(new Set(parsedData.entities.map((e) => e.type)))],
          },
        })

        setDatasets((prev) => [
          ...prev,
          {
            id: datasetId,
            name: file.name,
            data: keplerDataset,
            metadata: {
              source: file.name,
              entityCount: parsedData.entities.length,
              tags: ["uploaded", "parsed"],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        ])

        const newEntities: Entity[] = parsedData.entities.map((entity) => ({
          id: entity.id,
          name: entity.name,
          type: entity.type,
          latitude: entity.latitude,
          longitude: entity.longitude,
          confidence: entity.confidence,
          metadata: entity.metadata,
          source: entity.source,
        }))

        setEntities((prev) => [...prev, ...newEntities])
        setProcessingStatus(`✓ Processed ${file.name} - ${parsedData.entities.length} entities`)
      }
    } catch (error) {
      console.error("File processing error:", error)
      setProcessingStatus(`✗ Error processing files: ${error}`)
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProcessingStatus(""), 3000)
    }
  }, [])

  const handleNodeSelect = useCallback((node: any) => {
    setSelectedNodes((prev) => (prev.includes(node.id) ? prev.filter((id) => id !== node.id) : [...prev, node.id]))
  }, [])

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return "text-red-400 border-red-500/30"
      case "high":
        return "text-orange-400 border-orange-500/30"
      case "medium":
        return "text-yellow-400 border-yellow-500/30"
      case "low":
        return "text-green-400 border-green-500/30"
      default:
        return "text-gray-400 border-gray-500/30"
    }
  }

  const getThreatColor = (level: string) => {
    switch (level) {
      case "critical":
        return "text-red-400 border-red-500/30"
      case "high":
        return "text-orange-400 border-orange-500/30"
      case "medium":
        return "text-yellow-400 border-yellow-500/30"
      case "low":
        return "text-green-400 border-green-500/30"
      default:
        return "text-gray-400 border-gray-500/30"
    }
  }

  const filteredEntities = entities.filter(
    (entity) =>
      entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.type.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* SignalFrame-style background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-black to-gray-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.03)_0%,transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "100px 100px",
          }}
        />
      </div>

      <div className="relative z-10 p-6 max-w-[100vw] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="glass-panel p-6 rounded-lg border border-white/10 backdrop-blur-md bg-black/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Globe className="w-8 h-8 text-cyan-400" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-cyan-400 font-mono uppercase tracking-wider">
                    Kepler Intelligence Engine
                  </h1>
                  <p className="text-gray-400 text-sm font-mono mt-1">
                    Geospatial consciousness mapping with Heimdal pattern recognition
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-green-500/30 text-green-400 font-mono bg-green-500/5">
                  <Activity className="w-3 h-3 mr-1" />
                  ONLINE
                </Badge>
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 font-mono bg-cyan-500/5">
                  <Database className="w-3 h-3 mr-1" />
                  {datasets.length} DATASETS
                </Badge>
                <Badge variant="outline" className="border-orange-500/30 text-orange-400 font-mono bg-orange-500/5">
                  <Target className="w-3 h-3 mr-1" />
                  {entities.length} ENTITIES
                </Badge>
                <Badge
                  variant="outline"
                  className={`${getThreatLevelColor(threatLevel)} bg-${threatLevel === "critical" ? "red" : threatLevel === "high" ? "orange" : threatLevel === "medium" ? "yellow" : "green"}-500/5`}
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  THREAT: {threatLevel.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="mb-6">
          <div className="glass-panel p-6 rounded-lg border border-white/10 backdrop-blur-md bg-black/20">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-cyan-400 font-mono uppercase">Intelligence Operations Control</h2>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <TechButton onClick={() => fileInputRef.current?.click()} disabled={isProcessing} variant="default" glow>
                <Upload className="w-4 h-4 mr-2" />
                Upload Intel
              </TechButton>

              <TechButton
                onClick={loadSampleIntelligenceData}
                disabled={isProcessing}
                variant="outline"
                className="border-orange-500/30 text-orange-400 bg-orange-500/5"
              >
                <FileText className="w-4 h-4 mr-2" />
                Load Tumbleweed
              </TechButton>

              <TechButton variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/5">
                <Database className="w-4 h-4 mr-2" />
                Heimdal Archive
              </TechButton>

              <TechButton variant="outline" className="border-green-500/30 text-green-400 bg-green-500/5">
                <Radar className="w-4 h-4 mr-2" />
                Pattern Scan
              </TechButton>

              <TechButton variant="outline" className="border-red-500/30 text-red-400 bg-red-500/5">
                <Shield className="w-4 h-4 mr-2" />
                Threat Analysis
              </TechButton>
            </div>

            {/* Search and View Controls */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search intelligence entities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/30 border-white/20 text-white font-mono backdrop-blur-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <TechButton
                  size="sm"
                  variant={activeView === "map" ? "default" : "outline"}
                  onClick={() => setActiveView("map")}
                  className={activeView !== "map" ? "bg-black/20" : ""}
                >
                  <Map className="w-4 h-4" />
                </TechButton>
                <TechButton
                  size="sm"
                  variant={activeView === "grid" ? "default" : "outline"}
                  onClick={() => setActiveView("grid")}
                  className={activeView !== "grid" ? "bg-black/20" : ""}
                >
                  <Globe className="w-4 h-4" />
                </TechButton>
                <TechButton
                  size="sm"
                  variant={activeView === "list" ? "default" : "outline"}
                  onClick={() => setActiveView("list")}
                  className={activeView !== "list" ? "bg-black/20" : ""}
                >
                  <Database className="w-4 h-4" />
                </TechButton>
              </div>
            </div>

            {processingStatus && (
              <div className="mt-4 p-4 glass-panel rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <div className="flex items-center gap-3">
                  {isProcessing && (
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  <span className="text-sm font-mono text-cyan-400">{processingStatus}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Interface - Larger Map */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-[calc(100vh-400px)]">
          {/* Map/Visualization View - Much Larger */}
          <div className="xl:col-span-4">
            <div className="glass-panel h-full rounded-lg border border-white/10 backdrop-blur-md bg-black/20 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Satellite className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-bold text-cyan-400 font-mono uppercase">Geospatial Intelligence Map</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <TechButton size="sm" variant="outline" className="bg-black/20">
                      <RefreshCw className="w-3 h-3" />
                    </TechButton>
                    <TechButton size="sm" variant="outline" className="bg-black/20">
                      <Settings className="w-3 h-3" />
                    </TechButton>
                    <TechButton size="sm" variant="outline" className="bg-black/20">
                      <Download className="w-3 h-3" />
                    </TechButton>
                  </div>
                </div>
              </div>
              <div className="h-[calc(100%-80px)]">
                <KeplerModule
                  datasets={datasets.map((d) => d.data)}
                  height="100%"
                  onNodeSelect={handleNodeSelect}
                  className="h-full"
                />
              </div>
            </div>
          </div>

          {/* Node Console - Smaller */}
          <div className="xl:col-span-1">
            <div className="h-full">
              <KeplerNodeConsole
                nodes={filteredEntities}
                selectedNodes={selectedNodes}
                onNodeSelect={handleNodeSelect}
              />
            </div>
          </div>
        </div>

        {/* Entity Grid View */}
        {activeView === "grid" && (
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredEntities.map((entity) => (
                <div
                  key={entity.id}
                  className="glass-panel p-4 rounded-lg border border-white/10 backdrop-blur-md bg-black/20 hover:border-cyan-500/30 transition-all cursor-pointer"
                  onClick={() => handleNodeSelect(entity)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {entity.type === "organization" && <Building className="w-4 h-4 text-cyan-400" />}
                      {entity.type === "person" && <User className="w-4 h-4 text-green-400" />}
                      {entity.type === "location" && <MapPin className="w-4 h-4 text-red-400" />}
                      {entity.type === "technology" && <Zap className="w-4 h-4 text-yellow-400" />}
                      <span className="text-xs text-gray-400 uppercase font-mono">{entity.type}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${getThreatColor(entity.metadata.threat_level || "low")} text-xs`}
                    >
                      {entity.metadata.threat_level || "low"}
                    </Badge>
                  </div>

                  <h4 className="font-mono text-sm font-bold text-white mb-2 line-clamp-2">{entity.name}</h4>

                  <div className="text-xs text-gray-400 font-mono mb-2">
                    Confidence: {(entity.confidence * 100).toFixed(1)}%
                  </div>

                  {entity.latitude && entity.longitude && (
                    <div className="text-xs text-gray-500 font-mono">
                      {entity.latitude.toFixed(4)}, {entity.longitude.toFixed(4)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".json,.csv,.geojson,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  )
}
