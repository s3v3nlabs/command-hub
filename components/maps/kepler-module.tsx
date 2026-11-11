"use client"
import { useEffect, useRef, useState } from "react"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, Settings, Eye, EyeOff, Layers, Search, Zap, Target, Satellite, Radar, Activity, MapPin, AlertTriangle } from "lucide-react"

import dynamic from "next/dynamic"

const KeplerGlReal = dynamic(() => import("@/components/maps/kepler-gl-real"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black text-cyan-400 font-mono text-xs">
      LOADING KEPLER.GL…
    </div>
  ),
})


interface KeplerModuleProps {
  datasets?: any[]
  height?: string
  className?: string
  onNodeSelect?: (node: any) => void
}

interface Dataset {
  id: string
  name: string
  data: any
  visible: boolean
  color: [number, number, number]
  threatLevel?: string
}

export default function KeplerModule({
  datasets = [],
  height = "500px",
  className = "",
  onNodeSelect,
}: KeplerModuleProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeDatasets, setActiveDatasets] = useState<Dataset[]>([])
  const [activeTab, setActiveTab] = useState("map")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEntity, setSelectedEntity] = useState<any>(null)
  const [mapBackend, setMapBackend] = useState<"tactical" | "osm" | "kepler">("tactical")
  const mapboxToken =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() || "" : ""
  const hasMapbox = Boolean(mapboxToken && mapboxToken.startsWith("pk."))
  const [mapFocus, setMapFocus] = useState<{ lat: number; lng: number }>({ lat: 39.7392, lng: -104.9903 })

  // Initialize with provided datasets
  useEffect(() => {
    if (datasets.length > 0) {
      const formattedDatasets: Dataset[] = datasets.map((dataset, index) => ({
        id: dataset.info?.id || `dataset-${index}`,
        name: dataset.info?.label || `Dataset ${index + 1}`,
        data: dataset,
        visible: true,
        color: dataset.info?.color || [0, 255, 128],
        threatLevel: "medium",
      }))

      setActiveDatasets(formattedDatasets)
    }

    // Prefer real Kepler when Mapbox token is present; otherwise keep stub backends.
    const timer = setTimeout(() => {
      setIsLoaded(true)
      if (hasMapbox) setMapBackend("kepler")
    }, hasMapbox ? 200 : 800)

    return () => clearTimeout(timer)
  }, [datasets, hasMapbox])

  const toggleDatasetVisibility = (datasetId: string) => {
    setActiveDatasets((prev) =>
      prev.map((dataset) => (dataset.id === datasetId ? { ...dataset, visible: !dataset.visible } : dataset)),
    )
  }

  const handleEntityClick = (entity: any) => {
    setSelectedEntity(entity)
    if (typeof entity?.lat === "number" && typeof entity?.lng === "number") {
      setMapFocus({ lat: entity.lat, lng: entity.lng })
      setMapBackend("osm")
    }
    if (onNodeSelect) {
      onNodeSelect(entity)
    }
  }

  const osmEmbedSrc = (() => {
    const { lat, lng } = mapFocus
    const pad = 0.35
    const bbox = `${lng - pad}%2C${lat - pad}%2C${lng + pad}%2C${lat + pad}`
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
  })()

  const getThreatColor = (level: string) => {
    switch (level) {
      case "critical":
        return "rgb(239, 68, 68)"
      case "high":
        return "rgb(249, 115, 22)"
      case "medium":
        return "rgb(234, 179, 8)"
      case "low":
        return "rgb(34, 197, 94)"
      default:
        return "rgb(156, 163, 175)"
    }
  }

  const filteredDatasets = activeDatasets.filter((dataset) =>
    dataset.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className={`text-white rounded-lg overflow-hidden h-full ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="border-b border-white/10 px-4 py-3 bg-black/10 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Satellite className="w-5 h-5 text-dark-700" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" />
              </div>
              <h3 className="text-lg font-semibold text-dark-700 font-mono uppercase tracking-wider">
                Kepler Intelligence Engine
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs font-mono ${
                  isLoaded
                    ? "border-green-500/30 text-green-400 bg-green-500/5"
                    : "border-yellow-500/30 text-yellow-400 bg-yellow-500/5"
                }`}
              >
                <Activity className="w-3 h-3 mr-1" />
                {isLoaded ? "ONLINE" : "LOADING..."}
              </Badge>
              <Badge variant="outline" className="border-dark-500/30 text-dark-700 font-mono bg-dark-500/5">
                <Target className="w-3 h-3 mr-1" />
                {activeDatasets.length} LAYERS
              </Badge>
              <Badge
                variant="outline"
                className={`font-mono text-[10px] ${
                  hasMapbox
                    ? "border-cyan-500/40 text-cyan-300 bg-cyan-500/5"
                    : "border-amber-500/40 text-amber-300 bg-amber-500/5"
                }`}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                {hasMapbox ? "MAPBOX · KEPLER.GL LIVE" : "NO MAPBOX · kepler.gl STUB"}
              </Badge>
              <div className="flex rounded border border-white/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMapBackend("tactical")}
                  className={`px-2 py-1 text-[10px] font-mono ${mapBackend === "tactical" ? "bg-cyan-500/20 text-cyan-300" : "text-gray-400"}`}
                >
                  TACTICAL
                </button>
                <button
                  type="button"
                  onClick={() => setMapBackend("osm")}
                  className={`px-2 py-1 text-[10px] font-mono ${mapBackend === "osm" ? "bg-emerald-500/20 text-emerald-300" : "text-gray-400"}`}
                >
                  OSM
                </button>
                {hasMapbox && (
                  <button
                    type="button"
                    onClick={() => setMapBackend("kepler")}
                    className={`px-2 py-1 text-[10px] font-mono ${mapBackend === "kepler" ? "bg-violet-500/20 text-violet-300" : "text-gray-400"}`}
                  >
                    KEPLER
                  </button>
                )}
              </div>
            </div>
          </div>

          <TabsList className="grid w-full grid-cols-3 bg-black/20 border border-white/10 backdrop-blur-sm">
            <TabsTrigger
              value="map"
              className="font-mono text-xs data-[state=active]:bg-dark-500/20 data-[state=active]:text-dark-700"
            >
              MAP VIEW
            </TabsTrigger>
            <TabsTrigger
              value="layers"
              className="font-mono text-xs data-[state=active]:bg-dark-500/20 data-[state=active]:text-dark-700"
            >
              LAYERS
            </TabsTrigger>
            <TabsTrigger
              value="data"
              className="font-mono text-xs data-[state=active]:bg-dark-500/20 data-[state=active]:text-dark-700"
            >
              INTEL DATA
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="map" className="p-0 m-0 h-full">
            <div ref={mapContainerRef} className="relative bg-black h-full">
              {!isLoaded ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="text-center">
                    <div className="relative mb-6">
                      <Radar className="w-16 h-16 mx-auto text-dark-700 animate-spin" />
                      <div className="absolute inset-0 border-2 border-dark-400/30 rounded-full animate-ping" />
                    </div>
                    <p className="text-dark-700 font-mono text-sm mb-2">INITIALIZING KEPLER.GL...</p>
                    <p className="text-gray-500 font-mono text-xs">Establishing satellite uplink...</p>
                    <div className="mt-4 w-64 h-1 bg-gray-800 rounded-full mx-auto overflow-hidden">
                      <div className="h-full bg-dark-700 rounded-full animate-pulse" style={{ width: "75%" }} />
                    </div>
                  </div>
                </div>
              ) : mapBackend === "kepler" && hasMapbox ? (
                <div className="absolute inset-0 bg-black rounded-lg overflow-hidden">
                  <KeplerGlReal
                    datasets={activeDatasets.filter((d) => d.visible).map((d) => d.data)}
                    mapboxToken={mapboxToken}
                    onNodeSelect={onNodeSelect}
                    className="h-full w-full"
                  />
                </div>
              ) : mapBackend === "osm" ? (
                <div className="absolute inset-0 bg-black rounded-lg overflow-hidden">
                  <iframe
                    title="OpenStreetMap Kepler focus"
                    className="w-full h-full border-0"
                    src={osmEmbedSrc}
                  />
                  <div className="absolute top-3 left-3 glass-panel bg-black/70 border border-emerald-500/30 rounded px-3 py-2 text-[10px] font-mono text-emerald-300 backdrop-blur-md max-w-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-3 h-3" />
                      OSM EMBED (no Mapbox token)
                    </div>
                    <div className="text-gray-400">
                      Focus: {mapFocus.lat.toFixed(4)}, {mapFocus.lng.toFixed(4)}
                    </div>
                    <div className="text-amber-400/80 mt-1">
                      Full kepler.gl requires NEXT_PUBLIC_MAPBOX_TOKEN + kepler.gl deps
                    </div>
                  </div>
                  {selectedEntity && (
                    <div className="absolute top-3 right-3 glass-panel bg-black/70 border-dark-500/30 rounded-lg p-3 backdrop-blur-md max-w-xs text-xs font-mono">
                      <div className="text-dark-700 font-bold mb-1">{selectedEntity.name}</div>
                      <div className="text-gray-400">{selectedEntity.type} · {selectedEntity.threatLevel}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-lg overflow-hidden">
                  {/* Cyber Grid Background */}
                  <div className="absolute inset-0 opacity-10">
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundImage: `
                          linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: "50px 50px",
                      }}
                    />
                  </div>

                  {/* Intelligence Data Points */}
                  {activeDatasets
                    .filter((d) => d.visible)
                    .map((dataset, idx) => (
                      <div key={dataset.id} className="absolute inset-0">
                        {dataset.data.data?.rows?.map((row: any[], rowIdx: number) => {
                          const [name, type, lat, lng, confidence, threatLevel] = row
                          if (!lat || !lng) return null

                          // Convert lat/lng to screen coordinates (simplified)
                          const x = ((lng + 180) / 360) * 100
                          const y = ((90 - lat) / 180) * 100

                          return (
                            <div
                              key={`${dataset.id}-${rowIdx}`}
                              className="absolute group cursor-pointer"
                              style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                transform: "translate(-50%, -50%)",
                              }}
                              onClick={() => handleEntityClick({ name, type, lat, lng, confidence, threatLevel })}
                            >
                              {/* Entity Marker */}
                              <div
                                className="w-4 h-4 rounded-full border-2 border-white/50 shadow-lg"
                                style={{
                                  backgroundColor: getThreatColor(threatLevel || "medium"),
                                  boxShadow: `0 0 20px ${getThreatColor(threatLevel || "medium")}`,
                                }}
                              />

                              {/* Hover Tooltip */}
                              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 glass-panel border border-dark-500/30 rounded px-3 py-2 text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/80 backdrop-blur-md">
                                <div className="text-dark-700 font-bold">{name}</div>
                                <div className="text-gray-400">
                                  {type} • {(confidence * 100).toFixed(1)}%
                                </div>
                                <div
                                  className={`text-xs ${threatLevel === "critical" ? "text-red-400" : threatLevel === "high" ? "text-orange-400" : threatLevel === "medium" ? "text-yellow-400" : "text-green-400"}`}
                                >
                                  THREAT: {(threatLevel || "medium").toUpperCase()}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))}

                  {/* Map Controls */}
                  <div className="absolute top-4 right-4 space-y-2">
                    <TechButton size="sm" variant="outline" className="glass-panel bg-black/50 border-dark-500/30">
                      <Zap className="w-3 h-3" />
                    </TechButton>
                    <TechButton size="sm" variant="outline" className="glass-panel bg-black/50 border-dark-500/30">
                      <Settings className="w-3 h-3" />
                    </TechButton>
                    <TechButton size="sm" variant="outline" className="glass-panel bg-black/50 border-dark-500/30">
                      <Target className="w-3 h-3" />
                    </TechButton>
                  </div>

                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 max-w-xs glass-panel bg-black/60 border-dark-500/30 rounded-lg p-4 backdrop-blur-md">
                    <h4 className="text-sm font-semibold mb-3 text-dark-700 font-mono">ACTIVE LAYERS</h4>
                    <ScrollArea className="max-h-32">
                      <div className="space-y-2">
                        {activeDatasets
                          .filter((d) => d.visible)
                          .map((dataset) => (
                            <div key={dataset.id} className="flex items-center gap-3 text-xs">
                              <div
                                className="w-3 h-3 rounded-full border border-white/30"
                                style={{ backgroundColor: `rgb(${dataset.color.join(",")})` }}
                              />
                              <span className="font-mono text-white">{dataset.name}</span>
                              <Badge
                                variant="outline"
                                className="text-xs border-gray-500/30 text-gray-400 bg-gray-500/10"
                              >
                                {dataset.data.data?.rows?.length || 0}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>

                    {/* Threat Level Legend */}
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <h5 className="text-xs font-mono text-gray-400 mb-2">THREAT LEVELS</h5>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-red-400">CRITICAL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-orange-400">HIGH</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          <span className="text-yellow-400">MEDIUM</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-green-400">LOW</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selected Entity Info */}
                  {selectedEntity && (
                    <div className="absolute top-4 left-4 max-w-sm glass-panel bg-black/70 border-dark-500/30 rounded-lg p-4 backdrop-blur-md">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-dark-700 font-mono">ENTITY SELECTED</h4>
                        <TechButton size="sm" variant="ghost" onClick={() => setSelectedEntity(null)}>
                          ×
                        </TechButton>
                      </div>
                      <ScrollArea className="max-h-48">
                        <div className="space-y-2 text-xs font-mono">
                          <div>
                            <span className="text-gray-400">NAME:</span>
                            <div className="text-white font-bold">{selectedEntity.name}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">TYPE:</span>
                            <div className="text-dark-700 uppercase">{selectedEntity.type}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">COORDINATES:</span>
                            <div className="text-white">
                              {selectedEntity.lat?.toFixed(4)}, {selectedEntity.lng?.toFixed(4)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-400">CONFIDENCE:</span>
                            <div className="text-green-400">{(selectedEntity.confidence * 100).toFixed(1)}%</div>
                          </div>
                          <div>
                            <span className="text-gray-400">THREAT LEVEL:</span>
                            <div
                              className={`uppercase ${
                                selectedEntity.threatLevel === "critical"
                                  ? "text-red-400"
                                  : selectedEntity.threatLevel === "high"
                                    ? "text-orange-400"
                                    : selectedEntity.threatLevel === "medium"
                                      ? "text-yellow-400"
                                      : "text-green-400"
                              }`}
                            >
                              {selectedEntity.threatLevel || "MEDIUM"}
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="layers" className="p-4 space-y-4 h-full overflow-hidden">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <Label htmlFor="search" className="text-xs font-mono text-gray-400 uppercase">
                  Search Layers
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search intelligence datasets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-black/30 border-white/20 font-mono text-sm backdrop-blur-sm"
                  />
                </div>
              </div>
            </div>

            <ScrollArea className="h-[calc(100%-100px)]">
              <div className="space-y-3">
                {filteredDatasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    className="glass-panel p-4 rounded-lg border border-white/10 backdrop-blur-md bg-black/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full border border-white/30"
                          style={{ backgroundColor: `rgb(${dataset.color.join(",")})` }}
                        />
                        <div>
                          <h4 className="font-medium text-white font-mono">{dataset.name}</h4>
                          <p className="text-sm text-gray-400 font-mono">
                            {dataset.data.data?.rows?.length || 0} entities • {dataset.threatLevel?.toUpperCase()}{" "}
                            threat
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TechButton
                          size="sm"
                          variant="outline"
                          onClick={() => toggleDatasetVisibility(dataset.id)}
                          className="bg-black/20"
                        >
                          {dataset.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </TechButton>
                        <TechButton size="sm" variant="outline" className="bg-black/20">
                          <Settings className="w-3 h-3" />
                        </TechButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="data" className="p-4 h-full overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold font-mono text-dark-700">INTELLIGENCE DATA OVERVIEW</h4>
                  <TechButton size="sm" variant="outline" className="bg-black/20">
                    <Download className="w-3 h-3 mr-2" />
                    Export
                  </TechButton>
                </div>

                {activeDatasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    className="glass-panel p-4 rounded-lg border border-white/10 backdrop-blur-md bg-black/20"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Layers className="w-4 h-4 text-dark-700" />
                      <h5 className="text-base font-mono text-dark-700">{dataset.name}</h5>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono mb-4">
                      <div>
                        <span className="text-gray-400">ENTITIES:</span>
                        <div className="text-dark-700 font-bold">{dataset.data.data?.rows?.length || 0}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">FIELDS:</span>
                        <div className="text-dark-700 font-bold">{dataset.data.data?.fields?.length || 0}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">STATUS:</span>
                        <div className="text-green-400 font-bold">{dataset.visible ? "ACTIVE" : "HIDDEN"}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">THREAT:</span>
                        <div
                          className={`font-bold uppercase ${
                            dataset.threatLevel === "critical"
                              ? "text-red-400"
                              : dataset.threatLevel === "high"
                                ? "text-orange-400"
                                : dataset.threatLevel === "medium"
                                  ? "text-yellow-400"
                                  : "text-green-400"
                          }`}
                        >
                          {dataset.threatLevel || "MEDIUM"}
                        </div>
                      </div>
                    </div>

                    {dataset.data.data?.rows && (
                      <div>
                        <h6 className="text-sm font-medium mb-2 font-mono text-gray-400">SAMPLE INTELLIGENCE DATA:</h6>
                        <div className="glass-panel bg-black/50 rounded p-3 text-xs font-mono overflow-x-auto border border-white/10">
                          <ScrollArea className="max-h-32">
                            <div className="grid grid-cols-5 gap-4 mb-2 text-dark-700 font-bold">
                              {dataset.data.data.fields?.slice(0, 5).map((field: any) => (
                                <div key={field.name} className="uppercase">
                                  {field.name}
                                </div>
                              ))}
                            </div>
                            {dataset.data.data.rows.slice(0, 3).map((row: any[], idx: number) => (
                              <div key={idx} className="grid grid-cols-5 gap-4 mb-1 text-gray-300">
                                {row.slice(0, 5).map((cell, cellIdx) => (
                                  <div key={cellIdx} className="truncate">
                                    {typeof cell === "number" ? cell.toFixed(2) : cell}
                                  </div>
                                ))}
                              </div>
                            ))}
                            {dataset.data.data.rows.length > 3 && (
                              <div className="text-gray-500 mt-2">
                                ... and {dataset.data.data.rows.length - 3} more classified entries
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
