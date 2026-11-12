"use client"

import { useCallback, useEffect, useState } from "react"
import {
  ShieldAlert,
  RefreshCw,
  Usb,
  Cable,
  Server,
  Network,
  KeyRound,
  Fingerprint,
  FileWarning,
  Lock,
  Eye,
} from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"

type Dec = { id: string; kind: string; label: string; surface: string; banner?: string; tarpitMs?: number; hits: number; lastHitAt?: string; active: boolean }
type Can = { id: string; label: string; token: string; tokenGlyph?: string; placement: string; triggered: boolean; triggeredAt?: string }
type Prof = { id: string; fingerprint: string; hitCount: number; tooling: string[]; ttps: string[]; firstSeen: string; lastSeen: string; sourceHints: string[] }
type Samp = { id: string; sha256: string; sizeBytes: number; filename?: string; capturedAt: string; metadata: Record<string, unknown>; vt?: { submitted: boolean; positives?: number; total?: number; permalink?: string; note?: string } }
type Ev = { id: string; ts: string; kind: string; message: string; severity: string; fingerprint?: string }

const KIND_ICON: Record<string, React.ComponentType<{ size?: number }>> = {
  usb: Usb,
  serial: Cable,
  service: Server,
  route: Network,
  canary: KeyRound,
}

export default function DeceptionPage() {
  const [data, setData] = useState<{
    heimdallKeyConfigured?: boolean
    decoys: Dec[]
    canaries: Can[]
    profiles: Prof[]
    samples: Samp[]
    events: Ev[]
    glyphSkinDisclaimer?: string
  } | null>(null)
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(true)
  const [canLabel, setCanLabel] = useState("")
  const [canPlace, setCanPlace] = useState("")

  const headers = useCallback(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" }
    if (token) h.Authorization = `Bearer ${token}`
    return h
  }, [token])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await fetch("/api/offsec/deception", { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then((r) => r.json())
      if (d?.ok) setData(d)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const probeHit = async (decoyId: string) => {
    await fetch("/api/offsec/deception", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ action: "decoy_hit", decoyId, tooling: "test-harness", source: "operator-sim" }),
    })
    await load()
  }

  const createCanary = async () => {
    if (!canLabel.trim()) return
    await fetch("/api/offsec/deception", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ action: "create_canary", label: canLabel, placement: canPlace }),
    })
    setCanLabel("")
    setCanPlace("")
    await load()
  }

  return (
    <SuiteShell
      title="OFFSEC // DECEPTION MESH"
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
            <ShieldAlert size={15} /> Deception &amp; containment (defensive)
          </div>
          <p className="mt-1 text-[12px] text-[color:var(--ghost-dim)]">
            Emulated USB / serial / service / route decoys, canary tokens, malware capture + quarantine, and attacker
            fingerprinting. We emulate the <span className="text-[color:var(--ghost-ink)]">interface surface</span> that
            auto-inject / BadUSB-style tooling finds attractive — we do not expose a real host USB stack. Every
            interaction becomes a Heimdall IDS event and a sealed eyes-only log record. Detonation/analysis of captured
            samples must run inside the sandbox boundary (see docs/architecture/SANDBOXED_AGENT.md), never on the host.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Lock size={12} className="text-[color:var(--ghost-faint)]" />
            <span className="font-mono text-[11px] text-[color:var(--ghost-dim)]">
              Heimdall log key: {data?.heimdallKeyConfigured ? "configured (AES-256-GCM)" : "NOT set — events unsealed until HEIMDALL_LOG_KEY is provided"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="ghost-label">Hub token (SECURE_MODE)</span>
            <input className="ghost-input font-mono" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="HUB_API_TOKEN" />
          </label>
          <button type="button" className="ghost-btn" onClick={() => void load()}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <section>
          <h2 className="mb-2 font-mono text-sm uppercase tracking-[0.12em] text-[color:var(--ghost-ink)]">Decoys</h2>
          <div className="grid gap-2 lg:grid-cols-2">
            {data?.decoys?.map((d) => {
              const Icon = KIND_ICON[d.kind] || Server
              return (
                <div key={d.id} className="ghost-glass ghost-brackets space-y-1 rounded-[2px] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.08em] text-[color:var(--ghost-ink)]">
                      <Icon size={12} /> {d.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="ghost-chip">{d.kind}</span>
                      <span className={`ghost-chip ${d.hits > 0 ? "accent" : ""}`}>{d.hits} hits</span>
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-[color:var(--ghost-faint)]">surface: {d.surface}</div>
                  {d.banner && <div className="font-mono text-[10px] text-[color:var(--ghost-faint)]">banner: {d.banner}</div>}
                  {d.tarpitMs ? <div className="font-mono text-[10px] text-[color:var(--ghost-faint)]">tarpit: {d.tarpitMs}ms slow-drip</div> : null}
                  {d.lastHitAt && <div className="font-mono text-[10px] text-amber-300/80">last hit: {d.lastHitAt}</div>}
                  <button type="button" className="ghost-btn mt-1" onClick={() => void probeHit(d.id)}>
                    Record operator probe
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <div className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-3">
            <h2 className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.12em] text-[color:var(--ghost-ink)]">
              <KeyRound size={14} /> Canary tokens
            </h2>
            <p className="text-[10px] text-[color:var(--ghost-dim)]">
              Planted secret-looking values (not real secrets). Touching one fires a Heimdall alarm. The glyphstream is a
              cosmetic display skin only — it secures nothing.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input className="ghost-input font-mono" placeholder="label" value={canLabel} onChange={(e) => setCanLabel(e.target.value)} />
              <input className="ghost-input font-mono" placeholder="placement (e.g. ~/.aws/credentials)" value={canPlace} onChange={(e) => setCanPlace(e.target.value)} />
            </div>
            <button type="button" className="ghost-btn" onClick={() => void createCanary()}>
              Mint canary
            </button>
            <ul className="space-y-1">
              {data?.canaries?.map((c) => (
                <li key={c.id} className="rounded-[2px] border border-[color:var(--ghost-line)] bg-black/40 p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-[color:var(--ghost-ink)]">{c.label}</span>
                    <span className={`ghost-chip ${c.triggered ? "accent" : ""}`}>{c.triggered ? "TRIGGERED" : "armed"}</span>
                  </div>
                  <div className="truncate font-mono text-[10px] text-[color:var(--ghost-faint)]">{c.placement}</div>
                  <div className="truncate font-mono text-[10px] text-[color:var(--ghost-dim)]">token: {c.token}</div>
                  {c.tokenGlyph && <div className="truncate font-mono text-[11px] text-[color:var(--ghost-faint)]">glyph: {c.tokenGlyph}</div>}
                </li>
              ))}
            </ul>
          </div>

          <div className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-3">
            <h2 className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.12em] text-[color:var(--ghost-ink)]">
              <Fingerprint size={14} /> Attacker profiles
            </h2>
            <ul className="space-y-1">
              {data?.profiles?.length ? (
                data.profiles.map((p) => (
                  <li key={p.id} className="rounded-[2px] border border-[color:var(--ghost-line)] bg-black/40 p-2 font-mono text-[10px] text-[color:var(--ghost-dim)]">
                    <div className="text-[color:var(--ghost-ink)]">fp {p.fingerprint} · {p.hitCount} hits</div>
                    {p.tooling.length > 0 && <div>tooling: {p.tooling.join(", ")}</div>}
                    {p.ttps.length > 0 && <div>ttps: {p.ttps.join(", ")}</div>}
                    {p.sourceHints.length > 0 && <div>src: {p.sourceHints.join(", ")}</div>}
                    <div className="text-[color:var(--ghost-faint)]">{p.firstSeen} → {p.lastSeen}</div>
                  </li>
                ))
              ) : (
                <li className="text-[10px] text-[color:var(--ghost-faint)]">no profiles yet</li>
              )}
            </ul>
          </div>
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-2 font-mono text-sm uppercase tracking-[0.12em] text-[color:var(--ghost-ink)]">
            <FileWarning size={14} /> Captured samples (quarantined, inert)
          </h2>
          <div className="ghost-scroll overflow-x-auto">
            <table className="w-full text-left font-mono text-[10px] text-[color:var(--ghost-dim)]">
              <thead className="text-[color:var(--ghost-faint)]">
                <tr>
                  <th className="py-1 pr-3">sha256</th>
                  <th className="py-1 pr-3">size</th>
                  <th className="py-1 pr-3">magic</th>
                  <th className="py-1 pr-3">entropy</th>
                  <th className="py-1 pr-3">VT</th>
                </tr>
              </thead>
              <tbody>
                {data?.samples?.length ? (
                  data.samples.map((s) => (
                    <tr key={s.id} className="border-t border-[color:var(--ghost-line)]">
                      <td className="py-1 pr-3">{s.sha256.slice(0, 20)}…</td>
                      <td className="py-1 pr-3">{s.sizeBytes}</td>
                      <td className="py-1 pr-3">{String(s.metadata?.magic ?? "")}</td>
                      <td className="py-1 pr-3">{String(s.metadata?.entropy ?? "")}</td>
                      <td className="py-1 pr-3">
                        {s.vt ? (s.vt.positives != null ? `${s.vt.positives}/${s.vt.total}` : s.vt.note || "—") : "not checked"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-2 text-[color:var(--ghost-faint)]">
                      no samples captured — drop a payload on a decoy via POST /api/offsec/deception/capture
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-[10px] text-[color:var(--ghost-faint)]">
            VirusTotal submission is opt-in and staged-ladder gated (hash lookup is low-risk; sample upload can tip off an
            attacker). Set VT_API_KEY + DECEPTION_VT_SUBMIT_ENABLED and attest under an active scope.
          </p>
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-2 font-mono text-sm uppercase tracking-[0.12em] text-[color:var(--ghost-ink)]">
            <Eye size={14} /> Heimdall event stream
          </h2>
          {data?.glyphSkinDisclaimer && (
            <p className="mb-1 text-[10px] text-amber-300/70">{data.glyphSkinDisclaimer}</p>
          )}
          <ul className="space-y-1">
            {data?.events?.length ? (
              data.events.map((e) => (
                <li key={e.id} className="rounded-[2px] border border-[color:var(--ghost-line)] bg-black/40 p-2 font-mono text-[10px]">
                  <span
                    className={
                      e.severity === "critical" || e.severity === "high"
                        ? "text-red-400"
                        : e.severity === "medium"
                          ? "text-amber-300"
                          : "text-[color:var(--ghost-dim)]"
                    }
                  >
                    [{e.severity}]
                  </span>{" "}
                  <span className="text-[color:var(--ghost-faint)]">{e.ts}</span>{" "}
                  <span className="text-[color:var(--ghost-ink)]">{e.kind}</span> — {e.message}
                  {e.fingerprint ? <span className="text-[color:var(--ghost-faint)]"> · fp {e.fingerprint}</span> : null}
                </li>
              ))
            ) : (
              <li className="text-[10px] text-[color:var(--ghost-faint)]">no events yet</li>
            )}
          </ul>
        </section>
      </div>
    </SuiteShell>
  )
}
