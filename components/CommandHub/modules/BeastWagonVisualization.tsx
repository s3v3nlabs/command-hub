"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, Html, Line, Sphere, Box } from "@react-three/drei"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { useResonance } from "@/hooks/useResonance"
import * as THREE from "three"
import {
  Truck,
  Battery,
  Zap,
  Thermometer,
  Signal,
  Radar,
  Camera,
  Sun,
  Wifi,
  Activity,
  MapPin,
  Eye,
  EyeOff,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TelemetryData {
  battery: number
  solar: number
  power: number
  temperature: number
  signalStrength: number
  location: { lat: number; lng: number; alt: number }
  sensors: {
    radar: boolean
    camera: boolean
    drone: boolean
    scanner: boolean
  }
  containerStatus: "attached" | "detached" | "deploying"
  powerSource: "solar" | "generator" | "battery" | "hybrid"
}

interface BeastWagonProps {
  telemetry: TelemetryData
  onTelemetryUpdate: (data: Partial<TelemetryData>) => void
}

// 3D BeastWagon Model Component
function BeastWagonModel({ telemetry, containerDeployed }: { telemetry: TelemetryData; containerDeployed: boolean }) {
  const meshRef = useRef<THREE.Group>(null)
  const containerRef = useRef<THREE.Group>(null)
  const ledRef = useRef<THREE.Group>(null)

  // Animate the model
  useFrame((state) => {
    if (meshRef.current) {
      // Subtle rotation animation
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.02
    }

    // Container deployment animation
    if (containerRef.current) {
      const targetY = containerDeployed ? -2 : 0
      containerRef.current.position.y = THREE.MathUtils.lerp(containerRef.current.position.y, targetY, 0.05)
    }

    // LED animation
    if (ledRef.current) {
      const intensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3
      ledRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissiveIntensity = intensity
        }
      })
    }
  })

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      {/* Main Truck Chassis */}
      <Box args={[8, 2, 3]} position={[0, 1, 0]}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
      </Box>

      {/* Truck Cab */}
      <Box args={[3, 2.5, 3]} position={[-3.5, 2.25, 0]}>
        <meshStandardMaterial color="#0a0a0a" roughness={0.6} metalness={0.3} />
      </Box>

      {/* Wheels */}
      {[-3, -1, 1, 3].map((x, i) => (
        <group key={i}>
          <Sphere args={[0.8]} position={[x, 0, 1.8]}>
            <meshStandardMaterial color="#333" roughness={0.9} />
          </Sphere>
          <Sphere args={[0.8]} position={[x, 0, -1.8]}>
            <meshStandardMaterial color="#333" roughness={0.9} />
          </Sphere>
        </group>
      ))}

      {/* Container Module */}
      <group ref={containerRef}>
        <Box args={[6, 3, 2.8]} position={[1.5, 3.5, 0]}>
          <meshStandardMaterial
            color="#0d1117"
            roughness={0.7}
            metalness={0.4}
            transparent
            opacity={telemetry.containerStatus === "detached" ? 0.7 : 1.0}
          />
        </Box>

        {/* Hydraulic Supports */}
        {containerDeployed &&
          [-1, 1].map((z, i) => (
            <group key={i}>
              <Box args={[0.2, 2, 0.2]} position={[-1, 1, z * 2]}>
                <meshStandardMaterial color="#444" metalness={0.8} />
              </Box>
              <Box args={[0.2, 2, 0.2]} position={[4, 1, z * 2]}>
                <meshStandardMaterial color="#444" metalness={0.8} />
              </Box>
            </group>
          ))}
      </group>

      {/* LED Edge Lighting */}
      <group ref={ledRef}>
        {/* Container Edge LEDs */}
        <Line
          points={[
            [-1.5, 5, -1.4],
            [4.5, 5, -1.4],
            [4.5, 5, 1.4],
            [-1.5, 5, 1.4],
            [-1.5, 5, -1.4],
          ]}
          color={telemetry.power > 50 ? "#00aaff" : "#ff4444"}
          lineWidth={3}
        />

        {/* Truck Edge LEDs */}
        <Line
          points={[
            [-4, 2, -1.5],
            [4, 2, -1.5],
            [4, 2, 1.5],
            [-4, 2, 1.5],
            [-4, 2, -1.5],
          ]}
          color="#ffffff"
          lineWidth={2}
        />
      </group>

      {/* Sensor Modules */}
      {telemetry.sensors.radar && (
        <Sphere args={[0.3]} position={[4.5, 4, 0]}>
          <meshStandardMaterial color="#00ff00" emissive="#004400" emissiveIntensity={0.5} />
        </Sphere>
      )}

      {telemetry.sensors.camera && (
        <Box args={[0.4, 0.2, 0.2]} position={[0, 5.2, 0]}>
          <meshStandardMaterial color="#ff0000" emissive="#440000" emissiveIntensity={0.3} />
        </Box>
      )}

      {telemetry.sensors.drone && (
        <Box args={[1, 0.1, 1]} position={[1.5, 5.5, 0]}>
          <meshStandardMaterial color="#0088ff" emissive="#002244" emissiveIntensity={0.4} />
        </Box>
      )}

      {/* Solar Panels */}
      <Box args={[5, 0.1, 2]} position={[1.5, 5.6, 0]}>
        <meshStandardMaterial color="#001122" metalness={0.9} roughness={0.1} />
      </Box>
    </group>
  )
}

// Telemetry Overlay Component
function TelemetryOverlay({ telemetry }: { telemetry: TelemetryData }) {
  return (
    <Html position={[6, 4, 0]} transform occlude>
      <div className="bg-black/80 border border-green-400/50 rounded p-3 font-mono text-xs text-green-400 min-w-48">
        <div className="text-center mb-2 font-bold">BEASTWAGON-77 TELEMETRY</div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Battery:</span>
            <span className={telemetry.battery > 20 ? "text-green-400" : "text-red-400"}>
              {telemetry.battery.toFixed(1)}%
            </span>
          </div>

          <div className="flex justify-between">
            <span>Solar:</span>
            <span className="text-yellow-400">{telemetry.solar.toFixed(1)}W</span>
          </div>

          <div className="flex justify-between">
            <span>Power:</span>
            <span className="text-blue-400">{telemetry.power.toFixed(1)}W</span>
          </div>

          <div className="flex justify-between">
            <span>Temp:</span>
            <span className={telemetry.temperature > 80 ? "text-red-400" : "text-green-400"}>
              {telemetry.temperature.toFixed(1)}°C
            </span>
          </div>

          <div className="flex justify-between">
            <span>Signal:</span>
            <span className={telemetry.signalStrength > 70 ? "text-green-400" : "text-yellow-400"}>
              {telemetry.signalStrength.toFixed(0)}%
            </span>
          </div>

          <div className="border-t border-green-400/30 pt-1 mt-2">
            <div className="text-xs text-green-300">LAT: {telemetry.location.lat.toFixed(6)}</div>
            <div className="text-xs text-green-300">LNG: {telemetry.location.lng.toFixed(6)}</div>
            <div className="text-xs text-green-300">ALT: {telemetry.location.alt.toFixed(1)}m</div>
          </div>

          <div className="border-t border-green-400/30 pt-1 mt-2">
            <div className="text-xs">
              Container: <span className="text-orange-400">{telemetry.containerStatus.toUpperCase()}</span>
            </div>
            <div className="text-xs">
              Power: <span className="text-purple-400">{telemetry.powerSource.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </Html>
  )
}

// Environment Component
function SceneEnvironment() {
  return (
    <>
      <Environment preset="forest" />
      <fog attach="fog" args={["#0a0a0a", 10, 50]} />

      {/* Ground */}
      <Box args={[100, 0.1, 100]} position={[0, -1, 0]}>
        <meshStandardMaterial color="#0a2a0a" roughness={0.9} />
      </Box>

      {/* Pine Trees (simplified) */}
      {Array.from({ length: 20 }, (_, i) => {
        const x = (Math.random() - 0.5) * 80
        const z = (Math.random() - 0.5) * 80
        const height = 8 + Math.random() * 4

        return (
          <group key={i} position={[x, height / 2, z]}>
            <Box args={[0.5, height, 0.5]}>
              <meshStandardMaterial color="#2a1a0a" />
            </Box>
            <Sphere args={[2, 8, 8]} position={[0, height / 2, 0]}>
              <meshStandardMaterial color="#0a4a0a" />
            </Sphere>
          </group>
        )
      })}

      {/* Ambient lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#4488ff" />
    </>
  )
}

export default function BeastWagonVisualization() {
  const { pulse, isResonating } = useResonance("beastwagon", "BeastWagon-77 Visualization", 108)

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    battery: 87.5,
    solar: 245.8,
    power: 156.2,
    temperature: 42.3,
    signalStrength: 89,
    location: { lat: 45.5231, lng: -122.6765, alt: 152.4 },
    sensors: {
      radar: true,
      camera: true,
      drone: false,
      scanner: true,
    },
    containerStatus: "attached",
    powerSource: "hybrid",
  })

  const [isSimulating, setIsSimulating] = useState(false)
  const [containerDeployed, setContainerDeployed] = useState(false)
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([15, 8, 15])
  const [showTelemetry, setShowTelemetry] = useState(true)

  // Simulate telemetry updates
  useEffect(() => {
    if (!isSimulating) return

    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        battery: Math.max(0, prev.battery - 0.1 + Math.random() * 0.2),
        solar: Math.max(0, 200 + Math.sin(Date.now() / 10000) * 100 + Math.random() * 50),
        power: Math.max(0, 150 + Math.random() * 100),
        temperature: 35 + Math.sin(Date.now() / 20000) * 15 + Math.random() * 5,
        signalStrength: Math.max(0, Math.min(100, prev.signalStrength + (Math.random() - 0.5) * 10)),
        location: {
          lat: prev.location.lat + (Math.random() - 0.5) * 0.0001,
          lng: prev.location.lng + (Math.random() - 0.5) * 0.0001,
          alt: prev.location.alt + (Math.random() - 0.5) * 2,
        },
      }))

      pulse({ amplitude: 0.3, hz: 108 })
    }, 2000)

    return () => clearInterval(interval)
  }, [isSimulating, pulse])

  const toggleContainerDeployment = () => {
    setContainerDeployed(!containerDeployed)
    setTelemetry((prev) => ({
      ...prev,
      containerStatus: !containerDeployed ? "deploying" : "attached",
    }))

    pulse({ amplitude: 1.0, hz: 432 })

    // Simulate deployment process
    setTimeout(() => {
      setTelemetry((prev) => ({
        ...prev,
        containerStatus: containerDeployed ? "attached" : "detached",
      }))
    }, 3000)
  }

  const toggleSensor = (sensor: keyof TelemetryData["sensors"]) => {
    setTelemetry((prev) => ({
      ...prev,
      sensors: {
        ...prev.sensors,
        [sensor]: !prev.sensors[sensor],
      },
    }))
    pulse({ amplitude: 0.5, hz: 256 })
  }

  const changePowerSource = (source: TelemetryData["powerSource"]) => {
    setTelemetry((prev) => ({
      ...prev,
      powerSource: source,
    }))
    pulse({ amplitude: 0.7, hz: 528 })
  }

  const resetCamera = () => {
    setCameraPosition([15, 8, 15])
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <TechPanel
        title="BEASTWAGON-77 VISUALIZATION"
        subtitle="MOBILE COMMAND & RECONNAISSANCE PLATFORM"
        cornerAccent
        borderAccent
        glowEffect={isResonating}
        icon={<Truck size={16} />}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-200",
                telemetry.battery > 20 ? "bg-green-400 animate-pulse shadow-glow-sm" : "bg-red-400 animate-pulse",
              )}
            />
            <div>
              <div className="font-mono text-sm">Status: {telemetry.containerStatus.toUpperCase()}</div>
              <div className="text-xs text-dark-600">
                Power: {telemetry.powerSource.toUpperCase()} • Signal: {telemetry.signalStrength.toFixed(0)}%
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-blue-400 border-blue-400/50">
              <MapPin size={12} className="mr-1" />
              TRACKING
            </Badge>
            <Badge
              variant="outline"
              className={`${isSimulating ? "text-green-400 border-green-400/50" : "text-gray-400 border-gray-400/50"}`}
            >
              {isSimulating ? "LIVE" : "STATIC"}
            </Badge>
            <TechButton
              onClick={() => setIsSimulating(!isSimulating)}
              size="sm"
              cornerAccent
              icon={isSimulating ? <Pause size={14} /> : <Play size={14} />}
            >
              {isSimulating ? "PAUSE" : "START"}
            </TechButton>
          </div>
        </div>
      </TechPanel>

      {/* Main Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 3D Viewport */}
        <div className="lg:col-span-3">
          <TechPanel title="3D VISUALIZATION" cornerAccent borderAccent className="h-96">
            <div className="relative w-full h-full">
              <Canvas
                camera={{ position: cameraPosition, fov: 60 }}
                shadows
                className="bg-gradient-to-b from-gray-900 to-black"
              >
                <Suspense fallback={null}>
                  <SceneEnvironment />
                  <BeastWagonModel telemetry={telemetry} containerDeployed={containerDeployed} />
                  {showTelemetry && <TelemetryOverlay telemetry={telemetry} />}
                  <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={5}
                    maxDistance={50}
                  />
                </Suspense>
              </Canvas>

              {/* 3D Controls */}
              <div className="absolute top-2 right-2 flex flex-col space-y-1">
                <TechButton
                  onClick={() => setShowTelemetry(!showTelemetry)}
                  size="sm"
                  variant="outline"
                  className="border-dark-400/50"
                  icon={showTelemetry ? <Eye size={12} /> : <EyeOff size={12} />}
                >
                  HUD
                </TechButton>
                <TechButton
                  onClick={resetCamera}
                  size="sm"
                  variant="outline"
                  className="border-dark-400/50"
                  icon={<RotateCcw size={12} />}
                >
                  RESET
                </TechButton>
              </div>
            </div>
          </TechPanel>
        </div>

        {/* Control Panel */}
        <div className="space-y-4">
          {/* Container Controls */}
          <TechPanel title="CONTAINER CONTROL" cornerAccent borderAccent>
            <div className="space-y-3">
              <TechButton
                onClick={toggleContainerDeployment}
                className={`w-full font-mono ${
                  containerDeployed
                    ? "bg-orange-600 hover:bg-orange-500 text-white"
                    : "bg-green-600 hover:bg-green-500 text-white"
                }`}
                disabled={telemetry.containerStatus === "deploying"}
              >
                {telemetry.containerStatus === "deploying" ? "DEPLOYING..." : containerDeployed ? "RETRACT" : "DEPLOY"}
              </TechButton>

              <div className="space-y-2">
                <div className="text-xs text-dark-500">POWER SOURCE</div>
                <div className="grid grid-cols-2 gap-1">
                  {(["solar", "generator", "battery", "hybrid"] as const).map((source) => (
                    <TechButton
                      key={source}
                      onClick={() => changePowerSource(source)}
                      size="sm"
                      variant={telemetry.powerSource === source ? "default" : "outline"}
                      className={`text-xs ${
                        telemetry.powerSource === source
                          ? "bg-purple-600 hover:bg-purple-500 text-white"
                          : "border-dark-400/50"
                      }`}
                    >
                      {source.toUpperCase()}
                    </TechButton>
                  ))}
                </div>
              </div>
            </div>
          </TechPanel>

          {/* Sensor Modules */}
          <TechPanel title="SENSOR MODULES" cornerAccent borderAccent>
            <div className="space-y-2">
              {Object.entries(telemetry.sensors).map(([sensor, enabled]) => (
                <div key={sensor} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {sensor === "radar" && <Radar size={14} />}
                    {sensor === "camera" && <Camera size={14} />}
                    {sensor === "drone" && <Activity size={14} />}
                    {sensor === "scanner" && <Wifi size={14} />}
                    <span className="text-xs font-mono">{sensor.toUpperCase()}</span>
                  </div>
                  <button
                    onClick={() => toggleSensor(sensor as keyof TelemetryData["sensors"])}
                    className={cn("w-8 h-4 rounded-full transition-colors", enabled ? "bg-green-500" : "bg-gray-400")}
                  >
                    <div
                      className={cn(
                        "w-3 h-3 bg-white rounded-full transition-transform",
                        enabled ? "translate-x-4" : "translate-x-0.5",
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </TechPanel>

          {/* Telemetry Readouts */}
          <TechPanel title="TELEMETRY" cornerAccent borderAccent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Battery size={12} />
                  <span className="text-xs">Battery</span>
                </div>
                <span className={`text-xs font-mono ${telemetry.battery > 20 ? "text-green-400" : "text-red-400"}`}>
                  {telemetry.battery.toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Sun size={12} />
                  <span className="text-xs">Solar</span>
                </div>
                <span className="text-xs font-mono text-yellow-400">{telemetry.solar.toFixed(1)}W</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Zap size={12} />
                  <span className="text-xs">Power</span>
                </div>
                <span className="text-xs font-mono text-blue-400">{telemetry.power.toFixed(1)}W</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Thermometer size={12} />
                  <span className="text-xs">Temp</span>
                </div>
                <span className={`text-xs font-mono ${telemetry.temperature > 80 ? "text-red-400" : "text-green-400"}`}>
                  {telemetry.temperature.toFixed(1)}°C
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Signal size={12} />
                  <span className="text-xs">Signal</span>
                </div>
                <span
                  className={`text-xs font-mono ${telemetry.signalStrength > 70 ? "text-green-400" : "text-yellow-400"}`}
                >
                  {telemetry.signalStrength.toFixed(0)}%
                </span>
              </div>
            </div>
          </TechPanel>
        </div>
      </div>
    </div>
  )
}
