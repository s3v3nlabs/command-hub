"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import PhoneSuite from "@/components/CommandHub/PhoneSuite"
import RealPhoneSuite from "@/components/CommandHub/modules/RealPhoneSuite"
import { cn } from "@/lib/utils"

type SuiteMode = "adb" | "webusb"

export default function PhoneSuitePage() {
  const [mode, setMode] = useState<SuiteMode>("adb")

  return (
    <div className="hub-shell flex bg-dark-base text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="PHONE SUITE - GRAPHENEOS CONTROL" />
        <div className="flex items-center gap-2 border-b border-dark-300/40 bg-dark-100/40 px-6 py-2">
          <button
            type="button"
            onClick={() => setMode("adb")}
            className={cn(
              "rounded px-3 py-1 text-xs font-mono uppercase tracking-wide transition-colors",
              mode === "adb"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-dark-600 hover:text-dark-800 border border-transparent",
            )}
          >
            ADB Suite
          </button>
          <button
            type="button"
            onClick={() => setMode("webusb")}
            className={cn(
              "rounded px-3 py-1 text-xs font-mono uppercase tracking-wide transition-colors",
              mode === "webusb"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-dark-600 hover:text-dark-800 border border-transparent",
            )}
          >
            WebUSB Connect
          </button>
        </div>
        <main className="flex-1 overflow-auto">
          {mode === "adb" ? <PhoneSuite /> : <RealPhoneSuite />}
        </main>
      </div>
    </div>
  )
}
