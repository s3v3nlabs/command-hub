"use client"

import { useEffect, useRef } from "react"
import type { ThreatFieldPoint } from "@/lib/offsec/threat-engine"

/** Canvas 2D heatmap fallback (no WebGL). Dark mil-tech greyscale + steel accent. */
export function ThreatField2D({
  field,
  selected,
  onSelect,
}: {
  field: ThreatFieldPoint[]
  selected?: string | null
  onSelect?: (id: string) => void
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return
    const w = c.width
    const h = c.height
    ctx.fillStyle = "#050505"
    ctx.fillRect(0, 0, w, h)

    // grid
    ctx.strokeStyle = "rgba(180,190,200,0.08)"
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * w
      const y = (i / 10) * h
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // soft intensity field (radial blobs)
    for (const p of field) {
      const x = p.x * w
      const y = (1 - p.y) * h
      const r = 40 + p.intensity * 70
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      const a = 0.15 + p.intensity * 0.55
      g.addColorStop(0, `rgba(200,210,220,${a})`)
      g.addColorStop(0.5, `rgba(120,140,160,${a * 0.4})`)
      g.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    // nodes + labels
    for (const p of field) {
      const x = p.x * w
      const y = (1 - p.y) * h
      const sel = selected === p.zoneId
      ctx.beginPath()
      ctx.arc(x, y, sel ? 7 : 5, 0, Math.PI * 2)
      ctx.fillStyle = sel ? "#d7dee8" : `rgba(200,210,220,${0.4 + p.intensity * 0.6})`
      ctx.fill()
      ctx.strokeStyle = "rgba(220,230,240,0.5)"
      ctx.stroke()
      ctx.fillStyle = "rgba(200,210,220,0.85)"
      ctx.font = "10px ui-monospace, monospace"
      ctx.fillText(`${p.label} ${(p.intensity * 100).toFixed(0)}`, x + 8, y - 6)
    }
  }, [field, selected])

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSelect || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * ref.current.width
    const my = ((e.clientY - rect.top) / rect.height) * ref.current.height
    let best: ThreatFieldPoint | null = null
    let bestD = Infinity
    for (const p of field) {
      const x = p.x * ref.current.width
      const y = (1 - p.y) * ref.current.height
      const d = (x - mx) ** 2 + (y - my) ** 2
      if (d < bestD) {
        bestD = d
        best = p
      }
    }
    if (best && bestD < 900) onSelect(best.zoneId)
  }

  return (
    <canvas
      ref={ref}
      width={900}
      height={480}
      onClick={onClick}
      className="h-auto w-full cursor-crosshair rounded-[2px] border border-[color:var(--ghost-line)] bg-black"
    />
  )
}
