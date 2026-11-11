"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Camera,
  Plus,
  RefreshCw,
  Save,
  ShieldAlert,
  LayoutGrid,
} from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { TileCard } from "@/components/cctv/tile-card"
import type { CctvLayout, CctvTile } from "@/lib/cctv/types"
import { emptyTileMeta } from "@/lib/cctv/types"
import { VENDOR_PATTERNS } from "@/lib/cctv/vendors"
import { LEGAL_SHORT } from "@/lib/offsec/legal"

const ACK_KEY = "cctv_legal_ack_v1"

export default function CctvWallPage() {
  const [layouts, setLayouts] = useState<CctvLayout[]>([])
  const [layout, setLayout] = useState<CctvLayout | null>(null)
  const [connectEnabled, setConnectEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [ack, setAck] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [l, s] = await Promise.all([
        fetch("/api/cctv/layouts").then((r) => r.json()),
        fetch("/api/cctv/transcode").then((r) => r.json()),
      ])
      if (l?.ok) {
        setLayouts(l.layouts || [])
        if (!layout && l.layouts?.[0]) setLayout(l.layouts[0])
        else if (layout) {
          const fresh = (l.layouts || []).find((x: CctvLayout) => x.id === layout.id)
          if (fresh) setLayout(fresh)
        }
      }
      if (s?.ok) setConnectEnabled(!!s.connectEnabled)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [layout])

  useEffect(() => {
    try {
      setAck(localStorage.getItem(ACK_KEY) === "1")
    } catch {
      /* ignore */
    }
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createLayout = async () => {
    const r = await fetch("/api/cctv/layouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name: `Wall ${new Date().toISOString().slice(0, 16)}`, cols: 3, rows: 2 }),
    }).then((x) => x.json())
    if (r?.ok) {
      setLayout(r.layout)
      await refresh()
    } else setMsg(r?.error || "create failed")
  }

  const save = async () => {
    if (!layout) return
    const r = await fetch("/api/cctv/layouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", layout }),
    }).then((x) => x.json())
    setMsg(r?.ok ? "saved" : r?.error || "save failed")
    if (r?.ok) setLayout(r.layout)
  }

  const addTile = async () => {
    if (!layout) return
    if (url.trim()) {
      const r = await fetch("/api/cctv/layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_from_recon",
          layoutId: layout.id,
          source: "dork",
          url: url.trim(),
          title: title.trim() || undefined,
          addedBy: "operator",
        }),
      }).then((x) => x.json())
      if (r?.ok) {
        setLayout(r.layout)
        setUrl("")
        setTitle("")
      } else setMsg(r?.error || "add failed")
      return
    }
    // blank tile
    const tile: CctvTile = {
      id: crypto.randomUUID(),
      title: title.trim() || `Cam ${layout.tiles.length + 1}`,
      col: layout.tiles.length % layout.cols,
      row: Math.floor(layout.tiles.length / layout.cols),
      meta: emptyTileMeta({
        engagement: {
          engagementId: layout.engagementId,
          addedBy: "operator",
          addedAt: new Date().toISOString(),
          authorizationStatus: "unconfirmed",
        },
      }),
    }
    setLayout({ ...layout, tiles: [...layout.tiles, tile] })
    setTitle("")
  }

  const updateTile = (id: string, next: CctvTile) => {
    if (!layout) return
    setLayout({ ...layout, tiles: layout.tiles.map((t) => (t.id === id ? next : t)) })
  }

  const removeTile = (id: string) => {
    if (!layout) return
    setLayout({ ...layout, tiles: layout.tiles.filter((t) => t.id !== id) })
  }

  const doAck = () => {
    setAck(true)
    try {
      localStorage.setItem(ACK_KEY, "1")
    } catch {
      /* ignore */
    }
    if (layout) {
      void fetch("/api/cctv/layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ack_legal", id: layout.id }),
      })
    }
  }

  return (
    <div className="hub-shell flex bg-black text-[color:var(--ghost-ink)]">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="INTELLIGENCE // CCTV WALL" />
        <main className="hub-shell-scroll ghost-grid-bg min-h-0 flex-1 overflow-auto p-4">
          <div className="mx-auto max-w-7xl space-y-4">
            <div className="ghost-glass ghost-brackets rounded-[2px] border border-amber-500/30 p-4">
              <div className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.12em] text-amber-200">
                <ShieldAlert size={15} /> Authorization required
              </div>
              <p className="mt-1 text-[12px] text-[color:var(--ghost-dim)]">{LEGAL_SHORT}</p>
              <p className="mt-1 text-[11px] text-[color:var(--ghost-dim)]">
                Only add cameras you own or have <span className="text-[color:var(--ghost-ink)]">explicit written
                authorization</span> to monitor. No real camera IPs or credentials are shipped in this repo. Metadata
                display works while locked; connecting to third-party targets requires{" "}
                <span className="font-mono">CCTV_CONNECT_ENABLED=1</span>, hub auth, and per-tile authorization
                confirmation.
                {connectEnabled ? (
                  <span className="ml-2 text-emerald-300/80">connect: enabled</span>
                ) : (
                  <span className="ml-2 text-amber-300/80">connect: gated</span>
                )}
              </p>
              {!ack && (
                <button type="button" className="ghost-btn mt-2" onClick={doAck}>
                  I acknowledge — authorized use only
                </button>
              )}
            </div>

            {!ack ? (
              <p className="font-mono text-[12px] text-[color:var(--ghost-faint)]">
                Acknowledge the legal notice to use the video wall.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <LayoutGrid size={14} />
                  <select
                    className="ghost-input font-mono"
                    value={layout?.id || ""}
                    onChange={(e) => {
                      const l = layouts.find((x) => x.id === e.target.value)
                      if (l) setLayout(l)
                    }}
                  >
                    <option value="">select layout</option>
                    {layouts.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="ghost-btn" onClick={() => void createLayout()}>
                    <Plus size={12} /> New layout
                  </button>
                  <button type="button" className="ghost-btn" disabled={!layout} onClick={() => void save()}>
                    <Save size={12} /> Save
                  </button>
                  <button type="button" className="ghost-icon-btn" onClick={() => void refresh()}>
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                  </button>
                  {msg && <span className="font-mono text-[10px] text-[color:var(--ghost-faint)]">{msg}</span>}
                </div>

                <div className="ghost-glass ghost-brackets grid gap-2 rounded-[2px] p-3 md:grid-cols-[1fr_1fr_auto]">
                  <label className="flex flex-col gap-1">
                    <span className="ghost-label">Stream / snapshot URL (optional)</span>
                    <input
                      className="ghost-input font-mono"
                      placeholder="rtsp://… · http://…/mjpeg · https://…/index.m3u8 · /local.mp4"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="ghost-label">Title</span>
                    <input
                      className="ghost-input font-mono"
                      placeholder="Front gate"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </label>
                  <div className="flex items-end">
                    <button type="button" className="ghost-btn" disabled={!layout} onClick={() => void addTile()}>
                      <Camera size={12} /> Add tile
                    </button>
                  </div>
                  <div className="md:col-span-3">
                    <div className="ghost-label mb-1">Vendor URL patterns (fill host yourself — no live probes)</div>
                    <div className="flex flex-wrap gap-1">
                      {VENDOR_PATTERNS.map((v) => (
                        <button
                          key={v.vendor}
                          type="button"
                          className="ghost-chip"
                          title={v.streamExamples[0]}
                          onClick={() => setUrl(v.streamExamples[0])}
                        >
                          {v.vendor}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {layout && (
                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
                    }}
                  >
                    {layout.tiles.map((t) => (
                      <TileCard
                        key={t.id}
                        tile={t}
                        connectEnabled={connectEnabled}
                        onChange={(next) => updateTile(t.id, next)}
                        onRemove={() => removeTile(t.id)}
                      />
                    ))}
                    {!layout.tiles.length && (
                      <div className="ghost-glass rounded-[2px] p-6 font-mono text-[11px] text-[color:var(--ghost-faint)] md:col-span-3">
                        No tiles yet. Add a URL from recon / vendor pattern, or a blank tile. Sending a Shodan/Censys
                        host via <span className="text-[color:var(--ghost-ink)]">action: add_from_recon</span> hydrates
                        network / geo / device / exposure metadata automatically.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
