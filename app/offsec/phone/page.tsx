"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Smartphone,
  ExternalLink,
  CheckCircle2,
  Circle,
  RefreshCw,
  ShieldAlert,
} from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"
import { CommandBuilder } from "@/components/offsec/command-builder"
import { HARDWARE } from "@/lib/offsec/hardware"

export default function PhoneSuitePage() {
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

  const phone = useMemo(() => HARDWARE.filter((m) => m.category === "phone"), [])
  const wip = useMemo(() => HARDWARE.filter((m) => m.category === "wip"), [])

  return (
    <SuiteShell
      title="OFFSEC // PHONE SUITE"
      status="real"
      nav={
        <>
          <SuiteNavLink href="/offsec" label="Arsenal" />
          <SuiteNavLink href="/offsec/hardware" label="Hardware & RF" />
          <SuiteNavLink href="/offsec/android-lab" label="Android Lab" />
          <SuiteNavLink href="/offsec/lab" label="WIP Lab" />
        </>
      }
    >
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="ghost-glass ghost-brackets rounded-[2px] p-4">
          <div className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.14em] text-[color:var(--ghost-ink)]">
            <Smartphone size={15} /> Phone Suite — YOUR authorized device
          </div>
          <p className="mt-1 text-[12px] text-[color:var(--ghost-dim)]">
            Real mirror / control / forensics workflows for a device YOU own via scrcpy + ADB. Enable USB debugging and
            authorize the on-device RSA prompt. Hub ADB API routes stay behind auth (HUB_API_TOKEN in SECURE_MODE), and
            the ADB shell endpoint additionally requires ADB_SHELL_ENABLED=1 plus an argument allowlist. No call
            interception or audio injection is implemented. For disposable emulators, open the Android Lab.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm uppercase tracking-[0.12em] text-[color:var(--ghost-ink)]">
            Device control & ops
          </h2>
          <button type="button" className="ghost-icon-btn" onClick={() => void load()} title="Re-probe">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {phone.map((m) => {
            const present = (m.bins || []).filter((b) => installed[b])
            const detected = present.length > 0
            return (
              <div key={m.id} className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[color:var(--ghost-ink)]">
                    {m.title}
                  </span>
                  {m.bins && m.bins.length > 0 &&
                    (detected ? (
                      <span className="ghost-chip accent inline-flex items-center gap-1">
                        <CheckCircle2 size={10} /> {present.length} installed
                      </span>
                    ) : (
                      <span className="ghost-chip inline-flex items-center gap-1">
                        <Circle size={10} /> not detected
                      </span>
                    ))}
                </div>
                <p className="text-[11px] text-[color:var(--ghost-dim)]">{m.summary}</p>
                <ul className="space-y-1 text-[11px] text-[color:var(--ghost-dim)]">
                  {m.detail.map((d) => (
                    <li key={d} className="flex gap-2">
                      <span className="text-[color:var(--ghost-faint)]">›</span>
                      {d}
                    </li>
                  ))}
                </ul>
                {present.length > 0 && (
                  <div className="font-mono text-[10px] text-[color:var(--ghost-faint)]">
                    detected: {present.join(" · ")}
                  </div>
                )}
                {m.commands && m.commands.length > 0 && <CommandBuilder commands={m.commands} />}
                {m.link && (
                  <a
                    href={m.link}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-[10px] text-[color:var(--ghost-dim)] hover:text-[color:var(--ghost-ink)]"
                  >
                    <ExternalLink size={10} /> {m.credit}
                  </a>
                )}
              </div>
            )
          })}
        </div>

        <section>
          <h2 className="mb-2 flex items-center gap-2 font-mono text-sm uppercase tracking-[0.12em] text-[color:var(--ghost-ink)]">
            <ShieldAlert size={14} /> Interception class — honest WIP shells
          </h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {wip.map((m) => (
              <div key={m.id} className="ghost-glass ghost-brackets space-y-2 rounded-[2px] border-dashed p-3 opacity-80">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[color:var(--ghost-ink)]">
                    {m.title}
                  </span>
                  <span className="ghost-chip">WIP</span>
                </div>
                <p className="text-[11px] text-[color:var(--ghost-dim)]">{m.summary}</p>
                <ul className="space-y-1 text-[11px] text-[color:var(--ghost-dim)]">
                  {m.detail.map((d) => (
                    <li key={d} className="flex gap-2">
                      <span className="text-[color:var(--ghost-faint)]">›</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SuiteShell>
  )
}
