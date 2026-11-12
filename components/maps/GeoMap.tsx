"use client"

/**
 * GeoMap: the shared map surface for the map modules.
 * - Basemap: Mapbox dark (when NEXT_PUBLIC_MAPBOX_TOKEN is a pk.* token), otherwise MapLibre with the free
 *   CARTO Dark Matter style (OpenStreetMap data). If the style can't load (offline), it falls back to a plain
 *   background and the bundled Natural Earth countries still draw, so the map always renders.
 * - Layers: deck.gl hexagon / heatmap / points (the same layer engine Kepler.gl uses) + GeoJSON polygons.
 * - Data: cached data packs from public/data-packs (live refresh via /api/data-packs/:id?live=1),
 *   caller-supplied collections, and "Load your own" uploads (GeoJSON / JSON / CSV).
 * - Chrome: Ghostlight night-ops HUD (threat ramps, halo points, classified overlay). Visual only.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Deck } from "@deck.gl/core"
import { HexagonLayer, HeatmapLayer } from "@deck.gl/aggregation-layers"
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers"
import type { FeatureCollection, GeoFeature, PackMeta } from "@/lib/data-packs"
import { parseUpload } from "@/lib/data-packs/parse-upload"
import "maplibre-gl/dist/maplibre-gl.css"
import "mapbox-gl/dist/mapbox-gl.css"
import "./geomap-hud.css"

export type GeoMapProps = {
  /** Packs enabled on first render (ids from public/data-packs/manifest.json). */
  defaultPacks?: string[]
  /** Extra collections supplied by the page (e.g. parsed intel datasets). */
  collections?: { id: string; label: string; data: FeatureCollection }[]
  height?: number | string
  className?: string
  onSelect?: (feature: GeoFeature) => void
  /** Hide the pack/upload panel (for small embeds). */
  compact?: boolean
}

type Mode = "hexagon" | "heatmap" | "points"
type Loaded = { id: string; label: string; data: FeatureCollection; mode: "cached" | "live" | "upload" | "page"; note?: string }

const CARTO_DARK = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
const BLANK_STYLE: any = { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": "#05070d" } }] }

/** Ghostlight severity ramp: cool cyan → mint → amber → orange → crimson. */
const RAMP: [number, number, number][] = [
  [0, 229, 255],
  [52, 245, 197],
  [255, 209, 102],
  [255, 140, 50],
  [239, 68, 68],
  [185, 28, 55],
]

const SEV: Record<string, [number, number, number, number]> = {
  critical: [220, 38, 60, 245],
  high: [255, 140, 50, 240],
  medium: [255, 191, 72, 235],
  low: [52, 245, 197, 230],
}
const CAT: Record<string, [number, number, number, number]> = {
  earthquake: [0, 229, 255, 230],
  "botnet-c2": [220, 38, 60, 245],
  "weather-alert": [255, 191, 72, 230],
  upload: [52, 245, 197, 230],
}
const colorOf = (p: any): [number, number, number, number] =>
  (p?.category && CAT[p.category] && p.category !== "upload" ? CAT[p.category] : SEV[p?.severity] || [0, 229, 255, 230]) as [
    number,
    number,
    number,
    number,
  ]

const MODE_LABEL: Record<Mode, string> = { points: "POINTS", hexagon: "HEX", heatmap: "HEAT" }

function countThreats(points: { p: any }[]) {
  const t = { critical: 0, high: 0, medium: 0, low: 0, untyped: 0 }
  for (const d of points) {
    const s = String(d.p?.severity || "").toLowerCase()
    if (s === "critical" || s === "high" || s === "medium" || s === "low") t[s]++
    else t.untyped++
  }
  return t
}

const MAPBOX_FOG = {
  range: [0.8, 8] as [number, number],
  color: "#05070d",
  "horizon-blend": 0.08,
  "high-color": "#0a1628",
  "space-color": "#02040a",
  "star-intensity": 0.18,
}

export default function GeoMap({
  defaultPacks = ["usgs-earthquakes", "feodo-c2-by-country", "noaa-alerts"],
  collections = [],
  height = 520,
  className = "",
  onSelect,
  compact = false,
}: GeoMapProps) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const overlayRef = useRef<any>(null)
  const deckHost = useRef<HTMLDivElement>(null)
  const roRef = useRef<ResizeObserver | null>(null)
  const hoverRef = useRef<((info: any) => void) | null>(null)
  const clickRef = useRef<((info: any) => void) | null>(null)
  const [basemap, setBasemap] = useState<"mapbox" | "maplibre-carto" | "offline" | "booting">("booting")
  const [mapReady, setMapReady] = useState(false)
  const [mode, setMode] = useState<Mode>("points")
  const [manifest, setManifest] = useState<PackMeta[]>([])
  const [enabled, setEnabled] = useState<Set<string>>(new Set(defaultPacks))
  const [live, setLive] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState<Record<string, Loaded>>({})
  const [countries, setCountries] = useState<FeatureCollection | null>(null)
  const [uploads, setUploads] = useState<Loaded[]>([])
  const [hover, setHover] = useState<{ x: number; y: number; p: any } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const token = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "").trim()
  const hasToken = token.startsWith("pk.")
  // Free basemap can be forced with ?basemap=maplibre or the toggle (remembered in localStorage).
  const [preferFree, setPreferFree] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return new URLSearchParams(window.location.search).get("basemap") === "maplibre" || window.localStorage.getItem("geomap-basemap") === "maplibre"
  })
  const useMapbox = hasToken && !preferFree

  // --- basemap ---
  useEffect(() => {
    if (!container.current || mapRef.current) return
    let cancelled = false
    ;(async () => {
      try {
        let map: any
        if (useMapbox) {
          const mapboxgl = (await import("mapbox-gl")).default
          mapboxgl.accessToken = token
          map = new mapboxgl.Map({
            container: container.current!,
            style: "mapbox://styles/mapbox/dark-v11",
            center: [-30, 25],
            zoom: 1.4,
            attributionControl: true,
            projection: "mercator",
          } as any)
          map.addControl(new mapboxgl.NavigationControl(), "top-right")
          const applyFog = () => {
            try {
              if (typeof map.setFog === "function") map.setFog(MAPBOX_FOG)
            } catch {
              /* fog is optional; free/offline path must keep working */
            }
          }
          map.once("style.load", applyFog)
          setBasemap("mapbox")
        } else {
          const maplibregl = (await import("maplibre-gl")).default
          map = new maplibregl.Map({ container: container.current!, style: CARTO_DARK, center: [-30, 25], zoom: 1.4, attributionControl: { compact: true } as any })
          map.addControl(new maplibregl.NavigationControl({}), "top-right")
          setBasemap("maplibre-carto")
          // Offline / blocked style -> plain background (countries pack still draws).
          let styled = false
          const fallback = () => {
            if (styled || cancelled) return
            styled = true
            map.setStyle(BLANK_STYLE)
            setBasemap("offline")
          }
          const t = setTimeout(fallback, 10000)
          map.once("style.load", () => {
            styled = true
            clearTimeout(t)
          })
          map.on("error", (e: any) => {
            if (!styled && /style|fetch|Failed/i.test(String(e?.error?.message || ""))) {
              clearTimeout(t)
              fallback()
            }
          })
        }
        if (cancelled) return map.remove()
        // Standalone deck.gl canvas synced to the basemap camera (works with Mapbox GL v3 and MapLibre alike).
        const host = deckHost.current!
        const viewState = () => {
          const c = map.getCenter()
          return { longitude: c.lng, latitude: c.lat, zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() }
        }
        const deck = new Deck({
          parent: host,
          style: { position: "absolute", left: "0", top: "0", pointerEvents: "none" } as any,
          width: "100%",
          height: "100%",
          controller: false,
          viewState: viewState(),
          layers: [],
        } as any)
        map.on("move", () => deck.setProps({ viewState: viewState() }))
        map.on("resize", () => deck.setProps({ viewState: viewState() }))
        map.on("mousemove", (e: any) => {
          const info: any = deck.pickObject({ x: e.point.x, y: e.point.y, radius: 4 })
          hoverRef.current?.(info ? { ...info, x: e.point.x, y: e.point.y } : { object: null })
        })
        map.on("click", (e: any) => {
          const info: any = deck.pickObject({ x: e.point.x, y: e.point.y, radius: 4 })
          if (info?.object) clickRef.current?.(info)
        })
        const ro = new ResizeObserver(() => {
          try {
            map.resize()
          } catch {}
        })
        ro.observe(container.current!)
        roRef.current = ro
        mapRef.current = map
        overlayRef.current = deck
        map.on("load", () => setMapReady(true))
        // MapLibre may never fire "load" if we swapped to the blank style early.
        setTimeout(() => setMapReady(true), 1500)
      } catch (e: any) {
        setErr(`Map failed to start: ${e?.message || e}`)
      }
    })()
    return () => {
      cancelled = true
      roRef.current?.disconnect()
      try {
        overlayRef.current?.finalize()
      } catch {}
      overlayRef.current = null
      try {
        mapRef.current?.remove()
      } catch {}
      mapRef.current = null
    }
  }, [token, useMapbox])

  // --- manifest + countries ---
  useEffect(() => {
    fetch("/api/data-packs")
      .then((r) => r.json())
      .then((m) => setManifest(m.packs || []))
      .catch(() => setErr("Could not load the data-pack manifest."))
    fetch("/data-packs/natural-earth-countries.geojson")
      .then((r) => r.json())
      .then(setCountries)
      .catch(() => {})
  }, [])

  const loadPack = useCallback(async (id: string, wantLive: boolean) => {
    setBusy(id)
    try {
      const r = await fetch(`/api/data-packs/${id}${wantLive ? "?live=1" : ""}`)
      const body = await r.json()
      if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`)
      const meta = body.meta || {}
      setLoaded((prev) => ({
        ...prev,
        [id]: {
          id,
          label: id,
          data: { type: "FeatureCollection", features: body.features || [] },
          mode: meta.mode === "live" ? "live" : "cached",
          note: meta.liveError ? `live fetch failed (${meta.liveError}); showing cached copy` : meta.fetchedAt ? `fetched ${new Date(meta.fetchedAt).toLocaleTimeString()}` : undefined,
        },
      }))
    } catch (e: any) {
      setErr(`${id}: ${e.message}`)
    } finally {
      setBusy(null)
    }
  }, [])

  useEffect(() => {
    for (const id of enabled) {
      if (id === "natural-earth-countries") continue
      const want = live.has(id)
      const cur = loaded[id]
      if (!cur || (want && cur.mode !== "live") || (!want && cur.mode === "live")) loadPack(id, want)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, live, loadPack])

  const active: Loaded[] = useMemo(() => {
    const fromPacks = [...enabled].filter((id) => id !== "natural-earth-countries").map((id) => loaded[id]).filter(Boolean) as Loaded[]
    const fromPage = collections.map((c) => ({ ...c, mode: "page" as const }))
    return [...fromPacks, ...fromPage, ...uploads]
  }, [enabled, loaded, collections, uploads])

  const { points, polygons } = useMemo(() => {
    const pts: { position: [number, number]; p: any }[] = []
    const polys: GeoFeature[] = []
    for (const l of active)
      for (const f of l.data.features) {
        if (!f.geometry) continue
        if (f.geometry.type === "Point") pts.push({ position: f.geometry.coordinates as [number, number], p: { ...f.properties, _layer: l.label } })
        else polys.push({ ...f, properties: { ...f.properties, _layer: l.label } })
      }
    return { points: pts, polygons: polys }
  }, [active])

  const threats = useMemo(() => countThreats(points), [points])

  // --- deck layers ---
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return
    const showCountries = enabled.has("natural-earth-countries") || basemap === "offline"
    const onHover = (info: any) => {
      const p = info.object?.p ?? info.object?.properties ?? (info.object?.points?.length ? { name: `${info.object.points.length} events in cell` } : null)
      setHover(p ? { x: info.x, y: info.y, p } : null)
    }
    const onClick = (info: any) => {
      const o = info.object
      if (!o || !onSelect) return
      if (o.p) onSelect({ type: "Feature", properties: o.p, geometry: { type: "Point", coordinates: o.position } })
      else if (o.properties) onSelect(o)
    }
    hoverRef.current = onHover
    clickRef.current = onClick
    const layers: any[] = []
    if (countries && showCountries) {
      layers.push(
        new GeoJsonLayer({
          id: "countries",
          data: countries as any,
          stroked: true,
          filled: true,
          getFillColor: basemap === "offline" ? [8, 18, 32, 210] : [0, 180, 255, 16],
          getLineColor: [0, 229, 255, 110],
          lineWidthMinPixels: 0.6,
          pickable: true,
          onHover,
        }),
      )
    }
    if (polygons.length) {
      layers.push(
        new GeoJsonLayer({
          id: "pack-polygons",
          data: { type: "FeatureCollection", features: polygons } as any,
          stroked: true,
          filled: true,
          getFillColor: (f: any) => [...(colorOf(f.properties).slice(0, 3) as number[]), 70] as any,
          getLineColor: (f: any) => colorOf(f.properties),
          lineWidthMinPixels: 1.2,
          pickable: true,
          onHover,
          onClick,
        }),
      )
    }
    if (points.length) {
      const common = { data: points, getPosition: (d: any) => d.position, pickable: true, onHover, onClick }
      if (mode === "hexagon")
        layers.push(
          new HexagonLayer({
            id: "hex",
            ...common,
            radius: 240000,
            extruded: true,
            elevationScale: 240,
            coverage: 0.82,
            colorRange: RAMP,
            getElevationWeight: (d: any) => d.p.weight ?? 0.5,
            getColorWeight: (d: any) => d.p.weight ?? 0.5,
          } as any),
        )
      else if (mode === "heatmap")
        layers.push(
          new HeatmapLayer({
            id: "heat",
            data: points,
            getPosition: (d: any) => d.position,
            getWeight: (d: any) => d.p.weight ?? 0.5,
            radiusPixels: 60,
            intensity: 1.75,
            threshold: 0.03,
            colorRange: RAMP,
          } as any),
        )
      // Soft halo under each point (pulse feel without a fake animation clock).
      layers.push(
        new ScatterplotLayer({
          id: "pts-halo",
          data: points,
          getPosition: (d: any) => d.position,
          radiusUnits: "pixels",
          getRadius: (d: any) => 10 + (d.p.weight ?? 0.5) * (mode === "points" ? 24 : 10),
          getFillColor: (d: any) => {
            const c = colorOf(d.p)
            return [c[0], c[1], c[2], mode === "points" ? 55 : 28]
          },
          stroked: false,
          pickable: false,
        } as any),
      )
      layers.push(
        new ScatterplotLayer({
          id: "pts",
          ...common,
          radiusUnits: "pixels",
          getRadius: (d: any) => 3 + (d.p.weight ?? 0.5) * (mode === "points" ? 12 : 5),
          getFillColor: (d: any) => colorOf(d.p),
          getLineColor: [232, 255, 255, 180],
          lineWidthMinPixels: 0.6,
          stroked: true,
        } as any),
      )
    }
    overlay.setProps({ layers })
  }, [points, polygons, countries, enabled, mode, basemap, mapReady, onSelect])

  const onFile = async (file: File) => {
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error("File is over 20 MB.")
      const fc = parseUpload(file.name, await file.text())
      setUploads((u) => [...u.filter((x) => x.id !== file.name), { id: file.name, label: file.name, data: fc, mode: "upload" }])
      setErr(null)
      const coords = fc.features.filter((f) => f.geometry?.type === "Point").map((f) => f.geometry!.coordinates as [number, number])
      if (coords.length && mapRef.current) {
        const xs = coords.map((c) => c[0]),
          ys = coords.map((c) => c[1])
        mapRef.current.fitBounds(
          [
            [Math.min(...xs), Math.min(...ys)],
            [Math.max(...xs), Math.max(...ys)],
          ],
          { padding: 60, maxZoom: 8, duration: 600 },
        )
      }
    } catch (e: any) {
      setErr(`${file.name}: ${e.message}`)
    }
  }

  const toggle = (set: Set<string>, id: string) => {
    const n = new Set(set)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  }

  const basemapLabel =
    basemap === "mapbox" ? "MAPBOX DARK" : basemap === "maplibre-carto" ? "MAPLIBRE · CARTO DARK (OSM)" : basemap === "offline" ? "OFFLINE BASEMAP (Natural Earth)" : "…"
  const dataMode = active.some((a) => a.mode === "live") ? "LIVE+CACHED" : "CACHED PACKS"
  const threatLine = `CRIT ${threats.critical} · HIGH ${threats.high} · MED ${threats.medium} · LOW ${threats.low}${threats.untyped ? ` · UNTYPED ${threats.untyped}` : ""}`

  return (
    <div className={`geomap-surface relative w-full overflow-hidden rounded-sm border border-cyan-500/30 bg-[#05070d] ${className}`} style={{ height }} data-testid="geo-map">
      {/* Mapbox/MapLibre add position:relative to the map element, so size it from an absolute wrapper. */}
      <div className="absolute inset-0">
        <div ref={container} style={{ width: "100%", height: "100%" }} />
      </div>
      <div ref={deckHost} className="pointer-events-none absolute inset-0 z-[1]" />

      <div className="geomap-hud" aria-hidden="true">
        <div className="geomap-vignette" />
        <div className="geomap-scanlines" />
        <span className="geomap-bracket tl" />
        <span className="geomap-bracket tr" />
        <span className="geomap-bracket bl" />
        <span className="geomap-bracket br" />
        <div className="geomap-crosshair">
          <span className="geomap-crosshair-dot" />
        </div>
      </div>

      <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-2">
        <div className="flex items-center gap-2 border border-cyan-500/40 bg-[#05070d]/85 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-200 backdrop-blur">
          <span>KEPLER · INTEL SURFACE</span>
          <span className="flex items-center gap-1 text-emerald-300">
            <span className="geomap-live-dot" />
            LIVE
          </span>
        </div>
        <div className="pointer-events-auto flex flex-wrap items-center gap-1">
          {hasToken && (
            <button
              type="button"
              onClick={() => {
                const next = !preferFree
                setPreferFree(next)
                window.localStorage.setItem("geomap-basemap", next ? "maplibre" : "mapbox")
                window.location.reload()
              }}
              className="border border-cyan-500/25 bg-[#05070d]/80 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-400 backdrop-blur hover:border-cyan-400/50 hover:text-cyan-200"
            >
              {preferFree ? "use mapbox" : "use free basemap"}
            </button>
          )}
          <div className="geomap-mode-switch" role="group" aria-label="Layer mode">
            {(["points", "hexagon", "heatmap"] as const).map((m) => (
              <button key={m} type="button" data-active={mode === m} onClick={() => setMode(m)}>
                {MODE_LABEL[m]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!compact && (
        <div className="absolute right-12 top-3 z-10 w-72 max-h-[calc(100%-4.5rem)] overflow-auto rounded-sm border border-cyan-500/30 bg-[#05070d]/92 p-3 font-mono text-[11px] text-slate-300 backdrop-blur">
          <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-cyan-300">Data packs</div>
          {manifest.map((p) => (
            <div key={p.id} className="mb-2">
              <label className="flex cursor-pointer items-start gap-2">
                <input type="checkbox" className="mt-0.5 accent-cyan-400" checked={enabled.has(p.id)} onChange={() => setEnabled((s) => toggle(s, p.id))} />
                <span>
                  <span className="text-cyan-50">{p.name}</span>
                  <span className="block text-[10px] text-slate-500">
                    {p.license} · {p.features ?? "?"} features{p.updated ? ` · cached ${p.updated.slice(0, 10)}` : ""}
                    {loaded[p.id]?.mode === "live" ? " · LIVE" : ""}
                    {busy === p.id ? " · loading…" : ""}
                  </span>
                  {loaded[p.id]?.note && <span className="block text-[10px] text-amber-300/80">{loaded[p.id].note}</span>}
                </span>
              </label>
              {p.live && enabled.has(p.id) && (
                <label className="ml-6 mt-0.5 flex cursor-pointer items-center gap-1 text-[10px] text-slate-400">
                  <input type="checkbox" className="accent-cyan-400" checked={live.has(p.id)} onChange={() => setLive((s) => toggle(s, p.id))} /> fetch live from source
                </label>
              )}
            </div>
          ))}
          {collections.map((c) => (
            <div key={c.id} className="mb-1 text-[10px] text-cyan-300/80">
              ● {c.label} ({c.data.features.length})
            </div>
          ))}
          <div className="mt-3 border-t border-cyan-500/20 pt-2">
            <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-violet-300">Load your own</div>
            <input
              type="file"
              accept=".geojson,.json,.csv,.tsv"
              data-testid="geo-upload"
              className="block w-full text-[10px] file:mr-2 file:rounded-sm file:border file:border-violet-400/40 file:bg-violet-500/10 file:px-2 file:py-0.5 file:text-violet-200"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onFile(f)
                e.currentTarget.value = ""
              }}
            />
            <div className="mt-1 text-[10px] text-slate-500">GeoJSON, JSON array, or CSV with lat/lng columns. Stays in your browser.</div>
            {uploads.map((u) => (
              <div key={u.id} className="mt-1 flex items-center justify-between text-[10px] text-violet-200">
                <span className="truncate">
                  ● {u.label} ({u.data.features.length})
                </span>
                <button type="button" className="text-slate-500 hover:text-rose-300" onClick={() => setUploads((x) => x.filter((y) => y.id !== u.id))}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {hover && (
        <div
          className="pointer-events-none absolute z-20 max-w-xs rounded-sm border border-cyan-400/50 bg-[#05070d]/95 px-2 py-1 font-mono text-[10px] text-slate-200 shadow-[0_0_18px_rgba(0,229,255,0.18)]"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          <div className="text-cyan-200">{hover.p.name}</div>
          {hover.p.headline && <div className="text-slate-400">{hover.p.headline}</div>}
          {hover.p.malware && <div className="text-slate-400">malware: {hover.p.malware}</div>}
          {hover.p.time && <div className="text-slate-400">{new Date(hover.p.time).toLocaleString()}</div>}
          {hover.p.severity && <div className="uppercase tracking-wider text-amber-300/90">threat: {hover.p.severity}</div>}
          {hover.p.location_precision && hover.p.location_precision !== "polygon" && <div className="text-amber-300/80">location: {hover.p.location_precision}-level</div>}
          {hover.p._layer && <div className="text-slate-500">{hover.p._layer}</div>}
        </div>
      )}

      {err && (
        <div className="absolute bottom-10 left-3 z-20 max-w-md rounded-sm border border-rose-500/40 bg-[#05070d]/90 px-2 py-1 font-mono text-[10px] text-rose-200">
          {err}{" "}
          <button type="button" className="ml-1 text-slate-400" onClick={() => setErr(null)}>
            ✕
          </button>
        </div>
      )}

      <div
        className="pointer-events-none absolute bottom-2 left-3 right-40 z-10 flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-sm border border-cyan-500/30 bg-[#05070d]/85 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-cyan-300"
        data-testid="geo-status"
      >
        <span>{basemapLabel}</span>
        <span className="text-cyan-500/60">·</span>
        <span>DECK.GL {MODE_LABEL[mode]}</span>
        <span className="text-cyan-500/60">·</span>
        <span>
          {points.length} PTS · {polygons.length} AREAS
        </span>
        <span className="text-cyan-500/60">·</span>
        <span>{dataMode}</span>
        <span className="text-cyan-500/60">·</span>
        <span className="normal-case tracking-wide text-amber-200/90">{threatLine}</span>
      </div>
    </div>
  )
}
