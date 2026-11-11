"use client"

import { useMemo, useState, useEffect } from "react"
import type { ThreatFieldPoint } from "@/lib/offsec/threat-engine"
import { ThreatField2D } from "./threat-field-2d"

/**
 * 3D threat-field via react-three-fiber, with automatic 2D fallback if WebGL
 * is unavailable or the dynamic import fails.
 */
export function ThreatField3D({
  field,
  selected,
  onSelect,
}: {
  field: ThreatFieldPoint[]
  selected?: string | null
  onSelect?: (id: string) => void
}) {
  const [mode, setMode] = useState<"loading" | "3d" | "2d">("loading")
  const [Canvas, setCanvas] = useState<any>(null)
  const [Drei, setDrei] = useState<any>(null)
  const [THREE, setTHREE] = useState<any>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const canvasOk = (() => {
          try {
            const c = document.createElement("canvas")
            return !!(c.getContext("webgl") || c.getContext("experimental-webgl"))
          } catch {
            return false
          }
        })()
        if (!canvasOk) {
          if (!cancelled) setMode("2d")
          return
        }
        const [fiber, drei, three] = await Promise.all([
          import("@react-three/fiber"),
          import("@react-three/drei"),
          import("three"),
        ])
        if (cancelled) return
        setCanvas(() => fiber.Canvas)
        setDrei(drei)
        setTHREE(three)
        setMode("3d")
      } catch {
        if (!cancelled) setMode("2d")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (mode === "loading") {
    return (
      <div className="flex h-[480px] items-center justify-center rounded-[2px] border border-[color:var(--ghost-line)] bg-black/60 font-mono text-[11px] text-[color:var(--ghost-dim)]">
        loading threat-field renderer…
      </div>
    )
  }

  if (mode === "2d" || !Canvas || !Drei || !THREE) {
    return (
      <div className="space-y-1">
        <div className="font-mono text-[10px] text-[color:var(--ghost-faint)]">2D heatmap fallback</div>
        <ThreatField2D field={field} selected={selected} onSelect={onSelect} />
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] text-[color:var(--ghost-faint)]">
          3D threat field (three.js) — drag to orbit · scroll to zoom
        </div>
        <button type="button" className="ghost-chip" onClick={() => setMode("2d")}>
          2D fallback
        </button>
      </div>
      <div className="h-[480px] overflow-hidden rounded-[2px] border border-[color:var(--ghost-line)] bg-black">
        <Canvas camera={{ position: [1.6, 1.2, 1.8], fov: 45 }}>
          <color attach="background" args={["#050505"]} />
          <ambientLight intensity={0.45} />
          <directionalLight position={[3, 4, 2]} intensity={0.7} />
          <Drei.OrbitControls enablePan makeDefault />
          <Drei.Grid
            args={[4, 4]}
            cellSize={0.1}
            cellThickness={0.4}
            cellColor="#2a3038"
            sectionSize={0.5}
            sectionThickness={0.8}
            sectionColor="#4a5560"
            fadeDistance={6}
            infiniteGrid={false}
          />
          <ThreatNodes field={field} selected={selected} onSelect={onSelect} THREE={THREE} Html={Drei.Html} />
        </Canvas>
      </div>
    </div>
  )
}

function ThreatNodes({
  field,
  selected,
  onSelect,
  THREE,
  Html,
}: {
  field: ThreatFieldPoint[]
  selected?: string | null
  onSelect?: (id: string) => void
  THREE: any
  Html: any
}) {
  const meshes = useMemo(() => field, [field])
  return (
    <group position={[-0.5, 0, -0.5]}>
      {meshes.map((p) => {
        const pos: [number, number, number] = [p.x, p.z * 0.8, p.y]
        const r = 0.04 + p.intensity * 0.12
        const sel = selected === p.zoneId
        const color = new THREE.Color().setHSL(0.55, 0.05, 0.35 + p.intensity * 0.45)
        return (
          <group key={p.zoneId} position={pos}>
            <mesh
              onClick={(e: any) => {
                e.stopPropagation()
                onSelect?.(p.zoneId)
              }}
            >
              <sphereGeometry args={[r, 24, 24]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.35 + p.intensity * 0.5}
                roughness={0.4}
                metalness={0.5}
              />
            </mesh>
            {/* intensity halo */}
            <mesh>
              <sphereGeometry args={[r * (1.6 + p.intensity), 16, 16]} />
              <meshBasicMaterial color={color} transparent opacity={0.08 + p.intensity * 0.12} depthWrite={false} />
            </mesh>
            {(sel || p.intensity > 0.45) && (
              <Html distanceFactor={4} style={{ pointerEvents: "none" }}>
                <div className="whitespace-nowrap rounded-[2px] border border-[color:var(--ghost-line)] bg-black/80 px-1.5 py-0.5 font-mono text-[9px] text-[color:var(--ghost-ink)]">
                  {p.label} {(p.intensity * 100).toFixed(0)}
                </div>
              </Html>
            )}
            {sel && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -r - 0.01, 0]}>
                <ringGeometry args={[r * 1.3, r * 1.6, 32]} />
                <meshBasicMaterial color="#d7dee8" transparent opacity={0.7} />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}
