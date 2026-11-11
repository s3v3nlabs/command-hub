"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Window } from "@/components/ui/window"
import { BeakerIcon } from "lucide-react"
import { TechPanel } from "@/components/ui/tech-panel"
import { TypographyHeading2, TypographyMono } from "@/components/ui/typography"
import { TechButton } from "@/components/ui/tech-button"
import {
  getMultiModelResponses,
  getPanelSource,
  getPrivacyMode,
  type PanelSource,
  type PrivacyMode,
} from "@/lib/selfHealing/BuildShipHarness"
import { Input } from "@/components/ui/input"

export default function TestHarnessPage() {
  const [prompt, setPrompt] = useState("")
  const [responses, setResponses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [consensus, setConsensus] = useState<any>(null)
  const [panelSource, setPanelSource] = useState<PanelSource | null>(null)
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode | null>(null)
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null)
  const [adapters, setAdapters] = useState<any[] | null>(null)
  const [egressMode, setEgressMode] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/privacy/status", { cache: "no-store" })
        if (!res.ok) return
        const j = await res.json()
        if (!cancelled && j?.egress?.mode) setEgressMode(String(j.egress.mode))
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const leaderboard = useMemo(() => {
    return [...responses]
      .map((r) => ({
        model: r.model as string,
        seat: (r.metadata?.seat as string) || r.model,
        confidence: Number(r.confidence) || 0,
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .map((r, i) => ({ ...r, rank: i + 1 }))
  }, [responses])

  const aggregate = useMemo(() => {
    if (!responses.length) return null
    const pick =
      (selectedSeat &&
        responses.find((r) => r.metadata?.seat === selectedSeat || r.model === selectedSeat)) ||
      responses.reduce((best, r) => (Number(r.confidence) > Number(best.confidence) ? r : best), responses[0])
    return pick
  }, [responses, selectedSeat])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setLoading(true)
    setSelectedSeat(null)
    setAdapters(null)
    try {
      // Prefer full S3v3n panel payload (leaderboard + adapters) when available
      let modelResponses: any[] | null = null
      try {
        const res = await fetch("/api/s3v3n-panel", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt }),
        })
        if (res.ok) {
          const payload = await res.json()
          if (payload?.ok && Array.isArray(payload.responses) && payload.responses.length > 0) {
            modelResponses = payload.responses
            setAdapters(payload.adapters || null)
            if (payload.privacyMode) setPrivacyMode(payload.privacyMode)
          }
        }
      } catch {
        /* fall through to harness */
      }

      if (!modelResponses) {
        modelResponses = await getMultiModelResponses(prompt)
      }

      setResponses(modelResponses)
      setPanelSource(getPanelSource(modelResponses))
      setPrivacyMode((prev) => prev || getPrivacyMode(modelResponses))

      const consensusResult = calculateConsensus(modelResponses)
      setConsensus(consensusResult)
    } catch (error) {
      // Do not log prompt/response bodies
      console.error("Error getting model responses")
    } finally {
      setLoading(false)
    }
  }

  const calculateConsensus = (responses: any[]) => {
    const actions = responses.map((r) => {
      const actionPart = String(r.response || "").split(":")[0].trim()
      return actionPart.slice(0, 80)
    })

    const actionCounts: Record<string, number> = {}
    actions.forEach((action) => {
      actionCounts[action] = (actionCounts[action] || 0) + 1
    })

    let maxCount = 0
    let consensusAction = ""

    Object.entries(actionCounts).forEach(([action, count]) => {
      if (count > maxCount) {
        maxCount = count
        consensusAction = action
      }
    })

    const agreement = responses.length ? maxCount / responses.length : 0

    return {
      action: consensusAction,
      agreement,
      counts: actionCounts,
    }
  }

  return (
    <div className="hub-shell flex bg-dark-base text-dark-800 dot-bg">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="BUILDSHIP HARNESS TEST" />
        <main className="hub-shell-scroll p-6">
          <Window
            title="AI PANEL SIMULATOR"
            icon={<BeakerIcon size={16} />}
            variant="glass"
            size="full"
            className="mb-6"
          >
            <TechPanel cornerAccent borderAccent>
              <TypographyHeading2 className="mb-4">BuildShip AI Panel Simulator</TypographyHeading2>
              <div className="mb-3 text-xs opacity-70">
                S3v3n private Panel of Experts mirror — fan-out · score · pick seat · aggregate. Local REST:{" "}
                <span className="font-mono">/api/s3v3n-panel</span>
              </div>
              {(panelSource || privacyMode || egressMode) && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {panelSource && (
                    <div className="text-xs inline-flex items-center gap-2 rounded border border-dark-300 bg-dark-200 px-2 py-1">
                      <span className="opacity-70">source</span>
                      <span className="font-mono font-bold">{panelSource}</span>
                    </div>
                  )}
                  {privacyMode && (
                    <div className="text-xs inline-flex items-center gap-2 rounded border border-dark-300 bg-dark-200 px-2 py-1">
                      <span className="opacity-70">privacy</span>
                      <span className="font-mono font-bold">{privacyMode}</span>
                    </div>
                  )}
                  {egressMode && (
                    <div className="text-xs inline-flex items-center gap-2 rounded border border-dark-300 bg-dark-200 px-2 py-1">
                      <span className="opacity-70">egress</span>
                      <span className="font-mono font-bold">{egressMode}</span>
                    </div>
                  )}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prompt</label>
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter a prompt for the AI panel..."
                    className="w-full bg-dark-200 border-dark-300"
                  />
                </div>
                <TechButton
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="bg-dark-800 hover:bg-dark-700"
                  cornerAccent
                >
                  {loading ? "Processing..." : "Get AI Panel Responses"}
                </TechButton>
              </form>

              {responses.length > 0 && (
                <div className="space-y-4 mt-6">
                  <TypographyHeading2>AI Panel Responses</TypographyHeading2>

                  {/* Leaderboard */}
                  <TechPanel className="bg-dark-200 border-dark-300" cornerAccent>
                    <div className="font-bold mb-2">Leaderboard</div>
                    <ol className="text-sm space-y-1">
                      {leaderboard.map((row) => (
                        <li key={`${row.rank}-${row.model}`} className="flex justify-between gap-2">
                          <span>
                            #{row.rank}{" "}
                            <TypographyMono className="inline font-bold">{row.model}</TypographyMono>
                            <span className="opacity-60 text-xs ml-2">{row.seat}</span>
                          </span>
                          <span>{row.confidence.toFixed(2)}</span>
                        </li>
                      ))}
                    </ol>
                  </TechPanel>

                  {/* Adapter status (ADD-ONLY) */}
                  {adapters && adapters.length > 0 && (
                    <TechPanel className="bg-dark-200 border-dark-300" cornerAccent>
                      <div className="font-bold mb-2">Adapter status</div>
                      <ul className="text-xs space-y-1 font-mono">
                        {adapters.map((a) => (
                          <li key={a.seat}>
                            {a.seat}: {a.status}
                            {a.detail ? ` — ${a.detail}` : ""}
                          </li>
                        ))}
                      </ul>
                    </TechPanel>
                  )}

                  {/* Aggregate / pick seat */}
                  {aggregate && (
                    <TechPanel className="bg-dark-200 border-dark-300" cornerAccent>
                      <div className="font-bold mb-2">Aggregated output</div>
                      <div className="text-sm mb-2">
                        Seat:{" "}
                        <TypographyMono className="inline font-bold">
                          {aggregate.metadata?.seat || aggregate.model}
                        </TypographyMono>{" "}
                        · confidence {aggregate.confidence}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{aggregate.response}</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {responses.map((r, i) => {
                          const seat = r.metadata?.seat || r.model
                          const active = selectedSeat === seat || (!selectedSeat && aggregate === r)
                          return (
                            <TechButton
                              key={i}
                              type="button"
                              className={
                                active
                                  ? "bg-dark-700 hover:bg-dark-600 text-xs"
                                  : "bg-dark-800 hover:bg-dark-700 text-xs"
                              }
                              cornerAccent
                              onClick={() => setSelectedSeat(seat)}
                            >
                              Follow-up: {seat}
                            </TechButton>
                          )
                        })}
                      </div>
                    </TechPanel>
                  )}

                  {/* Consensus display */}
                  {consensus && (
                    <TechPanel className="bg-dark-200 border-dark-300" cornerAccent>
                      <div className="font-bold">Consensus: {consensus.action}</div>
                      <div>Agreement: {(consensus.agreement * 100).toFixed(0)}%</div>
                      <div className="text-sm mt-2">
                        Vote breakdown:
                        <ul className="mt-1">
                          {Object.entries(consensus.counts).map(([action, count]) => (
                            <li key={action}>
                              {action}: {String(count)} vote{(count as number) !== 1 ? "s" : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </TechPanel>
                  )}

                  {/* Individual responses — side-by-side compare */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {responses.map((response, index) => (
                      <TechPanel key={index} className="bg-dark-200 border-dark-300" cornerAccent>
                        <div className="flex justify-between items-center mb-2 gap-2">
                          <TypographyMono className="font-bold">{response.model}</TypographyMono>
                          <div className="text-sm whitespace-nowrap">
                            Confidence: {response.confidence}
                          </div>
                        </div>
                        <div className="text-sm whitespace-pre-wrap max-h-64 overflow-auto">
                          {response.response}
                        </div>
                        <div className="text-xs text-dark-600 mt-2">
                          {response.metadata?.seat ? (
                            <>seat: {response.metadata.seat} · </>
                          ) : null}
                          {response.metadata?.privacy ? (
                            <>privacy: {response.metadata.privacy} · </>
                          ) : null}
                          {response.metadata?.responseTime != null ? (
                            <>
                              Response time: {response.metadata.responseTime}ms
                              {response.metadata.promptTokens != null ? (
                                <>
                                  {" "}
                                  | Tokens: {response.metadata.promptTokens} in /{" "}
                                  {response.metadata.completionTokens} out
                                </>
                              ) : null}
                            </>
                          ) : (
                            <>source: {response.metadata?.source || panelSource}</>
                          )}
                        </div>
                        <div className="mt-2">
                          <TechButton
                            type="button"
                            className="bg-dark-800 hover:bg-dark-700 text-xs"
                            cornerAccent
                            onClick={() => setSelectedSeat(response.metadata?.seat || response.model)}
                          >
                            Pick for follow-up
                          </TechButton>
                        </div>
                      </TechPanel>
                    ))}
                  </div>
                </div>
              )}
            </TechPanel>
          </Window>
        </main>
      </div>
    </div>
  )
}
