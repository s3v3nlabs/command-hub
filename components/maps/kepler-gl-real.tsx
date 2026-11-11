"use client"

/**
 * Real Mapbox + deck.gl geospatial surface for /intelligence/kepler.
 * Uses Mapbox dark style with Hexagon + Heatmap + Scatter layers (same engine Kepler.gl uses).
 * Full KeplerGl chrome is React-19 fragile; this map surface is the production renderer.
 */
import { useEffect, useMemo, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import { MapboxOverlay } from "@deck.gl/mapbox"
import { HexagonLayer } from "@deck.gl/aggregation-layers"
import { HeatmapLayer } from "@deck.gl/aggregation-layers"
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers"
import "mapbox-gl/dist/mapbox-gl.css"

export type KeplerDatasetLike = {
  info?: { id?: string; label?: string; color?: [number, number, number] }
  data?: {
    fields?: Array<{ name: string; type?: string }>
    rows?: any[][]
  }
}

type Props = {
  datasets?: KeplerDatasetLike[]
  mapboxToken: string
  onNodeSelect?: (node: any) => void
  className?: string
}

type Point = {
  name: string
  type: string
  lat: number
  lng: number
  confidence: number
  threat: string
  source: string
  position: [number, number]
}

function datasetsToPoints(datasets: KeplerDatasetLike[]): Point[] {
  const out: Point[] = []
  for (const ds of datasets) {
    const fields = ds.data?.fields?.map((f) => f.name) || []
    const nameIdx = fields.indexOf("name")
    const typeIdx = fields.indexOf("type")
    const latIdx = fields.indexOf("latitude") >= 0 ? fields.indexOf("latitude") : fields.indexOf("lat")
    const lngIdx =
      fields.indexOf("longitude") >= 0
        ? fields.indexOf("longitude")
        : fields.indexOf("lng") >= 0
          ? fields.indexOf("lng")
          : fields.indexOf("lon")
    const confIdx = fields.indexOf("confidence")
    const threatIdx = fields.indexOf("threat_level")
    const sourceIdx = fields.indexOf("source")
    for (const row of ds.data?.rows || []) {
      const lat = Number(row[latIdx])
      const lng = Number(row[lngIdx])
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
      out.push({
        name: String(row[nameIdx] ?? "unknown"),
        type: String(row[typeIdx] ?? "unknown"),
        lat,
        lng,
        confidence: Number(row[confIdx] ?? 0),
        threat: String(row[threatIdx] ?? "medium"),
        source: String(row[sourceIdx] ?? ds.info?.label ?? "heimdal"),
        position: [lng, lat],
      })
    }
  }
  return out
}

function threatColor(threat: string): [number, number, number, number] {
  switch (threat) {
    case "critical":
      return [239, 68, 68, 220]
    case "high":
      return [249, 115, 22, 220]
    case "medium":
      return [234, 179, 8, 200]
    case "low":
      return [34, 197, 94, 200]
    default:
      return [0, 200, 255, 200]
  }
}

export default function KeplerGlReal({
  datasets = [],
  mapboxToken,
  onNodeSelect,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const overlayRef = useRef<any>(null)
  const [status, setStatus] = useState<"booting" | "live" | "error">("booting")
  const [err, setErr] = useState("")
  const [mode, setMode] = useState<"hexagon" | "heatmap" | "points">("hexagon")

  const points = useMemo(() => datasetsToPoints(datasets), [datasets])

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    if (!mapboxToken) {
      setStatus("error")
      setErr("Missing Mapbox token")
      return
    }

    try {
      mapboxgl.accessToken = mapboxToken
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [-100.0, 35.5],
        zoom: 3.2,
        pitch: 40,
        bearing: -10,
        antialias: true,
      })
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right")
      const overlay = new MapboxOverlay({ interleaved: false, layers: [] })
      map.addControl(overlay as any)
      mapRef.current = map
      overlayRef.current = overlay
      map.on("load", () => setStatus("live"))
      map.on("error", (e) => {
        console.error("mapbox error", e)
        setErr(String((e as any)?.error?.message || "Mapbox error"))
      })
    } catch (e: any) {
      setStatus("error")
      setErr(e?.message || String(e))
    }

    return () => {
      overlayRef.current = null
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [mapboxToken])

  // Update deck layers
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return

    const common = { data: points, getPosition: (d: Point) => d.position, pickable: true }

    const layers: any[] = []
    if (mode === "hexagon" || mode === "heatmap") {
      if (mode === "hexagon") {
        layers.push(
          new HexagonLayer({
            id: "heimdal-hex",
            ...common,
            extruded: true,
            radius: 60000,
            elevationScale: 80,
            elevationRange: [0, 3000],
            coverage: 0.85,
            colorRange: [
              [1, 152, 189],
              [73, 227, 206],
              [216, 254, 181],
              [254, 237, 177],
              [254, 173, 84],
              [209, 55, 78],
            ],
            onClick: (info: any) => {
              const pts = (info.object as any)?.points as Point[] | undefined
              if (pts?.[0] && onNodeSelect) onNodeSelect(pts[0])
            },
          }),
        )
      } else {
        layers.push(
          new HeatmapLayer({
            id: "heimdal-heat",
            ...common,
            radiusPixels: 60,
            intensity: 1.2,
            threshold: 0.05,
            colorRange: [
              [1, 152, 189],
              [73, 227, 206],
              [216, 254, 181],
              [254, 237, 177],
              [254, 173, 84],
              [209, 55, 78],
            ],
          }),
        )
      }
    }

    layers.push(
      new ScatterplotLayer({
        id: "heimdal-points",
        ...common,
        getRadius: (d: Point) => 8 + d.confidence * 18,
        radiusUnits: "pixels",
        getFillColor: (d: Point) => threatColor(d.threat),
        getLineColor: [255, 255, 255, 180],
        lineWidthMinPixels: 1,
        stroked: true,
        onClick: (info: any) => {
          if (info.object && onNodeSelect) onNodeSelect(info.object)
        },
      }),
    )

    layers.push(
      new TextLayer({
        id: "heimdal-labels",
        data: points,
        getPosition: (d: Point) => d.position,
        getText: (d: Point) => d.name,
        getSize: 12,
        getColor: [200, 255, 255, 220],
        getPixelOffset: [0, -18],
        billboard: true,
        fontFamily: "monospace",
      }),
    )

    overlay.setProps({ layers })

    if (points.length && mapRef.current) {
      const lngs = points.map((p) => p.lng)
      const lats = points.map((p) => p.lat)
      const bounds = new mapboxgl.LngLatBounds(
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      )
      mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 6, duration: 800 })
    }
  }, [points, mode, onNodeSelect, status])

  return (
    <div className={`relative w-full h-full min-h-[320px] bg-black ${className}`}>
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
        {(["hexagon", "heatmap", "points"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded border px-2 py-1 font-mono text-[10px] uppercase backdrop-blur-md ${
              mode === m
                ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-200"
                : "border-white/15 bg-black/60 text-gray-400"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-2 left-2 z-10 rounded border border-cyan-500/30 bg-black/70 px-2 py-1 font-mono text-[10px] text-cyan-300">
        MAPBOX DARK · DECK.GL {mode.toUpperCase()} · {points.length} HEIMDAL PTS · {status.toUpperCase()}
      </div>
      {status === "error" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 p-6 text-center font-mono text-xs text-red-300">
          Mapbox render failed: {err}
        </div>
      )}
      {status === "booting" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 font-mono text-xs text-cyan-300">
          INITIALIZING MAPBOX + DECK.GL…
        </div>
      )}
    </div>
  )
}
