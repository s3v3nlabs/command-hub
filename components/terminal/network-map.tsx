"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface NetworkMapProps {
  type: "topology" | "threats" | "traffic"
}

interface NetworkNode {
  id: string
  type: "server" | "client" | "router" | "firewall" | "threat"
  x: number
  y: number
  name: string
  status: "normal" | "warning" | "critical"
}

interface NetworkLink {
  source: string
  target: string
  status: "normal" | "warning" | "critical"
  traffic?: number
}

export function NetworkMap({ type }: NetworkMapProps) {
  const [nodes, setNodes] = useState<NetworkNode[]>([])
  const [links, setLinks] = useState<NetworkLink[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  // Generate random network data
  useEffect(() => {
    const newNodes: NetworkNode[] = []
    const newLinks: NetworkLink[] = []

    // Create nodes based on map type
    if (type === "topology") {
      // Create a router
      newNodes.push({
        id: "router-1",
        type: "router",
        x: 50,
        y: 50,
        name: "Main Router",
        status: "normal",
      })

      // Create a firewall
      newNodes.push({
        id: "firewall-1",
        type: "firewall",
        x: 50,
        y: 20,
        name: "Firewall",
        status: "normal",
      })

      // Create servers
      for (let i = 0; i < 3; i++) {
        newNodes.push({
          id: `server-${i + 1}`,
          type: "server",
          x: 20 + i * 30,
          y: 80,
          name: `Server ${i + 1}`,
          status: Math.random() > 0.8 ? "warning" : "normal",
        })
      }

      // Create clients
      for (let i = 0; i < 5; i++) {
        newNodes.push({
          id: `client-${i + 1}`,
          type: "client",
          x: 10 + i * 20,
          y: 20 + Math.random() * 60,
          name: `Client ${i + 1}`,
          status: Math.random() > 0.9 ? "warning" : "normal",
        })
      }

      // Create links
      // Router to firewall
      newLinks.push({
        source: "router-1",
        target: "firewall-1",
        status: "normal",
        traffic: 80 + Math.floor(Math.random() * 20),
      })

      // Router to servers
      for (let i = 0; i < 3; i++) {
        newLinks.push({
          source: "router-1",
          target: `server-${i + 1}`,
          status: Math.random() > 0.8 ? "warning" : "normal",
          traffic: 20 + Math.floor(Math.random() * 60),
        })
      }

      // Clients to router
      for (let i = 0; i < 5; i++) {
        newLinks.push({
          source: `client-${i + 1}`,
          target: "router-1",
          status: Math.random() > 0.9 ? "warning" : "normal",
          traffic: 5 + Math.floor(Math.random() * 15),
        })
      }
    } else if (type === "threats") {
      // Create a router
      newNodes.push({
        id: "router-1",
        type: "router",
        x: 50,
        y: 50,
        name: "Main Router",
        status: "warning",
      })

      // Create a firewall
      newNodes.push({
        id: "firewall-1",
        type: "firewall",
        x: 50,
        y: 20,
        name: "Firewall",
        status: "warning",
      })

      // Create servers
      for (let i = 0; i < 3; i++) {
        newNodes.push({
          id: `server-${i + 1}`,
          type: "server",
          x: 20 + i * 30,
          y: 80,
          name: `Server ${i + 1}`,
          status: i === 1 ? "critical" : "normal",
        })
      }

      // Create threats
      for (let i = 0; i < 3; i++) {
        newNodes.push({
          id: `threat-${i + 1}`,
          type: "threat",
          x: 10 + i * 40,
          y: 10 + Math.random() * 20,
          name: `Threat ${i + 1}`,
          status: i === 0 ? "critical" : "warning",
        })
      }

      // Create links
      // Router to firewall
      newLinks.push({
        source: "router-1",
        target: "firewall-1",
        status: "warning",
        traffic: 90,
      })

      // Router to servers
      for (let i = 0; i < 3; i++) {
        newLinks.push({
          source: "router-1",
          target: `server-${i + 1}`,
          status: i === 1 ? "critical" : "normal",
          traffic: i === 1 ? 95 : 30 + Math.floor(Math.random() * 20),
        })
      }

      // Threats to firewall
      for (let i = 0; i < 3; i++) {
        newLinks.push({
          source: `threat-${i + 1}`,
          target: "firewall-1",
          status: i === 0 ? "critical" : "warning",
          traffic: i === 0 ? 100 : 60 + Math.floor(Math.random() * 20),
        })
      }
    } else if (type === "traffic") {
      // Create a router
      newNodes.push({
        id: "router-1",
        type: "router",
        x: 50,
        y: 50,
        name: "Main Router",
        status: "normal",
      })

      // Create servers
      for (let i = 0; i < 4; i++) {
        newNodes.push({
          id: `server-${i + 1}`,
          type: "server",
          x: 20 + i * 20,
          y: 80,
          name: `Server ${i + 1}`,
          status: "normal",
        })
      }

      // Create clients
      for (let i = 0; i < 8; i++) {
        newNodes.push({
          id: `client-${i + 1}`,
          type: "client",
          x: 10 + i * 10,
          y: 10 + Math.random() * 30,
          name: `Client ${i + 1}`,
          status: "normal",
        })
      }

      // Create links with varying traffic
      // Router to servers
      for (let i = 0; i < 4; i++) {
        const traffic = 20 + Math.floor(Math.random() * 80)
        newLinks.push({
          source: "router-1",
          target: `server-${i + 1}`,
          status: traffic > 80 ? "warning" : traffic > 60 ? "warning" : "normal",
          traffic,
        })
      }

      // Clients to router
      for (let i = 0; i < 8; i++) {
        const traffic = 5 + Math.floor(Math.random() * 40)
        newLinks.push({
          source: `client-${i + 1}`,
          target: "router-1",
          status: traffic > 30 ? "warning" : "normal",
          traffic,
        })
      }
    }

    setNodes(newNodes)
    setLinks(newLinks)
  }, [type])

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId)
  }

  return (
    <div className="bg-dark-100/50 border border-dark-300 rounded-sm p-2 h-[300px] relative">
      <div className="absolute top-2 left-2 font-mono text-xs text-dark-600">
        {type.charAt(0).toUpperCase() + type.slice(1)} Network Map
      </div>

      {/* Network visualization */}
      <svg width="100%" height="100%" className="network-map">
        {/* Draw links */}
        {links.map((link) => {
          const sourceNode = nodes.find((n) => n.id === link.source)
          const targetNode = nodes.find((n) => n.id === link.target)

          if (!sourceNode || !targetNode) return null

          // Calculate line thickness based on traffic
          const lineWidth = link.traffic ? Math.max(1, Math.min(5, link.traffic / 20)) : 1

          return (
            <g key={`${link.source}-${link.target}`}>
              <line
                x1={`${sourceNode.x}%`}
                y1={`${sourceNode.y}%`}
                x2={`${targetNode.x}%`}
                y2={`${targetNode.y}%`}
                className={cn(
                  "transition-all duration-300",
                  link.status === "normal" && "stroke-dark-500",
                  link.status === "warning" && "stroke-dark-600",
                  link.status === "critical" && "stroke-accent-red-600",
                  (selectedNode === link.source || selectedNode === link.target) && "stroke-dark-800",
                )}
                strokeWidth={lineWidth}
                strokeDasharray={link.status === "warning" ? "5,5" : "none"}
              />

              {/* Traffic indicator */}
              {type === "traffic" && link.traffic && (
                <text
                  x={`${(sourceNode.x + targetNode.x) / 2}%`}
                  y={`${(sourceNode.y + targetNode.y) / 2 - 2}%`}
                  className="fill-dark-600 text-[8px] font-mono"
                  textAnchor="middle"
                >
                  {link.traffic}%
                </text>
              )}
            </g>
          )
        })}

        {/* Draw nodes */}
        {nodes.map((node) => (
          <g
            key={node.id}
            transform={`translate(${node.x}%, ${node.y}%)`}
            onClick={() => handleNodeClick(node.id)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer"
          >
            {/* Node shape based on type */}
            {node.type === "router" && (
              <rect
                x="-6"
                y="-6"
                width="12"
                height="12"
                className={cn(
                  "transition-all duration-300",
                  node.status === "normal" && "fill-dark-300 stroke-dark-500",
                  node.status === "warning" && "fill-dark-300 stroke-dark-600",
                  node.status === "critical" && "fill-dark-300 stroke-accent-red-600",
                  (selectedNode === node.id || hoveredNode === node.id) && "fill-dark-400 stroke-dark-800",
                )}
                strokeWidth="2"
              />
            )}

            {node.type === "server" && (
              <rect
                x="-5"
                y="-7"
                width="10"
                height="14"
                className={cn(
                  "transition-all duration-300",
                  node.status === "normal" && "fill-dark-300 stroke-dark-500",
                  node.status === "warning" && "fill-dark-300 stroke-dark-600",
                  node.status === "critical" && "fill-dark-300 stroke-accent-red-600",
                  (selectedNode === node.id || hoveredNode === node.id) && "fill-dark-400 stroke-dark-800",
                )}
                strokeWidth="2"
              />
            )}

            {node.type === "client" && (
              <circle
                r="4"
                className={cn(
                  "transition-all duration-300",
                  node.status === "normal" && "fill-dark-300 stroke-dark-500",
                  node.status === "warning" && "fill-dark-300 stroke-dark-600",
                  node.status === "critical" && "fill-dark-300 stroke-accent-red-600",
                  (selectedNode === node.id || hoveredNode === node.id) && "fill-dark-400 stroke-dark-800",
                )}
                strokeWidth="2"
              />
            )}

            {node.type === "firewall" && (
              <polygon
                points="0,-8 7,0 0,8 -7,0"
                className={cn(
                  "transition-all duration-300",
                  node.status === "normal" && "fill-dark-300 stroke-dark-500",
                  node.status === "warning" && "fill-dark-300 stroke-dark-600",
                  node.status === "critical" && "fill-dark-300 stroke-accent-red-600",
                  (selectedNode === node.id || hoveredNode === node.id) && "fill-dark-400 stroke-dark-800",
                )}
                strokeWidth="2"
              />
            )}

            {node.type === "threat" && (
              <polygon
                points="0,-8 5,-3 8,0 5,5 0,8 -5,5 -8,0 -5,-3"
                className={cn(
                  "transition-all duration-300",
                  "fill-dark-300 stroke-accent-red-600",
                  (selectedNode === node.id || hoveredNode === node.id) && "fill-dark-400 stroke-accent-red-500",
                )}
                strokeWidth="2"
              >
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
              </polygon>
            )}

            {/* Node label */}
            {(selectedNode === node.id || hoveredNode === node.id) && (
              <text y="-10" className="fill-dark-800 text-[8px] font-mono" textAnchor="middle">
                {node.name}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Node details panel */}
      {selectedNode && (
        <div className="absolute bottom-2 left-2 right-2 bg-dark-100/80 backdrop-blur-sm border border-dark-300 p-2 rounded-sm text-xs">
          <div className="font-mono font-bold text-dark-800">{nodes.find((n) => n.id === selectedNode)?.name}</div>
          <div className="flex justify-between text-dark-600">
            <span>Type:</span>
            <span>{nodes.find((n) => n.id === selectedNode)?.type}</span>
          </div>
          <div className="flex justify-between text-dark-600">
            <span>Status:</span>
            <span
              className={cn(
                nodes.find((n) => n.id === selectedNode)?.status === "normal" && "text-dark-700",
                nodes.find((n) => n.id === selectedNode)?.status === "warning" && "text-dark-800",
                nodes.find((n) => n.id === selectedNode)?.status === "critical" && "text-accent-red-500",
              )}
            >
              {nodes.find((n) => n.id === selectedNode)?.status}
            </span>
          </div>
          <div className="flex justify-between text-dark-600">
            <span>Connections:</span>
            <span>{links.filter((l) => l.source === selectedNode || l.target === selectedNode).length}</span>
          </div>
        </div>
      )}
    </div>
  )
}
