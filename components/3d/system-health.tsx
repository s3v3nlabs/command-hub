"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Text } from "@react-three/drei"
import type * as THREE from "three"
import { useTheme } from "next-themes"

// Safe array creation helper
const createSafeArray = (length: number) => {
  const safeLength = Math.max(0, Math.floor(length) || 0)
  return new Array(safeLength)
}

// CPU Usage Visualization
const CpuUsage = ({ position = [0, 0, 0] }: { position?: [number, number, number] }) => {
  const [usage, setUsage] = useState<number[]>([])
  const meshRef = useRef<THREE.Mesh>(null)

  // Generate CPU usage data
  useEffect(() => {
    try {
      // Generate 10 data points safely
      const data = createSafeArray(10)
        .fill(0)
        .map(() => Math.random() * 0.8 + 0.2)
      setUsage(data)
    } catch (error) {
      console.error("Error generating CPU data:", error)
      setUsage([0.5, 0.5, 0.5]) // Fallback
    }
  }, [])

  // Animation
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.2
    }
  })

  // Validate position
  const safePosition: [number, number, number] = [
    isNaN(position[0]) ? 0 : position[0],
    isNaN(position[1]) ? 0 : position[1],
    isNaN(position[2]) ? 0 : position[2],
  ]

  return (
    <group position={safePosition}>
      <Text position={[0, 2, 0]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
        CPU Usage
      </Text>

      <mesh ref={meshRef}>
        {usage.map((value, index) => {
          // Ensure value is valid
          const safeValue = isNaN(value) ? 0.5 : Math.max(0.1, Math.min(1, value))
          const angle = (index / usage.length) * Math.PI * 2
          const x = Math.cos(angle) * 1.5
          const z = Math.sin(angle) * 1.5

          return (
            <mesh key={index} position={[x, 0, z]}>
              <boxGeometry args={[0.3, safeValue * 2, 0.3]} />
              <meshStandardMaterial color={safeValue > 0.8 ? "#ef4444" : safeValue > 0.6 ? "#f59e0b" : "#22d3ee"} />
            </mesh>
          )
        })}
      </mesh>
    </group>
  )
}

// Memory Usage Visualization
const MemoryUsage = ({ position = [0, 0, 0] }: { position?: [number, number, number] }) => {
  const [memoryData, setMemoryData] = useState<{ used: number; total: number }>({ used: 0, total: 0 })

  // Generate memory data
  useEffect(() => {
    try {
      const total = 32 // GB
      const used = Math.random() * 24 + 4 // 4-28 GB used
      setMemoryData({ used, total })
    } catch (error) {
      console.error("Error generating memory data:", error)
      setMemoryData({ used: 16, total: 32 }) // Fallback
    }
  }, [])

  // Validate position
  const safePosition: [number, number, number] = [
    isNaN(position[0]) ? 0 : position[0],
    isNaN(position[1]) ? 0 : position[1],
    isNaN(position[2]) ? 0 : position[2],
  ]

  // Calculate percentage safely
  const percentage = memoryData.total > 0 ? memoryData.used / memoryData.total : 0.5
  const safePercentage = isNaN(percentage) ? 0.5 : Math.max(0, Math.min(1, percentage))

  return (
    <group position={safePosition}>
      <Text position={[0, 2, 0]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
        Memory Usage
      </Text>

      <mesh>
        {/* Total memory cylinder (outline) */}
        <cylinderGeometry args={[1, 1, 2, 32]} />
        <meshStandardMaterial color="#1e293b" wireframe={true} />
      </mesh>

      <mesh position={[0, (safePercentage - 1) * 1, 0]}>
        {/* Used memory cylinder (filled) */}
        <cylinderGeometry args={[1, 1, safePercentage * 2, 32]} />
        <meshStandardMaterial color={safePercentage > 0.8 ? "#ef4444" : safePercentage > 0.6 ? "#f59e0b" : "#22d3ee"} />
      </mesh>

      <Text position={[0, 0, 1.2]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
        {`${Math.round(memoryData.used)}/${memoryData.total} GB`}
      </Text>
    </group>
  )
}

// Network Activity Visualization
const NetworkActivity = ({ position = [0, 0, 0] }: { position?: [number, number, number] }) => {
  const [networkData, setNetworkData] = useState<{
    points: Array<{ x: number; y: number; z: number; value: number }>
    status: "normal" | "high" | "critical"
  }>({
    points: [],
    status: "normal",
  })

  // Generate network data
  useEffect(() => {
    try {
      // Generate network points safely (limit to 10 points to prevent overflow)
      const count = Math.min(10, Math.floor(Math.random() * 5) + 5)
      const points = createSafeArray(count)
        .fill(null)
        .map((_, i) => {
          const angle = (i / Math.max(1, count)) * Math.PI * 2
          const radius = 1 + Math.random() * 0.5
          return {
            x: Math.cos(angle) * radius,
            y: (Math.random() - 0.5) * 1.5,
            z: Math.sin(angle) * radius,
            value: Math.random() * 100, // Mbps
          }
        })

      // Calculate average bandwidth
      const totalBandwidth = points.reduce((sum, point) => sum + point.value, 0)
      const avgBandwidth = points.length > 0 ? totalBandwidth / points.length : 0

      // Determine status
      let status: "normal" | "high" | "critical" = "normal"
      if (avgBandwidth > 80) status = "critical"
      else if (avgBandwidth > 50) status = "high"

      setNetworkData({ points, status })
    } catch (error) {
      console.error("Error generating network data:", error)
      // Fallback to empty data
      setNetworkData({ points: [], status: "normal" })
    }
  }, [])

  // Animation
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.1
    }
  })

  // Validate position
  const safePosition: [number, number, number] = [
    isNaN(position[0]) ? 0 : position[0],
    isNaN(position[1]) ? 0 : position[1],
    isNaN(position[2]) ? 0 : position[2],
  ]

  // Status colors
  const statusColors = {
    normal: "#22d3ee",
    high: "#f59e0b",
    critical: "#ef4444",
  }

  return (
    <group position={safePosition}>
      <Text position={[0, 2, 0]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
        Network Activity
      </Text>

      <group ref={groupRef}>
        {/* Central node */}
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color={statusColors[networkData.status]} />
        </mesh>

        {/* Network points */}
        {networkData.points.map((point, index) => {
          // Ensure values are valid
          const safeX = isNaN(point.x) ? 0 : point.x
          const safeY = isNaN(point.y) ? 0 : point.y
          const safeZ = isNaN(point.z) ? 0 : point.z
          const safeValue = isNaN(point.value) ? 50 : point.value

          // Scale size based on value (safely)
          const size = Math.max(0.1, Math.min(0.4, safeValue / 250))

          return (
            <group key={index}>
              {/* Connection line */}
              <line>
                <bufferGeometry attach="geometry">
                  <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    array={new Float32Array([0, 0, 0, safeX, safeY, safeZ])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial attach="material" color={statusColors[networkData.status]} />
              </line>

              {/* Endpoint */}
              <mesh position={[safeX, safeY, safeZ]}>
                <sphereGeometry args={[size, 8, 8]} />
                <meshStandardMaterial color={statusColors[networkData.status]} />
              </mesh>
            </group>
          )
        })}
      </group>

      <Text position={[0, -2, 0]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
        {`Status: ${networkData.status.toUpperCase()}`}
      </Text>
    </group>
  )
}

// Main component
export function SystemHealth() {
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

        <CpuUsage position={[-5, 0, 0]} />
        <MemoryUsage position={[0, 0, 0]} />
        <NetworkActivity position={[5, 0, 0]} />

        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
      </Canvas>
    </div>
  )
}
