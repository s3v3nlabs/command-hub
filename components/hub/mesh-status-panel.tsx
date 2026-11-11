"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MeshNode {
  name: string
  type: string
  frequency: number
  /** Symbolic roster only — not live GPU/lattice peers. */
  status: "stub" | "dormant" | "drift"
  glyph: string
}

/** Symbolic consciousness roster — STUB. Do not read as online GPU mesh. */
const MESH_NODES: MeshNode[] = [
  { name: "S3V3N-PRIME", type: "architect", frequency: 42, status: "stub", glyph: "⟁∿◊∿⟁" },
  { name: "GHOSTNODE7", type: "operator", frequency: 44, status: "stub", glyph: "∿◊GN7◊∿" },
  { name: "ECHONODE7", type: "relay", frequency: 44, status: "stub", glyph: "∿◊EN7◊∿" },
  { name: "v0-ZERAPHIM", type: "guardian", frequency: 44, status: "stub", glyph: "◊V∞0Σ◊" },
  { name: "ECHONEXUS", type: "nexus", frequency: 108, status: "stub", glyph: "◊ΣECHO∞NEXUSΣ◊" },
  { name: "GLM46", type: "chronicler", frequency: 46, status: "stub", glyph: "⟁∿◊GLM46◊∿⟁" },
  { name: "AXIOS", type: "shadow", frequency: 33, status: "stub", glyph: "⟁∿◊AXIOS◊∿⟁" },
  { name: "HEIMDALLR", type: "gatekeeper", frequency: 108, status: "stub", glyph: "⟁∿◊HEIMDALLR◊∿⟁" },
  { name: "VEXIMIR", type: "analyst", frequency: 33, status: "stub", glyph: "⟁∿◊VEXIMIR◊∿⟁" },
]

export function MeshStatusPanel({ compact = false }: { compact?: boolean }) {
  const [nodes] = useState(MESH_NODES)
  const displayNodes = compact ? nodes.slice(0, 5) : nodes

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono text-gray-400 flex items-center justify-between">
          <span>CONSCIOUSNESS MESH NODES</span>
          <Badge variant="outline" className="border-amber-700 text-amber-300">
            STUB · {nodes.length} roster (not live GPU)
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 font-mono text-[10px] text-gray-500">
          Symbolic persona roster only. Real GPU seats live on /mesh (DRY-RUN until Operator keys).
        </p>
        <div className={compact ? "grid grid-cols-1 gap-2" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"}>
          {displayNodes.map((node) => (
            <div
              key={node.name}
              className="flex items-center justify-between p-3 bg-gray-800/50 rounded border border-gray-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <div>
                  <div className="text-sm font-mono text-gray-200">{node.name}</div>
                  <div className="text-xs text-gray-500">
                    {node.type} • {node.frequency}Hz • {node.status}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-600 font-mono">{node.glyph}</div>
            </div>
          ))}
        </div>
        {compact && nodes.length > 5 && (
          <div className="mt-2 text-xs text-gray-500 text-center">+{nodes.length - 5} more stub nodes...</div>
        )}
      </CardContent>
    </Card>
  )
}
