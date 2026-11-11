"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechCard, TechCardHeader, TechCardTitle, TechCardContent } from "@/components/ui/tech-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Package,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Shield,
  Bug,
  Terminal,
  Radio,
} from "lucide-react"
import {
  bindCommandHubDev,
  buildSandboxSrcdoc,
  parseManifestJson,
  helpText,
} from "@/lib/modules/dev-console"

type Manifest = {
  id: string
  name: string
  version: string
  description: string
  route?: string
  permissions?: string[]
  enabled?: boolean
  source?: string
  nav?: { label: string; group?: string }
  lattice_sync?: false
}

type HiveStatus = {
  ok?: boolean
  peerCount?: number
  peers?: string[]
  lastSync?: string | null
  eventCount?: number
  lattice_sync?: false
  hold?: string
  secretConfigured?: boolean
}

export default function ModuleBayPage() {
  const [modules, setModules] = useState<Manifest[]>([])
  const [hive, setHive] = useState<HiveStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewJson, setPreviewJson] = useState("")
  const [srcdoc, setSrcdoc] = useState<string | null>(null)
  const [previewErr, setPreviewErr] = useState<string | null>(null)
  const [consoleOut, setConsoleOut] = useState(helpText())

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [m, h] = await Promise.all([
        fetch("/api/modules").then((r) => r.json()),
        fetch("/api/hive").then((r) => r.json()),
      ])
      if (m?.ok) setModules(m.modules || [])
      else setError(m?.error || "modules load failed")
      setHive(h)
    } catch {
      setError("network error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    bindCommandHubDev()
    void refresh()
  }, [refresh])

  const runPreview = () => {
    setPreviewErr(null)
    const parsed = parseManifestJson(previewJson)
    if (!parsed.ok) {
      setPreviewErr(parsed.error)
      setSrcdoc(null)
      return
    }
    setSrcdoc(buildSandboxSrcdoc(parsed.manifest))
  }

  const runCmd = async (cmd: "status" | "modules" | "help") => {
    if (cmd === "help") {
      setConsoleOut(helpText())
      return
    }
    if (typeof window !== "undefined" && window.CommandHubDev) {
      const res = cmd === "status" ? await window.CommandHubDev.status() : await window.CommandHubDev.modules()
      setConsoleOut(JSON.stringify(res, null, 2))
    }
  }

  return (
    <div className="hub-shell flex bg-black">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="MODULE BAY" subtitle="Developer registry · ADD-ONLY · HOLD_VYRNA_UNSYNC" />
        <div className="flex-1 space-y-6 overflow-auto p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 border-gray-600 bg-transparent font-mono text-[10px]" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw className={`mr-1 h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href="/dev-operator">
              <Button size="sm" variant="outline" className="h-7 border-cyan-800 bg-transparent font-mono text-[10px] text-cyan-300">
                <Terminal className="mr-1 h-3 w-3" />
                Dev Operator AI
              </Button>
            </Link>
            <Link href="/bounty">
              <Button size="sm" variant="outline" className="h-7 border-amber-800 bg-transparent font-mono text-[10px] text-amber-300">
                <Bug className="mr-1 h-3 w-3" />
                Bounty / Disclosure
              </Button>
            </Link>
            <Link href="/docs/MODULE_DEVELOPER.md" target="_blank">
              <Button size="sm" variant="outline" className="h-7 border-gray-600 bg-transparent font-mono text-[10px]">
                <BookOpen className="mr-1 h-3 w-3" />
                Dev guide
              </Button>
            </Link>
            <Badge variant="outline" className="border-amber-500/40 font-mono text-[10px] text-amber-300">
              lattice_sync: false
            </Badge>
          </div>

          {error && <div className="font-mono text-xs text-red-400">{error}</div>}

          {/* Hive chip */}
          <TechPanel title="HIVE STATUS" subtitle="TEAM HUB BUS · NOT VYRNA" cornerAccent borderAccent>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-gray-300">
              <Radio className="h-4 w-4 text-cyan-400" />
              <span>peers: {hive?.peerCount ?? 0}</span>
              <Badge variant="outline" className="border-gray-600 text-gray-400">
                peers: {hive?.peerCount ? "configured" : "EMPTY (0)"}
              </Badge>
              <span>events: {hive?.eventCount ?? 0}</span>
              <span>last sync: {hive?.lastSync ? hive.lastSync.slice(0, 19) : "—"}</span>
              <Badge variant="outline" className="border-amber-500/40 text-amber-300">
                lattice_sync: false
              </Badge>
              <Badge variant="outline" className={hive?.secretConfigured ? "border-emerald-500/40 text-emerald-300" : "border-gray-600 text-gray-400"}>
                secret: {hive?.secretConfigured ? "configured" : "unset (local open)"}
              </Badge>
              <Link href="/docs/HIVE_BUS.md" className="text-cyan-400 underline">
                HIVE_BUS.md
              </Link>
            </div>
          </TechPanel>

          <TechPanel title="REGISTERED MODULES" subtitle="BUILT-IN + DISK + DEV REGISTERED" cornerAccent borderAccent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((m) => (
                <TechCard key={m.id} variant="default" cornerAccent glowEffect className="h-full">
                  <TechCardHeader>
                    <TechCardTitle className="flex items-center gap-2 text-xs">
                      <Package className="h-3.5 w-3.5 text-gray-300" />
                      {m.name}
                      <Badge variant="outline" className="ml-auto border-gray-600 font-mono text-[9px]">
                        {m.source || "?"}
                      </Badge>
                    </TechCardTitle>
                  </TechCardHeader>
                  <TechCardContent>
                    <p className="mb-2 text-[11px] text-gray-400">{m.description}</p>
                    <div className="mb-2 font-mono text-[10px] text-gray-500">
                      v{m.version} · {m.permissions?.join(", ")}
                    </div>
                    {m.route ? (
                      <Link href={m.route}>
                        <Button size="sm" variant="outline" className="h-7 border-gray-600 bg-transparent font-mono text-[10px]">
                          Open {m.route}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    ) : (
                      <span className="font-mono text-[10px] text-gray-600">no route</span>
                    )}
                  </TechCardContent>
                </TechCard>
              ))}
            </div>
          </TechPanel>

          <TechPanel title="HOW TO ADD A MODULE" subtitle="MANIFEST + REVIEW → VENDOR" cornerAccent borderAccent>
            <ol className="list-decimal space-y-1 pl-5 font-mono text-[11px] text-gray-300">
              <li>Create <code className="text-cyan-300">modules/&lt;id&gt;/module.json</code> matching ModuleManifest schema.</li>
              <li>Point <code>route</code> at an existing page or a new ADD-ONLY page — do not strip Ghostlight chrome.</li>
              <li>Dev: POST <code>/api/modules</code> with the JSON, or drop the file and refresh Module Bay.</li>
              <li>Forbidden: exploit / malware modules; no parent-window eval of untrusted code.</li>
              <li>See <Link href="/docs/MODULE_DEVELOPER.md" className="text-cyan-400 underline">docs/MODULE_DEVELOPER.md</Link>.</li>
            </ol>
          </TechPanel>

          <TechPanel title="DEV CONSOLE · SANDBOX PREVIEW" subtitle="IFRAME SRCDOC ONLY · NO PARENT EVAL" cornerAccent borderAccent>
            <div className="mb-2 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="h-7 border-gray-600 bg-transparent font-mono text-[10px]" onClick={() => void runCmd("help")}>help</Button>
              <Button size="sm" variant="outline" className="h-7 border-gray-600 bg-transparent font-mono text-[10px]" onClick={() => void runCmd("status")}>status</Button>
              <Button size="sm" variant="outline" className="h-7 border-gray-600 bg-transparent font-mono text-[10px]" onClick={() => void runCmd("modules")}>modules</Button>
              <span className="font-mono text-[10px] text-gray-500">Also: window.CommandHubDev in DevTools</span>
            </div>
            <pre className="mb-3 max-h-40 overflow-auto rounded border border-gray-800 bg-black/60 p-2 font-mono text-[10px] text-emerald-300/90">{consoleOut}</pre>
            <textarea
              value={previewJson}
              onChange={(e) => setPreviewJson(e.target.value)}
              placeholder='{"id":"demo","name":"Demo","version":"0.1.0","description":"…","permissions":["ui","dev"],"route":"/modules"}'
              className="mb-2 h-28 w-full rounded border border-gray-700 bg-black p-2 font-mono text-[11px] text-gray-200"
            />
            <div className="mb-2 flex gap-2">
              <Button size="sm" variant="outline" className="h-7 border-cyan-800 bg-transparent font-mono text-[10px] text-cyan-300" onClick={runPreview}>
                <Shield className="mr-1 h-3 w-3" />
                Sandbox preview
              </Button>
              {previewErr && <span className="font-mono text-[10px] text-red-400">{previewErr}</span>}
            </div>
            {srcdoc && (
              <iframe
                title="module-sandbox-preview"
                sandbox=""
                srcDoc={srcdoc}
                className="h-56 w-full rounded border border-amber-800/50 bg-black"
              />
            )}
            <p className="mt-2 font-mono text-[9px] text-amber-400/80">DEV ONLY · sandbox without allow-same-origin · no arbitrary eval</p>
          </TechPanel>
        </div>
      </div>
    </div>
  )
}
