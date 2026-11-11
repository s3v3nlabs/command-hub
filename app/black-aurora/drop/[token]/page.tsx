"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { TerminalText } from "@/components/black-aurora/terminal-text"
import { GlitchText } from "@/components/black-aurora/glitch-text"
import { StatusBadge } from "@/components/black-aurora/status-badge"
import { ClassificationHeader } from "@/components/black-aurora/classification-header"
import { TimestampFooter } from "@/components/black-aurora/timestamp-footer"
import { ScanlineOverlay } from "@/components/black-aurora/scanline-overlay"

type TokenStatus = "verifying" | "valid" | "invalid" | "destroyed"

export default function BlackAuroraDropPage() {
  const params = useParams()
  const router = useRouter()
  const token = String(params.token || "")

  const [status, setStatus] = useState<TokenStatus>("verifying")
  const [showContent, setShowContent] = useState(false)
  const [label, setLabel] = useState<string>("")
  const [selfDestructCountdown, setSelfDestructCountdown] = useState<number | null>(null)
  const [isDestroyed, setIsDestroyed] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/black-aurora/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
          cache: "no-store",
          body: JSON.stringify({ code: token, redeem: false }),
        })
        const data = await res.json()
        if (cancelled) return
        if (data.ok) {
          setStatus("valid")
          setLabel(data.invite?.label || "")
          setTimeout(() => setShowContent(true), 400)
        } else {
          setStatus("invalid")
        }
      } catch {
        if (!cancelled) setStatus("invalid")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  const handleAccess = async () => {
    // Redeem now — consume a use + get grant, then go to access page with grant in sessionStorage briefly
    setStatus("verifying")
    try {
      const res = await fetch("/api/black-aurora/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        cache: "no-store",
        body: JSON.stringify({ code: token, redeem: true }),
      })
      const data = await res.json()
      if (!data.ok) {
        setStatus("invalid")
        return
      }
      try {
        sessionStorage.setItem(
          `ba_grant_${token}`,
          JSON.stringify({
            grant: data.downloadGrant,
            instructions: data.instructions,
            label: data.label,
            mode: data.mode,
            honesty: data.honesty,
            screenshotHonesty: data.screenshotHonesty,
            at: Date.now(),
          }),
        )
      } catch {
        /* sessionStorage may be blocked — access page will re-prompt */
      }
      router.push(`/black-aurora/access/${token}`)
    } catch {
      setStatus("invalid")
    }
  }

  const handleSelfDestruct = () => setSelfDestructCountdown(5)

  useEffect(() => {
    if (selfDestructCountdown === null) return
    if (selfDestructCountdown > 0) {
      const t = setTimeout(() => setSelfDestructCountdown(selfDestructCountdown - 1), 1000)
      return () => clearTimeout(t)
    }
    setIsDestroyed(true)
    setStatus("destroyed")
  }, [selfDestructCountdown])

  if (isDestroyed) {
    return (
      <main className="min-h-screen bg-black flex flex-col ba-no-print">
        <ScanlineOverlay intensity="light" />
        <ClassificationHeader level="classified" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-6">
            <StatusBadge status="destroyed" />
            <div className="space-y-2">
              <p className="font-mono text-white/50 tracking-widest text-sm">TOKEN INVALIDATED</p>
              <p className="font-mono text-white/30 text-xs">
                This access link has been permanently destroyed (client-side)
              </p>
            </div>
          </div>
        </div>
        <TimestampFooter />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black flex flex-col ba-no-print">
      <ScanlineOverlay intensity="light" />
      <ClassificationHeader level="classified" />

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="mb-12 text-center">
          <GlitchText
            text="BLACK AURORA LABS"
            className="text-2xl md:text-3xl tracking-[0.3em] text-white mb-2"
            intensity="low"
          />
          <div className="h-px w-48 mx-auto bg-white/20 my-4" />
          <p className="font-mono text-xs tracking-[0.2em] text-white/50">SECURE CLIENT PORTAL</p>
        </div>

        <div className="border border-white/30 p-8 mb-8 min-w-[320px] rounded-none">
          <div className="text-center space-y-4">
            <p className="font-mono text-xs tracking-widest text-white/50 mb-4">ACCESS TOKEN</p>
            <div className="font-mono text-lg tracking-[0.4em] text-white">
              GhostNode::<span>{token.toUpperCase()}</span>
            </div>
            {label ? (
              <p className="font-mono text-xs text-white/40 tracking-wider">FOR: {label}</p>
            ) : null}
            <div className="h-px w-full bg-white/10 my-4" />
            <div className="flex items-center justify-center gap-3">
              {status === "verifying" && (
                <>
                  <span className="w-2 h-2 bg-white/50 animate-pulse" />
                  <TerminalText
                    text="VERIFYING ACCESS CREDENTIALS..."
                    className="text-xs tracking-wider text-white/70"
                    speed={30}
                  />
                </>
              )}
              {status === "valid" && <StatusBadge status="verified" />}
              {status === "invalid" && <StatusBadge status="expired" />}
            </div>
          </div>
        </div>

        {showContent && status === "valid" && (
          <div className="space-y-4 text-center">
            <p className="font-mono text-xs text-white/50 tracking-wider mb-6">
              ACCESS GRANTED // SINGLE-VIEW PROTOCOL ACTIVE
            </p>
            <button
              onClick={handleAccess}
              className="border border-white px-8 py-3 font-mono text-sm tracking-widest text-white hover:bg-white hover:text-black transition-colors duration-200 rounded-none"
            >
              UNLOCK INSTALL PACKAGE
            </button>
            <div className="pt-6">
              <button
                onClick={handleSelfDestruct}
                disabled={selfDestructCountdown !== null}
                className="font-mono text-xs tracking-wider text-white/30 hover:text-white/60 transition-colors disabled:cursor-not-allowed"
              >
                {selfDestructCountdown !== null
                  ? `DESTROYING IN ${selfDestructCountdown}...`
                  : "[SELF-DESTRUCT TOKEN]"}
              </button>
            </div>
          </div>
        )}

        {status === "invalid" && (
          <div className="text-center space-y-4">
            <p className="font-mono text-xs text-white/50 tracking-wider">
              INVALID, EXPIRED, REVOKED, OR ALREADY USED
            </p>
            <button
              onClick={() => router.push("/black-aurora/verify")}
              className="font-mono text-xs tracking-wider text-white/50 hover:text-white transition-colors underline underline-offset-4"
            >
              ENTER TOKEN MANUALLY
            </button>
          </div>
        )}
      </div>

      <TimestampFooter />
    </main>
  )
}
