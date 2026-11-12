"use client"

import { useEffect, useState } from "react"

/**
 * Registers the Device Bridge service worker and surfaces a native install prompt
 * when the browser fires beforeinstallprompt. Honest: iOS Safari has no prompt
 * — operators use Share → Add to Home Screen.
 */
export function PwaRegister() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [iosHint, setIosHint] = useState(false)
  const [standalone, setStandalone] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const media = window.matchMedia("(display-mode: standalone)")
    const standaloneNow = media.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
    setStandalone(standaloneNow)
    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    setIosHint(isiOS && isSafari && !standaloneNow)

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/companion/sw.js", { scope: "/companion/" }).catch(() => {
        /* SW is a convenience, not a requirement for the live bridge */
      })
    }

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  if (standalone) {
    return <p className="text-center text-[10px] text-[color:var(--ghost-dim)]">Running as an installed PWA.</p>
  }
  if (installed) {
    return <p className="text-center text-[10px] text-[color:var(--ghost-dim)]">Installed. Open it from your home screen.</p>
  }

  return (
    <div className="space-y-2">
      {deferred ? (
        <button
          type="button"
          className="ghost-btn w-full !py-3 text-sm font-semibold"
          onClick={async () => {
            await deferred.prompt()
            try {
              await deferred.userChoice
            } catch {
              /* dismissed */
            }
            setDeferred(null)
          }}
        >
          Install on this phone
        </button>
      ) : null}
      {iosHint ? (
        <p className="text-center text-[11px] leading-relaxed text-[color:var(--ghost-dim)]">
          On iPhone / iPad: tap <span className="text-[color:var(--ghost-ink)]">Share</span> →{" "}
          <span className="text-[color:var(--ghost-ink)]">Add to Home Screen</span>.
        </p>
      ) : !deferred ? (
        <p className="text-center text-[11px] leading-relaxed text-[color:var(--ghost-dim)]">
          Android Chrome: menu → <span className="text-[color:var(--ghost-ink)]">Add to Home Screen</span>. The
          page must be served over HTTPS (localhost is fine for lab).
        </p>
      ) : null}
    </div>
  )
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}
