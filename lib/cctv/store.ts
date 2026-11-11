/**
 * File-backed CCTV layouts under data/cctv/ (gitignored).
 */

import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"
import type { CctvLayout, CctvTile } from "./types"
import { emptyTileMeta } from "./types"

const DIR = path.join(process.cwd(), "data", "cctv")
const FILE = path.join(DIR, "layouts.json")

function ensure(): void {
  fs.mkdirSync(DIR, { recursive: true, mode: 0o700 })
}
function readAll(): CctvLayout[] {
  try {
    if (!fs.existsSync(FILE)) return []
    const raw = JSON.parse(fs.readFileSync(FILE, "utf8"))
    return (Array.isArray(raw) ? raw : []).map((l: CctvLayout) => ({ ...l, lattice_sync: false as const }))
  } catch {
    return []
  }
}
function writeAll(list: CctvLayout[]): void {
  ensure()
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2) + "\n", { mode: 0o600 })
}

export function listLayouts(engagementId?: string): CctvLayout[] {
  const all = readAll()
  const filtered = engagementId ? all.filter((l) => l.engagementId === engagementId) : all
  return filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getLayout(id: string): CctvLayout | null {
  return readAll().find((l) => l.id === id) || null
}

export function createLayout(input: {
  name: string
  engagementId?: string
  cols?: number
  rows?: number
}): { ok: true; layout: CctvLayout } | { ok: false; error: string } {
  const name = (input.name || "").trim().slice(0, 120)
  if (!name) return { ok: false, error: "name required" }
  const now = new Date().toISOString()
  const layout: CctvLayout = {
    id: randomUUID(),
    name,
    engagementId: input.engagementId?.slice(0, 80),
    cols: Math.min(Math.max(input.cols ?? 3, 1), 8),
    rows: Math.min(Math.max(input.rows ?? 2, 1), 8),
    tiles: [],
    createdAt: now,
    updatedAt: now,
    lattice_sync: false,
  }
  const all = readAll()
  all.push(layout)
  writeAll(all)
  return { ok: true, layout }
}

export function saveLayout(layout: CctvLayout): { ok: true; layout: CctvLayout } | { ok: false; error: string } {
  const all = readAll()
  const idx = all.findIndex((l) => l.id === layout.id)
  if (idx < 0) return { ok: false, error: "not_found" }
  const next = { ...layout, updatedAt: new Date().toISOString(), lattice_sync: false as const }
  // Clamp tiles
  next.tiles = (next.tiles || []).slice(0, 64).map(sanitizeTile)
  all[idx] = next
  writeAll(all)
  return { ok: true, layout: next }
}

export function deleteLayout(id: string): boolean {
  const all = readAll()
  const next = all.filter((l) => l.id !== id)
  if (next.length === all.length) return false
  writeAll(next)
  return true
}

function sanitizeTile(t: CctvTile): CctvTile {
  return {
    id: t.id || randomUUID(),
    title: String(t.title || "Camera").slice(0, 120),
    col: Math.max(0, Number(t.col) || 0),
    row: Math.max(0, Number(t.row) || 0),
    colSpan: t.colSpan ? Math.min(Math.max(Number(t.colSpan), 1), 4) : 1,
    rowSpan: t.rowSpan ? Math.min(Math.max(Number(t.rowSpan), 1), 4) : 1,
    meta: t.meta || emptyTileMeta(),
    webcamDeviceId: t.webcamDeviceId?.slice(0, 120),
    detailOpen: !!t.detailOpen,
  }
}

export function ackLegal(layoutId: string): CctvLayout | null {
  const all = readAll()
  const idx = all.findIndex((l) => l.id === layoutId)
  if (idx < 0) return null
  all[idx] = { ...all[idx], legalAckAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  writeAll(all)
  return all[idx]
}
