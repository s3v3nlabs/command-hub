"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, CornerDownLeft, Layers } from "lucide-react"
import { WORKSPACE_PRESETS } from "@/lib/workspaces/presets"
import { filterCommandItems } from "@/lib/command/search"

type Mod = { id: string; name: string; route?: string; description?: string; nav?: { label?: string; group?: string } }
type Item = {
  id: string
  label: string
  sublabel?: string
  route?: string
  action?: () => void
  group: string
  haystack: string
}

/** Global Cmd/Ctrl-K command palette + unified module search. */
export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [modules, setModules] = useState<Mod[]>([])
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // global hotkey
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === "Escape") {
        setOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // load modules when opened (once)
  useEffect(() => {
    if (!open || modules.length) return
    fetch("/api/modules")
      .then((r) => r.json())
      .then((d) => setModules(Array.isArray(d.modules) ? d.modules : []))
      .catch(() => {})
  }, [open, modules.length])

  useEffect(() => {
    if (open) {
      setQ("")
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  const setWorkspace = useCallback((id: string) => {
    try {
      localStorage.setItem("hub-workspace", id)
      window.dispatchEvent(new CustomEvent("hub-workspace-change", { detail: id }))
    } catch {
      /* ignore */
    }
  }, [])

  const items: Item[] = useMemo(() => {
    const mod: Item[] = modules
      .filter((m) => m.route)
      .map((m) => ({
        id: `mod:${m.id}`,
        label: m.nav?.label || m.name,
        sublabel: m.description,
        route: m.route,
        group: m.nav?.group || "modules",
        haystack: `${m.name} ${m.nav?.label || ""} ${m.description || ""} ${m.route || ""}`.toLowerCase(),
      }))
    const ws: Item[] = WORKSPACE_PRESETS.map((w) => ({
      id: `ws:${w.id}`,
      label: `Workspace: ${w.label}`,
      sublabel: w.tagline,
      action: () => setWorkspace(w.id),
      group: "workspace",
      haystack: `workspace ${w.label} ${w.tagline}`.toLowerCase(),
    }))
    const quick: Item[] = [
      { id: "q:marketplace", label: "Open Marketplace", route: "/marketplace", group: "quick", haystack: "marketplace modules install" },
      { id: "q:audit", label: "Open Audit Timeline", route: "/audit", group: "quick", haystack: "audit timeline who did what" },
      { id: "q:attack", label: "Open ATT&CK Navigator", route: "/offsec/attack-navigator", group: "quick", haystack: "attack navigator heatmap mitre" },
    ]
    return [...quick, ...ws, ...mod]
  }, [modules, setWorkspace])

  const filtered = useMemo(() => filterCommandItems(items, q), [items, q])

  const run = useCallback(
    (it?: Item) => {
      const target = it || filtered[active]
      if (!target) return
      setOpen(false)
      if (target.action) target.action()
      else if (target.route) router.push(target.route as never)
    },
    [filtered, active, router],
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 pt-[12vh]" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-xl overflow-hidden rounded-lg border border-dark-300/50 bg-black/95 shadow-2xl backdrop-blur"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-dark-300/40 px-3 py-2">
          <Search size={15} className="text-dark-500" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setActive(0)
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault()
                setActive((a) => Math.min(a + 1, filtered.length - 1))
              } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, 0))
              } else if (e.key === "Enter") {
                e.preventDefault()
                run()
              }
            }}
            placeholder="Search modules, workspaces, actions…  (Cmd/Ctrl-K)"
            className="w-full bg-transparent text-sm text-dark-700 outline-none placeholder:text-dark-500"
          />
          <kbd className="rounded bg-dark-100/10 px-1 text-[10px] text-dark-500">esc</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-1">
          {filtered.length === 0 && <div className="px-3 py-4 text-center text-xs text-dark-500">No matches.</div>}
          {filtered.map((it, i) => (
            <button
              key={it.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => run(it)}
              className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs ${
                i === active ? "bg-dark-100/15" : ""
              }`}
            >
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-medium text-dark-700">
                  {it.group === "workspace" && <Layers size={11} />}
                  {it.label}
                </span>
                {it.sublabel && <span className="block truncate text-[10px] text-dark-500">{it.sublabel}</span>}
              </span>
              <span className="flex shrink-0 items-center gap-1 text-[10px] text-dark-500">
                {it.group}
                {i === active && <CornerDownLeft size={11} />}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
