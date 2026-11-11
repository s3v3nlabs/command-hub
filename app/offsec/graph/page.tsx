"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Plus, Link2, Trash2, Download, Upload, Crosshair, ExternalLink } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"
import {
  type Graph,
  type GraphNode,
  type EntityType,
  ENTITY_TYPES,
  PIVOTS,
  GRAPH_STORAGE_KEY,
} from "@/lib/offsec/graph-model"

const uid = () => Math.random().toString(36).slice(2, 10)

const TYPE_GLYPH: Record<EntityType, string> = Object.fromEntries(ENTITY_TYPES.map((t) => [t.id, t.glyph])) as Record<EntityType, string>

export default function EntityGraphPage() {
  const [graph, setGraph] = useState<Graph>({ nodes: [], edges: [] })
  const [selected, setSelected] = useState<string | null>(null)
  const [linkFrom, setLinkFrom] = useState<string | null>(null)
  const [addType, setAddType] = useState<EntityType>("domain")
  const [addLabel, setAddLabel] = useState("")
  const svgRef = useRef<SVGSVGElement>(null)
  const dragId = useRef<string | null>(null)
  const rafRef = useRef<number | undefined>(undefined)
  const graphRef = useRef(graph)
  graphRef.current = graph

  // load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(GRAPH_STORAGE_KEY)
      if (raw) setGraph(JSON.parse(raw))
    } catch {
      /* ignore */
    }
  }, [])
  // persist (debounced via rAF-less simple effect)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(graph))
      } catch {
        /* ignore */
      }
    }, 300)
    return () => clearTimeout(t)
  }, [graph])

  // force simulation
  useEffect(() => {
    let running = true
    const step = () => {
      if (!running) return
      const g = graphRef.current
      if (g.nodes.length > 1) {
        const next = g.nodes.map((n) => ({ ...n }))
        const idx: Record<string, number> = {}
        next.forEach((n, i) => (idx[n.id] = i))
        const cx = 480
        const cy = 320
        for (let i = 0; i < next.length; i++) {
          const a = next[i]
          if (a.pinned || a.id === dragId.current) continue
          let fx = (cx - a.x) * 0.002
          let fy = (cy - a.y) * 0.002
          for (let j = 0; j < next.length; j++) {
            if (i === j) continue
            const b = next[j]
            const dx = a.x - b.x
            const dy = a.y - b.y
            const d2 = dx * dx + dy * dy || 1
            const rep = 2600 / d2
            fx += dx * rep * 0.02
            fy += dy * rep * 0.02
          }
          a.x += Math.max(-6, Math.min(6, fx))
          a.y += Math.max(-6, Math.min(6, fy))
        }
        for (const e of g.edges) {
          const a = next[idx[e.source]]
          const b = next[idx[e.target]]
          if (!a || !b) continue
          const dx = b.x - a.x
          const dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const diff = (dist - 150) / dist
          const ox = dx * diff * 0.03
          const oy = dy * diff * 0.03
          if (!a.pinned && a.id !== dragId.current) {
            a.x += ox
            a.y += oy
          }
          if (!b.pinned && b.id !== dragId.current) {
            b.x -= ox
            b.y -= oy
          }
        }
        let moved = false
        for (let i = 0; i < next.length; i++) {
          if (Math.abs(next[i].x - g.nodes[i].x) > 0.1 || Math.abs(next[i].y - g.nodes[i].y) > 0.1) moved = true
        }
        if (moved) setGraph((prev) => ({ ...prev, nodes: next }))
      }
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      running = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const addNode = () => {
    const label = addLabel.trim()
    if (!label) return
    const n: GraphNode = { id: uid(), type: addType, label, x: 380 + Math.random() * 200, y: 240 + Math.random() * 160 }
    setGraph((g) => ({ ...g, nodes: [...g.nodes, n] }))
    setAddLabel("")
    setSelected(n.id)
  }

  const removeNode = (id: string) => {
    setGraph((g) => ({ nodes: g.nodes.filter((n) => n.id !== id), edges: g.edges.filter((e) => e.source !== id && e.target !== id) }))
    if (selected === id) setSelected(null)
  }

  const onNodeClick = (id: string) => {
    if (linkFrom && linkFrom !== id) {
      setGraph((g) =>
        g.edges.some((e) => (e.source === linkFrom && e.target === id) || (e.source === id && e.target === linkFrom))
          ? g
          : { ...g, edges: [...g.edges, { id: uid(), source: linkFrom, target: id }] },
      )
      setLinkFrom(null)
      return
    }
    setSelected(id)
  }

  const toSvgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { x: clientX, y: clientY }
    const r = svg.getBoundingClientRect()
    return { x: ((clientX - r.left) / r.width) * 960, y: ((clientY - r.top) / r.height) * 640 }
  }

  const onPointerDown = (id: string) => (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    dragId.current = id
    setSelected(id)
  }
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragId.current) return
    const p = toSvgPoint(e.clientX, e.clientY)
    setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => (n.id === dragId.current ? { ...n, x: p.x, y: p.y } : n)) }))
  }, [])
  const onPointerUp = () => {
    dragId.current = null
  }

  const exportGraph = () => {
    const blob = new Blob([JSON.stringify(graph, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `entity-graph-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  const importGraph = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const g = JSON.parse(String(reader.result))
        if (Array.isArray(g.nodes) && Array.isArray(g.edges)) setGraph(g)
      } catch {
        /* ignore */
      }
    }
    reader.readAsText(file)
  }

  const sel = graph.nodes.find((n) => n.id === selected) || null

  return (
    <SuiteShell
      title="ENTITY GRAPH"
      status="real"
      nav={
        <>
          <SuiteNavLink href="/offsec" label="Arsenal" />
          <SuiteNavLink href="/offsec/osint" label="OSINT Suite" />
          <SuiteNavLink href="/offsec/engagements" label="Engagements" />
        </>
      }
    >
      <div className="mx-auto grid max-w-6xl gap-3 lg:grid-cols-[1fr_280px]">
        <div className="ghost-glass ghost-brackets relative overflow-hidden rounded-[2px]">
          <div className="flex flex-wrap items-center gap-1.5 border-b border-[color:var(--ghost-line)] bg-black/50 p-2">
            <select className="ghost-input font-mono max-w-[130px]" value={addType} onChange={(e) => setAddType(e.target.value as EntityType)}>
              {ENTITY_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.glyph} {t.label}
                </option>
              ))}
            </select>
            <input
              className="ghost-input font-mono max-w-[200px]"
              placeholder="entity value"
              value={addLabel}
              onChange={(e) => setAddLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNode()}
            />
            <button type="button" className="ghost-btn" onClick={addNode}>
              <Plus size={11} /> Add
            </button>
            <span className="mx-1 h-4 w-px bg-white/10" />
            <button type="button" className="ghost-btn" data-on={!!linkFrom} disabled={!selected} onClick={() => setLinkFrom(selected)} title="Link: pick target node">
              <Link2 size={11} /> {linkFrom ? "pick target…" : "Link"}
            </button>
            <div className="ml-auto flex items-center gap-1.5">
              <button type="button" className="ghost-icon-btn" onClick={exportGraph} title="Export JSON">
                <Download size={13} />
              </button>
              <label className="ghost-icon-btn cursor-pointer" title="Import JSON">
                <Upload size={13} />
                <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importGraph(e.target.files[0])} />
              </label>
              <span className="ghost-chip">
                {graph.nodes.length}n / {graph.edges.length}e
              </span>
            </div>
          </div>
          <svg
            ref={svgRef}
            viewBox="0 0 960 640"
            className="h-[600px] w-full touch-none select-none"
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onClick={() => setSelected(null)}
          >
            {graph.edges.map((e) => {
              const a = graph.nodes.find((n) => n.id === e.source)
              const b = graph.nodes.find((n) => n.id === e.target)
              if (!a || !b) return null
              return <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(185,198,207,0.35)" strokeWidth={1} />
            })}
            {graph.nodes.map((n) => {
              const active = n.id === selected
              return (
                <g key={n.id} transform={`translate(${n.x},${n.y})`} onPointerDown={onPointerDown(n.id)} onClick={(e) => (e.stopPropagation(), onNodeClick(n.id))} className="cursor-grab">
                  <circle r={active ? 20 : 16} fill="rgba(8,11,15,0.85)" stroke={active ? "var(--ghost-accent)" : "rgba(196,206,216,0.4)"} strokeWidth={active ? 2 : 1} />
                  <text textAnchor="middle" dy="4" fontSize="13" fill="var(--ghost-ink)">
                    {TYPE_GLYPH[n.type]}
                  </text>
                  <text textAnchor="middle" y={active ? 34 : 30} fontSize="10" fill="var(--ghost-dim)" className="font-mono">
                    {n.label.length > 22 ? n.label.slice(0, 21) + "…" : n.label}
                  </text>
                </g>
              )
            })}
          </svg>
          {graph.nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center text-[color:var(--ghost-dim)]">
                <Crosshair className="mx-auto mb-2 opacity-40" />
                <div className="text-[12px]">Add entities, then Link them to map relationships.</div>
              </div>
            </div>
          )}
        </div>

        {/* inspector */}
        <div className="ghost-glass rounded-[2px] p-3">
          <div className="ghost-label mb-2">Inspector</div>
          {!sel ? (
            <div className="text-[11px] text-[color:var(--ghost-dim)]">Select a node to inspect, pin, add metadata, or open OSINT pivots.</div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] text-[color:var(--ghost-ink)]">
                  {TYPE_GLYPH[sel.type]} {sel.type}
                </span>
                <button type="button" className="ghost-icon-btn danger" onClick={() => removeNode(sel.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
              <input
                className="ghost-input font-mono"
                value={sel.label}
                onChange={(e) => setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => (n.id === sel.id ? { ...n, label: e.target.value } : n)) }))}
              />
              <button
                type="button"
                className="ghost-btn w-full"
                data-on={sel.pinned}
                onClick={() => setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => (n.id === sel.id ? { ...n, pinned: !n.pinned } : n)) }))}
              >
                {sel.pinned ? "Unpin" : "Pin position"}
              </button>
              {PIVOTS[sel.type] && (
                <div className="space-y-1">
                  <div className="ghost-label">OSINT pivots</div>
                  {PIVOTS[sel.type]!.map((p) => (
                    <a key={p.label} className="ghost-btn w-full justify-start" href={p.url(sel.label)} target="_blank" rel="noreferrer noopener">
                      <ExternalLink size={11} /> {p.label}
                    </a>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-[color:var(--ghost-faint)]">
                Pivots open public OSINT resources in a new tab. No automated querying is performed here.
              </p>
            </div>
          )}
          <div className="mt-3 border-t border-[color:var(--ghost-line)] pt-2 text-[10px] text-[color:var(--ghost-faint)]">
            Our aesthetic — a lightweight force-directed investigative graph. Saved to this browser. Export JSON to share
            with the team.
          </div>
        </div>
      </div>
    </SuiteShell>
  )
}
