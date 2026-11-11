"use client"

import { useEffect } from "react"

export function ServiceWorkerManager() {
  useEffect(() => {
    // Completely disable Service Workers for v0 preview compatibility
    if (typeof window !== "undefined") {
      // Override navigator.serviceWorker to prevent registration
      if ("serviceWorker" in navigator) {
        // Unregister any existing service workers
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister()
          })
        })

        // Override the register function to prevent new registrations
        const originalRegister = navigator.serviceWorker.register
        navigator.serviceWorker.register = async () => {
          console.log("Service Worker registration blocked for v0 preview compatibility")
          return Promise.resolve({
            installing: null,
            waiting: null,
            active: null,
            scope: "",
            update: () => Promise.resolve(),
            unregister: () => Promise.resolve(true),
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true,
          } as any)
        }

        // Block PWA install prompts
        window.addEventListener("beforeinstallprompt", (e) => {
          e.preventDefault()
          return false
        })
      }

      // Remove any PWA manifest links
      const manifestLinks = document.querySelectorAll('link[rel="manifest"]')
      manifestLinks.forEach((link) => link.remove())

      // Override any PWA-related globals
      if (typeof window !== "undefined") {
        ;(window as any).__WB_MANIFEST = undefined
        ;(window as any).workbox = undefined
      }
    }
  }, [])

  return null
}
