"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Smartphone, Battery, Radio } from "lucide-react"

type Live = {
  id: string
  label: string
  updatedAt: string
  media?: { phoneCam?: boolean; phoneMic?: boolean }
  telemetry?: { battery?: { level: number; charging?: boolean }; hasGeo?: boolean }
}

/**
 * CCTV-wall hook for Device Bridge sessions.
 * WebRTC is 1:1 — this strip lists live bodycams and links to the hub seat
 * rather than opening a second peer (which would steal the viewer).
 */
export function BodycamStrip() {
  const [rows, setRows] = useState<Live[] | null>(null)
  const [auth, setAuth] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const r = await fetch("/api/companion/status").then((x) => x.json())
        if (cancelled) return
        if (r?.ok && Array.isArray(r.sessions)) {
          setRows(r.sessions)
          setAuth(true)
        } else if (r?.ok) {
          setRows([])
          setAuth(!r.authRequired)
        }
      } catch {
        if (!cancelled) setRows([])
      }
    }
    void load()
    const id = setInterval(load, 8000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  if (rows === null) return null
  if (auth === false || (rows.length === 0 && auth !== true)) {
    // Keep the wall quiet when nothing is live or the status is unauthenticated.
    if (!rows.length) return null
  }

  return (
    <div className="rounded border border-[color:var(--ghost-line)] bg-black/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--ghost-dim)]">
          <Smartphone size={12} />
          Device Bridge bodycams
        </div>
        <Link href="/companion/hub-view" className="font-mono text-[10px] text-[color:var(--ghost-dim)] underline-offset-2 hover:underline">
          Open viewer
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-[11px] text-[color:var(--ghost-faint)]">
          No live phone sessions. Pair a phone at <code>/companion</code>. One viewer per session — take the
          seat here rather than embedding a second WebRTC peer.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => (
            <li key={s.id}>
              <Link
                href={`/companion/hub-view?session=${encodeURIComponent(s.id)}`}
                className="flex items-center justify-between gap-2 rounded border border-[color:var(--ghost-line)] px-3 py-2 text-xs hover:border-[color:var(--ghost-line-strong)]"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[color:var(--ghost-ink)]">{s.label}</div>
                  <div className="font-mono text-[9px] text-[color:var(--ghost-faint)]">
                    {s.media?.phoneCam ? "cam" : "no cam"}
                    {s.media?.phoneMic ? " · mic" : ""}
                    {s.telemetry?.hasGeo ? " · GPS" : ""}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-[10px] text-[color:var(--ghost-dim)]">
                  {s.telemetry?.battery ? (
                    <span className="inline-flex items-center gap-0.5">
                      <Battery size={10} />
                      {Math.round(s.telemetry.battery.level * 100)}%
                    </span>
                  ) : null}
                  <Radio size={10} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
