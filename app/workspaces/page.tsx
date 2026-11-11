"use client"

import { useCallback, useEffect, useState } from "react"
import { Layers, Check, ArrowRight } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"
import { WORKSPACE_PRESETS, resolveFeatured, type WorkspacePreset } from "@/lib/workspaces/presets"
import { getActiveWorkspaceId, WORKSPACE_EVENT } from "@/components/workspace/workspace-switcher"

type Mod = { id: string; name: string; route?: string; description?: string; nav?: { label?: string } }

export default function WorkspacesPage() {
  const [modules, setModules] = useState<Mod[]>([])
  const [active, setActive] = useState<string>("all")

  useEffect(() => {
    setActive(getActiveWorkspaceId())
    fetch("/api/modules")
      .then((r) => r.json())
      .then((d) => setModules(Array.isArray(d.modules) ? d.modules : []))
      .catch(() => {})
    const onChange = () => setActive(getActiveWorkspaceId())
    window.addEventListener(WORKSPACE_EVENT, onChange)
    return () => window.removeEventListener(WORKSPACE_EVENT, onChange)
  }, [])

  const activate = useCallback((id: string) => {
    try {
      localStorage.setItem("hub-workspace", id)
    } catch {
      /* ignore */
    }
    setActive(id)
    window.dispatchEvent(new CustomEvent(WORKSPACE_EVENT, { detail: id }))
  }, [])

  const featuredFor = (w: WorkspacePreset) => resolveFeatured(w, modules)

  return (
    <SuiteShell
      title="Role-Based Workspaces"
      status="real"
      nav={
        <>
          <SuiteNavLink href="/marketplace" label="Marketplace" />
          <SuiteNavLink href="/offsec" label="OffSec" />
        </>
      }
    >
      <div className="mx-auto max-w-5xl space-y-4">
        <header className="space-y-1">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Layers size={18} /> Workspaces
          </div>
          <p className="text-xs text-[color:var(--ghost-dim)]">
            Pick an operator role to feature its modules. Selection persists (localStorage) and the shell switcher follows it.
          </p>
        </header>

        <div className="grid gap-3 md:grid-cols-2">
          {WORKSPACE_PRESETS.map((w) => {
            const feats = featuredFor(w)
            const isActive = w.id === active
            return (
              <div
                key={w.id}
                className="rounded border bg-black/50 p-3"
                style={{ borderColor: isActive ? w.accent : "var(--ghost-line)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ background: w.accent }} />
                    <span className="font-semibold">{w.label}</span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">{w.layout}</span>
                  </div>
                  <button
                    className="ghost-btn"
                    onClick={() => activate(w.id)}
                    data-on={isActive}
                  >
                    {isActive ? (
                      <>
                        <Check size={13} /> Active
                      </>
                    ) : (
                      "Activate"
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-[color:var(--ghost-dim)]">{w.tagline}</p>
                <div className="mt-2 space-y-1">
                  {w.id === "all" ? (
                    <div className="text-xs text-[color:var(--ghost-dim)]">All registered modules ({modules.length}).</div>
                  ) : feats.length ? (
                    feats.map((m) => (
                      <a
                        key={m.id}
                        href={m.route}
                        className="flex items-center justify-between rounded px-2 py-1 text-xs hover:bg-dark-100/10"
                      >
                        <span>{m.nav?.label || m.name}</span>
                        <ArrowRight size={12} className="opacity-50" />
                      </a>
                    ))
                  ) : (
                    <div className="text-xs text-amber-400">
                      Featured modules not yet registered — install from the Marketplace.
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </SuiteShell>
  )
}
