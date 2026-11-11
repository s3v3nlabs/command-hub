"use client"

import { useMemo, useState } from "react"
import {
  Camera,
  ChevronDown,
  ChevronUp,
  MapPin,
  Shield,
  Network,
  Cpu,
  FileText,
  Maximize2,
  Trash2,
} from "lucide-react"
import type { CctvTile } from "@/lib/cctv/types"

function MetaRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "") return null
  return (
    <div className="flex justify-between gap-2 font-mono text-[10px] text-[color:var(--ghost-dim)]">
      <span className="text-[color:var(--ghost-faint)]">{label}</span>
      <span className="truncate text-right text-[color:var(--ghost-ink)]">{String(value)}</span>
    </div>
  )
}

export function TileCard({
  tile,
  connectEnabled,
  onChange,
  onRemove,
  onFullscreen,
}: {
  tile: CctvTile
  connectEnabled: boolean
  onChange: (t: CctvTile) => void
  onRemove: () => void
  onFullscreen?: () => void
}) {
  const [detail, setDetail] = useState(!!tile.detailOpen)
  const stream = tile.meta.network.streamUrl
  const snap = tile.meta.network.snapshotUrl
  const auth = tile.meta.engagement.authorizationStatus
  const canShowMedia =
    tile.meta.network.protocol === "webcam" ||
    tile.meta.network.protocol === "mp4" ||
    tile.meta.network.protocol === "hls" ||
    tile.meta.network.protocol === "mjpeg" ||
    tile.meta.network.protocol === "http"

  const preview = useMemo(() => {
    if (tile.meta.network.protocol === "webcam") {
      return (
        <div className="flex h-full items-center justify-center font-mono text-[10px] text-[color:var(--ghost-faint)]">
          webcam — use browser getUserMedia in fullscreen (local only)
        </div>
      )
    }
    if (snap && (snap.startsWith("/") || snap.startsWith("blob:") || snap.startsWith("data:"))) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={snap} alt={tile.title} className="h-full w-full object-cover opacity-90" />
      )
    }
    if (canShowMedia && stream && (stream.startsWith("/") || stream.endsWith(".mp4") || stream.includes(".m3u8"))) {
      return (
        <video
          className="h-full w-full object-cover"
          src={stream}
          muted
          playsInline
          controls
          poster={snap}
        />
      )
    }
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center">
        <Camera size={18} className="text-[color:var(--ghost-faint)]" />
        <div className="font-mono text-[10px] text-[color:var(--ghost-dim)]">
          {stream ? `${tile.meta.network.protocol.toUpperCase()} configured` : "no stream URL"}
        </div>
        {!connectEnabled && stream && (
          <div className="font-mono text-[9px] text-amber-300/80">connect gated — metadata only</div>
        )}
        {connectEnabled && auth !== "confirmed" && auth !== "in-scope" && stream && (
          <div className="font-mono text-[9px] text-amber-300/80">confirm authorization to connect</div>
        )}
      </div>
    )
  }, [tile, snap, stream, canShowMedia, connectEnabled, auth])

  return (
    <div className="ghost-glass ghost-brackets flex min-h-[220px] flex-col overflow-hidden rounded-[2px]">
      <div className="flex items-center justify-between gap-1 border-b border-[color:var(--ghost-line)] bg-black/50 px-2 py-1">
        <span className="truncate font-mono text-[11px] uppercase tracking-[0.08em] text-[color:var(--ghost-ink)]">
          {tile.title}
        </span>
        <div className="flex items-center gap-0.5">
          <span className="ghost-chip">{tile.meta.network.protocol}</span>
          <span
            className={`ghost-chip ${
              auth === "confirmed" || auth === "in-scope" ? "accent" : ""
            }`}
          >
            {auth}
          </span>
          {onFullscreen && (
            <button type="button" className="ghost-icon-btn" onClick={onFullscreen} title="Fullscreen">
              <Maximize2 size={11} />
            </button>
          )}
          <button type="button" className="ghost-icon-btn" onClick={onRemove} title="Remove tile">
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 md:grid-cols-[1.2fr_1fr]">
        <div className="relative min-h-[140px] bg-black/80">{preview}</div>

        <div className="space-y-1.5 border-l border-[color:var(--ghost-line)] bg-black/40 p-2">
          <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[color:var(--ghost-ink)]">
            <Network size={10} /> Network
          </div>
          <MetaRow label="ip/host" value={tile.meta.network.ip || tile.meta.network.host} />
          <MetaRow label="hostname" value={tile.meta.network.hostname || tile.meta.network.reverseDns} />
          <MetaRow label="ASN/org" value={[tile.meta.network.asn, tile.meta.network.org].filter(Boolean).join(" · ")} />
          <MetaRow
            label="ports"
            value={tile.meta.network.openPorts?.length ? tile.meta.network.openPorts.join(",") : undefined}
          />

          <div className="flex items-center gap-1 pt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[color:var(--ghost-ink)]">
            <Cpu size={10} /> Device
          </div>
          <MetaRow label="vendor" value={tile.meta.device.vendor} />
          <MetaRow label="model" value={tile.meta.device.model} />
          <MetaRow label="fw" value={tile.meta.device.firmware} />

          <div className="flex items-center gap-1 pt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[color:var(--ghost-ink)]">
            <Shield size={10} /> Exposure
          </div>
          <MetaRow label="auth" value={tile.meta.exposure.authState} />
          <MetaRow
            label="tags"
            value={[...(tile.meta.exposure.shodanTags || []), ...(tile.meta.exposure.censysTags || [])]
              .slice(0, 6)
              .join(", ")}
          />
          <MetaRow label="CVEs" value={tile.meta.exposure.cves?.slice(0, 4).join(", ")} />
          <MetaRow
            label="confidence"
            value={
              tile.meta.exposure.confidence != null
                ? `${Math.round(tile.meta.exposure.confidence * 100)}% (modeled)`
                : undefined
            }
          />

          <button
            type="button"
            className="ghost-btn mt-1 w-full justify-center"
            onClick={() => {
              setDetail((d) => !d)
              onChange({ ...tile, detailOpen: !detail })
            }}
          >
            {detail ? <ChevronUp size={11} /> : <ChevronDown size={11} />}{" "}
            {detail ? "Hide detail" : "Full detail"}
          </button>
        </div>
      </div>

      {detail && (
        <div className="space-y-2 border-t border-[color:var(--ghost-line)] bg-black/60 p-2">
          <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[color:var(--ghost-ink)]">
            <MapPin size={10} /> Geo · Engagement · Notes
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <MetaRow label="country" value={tile.meta.geo.country} />
              <MetaRow label="city" value={tile.meta.geo.city} />
              <MetaRow
                label="lat/lon"
                value={
                  tile.meta.geo.lat != null && tile.meta.geo.lon != null
                    ? `${tile.meta.geo.lat}, ${tile.meta.geo.lon}`
                    : undefined
                }
              />
            </div>
            <div>
              <MetaRow label="engagement" value={tile.meta.engagement.engagementId} />
              <MetaRow label="added by" value={tile.meta.engagement.addedBy} />
              <MetaRow label="added at" value={tile.meta.engagement.addedAt} />
              <label className="mt-1 flex flex-col gap-1">
                <span className="ghost-label">authorization</span>
                <select
                  className="ghost-input font-mono text-[11px]"
                  value={tile.meta.engagement.authorizationStatus}
                  onChange={(e) =>
                    onChange({
                      ...tile,
                      meta: {
                        ...tile.meta,
                        engagement: {
                          ...tile.meta.engagement,
                          authorizationStatus: e.target.value as any,
                        },
                      },
                    })
                  }
                >
                  <option value="unconfirmed">unconfirmed</option>
                  <option value="confirmed">confirmed</option>
                  <option value="in-scope">in-scope</option>
                  <option value="denied">denied</option>
                </select>
              </label>
            </div>
            <div>
              <MetaRow label="stream" value={tile.meta.network.streamUrl} />
              <MetaRow label="snapshot" value={tile.meta.network.snapshotUrl} />
              <MetaRow label="banner" value={tile.meta.device.banner || tile.meta.exposure.banner} />
              <MetaRow
                label="default-cred notes"
                value={tile.meta.exposure.defaultCredNotes?.join("; ")}
              />
            </div>
          </div>
          <label className="flex flex-col gap-1">
            <span className="ghost-label inline-flex items-center gap-1">
              <FileText size={10} /> operator notes
            </span>
            <textarea
              className="ghost-input min-h-[56px] font-mono text-[11px]"
              value={tile.meta.notes || ""}
              onChange={(e) =>
                onChange({ ...tile, meta: { ...tile.meta, notes: e.target.value.slice(0, 4000) } })
              }
              placeholder="Manual notes / engagement context"
            />
          </label>
        </div>
      )}
    </div>
  )
}
