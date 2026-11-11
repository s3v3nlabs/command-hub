"use client"

import { useCallback, useRef } from "react"

interface ScreenReaderOptions {
  priority?: "polite" | "assertive"
  delay?: number
}

export function useScreenReader() {
  const announcementRef = useRef<HTMLDivElement | null>(null)

  // Create announcement element if it doesn't exist
  const ensureAnnouncementElement = useCallback(() => {
    if (!announcementRef.current) {
      const element = document.createElement("div")
      element.setAttribute("aria-live", "polite")
      element.setAttribute("aria-atomic", "true")
      element.className = "sr-only"
      element.style.cssText = `
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      `
      document.body.appendChild(element)
      announcementRef.current = element
    }
    return announcementRef.current
  }, [])

  const announce = useCallback(
    (message: string, options: ScreenReaderOptions = {}) => {
      const { priority = "polite", delay = 100 } = options

      const element = ensureAnnouncementElement()
      element.setAttribute("aria-live", priority)

      // Clear previous announcement
      element.textContent = ""

      // Add new announcement with slight delay to ensure it's read
      setTimeout(() => {
        element.textContent = message
      }, delay)
    },
    [ensureAnnouncementElement],
  )

  const announceScrollPosition = useCallback(
    (current: number, total: number, itemType = "items") => {
      const percentage = Math.round((current / total) * 100)
      announce(`Showing ${current} of ${total} ${itemType}. ${percentage}% scrolled.`)
    },
    [announce],
  )

  const announceNewContent = useCallback(
    (count: number, contentType = "items") => {
      announce(`${count} new ${contentType} added`, { priority: "polite" })
    },
    [announce],
  )

  return {
    announce,
    announceScrollPosition,
    announceNewContent,
  }
}
