"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TokenInput } from "@/components/black-aurora/token-input"
import { TerminalText } from "@/components/black-aurora/terminal-text"
import { ScanlineOverlay } from "@/components/black-aurora/scanline-overlay"
import { TimestampFooter } from "@/components/black-aurora/timestamp-footer"

type VerifyStatus = "idle" | "verifying" | "error"

export default function BlackAuroraVerifyPage() {
  const router = useRouter()
  const [status, setStatus] = useState<VerifyStatus>("idle")
  const [showBranding, setShowBranding] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleTokenComplete = async (token: string) => {
    setStatus("verifying")
    setShowBranding(true)
    try {
      const res = await fetch("/api/black-aurora/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        cache: "no-store",
        body: JSON.stringify({ code: token, redeem: false }),
      })
      const data = await res.json()
      if (data.ok) {
        router.push(`/black-aurora/drop/${token}`)
      } else {
        setStatus("error")
        setErrorMessage("ACCESS DENIED // TOKEN NOT RECOGNIZED")
        setTimeout(() => {
          setStatus("idle")
          setErrorMessage("")
        }, 3000)
      }
    } catch {
      setStatus("error")
      setErrorMessage("ACCESS DENIED // CHANNEL ERROR")
      setTimeout(() => {
        setStatus("idle")
        setErrorMessage("")
      }, 3000)
    }
  }

  return (
    <main className="min-h-screen bg-black flex flex-col ba-no-print">
      <ScanlineOverlay intensity="light" />

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div
          className={`mb-16 text-center transition-opacity duration-500 ${
            showBranding ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="font-mono text-xs tracking-[0.3em] text-white/30">BLACK AURORA LABS</p>
        </div>

        <div className="text-center space-y-8">
          <div className="space-y-2">
            <p className="font-mono text-xs tracking-[0.2em] text-white/50">ENTER ACCESS TOKEN</p>
            <div className="h-px w-32 mx-auto bg-white/20" />
          </div>

          <div className="flex justify-center">
            <TokenInput length={8} onComplete={handleTokenComplete} disabled={status === "verifying"} />
          </div>

          <div className="h-8 flex items-center justify-center">
            {status === "verifying" && (
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-white/50 animate-pulse" />
                <TerminalText
                  text="AUTHENTICATING..."
                  className="text-xs tracking-wider text-white/50"
                  speed={40}
                  showCursor={false}
                />
              </div>
            )}
            {status === "error" && (
              <p className="font-mono text-xs tracking-wider text-white/50 animate-pulse">
                {errorMessage}
              </p>
            )}
            {status === "idle" && (
              <p className="font-mono text-xs tracking-wider text-white/20">AWAITING INPUT_</p>
            )}
          </div>

          <div className="pt-8">
            <p className="font-mono text-xs text-white/20">[TAB] to navigate • [PASTE] supported</p>
          </div>
        </div>
      </div>

      <TimestampFooter />
    </main>
  )
}
