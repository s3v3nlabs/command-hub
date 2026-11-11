"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Text } from "@react-three/drei"
import * as THREE from "three"
import { useTheme } from "next-themes"



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


const toXYZ = (lng: number, lat: number, r: number): [number, number, number] => {
  const la = (lat * Math.PI) / 180
  const lo = (lng * Math.PI) / 180
  return [r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo)]
}

// Real country outlines from the bundled Natural Earth data pack.
const CountryOutlines = ({ geo }: { geo: any }) => {
  const object = (() => {
    const pos: number[] = []
    const ring = (coords: number[][]) => {
      for (let i = 0; i < coords.length - 1; i++) {
        pos.push(...toXYZ(coords[i][0], coords[i][1], 2.005), ...toXYZ(coords[i + 1][0], coords[i + 1][1], 2.005))
      }
    }
    for (const f of geo?.features || []) {
      const g = f.geometry
      if (!g) continue
      if (g.type === "Polygon") g.coordinates.forEach(ring)
      else if (g.type === "MultiPolygon") g.coordinates.forEach((poly: number[][][]) => poly.forEach(ring))
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3))
    return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: "#7dd3fc", transparent: true, opacity: 0.55 }))
  })()
  return <primitive object={object} />
}

type GlobePoint = { id: string; position: [number, number, number]; severity: "low" | "medium" | "high" | "critical"; label: string }

// Threat map scene: botnet C2s by country (abuse.ch Feodo Tracker) + strongest recent earthquakes (USGS),
// both from the cached data packs in public/data-packs.
const ThreatMapScene = () => {
  const [threats, setThreats] = useState<GlobePoint[]>([])
  const [countries, setCountries] = useState<any>(null)
  const spin = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (spin.current) spin.current.rotation.y = clock.getElapsedTime() * 0.1
  })

  useEffect(() => {
    let alive = true
    const get = (u: string) => fetch(u).then((r) => (r.ok ? r.json() : { features: [] })).catch(() => ({ features: [] }))
    Promise.all([
      get("/data-packs/natural-earth-countries.geojson"),
      get("/data-packs/feodo-c2-by-country.geojson"),
      get("/data-packs/usgs-earthquakes.geojson"),
    ]).then(([geo, c2, quakes]) => {
      if (!alive) return
      setCountries(geo)
      const pts: GlobePoint[] = []
      for (const f of c2.features || []) {
        const [lng, lat] = f.geometry.coordinates
        pts.push({ id: `c2-${f.properties.country}`, position: toXYZ(lng, lat, 2.06), severity: f.properties.severity, label: f.properties.name })
      }
      const top = [...(quakes.features || [])].sort((a: any, b: any) => b.properties.mag - a.properties.mag).slice(0, 25)
      for (const f of top) {
        const [lng, lat] = f.geometry.coordinates
        pts.push({ id: `eq-${f.properties.time}`, position: toXYZ(lng, lat, 2.06), severity: f.properties.severity, label: f.properties.name })
      }
      setThreats(pts)
    })
    return () => {
      alive = false
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
      <group ref={spin}>
        <mesh>
          <sphereGeometry args={[2, 48, 48]} />
          <meshStandardMaterial color="#0b1f4a" emissive="#1d4ed8" emissiveIntensity={0.15} roughness={0.8} metalness={0.2} />
        </mesh>
        {countries && <CountryOutlines geo={countries} />}
        {threats.map((threat) => (
          <ThreatPoint
            key={threat.id}
            position={threat.position}
            size={threat.severity === "critical" ? 0.09 : threat.severity === "high" ? 0.075 : threat.severity === "medium" ? 0.06 : 0.045}
            color={severityColors[threat.severity] || "#22d3ee"}
            pulse={threat.severity === "critical" || threat.severity === "high"}
          />
        ))}
      </group>

      {/* Legend */}
      <group position={[3.5, 2, 0]}>
        <Text position={[0, 0.6, 0]} fontSize={0.2} color="white" anchorX="left" anchorY="middle">
          Severity (C2s + quakes)
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
    <div className="relative h-64 w-full rounded-md overflow-hidden">
      <div className="pointer-events-none absolute bottom-1 left-2 z-10 font-mono text-[9px] text-cyan-300/80">
        Data: abuse.ch Feodo Tracker (country-level) · USGS M2.5+ week · cached packs
      </div>
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
