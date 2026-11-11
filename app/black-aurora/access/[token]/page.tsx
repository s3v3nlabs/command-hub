"use client"

/**
 * Access payload — instructions + gated bundle download.
 * SecureFrame destroy-on-blur is a UX deterrent only (see SCREENSHOT_HONESTY).
 */

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { SecureFrame } from "@/components/black-aurora/secure-frame"
import { StatusBadge } from "@/components/black-aurora/status-badge"
import { ClassificationHeader } from "@/components/black-aurora/classification-header"
import { TimestampFooter } from "@/components/black-aurora/timestamp-footer"
import { ScanlineOverlay } from "@/components/black-aurora/scanline-overlay"
import { TerminalText } from "@/components/black-aurora/terminal-text"
import { GlitchText } from "@/components/black-aurora/glitch-text"
import { RedactedText } from "@/components/black-aurora/redacted-text"

const AUTO_DESTROY_SECONDS = 180

type GrantPayload = {
  grant: string
  instructions: string
  label: string
  mode: string
  honesty: string
  screenshotHonesty?: string
  at: number
}

export default function BlackAuroraAccessPage() {
  const params = useParams()
  const router = useRouter()
  const token = String(params.token || "")

  const [payload, setPayload] = useState<GrantPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDestroyed, setIsDestroyed] = useState(false)
  const [countdown, setCountdown] = useState(AUTO_DESTROY_SECONDS)
  const [showReport, setShowReport] = useState(false)
  const [dlStatus, setDlStatus] = useState<string>("")
  const [dlError, setDlError] = useState<string>("")

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`ba_grant_${token}`)
      if (raw) {
        const parsed = JSON.parse(raw) as GrantPayload
        // Grant session max 30 min
        if (Date.now() - (parsed.at || 0) < 30 * 60_000) {
          setPayload(parsed)
        }
      }
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => {
      setIsLoading(false)
      setTimeout(() => setShowReport(true), 300)
    }, 1200)
    return () => clearTimeout(t)
  }, [token])

  useEffect(() => {
    if (isLoading || isDestroyed || !payload) return
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsDestroyed(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isLoading, isDestroyed, payload])

  const handleDestroy = useCallback(() => {
    setIsDestroyed(true)
    try {
      sessionStorage.removeItem(`ba_grant_${token}`)
    } catch {
      /* ignore */
    }
  }, [token])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const download = async (format: "bundle" | "tar") => {
    if (!payload?.grant) {
      setDlError("No download grant — re-verify your token")
      return
    }
    setDlStatus(`preparing ${format}...`)
    setDlError("")
    try {
      const res = await fetch(
        `/api/black-aurora/download?grant=${encodeURIComponent(payload.grant)}&format=${format}`,
        { cache: "no-store" },
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setDlError(String(err.detail || err.error || `download failed (${res.status})`))
        setDlStatus("")
        // Grant is single-use; clear local copy on failure after consume
        if (res.status === 403) {
          try {
            sessionStorage.removeItem(`ba_grant_${token}`)
          } catch {
            /* ignore */
          }
          setPayload((p) => (p ? { ...p, grant: "" } : p))
        }
        return
      }
      const blob = await res.blob()
      const cd = res.headers.get("Content-Disposition") || ""
      const match = /filename="([^"]+)"/.exec(cd)
      const filename = match?.[1] || `command-hub.${format === "tar" ? "tar.gz" : "bundle"}`
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setDlStatus(`downloaded ${filename}`)
      try {
        sessionStorage.removeItem(`ba_grant_${token}`)
      } catch {
        /* ignore */
      }
      setPayload((p) => (p ? { ...p, grant: "" } : p))
    } catch (e) {
      setDlError(String(e))
      setDlStatus("")
    }
  }

  if (isDestroyed) {
    return (
      <main className="min-h-screen bg-black flex flex-col ba-no-print">
        <ScanlineOverlay intensity="medium" />
        <ClassificationHeader level="classified" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-6">
            <GlitchText
              text="[CONTENT DESTROYED]"
              className="text-lg tracking-widest text-white/50"
              intensity="high"
              active
            />
            <p className="font-mono text-xs text-white/30 tracking-wider">
              TOKEN: {token.toUpperCase()}
            </p>
            <StatusBadge status="destroyed" />
          </div>
        </div>
        <TimestampFooter showLive={false} />
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black flex flex-col ba-no-print">
        <ScanlineOverlay intensity="light" />
        <div className="flex-1 flex items-center justify-center p-8">
          <TerminalText
            text="DECRYPTING SECURE PAYLOAD..."
            className="text-sm tracking-wider text-white/70"
            speed={40}
          />
        </div>
      </main>
    )
  }

  if (!payload) {
    return (
      <main className="min-h-screen bg-black flex flex-col ba-no-print">
        <ScanlineOverlay intensity="light" />
        <ClassificationHeader level="classified" />
        <div className="flex-1 flex items-center justify-center p-8 text-center space-y-4">
          <p className="font-mono text-xs text-white/50 tracking-wider">
            NO ACTIVE GRANT // RE-VERIFY YOUR TOKEN
          </p>
          <button
            onClick={() => router.push(`/black-aurora/drop/${token}`)}
            className="font-mono text-xs tracking-wider text-white/50 hover:text-white underline underline-offset-4"
          >
            RETURN TO DROP
          </button>
        </div>
        <TimestampFooter />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black flex flex-col ba-no-print">
      <ScanlineOverlay intensity="light" />
      <ClassificationHeader level="top-secret" />

      <div className="border-b border-white/20 py-2 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <StatusBadge status="active" pulse />
          <span className="font-mono text-xs tracking-wider text-white/50">
            GhostNode::{token.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs tracking-wider text-white/50">AUTO-DESTRUCT:</span>
          <span
            className={`font-mono text-sm tracking-widest ${
              countdown <= 30 ? "text-white animate-pulse" : "text-white/70"
            }`}
          >
            {formatTime(countdown)}
          </span>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-10">
        <SecureFrame onDestroy={handleDestroy} autoDestroyOnBlur={true}>
          <div
            className={`max-w-4xl mx-auto space-y-8 transition-opacity duration-500 ${
              showReport ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="border border-white/30 p-6 rounded-none">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="font-mono text-xs text-white/50 tracking-widest mb-2">
                    BLACK AURORA LABS // INVITE PACKAGE
                  </p>
                  <h1 className="font-mono text-xl tracking-wider text-white">
                    SINGULAR/TY COMMAND HUB
                  </h1>
                </div>
                <StatusBadge status="classified" />
              </div>
              <div className="h-px w-full bg-white/20 my-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-white/40 tracking-wider mb-1">RECIPIENT</p>
                  <p className="text-white/70">{payload.label || <RedactedText text="CLASSIFIED" />}</p>
                </div>
                <div>
                  <p className="text-white/40 tracking-wider mb-1">MODE</p>
                  <p className="text-white/70">{payload.mode}</p>
                </div>
                <div>
                  <p className="text-white/40 tracking-wider mb-1">CLEARANCE</p>
                  <p className="text-white/70">INVITE</p>
                </div>
                <div>
                  <p className="text-white/40 tracking-wider mb-1">TOKEN</p>
                  <p className="text-white/70">{token.toUpperCase()}</p>
                </div>
              </div>
            </div>

            <div className="border border-white/30 p-6 space-y-4 rounded-none">
              <h2 className="font-mono text-sm tracking-widest text-white/70">INSTRUCTIONS</h2>
              <pre className="font-mono text-sm leading-relaxed text-white/60 whitespace-pre-wrap">
                {payload.instructions}
              </pre>
            </div>

            <div className="border border-white/30 p-6 space-y-4 rounded-none">
              <h2 className="font-mono text-sm tracking-widest text-white/70">GATED DOWNLOAD</h2>
              {payload.mode === "github-private" ? (
                <p className="font-mono text-sm text-white/60">
                  Mode is github-private — no bundle is served. Accept the private-repo collaborator
                  invite / PAT the operator sent out-of-band, then{" "}
                  <code className="text-white">git clone</code> normally.
                </p>
              ) : (
                <>
                  <p className="font-mono text-xs text-white/40">
                    One-time download grant. After download, re-verify is required for another copy
                    (if maxUses allows).
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => download("bundle")}
                      disabled={!payload.grant}
                      className="border border-white px-6 py-2 font-mono text-xs tracking-widest text-white hover:bg-white hover:text-black disabled:opacity-30 rounded-none"
                    >
                      DOWNLOAD GIT BUNDLE
                    </button>
                    <button
                      onClick={() => download("tar")}
                      disabled={!payload.grant}
                      className="border border-white/50 px-6 py-2 font-mono text-xs tracking-widest text-white/80 hover:bg-white hover:text-black disabled:opacity-30 rounded-none"
                    >
                      DOWNLOAD TARBALL
                    </button>
                  </div>
                  {dlStatus ? (
                    <p className="font-mono text-xs text-white/50">{dlStatus}</p>
                  ) : null}
                  {dlError ? (
                    <p className="font-mono text-xs text-white/70">{dlError}</p>
                  ) : null}
                  <div className="pt-2 font-mono text-xs text-white/40 space-y-1">
                    <p>{">"} git clone command-hub-*.bundle command-hub</p>
                    <p>{">"} # or: tar -xzf command-hub-*.tar.gz && cd command-hub</p>
                    <p>{">"} cp .env.example .env.local && npm install && npm run build</p>
                  </div>
                </>
              )}
            </div>

            <div className="border border-white/20 p-4 text-center space-y-2 rounded-none">
              <p className="font-mono text-xs tracking-wider text-white/30">{payload.honesty}</p>
              {payload.screenshotHonesty ? (
                <p className="font-mono text-xs tracking-wider text-white/20">
                  {payload.screenshotHonesty}
                </p>
              ) : null}
              <p className="font-mono text-xs tracking-wider text-white/20 mt-1">
                TAB-SWITCH OR WINDOW BLUR WILL TERMINATE THIS VIEW (UX DETERRENT)
              </p>
            </div>
          </div>
        </SecureFrame>
      </div>

      <TimestampFooter />
    </main>
  )
}
