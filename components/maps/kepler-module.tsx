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

const GeoMap = dynamic(() => import("@/components/maps/GeoMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#05070d] font-mono text-xs uppercase tracking-[0.18em] text-cyan-300">
      INITIALIZING INTEL SURFACE…
    </div>
  ),
})

/** Kepler-style dataset ({ info, data: { fields, rows } }) -> GeoJSON points for GeoMap. */
function datasetToCollection(ds: any) {
  const fields: string[] = (ds?.data?.fields || []).map((f: any) => f.name)
  const idx = (...names: string[]) => names.map((n) => fields.indexOf(n)).find((i) => i >= 0) ?? -1
  const iLat = idx("latitude", "lat"), iLng = idx("longitude", "lng", "lon"), iName = idx("name"), iType = idx("type")
  const iConf = idx("confidence"), iThreat = idx("threat_level", "threatLevel", "severity")
  const features = (ds?.data?.rows || [])
    .map((row: any[]) => {
      if (row[iLat] == null || row[iLng] == null || row[iLat] === "" || row[iLng] === "") return null
      const lat = Number(row[iLat]), lng = Number(row[iLng])
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
      const conf = Number(row[iConf])
      return {
        type: "Feature" as const,
        properties: {
          name: String(row[iName] ?? "entity"),
          type: row[iType],
          category: "upload",
          severity: String(row[iThreat] ?? "medium"),
          weight: Number.isFinite(conf) ? conf : 0.5,
        },
        geometry: { type: "Point", coordinates: [lng, lat] },
      }
    })
    .filter(Boolean)
  return { type: "FeatureCollection" as const, features }
}


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
  const [mapBackend, setMapBackend] = useState<"geo" | "tactical" | "osm">("geo")
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

    const timer = setTimeout(() => setIsLoaded(true), 150)

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
        return "rgb(52, 245, 197)"
      default:
        return "rgb(156, 163, 175)"
    }
  }

  const filteredDatasets = activeDatasets.filter((dataset) =>
    dataset.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className={`h-full overflow-hidden rounded-sm border border-cyan-500/25 bg-[#05070d] text-cyan-50 ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="border-b border-cyan-500/25 bg-[#05070d]/95 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Satellite className="w-5 h-5 text-cyan-300" />
                <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              </div>
              <h3 className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Kepler++ Intel Surface
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
              <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/5 font-mono text-cyan-300">
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
                {hasMapbox ? "MAPBOX + DECK.GL" : "MAPLIBRE (CARTO/OSM) + DECK.GL"}
              </Badge>
              <div className="flex overflow-hidden rounded-sm border border-cyan-500/40 bg-black/60 shadow-[0_0_12px_rgba(0,229,255,0.08)]">
                <button
                  type="button"
                  onClick={() => setMapBackend("geo")}
                  className={`px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${mapBackend === "geo" ? "bg-cyan-500/20 text-cyan-100 shadow-[inset_0_0_10px_rgba(0,229,255,0.35)]" : "text-slate-400 hover:text-cyan-200"}`}
                >
                  GEO
                </button>
                <button
                  type="button"
                  onClick={() => setMapBackend("tactical")}
                  className={`px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${mapBackend === "tactical" ? "bg-cyan-500/20 text-cyan-100 shadow-[inset_0_0_10px_rgba(0,229,255,0.35)]" : "text-slate-400 hover:text-cyan-200"}`}
                >
                  TACTICAL
                </button>
                <button
                  type="button"
                  onClick={() => setMapBackend("osm")}
                  className={`px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${mapBackend === "osm" ? "bg-cyan-500/20 text-cyan-100 shadow-[inset_0_0_10px_rgba(0,229,255,0.35)]" : "text-slate-400 hover:text-cyan-200"}`}
                >
                  OSM
                </button>
              </div>
            </div>
          </div>

          <TabsList className="grid w-full grid-cols-3 border border-cyan-500/25 bg-black/50 backdrop-blur-sm">
            <TabsTrigger
              value="map"
              className="font-mono text-xs uppercase tracking-wider text-slate-400 data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-200"
            >
              MAP VIEW
            </TabsTrigger>
            <TabsTrigger
              value="layers"
              className="font-mono text-xs uppercase tracking-wider text-slate-400 data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-200"
            >
              LAYERS
            </TabsTrigger>
            <TabsTrigger
              value="data"
              className="font-mono text-xs uppercase tracking-wider text-slate-400 data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-200"
            >
              INTEL DATA
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="map" className="p-0 m-0 h-full">
            <div ref={mapContainerRef} className="relative bg-black h-full">
              {!isLoaded ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#05070d]">
                  <div className="text-center">
                    <div className="relative mb-6">
                      <Radar className="mx-auto h-16 w-16 animate-spin text-cyan-300" />
                      <div className="absolute inset-0 animate-ping rounded-full border-2 border-cyan-400/30" />
                    </div>
                    <p className="mb-2 font-mono text-sm uppercase tracking-[0.18em] text-cyan-200">Initializing Kepler++ surface…</p>
                    <p className="font-mono text-xs text-slate-500">Loading basemap and data packs</p>
                    <div className="mx-auto mt-4 h-1 w-64 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full animate-pulse rounded-full bg-cyan-400" style={{ width: "75%" }} />
                    </div>
                  </div>
                </div>
              ) : mapBackend === "geo" ? (
                <div className="absolute inset-0 overflow-hidden rounded-sm bg-[#05070d]">
                  <GeoMap
                    height="100%"
                    defaultPacks={["usgs-earthquakes", "feodo-c2-by-country"]}
                    collections={activeDatasets
                      .filter((d) => d.visible)
                      .map((d) => ({ id: d.id, label: d.name, data: datasetToCollection(d.data) as any }))}
                    onSelect={(f) => onNodeSelect?.(f.properties)}
                  />
                </div>
              ) : mapBackend === "osm" ? (
                <div className="absolute inset-0 overflow-hidden rounded-sm bg-[#05070d]">
                  <iframe
                    title="OpenStreetMap Kepler focus"
                    className="w-full h-full border-0"
                    src={osmEmbedSrc}
                  />
                  <div className="absolute left-3 top-3 max-w-xs rounded-sm border border-cyan-500/30 bg-[#05070d]/85 px-3 py-2 font-mono text-[10px] text-cyan-300 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-3 h-3" />
                      OSM EMBED (no Mapbox token)
                    </div>
                    <div className="text-gray-400">
                      Focus: {mapFocus.lat.toFixed(4)}, {mapFocus.lng.toFixed(4)}
                    </div>
                    <div className="text-amber-400/80 mt-1">
                      Use GEO for the full map with data packs
                    </div>
                  </div>
                  {selectedEntity && (
                    <div className="absolute right-3 top-3 max-w-xs rounded-sm border border-cyan-500/30 bg-[#05070d]/85 p-3 font-mono text-xs backdrop-blur-md">
                      <div className="mb-1 font-bold text-cyan-200">{selectedEntity.name}</div>
                      <div className="text-gray-400">{selectedEntity.type} · {selectedEntity.threatLevel}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 overflow-hidden rounded-sm bg-gradient-to-br from-[#071018] via-[#05070d] to-[#0a1020]">
                  {/* Cyber Grid Background */}
                  <div className="absolute inset-0 opacity-10">
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundImage: `
                          linear-gradient(rgba(0, 229, 255, 0.12) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0, 229, 255, 0.12) 1px, transparent 1px)
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
                              <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-sm border border-cyan-500/30 bg-[#05070d]/90 px-3 py-2 font-mono text-xs opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                                <div className="font-bold text-cyan-200">{name}</div>
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
                    <TechButton size="sm" variant="outline" className="border-cyan-500/30 bg-[#05070d]/80">
                      <Zap className="w-3 h-3" />
                    </TechButton>
                    <TechButton size="sm" variant="outline" className="border-cyan-500/30 bg-[#05070d]/80">
                      <Settings className="w-3 h-3" />
                    </TechButton>
                    <TechButton size="sm" variant="outline" className="border-cyan-500/30 bg-[#05070d]/80">
                      <Target className="w-3 h-3" />
                    </TechButton>
                  </div>

                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 max-w-xs rounded-sm border border-cyan-500/30 bg-[#05070d]/85 p-4 backdrop-blur-md">
                    <h4 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-cyan-200">Active layers</h4>
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
                    <div className="mt-4 border-t border-cyan-500/20 pt-3">
                      <h5 className="mb-2 font-mono text-xs uppercase tracking-wider text-slate-400">Threat levels</h5>
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
                          <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34f5c5]" />
                          <span className="text-emerald-300">LOW</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selected Entity Info */}
                  {selectedEntity && (
                    <div className="absolute left-4 top-4 max-w-sm rounded-sm border border-cyan-500/30 bg-[#05070d]/90 p-4 backdrop-blur-md">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="font-mono text-sm font-bold uppercase tracking-wider text-cyan-200">Entity selected</h4>
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
                            <div className="uppercase text-cyan-300">{selectedEntity.type}</div>
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
                    className="border-cyan-500/25 bg-black/50 pl-10 font-mono text-sm text-cyan-50 backdrop-blur-sm"
                  />
                </div>
              </div>
            </div>

            <ScrollArea className="h-[calc(100%-100px)]">
              <div className="space-y-3">
                {filteredDatasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    className="rounded-sm border border-cyan-500/25 bg-[#05070d]/80 p-4 backdrop-blur-md"
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
                  <h4 className="font-mono text-lg font-semibold uppercase tracking-wider text-cyan-200">Intelligence data overview</h4>
                  <TechButton size="sm" variant="outline" className="bg-black/20">
                    <Download className="w-3 h-3 mr-2" />
                    Export
                  </TechButton>
                </div>

                {activeDatasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    className="rounded-sm border border-cyan-500/25 bg-[#05070d]/80 p-4 backdrop-blur-md"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Layers className="h-4 w-4 text-cyan-300" />
                      <h5 className="font-mono text-base text-cyan-200">{dataset.name}</h5>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono mb-4">
                      <div>
                        <span className="text-gray-400">ENTITIES:</span>
                        <div className="font-bold text-cyan-100">{dataset.data.data?.rows?.length || 0}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">FIELDS:</span>
                        <div className="font-bold text-cyan-100">{dataset.data.data?.fields?.length || 0}</div>
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
                        <div className="overflow-x-auto rounded-sm border border-cyan-500/20 bg-black/60 p-3 font-mono text-xs">
                          <ScrollArea className="max-h-32">
                            <div className="mb-2 grid grid-cols-5 gap-4 font-bold text-cyan-300">
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
