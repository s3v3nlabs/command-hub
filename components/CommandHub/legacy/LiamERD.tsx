"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Database,
  LinkIcon,
  User,
  MapPin,
  Package,
  Search,
  Trash2,
  Eye,
  EyeOff,
  Zap,
  Edit3,
  Upload,
  Settings,
  Bell,
  UserCircle,
  Maximize2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EntityNode {
  id: string
  type: "person" | "place" | "item" | "data"
  title: string
  subtitle?: string
  description?: string
  photoUrl?: string
  metadata: Record<string, any>
  position: { x: number; y: number }
  connections: string[]
  status: "active" | "inactive" | "target" | "investigated"
  priority: "low" | "medium" | "high" | "critical"
}

interface Connection {
  id: string
  from: string
  to: string
  type: "related" | "associated" | "located" | "owns" | "knows" | "suspicious"
  strength: number
  metadata?: Record<string, any>
}

interface InvestigationData {
  nodes: EntityNode[]
  connections: Connection[]
}

const ENTITY_ICONS = {
  person: User,
  place: MapPin,
  item: Package,
  data: Database,
}

const CONNECTION_COLORS = {
  related: "#10b981", // green
  associated: "#3b82f6", // blue
  located: "#f59e0b", // amber
  owns: "#8b5cf6", // violet
  knows: "#06b6d4", // cyan
  suspicious: "#ef4444", // red
}

const PRIORITY_COLORS = {
  low: "#6b7280",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#dc2626",
}

export default function LiamERD() {
  const [investigationData, setInvestigationData] = useState<InvestigationData>({
    nodes: [],
    connections: [],
  })
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [editingNode, setEditingNode] = useState<EntityNode | null>(null)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [showConnections, setShowConnections] = useState(true)
  const [isCreatingConnection, setIsCreatingConnection] = useState(false)
  const [connectionStart, setConnectionStart] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize with mock investigation data
  useEffect(() => {
    const mockData: InvestigationData = {
      nodes: [
        {
          id: "person-1",
          type: "person",
          title: "JOHN MITCHELL",
          subtitle: "SUSPECT ALPHA",
          description:
            "Primary target - financial crimes investigation. Known for sophisticated money laundering operations through offshore accounts. Has connections to multiple shell companies and suspicious financial networks.",
          position: { x: 200, y: 150 },
          connections: ["person-2", "place-1", "item-1"],
          status: "target",
          priority: "critical",
          metadata: {
            age: 45,
            occupation: "Financial Advisor",
            lastSeen: "2024-01-15",
            riskLevel: "HIGH",
            aliases: ["J. Mitchell", "John M.", "JM Financial"],
            knownAssociates: 12,
            criminalHistory: "Financial fraud, Money laundering",
          },
        },
        {
          id: "person-2",
          type: "person",
          title: "SARAH CHEN",
          subtitle: "ASSOCIATE",
          description:
            "Known associate - frequent contact with primary target. Accountant with access to multiple financial systems. Suspected of facilitating transactions.",
          position: { x: 500, y: 200 },
          connections: ["person-1", "place-2"],
          status: "investigated",
          priority: "medium",
          metadata: {
            age: 38,
            occupation: "Accountant",
            relationship: "Business Partner",
            clearanceLevel: "Level 2",
            lastContact: "2024-01-12",
            suspicionLevel: "MODERATE",
          },
        },
        {
          id: "place-1",
          type: "place",
          title: "OFFSHORE BANK",
          subtitle: "CAYMAN ISLANDS",
          description:
            "Suspicious financial activity detected. Multiple large transactions processed through this location. Known for minimal oversight and privacy protection.",
          position: { x: 300, y: 350 },
          connections: ["person-1", "item-2"],
          status: "active",
          priority: "high",
          metadata: {
            address: "George Town, Cayman Islands",
            accountNumbers: ["ACC-001", "ACC-002", "ACC-003"],
            suspiciousTransactions: 15,
            totalAmount: "$2.4M",
            establishedDate: "2019-03-15",
            regulatoryStatus: "MINIMAL OVERSIGHT",
          },
        },
        {
          id: "item-1",
          type: "item",
          title: "ENCRYPTED DEVICE",
          subtitle: "SAMSUNG PHONE",
          description:
            "Seized during raid - contains encrypted communications between suspects. Advanced encryption detected. Forensic analysis ongoing.",
          position: { x: 100, y: 300 },
          connections: ["person-1"],
          status: "investigated",
          priority: "high",
          metadata: {
            serialNumber: "SM-G998B-001",
            encryptionType: "AES-256",
            lastAccessed: "2024-01-10",
            dataRecovered: "Partial",
            forensicStatus: "IN PROGRESS",
            evidenceTag: "EVID-2024-001",
          },
        },
      ],
      connections: [
        {
          id: "conn-1",
          from: "person-1",
          to: "person-2",
          type: "knows",
          strength: 0.9,
          metadata: { frequency: "Daily", duration: "2 years", method: "Phone, Email, In-person" },
        },
        {
          id: "conn-2",
          from: "person-1",
          to: "place-1",
          type: "owns",
          strength: 0.8,
          metadata: { accountType: "Primary", accessLevel: "Full", established: "2019-04-01" },
        },
        {
          id: "conn-3",
          from: "person-1",
          to: "item-1",
          type: "owns",
          strength: 1.0,
          metadata: { ownership: "Confirmed", seized: "2024-01-08", location: "Evidence locker" },
        },
      ],
    }
    setInvestigationData(mockData)
  }, [])

  const filteredNodes = investigationData.nodes.filter((node) => {
    const matchesSearch =
      node.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || node.type === filterType
    return matchesSearch && matchesFilter
  })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      if (isCreatingConnection) {
        if (!connectionStart) {
          setConnectionStart(nodeId)
        } else if (connectionStart !== nodeId) {
          const newConnection: Connection = {
            id: `conn-${Date.now()}`,
            from: connectionStart,
            to: nodeId,
            type: "related",
            strength: 0.5,
          }
          setInvestigationData((prev) => ({
            ...prev,
            connections: [...prev.connections, newConnection],
          }))
          setConnectionStart(null)
          setIsCreatingConnection(false)
        }
        return
      }

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      setDraggedNode(nodeId)
      setDragOffset({
        x: e.clientX - rect.left - investigationData.nodes.find((n) => n.id === nodeId)!.position.x,
        y: e.clientY - rect.top - investigationData.nodes.find((n) => n.id === nodeId)!.position.y,
      })
    },
    [isCreatingConnection, connectionStart, investigationData.nodes],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggedNode || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const newX = e.clientX - rect.left - dragOffset.x
      const newY = e.clientY - rect.top - dragOffset.y

      setInvestigationData((prev) => ({
        ...prev,
        nodes: prev.nodes.map((node) => (node.id === draggedNode ? { ...node, position: { x: newX, y: newY } } : node)),
      }))
    },
    [draggedNode, dragOffset],
  )

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null)
  }, [])

  const addNewNode = (type: EntityNode["type"]) => {
    const newNode: EntityNode = {
      id: `${type}-${Date.now()}`,
      type,
      title: `NEW ${type.toUpperCase()}`,
      subtitle: "UNCLASSIFIED",
      description: "Click edit to add details and information about this entity.",
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      connections: [],
      status: "inactive",
      priority: "low",
      metadata: {},
    }

    setInvestigationData((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }))
  }

  const deleteNode = (nodeId: string) => {
    setInvestigationData((prev) => ({
      nodes: prev.nodes.filter((n) => n.id !== nodeId),
      connections: prev.connections.filter((c) => c.from !== nodeId && c.to !== nodeId),
    }))
  }

  const updateNode = (updatedNode: EntityNode) => {
    setInvestigationData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) => (node.id === updatedNode.id ? updatedNode : node)),
    }))
    setEditingNode(null)
  }

  const handleImageUpload = (nodeId: string, file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      setInvestigationData((prev) => ({
        ...prev,
        nodes: prev.nodes.map((node) => (node.id === nodeId ? { ...node, photoUrl: imageUrl } : node)),
      }))
    }
    reader.readAsDataURL(file)
  }

  const renderConnections = () => {
    if (!showConnections) return null

    return investigationData.connections.map((connection) => {
      const fromNode = investigationData.nodes.find((n) => n.id === connection.from)
      const toNode = investigationData.nodes.find((n) => n.id === connection.to)

      if (!fromNode || !toNode) return null

      const fromX = fromNode.position.x + 150
      const fromY = fromNode.position.y + 125
      const toX = toNode.position.x + 150
      const toY = toNode.position.y + 125

      const color = CONNECTION_COLORS[connection.type] || "#6b7280"
      const strokeWidth = Math.max(1, connection.strength * 3)

      return (
        <line
          key={connection.id}
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={connection.type === "suspicious" ? "5,5" : "none"}
          opacity={0.7}
          className="pointer-events-none"
        />
      )
    })
  }

  return (
    <div className="h-full w-full bg-black/90 text-green-400 font-mono relative overflow-hidden">
      {/* Header Controls */}
      <div className="absolute top-4 right-4 z-30 flex items-center space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowNotifications(!showNotifications)}
          className="bg-black/80 border-green-500/30 text-green-400 hover:bg-green-900/30"
        >
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowSettings(!showSettings)}
          className="bg-black/80 border-green-500/30 text-green-400 hover:bg-green-900/30"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowProfile(!showProfile)}
          className="bg-black/80 border-green-500/30 text-green-400 hover:bg-green-900/30"
        >
          <UserCircle className="h-4 w-4" />
        </Button>
      </div>

      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-20 space-y-2">
        <div className="flex items-center space-x-2 bg-black/80 border border-green-500/30 rounded p-2">
          <Search className="h-4 w-4" />
          <Input
            placeholder="SEARCH ENTITIES..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-48 bg-transparent border-green-500/30 text-green-400 placeholder-green-600"
          />
        </div>

        <div className="flex items-center space-x-2 bg-black/80 border border-green-500/30 rounded p-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 bg-transparent border-green-500/30 text-green-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black border-green-500/30">
              <SelectItem value="all">ALL TYPES</SelectItem>
              <SelectItem value="person">PERSONS</SelectItem>
              <SelectItem value="place">PLACES</SelectItem>
              <SelectItem value="item">ITEMS</SelectItem>
              <SelectItem value="data">DATA</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant={showConnections ? "default" : "outline"}
            onClick={() => setShowConnections(!showConnections)}
            className="bg-green-900/50 border-green-500/30 text-green-400 hover:bg-green-800/50"
          >
            {showConnections ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            LINKS
          </Button>

          <Button
            size="sm"
            variant={isCreatingConnection ? "default" : "outline"}
            onClick={() => {
              setIsCreatingConnection(!isCreatingConnection)
              setConnectionStart(null)
            }}
            className="bg-red-900/50 border-red-500/30 text-red-400 hover:bg-red-800/50"
          >
            <Zap className="h-4 w-4" />
            CONNECT
          </Button>
        </div>
      </div>

      {/* Add Node Panel */}
      <div className="absolute top-4 left-80 z-20 space-y-2">
        <div className="bg-black/80 border border-green-500/30 rounded p-2 space-y-2">
          <div className="text-xs text-green-600 uppercase tracking-wider">ADD ENTITY</div>
          {(["person", "place", "item", "data"] as const).map((type) => {
            const Icon = ENTITY_ICONS[type]
            return (
              <Button
                key={type}
                size="sm"
                variant="outline"
                onClick={() => addNewNode(type)}
                className="w-full bg-transparent border-green-500/30 text-green-400 hover:bg-green-900/30"
              >
                <Icon className="h-4 w-4 mr-2" />
                {type.toUpperCase()}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Connection SVG Layer */}
        <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {renderConnections()}
        </svg>

        {/* Entity Nodes */}
        {filteredNodes.map((node) => {
          const Icon = ENTITY_ICONS[node.type]
          const priorityColor = PRIORITY_COLORS[node.priority]

          return (
            <div
              key={node.id}
              className={cn(
                "absolute w-80 h-56 cursor-move transition-all duration-200",
                selectedNode === node.id && "scale-105 z-10",
                isCreatingConnection && connectionStart === node.id && "ring-2 ring-yellow-500",
                draggedNode === node.id && "z-20",
              )}
              style={{
                left: node.position.x,
                top: node.position.y,
                zIndex: selectedNode === node.id ? 10 : 2,
              }}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
            >
              {/* Glass Card */}
              <div className="w-full h-full bg-black/40 backdrop-blur-sm border border-green-500/30 rounded-lg overflow-hidden shadow-lg shadow-green-900/20">
                {/* Header */}
                <div
                  className="h-8 flex items-center justify-between px-3 text-xs"
                  style={{ backgroundColor: `${priorityColor}20`, borderBottom: `1px solid ${priorityColor}40` }}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-3 w-3" style={{ color: priorityColor }} />
                    <span className="text-green-400 font-bold tracking-wider">{node.type.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          node.status === "target" ? "#ef4444" : node.status === "active" ? "#10b981" : "#6b7280",
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingNode(node)
                      }}
                      className="h-4 w-4 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNode(node.id)
                      }}
                      className="h-4 w-4 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/30"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Photo/Wireframe Area */}
                <div className="h-24 bg-green-900/10 border-b border-green-500/20 flex items-center justify-center relative group">
                  {node.photoUrl ? (
                    <img
                      src={node.photoUrl || "/placeholder.svg"}
                      alt={node.title}
                      className="w-full h-full object-cover opacity-80"
                    />
                  ) : (
                    <div className="w-20 h-20 border-2 border-dashed border-green-500/40 rounded flex items-center justify-center">
                      <Icon className="h-10 w-10 text-green-500/60" />
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      fileInputRef.current?.click()
                    }}
                    className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/60 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Upload className="h-3 w-3" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(node.id, file)
                    }}
                  />
                </div>

                {/* Content */}
                <div className="p-3 space-y-1 h-32 overflow-y-auto">
                  <div className="text-sm font-bold text-green-300 tracking-wider truncate">{node.title}</div>
                  {node.subtitle && (
                    <div className="text-xs text-green-600 uppercase tracking-wider truncate">{node.subtitle}</div>
                  )}
                  <div className="text-xs text-green-500/80 line-clamp-3">{node.description}</div>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(node.metadata)
                      .slice(0, 4)
                      .map(([key, value]) => (
                        <Badge
                          key={key}
                          variant="outline"
                          className="text-xs bg-green-900/30 border-green-500/30 text-green-400"
                        >
                          {key}: {String(value).slice(0, 8)}
                        </Badge>
                      ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between text-xs">
                  <div className="text-green-600">
                    <LinkIcon className="h-3 w-3 inline mr-1" />
                    {node.connections.length}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedNode(selectedNode === node.id ? null : node.id)
                    }}
                    className="h-4 w-4 p-0 text-green-400 hover:text-green-300"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit Node Dialog */}
      {editingNode && (
        <Dialog open={!!editingNode} onOpenChange={() => setEditingNode(null)}>
          <DialogContent className="bg-black/90 border-green-500/30 text-green-400 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-green-300 font-mono">
                EDIT ENTITY: {editingNode.type.toUpperCase()}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-green-600 uppercase tracking-wider">Title</label>
                  <Input
                    value={editingNode.title}
                    onChange={(e) => setEditingNode({ ...editingNode, title: e.target.value })}
                    className="bg-transparent border-green-500/30 text-green-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-green-600 uppercase tracking-wider">Subtitle</label>
                  <Input
                    value={editingNode.subtitle || ""}
                    onChange={(e) => setEditingNode({ ...editingNode, subtitle: e.target.value })}
                    className="bg-transparent border-green-500/30 text-green-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-green-600 uppercase tracking-wider">Description</label>
                <Textarea
                  value={editingNode.description || ""}
                  onChange={(e) => setEditingNode({ ...editingNode, description: e.target.value })}
                  className="bg-transparent border-green-500/30 text-green-400 h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-green-600 uppercase tracking-wider">Status</label>
                  <Select
                    value={editingNode.status}
                    onValueChange={(value: EntityNode["status"]) => setEditingNode({ ...editingNode, status: value })}
                  >
                    <SelectTrigger className="bg-transparent border-green-500/30 text-green-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-green-500/30">
                      <SelectItem value="active">ACTIVE</SelectItem>
                      <SelectItem value="inactive">INACTIVE</SelectItem>
                      <SelectItem value="target">TARGET</SelectItem>
                      <SelectItem value="investigated">INVESTIGATED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-green-600 uppercase tracking-wider">Priority</label>
                  <Select
                    value={editingNode.priority}
                    onValueChange={(value: EntityNode["priority"]) =>
                      setEditingNode({ ...editingNode, priority: value })
                    }
                  >
                    <SelectTrigger className="bg-transparent border-green-500/30 text-green-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-green-500/30">
                      <SelectItem value="low">LOW</SelectItem>
                      <SelectItem value="medium">MEDIUM</SelectItem>
                      <SelectItem value="high">HIGH</SelectItem>
                      <SelectItem value="critical">CRITICAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingNode(null)}
                  className="bg-transparent border-green-500/30 text-green-400"
                >
                  CANCEL
                </Button>
                <Button
                  onClick={() => updateNode(editingNode)}
                  className="bg-green-900/50 border-green-500/30 text-green-400 hover:bg-green-800/50"
                >
                  SAVE CHANGES
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="bg-black/80 border border-green-500/30 rounded p-2 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <span>ENTITIES: {investigationData.nodes.length}</span>
            <span>CONNECTIONS: {investigationData.connections.length}</span>
            <span>FILTERED: {filteredNodes.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            {isCreatingConnection && (
              <span className="text-yellow-400 animate-pulse">
                {connectionStart ? "SELECT TARGET NODE" : "SELECT SOURCE NODE"}
              </span>
            )}
            <span className="text-green-600">INVESTIGATION MATRIX ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  )
}
