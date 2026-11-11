"use client"

import { useCallback, useEffect, useState } from "react"
import { ShieldCheck, ShieldAlert, ShieldX, Package, RefreshCw, Download, Power, Trash2, ExternalLink } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"

type Sig = { status: string; verified: boolean; keySource: string; detail: string }
type Entry = {
  id: string
  name: string
  version: string
  description: string
  route?: string
  permissions: string[]
  publisher?: string
  homepage?: string
  license?: string
  category?: string
  valid?: boolean
  validationErrors?: string[]
}
type State = Record<string, { installed: boolean; enabled: boolean; installedAt?: string }>
type Payload = {
  ok: boolean
  source: string
  url: string | null
  signature: Sig
  index: { version: string; generatedAt: string; modules: Entry[] } | null
  state: State
  error?: string
}

function SigBanner({ sig }: { sig: Sig }) {
  const verified = sig.verified
  const unknown = sig.status === "no_key" || sig.status === "unsigned"
  const Icon = verified ? ShieldCheck : unknown ? ShieldAlert : ShieldX
  const color = verified
    ? "border-emerald-600 bg-emerald-950/40 text-emerald-300"
    : unknown
      ? "border-amber-600 bg-amber-950/40 text-amber-300"
      : "border-red-600 bg-red-950/40 text-red-300"
  const label = verified
    ? "Index signature VERIFIED"
    : sig.status === "no_key"
      ? "UNVERIFIED — no verification key configured"
      : sig.status === "unsigned"
        ? "UNVERIFIED — no signature present"
        : sig.status === "invalid"
          ? "SIGNATURE INVALID — do not trust"
          : "Signature error"
  return (
    <div className={`flex items-start gap-2 rounded border px-3 py-2 text-xs ${color}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div>
        <div className="font-semibold">{label}</div>
        <div className="opacity-80">{sig.detail} {sig.keySource !== "none" && `(key: ${sig.keySource})`}</div>
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  const [data, setData] = useState<Payload | null>(null)
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await fetch("/api/marketplace").then((r) => r.json())
      setData(d)
    } catch (e) {
      setMsg(`load failed: ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const act = useCallback(
    async (id: string, action: string) => {
      setMsg("")
      try {
        const r = await fetch("/api/marketplace", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ id, action }),
        })
        const j = await r.json()
        if (!j.ok) setMsg(`${action} failed: ${j.error || r.status}${r.status === 403 ? " (set operator token)" : ""}`)
        await load()
      } catch (e) {
        setMsg(`${action} failed: ${(e as Error).message}`)
      }
    },
    [token, load],
  )

  const modules = data?.index?.modules || []
  const state = data?.state || {}

  return (
    <SuiteShell
      title="Module Marketplace"
      status="real"
      nav={
        <>
          <SuiteNavLink href="/help" label="Docs" />
          <SuiteNavLink href="/offsec" label="OffSec" />
          <span className="ghost-btn opacity-70">Plugin SDK: docs/PLUGIN_SDK.md</span>
        </>
      }
    >
      <div className="mx-auto max-w-5xl space-y-4">
        <header className="space-y-1">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Package size={18} /> Module Marketplace
          </div>
          <p className="text-xs text-[color:var(--ghost-dim)]">
            Index source: <b>{data?.source || "…"}</b>
            {data?.url ? ` (${data.url})` : " (bundled public/registry/modules.json)"} · schema {data?.index?.version || "?"} ·
            swap to a hosted index with REGISTRY_INDEX_URL. Installing is metadata only — core never executes plugin code.
          </p>
        </header>

        {data?.signature && <SigBanner sig={data.signature} />}

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="password"
            placeholder="Operator token (for install/enable)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="ghost-input w-72 text-xs"
          />
          <button className="ghost-btn" onClick={load}>
            <RefreshCw size={13} /> Refresh
          </button>
          {msg && <span className="text-xs text-amber-400">{msg}</span>}
        </div>

        {loading && <div className="text-xs text-[color:var(--ghost-dim)]">Loading index…</div>}
        {data && !data.ok && <div className="text-xs text-red-400">Index unavailable: {data.error || "unknown"}</div>}

        <div className="grid gap-3 md:grid-cols-2">
          {modules.map((m) => {
            const st = state[m.id] || { installed: false, enabled: false }
            return (
              <div key={m.id} className="rounded border border-[color:var(--ghost-line)] bg-black/50 p-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm">{m.name}</div>
                    <div className="text-[color:var(--ghost-dim)]">
                      v{m.version} · {m.publisher || "unknown publisher"} · {m.license || "—"}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {st.installed ? (
                      <span className={`rounded px-1.5 py-0.5 ${st.enabled ? "bg-emerald-900 text-emerald-300" : "bg-zinc-800 text-zinc-400"}`}>
                        {st.enabled ? "enabled" : "disabled"}
                      </span>
                    ) : (
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400">not installed</span>
                    )}
                    {m.valid === false && <span className="rounded bg-red-900 px-1.5 py-0.5 text-red-300">invalid manifest</span>}
                  </div>
                </div>
                <p className="mt-2 text-[color:var(--ghost-ink)]">{m.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.permissions.map((p) => (
                    <span key={p} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300">
                      {p}
                    </span>
                  ))}
                  {m.category && <span className="rounded bg-indigo-900/60 px-1.5 py-0.5 text-[10px] text-indigo-300">{m.category}</span>}
                </div>
                {m.valid === false && m.validationErrors?.length ? (
                  <ul className="mt-1 list-disc pl-4 text-red-400">
                    {m.validationErrors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {!st.installed ? (
                    <button className="ghost-btn" disabled={m.valid === false} onClick={() => act(m.id, "install")}>
                      <Download size={13} /> Install
                    </button>
                  ) : (
                    <>
                      <button className="ghost-btn" onClick={() => act(m.id, st.enabled ? "disable" : "enable")}>
                        <Power size={13} /> {st.enabled ? "Disable" : "Enable"}
                      </button>
                      <button className="ghost-btn" onClick={() => act(m.id, "uninstall")}>
                        <Trash2 size={13} /> Uninstall
                      </button>
                    </>
                  )}
                  {m.route && (
                    <a className="ghost-btn" href={m.route}>
                      Open <ExternalLink size={12} />
                    </a>
                  )}
                  {m.homepage && (
                    <a className="ghost-btn" href={m.homepage} target="_blank" rel="noreferrer">
                      Homepage <ExternalLink size={12} />
                    </a>
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
