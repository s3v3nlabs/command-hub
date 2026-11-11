"use client"

import { useState } from "react"
import { Search, RefreshCw, Server } from "lucide-react"

type Tab = "shodan" | "censys" | "internetdb"

async function postJson(url: string, body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`
  const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) })
  const data = await r.json().catch(() => ({}))
  return { status: r.status, data }
}

async function getJson(url: string, token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const r = await fetch(url, { headers, cache: "no-store" })
  const data = await r.json().catch(() => ({}))
  return { status: r.status, data }
}

export function IntelSearchPanel() {
  const [tab, setTab] = useState<Tab>("shodan")
  const [token, setToken] = useState("")
  const [query, setQuery] = useState('apache country:"US"')
  const [ip, setIp] = useState("")
  const [hostname, setHostname] = useState("")
  const [out, setOut] = useState<string>("")
  const [busy, setBusy] = useState(false)
  const [statusLine, setStatusLine] = useState("")

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ghost-glass ghost-brackets space-y-3 rounded-[2px] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[color:var(--ghost-ink)]">
          <Server size={13} /> Shodan + Censys (server-side)
        </div>
        <div className="flex flex-wrap gap-1">
          {(["shodan", "censys", "internetdb"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`ghost-chip ${tab === t ? "accent" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-[color:var(--ghost-dim)]">
        API keys stay on the server (<span className="font-mono">SHODAN_API_KEY</span>,{" "}
        <span className="font-mono">CENSYS_API_ID</span>/<span className="font-mono">SECRET</span>). In SECURE_MODE,
        pass your hub token. Private / loopback / metadata IPs are blocked.
      </p>
      <label className="flex flex-col gap-1">
        <span className="ghost-label">Hub token (optional unless SECURE_MODE)</span>
        <input
          className="ghost-input font-mono"
          type="password"
          autoComplete="off"
          placeholder="HUB_API_TOKEN"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </label>

      {tab !== "internetdb" && (
        <label className="flex flex-col gap-1">
          <span className="ghost-label">Search query</span>
          <input
            className="ghost-input font-mono"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === "shodan" ? 'product:nginx country:"DE"' : "services.http.response.status_code:200"}
          />
        </label>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="ghost-label">Host IP</span>
          <input
            className="ghost-input font-mono"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="1.1.1.1"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="ghost-label">Hostname (Shodan DNS)</span>
          <input
            className="ghost-input font-mono"
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            placeholder="example.com"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tab === "shodan" && (
          <>
            <button
              type="button"
              className="ghost-btn"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const r = await postJson("/api/shodan/search", { query, page: 1 }, token || undefined)
                  setOut(JSON.stringify(r.data, null, 2))
                  setStatusLine(`search HTTP ${r.status}`)
                })
              }
            >
              <Search size={11} /> Search
            </button>
            <button
              type="button"
              className="ghost-btn"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const r = await postJson("/api/shodan/count", { query }, token || undefined)
                  setOut(JSON.stringify(r.data, null, 2))
                  setStatusLine(`count HTTP ${r.status}`)
                })
              }
            >
              Count
            </button>
            <button
              type="button"
              className="ghost-btn"
              disabled={busy || !ip}
              onClick={() =>
                void run(async () => {
                  const r = await postJson("/api/shodan/host", { ip }, token || undefined)
                  setOut(JSON.stringify(r.data, null, 2))
                  setStatusLine(`host HTTP ${r.status}`)
                })
              }
            >
              Host
            </button>
            <button
              type="button"
              className="ghost-btn"
              disabled={busy || !hostname}
              onClick={() =>
                void run(async () => {
                  const r = await postJson("/api/shodan/dns", { hostname }, token || undefined)
                  setOut(JSON.stringify(r.data, null, 2))
                  setStatusLine(`dns HTTP ${r.status}`)
                })
              }
            >
              DNS resolve
            </button>
            <button
              type="button"
              className="ghost-btn"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const r = await getJson("/api/shodan/status", token || undefined)
                  setOut(JSON.stringify(r.data, null, 2))
                  setStatusLine(`api-info HTTP ${r.status}`)
                })
              }
            >
              <RefreshCw size={11} /> API info
            </button>
          </>
        )}
        {tab === "censys" && (
          <>
            <button
              type="button"
              className="ghost-btn"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const r = await postJson("/api/censys/search", { q: query, per_page: 25 }, token || undefined)
                  setOut(JSON.stringify(r.data, null, 2))
                  setStatusLine(`censys search HTTP ${r.status}`)
                })
              }
            >
              <Search size={11} /> Search hosts
            </button>
            <button
              type="button"
              className="ghost-btn"
              disabled={busy || !ip}
              onClick={() =>
                void run(async () => {
                  const r = await postJson("/api/censys/host", { ip }, token || undefined)
                  setOut(JSON.stringify(r.data, null, 2))
                  setStatusLine(`censys host HTTP ${r.status}`)
                })
              }
            >
              Host
            </button>
            <button
              type="button"
              className="ghost-btn"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const r = await getJson("/api/censys/status", token || undefined)
                  setOut(JSON.stringify(r.data, null, 2))
                  setStatusLine(`censys account HTTP ${r.status}`)
                })
              }
            >
              <RefreshCw size={11} /> Account
            </button>
          </>
        )}
        {tab === "internetdb" && (
          <button
            type="button"
            className="ghost-btn"
            disabled={busy || !ip}
            onClick={() =>
              void run(async () => {
                const r = await postJson("/api/shodan/internetdb", { ip })
                setOut(JSON.stringify(r.data, null, 2))
                setStatusLine(`internetdb HTTP ${r.status}`)
              })
            }
          >
            <Search size={11} /> Lookup IP (keyless)
          </button>
        )}
      </div>
      {statusLine && <div className="font-mono text-[10px] text-[color:var(--ghost-faint)]">{statusLine}</div>}
      <pre className="ghost-scroll max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-[2px] border border-[color:var(--ghost-line)] bg-black/50 p-2 font-mono text-[10px] text-[color:var(--ghost-ink)]">
        {out || "// results appear here"}
      </pre>
    </div>
  )
}
