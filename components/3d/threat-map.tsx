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

// Earth component with simplified approach - NO TEXTURE LOADING
const Earth = () => {
  const earthRef = useRef<THREE.Mesh>(null)

  // Rotation animation
  useFrame(({ clock }) => {
    if (earthRef.current) {
      earthRef.current.rotation.y = clock.getElapsedTime() * 0.1
    }
  })

  // Create a simple earth with colors instead of textures
  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshStandardMaterial
        color="#1e3a8a"
        emissive="#3b82f6"
        emissiveIntensity={0.2}
        roughness={0.7}
        metalness={0.3}
      />
    </mesh>
  )
}

// Threat point component
const ThreatPoint = ({
  position,
  size = 0.1,
  color = "#ef4444",
  pulse = true,
}: {
  position: [number, number, number]
  size?: number
  color?: string
  pulse?: boolean
}) => {
  const pointRef = useRef<THREE.Mesh>(null)

  // Validate position
  const safePosition: [number, number, number] = [
    isNaN(position[0]) ? 0 : position[0],
    isNaN(position[1]) ? 0 : position[1],
    isNaN(position[2]) ? 0 : position[2],
  ]

  // Validate size
  const safeSize = isNaN(size) || size <= 0 ? 0.1 : size

  // Pulse animation
  useFrame(({ clock }) => {
    if (pointRef.current && pulse) {
      const time = clock.getElapsedTime()
      pointRef.current.scale.setScalar(safeSize * (1 + 0.3 * Math.sin(time * 3)))
    }
  })

  return (
    <mesh ref={pointRef} position={safePosition}>
      <sphereGeometry args={[safeSize, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  )
}

// Attack line component
const AttackLine = ({
  start,
  end,
  color = "#ef4444",
  animate = true,
}: {
  start: [number, number, number]
  end: [number, number, number]
  color?: string
  animate?: boolean
}) => {
  const lineRef = useRef<THREE.Line>(null)
  const [progress, setProgress] = useState(0)

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

  // Animation
  useFrame(({ clock }) => {
    if (animate) {
      const time = clock.getElapsedTime()
      setProgress((Math.sin(time) + 1) / 2) // 0 to 1
    }
  })

  // Create points for the line
  const startVec = new THREE.Vector3(...safeStart)
  const endVec = new THREE.Vector3(...safeEnd)
  const points = []

  if (animate) {
    // For animated lines, interpolate between start and end
    const currentEnd = new THREE.Vector3().lerpVectors(startVec, endVec, progress)
    points.push(startVec)
    points.push(currentEnd)
  } else {
    // For static lines, just use start and end
    points.push(startVec)
    points.push(endVec)
  }

  // Create geometry safely
  const geometry = new THREE.BufferGeometry().setFromPoints(points)

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color={color} linewidth={1} />
    </line>
  )
}

// Add continents to make the earth look more realistic without textures
const Continents = () => {
  // Simplified continent shapes
  const continentData = [
    // North America
    { position: [0, 0.5, -1.8], scale: [0.8, 0.6, 0.1], rotation: [0, 0.5, 0] },
    // South America
    { position: [0.5, -0.5, -1.8], scale: [0.4, 0.7, 0.1], rotation: [0, 0.2, 0] },
    // Europe
    { position: [1.5, 0.8, -1.2], scale: [0.4, 0.3, 0.1], rotation: [0, -0.5, 0] },
    // Africa
    { position: [1.2, -0.2, -1.5], scale: [0.6, 0.8, 0.1], rotation: [0, -0.3, 0] },
    // Asia
    { position: [1.5, 0.5, -1.2], scale: [1, 0.8, 0.1], rotation: [0, -0.8, 0] },
    // Australia
    { position: [1.2, -1.2, -1.2], scale: [0.4, 0.3, 0.1], rotation: [0, -1, 0] },
  ]

  return (
    <group>
      {continentData.map((continent, index) => (
        <mesh key={index} position={continent.position} rotation={continent.rotation}>
          <boxGeometry args={[continent.scale[0], continent.scale[1], 0.01]} />
          <meshStandardMaterial color="#2f855a" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  )
}

// Threat map scene
const ThreatMapScene = () => {
  const [threats, setThreats] = useState<
    Array<{
      id: string
      position: [number, number, number]
      severity: "low" | "medium" | "high" | "critical"
      target?: [number, number, number]
    }>
  >([])

  // Generate threat data
  useEffect(() => {
    try {
      // Generate random threats (safely limited to 15)
      const count = Math.min(15, Math.floor(Math.random() * 10) + 5)

      const generatedThreats = createSafeArray(count)
        .fill(null)
        .map((_, i) => {
          // Generate a random position on the sphere
          const phi = Math.acos(2 * Math.random() - 1) - Math.PI / 2
          const theta = 2 * Math.random() * Math.PI
          const radius = 2.1 // Slightly larger than Earth radius

          const x = radius * Math.cos(phi) * Math.cos(theta)
          const y = radius * Math.sin(phi)
          const z = radius * Math.cos(phi) * Math.sin(theta)

          // Determine severity
          const severities = ["low", "medium", "high", "critical"] as const
          const severity = severities[Math.floor(Math.random() * severities.length)]

          // Some threats have targets (attacks in progress)
          const hasTarget = Math.random() > 0.5

          let target: [number, number, number] | undefined = undefined

          if (hasTarget) {
            // Generate a random target position on the sphere
            const targetPhi = Math.acos(2 * Math.random() - 1) - Math.PI / 2
            const targetTheta = 2 * Math.random() * Math.PI

            const tx = radius * Math.cos(targetPhi) * Math.cos(targetTheta)
            const ty = radius * Math.sin(targetPhi)
            const tz = radius * Math.cos(targetPhi) * Math.sin(targetTheta)

            target = [tx, ty, tz]
          }

          return {
            id: `threat-${i}`,
            position: [x, y, z] as [number, number, number],
            severity,
            target,
          }
        })

      setThreats(generatedThreats)
    } catch (error) {
      console.error("Error generating threats:", error)
      // Fallback to empty array
      setThreats([])
    }
  }, [])

  // Severity colors
  const severityColors = {
    low: "#22d3ee",
    medium: "#f59e0b",
    high: "#ef4444",
    critical: "#7c3aed",
  }

  return (
    <group>
      <Earth />
      <Continents />

      {/* Render threats */}
      {threats.map((threat) => (
        <group key={threat.id}>
          <ThreatPoint
            position={threat.position}
            size={
              threat.severity === "critical"
                ? 0.15
                : threat.severity === "high"
                  ? 0.12
                  : threat.severity === "medium"
                    ? 0.1
                    : 0.08
            }
            color={severityColors[threat.severity]}
            pulse={threat.severity === "critical" || threat.severity === "high"}
          />

          {/* If there's a target, draw an attack line */}
          {threat.target && (
            <AttackLine
              start={threat.position}
              end={threat.target}
              color={severityColors[threat.severity]}
              animate={threat.severity === "critical" || threat.severity === "high"}
            />
          )}
        </group>
      ))}

      {/* Legend */}
      <group position={[3.5, 2, 0]}>
        <Text position={[0, 0.6, 0]} fontSize={0.2} color="white" anchorX="left" anchorY="middle">
          Threat Severity
        </Text>

        {Object.entries(severityColors).map(([severity, color], index) => (
          <group key={severity} position={[0, 0.3 - index * 0.3, 0]}>
            <mesh position={[-0.3, 0, 0]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <Text position={[0, 0, 0]} fontSize={0.15} color="white" anchorX="left" anchorY="middle">
              {severity.charAt(0).toUpperCase() + severity.slice(1)}
            </Text>
          </group>
        ))}
      </group>
    </group>
  )
}

// Main component
export function ThreatMap() {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className="h-64 w-full rounded-md overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true }}
        onError={(e) => console.error("Canvas error:", e)}
      >
        <color attach="background" args={[isDark ? "#0f1729" : "#f8fafc"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <ThreatMapScene />
        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
      </Canvas>
    </div>
  )
}
