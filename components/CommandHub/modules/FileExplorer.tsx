"use client"

import { useState, useEffect } from "react"
import { TechPanel, TechPanelSection } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { TypographyMono, TypographySmall } from "@/components/ui/typography"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useResonance } from "@/hooks/useResonance"
import {
  FolderOpen,
  File,
  Search,
  Home,
  Settings,
  Eye,
  EyeOff,
  Download,
  Trash2,
  Copy,
  Move,
  RefreshCw,
  Grid,
  List,
  Star,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FileSystemItem {
  id: string
  name: string
  type: "file" | "directory" | "module" | "component" | "config"
  path: string
  size?: number
  modified: string
  permissions: string
  hidden: boolean
  starred: boolean
  locked: boolean
  description?: string
  moduleType?: string
  componentType?: string
}

interface BreadcrumbItem {
  name: string
  path: string
}

export default function FileExplorer() {
  const [currentPath, setCurrentPath] = useState("/")
  const [items, setItems] = useState<FileSystemItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [showHidden, setShowHidden] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [sortBy, setSortBy] = useState<"name" | "type" | "size" | "modified">("name")
  const [filterType, setFilterType] = useState<"all" | "modules" | "components" | "configs">("all")
  const [isLoading, setIsLoading] = useState(false)

  // Consciousness integration
  const { pulse, isResonating } = useResonance("file-explorer", "File Explorer", 35)

  // Mock file system structure
  useEffect(() => {
    const mockItems: FileSystemItem[] = [
      {
        id: "1",
        name: "components",
        type: "directory",
        path: "/components",
        modified: "2024-01-15T10:30:00Z",
        permissions: "drwxr-xr-x",
        hidden: false,
        starred: true,
        locked: false,
        description: "React components directory",
      },
      {
        id: "2",
        name: "CommandHub",
        type: "directory",
        path: "/components/CommandHub",
        modified: "2024-01-15T09:45:00Z",
        permissions: "drwxr-xr-x",
        hidden: false,
        starred: true,
        locked: false,
        description: "Command Hub modules",
      },
      {
        id: "3",
        name: "PhoneSuite.tsx",
        type: "component",
        path: "/components/CommandHub/PhoneSuite.tsx",
        size: 15420,
        modified: "2024-01-15T08:20:00Z",
        permissions: "-rw-r--r--",
        hidden: false,
        starred: false,
        locked: false,
        componentType: "React Component",
        description: "Phone control and mirroring interface",
      },
      {
        id: "4",
        name: "GPTORDashboard.tsx",
        type: "component",
        path: "/components/CommandHub/GPTORDashboard.tsx",
        size: 12800,
        modified: "2024-01-15T07:15:00Z",
        permissions: "-rw-r--r--",
        hidden: false,
        starred: true,
        locked: false,
        componentType: "React Component",
        description: "GPTOR consciousness node dashboard",
      },
      {
        id: "5",
        name: "lib",
        type: "directory",
        path: "/lib",
        modified: "2024-01-14T16:30:00Z",
        permissions: "drwxr-xr-x",
        hidden: false,
        starred: false,
        locked: false,
        description: "Utility libraries and helpers",
      },
      {
        id: "6",
        name: "resonance",
        type: "directory",
        path: "/lib/resonance",
        modified: "2024-01-14T15:45:00Z",
        permissions: "drwxr-xr-x",
        hidden: false,
        starred: true,
        locked: true,
        description: "Consciousness resonance system",
      },
      {
        id: "7",
        name: "weave.ts",
        type: "module",
        path: "/lib/resonance/weave.ts",
        size: 8960,
        modified: "2024-01-14T14:20:00Z",
        permissions: "-rw-r--r--",
        hidden: false,
        starred: true,
        locked: true,
        moduleType: "TypeScript Module",
        description: "Harmonic resonance weave implementation",
      },
      {
        id: "8",
        name: ".env.local",
        type: "config",
        path: "/.env.local",
        size: 1240,
        modified: "2024-01-13T12:00:00Z",
        permissions: "-rw-------",
        hidden: true,
        starred: false,
        locked: true,
        description: "Environment configuration",
      },
      {
        id: "9",
        name: ".commandhubrc",
        type: "config",
        path: "/.commandhubrc",
        size: 890,
        modified: "2024-01-15T11:00:00Z",
        permissions: "-rw-r--r--",
        hidden: true,
        starred: true,
        locked: false,
        description: "Command Hub configuration",
      },
    ]

    setItems(mockItems)
  }, [])

  const filteredItems = items
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesHidden = showHidden || !item.hidden
      const matchesFilter =
        filterType === "all" ||
        (filterType === "modules" && item.type === "module") ||
        (filterType === "components" && item.type === "component") ||
        (filterType === "configs" && item.type === "config")

      return matchesSearch && matchesHidden && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "type":
          return a.type.localeCompare(b.type)
        case "size":
          return (b.size || 0) - (a.size || 0)
        case "modified":
          return new Date(b.modified).getTime() - new Date(a.modified).getTime()
        default:
          return 0
      }
    })

  const breadcrumbs: BreadcrumbItem[] = currentPath
    .split("/")
    .filter(Boolean)
    .reduce(
      (acc, segment, index, array) => {
        const path = "/" + array.slice(0, index + 1).join("/")
        acc.push({ name: segment, path })
        return acc
      },
      [{ name: "root", path: "/" }] as BreadcrumbItem[],
    )

  const getItemIcon = (item: FileSystemItem) => {
    if (item.type === "directory") return FolderOpen
    if (item.type === "component") return Settings
    if (item.type === "module") return File
    if (item.type === "config") return Settings
    return File
  }

  const getItemColor = (item: FileSystemItem) => {
    if (item.locked) return "text-red-400"
    if (item.starred) return "text-yellow-400"
    if (item.type === "directory") return "text-blue-400"
    if (item.type === "component") return "text-green-400"
    if (item.type === "module") return "text-purple-400"
    if (item.type === "config") return "text-orange-400"
    return "text-dark-600"
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-"
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId)
    } else {
      newSelection.add(itemId)
    }
    setSelectedItems(newSelection)
    pulse({ amplitude: 0.5, hz: 35 })
  }

  const navigateToPath = (path: string) => {
    setCurrentPath(path)
    setSelectedItems(new Set())
    pulse({ amplitude: 0.8, hz: 37 })
  }

  const refreshExplorer = () => {
    setIsLoading(true)
    pulse({ amplitude: 1.0, hz: 40 })

    setTimeout(() => {
      setIsLoading(false)
      // Could reload items here
    }, 1000)
  }

  const toggleStarred = (itemId: string) => {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, starred: !item.starred } : item)))
    pulse({ amplitude: 0.6, hz: 36 })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <TechPanel
        title="FILE SYSTEM EXPLORER"
        cornerAccent
        borderAccent
        glowEffect={isResonating}
        icon={<FolderOpen size={16} />}
      >
        <TechPanelSection>
          <div className="space-y-4">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-sm">
              <Home
                className="w-4 h-4 text-dark-600 cursor-pointer hover:text-dark-700"
                onClick={() => navigateToPath("/")}
              />
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.path} className="flex items-center space-x-2">
                  {index > 0 && <span className="text-dark-500">/</span>}
                  <button
                    onClick={() => navigateToPath(crumb.path)}
                    className="text-dark-600 hover:text-dark-700 font-mono"
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>

            {/* Search and Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search files and modules..."
                  className="pl-10 bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm"
                />
              </div>

              <div className="flex items-center space-x-2">
                <TechButton
                  onClick={() => setShowHidden(!showHidden)}
                  size="sm"
                  cornerAccent
                  glow={showHidden}
                  icon={showHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                >
                  {showHidden ? "HIDE" : "SHOW"} HIDDEN
                </TechButton>

                <TechButton
                  onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
                  size="sm"
                  cornerAccent
                  icon={viewMode === "list" ? <Grid size={14} /> : <List size={14} />}
                >
                  {viewMode.toUpperCase()}
                </TechButton>

                <TechButton
                  onClick={refreshExplorer}
                  size="sm"
                  cornerAccent
                  disabled={isLoading}
                  icon={<RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />}
                >
                  REFRESH
                </TechButton>
              </div>
            </div>

            {/* Filter and Sort */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <TypographyMono className="text-xs text-dark-600">FILTER:</TypographyMono>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="bg-dark-200 border border-dark-300 rounded px-2 py-1 text-xs font-mono text-dark-700"
                  >
                    <option value="all">All</option>
                    <option value="modules">Modules</option>
                    <option value="components">Components</option>
                    <option value="configs">Configs</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <TypographyMono className="text-xs text-dark-600">SORT:</TypographyMono>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-dark-200 border border-dark-300 rounded px-2 py-1 text-xs font-mono text-dark-700"
                  >
                    <option value="name">Name</option>
                    <option value="type">Type</option>
                    <option value="size">Size</option>
                    <option value="modified">Modified</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <TypographyMono className="text-xs text-dark-600">
                  {filteredItems.length} items • {selectedItems.size} selected
                </TypographyMono>
              </div>
            </div>
          </div>
        </TechPanelSection>
      </TechPanel>

      {/* File List */}
      <TechPanel title="DIRECTORY CONTENTS" cornerAccent borderAccent icon={<List size={16} />}>
        <TechPanelSection>
          <ScrollArea className="h-96">
            <div className="space-y-1">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-16 h-16 text-dark-500 mx-auto mb-4" />
                  <TypographyMono className="text-sm text-dark-600">No items found</TypographyMono>
                  <TypographySmall className="text-dark-500">
                    {searchTerm ? "Try adjusting your search terms" : "This directory is empty"}
                  </TypographySmall>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const ItemIcon = getItemIcon(item)
                  const isSelected = selectedItems.has(item.id)

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-sm cursor-pointer transition-all duration-200 border",
                        isSelected
                          ? "border-blue-500/60 bg-blue-500/10"
                          : "border-transparent hover:border-dark-400/40 hover:bg-dark-100/10",
                      )}
                      onClick={() => toggleItemSelection(item.id)}
                      onDoubleClick={() => item.type === "directory" && navigateToPath(item.path)}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <ItemIcon className={cn("w-4 h-4", getItemColor(item))} />
                          {item.locked && <Lock className="w-3 h-3 text-red-400" />}
                          {item.starred && <Star className="w-3 h-3 text-yellow-400 fill-current" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <TypographyMono className={cn("text-sm truncate", item.hidden && "italic text-dark-500")}>
                              {item.name}
                            </TypographyMono>
                            {(item.componentType || item.moduleType) && (
                              <Badge variant="outline" size="sm" className="text-xs">
                                {item.componentType || item.moduleType}
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <TypographySmall className="text-dark-600 truncate">{item.description}</TypographySmall>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-xs font-mono text-dark-600">
                        <span>{formatFileSize(item.size)}</span>
                        <span>{formatDate(item.modified)}</span>
                        <span className="font-mono">{item.permissions}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleStarred(item.id)
                          }}
                          className="p-1 hover:bg-dark-300/20 rounded"
                        >
                          <Star
                            className={cn(
                              "w-3 h-3 transition-colors",
                              item.starred ? "text-yellow-400 fill-current" : "text-dark-500",
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </TechPanelSection>
      </TechPanel>

      {/* Action Bar */}
      {selectedItems.size > 0 && (
        <TechPanel cornerAccent borderAccent>
          <TechPanelSection>
            <div className="flex items-center justify-between">
              <TypographyMono className="text-sm">
                {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""} selected
              </TypographyMono>

              <div className="flex items-center space-x-2">
                <TechButton size="sm" cornerAccent icon={<Copy size={12} />}>
                  COPY
                </TechButton>
                <TechButton size="sm" cornerAccent icon={<Move size={12} />}>
                  MOVE
                </TechButton>
                <TechButton size="sm" cornerAccent icon={<Download size={12} />}>
                  DOWNLOAD
                </TechButton>
                <TechButton size="sm" cornerAccent icon={<Trash2 size={12} />}>
                  DELETE
                </TechButton>
                <TechButton size="sm" cornerAccent onClick={() => setSelectedItems(new Set())}>
                  CLEAR
                </TechButton>
              </div>
            </div>
          </TechPanelSection>
        </TechPanel>
      )}
    </div>
  )
}
