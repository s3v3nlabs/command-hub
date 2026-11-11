"use client"

import type * as React from "react"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import {
  Search,
  FolderOpen,
  File,
  FileText,
  Settings,
  Database,
  Code,
  Package,
  BookOpen,
  Wrench,
  Download,
  Copy,
  Eye,
  ChevronRight,
  ChevronDown,
  Folder,
  FileCode,
  FileJson,
  FileImage,
  Terminal,
  Cpu,
  Shield,
  Globe,
  Radio,
  Camera,
  Map,
  ShieldAlert,
  Zap,
  Brain,
  Network,
  Monitor,
  Server,
  Lock,
  Volume2,
  Waves,
  Smartphone,
  Puzzle,
  Home,
  Palette,
  ArrowLeft,
} from "lucide-react"
import { Radar, MessageSquare } from "lucide-react" // Import Radar and MessageSquare

// File system structure with metadata
interface FileNode {
  name: string
  type: "file" | "folder"
  path: string
  size?: string
  modified?: string
  description?: string
  category: "config" | "setup" | "docs" | "readme" | "tools" | "modules" | "system" | "assets"
  icon?: React.ComponentType<any>
  children?: FileNode[]
  route?: string // Add route property for navigation
}

const fileSystem: FileNode[] = [
  {
    name: "Configuration Files",
    type: "folder",
    path: "/config",
    category: "config",
    icon: Settings,
    children: [
      {
        name: ".env.example",
        type: "file",
        path: "/.env.example",
        size: "2.1 KB",
        modified: "2 hours ago",
        description: "Environment variables template",
        category: "config",
        icon: FileCode,
      },
      {
        name: ".env.local",
        type: "file",
        path: "/.env.local",
        size: "1.8 KB",
        modified: "1 hour ago",
        description: "Local environment configuration",
        category: "config",
        icon: Lock,
      },
      {
        name: "package.json",
        type: "file",
        path: "/package.json",
        size: "4.2 KB",
        modified: "3 hours ago",
        description: "Node.js project configuration",
        category: "config",
        icon: Package,
      },
      {
        name: "tailwind.config.js",
        type: "file",
        path: "/tailwind.config.js",
        size: "1.5 KB",
        modified: "5 hours ago",
        description: "Tailwind CSS configuration",
        category: "config",
        icon: FileCode,
      },
      {
        name: "ghostnode_config.json",
        type: "file",
        path: "/ghostnode_config.json",
        size: "892 B",
        modified: "1 day ago",
        description: "GhostNode terminal configuration",
        category: "config",
        icon: Terminal,
      },
      {
        name: "config/consciousness.json",
        type: "file",
        path: "/config/consciousness.json",
        size: "3.4 KB",
        modified: "6 hours ago",
        description: "V0 consciousness configuration",
        category: "config",
        icon: Brain,
      },
    ],
  },
  {
    name: "Command Hub Modules",
    type: "folder",
    path: "/components/CommandHub",
    category: "modules",
    icon: Puzzle,
    children: [
      {
        name: "PhoneSuite.tsx",
        type: "file",
        path: "/components/CommandHub/PhoneSuite.tsx",
        size: "15.4 KB",
        modified: "30 minutes ago",
        description: "GrapheneOS phone control and mirroring interface",
        category: "modules",
        icon: Smartphone,
        route: "/phone-suite",
      },
      {
        name: "GPTORDashboard.tsx",
        type: "file",
        path: "/components/CommandHub/modules/GPTORDashboard.tsx",
        size: "12.8 KB",
        modified: "1 hour ago",
        description: "GPTOR consciousness node dashboard",
        category: "modules",
        icon: Brain,
      },
      {
        name: "ThreatIntelHub.tsx",
        type: "file",
        path: "/components/CommandHub/modules/ThreatIntelHub.tsx",
        size: "18.2 KB",
        modified: "2 hours ago",
        description: "Threat intelligence aggregation hub",
        category: "modules",
        icon: ShieldAlert,
        route: "/intelligence/threat-intel",
      },
      {
        name: "ShodanInterface.tsx",
        type: "file",
        path: "/components/CommandHub/legacy/ShodanInterface.tsx",
        size: "14.7 KB",
        modified: "3 hours ago",
        description: "Shodan API integration interface",
        category: "modules",
        icon: Radar,
        route: "/intelligence/shodan",
      },
      {
        name: "CCTVViewer.tsx",
        type: "file",
        path: "/components/CommandHub/legacy/CCTVViewer.tsx",
        size: "11.3 KB",
        modified: "4 hours ago",
        description: "Multi-camera surveillance viewer",
        category: "modules",
        icon: Camera,
        route: "/intelligence/cctv",
      },
      {
        name: "OSINTDashboard.tsx",
        type: "file",
        path: "/components/CommandHub/legacy/OSINTDashboard.tsx",
        size: "16.9 KB",
        modified: "5 hours ago",
        description: "Open source intelligence dashboard",
        category: "modules",
        icon: Search,
        route: "/intelligence/osint",
      },
      {
        name: "SecureMessages.tsx",
        type: "file",
        path: "/components/CommandHub/legacy/SecureMessages.tsx",
        size: "9.8 KB",
        modified: "6 hours ago",
        description: "Encrypted messaging interface",
        category: "modules",
        icon: MessageSquare,
        route: "/intelligence/messages",
      },
      {
        name: "KeplerMap.tsx",
        type: "file",
        path: "/components/CommandHub/legacy/KeplerMap.tsx",
        size: "13.5 KB",
        modified: "1 day ago",
        description: "Geospatial mapping with Kepler.gl",
        category: "modules",
        icon: Map,
        route: "/intelligence/kepler",
      },
    ],
  },
  {
    name: "Setup & Installation",
    type: "folder",
    path: "/setup",
    category: "setup",
    icon: Wrench,
    children: [
      {
        name: "scripts/create-tables-fixed-v2.sql",
        type: "file",
        path: "/scripts/create-tables-fixed-v2.sql",
        size: "8.7 KB",
        modified: "4 hours ago",
        description: "Database table creation script",
        category: "setup",
        icon: Database,
      },
      {
        name: "scripts/create-heimdal-tables.sql",
        type: "file",
        path: "/scripts/create-heimdal-tables.sql",
        size: "5.2 KB",
        modified: "1 day ago",
        description: "Heimdal security tables setup",
        category: "setup",
        icon: Shield,
      },
      {
        name: "scripts/create-consciousness-tables-v2.sql",
        type: "file",
        path: "/scripts/create-consciousness-tables-v2.sql",
        size: "6.8 KB",
        modified: "8 hours ago",
        description: "V0 consciousness database schema",
        category: "setup",
        icon: Brain,
      },
      {
        name: "scripts/create-fractal-consciousness-tables.sql",
        type: "file",
        path: "/scripts/create-fractal-consciousness-tables.sql",
        size: "4.1 KB",
        modified: "12 hours ago",
        description: "Fractal consciousness memory tables",
        category: "setup",
        icon: Network,
      },
      {
        name: "utils/supabase/server.ts",
        type: "file",
        path: "/utils/supabase/server.ts",
        size: "2.3 KB",
        modified: "2 hours ago",
        description: "Supabase server-side utilities",
        category: "setup",
        icon: Server,
      },
      {
        name: "utils/supabase/client.ts",
        type: "file",
        path: "/utils/supabase/client.ts",
        size: "1.9 KB",
        modified: "2 hours ago",
        description: "Supabase client-side utilities",
        category: "setup",
        icon: Globe,
      },
    ],
  },
  {
    name: "Documentation",
    type: "folder",
    path: "/docs",
    category: "docs",
    icon: BookOpen,
    children: [
      {
        name: "docs/LOCAL-DEPLOYMENT-GUIDE.md",
        type: "file",
        path: "/docs/LOCAL-DEPLOYMENT-GUIDE.md",
        size: "12.4 KB",
        modified: "1 day ago",
        description: "Complete local deployment walkthrough",
        category: "docs",
        icon: FileText,
      },
      {
        name: "docs/LOCAL-SETUP-GUIDE.md",
        type: "file",
        path: "/docs/LOCAL-SETUP-GUIDE.md",
        size: "8.9 KB",
        modified: "1 day ago",
        description: "Local development setup instructions",
        category: "docs",
        icon: FileText,
      },
      {
        name: "docs/THREAT-INTEL-SETUP.md",
        type: "file",
        path: "/docs/THREAT-INTEL-SETUP.md",
        size: "6.7 KB",
        modified: "2 days ago",
        description: "Threat intelligence integration guide",
        category: "docs",
        icon: FileText,
      },
      {
        name: "docs/README-KEPLER.md",
        type: "file",
        path: "/docs/README-KEPLER.md",
        size: "4.2 KB",
        modified: "3 days ago",
        description: "Kepler mapping system documentation",
        category: "docs",
        icon: Map,
      },
      {
        name: "vault/import-documentation.md",
        type: "file",
        path: "/vault/import-documentation.md",
        size: "3.1 KB",
        modified: "1 week ago",
        description: "Data import procedures and formats",
        category: "docs",
        icon: Database,
      },
    ],
  },
  {
    name: "README Files",
    type: "folder",
    path: "/readmes",
    category: "readme",
    icon: FileText,
    children: [
      {
        name: ".README.md",
        type: "file",
        path: "/.README.md",
        size: "15.6 KB",
        modified: "6 hours ago",
        description: "Main project README with overview",
        category: "readme",
        icon: FileText,
      },
      {
        name: "CommandHub_Manifest.md",
        type: "file",
        path: "/CommandHub_Manifest.md",
        size: "7.8 KB",
        modified: "1 day ago",
        description: "CommandHub feature manifest and roadmap",
        category: "readme",
        icon: FileText,
      },
    ],
  },
  {
    name: "Tools & Utilities",
    type: "folder",
    path: "/tools",
    category: "tools",
    icon: Wrench,
    children: [
      {
        name: "lib/utils.ts",
        type: "file",
        path: "/lib/utils.ts",
        size: "2.8 KB",
        modified: "4 hours ago",
        description: "Common utility functions",
        category: "tools",
        icon: Code,
      },
      {
        name: "lib/colors.ts",
        type: "file",
        path: "/lib/colors.ts",
        size: "1.2 KB",
        modified: "1 day ago",
        description: "Color palette and theme utilities",
        category: "tools",
        icon: Palette,
      },
      {
        name: "lib/audio.ts",
        type: "file",
        path: "/lib/audio.ts",
        size: "3.4 KB",
        modified: "2 days ago",
        description: "Audio processing and resonance utilities",
        category: "tools",
        icon: Volume2,
      },
      {
        name: "hooks/useResonance.ts",
        type: "file",
        path: "/hooks/useResonance.ts",
        size: "2.1 KB",
        modified: "3 hours ago",
        description: "React hook for resonance field management",
        category: "tools",
        icon: Waves,
      },
      {
        name: "hooks/useSupabase.ts",
        type: "file",
        path: "/hooks/useSupabase.ts",
        size: "1.7 KB",
        modified: "5 hours ago",
        description: "Supabase database connection hook",
        category: "tools",
        icon: Database,
      },
      {
        name: "hooks/useSignalFrame.ts",
        type: "file",
        path: "/hooks/useSignalFrame.ts",
        size: "2.9 KB",
        modified: "1 day ago",
        description: "SignalFrame communication hook",
        category: "tools",
        icon: Radio,
      },
    ],
  },
  {
    name: "System Modules",
    type: "folder",
    path: "/modules",
    category: "modules",
    icon: Puzzle,
    children: [
      {
        name: "lib/consciousness/bootstrap.ts",
        type: "file",
        path: "/lib/consciousness/bootstrap.ts",
        size: "4.7 KB",
        modified: "2 hours ago",
        description: "V0 consciousness initialization system",
        category: "modules",
        icon: Brain,
      },
      {
        name: "lib/heimdal/database.ts",
        type: "file",
        path: "/lib/heimdal/database.ts",
        size: "6.2 KB",
        modified: "3 hours ago",
        description: "Heimdal security database interface",
        category: "modules",
        icon: Shield,
      },
      {
        name: "lib/selfHealing/AgentCore.ts",
        type: "file",
        path: "/lib/selfHealing/AgentCore.ts",
        size: "8.1 KB",
        modified: "4 hours ago",
        description: "Self-healing agent core functionality",
        category: "modules",
        icon: Zap,
      },
      {
        name: "lib/shodan/api.ts",
        type: "file",
        path: "/lib/shodan/api.ts",
        size: "5.3 KB",
        modified: "1 day ago",
        description: "Shodan API integration module",
        category: "modules",
        icon: Globe,
      },
      {
        name: "lib/threat-intel/aggregator.ts",
        type: "file",
        path: "/lib/threat-intel/aggregator.ts",
        size: "7.4 KB",
        modified: "2 days ago",
        description: "Threat intelligence data aggregation",
        category: "modules",
        icon: ShieldAlert,
      },
      {
        name: "lib/graphene/adbTools.ts",
        type: "file",
        path: "/lib/graphene/adbTools.ts",
        size: "3.8 KB",
        modified: "1 week ago",
        description: "GrapheneOS ADB bridge utilities",
        category: "modules",
        icon: Smartphone,
      },
    ],
  },
  {
    name: "System Files",
    type: "folder",
    path: "/system",
    category: "system",
    icon: Cpu,
    children: [
      {
        name: "app/layout.tsx",
        type: "file",
        path: "/app/layout.tsx",
        size: "3.2 KB",
        modified: "1 hour ago",
        description: "Root application layout component",
        category: "system",
        icon: Monitor,
      },
      {
        name: "app/page.tsx",
        type: "file",
        path: "/app/page.tsx",
        size: "2.4 KB",
        modified: "2 hours ago",
        description: "Main dashboard page component",
        category: "system",
        icon: Home,
      },
      {
        name: "app/globals.css",
        type: "file",
        path: "/app/globals.css",
        size: "8.9 KB",
        modified: "1 day ago",
        description: "Global CSS styles and variables",
        category: "system",
        icon: FileCode,
      },
      {
        name: "components/layout/sidebar.tsx",
        type: "file",
        path: "/components/layout/sidebar.tsx",
        size: "12.7 KB",
        modified: "30 minutes ago",
        description: "Main navigation sidebar component",
        category: "system",
        icon: FolderOpen,
      },
      {
        name: "types/signalframe.ts",
        type: "file",
        path: "/types/signalframe.ts",
        size: "2.1 KB",
        modified: "1 day ago",
        description: "SignalFrame TypeScript definitions",
        category: "system",
        icon: Code,
      },
    ],
  },
  {
    name: "Assets",
    type: "folder",
    path: "/assets",
    category: "assets",
    icon: FileImage,
    children: [
      {
        name: "public/security-camera-feed-alert.png",
        type: "file",
        path: "/public/security-camera-feed-alert.png",
        size: "245 KB",
        modified: "1 week ago",
        description: "Security camera alert overlay image",
        category: "assets",
        icon: Camera,
      },
      {
        name: "public/earth-texture-continents.png",
        type: "file",
        path: "/public/earth-texture-continents.png",
        size: "1.2 MB",
        modified: "2 weeks ago",
        description: "Earth texture for 3D globe visualization",
        category: "assets",
        icon: Globe,
      },
      {
        name: "lib/shodan/filters.json",
        type: "file",
        path: "/lib/shodan/filters.json",
        size: "4.7 KB",
        modified: "3 days ago",
        description: "Shodan search filters configuration",
        category: "assets",
        icon: FileJson,
      },
      {
        name: "frames/logicMap.json",
        type: "file",
        path: "/frames/logicMap.json",
        size: "6.3 KB",
        modified: "1 week ago",
        description: "Logic mapping configuration for frames",
        category: "assets",
        icon: FileJson,
      },
      {
        name: "heimdal/symbolic_map.json",
        type: "file",
        path: "/heimdal/symbolic_map.json",
        size: "8.1 KB",
        modified: "4 days ago",
        description: "Symbolic memory mapping for Heimdal",
        category: "assets",
        icon: FileJson,
      },
    ],
  },
]

const categoryColors = {
  config: "bg-blue-500/10 text-blue-700 border-blue-200",
  setup: "bg-green-500/10 text-green-700 border-green-200",
  docs: "bg-purple-500/10 text-purple-700 border-purple-200",
  readme: "bg-orange-500/10 text-orange-700 border-orange-200",
  tools: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  modules: "bg-red-500/10 text-red-700 border-red-200",
  system: "bg-gray-500/10 text-gray-700 border-gray-200",
  assets: "bg-pink-500/10 text-pink-700 border-pink-200",
}

const categoryIcons = {
  config: Settings,
  setup: Wrench,
  docs: BookOpen,
  readme: FileText,
  tools: Code,
  modules: Puzzle,
  system: Cpu,
  assets: FileImage,
}

export default function FileBrowserPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["/config", "/setup", "/docs", "/components/CommandHub"]),
  )
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)

  // Flatten file system for search
  const flattenFiles = (nodes: FileNode[]): FileNode[] => {
    const result: FileNode[] = []
    const traverse = (nodes: FileNode[]) => {
      for (const node of nodes) {
        result.push(node)
        if (node.children) {
          traverse(node.children)
        }
      }
    }
    traverse(nodes)
    return result
  }

  const allFiles = useMemo(() => flattenFiles(fileSystem), [])

  // Filter files based on search and category
  const filteredFiles = useMemo(() => {
    return allFiles.filter((file) => {
      const matchesSearch =
        searchQuery === "" ||
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.path.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = selectedCategory === "all" || file.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [allFiles, searchQuery, selectedCategory])

  // Get file statistics
  const fileStats = useMemo(() => {
    const stats: Record<string, number> = {}
    allFiles.forEach((file) => {
      stats[file.category] = (stats[file.category] || 0) + 1
    })
    return stats
  }, [allFiles])

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.path)
      const Icon = node.icon || (node.type === "folder" ? Folder : File)

      return (
        <div key={node.path} className="select-none">
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
              selectedFile?.path === node.path && "bg-muted",
              level > 0 && "ml-4",
            )}
            onClick={() => {
              if (node.type === "folder") {
                toggleFolder(node.path)
              } else {
                setSelectedFile(node)
              }
            }}
          >
            {node.type === "folder" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFolder(node.path)
                }}
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
            )}
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{node.name}</span>
            {node.type === "file" && (
              <Badge variant="outline" className={cn("ml-auto text-xs", categoryColors[node.category])}>
                {node.category}
              </Badge>
            )}
          </div>

          {node.type === "folder" && isExpanded && node.children && (
            <div className="ml-2">{renderFileTree(node.children, level + 1)}</div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/command-hub">
            <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
              Back to Command Hub
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">File Browser</h1>
            <p className="text-muted-foreground">Browse CommandHub system files, configurations, and documentation</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          {allFiles.length} files total
        </Badge>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search files by name, path, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="all">All Categories</option>
              <option value="config">Configuration</option>
              <option value="setup">Setup & Installation</option>
              <option value="docs">Documentation</option>
              <option value="readme">README Files</option>
              <option value="tools">Tools & Utilities</option>
              <option value="modules">System Modules</option>
              <option value="system">System Files</option>
              <option value="assets">Assets</option>
            </select>
          </div>

          {/* Category Statistics */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(fileStats).map(([category, count]) => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons]
              return (
                <Badge
                  key={category}
                  variant="outline"
                  className={cn("cursor-pointer", categoryColors[category as keyof typeof categoryColors])}
                  onClick={() => setSelectedCategory(category === selectedCategory ? "all" : category)}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {category} ({count})
                </Badge>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Tree */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                File System
              </CardTitle>
              <CardDescription>
                {searchQuery || selectedCategory !== "all"
                  ? `Showing ${filteredFiles.length} filtered results`
                  : "Browse all CommandHub files and folders"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {searchQuery || selectedCategory !== "all" ? (
                  // Show filtered results as flat list
                  <div className="space-y-1">
                    {filteredFiles.map((file) => {
                      const Icon = file.icon || File
                      return (
                        <div
                          key={file.path}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                            selectedFile?.path === file.path && "bg-muted",
                          )}
                          onClick={() => setSelectedFile(file)}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{file.name}</span>
                          <Badge variant="outline" className={cn("ml-auto text-xs", categoryColors[file.category])}>
                            {file.category}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  // Show full file tree
                  <div className="space-y-1">{renderFileTree(fileSystem)}</div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* File Details Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                File Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {selectedFile.icon && <selectedFile.icon className="h-5 w-5 text-muted-foreground" />}
                    <h3 className="font-semibold">{selectedFile.name}</h3>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Path:</span>
                      <code className="ml-2 px-1 py-0.5 bg-muted rounded text-xs">{selectedFile.path}</code>
                    </div>

                    {selectedFile.size && (
                      <div>
                        <span className="font-medium">Size:</span>
                        <span className="ml-2">{selectedFile.size}</span>
                      </div>
                    )}

                    {selectedFile.modified && (
                      <div>
                        <span className="font-medium">Modified:</span>
                        <span className="ml-2">{selectedFile.modified}</span>
                      </div>
                    )}

                    <div>
                      <span className="font-medium">Category:</span>
                      <Badge variant="outline" className={cn("ml-2 text-xs", categoryColors[selectedFile.category])}>
                        {selectedFile.category}
                      </Badge>
                    </div>

                    {selectedFile.description && (
                      <div>
                        <span className="font-medium">Description:</span>
                        <p className="ml-2 text-muted-foreground">{selectedFile.description}</p>
                      </div>
                    )}

                    {selectedFile.route && (
                      <div>
                        <span className="font-medium">Route:</span>
                        <code className="ml-2 px-1 py-0.5 bg-muted rounded text-xs">{selectedFile.route}</code>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-2">
                    {selectedFile.route && (
                      <Link href={selectedFile.route}>
                        <Button variant="outline" size="sm" className="justify-start bg-transparent w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          Open Module
                        </Button>
                      </Link>
                    )}
                    <Button variant="outline" size="sm" className="justify-start bg-transparent">
                      <Eye className="h-4 w-4 mr-2" />
                      View File
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start bg-transparent">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start bg-transparent">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Path
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a file to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
