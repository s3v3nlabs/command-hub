"use client"

import { useState, useEffect } from "react"
import { TechButton } from "@/components/ui/tech-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Database,
  Search,
  Eye,
  RefreshCw,
  MapPin,
  Building,
  User,
  FileText,
  Zap,
  Activity,
  Shield,
  AlertTriangle,
  Radar,
  Satellite,
} from "lucide-react"

interface Entity {
  id: string
  name: string
  type: "person" | "organization" | "location" | "patent" | "technology" | "unknown"
  latitude?: number
  longitude?: number
  confidence: number
  metadata: Record<string, any>
  source: string
  datasetId?: string
}

interface NodeStats {
  totalEntities: number
  entitiesByType: Record<string, number>
  averageConfidence: number
  datasetsCount: number
  threatDistribution: Record<string, number>
}

interface KeplerNodeConsoleProps {
  nodes: Entity[]
  selectedNodes: string[]
  onNodeSelect: (node: Entity) => void
}

export default function KeplerNodeConsole({ nodes = [], selectedNodes = [], onNodeSelect }: KeplerNodeConsoleProps) {
  const [filteredEntities, setFilteredEntities] = useState<Entity[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [stats, setStats] = useState<NodeStats>({
    totalEntities: 0,
    entitiesByType: {},
    averageConfidence: 0,
    datasetsCount: 0,
    threatDistribution: {},
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (nodes.length > 0) {
      setFilteredEntities(nodes)
      calculateStats(nodes)
    }
  }, [nodes])

  useEffect(() => {
    // Filter entities based on search and type
    let filtered = nodes

    if (searchQuery) {
      filtered = filtered.filter(
        (entity) =>
          entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entity.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entity.source.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((entity) => entity.type === selectedType)
    }

    setFilteredEntities(filtered)
  }, [nodes, searchQuery, selectedType])

  const calculateStats = (entities: Entity[]) => {
    const entitiesByType = entities.reduce(
      (acc, entity) => {
        acc[entity.type] = (acc[entity.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const threatDistribution = entities.reduce(
      (acc, entity) => {
        const threat = entity.metadata.threat_level || "low"
        acc[threat] = (acc[threat] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const averageConfidence =
      entities.length > 0 ? entities.reduce((sum, entity) => sum + entity.confidence, 0) / entities.length : 0

    setStats({
      totalEntities: entities.length,
      entitiesByType,
      averageConfidence,
      datasetsCount: new Set(entities.map((e) => e.datasetId || e.source)).size,
      threatDistribution,
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "organization":
        return <Building className="w-4 h-4" />
      case "person":
        return <User className="w-4 h-4" />
      case "location":
        return <MapPin className="w-4 h-4" />
      case "patent":
        return <FileText className="w-4 h-4" />
      case "technology":
        return <Zap className="w-4 h-4" />
      default:
        return <Database className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "organization":
        return "text-dark-700"
      case "person":
        return "text-green-400"
      case "location":
        return "text-red-400"
      case "patent":
        return "text-purple-400"
      case "technology":
        return "text-yellow-400"
      default:
        return "text-gray-400"
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-400"
    if (confidence >= 0.6) return "text-yellow-400"
    return "text-red-400"
  }

  const getThreatColor = (level: string) => {
    switch (level) {
      case "critical":
        return "text-red-400 border-red-500/30 bg-red-500/10"
      case "high":
        return "text-orange-400 border-orange-500/30 bg-orange-500/10"
      case "medium":
        return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
      case "low":
        return "text-green-400 border-green-500/30 bg-green-500/10"
      default:
        return "text-gray-400 border-gray-500/30 bg-gray-500/10"
    }
  }

  const refreshData = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="glass-panel h-96 rounded-lg border border-white/10 backdrop-blur-md bg-black/20">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Radar className="w-12 h-12 mx-auto mb-4 text-dark-700 animate-spin" />
            <p className="text-gray-400 font-mono">SCANNING INTELLIGENCE NODES...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-panel h-full rounded-lg border border-white/10 backdrop-blur-md bg-black/20 flex flex-col">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite className="w-5 h-5 text-dark-700" />
            <span className="text-dark-700 font-mono uppercase font-bold">Node Console</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-green-500/30 text-green-400 font-mono bg-green-500/10">
              <Activity className="w-3 h-3 mr-1" />
              {stats.totalEntities} NODES
            </Badge>
            <TechButton size="sm" variant="outline" onClick={refreshData} className="bg-black/20">
              <RefreshCw className="w-3 h-3" />
            </TechButton>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="entities" className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-3 bg-black/20 border border-white/10 backdrop-blur-sm">
              <TabsTrigger
                value="entities"
                className="font-mono text-xs data-[state=active]:bg-dark-500/20 data-[state=active]:text-dark-700"
              >
                ENTITIES
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="font-mono text-xs data-[state=active]:bg-dark-500/20 data-[state=active]:text-dark-700"
              >
                STATISTICS
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="font-mono text-xs data-[state=active]:bg-dark-500/20 data-[state=active]:text-dark-700"
              >
                DETAILS
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="entities" className="p-4 space-y-4 h-full overflow-hidden">
              {/* Search and Filter Controls */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search intelligence entities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-black/30 border-white/20 font-mono text-sm backdrop-blur-sm"
                    />
                  </div>
                </div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 bg-black/30 border border-white/20 rounded-md text-white font-mono text-sm backdrop-blur-sm"
                >
                  <option value="all">ALL TYPES</option>
                  <option value="organization">ORGANIZATIONS</option>
                  <option value="person">PERSONNEL</option>
                  <option value="location">LOCATIONS</option>
                  <option value="patent">PATENTS</option>
                  <option value="technology">TECHNOLOGY</option>
                </select>
              </div>

              {/* Entity List */}
              <ScrollArea className="h-[calc(100%-80px)]">
                <div className="space-y-2">
                  {filteredEntities.map((entity) => (
                    <div
                      key={entity.id}
                      className="glass-panel p-4 rounded-lg border border-white/10 backdrop-blur-md bg-black/20 hover:border-dark-500/30 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedEntity(entity)
                        onNodeSelect(entity)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={getTypeColor(entity.type)}>{getTypeIcon(entity.type)}</div>
                          <div>
                            <h4 className="font-medium text-white font-mono text-sm">{entity.name}</h4>
                            <p className="text-xs text-gray-400 capitalize font-mono">{entity.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-mono ${getConfidenceColor(entity.confidence)}`}>
                            {(entity.confidence * 100).toFixed(1)}%
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs font-mono ${getThreatColor(entity.metadata.threat_level || "low")}`}
                          >
                            {(entity.metadata.threat_level || "low").toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      {entity.latitude && entity.longitude && (
                        <div className="mt-2 text-xs text-gray-400 flex items-center gap-1 font-mono">
                          <MapPin className="w-3 h-3" />
                          {entity.latitude.toFixed(4)}, {entity.longitude.toFixed(4)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="stats" className="p-4 space-y-4 h-full overflow-hidden">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-4 rounded-lg border border-white/10 backdrop-blur-md bg-black/20 text-center">
                  <div className="text-2xl font-bold text-dark-700 font-mono">{stats.totalEntities}</div>
                  <div className="text-sm text-gray-400 font-mono">TOTAL ENTITIES</div>
                </div>

                <div className="glass-panel p-4 rounded-lg border border-white/10 backdrop-blur-md bg-black/20 text-center">
                  <div className="text-2xl font-bold text-green-400 font-mono">{stats.datasetsCount}</div>
                  <div className="text-sm text-gray-400 font-mono">INTEL SOURCES</div>
                </div>

                <div className="glass-panel p-4 rounded-lg border border-white/10 backdrop-blur-md bg-black/20 text-center">
                  <div className="text-2xl font-bold text-yellow-400 font-mono">
                    {(stats.averageConfidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400 font-mono">AVG CONFIDENCE</div>
                </div>

                <div className="glass-panel p-4 rounded-lg border border-white/10 backdrop-blur-md bg-black/20 text-center">
                  <div className="text-2xl font-bold text-purple-400 font-mono">
                    {Object.keys(stats.entitiesByType).length}
                  </div>
                  <div className="text-sm text-gray-400 font-mono">ENTITY TYPES</div>
                </div>
              </div>

              <ScrollArea className="h-[calc(100%-200px)]">
                <div className="space-y-4">
                  {/* Entity Type Distribution */}
                  <div className="glass-panel p-4 rounded-lg border border-white/10 backdrop-blur-md bg-black/20">
                    <h4 className="text-base font-mono text-dark-700 mb-3">ENTITY DISTRIBUTION</h4>
                    <div className="space-y-3">
                      {Object.entries(stats.entitiesByType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={getTypeColor(type)}>{getTypeIcon(type)}</div>
                            <span className="capitalize font-mono text-sm">{type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-dark-700 rounded-full"
                                style={{ width: `${(count / stats.totalEntities) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-mono w-8 text-right text-dark-700">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Threat Level Distribution */}
                  <div className="glass-panel p-4 rounded-lg border border-white/10 backdrop-blur-md bg-black/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-red-400" />
                      <h4 className="text-base font-mono text-dark-700">THREAT ASSESSMENT</h4>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(stats.threatDistribution).map(([level, count]) => (
                        <div key={level} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`w-4 h-4 ${getThreatColor(level).split(" ")[0]}`} />
                            <span className="uppercase font-mono text-sm">{level}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  level === "critical"
                                    ? "bg-red-400"
                                    : level === "high"
                                      ? "bg-orange-400"
                                      : level === "medium"
                                        ? "bg-yellow-400"
                                        : "bg-green-400"
                                }`}
                                style={{ width: `${(count / stats.totalEntities) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-mono w-8 text-right text-white">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="details" className="p-4 space-y-4 h-full overflow-hidden">
              {selectedEntity ? (
                <div className="glass-panel p-4 rounded-lg border border-dark-500/30 backdrop-blur-md bg-black/20">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={getTypeColor(selectedEntity.type)}>{getTypeIcon(selectedEntity.type)}</div>
                    <h4 className="font-mono text-dark-700 font-bold">{selectedEntity.name}</h4>
                  </div>

                  <ScrollArea className="h-[calc(100%-60px)]">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-400 font-mono">TYPE:</span>
                          <div className="font-mono capitalize text-dark-700">{selectedEntity.type}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400 font-mono">CONFIDENCE:</span>
                          <div className={`font-mono ${getConfidenceColor(selectedEntity.confidence)}`}>
                            {(selectedEntity.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400 font-mono">SOURCE:</span>
                          <div className="font-mono text-sm text-white">{selectedEntity.source}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400 font-mono">THREAT LEVEL:</span>
                          <div
                            className={`font-mono text-sm uppercase ${getThreatColor(selectedEntity.metadata.threat_level || "low").split(" ")[0]}`}
                          >
                            {selectedEntity.metadata.threat_level || "LOW"}
                          </div>
                        </div>
                      </div>

                      {selectedEntity.latitude && selectedEntity.longitude && (
                        <div>
                          <span className="text-sm text-gray-400 font-mono">COORDINATES:</span>
                          <div className="font-mono text-sm text-white">
                            {selectedEntity.latitude.toFixed(6)}, {selectedEntity.longitude.toFixed(6)}
                          </div>
                        </div>
                      )}

                      <div>
                        <span className="text-sm text-gray-400 font-mono">METADATA:</span>
                        <div className="mt-2 glass-panel bg-black/50 border-white/10 rounded p-3">
                          <ScrollArea className="max-h-48">
                            <pre className="whitespace-pre-wrap text-xs font-mono text-gray-300">
                              {JSON.stringify(selectedEntity.metadata, null, 2)}
                            </pre>
                          </ScrollArea>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="glass-panel p-8 rounded-lg border border-white/10 backdrop-blur-md bg-black/20 text-center">
                  <Eye className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400 font-mono">SELECT AN ENTITY TO VIEW DETAILS</p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
