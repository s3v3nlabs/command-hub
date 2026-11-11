"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { GlitchText } from "@/components/black-aurora/glitch-text"
import { TerminalText } from "@/components/black-aurora/terminal-text"
import { ScanlineOverlay } from "@/components/black-aurora/scanline-overlay"

export default function BlackAuroraLandingPage() {
  const router = useRouter()
  const [showContent, setShowContent] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const a = setTimeout(() => setShowContent(true), 500)
    const b = setTimeout(() => setShowPrompt(true), 2000)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [])

  const handleEnter = () => router.push("/black-aurora/verify")

  return (
    <main
      className="min-h-screen bg-black flex flex-col items-center justify-center p-8 cursor-pointer ba-no-print"
      onClick={handleEnter}
      onKeyDown={(e) => e.key === "Enter" && handleEnter()}
      role="button"
      tabIndex={0}
    >
      <ScanlineOverlay intensity="light" />

      <div
        className={`text-center space-y-8 transition-opacity duration-1000 ${
          showContent ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="w-2 h-2 bg-white" />
            <span className="w-2 h-2 bg-white" />
          </div>

          <GlitchText
            text="BLACK AURORA LABS"
            className="text-3xl md:text-4xl tracking-[0.4em] text-white"
            intensity="low"
          />

          <div className="h-px w-64 mx-auto bg-white/30 my-6" />

          <p className="font-mono text-xs tracking-[0.3em] text-white/40">SECURE CLIENT PORTAL</p>
        </div>

        <div className="pt-8">
          <p className="font-mono text-xs tracking-widest text-white/20">[AUTHORIZED ACCESS ONLY]</p>
        </div>

        <div
          className={`pt-12 transition-opacity duration-500 ${
            showPrompt ? "opacity-100" : "opacity-0"
          }`}
        >
          <TerminalText
            text="PRESS ENTER OR CLICK TO CONTINUE"
            className="text-xs tracking-wider text-white/30"
            speed={30}
          />
        </div>
      </div>

      <div className="fixed top-4 left-4 w-8 h-8 border-l border-t border-white/20" />
      <div className="fixed top-4 right-4 w-8 h-8 border-r border-t border-white/20" />
      <div className="fixed bottom-4 left-4 w-8 h-8 border-l border-b border-white/20" />
      <div className="fixed bottom-4 right-4 w-8 h-8 border-r border-b border-white/20" />

      <div className="fixed bottom-8 left-0 right-0 text-center">
        <p className="font-mono text-xs text-white/15 tracking-wider">
          v1.0 // GHOSTNODE ACTIVE // SINGULAR/TY COMMAND HUB
        </p>
      </div>
    </main>
  )
}
