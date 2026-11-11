"use client"

/**
 * SignalFrame v2 ops bar — ghostnode theme.
 * Spawn, tiling presets, layout memory, grid snap + grid pitch, export / clear.
 */

import { useState } from "react"
import {
  Plus,
  LayoutTemplate,
  LayoutGrid,
  Columns3,
  Rows3,
  Layers,
  PanelLeft,
  Save,
  FolderOpen,
  Grid3X3,
  Download,
  Trash2,
  Keyboard,
} from "lucide-react"
import type { WorkspaceBounds } from "./signal-frame-workspace"
import type { SavedLayout, TilePreset } from "@/lib/signalframe/window-geometry"

interface ControlPanelProps {
  frames: Array<{ id: string }>
  viewportInfo: { width: number; height: number; deviceType: string; pixelRatio: number }
  bounds?: WorkspaceBounds
  snapEnabled?: boolean
  gridSize?: number
  layouts?: SavedLayout[]
  onCreateFrame: () => void
  onShowTemplateMenu: () => void
  onExportFrames: () => void
  onClearAllFrames: () => void
  onToggleSnap?: () => void
  onCycleGrid?: () => void
  onTile?: (preset: TilePreset) => void
  onSaveLayout?: (name: string) => void
  onRestoreLayout?: (name: string) => void
  onDeleteLayout?: (name: string) => void
}

const PRESETS: Array<{ id: TilePreset; label: string; Icon: typeof LayoutGrid }> = [
  { id: "grid", label: "Grid", Icon: LayoutGrid },
  { id: "columns", label: "Columns", Icon: Columns3 },
  { id: "rows", label: "Rows", Icon: Rows3 },
  { id: "focus", label: "Focus", Icon: PanelLeft },
  { id: "cascade", label: "Cascade", Icon: Layers },
]

export function ControlPanel({
  frames,
  viewportInfo,
  snapEnabled = true,
  gridSize = 24,
  layouts = [],
  onCreateFrame,
  onShowTemplateMenu,
  onExportFrames,
  onClearAllFrames,
  onToggleSnap,
  onCycleGrid,
  onTile,
  onSaveLayout,
  onRestoreLayout,
  onDeleteLayout,
}: ControlPanelProps) {
  const [layoutsOpen, setLayoutsOpen] = useState(false)
  const [keysOpen, setKeysOpen] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <div className="absolute left-0 right-0 top-0 z-[1000] flex flex-wrap items-center gap-1.5 border-b border-[color:var(--ghost-line)] bg-black/55 px-2 py-1.5 backdrop-blur-md">
      <span className="ghost-label mr-1 hidden sm:inline">SignalFrame // ops</span>
      <button type="button" className="ghost-btn" onClick={onCreateFrame} title="New frame (Ctrl+Alt+N)">
        <Plus size={11} /> New
      </button>
      <button type="button" className="ghost-btn" onClick={onShowTemplateMenu} title="Spawn from template">
        <LayoutTemplate size={11} /> Template
      </button>
      <span className="mx-1 h-4 w-px bg-white/10" />
      {PRESETS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className="ghost-btn"
          onClick={() => onTile?.(id)}
          disabled={frames.length === 0}
          title={`Tile: ${label}${id === "grid" ? " (Ctrl+Alt+T)" : ""}`}
        >
          <Icon size={11} />
          <span className="hidden lg:inline">{label}</span>
        </button>
      ))}
      <span className="mx-1 h-4 w-px bg-white/10" />
      <div className="relative">
        <button type="button" className="ghost-btn" onClick={() => setLayoutsOpen((v) => !v)} title="Saved layouts">
          <FolderOpen size={11} /> <span className="hidden md:inline">Layouts</span>
          {layouts.length > 0 && <span className="text-[color:var(--ghost-faint)]">{layouts.length}</span>}
        </button>
        {layoutsOpen && (
          <div className="ghost-glass absolute left-0 top-8 z-[1001] w-64 p-2">
            <button
              type="button"
              className="ghost-btn mb-2 w-full"
              disabled={frames.length === 0}
              onClick={() => {
                const name = `layout-${new Date().toISOString().slice(5, 16).replace("T", "-")}`
                onSaveLayout?.(name)
              }}
            >
              <Save size={11} /> Save current
            </button>
            {layouts.length === 0 && <div className="ghost-label px-1 py-2">No saved layouts</div>}
            <div className="ghost-scroll max-h-56 space-y-1 overflow-y-auto">
              {layouts.map((l) => (
                <div key={l.name} className="flex items-center gap-1">
                  <button
                    type="button"
                    className="ghost-btn flex-1 justify-start"
                    onClick={() => {
                      onRestoreLayout?.(l.name)
                      setLayoutsOpen(false)
                    }}
                    title={`Saved ${l.savedAt}`}
                  >
                    {l.name} <span className="text-[color:var(--ghost-faint)]">({Object.keys(l.rects).length})</span>
                  </button>
                  <button type="button" className="ghost-icon-btn danger" onClick={() => onDeleteLayout?.(l.name)} title="Delete">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <button type="button" className="ghost-btn" data-on={snapEnabled} onClick={onToggleSnap} title="Grid + magnetic snap">
        <Grid3X3 size={11} /> Snap {snapEnabled ? "on" : "off"}
      </button>
      <button type="button" className="ghost-btn" onClick={onCycleGrid} title="Grid pitch">
        {gridSize}px
      </button>
      <div className="ml-auto flex items-center gap-1.5">
        <span className="ghost-chip hidden md:inline-flex">{frames.length} frames</span>
        <span className="ghost-chip hidden md:inline-flex">
          {viewportInfo.width}×{viewportInfo.height}
        </span>
        <div className="relative">
          <button type="button" className="ghost-icon-btn" onClick={() => setKeysOpen((v) => !v)} title="Shortcuts">
            <Keyboard size={13} />
          </button>
          {keysOpen && (
            <div className="ghost-glass absolute right-0 top-8 z-[1001] w-72 p-3 font-mono text-[10px] leading-5 text-[color:var(--ghost-dim)]">
              <div className="ghost-label mb-1">Shortcuts (active window)</div>
              <div>Ctrl+Alt+← / → — snap left / right half</div>
              <div>Ctrl+Alt+↑ — maximize · ↓ — restore center</div>
              <div>Ctrl+Alt+T — tile grid · Ctrl+Alt+N — new frame</div>
              <div>Ctrl+Alt+] / [ — cycle focus</div>
              <div>Ctrl+Alt+M — minimize · Ctrl+Alt+W — close</div>
              <div className="ghost-label mb-1 mt-2">Mouse</div>
              <div>Drag title to screen edge/corner — snap zone</div>
              <div>Double-click title — maximize / restore</div>
              <div>Edges magnet to workspace + other windows</div>
            </div>
          )}
        </div>
        <button type="button" className="ghost-btn" onClick={onExportFrames} disabled={frames.length === 0} title="Export frames JSON">
          <Download size={11} />
        </button>
        {confirmClear ? (
          <>
            <button
              type="button"
              className="ghost-btn danger"
              onClick={() => {
                onClearAllFrames()
                setConfirmClear(false)
              }}
            >
              Confirm clear
            </button>
            <button type="button" className="ghost-btn" onClick={() => setConfirmClear(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            className="ghost-btn danger"
            onClick={() => setConfirmClear(true)}
            disabled={frames.length === 0}
            title="Clear all frames"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  )
}
