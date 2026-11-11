"use client"

import { useEffect, useState, useCallback } from "react"
import { Layers, ChevronDown } from "lucide-react"
import { WORKSPACE_PRESETS, getWorkspace, type WorkspaceId } from "@/lib/workspaces/presets"

const STORAGE_KEY = "hub-workspace"
export const WORKSPACE_EVENT = "hub-workspace-change"

export function getActiveWorkspaceId(): WorkspaceId {
  if (typeof window === "undefined") return "all"
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return (getWorkspace(v).id as WorkspaceId) || "all"
  } catch {
    return "all"
  }
}

/** Compact workspace switcher for the hub shell header. */
export function WorkspaceSwitcher({ compact = true }: { compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<WorkspaceId>("all")

  useEffect(() => {
    setActive(getActiveWorkspaceId())
    const onChange = () => setActive(getActiveWorkspaceId())
    window.addEventListener(WORKSPACE_EVENT, onChange)
    window.addEventListener("storage", onChange)
    return () => {
      window.removeEventListener(WORKSPACE_EVENT, onChange)
      window.removeEventListener("storage", onChange)
    }
  }, [])

  const pick = useCallback((id: WorkspaceId) => {
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* ignore */
    }
    setActive(id)
    setOpen(false)
    window.dispatchEvent(new CustomEvent(WORKSPACE_EVENT, { detail: id }))
  }, [])

  const ws = getWorkspace(active)

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1.5 rounded border border-dark-300/40 bg-black/50 px-2 py-1 text-[11px] font-mono text-dark-600 hover:bg-dark-100/10"
        onClick={() => setOpen((v) => !v)}
        aria-label="Switch workspace"
        title={ws.tagline}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: ws.accent }} />
        <Layers size={12} />
        {!compact && <span>{ws.label}</span>}
        {compact && <span className="hidden sm:inline">{ws.label}</span>}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-64 rounded border border-dark-300/40 bg-black/95 p-1 shadow-xl backdrop-blur">
          {WORKSPACE_PRESETS.map((w) => (
            <button
              key={w.id}
              onClick={() => pick(w.id)}
              className={`flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-dark-100/10 ${
                w.id === active ? "bg-dark-100/10" : ""
              }`}
            >
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: w.accent }} />
              <span>
                <span className="block font-semibold text-dark-700">{w.label}</span>
                <span className="block text-[10px] text-dark-500">{w.tagline}</span>
              </span>
            </button>
          ))}
          <a href="/workspaces" className="mt-1 block rounded px-2 py-1 text-center text-[10px] text-dark-500 hover:bg-dark-100/10">
            Manage workspaces →
          </a>
        </div>
      )}
    </div>
  )
}
