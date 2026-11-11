"use client"

import { useState } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Folder, Download, Upload, RefreshCw, CheckCircle, AlertTriangle, XCircle } from "lucide-react"

interface LegacyModule {
  id: string
  name: string
  version: string
  description: string
  path: string
  status: "available" | "mounted" | "loading" | "error"
  dependencies: string[]
  lastModified: Date
  size: string
  type: "component" | "service" | "integration" | "tool"
  author: string
  compatibility: string[]
}

const mockLegacyModules: LegacyModule[] = [
  {
    id: "osint-dashboard",
    name: "OSINT Dashboard",
    version: "2.1.4",
    description: "Open Source Intelligence gathering and analysis tools",
    path: "/legacy_commandhub/osint/",
    status: "available",
    dependencies: ["shodan-api", "threat-intel"],
    lastModified: new Date("2024-01-15"),
    size: "2.3 MB",
    type: "component",
    author: "S3V3N",
    compatibility: ["v2.x", "v3.x"],
  },
  {
    id: "cctv-viewer",
    name: "CCTV Viewer",
    version: "1.8.2",
    description: "Multi-camera surveillance and monitoring system",
    path: "/legacy_commandhub/cctv/",
    status: "mounted",
    dependencies: ["video-stream", "motion-detect"],
    lastModified: new Date("2024-01-10"),
    size: "4.1 MB",
    type: "component",
    author: "S3V3N",
    compatibility: ["v2.x", "v3.x"],
  },
  {
    id: "secure-messages",
    name: "Secure Messages",
    version: "3.0.1",
    description: "Encrypted messaging and communication protocols",
    path: "/legacy_commandhub/comms/",
    status: "available",
    dependencies: ["crypto-core", "p2p-network"],
    lastModified: new Date("2024-01-20"),
    size: "1.7 MB",
    type: "service",
    author: "S3V3N",
    compatibility: ["v3.x"],
  },
  {
    id: "rtl-sdr-control",
    name: "RTL-SDR Control",
    version: "1.5.3",
    description: "Software Defined Radio control and signal analysis",
    path: "/legacy_commandhub/sdr/",
    status: "available",
    dependencies: ["librtlsdr", "signal-proc"],
    lastModified: new Date("2023-12-28"),
    size: "3.2 MB",
    type: "tool",
    author: "S3V3N",
    compatibility: ["v2.x"],
  },
  {
    id: "postgres-panel",
    name: "PostgreSQL Panel",
    version: "2.4.0",
    description: "Database management and query interface",
    path: "/legacy_commandhub/database/",
    status: "error",
    dependencies: ["pg-client", "sql-parser"],
    lastModified: new Date("2024-01-05"),
    size: "2.8 MB",
    type: "integration",
    author: "S3V3N",
    compatibility: ["v2.x", "v3.x"],
  },
  {
    id: "markdown-editor",
    name: "Markdown Editor",
    version: "1.9.7",
    description: "Advanced markdown editing with live preview",
    path: "/legacy_commandhub/editor/",
    status: "available",
    dependencies: ["markdown-parser", "syntax-highlight"],
    lastModified: new Date("2024-01-12"),
    size: "1.4 MB",
    type: "tool",
    author: "S3V3N",
    compatibility: ["v2.x", "v3.x"],
  },
  {
    id: "ai-face-interface",
    name: "AI Face Interface",
    version: "0.8.4",
    description: "Facial recognition and biometric authentication",
    path: "/legacy_commandhub/biometric/",
    status: "available",
    dependencies: ["opencv", "face-recognition"],
    lastModified: new Date("2023-11-30"),
    size: "5.6 MB",
    type: "component",
    author: "S3V3N",
    compatibility: ["v2.x"],
  },
  {
    id: "kepler-map",
    name: "Kepler Geospatial Map",
    version: "1.3.2",
    description: "Advanced geospatial visualization and mapping",
    path: "/legacy_commandhub/mapping/",
    status: "mounted",
    dependencies: ["kepler.gl", "mapbox-gl"],
    lastModified: new Date("2024-01-08"),
    size: "6.2 MB",
    type: "component",
    author: "S3V3N",
    compatibility: ["v3.x"],
  },
]

export default function LegacyModuleLoader() {
  const [modules, setModules] = useState<LegacyModule[]>(mockLegacyModules)
  const [selectedModule, setSelectedModule] = useState<LegacyModule | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const scanLegacyModules = async () => {
    setIsScanning(true)
    // Simulate scanning legacy modules
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsScanning(false)
  }

  const mountModule = async (moduleId: string) => {
    setModules((prev) =>
      prev.map((module) => (module.id === moduleId ? { ...module, status: "loading" as const } : module)),
    )

    // Simulate mounting process
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setModules((prev) =>
      prev.map((module) => (module.id === moduleId ? { ...module, status: "mounted" as const } : module)),
    )
  }

  const unmountModule = (moduleId: string) => {
    setModules((prev) =>
      prev.map((module) => (module.id === moduleId ? { ...module, status: "available" as const } : module)),
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "mounted":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "loading":
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "mounted":
        return "text-green-400 border-green-400/50"
      case "loading":
        return "text-blue-400 border-blue-400/50"
      case "error":
        return "text-red-400 border-red-400/50"
      default:
        return "text-yellow-400 border-yellow-400/50"
    }
  }

  const filteredModules = modules.filter((module) => {
    const typeMatch = filterType === "all" || module.type === filterType
    const statusMatch = filterStatus === "all" || module.status === filterStatus
    return typeMatch && statusMatch
  })

  const mountedCount = modules.filter((m) => m.status === "mounted").length
  const availableCount = modules.filter((m) => m.status === "available").length
  const errorCount = modules.filter((m) => m.status === "error").length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Module List */}
      <div className="lg:col-span-2">
        <TechPanel
          title="LEGACY MODULE ARCHIVE"
          subtitle="COMMANDHUB MODULE LOADER"
          cornerAccent={true}
          borderAccent={true}
        >
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TechButton
                  size="sm"
                  onClick={scanLegacyModules}
                  disabled={isScanning}
                  className="bg-dark-600 hover:bg-dark-500 text-black font-mono text-xs"
                >
                  {isScanning ? (
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-1" />
                  )}
                  {isScanning ? "SCANNING..." : "SCAN"}
                </TechButton>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-dark-200 border border-dark-400/50 rounded px-2 py-1 text-xs font-mono text-dark-600"
                >
                  <option value="all">All Types</option>
                  <option value="component">Components</option>
                  <option value="service">Services</option>
                  <option value="integration">Integrations</option>
                  <option value="tool">Tools</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-dark-200 border border-dark-400/50 rounded px-2 py-1 text-xs font-mono text-dark-600"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="mounted">Mounted</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div className="flex items-center space-x-4 text-xs font-mono text-dark-500">
                <span>Mounted: {mountedCount}</span>
                <span>Available: {availableCount}</span>
                <span>Errors: {errorCount}</span>
              </div>
            </div>

            {/* Module Grid */}
            <ScrollArea className="h-[500px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredModules.map((module) => (
                  <div
                    key={module.id}
                    className={`p-3 border rounded cursor-pointer transition-all duration-200 ${
                      selectedModule?.id === module.id
                        ? "border-blue-500/60 bg-blue-500/10"
                        : "border-dark-400/30 hover:border-dark-400/60"
                    }`}
                    onClick={() => setSelectedModule(module)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(module.status)}
                        <div>
                          <div className="font-mono text-sm font-bold text-dark-700">{module.name}</div>
                          <div className="font-mono text-xs text-dark-500">v{module.version}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(module.status)}`}>
                        {module.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="text-xs text-dark-600 mb-2">{module.description}</div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs border-dark-400/30 text-dark-600">
                          {module.type}
                        </Badge>
                        <span className="text-xs text-dark-500">{module.size}</span>
                      </div>

                      {module.status === "available" && (
                        <TechButton
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            mountModule(module.id)
                          }}
                          className="bg-dark-600 hover:bg-dark-500 text-black font-mono text-xs"
                        >
                          MOUNT
                        </TechButton>
                      )}

                      {module.status === "mounted" && (
                        <TechButton
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            unmountModule(module.id)
                          }}
                          className="border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
                        >
                          UNMOUNT
                        </TechButton>
                      )}

                      {module.status === "loading" && (
                        <div className="flex items-center space-x-1 text-xs text-blue-400">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Loading...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TechPanel>
      </div>

      {/* Module Details */}
      <div>
        <TechPanel title="MODULE DETAILS" subtitle="CONFIGURATION & INFO" cornerAccent={true} borderAccent={true}>
          {selectedModule ? (
            <div className="space-y-4">
              <div>
                <div className="font-mono text-lg font-bold text-dark-700 mb-1">{selectedModule.name}</div>
                <div className="font-mono text-sm text-dark-500 mb-2">Version {selectedModule.version}</div>
                <div className="text-sm text-dark-600">{selectedModule.description}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-dark-500">STATUS</span>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(selectedModule.status)}`}>
                    {selectedModule.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-dark-500">TYPE</span>
                  <span className="font-mono text-xs text-dark-700">{selectedModule.type.toUpperCase()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-dark-500">SIZE</span>
                  <span className="font-mono text-xs text-dark-700">{selectedModule.size}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-dark-500">AUTHOR</span>
                  <span className="font-mono text-xs text-dark-700">{selectedModule.author}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-dark-500">MODIFIED</span>
                  <span className="font-mono text-xs text-dark-700">
                    {selectedModule.lastModified.toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-dark-400/30">
                <span className="font-mono text-xs text-dark-500 block mb-2">PATH</span>
                <div className="bg-dark-200/20 p-2 rounded border border-dark-400/30">
                  <code className="font-mono text-xs text-dark-600">{selectedModule.path}</code>
                </div>
              </div>

              <div className="pt-2 border-t border-dark-400/30">
                <span className="font-mono text-xs text-dark-500 block mb-2">DEPENDENCIES</span>
                <div className="flex flex-wrap gap-1">
                  {selectedModule.dependencies.map((dep) => (
                    <Badge key={dep} variant="outline" className="text-xs border-dark-400/30 text-dark-600">
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-dark-400/30">
                <span className="font-mono text-xs text-dark-500 block mb-2">COMPATIBILITY</span>
                <div className="flex flex-wrap gap-1">
                  {selectedModule.compatibility.map((version) => (
                    <Badge key={version} variant="outline" className="text-xs border-dark-400/30 text-dark-600">
                      {version}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-4 space-y-2">
                {selectedModule.status === "available" && (
                  <TechButton
                    onClick={() => mountModule(selectedModule.id)}
                    className="w-full bg-dark-600 hover:bg-dark-500 text-black font-mono text-sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    MOUNT MODULE
                  </TechButton>
                )}

                {selectedModule.status === "mounted" && (
                  <TechButton
                    variant="outline"
                    onClick={() => unmountModule(selectedModule.id)}
                    className="w-full border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    UNMOUNT MODULE
                  </TechButton>
                )}

                <TechButton
                  variant="outline"
                  className="w-full border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-sm"
                >
                  <Folder className="w-4 h-4 mr-2" />
                  OPEN IN EXPLORER
                </TechButton>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-dark-500">
              <Folder className="w-12 h-12 mx-auto mb-4" />
              <div className="font-mono text-sm">No module selected</div>
              <div className="text-xs">Click on a module to view details</div>
            </div>
          )}
        </TechPanel>
      </div>
    </div>
  )
}
