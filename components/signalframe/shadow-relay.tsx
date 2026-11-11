"use client"

import { useEffect, useState, useCallback } from "react"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { ChevronDown, ChevronRight, Shield, Globe, Zap, Eye, Settings, RefreshCw } from "lucide-react"
import type { FrameMetadata } from "@/types/signalframe"

interface ShadowRelayProps {
  frameId: string
  metadata: FrameMetadata
}

type PrivacyEgress = {
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

type PrivacyStatusPayload = {
  ok?: boolean
  fortress?: string
  hold?: string
  egress?: PrivacyEgress
  encryption?: {
    available: boolean
    persistFlag: boolean
    keyFingerprint: string | null
  }
  telemetry?: {
    analytics: string
    bodyLogging: string
    consoleBodies: boolean
  }
  checkedAt?: string
  error?: string
}

/** Chrome labels only — NEVER treated as live truth. */
const RELAY_CHROME_LABELS = [
  { name: "VPN", hint: "Operator WireGuard / host egress" },
  { name: "Tor", hint: "SOCKS reachability from privacy status" },
  { name: "ProxyChain", hint: "S3V3N_HTTP_PROXY first hop" },
  { name: "Localhop", hint: "loopback / local seats" },
  { name: "ObfsBridge", hint: "Operator infra (chrome only)" },
  { name: "MeshRelay", hint: "Hive / mesh adjacency (chrome only)" },
]

export function ShadowRelay({ frameId, metadata }: ShadowRelayProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    status: true,
    diagnostics: false,
    config: false,
    threats: false,
    profiles: false,
  })
  const [privacy, setPrivacy] = useState<PrivacyStatusPayload | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch("/api/privacy/status")
      const data = (await res.json().catch(() => ({}))) as PrivacyStatusPayload
      if (!res.ok || data?.ok === false) {
        setLoadError(data?.error || res.statusText || "privacy status failed")
        setPrivacy(null)
      } else {
        setPrivacy(data)
      }
    } catch {
      setLoadError("network error fetching /api/privacy/status")
      setPrivacy(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh, frameId])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const egress = privacy?.egress
  const mode = egress?.mode || "unknown"
  const modeStatus =
    mode === "direct" ? "warning" : mode === "vpn" || mode === "tor" || mode === "proxy-chain" ? "online" : "offline"

  const chromeStatus = (name: string): "online" | "warning" | "offline" => {
    if (!egress) return "offline"
    if (name === "Tor") return egress.torReachable ? "online" : "offline"
    if (name === "VPN") return mode === "vpn" ? "online" : "warning"
    if (name === "ProxyChain") {
      if (egress.proxyChainConfigured || (mode === "proxy-chain" && egress.proxyActive)) return "online"
      if (mode === "proxy-chain") return "offline" // selected but not configured
      return egress.httpProxyConfigured ? "warning" : "offline"
    }
    if (name === "Localhop") return mode === "direct" ? "online" : "warning"
    return "warning"
  }

  return (
    <div className="h-full overflow-y-auto bg-dark-100/20 border-l border-dark-300/30">
      <div className="p-3 border-b border-dark-300/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-dark-800 mb-1">SHADOWRELAY</div>
            <div className="text-xs text-dark-600">Privacy Fortress egress (live status)</div>
          </div>
          <TechButton variant="outline" size="sm" onClick={() => void refresh()} disabled={loading} className="text-xs">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </TechButton>
        </div>
        {privacy?.hold && (
          <div className="mt-1 text-[10px] font-mono text-dark-500">{privacy.hold} · lattice_sync: false</div>
        )}
        <div className="mt-1 text-[10px] font-mono text-sky-400/80">
          LOCAL MULTI-TAB · BroadcastChannel + SSE · not LIVE MESH
        </div>
      </div>

      <div className="p-3 space-y-3">
        <div className="cyber-panel bg-dark-200/20 border border-dark-300/30 rounded-sm p-2 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-600">Egress mode</span>
            <Badge variant={mode === "direct" ? "warning" : "success"} className="text-xs uppercase">
              {loading ? "…" : mode}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-600">HTTP proxy configured</span>
            <Badge variant={egress?.httpProxyConfigured ? "success" : "outline"} className="text-xs">
              {egress?.httpProxyConfigured ? "YES" : "NO"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-600">Proxy agent active</span>
            <Badge variant={egress?.proxyActive ? "success" : "outline"} className="text-xs">
              {egress?.proxyActive ? "YES" : "NO"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-600">proxy-chain honesty</span>
            <Badge
              variant={
                egress?.proxyChainConfigured
                  ? "success"
                  : egress?.proxyChainSelected || mode === "proxy-chain"
                    ? "warning"
                    : "outline"
              }
              className="text-xs max-w-[11rem] truncate"
              title={egress?.proxyChainHonesty || ""}
            >
              {egress?.proxyChainConfigured
                ? "CONFIGURED"
                : egress?.proxyChainSelected || mode === "proxy-chain"
                  ? "NOT CFG"
                  : "off"}
            </Badge>
          </div>
          {egress?.proxyChainHonesty && (
            <div className="text-[10px] text-dark-500 break-words">{egress.proxyChainHonesty}</div>
          )}
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-600">Tor TCP</span>
            <Badge variant={egress?.torReachable ? "success" : "warning"} className="text-xs">
              {egress?.torReachable ? "REACHABLE" : "UNREACHABLE"}
            </Badge>
          </div>
          {egress?.torSocks && (
            <div className="text-[10px] font-mono text-dark-500 break-all">SOCKS {egress.torSocks}</div>
          )}
          {egress?.torDetail && !egress.torReachable && (
            <div className="text-[10px] font-mono text-dark-500 break-all">{egress.torDetail.slice(0, 120)}</div>
          )}
          {egress?.note && <div className="text-[10px] text-dark-600">{egress.note}</div>}
          {loadError && <div className="text-[10px] text-red-400">{loadError}</div>}
          {privacy?.checkedAt && (
            <div className="text-[10px] text-dark-500">
              checked {new Date(privacy.checkedAt).toLocaleString()}
            </div>
          )}
        </div>

        <div className="cyber-panel bg-dark-200/20 border border-dark-300/30 rounded-sm">
          <button
            onClick={() => toggleSection("status")}
            className="w-full flex items-center justify-between p-2 text-left"
          >
            <div className="flex items-center space-x-2">
              <Shield className="w-3 h-3 text-dark-700" />
              <span className="font-mono text-xs uppercase tracking-wider text-dark-800">Relay Chrome</span>
              <Badge variant="outline" className="text-[9px]">
                NOT LIVE LATENCY
              </Badge>
            </div>
            {expandedSections.status ? (
              <ChevronDown className="w-3 h-3 text-dark-600" />
            ) : (
              <ChevronRight className="w-3 h-3 text-dark-600" />
            )}
          </button>

          {expandedSections.status && (
            <div className="p-2 pt-0 space-y-2">
              {RELAY_CHROME_LABELS.map((relay) => (
                <div key={relay.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <StatusIndicator status={chromeStatus(relay.name)} size="sm" />
                    <span className="text-dark-800">{relay.name}</span>
                  </div>
                  <span className="text-dark-500 text-[10px] max-w-[9rem] truncate" title={relay.hint}>
                    {relay.name === "Tor"
                      ? egress?.torReachable
                        ? "TCP ok"
                        : "TCP fail"
                      : relay.name === "VPN"
                        ? mode === "vpn"
                          ? "mode=vpn"
                          : "not active"
                        : relay.name === "ProxyChain"
                          ? mode === "proxy-chain"
                            ? egress?.proxyChainConfigured || egress?.proxyActive
                              ? "READY"
                              : "NOT CFG"
                            : egress?.httpProxyConfigured
                              ? "proxy set"
                              : "no proxy"
                          : relay.name === "Localhop"
                            ? mode === "direct"
                              ? "direct"
                              : mode
                            : "chrome"}
                  </span>
                </div>
              ))}
              <div className="text-[10px] text-dark-500 pt-1">
                Country / latency mock numbers removed — bind truth to egress mode above. Frame sync:{" "}
                {metadata.syncState}
              </div>
            </div>
          )}
        </div>

        <div className="cyber-panel bg-dark-200/20 border border-dark-300/30 rounded-sm">
          <button
            onClick={() => toggleSection("diagnostics")}
            className="w-full flex items-center justify-between p-2 text-left"
          >
            <div className="flex items-center space-x-2">
              <Zap className="w-3 h-3 text-dark-700" />
              <span className="font-mono text-xs uppercase tracking-wider text-dark-800">Diagnostics</span>
            </div>
            {expandedSections.diagnostics ? (
              <ChevronDown className="w-3 h-3 text-dark-600" />
            ) : (
              <ChevronRight className="w-3 h-3 text-dark-600" />
            )}
          </button>

          {expandedSections.diagnostics && (
            <div className="p-2 pt-0 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-dark-600">Analytics</span>
                <Badge variant="success" className="text-xs">
                  {privacy?.telemetry?.analytics || "OFF"}
                </Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-dark-600">Body logging</span>
                <Badge variant="success" className="text-xs">
                  {privacy?.telemetry?.bodyLogging || "REFUSED"}
                </Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-dark-600">Local encryption</span>
                <Badge variant={privacy?.encryption?.available ? "success" : "warning"} className="text-xs">
                  {privacy?.encryption?.available ? "AVAILABLE" : "UNAVAILABLE"}
                </Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-dark-600">Key fingerprint</span>
                <Badge variant="outline" className="text-xs font-mono">
                  {privacy?.encryption?.keyFingerprint || "—"}
                </Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-dark-600">Overall mode</span>
                <StatusIndicator status={modeStatus as "online" | "warning" | "offline"} size="sm" />
              </div>
            </div>
          )}
        </div>

        <div className="cyber-panel bg-dark-200/20 border border-dark-300/30 rounded-sm">
          <button
            onClick={() => toggleSection("config")}
            className="w-full flex items-center justify-between p-2 text-left"
          >
            <div className="flex items-center space-x-2">
              <Settings className="w-3 h-3 text-dark-700" />
              <span className="font-mono text-xs uppercase tracking-wider text-dark-800">Config</span>
            </div>
            {expandedSections.config ? (
              <ChevronDown className="w-3 h-3 text-dark-600" />
            ) : (
              <ChevronRight className="w-3 h-3 text-dark-600" />
            )}
          </button>

          {expandedSections.config && (
            <div className="p-2 pt-0 space-y-2 text-[10px] font-mono text-dark-600">
              <div>S3V3N_EGRESS_MODE = {mode}</div>
              <div>S3V3N_HTTP_PROXY = {egress?.httpProxyConfigured ? "set" : "unset"}</div>
              <div>S3V3N_TOR_SOCKS = {egress?.torSocks || "default"}</div>
              <div className="text-dark-500 pt-1">
                Set egress on host (WireGuard / Tor / proxy). App honors mode — no secrets in UI.
              </div>
            </div>
          )}
        </div>

        <div className="cyber-panel bg-dark-200/20 border border-dark-300/30 rounded-sm">
          <button
            onClick={() => toggleSection("threats")}
            className="w-full flex items-center justify-between p-2 text-left"
          >
            <div className="flex items-center space-x-2">
              <Eye className="w-3 h-3 text-dark-700" />
              <span className="font-mono text-xs uppercase tracking-wider text-dark-800">Threat Feed</span>
              <Badge variant="outline" className="text-[9px]">
                MOCK CHROME
              </Badge>
            </div>
            {expandedSections.threats ? (
              <ChevronDown className="w-3 h-3 text-dark-600" />
            ) : (
              <ChevronRight className="w-3 h-3 text-dark-600" />
            )}
          </button>

          {expandedSections.threats && (
            <div className="p-2 pt-0 space-y-2">
              <div className="text-[10px] text-dark-500">
                Feed counts are UI chrome only — not live intel. Use Hive / Twin seats for Operator-owned
                retrieval.
              </div>
            </div>
          )}
        </div>

        <div className="cyber-panel bg-dark-200/20 border border-dark-300/30 rounded-sm">
          <button
            onClick={() => toggleSection("profiles")}
            className="w-full flex items-center justify-between p-2 text-left"
          >
            <div className="flex items-center space-x-2">
              <Globe className="w-3 h-3 text-dark-700" />
              <span className="font-mono text-xs uppercase tracking-wider text-dark-800">Profiles</span>
            </div>
            {expandedSections.profiles ? (
              <ChevronDown className="w-3 h-3 text-dark-600" />
            ) : (
              <ChevronRight className="w-3 h-3 text-dark-600" />
            )}
          </button>

          {expandedSections.profiles && (
            <div className="p-2 pt-0 space-y-2">
              <TechButton variant="outline" size="sm" className="w-full text-xs" disabled>
                Secure Comms (docs)
              </TechButton>
              <TechButton variant="outline" size="sm" className="w-full text-xs" disabled>
                Stealth Mode (docs)
              </TechButton>
              <TechButton variant="outline" size="sm" className="w-full text-xs" disabled>
                Speed Optimized (docs)
              </TechButton>
              <div className="text-[10px] text-dark-500">
                Profiles are labels — live egress is driven by host env, not these buttons.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
