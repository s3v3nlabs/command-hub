"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { TechPanel } from "@/components/ui/tech-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, HardDrive, Activity, Terminal, Radio } from "lucide-react"

type DimmPayload = {
  ok?: boolean
  mounted?: boolean
  host?: { memTotalGi?: number; memAvailableGi?: number; boxHardCapGb?: number }
  local?: {
    enabled?: boolean
    backend?: string
    sizeGb?: number
    path?: string
    usedBytes?: number | null
    softLimitBytes?: number | null
  }
  tiers?: { local?: boolean; external?: boolean; runpod?: boolean }
  runpodApiKeyPresent?: boolean
  sigilCacheCount?: number
  sigil2vec?: { note?: string; dims?: number; badge?: string; encoder?: string; opencvAvailable?: boolean; mode?: string }
  mesh?: {
    peers?: Array<{ provider?: string; enabled?: boolean }>
    envKeysPresent?: string[]
  }
  error?: string
  detail?: string
}

function fmtBytes(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return "—"
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KiB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MiB`
  return `${(n / 1024 ** 3).toFixed(2)} GiB`
}

export default function DimmDrivePage() {
  const [data, setData] = useState<DimmPayload | null>(null)
  const [busy, setBusy] = useState(false)
  const [quota, setQuota] = useState("0.5")
  const [msg, setMsg] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const res = await fetch("/api/dimm-drive", { cache: "no-store" }).then((r) => r.json()).catch(() => null)
    if (res) setData(res)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function post(action: string, extra?: Record<string, unknown>) {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch("/api/dimm-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      })
      const body = await res.json().catch(() => ({}))
      setData(body)
      setMsg(body.detail || body.error || (res.ok ? `${action} ok` : `HTTP ${res.status}`))
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  const used = data?.local?.usedBytes
  const total = data?.local?.softLimitBytes
  const pct =
    used != null && total && total > 0 ? Math.min(100, Math.round((used / total) * 100)) : null

  return (
    <div className="hub-shell flex bg-black text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="DIMM DRIVE · RAM disk for local AI" />
        <div className="flex flex-wrap items-center gap-2 border-b border-dark-300/40 bg-dark-100/40 px-6 py-2">
          <Badge variant="outline" className="font-mono text-xs border-cyan-500/40 text-cyan-300">
            /dimm-drive
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">
            HOLD_VYRNA_UNSYNC
          </Badge>
          <Badge
            variant="outline"
            className={
              data?.mounted
                ? "font-mono text-xs border-emerald-500/40 text-emerald-300"
                : "font-mono text-xs border-gray-600 text-gray-400"
            }
          >
            {data?.mounted ? `mounted · ${data.local?.backend || "?"}` : "unmounted"}
          </Badge>
          <Link href="/dev-operator">
            <Button size="sm" variant="outline" className="h-7 text-xs font-mono border-gray-600 bg-transparent">
              <Terminal className="mr-1 h-3 w-3" /> Dev Operator
            </Button>
          </Link>
          <Link href="/command-hub">
            <Button size="sm" variant="outline" className="h-7 text-xs font-mono border-gray-600 bg-transparent">
              Command Hub
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto h-7 text-xs font-mono border-gray-600 bg-transparent"
            onClick={() => void refresh()}
            disabled={busy}
          >
            <RefreshCw className="mr-1 h-3 w-3" /> Refresh
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          <TechPanel
            title="HOST QUOTA"
            subtitle="max = min(requested, floor(avail×0.5), 4Gi) · reserve last 2Gi · refuse avail&lt;2.5Gi"
            cornerAccent
            borderAccent
          >
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className="font-mono text-[10px] border-gray-600 text-gray-300">
                <HardDrive className="mr-1 inline h-3 w-3" />
                total {data?.host?.memTotalGi?.toFixed?.(2) ?? "—"} Gi · avail{" "}
                {data?.host?.memAvailableGi?.toFixed?.(2) ?? "—"} Gi
              </Badge>
              <Badge variant="outline" className="font-mono text-[10px] border-violet-700/50 text-violet-300">
                hard cap {data?.host?.boxHardCapGb ?? 4} Gi
              </Badge>
              <Badge variant="outline" className="font-mono text-[10px] border-cyan-700/50 text-cyan-300">
                path: {data?.local?.path || "—"}
              </Badge>
              <Badge variant="outline" className="font-mono text-[10px] border-emerald-700/50 text-emerald-300">
                used {fmtBytes(used)} / {fmtBytes(total)}
                {pct != null ? ` (${pct}%)` : ""}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="font-mono text-[10px] text-gray-500">size-gb</label>
              <input
                value={quota}
                onChange={(e) => setQuota(e.target.value)}
                className="h-7 w-20 rounded border border-gray-700 bg-black px-2 font-mono text-xs text-cyan-200"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs font-mono border-cyan-800 bg-transparent text-cyan-300"
                disabled={busy}
                onClick={() => void post("setQuotaGb", { sizeGb: Number(quota) })}
              >
                Set quota
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs font-mono border-emerald-800 bg-transparent text-emerald-300"
                disabled={busy}
                onClick={() => void post("ensureMounted", { sizeGb: Number(quota) })}
              >
                Ensure mounted
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs font-mono border-amber-800 bg-transparent text-amber-300"
                disabled={busy}
                onClick={() => void post("destroy")}
              >
                Destroy
              </Button>
            </div>
            {msg && <p className="mt-2 font-mono text-[10px] text-gray-500">{msg}</p>}
          </TechPanel>

          <TechPanel title="CHAIN TIERS" subtitle="local miss → external DIMM → RunPod GPU" cornerAccent>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={
                  data?.tiers?.local || data?.mounted
                    ? "border-emerald-500/40 text-emerald-300 font-mono text-[10px]"
                    : "border-gray-600 text-gray-400 font-mono text-[10px]"
                }
              >
                local
              </Badge>
              <Badge
                variant="outline"
                className={
                  data?.tiers?.external
                    ? "border-emerald-500/40 text-emerald-300 font-mono text-[10px]"
                    : "border-gray-600 text-gray-400 font-mono text-[10px]"
                }
              >
                external
              </Badge>
              <Badge
                variant="outline"
                className={
                  data?.tiers?.runpod
                    ? "border-emerald-500/40 text-emerald-300 font-mono text-[10px]"
                    : "border-gray-600 text-gray-400 font-mono text-[10px]"
                }
              >
                <Radio className="mr-1 inline h-3 w-3" />
                runpod {data?.runpodApiKeyPresent ? "· key present" : "· key absent"}
              </Badge>
            </div>
            <p className="mt-2 font-mono text-[10px] text-gray-500">
              GPU mesh peers: {data?.mesh?.peers?.map((peer) => peer.provider).filter(Boolean).join(", ") || "—"} · not connected.{" "}
              <Link href="/mesh" className="text-cyan-400 hover:underline">
                Open Mesh Hub
              </Link>{" "}
              (Operator-owned seats · forbidsBurnerAccounts).
            </p>
          </TechPanel>

          <TechPanel
            title="SIGIL2VEC CACHE"
            subtitle={
              "glyph/image → ~128-D descriptor probe on DIMM sigil/ · STUB_HASH (no trained Sigil2vec pack)"
            }
            cornerAccent
          >
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={
                  "border-amber-600/50 font-mono text-[10px] text-amber-300"
                }
              >
                {data?.sigil2vec?.badge || "STUB_HASH"}
              </Badge>
              <Badge variant="outline" className="border-violet-700/50 font-mono text-[10px] text-violet-300">
                <Activity className="mr-1 inline h-3 w-3" />
                sigil cache: {data?.sigilCacheCount ?? 0}
              </Badge>
              <Badge variant="outline" className="border-gray-600 font-mono text-[10px] text-gray-400">
                pack: sigil2vec · 128-D · encoder {data?.sigil2vec?.encoder || "STUB_HASH"}
              </Badge>
              <Badge variant="outline" className="border-gray-600 font-mono text-[10px] text-gray-500">
                opencv: {data?.sigil2vec?.opencvAvailable ? "yes" : "absent"}
              </Badge>
            </div>
            <p className="mt-2 font-mono text-[10px] text-gray-500">
              {data?.sigil2vec?.note ||
                "Hash-unit stub only — do not treat vectors as trained OpenCV embeddings. Couplings: KV/GGUF → models+kv · sigma pools → symbols."}
            </p>
          </TechPanel>
        </div>
      </div>
    </div>
  )
}
