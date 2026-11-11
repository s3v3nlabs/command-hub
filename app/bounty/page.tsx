"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechCard, TechCardHeader, TechCardTitle, TechCardContent } from "@/components/ui/tech-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bug, RefreshCw, ArrowRight } from "lucide-react"

type Sub = {
  id: string
  title: string
  summary: string
  severity?: string
  status: "draft" | "review" | "submitted"
  updatedAt: string
  summaryHash?: string
}

export default function BountyPage() {
  const [subs, setSubs] = useState<Sub[]>([])
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [severity, setSeverity] = useState("medium")
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    const data = await fetch("/api/bounty").then((r) => r.json())
    if (data?.ok) setSubs(data.submissions || [])
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const submit = async () => {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch("/api/bounty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, summary, severity, fromHub: "local" }),
      })
      const data = await res.json()
      if (!data?.ok) setErr(data?.error || "failed")
      else {
        setTitle("")
        setSummary("")
        await refresh()
      }
    } catch {
      setErr("network error")
    } finally {
      setBusy(false)
    }
  }

  const advance = async (id: string, status: string) => {
    await fetch("/api/bounty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", id, status }),
    })
    await refresh()
  }

  return (
    <div className="hub-shell flex bg-black">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="BOUNTY / DISCLOSURE" subtitle="Legal business channel · licensed disclosure stub" />
        <div className="flex-1 space-y-6 overflow-auto p-4 md:p-6">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="h-7 border-gray-600 bg-transparent font-mono text-[10px]" onClick={() => void refresh()}>
              <RefreshCw className="mr-1 h-3 w-3" /> Refresh
            </Button>
            <Link href="/modules">
              <Button size="sm" variant="outline" className="h-7 border-gray-600 bg-transparent font-mono text-[10px]">Module Bay</Button>
            </Link>
            <Link href="/docs/BOUNTY_DISCLOSURE.md">
              <Button size="sm" variant="outline" className="h-7 border-amber-800 bg-transparent font-mono text-[10px] text-amber-300">Policy doc</Button>
            </Link>
            <Badge variant="outline" className="border-amber-500/40 text-amber-300">lattice_sync: false</Badge>
          </div>

          <TechPanel title="SUBMIT WORTHY INTEL" subtitle="DRAFT → REVIEW → SUBMITTED · NO EXPLOIT BINARIES" cornerAccent borderAccent>
            <div className="space-y-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full rounded border border-gray-700 bg-black px-2 py-1.5 font-mono text-[12px] text-white"
              />
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="rounded border border-gray-700 bg-black px-2 py-1 font-mono text-[11px] text-gray-300"
              >
                {["info", "low", "medium", "high", "critical"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Defensive summary / disclosure narrative (no weaponized payloads)…"
                className="h-32 w-full rounded border border-gray-700 bg-black p-2 font-mono text-[12px] text-gray-200"
              />
              {err && <div className="font-mono text-[11px] text-red-400">{err}</div>}
              <Button size="sm" disabled={busy || !title.trim() || !summary.trim()} onClick={() => void submit()} className="font-mono text-[11px]">
                <Bug className="mr-1 h-3.5 w-3.5" /> Create draft
              </Button>
            </div>
          </TechPanel>

          <TechPanel title="PIPELINE" subtitle="CROWDSOURCE / BOUNTY / LICENSED DISCLOSURE" cornerAccent borderAccent>
            <div className="grid gap-3">
              {subs.length === 0 && <div className="font-mono text-[11px] text-gray-500">No submissions yet.</div>}
              {subs.map((s) => (
                <TechCard key={s.id} variant="default" cornerAccent>
                  <TechCardHeader>
                    <TechCardTitle className="flex items-center gap-2 text-xs">
                      {s.title}
                      <Badge variant="outline" className="border-gray-600 font-mono text-[9px]">{s.status}</Badge>
                      {s.severity && <Badge variant="outline" className="border-amber-700/50 font-mono text-[9px] text-amber-300">{s.severity}</Badge>}
                    </TechCardTitle>
                  </TechCardHeader>
                  <TechCardContent>
                    <p className="mb-2 whitespace-pre-wrap text-[11px] text-gray-400">{s.summary.slice(0, 400)}</p>
                    <div className="flex flex-wrap gap-2">
                      {s.status === "draft" && (
                        <Button size="sm" variant="outline" className="h-7 font-mono text-[10px]" onClick={() => void advance(s.id, "review")}>
                          → review <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                      {s.status === "review" && (
                        <Button size="sm" variant="outline" className="h-7 font-mono text-[10px]" onClick={() => void advance(s.id, "submitted")}>
                          → submitted <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                      <span className="font-mono text-[9px] text-gray-600">{s.updatedAt}</span>
                    </div>
                  </TechCardContent>
                </TechCard>
              ))}
            </div>
          </TechPanel>
        </div>
      </div>
    </div>
  )
}
