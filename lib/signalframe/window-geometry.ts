/**
 * SignalFrame window geometry — pure helpers for the ghostnode window system.
 * Grid snap, magnetic edge snap (workspace + sibling windows), drag-to-edge
 * snap zones, tiling presets, free-slot placement and layout persistence.
 * No DOM access except the optional localStorage helpers at the bottom.
 */

export type Rect = { x: number; y: number; width: number; height: number }
export type Size = { width: number; height: number }
export type SnapZone =
  | "left"
  | "right"
  | "top"
  | "maximize"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | null

export type TilePreset = "grid" | "columns" | "rows" | "cascade" | "focus"

export const MIN_W = 280
export const MIN_H = 200
export const GAP = 8

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

export function snapValue(n: number, grid: number): number {
  return grid > 0 ? Math.round(n / grid) * grid : n
}

export function clampRect(r: Rect, ws: Size): Rect {
  const width = clamp(r.width, Math.min(MIN_W, ws.width), Math.max(MIN_W, ws.width))
  const height = clamp(r.height, Math.min(MIN_H, ws.height), Math.max(MIN_H, ws.height))
  return {
    width,
    height,
    x: clamp(r.x, 0, Math.max(0, ws.width - width)),
    y: clamp(r.y, 0, Math.max(0, ws.height - height)),
  }
}

/**
 * Magnetic edge snap: pull a rect's edges onto workspace edges or sibling
 * window edges when within `threshold` px. Returns the adjusted position and
 * guide lines (for drawing alignment hints).
 */
export function magnetSnap(
  r: Rect,
  others: Rect[],
  ws: Size,
  threshold = 10,
): { x: number; y: number; guidesX: number[]; guidesY: number[] } {
  const xs: number[] = [0, ws.width]
  const ys: number[] = [0, ws.height]
  for (const o of others) {
    xs.push(o.x, o.x + o.width, o.x - GAP, o.x + o.width + GAP)
    ys.push(o.y, o.y + o.height, o.y - GAP, o.y + o.height + GAP)
  }
  let bestX = r.x
  let dX = threshold + 1
  let gX: number | null = null
  for (const t of xs) {
    const dl = Math.abs(r.x - t)
    if (dl < dX) {
      dX = dl
      bestX = t
      gX = t
    }
    const dr = Math.abs(r.x + r.width - t)
    if (dr < dX) {
      dX = dr
      bestX = t - r.width
      gX = t
    }
  }
  let bestY = r.y
  let dY = threshold + 1
  let gY: number | null = null
  for (const t of ys) {
    const dt = Math.abs(r.y - t)
    if (dt < dY) {
      dY = dt
      bestY = t
      gY = t
    }
    const db = Math.abs(r.y + r.height - t)
    if (db < dY) {
      dY = db
      bestY = t - r.height
      gY = t
    }
  }
  return {
    x: dX <= threshold ? bestX : r.x,
    y: dY <= threshold ? bestY : r.y,
    guidesX: dX <= threshold && gX != null ? [gX] : [],
    guidesY: dY <= threshold && gY != null ? [gY] : [],
  }
}

/** Pointer near a workspace edge → snap zone (Aero-style). */
export function detectSnapZone(px: number, py: number, ws: Size, edge = 18): SnapZone {
  const nearL = px <= edge
  const nearR = px >= ws.width - edge
  const nearT = py <= edge
  const nearB = py >= ws.height - edge
  if (nearT && nearL) return "top-left"
  if (nearT && nearR) return "top-right"
  if (nearB && nearL) return "bottom-left"
  if (nearB && nearR) return "bottom-right"
  if (nearT) return "maximize"
  if (nearL) return "left"
  if (nearR) return "right"
  return null
}

export function zoneRect(zone: Exclude<SnapZone, null>, ws: Size): Rect {
  const hw = Math.floor((ws.width - GAP * 3) / 2)
  const hh = Math.floor((ws.height - GAP * 3) / 2)
  const fullH = ws.height - GAP * 2
  const fullW = ws.width - GAP * 2
  switch (zone) {
    case "left":
      return { x: GAP, y: GAP, width: hw, height: fullH }
    case "right":
      return { x: GAP * 2 + hw, y: GAP, width: hw, height: fullH }
    case "top":
      return { x: GAP, y: GAP, width: fullW, height: hh }
    case "maximize":
      return { x: GAP, y: GAP, width: fullW, height: fullH }
    case "top-left":
      return { x: GAP, y: GAP, width: hw, height: hh }
    case "top-right":
      return { x: GAP * 2 + hw, y: GAP, width: hw, height: hh }
    case "bottom-left":
      return { x: GAP, y: GAP * 2 + hh, width: hw, height: hh }
    case "bottom-right":
      return { x: GAP * 2 + hw, y: GAP * 2 + hh, width: hw, height: hh }
  }
}

/** Tile N windows inside the workspace using a preset. Order = z-order (front first for focus). */
export function tile(preset: TilePreset, count: number, ws: Size): Rect[] {
  if (count <= 0) return []
  const W = Math.max(MIN_W, ws.width)
  const H = Math.max(MIN_H, ws.height)
  const out: Rect[] = []
  if (preset === "cascade") {
    const w = Math.min(560, Math.floor(W * 0.6))
    const h = Math.min(440, Math.floor(H * 0.7))
    for (let i = 0; i < count; i++) {
      const step = 32
      const k = i % Math.max(1, Math.floor(Math.min(W - w, H - h) / step) || 1)
      out.push({ x: GAP + k * step, y: GAP + k * step, width: w, height: h })
    }
    return out
  }
  if (preset === "columns" || preset === "rows") {
    const cols = preset === "columns" ? count : 1
    const rows = preset === "rows" ? count : 1
    return gridRects(cols, rows, count, W, H)
  }
  if (preset === "focus") {
    if (count === 1) return [{ x: GAP, y: GAP, width: W - GAP * 2, height: H - GAP * 2 }]
    const mainW = Math.floor((W - GAP * 3) * 0.62)
    out.push({ x: GAP, y: GAP, width: mainW, height: H - GAP * 2 })
    const rest = count - 1
    const sideW = W - mainW - GAP * 3
    const sideH = Math.floor((H - GAP * (rest + 1)) / rest)
    for (let i = 0; i < rest; i++) {
      out.push({ x: mainW + GAP * 2, y: GAP + i * (sideH + GAP), width: sideW, height: Math.max(120, sideH) })
    }
    return out
  }
  const cols = Math.ceil(Math.sqrt(count * (W / H)))
  const rows = Math.ceil(count / cols)
  return gridRects(cols, rows, count, W, H)
}

function gridRects(cols: number, rows: number, count: number, W: number, H: number): Rect[] {
  const cw = Math.floor((W - GAP * (cols + 1)) / cols)
  const ch = Math.floor((H - GAP * (rows + 1)) / rows)
  const out: Rect[] = []
  for (let i = 0; i < count; i++) {
    const c = i % cols
    const r = Math.floor(i / cols)
    out.push({ x: GAP + c * (cw + GAP), y: GAP + r * (ch + GAP), width: Math.max(160, cw), height: Math.max(120, ch) })
  }
  return out
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

/** First grid-aligned slot of size `s` that doesn't overlap existing windows; falls back to cascade. */
export function findFreeSlot(s: Size, others: Rect[], ws: Size, grid = 24): { x: number; y: number } {
  const w = Math.min(s.width, ws.width - GAP * 2)
  const h = Math.min(s.height, ws.height - GAP * 2)
  for (let y = GAP; y + h <= ws.height; y += grid) {
    for (let x = GAP; x + w <= ws.width; x += grid) {
      const cand = { x, y, width: w, height: h }
      if (!others.some((o) => overlaps(cand, o))) return { x, y }
    }
  }
  const k = others.length % 8
  return { x: clamp(GAP + k * 32, 0, Math.max(0, ws.width - w)), y: clamp(GAP + k * 32, 0, Math.max(0, ws.height - h)) }
}

/* ---------------- layout persistence (browser only) ---------------- */

const LAYOUT_KEY = "signalframe_layouts_v2"

export type SavedLayout = {
  name: string
  savedAt: string
  workspace: Size
  /** frameId → rect expressed as fractions of the workspace so it survives resizes */
  rects: Record<string, { fx: number; fy: number; fw: number; fh: number }>
}

export function toFractional(rects: Record<string, Rect>, ws: Size): SavedLayout["rects"] {
  const out: SavedLayout["rects"] = {}
  for (const [id, r] of Object.entries(rects)) {
    out[id] = { fx: r.x / ws.width, fy: r.y / ws.height, fw: r.width / ws.width, fh: r.height / ws.height }
  }
  return out
}

export function fromFractional(f: SavedLayout["rects"][string], ws: Size): Rect {
  return clampRect(
    { x: Math.round(f.fx * ws.width), y: Math.round(f.fy * ws.height), width: Math.round(f.fw * ws.width), height: Math.round(f.fh * ws.height) },
    ws,
  )
}

export function loadLayouts(): SavedLayout[] {
  if (typeof window === "undefined") return []
  try {
    const raw = JSON.parse(window.localStorage.getItem(LAYOUT_KEY) || "[]")
    return Array.isArray(raw) ? (raw as SavedLayout[]).slice(0, 12) : []
  } catch {
    return []
  }
}

export function saveLayout(layout: SavedLayout): SavedLayout[] {
  if (typeof window === "undefined") return []
  const list = loadLayouts().filter((l) => l.name !== layout.name)
  list.unshift(layout)
  const next = list.slice(0, 12)
  try {
    window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(next))
  } catch {
    /* quota — ignore */
  }
  return next
}

export function deleteLayout(name: string): SavedLayout[] {
  if (typeof window === "undefined") return []
  const next = loadLayouts().filter((l) => l.name !== name)
  try {
    window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  return next
}
