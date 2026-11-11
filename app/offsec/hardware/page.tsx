"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Bluetooth,
  Cable,
  Usb,
  Network,
  Server,
  Phone,
  Radio,
  Cpu,
  Smartphone,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Circle,
  RefreshCw,
} from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"
import { CommandBuilder } from "@/components/offsec/command-builder"
import { DuckyPanel } from "@/components/offsec/ducky-panel"
import { IntelSearchPanel } from "@/components/offsec/intel-search-panel"
import { HARDWARE, HW_CATEGORIES, type HwCategory } from "@/lib/offsec/hardware"

const ICONS: Record<HwCategory, React.ComponentType<{ size?: number }>> = {
  bluetooth: Bluetooth,
  can: Cable,
  usb: Usb,
  lan: Network,
  shodan: Server,
  voip: Phone,
  sdr: Radio,
  flipper: Cpu,
  phone: Smartphone,
  wip: AlertTriangle,
}

export default function HardwarePage() {
  const [cat, setCat] = useState<HwCategory>("bluetooth")
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

  const mods = useMemo(() => HARDWARE.filter((m) => m.category === cat), [cat])
  const meta = HW_CATEGORIES.find((c) => c.id === cat)!

  return (
    <SuiteShell
      title="OFFSEC // HARDWARE & RF"
      status="real"
      nav={
        <>
          <SuiteNavLink href="/offsec" label="Arsenal" />
          <SuiteNavLink href="/offsec/phone" label="Phone Suite" />
          <SuiteNavLink href="/offsec/lab" label="WIP Lab" />
        </>
      }
    >
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="ghost-glass ghost-brackets rounded-[2px] p-4">
          <div className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.14em] text-[color:var(--ghost-ink)]">
            <Cpu size={15} /> Hardware & RF Arsenal
          </div>
          <p className="mt-1 text-[12px] text-[color:var(--ghost-dim)]">
            Local launcher / reference / config panels that drive YOUR own hardware and installed tools. Command
            builders render text to copy into your authorized terminal — nothing is auto-run or keyed for you. You are
            responsible for spectrum, wiretap, and computer-misuse law compliance, and for written authorization before
            testing any target you do not own.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {HW_CATEGORIES.map((c) => {
            const Icon = ICONS[c.id]
            return (
              <button
                key={c.id}
                type="button"
                className={`ghost-chip inline-flex items-center gap-1 ${cat === c.id ? "accent" : ""}`}
                onClick={() => setCat(c.id)}
              >
                <Icon size={11} /> {c.label}
              </button>
            )
          })}
          <button type="button" className="ghost-icon-btn ml-auto" onClick={() => void load()} title="Re-probe local tools">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <p className="text-[11px] text-[color:var(--ghost-dim)]">{meta.blurb}</p>

        {cat === "shodan" && <IntelSearchPanel />}
        {cat === "usb" && <DuckyPanel />}

        <div className="grid gap-3 lg:grid-cols-2">
          {mods.map((m) => {
            const Icon = ICONS[m.category]
            const present = (m.bins || []).filter((b) => installed[b])
            const detected = present.length > 0
            return (
              <div key={m.id} className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.08em] text-[color:var(--ghost-ink)]">
                    <Icon size={12} /> {m.title}
                  </span>
                  <div className="flex items-center gap-1">
                    {m.badge && <span className="ghost-chip">{m.badge}</span>}
                    {m.kind === "wip" && <span className="ghost-chip">WIP</span>}
                    {m.kind === "predicted" && <span className="ghost-chip">predicted</span>}
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
                {m.envVars && m.envVars.length > 0 && (
                  <div className="font-mono text-[10px] text-[color:var(--ghost-faint)]">
                    env: {m.envVars.join(" · ")}
                  </div>
                )}
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
      </div>
    </SuiteShell>
  )
}
