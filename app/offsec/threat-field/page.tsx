"use client"

import { useEffect, useState } from "react"
import { Activity, RefreshCw, Crosshair } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"
import { ThreatField3D } from "@/components/offsec/threat-field-3d"
import type { ThreatFieldReport } from "@/lib/offsec/threat-engine"

export default function ThreatFieldPage() {
  const [report, setReport] = useState<ThreatFieldReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [trials, setTrials] = useState(800)
  const [seed, setSeed] = useState(20261111)

  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      const r = await fetch("/api/offsec/threat-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trials, seed }),
      })
      const d = await r.json()
      if (!r.ok || !d?.ok) throw new Error(d?.error || `HTTP ${r.status}`)
      setReport(d.report)
      if (!selected && d.report?.field?.[0]) setSelected(d.report.field[0].zoneId)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sel = report?.field.find((f) => f.zoneId === selected) || null

  return (
    <SuiteShell
      title="OFFSEC // THREAT FIELD"
      status="real"
      nav={
        <>
          <SuiteNavLink href="/offsec" label="Arsenal" />
          <SuiteNavLink href="/offsec/hardware" label="Hardware & RF" />
          <SuiteNavLink href="/offsec/engagements" label="Engagements" />
        </>
      }
    >
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="ghost-glass ghost-brackets rounded-[2px] p-4">
          <div className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.14em] text-[color:var(--ghost-ink)]">
            <Activity size={15} /> Threat prediction engine
          </div>
          <p className="mt-1 text-[12px] text-[color:var(--ghost-dim)]">
            Modeled Nash mixed-strategy equilibria, Fourier analysis of attack time series, and a seeded Monte-Carlo
            probability field over network zones. Outputs are <span className="text-[color:var(--ghost-ink)]">preferred /
            estimated / modeled</span> under stated assumptions — never a guarantee, lock, or certainty of real-world
            compromise. Math inspired by the hive-lab-sim Monte-Carlo lab.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="ghost-label">trials</span>
            <input
              className="ghost-input w-28 font-mono"
              type="number"
              min={50}
              max={5000}
              value={trials}
              onChange={(e) => setTrials(Number(e.target.value) || 800)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="ghost-label">seed</span>
            <input
              className="ghost-input w-36 font-mono"
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value) || 20261111)}
            />
          </label>
          <button type="button" className="ghost-btn" disabled={loading} onClick={() => void load()}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Recompute
          </button>
          {err && <span className="font-mono text-[11px] text-red-400">{err}</span>}
        </div>

        {report && (
          <>
            <ThreatField3D field={report.field} selected={selected} onSelect={setSelected} />

            <div className="grid gap-3 lg:grid-cols-3">
              <div className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-3">
                <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-[color:var(--ghost-ink)]">
                  Nash mixed strategies
                </div>
                <p className="text-[10px] text-[color:var(--ghost-dim)]">{report.nash.note}</p>
                <div className="text-[10px] text-[color:var(--ghost-faint)]">
                  modeled value (attacker): {report.nash.value} · iters {report.nash.iterations}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="ghost-label mb-1">attacker mix</div>
                    {Object.entries(report.nash.attackerMixed).map(([k, v]) => (
                      <div key={k} className="flex justify-between font-mono text-[10px] text-[color:var(--ghost-dim)]">
                        <span>{k}</span>
                        <span>{(v * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="ghost-label mb-1">defender mix</div>
                    {Object.entries(report.nash.defenderMixed).map(([k, v]) => (
                      <div key={k} className="flex justify-between font-mono text-[10px] text-[color:var(--ghost-dim)]">
                        <span>{k}</span>
                        <span>{(v * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-3">
                <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-[color:var(--ghost-ink)]">
                  Fourier peaks
                </div>
                <p className="text-[10px] text-[color:var(--ghost-dim)]">{report.fourier.note}</p>
                <ul className="space-y-1">
                  {report.fourier.peaks.map((p, i) => (
                    <li key={i} className="font-mono text-[10px] text-[color:var(--ghost-dim)]">
                      f={p.frequency} · mag={p.magnitude}
                      {p.periodHint != null ? ` · period≈${p.periodHint}` : ""}
                    </li>
                  ))}
                  {!report.fourier.peaks.length && (
                    <li className="text-[10px] text-[color:var(--ghost-faint)]">no peaks</li>
                  )}
                </ul>
              </div>

              <div className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-3">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[color:var(--ghost-ink)]">
                  <Crosshair size={12} /> Selected zone
                </div>
                {sel ? (
                  <>
                    <div className="font-mono text-[13px] text-[color:var(--ghost-ink)]">{sel.label}</div>
                    <div className="space-y-0.5 font-mono text-[10px] text-[color:var(--ghost-dim)]">
                      <div>modeled intensity: {(sel.intensity * 100).toFixed(1)}%</div>
                      <div>est. P(compromise): {(sel.pCompromise * 100).toFixed(1)}%</div>
                      <div>est. P(detected): {(sel.pDetected * 100).toFixed(1)}%</div>
                      <div>exposure / defense: {sel.exposure} / {sel.defense}</div>
                      <div>nash attacker weight: {sel.nashAttackerWeight}</div>
                    </div>
                  </>
                ) : (
                  <p className="text-[10px] text-[color:var(--ghost-faint)]">click a node</p>
                )}
              </div>
            </div>

            <div className="ghost-glass ghost-brackets rounded-[2px] p-3">
              <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[color:var(--ghost-ink)]">
                Monte-Carlo zone table
              </div>
              <p className="mb-2 text-[10px] text-[color:var(--ghost-dim)]">{report.monteCarlo.note}</p>
              <div className="ghost-scroll overflow-x-auto">
                <table className="w-full text-left font-mono text-[10px] text-[color:var(--ghost-dim)]">
                  <thead className="text-[color:var(--ghost-faint)]">
                    <tr>
                      <th className="py-1 pr-3">zone</th>
                      <th className="py-1 pr-3">P(comp)</th>
                      <th className="py-1 pr-3">P(det)</th>
                      <th className="py-1 pr-3">mean ticks</th>
                      <th className="py-1 pr-3">intensity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.field
                      .slice()
                      .sort((a, b) => b.intensity - a.intensity)
                      .map((f) => {
                        const mc = report.monteCarlo.zones.find((z) => z.zoneId === f.zoneId)
                        return (
                          <tr
                            key={f.zoneId}
                            className={`cursor-pointer border-t border-[color:var(--ghost-line)] hover:bg-white/5 ${
                              selected === f.zoneId ? "bg-white/10 text-[color:var(--ghost-ink)]" : ""
                            }`}
                            onClick={() => setSelected(f.zoneId)}
                          >
                            <td className="py-1 pr-3">{f.label}</td>
                            <td className="py-1 pr-3">{((mc?.pCompromise ?? 0) * 100).toFixed(1)}%</td>
                            <td className="py-1 pr-3">{((mc?.pDetected ?? 0) * 100).toFixed(1)}%</td>
                            <td className="py-1 pr-3">{mc?.meanTicksToCompromise ?? "—"}</td>
                            <td className="py-1 pr-3">{(f.intensity * 100).toFixed(1)}%</td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-[2px] border border-[color:var(--ghost-line)] bg-black/40 p-3 text-[10px] text-[color:var(--ghost-dim)]">
              <div className="mb-1 font-mono uppercase tracking-[0.1em] text-[color:var(--ghost-ink)]">Assumptions</div>
              <ul className="list-inside list-disc space-y-0.5">
                {report.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
              <p className="mt-2 text-[color:var(--ghost-faint)]">{report.disclaimer}</p>
            </div>
          </>
        )}
      </div>
    </SuiteShell>
  )
}
