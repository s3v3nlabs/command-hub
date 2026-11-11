"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechCard, TechCardHeader, TechCardTitle, TechCardContent } from "@/components/ui/tech-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, RefreshCw, Lock, EyeOff, Network, ArrowLeft } from "lucide-react"

type PrivacyPayload = {
  ok: boolean
  fortress?: string
  version?: string
  hold?: string
  telemetry?: {
    analytics: string
    bodyLogging: string
    consoleBodies: boolean
    networkBeacons: boolean
  }
  encryption?: {
    available: boolean
    persistFlag: boolean
    keyFingerprint: string | null
    vaultDir: string
    alg: string
  }
  egress?: {
    mode: string
    proxyActive: boolean
    httpProxyConfigured: boolean
    proxyChainSelected?: boolean
    proxyChainConfigured?: boolean
    proxyChainHonesty?: string
    torSocks: string
    torReachable: boolean
    torDetail: string
    note: string
  }
  lattice_sync?: boolean
  panel?: {
    neverLogBodies: boolean
    persistEncryptedOnlyWhen: string
  }
  checkedAt?: string
  error?: string
}

function chip(ok: boolean) {
  return ok
    ? "border-emerald-500/40 text-emerald-300"
    : "border-amber-500/40 text-amber-300"
}

export default function PrivacyFortressPage() {
  const [data, setData] = useState<PrivacyPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/privacy/status", { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as PrivacyPayload
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : "refresh failed")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <div className="hub-shell flex bg-black text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="PRIVACY FORTRESS" />
        <div className="flex flex-wrap items-center gap-2 border-b border-dark-300/40 bg-dark-100/40 px-6 py-2">
          <Badge variant="outline" className="font-mono text-xs border-cyan-500/40 text-cyan-300">
            /privacy
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">
            HOLD_VYRNA_UNSYNC
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-rose-500/40 text-rose-300">
            lattice_sync: false
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-emerald-500/40 text-emerald-300">
            TELEMETRY OFF
          </Badge>
          <Link href="/command-hub" className="ml-2">
            <Button size="sm" variant="outline" className="h-7 text-xs font-mono border-gray-600 bg-transparent">
              <ArrowLeft className="mr-1 h-3 w-3" />
              Command Hub
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto h-7 text-xs font-mono border-gray-600 bg-transparent"
            onClick={() => void refresh()}
            disabled={loading}
          >
            <RefreshCw className={`mr-1 h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="hub-shell-scroll p-4 md:p-6 space-y-6">
          {error && (
            <div className="rounded border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs text-red-300 font-mono">
              {error}
            </div>
          )}

          <TechPanel
            title="PRIVACY FORTRESS STATUS"
            subtitle="ANTI-TELEMETRY · ENCRYPT-AT-REST · EGRESS PROFILES — OWN STACK ONLY"
            cornerAccent={true}
            borderAccent={true}
          >
            <p className="mb-4 text-[11px] text-gray-500 font-mono">
              Singular/ty defensive + authorized-ops. No exploits / malware / unauthorized access tooling.
              Operator runs WireGuard / Tor / proxies externally — app only honors env.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <TechCard variant="default" cornerAccent glowEffect>
                <TechCardHeader>
                  <TechCardTitle className="flex items-center gap-2 text-xs">
                    <EyeOff className="w-3.5 h-3.5" /> Telemetry
                  </TechCardTitle>
                </TechCardHeader>
                <TechCardContent className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500">analytics</span>
                    <Badge variant="outline" className={chip(true)}>
                      {data?.telemetry?.analytics ?? "…"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">body logging</span>
                    <Badge variant="outline" className={chip(true)}>
                      {data?.telemetry?.bodyLogging ?? "…"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">console bodies</span>
                    <span>{data?.telemetry?.consoleBodies === false ? "refused" : "…"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">network beacons</span>
                    <span>{data?.telemetry?.networkBeacons === false ? "blocked" : "…"}</span>
                  </div>
                </TechCardContent>
              </TechCard>

              <TechCard variant="default" cornerAccent glowEffect>
                <TechCardHeader>
                  <TechCardTitle className="flex items-center gap-2 text-xs">
                    <Lock className="w-3.5 h-3.5" /> Encryption
                  </TechCardTitle>
                </TechCardHeader>
                <TechCardContent className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500">at-rest</span>
                    <Badge variant="outline" className={chip(Boolean(data?.encryption?.available))}>
                      {data?.encryption?.available ? "ON" : "OFF"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">alg</span>
                    <span>{data?.encryption?.alg ?? "aes-256-gcm"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">persist flag</span>
                    <span>{data?.encryption?.persistFlag ? "S3V3N_PANEL_PERSIST=1" : "off"}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500 shrink-0">key fp</span>
                    <span className="truncate text-gray-400">
                      {data?.encryption?.keyFingerprint ?? "none"}
                    </span>
                  </div>
                </TechCardContent>
              </TechCard>

              <TechCard variant="default" cornerAccent glowEffect>
                <TechCardHeader>
                  <TechCardTitle className="flex items-center gap-2 text-xs">
                    <Network className="w-3.5 h-3.5" /> Egress
                  </TechCardTitle>
                </TechCardHeader>
                <TechCardContent className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500">mode</span>
                    <Badge variant="outline" className="border-cyan-500/40 text-cyan-300">
                      {data?.egress?.mode ?? "…"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">HTTP proxy set</span>
                    <Badge
                      variant="outline"
                      className={chip(Boolean(data?.egress?.httpProxyConfigured))}
                    >
                      {data?.egress?.httpProxyConfigured ? "YES" : "NO"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">proxy agent</span>
                    <span>{data?.egress?.proxyActive ? "active" : "idle"}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500 shrink-0">proxy-chain</span>
                    <Badge
                      variant="outline"
                      className={
                        data?.egress?.proxyChainConfigured
                          ? "border-emerald-500/40 text-emerald-300"
                          : data?.egress?.proxyChainSelected
                            ? "border-amber-500/40 text-amber-300"
                            : "border-gray-600 text-gray-400"
                      }
                    >
                      {data?.egress?.proxyChainConfigured
                        ? "CONFIGURED"
                        : data?.egress?.proxyChainSelected
                          ? "NOT CFG"
                          : "off"}
                    </Badge>
                  </div>
                  {data?.egress?.proxyChainHonesty && (
                    <p className="text-[10px] text-amber-200/80 pt-0.5">
                      {data.egress.proxyChainHonesty}
                    </p>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tor SOCKS</span>
                    <Badge variant="outline" className={chip(Boolean(data?.egress?.torReachable))}>
                      {data?.egress?.torReachable ? "reachable" : "no"}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-gray-500 pt-1">{data?.egress?.torDetail}</p>
                </TechCardContent>
              </TechCard>
            </div>
          </TechPanel>

          <TechPanel
            title="OPERATOR NOTES"
            subtitle="RUNBOOK · docs/PRIVACY_FORTRESS.md"
            cornerAccent
            borderAccent
          >
            <ul className="text-xs text-gray-400 space-y-2 font-mono list-disc pl-4">
              <li>
                Egress modes: <code>direct</code> | <code>vpn</code> | <code>tor</code> |{" "}
                <code>proxy-chain</code> via <code>S3V3N_EGRESS_MODE</code>
              </li>
              <li>
                Set <code>S3V3N_HTTP_PROXY</code> (http/https) for undici ProxyAgent on non-local seat
                fetches when mode ≠ direct
              </li>
              <li>
                Tor: Operator runs Tor daemon; default SOCKS <code>socks5://127.0.0.1:9050</code> —
                TCP check only (no attack probes)
              </li>
              <li>
                Panel persist encrypted only if <code>S3V3N_PANEL_PERSIST=1</code>; key from{" "}
                <code>S3V3N_PRIVACY_KEY</code> or vault file (chmod 600)
              </li>
              <li>Never log prompt/response bodies — see antiTelemetry helpers</li>
            </ul>
            <p className="mt-3 text-[10px] text-gray-600 font-mono">
              checkedAt: {data?.checkedAt ?? "—"} · {data?.egress?.note}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/command-hub">
                <Button size="sm" variant="outline" className="h-7 text-xs font-mono border-gray-600 bg-transparent">
                  <Shield className="mr-1 h-3 w-3" />
                  Fortress Hub
                </Button>
              </Link>
              <Link href="/test-harness">
                <Button size="sm" variant="outline" className="h-7 text-xs font-mono border-gray-600 bg-transparent">
                  Test Harness
                </Button>
              </Link>
              <Link href="/docs" className="pointer-events-none opacity-50" aria-disabled>
                <Button size="sm" variant="outline" className="h-7 text-xs font-mono border-gray-600 bg-transparent" disabled>
                  docs/PRIVACY_FORTRESS.md
                </Button>
              </Link>
            </div>
          </TechPanel>
        </div>
      </div>
    </div>
  )
}
