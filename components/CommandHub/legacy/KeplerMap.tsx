"use client"

/**
 * Legacy entry point kept for existing pages (/intelligence/map, /intelligence/hunter).
 * Renders the real GeoMap (Mapbox or MapLibre basemap + deck.gl layers + data packs).
 */
import dynamic from "next/dynamic"
import type { GeoMapProps } from "@/components/maps/GeoMap"

const GeoMap = dynamic(() => import("@/components/maps/GeoMap"), {
  ssr: false,
  loading: () => <div className="flex h-[520px] items-center justify-center bg-black font-mono text-xs text-cyan-300">Loading map…</div>,
})

export default function KeplerMap(props: GeoMapProps) {
  return <GeoMap height="calc(100vh - 220px)" {...props} />
}
