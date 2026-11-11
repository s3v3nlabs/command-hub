"use client"

import { useEffect, useState } from "react"
import { FlaskConical, ExternalLink, Wrench, CheckCircle2, Circle, RefreshCw } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"
import { LAB_MODULES } from "@/lib/offsec/wip-modules"

export default function WipLabPage() {
  const [installed, setInstalled] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const load = async () => {
    setLoading(true)
    try {
      const d = await fetch("/api/offsec/tools").then((r) => r.json())
      if (d?.ok) setInstalled(d.installed || {})
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void load()
  }, [])

  const wip = LAB_MODULES.filter((m) => m.kind === "wip")
  const local = LAB_MODULES.filter((m) => m.kind === "local")

  return (
    <SuiteShell
      title="OFFSEC // WIP LAB"
      status="wip"
      nav={
        <>
          <SuiteNavLink href="/offsec" label="Arsenal" />
          <SuiteNavLink href="/offsec/privacy" label="Privacy Stack" />
        </>
      }
    >
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="ghost-glass ghost-brackets rounded-[2px] p-4">
          <div className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.14em] text-[color:var(--ghost-ink)]">
            <FlaskConical size={15} /> Lab
          </div>
          <p className="mt-1 text-[12px] text-[color:var(--ghost-dim)]">
            Two kinds of panel. <span className="text-[color:var(--ghost-ink)]">WORK IN PROGRESS</span> shells are
            honest, non-functional placeholders for hardware-gated or interception/spoofing-class capabilities we will
            not ship as working code. <span className="text-[color:var(--ghost-ink)]">Local integrations</span> are real
            launcher/config/reference panels that drive your own locally-installed tools — nothing is auto-run.
          </p>
        </div>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.12em] text-[color:var(--ghost-ink)]">
              <Wrench size={14} /> Local tool integrations
            </h2>
            <button type="button" className="ghost-icon-btn" onClick={() => void load()} title="Re-probe">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="grid gap-2 lg:grid-cols-2">
            {local.map((m) => {
              const present = (m.bins || []).filter((b) => installed[b])
              return (
                <div key={m.id} className="ghost-glass ghost-brackets rounded-[2px] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[color:var(--ghost-ink)]">{m.title}</span>
                    {m.bins &&
                      (present.length ? (
                        <span className="ghost-chip accent inline-flex items-center gap-1">
                          <CheckCircle2 size={10} /> {present.length} installed
                        </span>
                      ) : (
                        <span className="ghost-chip inline-flex items-center gap-1">
                          <Circle size={10} /> not detected
                        </span>
                      ))}
                  </div>
                  <p className="mt-1 text-[11px] text-[color:var(--ghost-dim)]">{m.summary}</p>
                  <ul className="mt-2 space-y-1 text-[11px] text-[color:var(--ghost-dim)]">
                    {m.detail.map((d) => (
                      <li key={d} className="flex gap-2">
                        <span className="text-[color:var(--ghost-faint)]">›</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                  {present.length > 0 && <div className="mt-1 font-mono text-[10px] text-[color:var(--ghost-faint)]">detected: {present.map((b) => `${b}`).join(" · ")}</div>}
                  {m.link && (
                    <a href={m.link} target="_blank" rel="noreferrer noopener" className="mt-2 inline-flex items-center gap-1 text-[10px] text-[color:var(--ghost-dim)] hover:text-[color:var(--ghost-ink)]">
                      <ExternalLink size={10} /> {m.credit}
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-mono text-sm uppercase tracking-[0.12em] text-[color:var(--ghost-ink)]">Work-in-progress shells</h2>
          <div className="grid gap-2 lg:grid-cols-2">
            {wip.map((m) => (
              <div key={m.id} className="ghost-glass rounded-[2px] border-dashed p-3" style={{ borderColor: "rgba(217,197,143,0.35)" }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[color:var(--ghost-ink)]">{m.title}</span>
                  <span className="ghost-chip warn">WIP · non-functional</span>
                </div>
                <p className="mt-1 text-[11px] text-[color:var(--ghost-dim)]">{m.summary}</p>
                <ul className="mt-2 space-y-1 text-[11px] text-[color:var(--ghost-faint)]">
                  {m.detail.map((d) => (
                    <li key={d} className="flex gap-2">
                      <span>›</span>
                      {d}
                    </li>
                  ))}
                </ul>
                {m.link && (
                  <a href={m.link} target="_blank" rel="noreferrer noopener" className="mt-2 inline-flex items-center gap-1 text-[10px] text-[color:var(--ghost-dim)] hover:text-[color:var(--ghost-ink)]">
                    <ExternalLink size={10} /> {m.credit}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="pb-6 text-center text-[10px] text-[color:var(--ghost-faint)]">
          TODO notes and status live in docs/OFFSEC_SUITE.md. Nothing on this page performs spoofing, interception, or
          real hooking.
        </div>
      </div>
    </SuiteShell>
  )
}
