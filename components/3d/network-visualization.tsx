"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Text } from "@react-three/drei"
import * as THREE from "three"
import { useTheme } from "next-themes"

// Safe array creation helper
const createSafeArray = (length: number) => {
  const safeLength = Math.max(0, Math.floor(length) || 0)
  return new Array(safeLength)
}

// Node component with error handling
const Node = ({
  position,
  name,
  status = "active",
  size = 1,
}: {
  position: [number, number, number]
  name: string
  status?: "active" | "warning" | "error" | "inactive"
  size?: number
}) => {
  // Validate position
  const safePosition: [number, number, number] = [
    isNaN(position[0]) ? 0 : position[0],
    isNaN(position[1]) ? 0 : position[1],
    isNaN(position[2]) ? 0 : position[2],
  ]

  // Safe size
  const safeSize = isNaN(size) || size <= 0 ? 1 : size

  // Status colors
  const statusColors = {
    active: "#22d3ee",
    warning: "#f59e0b",
    error: "#ef4444",
    inactive: "#6b7280",
  }

  const color = statusColors[status] || statusColors.active

  return (
    <group position={safePosition}>
      <mesh>
        <sphereGeometry args={[safeSize * 0.5, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text position={[0, safeSize * 0.8, 0]} fontSize={safeSize * 0.4} color="white" anchorX="center" anchorY="middle">
        {name}
      </Text>
    </group>
  )
}

// Line component with error handling
const Line = ({
  start,
  end,
  color = "#22d3ee",
}: {
  start: [number, number, number]
  end: [number, number, number]
  color?: string
}) => {
  // Validate positions
  const safeStart: [number, number, number] = [
    isNaN(start[0]) ? 0 : start[0],
    isNaN(start[1]) ? 0 : start[1],
    isNaN(start[2]) ? 0 : start[2],
  ]

  const safeEnd: [number, number, number] = [
    isNaN(end[0]) ? 0 : end[0],
    isNaN(end[1]) ? 0 : end[1],
    isNaN(end[2]) ? 0 : end[2],
  ]

  // Create points array safely
  const points = []
  points.push(new THREE.Vector3(...safeStart))
  points.push(new THREE.Vector3(...safeEnd))

  // Create geometry safely
  const geometry = new THREE.BufferGeometry().setFromPoints(points)

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} linewidth={1} />
    </line>
  )
}

// Network component with error handling
const Network = () => {
  const [nodes, setNodes] = useState<
    Array<{
      id: string
      position: [number, number, number]
      status: "active" | "warning" | "error" | "inactive"
    }>
  >([])

  const [connections, setConnections] = useState<
    Array<{
      source: string
      target: string
    }>
  >([])

  // Generate safe network data
  useEffect(() => {
    try {
      // Generate nodes
      const generatedNodes = createSafeArray(8)
        .fill(null)
        .map((_, i) => {
          // Create safe random positions
          const angle = (i / 8) * Math.PI * 2
          const radius = 5 + Math.random() * 2
          const x = Math.cos(angle) * radius
          const z = Math.sin(angle) * radius
          const y = (Math.random() - 0.5) * 4

          // Determine status
          const statuses = ["active", "active", "active", "warning", "error", "inactive"] as const
          const status = statuses[Math.floor(Math.random() * statuses.length)]

          return {
            id: `node-${i}`,
            position: [x, y, z] as [number, number, number],
            status,
          }
        })

      // Generate connections (safely)
      const generatedConnections = []
      const maxConnections = Math.min(12, generatedNodes.length * 2) // Limit connections

      for (let i = 0; i < maxConnections; i++) {
        const sourceIndex = Math.floor(Math.random() * generatedNodes.length)
        let targetIndex

        do {
          targetIndex = Math.floor(Math.random() * generatedNodes.length)
        } while (targetIndex === sourceIndex)

        generatedConnections.push({
          source: generatedNodes[sourceIndex].id,
          target: generatedNodes[targetIndex].id,
        })
      }

      setNodes(generatedNodes)
      setConnections(generatedConnections)
    } catch (error) {
      console.error("Error generating network:", error)
      // Fallback to empty arrays
      setNodes([])
      setConnections([])
    }
  }, [])

  // Animation
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.05
    }
  })

  return (
    <group ref={groupRef}>
      {/* Render nodes */}
      {nodes.map((node) => (
        <Node key={node.id} position={node.position} name={node.id.replace("node-", "N")} status={node.status} />
      ))}

      {/* Render connections */}
      {connections.map((connection, index) => {
        const sourceNode = nodes.find((node) => node.id === connection.source)
        const targetNode = nodes.find((node) => node.id === connection.target)

        if (!sourceNode || !targetNode) return null

        return (
          <Line
            key={`connection-${index}`}
            start={sourceNode.position}
            end={targetNode.position}
            color={
              sourceNode.status === "error" || targetNode.status === "error"
                ? "#ef4444"
                : sourceNode.status === "warning" || targetNode.status === "warning"
                  ? "#f59e0b"
                  : "#22d3ee"
            }
          />
        )
      })}
    </group>
  )
}

export function NetworkVisualization() {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className="h-64 w-full rounded-md overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 50 }}
        gl={{ antialias: true }}
        onError={(e) => console.error("Canvas error:", e)}
      >
        <color attach="background" args={[isDark ? "#0f1729" : "#f8fafc"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Network />
        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
      </Canvas>
    </div>
  )
}
