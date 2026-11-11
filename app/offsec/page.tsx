"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search, Crosshair, Trophy, ShieldAlert, Server, RefreshCw } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"
import { ToolCard } from "@/components/offsec/tool-card"
import {
  ARSENAL,
  KILL_PHASES,
  CTF_CATEGORIES,
  type ArsenalTool,
} from "@/lib/offsec/arsenal"

type View = "killchain" | "ctf"

export default function OffsecArsenalPage() {
  const [installed, setInstalled] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>("killchain")
  const [q, setQ] = useState("")

  const loadTools = async () => {
    setLoading(true)
    try {
      const data = await fetch("/api/offsec/tools").then((r) => r.json())
      if (data?.ok) setInstalled(data.installed || {})
    } catch {
      /* offline is fine */
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void loadTools()
  }, [])

  const filter = (list: ArsenalTool[]) => {
    const t = q.trim().toLowerCase()
    if (!t) return list
    return list.filter(
      (x) =>
        x.name.toLowerCase().includes(t) ||
        x.summary.toLowerCase().includes(t) ||
        x.credit.toLowerCase().includes(t) ||
        x.bins.some((b) => b.toLowerCase().includes(t)) ||
        (x.certs || []).some((c) => c.toLowerCase().includes(t)),
    )
  }

  const installedCount = Object.keys(installed).length

  const groups = useMemo(() => {
    if (view === "killchain") {
      return KILL_PHASES.map((p) => ({
        id: p.id,
        label: p.label,
        blurb: p.blurb,
        tools: filter(ARSENAL.filter((t) => t.phases.includes(p.id))),
      }))
    }
    return CTF_CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      blurb: c.blurb,
      tools: filter(ARSENAL.filter((t) => t.ctf?.includes(c.id))),
    }))
  }, [view, q])

  return (
    <SuiteShell
      title="OFFSEC ARSENAL"
      status="local"
      nav={
        <>
          <SuiteNavLink href="/offsec/osint" label="OSINT Suite" />
          <SuiteNavLink href="/offsec/graph" label="Entity Graph" />
          <SuiteNavLink href="/offsec/toolkit" label="Data Toolkit" />
          <SuiteNavLink href="/offsec/privacy" label="Privacy Stack" />
          <SuiteNavLink href="/offsec/engagements" label="Engagements" />
          <SuiteNavLink href="/bounty" label="Bug Bounty" />
          <SuiteNavLink href="/offsec/lab" label="WIP Lab" />
        </>
      }
    >
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="ghost-glass ghost-brackets rounded-[2px] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-mono text-lg uppercase tracking-[0.18em] text-[color:var(--ghost-ink)]">Arsenal</h1>
              <p className="mt-1 max-w-2xl text-[12px] text-[color:var(--ghost-dim)]">
                Kill-chain and CTF/competition tooling for red / blue / tiger teams and investigators. Each panel is a
                reference + launcher: it documents usage, builds commands you run in your own authorized terminal, and
                detects whether the tool is installed locally. Standards of record: OSCP · OSEP · OSWE · OSED · DEF CON
                SECTF · Trace Labs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="ghost-chip inline-flex items-center gap-1">
                <Server size={11} /> {loading ? "probing…" : `${installedCount} tools detected`}
              </span>
              <button type="button" className="ghost-icon-btn" onClick={() => void loadTools()} title="Re-probe">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className="ghost-btn" data-on={view === "killchain"} onClick={() => setView("killchain")}>
              <Crosshair size={12} /> Kill Chain
            </button>
            <button type="button" className="ghost-btn" data-on={view === "ctf"} onClick={() => setView("ctf")}>
              <Trophy size={12} /> Competitions / CTF
            </button>
            <div className="relative ml-auto min-w-[220px] flex-1 sm:max-w-xs">
              <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[color:var(--ghost-faint)]" />
              <input
                className="ghost-input pl-7 font-mono"
                placeholder="search tools, binaries, certs…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </div>

        {view === "ctf" && (
          <div className="flex items-start gap-2 rounded-[2px] border border-[color:var(--ghost-line)] bg-black/40 p-2 text-[11px] text-[color:var(--ghost-dim)]">
            <ShieldAlert size={14} className="mt-0.5 shrink-0" />
            Social-engineering content (DEF CON SECTF, Trace Labs Search Party) is for training and authorized
            engagements only. Nothing here enables fraud or impersonation of real victims.
          </div>
        )}

        {groups.map((g) => (
          <section key={g.id} id={String(g.id)}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="font-mono text-sm uppercase tracking-[0.14em] text-[color:var(--ghost-ink)]">{g.label}</h2>
              <span className="ghost-label">{g.tools.length} tools</span>
            </div>
            <p className="mb-2 text-[11px] text-[color:var(--ghost-faint)]">{g.blurb}</p>
            {g.tools.length === 0 ? (
              <div className="ghost-label py-2">no matches</div>
            ) : (
              <div className="grid gap-2 lg:grid-cols-2">
                {g.tools.map((t) => (
                  <ToolCard key={`${g.id}-${t.id}`} tool={t} installed={installed} />
                ))}
              </div>
            )}
          </section>
        ))}

        <div className="pb-6 text-center text-[10px] text-[color:var(--ghost-faint)]">
          Third-party tools are the work of their respective authors under their own licenses. See{" "}
          <Link href="/offsec/engagements" className="underline">
            engagements
          </Link>{" "}
          to log findings · docs/OFFSEC_SUITE.md and LEGAL.md.
        </div>
      </div>
    </SuiteShell>
  )
}
