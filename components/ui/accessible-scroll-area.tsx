"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useScreenReader } from "@/hooks/use-screen-reader"
import { ChevronUp, ChevronDown } from "lucide-react"

interface AccessibleScrollAreaProps {
  children: React.ReactNode
  className?: string
  label?: string
  description?: string
  itemCount?: number
  itemType?: string
  onScroll?: (scrollInfo: { scrollTop: number; scrollHeight: number; clientHeight: number }) => void
  autoAnnounceScroll?: boolean
  keyboardNavigation?: boolean
}

export function AccessibleScrollArea({
  children,
  className,
  label,
  description,
  itemCount,
  itemType = "items",
  onScroll,
  autoAnnounceScroll = true,
  keyboardNavigation = true,
  ...props
}: AccessibleScrollAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isScrollable, setIsScrollable] = useState(false)
  const [scrollPosition, setScrollPosition] = useState({ top: 0, percentage: 0 })
  const { announce, announceScrollPosition } = useScreenReader()

  // Check if content is scrollable
  useEffect(() => {
    const checkScrollable = () => {
      if (scrollRef.current) {
        const { scrollHeight, clientHeight } = scrollRef.current
        setIsScrollable(scrollHeight > clientHeight)
      }
    }

    checkScrollable()
    window.addEventListener("resize", checkScrollable)
    return () => window.removeEventListener("resize", checkScrollable)
  }, [children])

  // Handle scroll events
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget
      const { scrollTop, scrollHeight, clientHeight } = target
      const percentage = scrollHeight > clientHeight ? (scrollTop / (scrollHeight - clientHeight)) * 100 : 0

      setScrollPosition({ top: scrollTop, percentage })

      if (onScroll) {
        onScroll({ scrollTop, scrollHeight, clientHeight })
      }

      // Announce scroll position for screen readers (throttled)
      if (autoAnnounceScroll && itemCount) {
        const visibleItems = Math.ceil((clientHeight / scrollHeight) * itemCount)
        const currentItem = Math.ceil((scrollTop / scrollHeight) * itemCount)

        // Throttle announcements
        clearTimeout((handleScroll as any).timeout)
        ;(handleScroll as any).timeout = setTimeout(() => {
          announceScrollPosition(Math.min(currentItem + visibleItems, itemCount), itemCount, itemType)
        }, 1000)
      }
    },
    [onScroll, autoAnnounceScroll, itemCount, itemType, announceScrollPosition],
  )

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!keyboardNavigation || !scrollRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      const scrollStep = clientHeight * 0.1 // 10% of visible area
      const pageStep = clientHeight * 0.9 // 90% of visible area

      let newScrollTop = scrollTop

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault()
          newScrollTop = Math.max(0, scrollTop - scrollStep)
          announce("Scrolled up")
          break
        case "ArrowDown":
          event.preventDefault()
          newScrollTop = Math.min(scrollHeight - clientHeight, scrollTop + scrollStep)
          announce("Scrolled down")
          break
        case "PageUp":
          event.preventDefault()
          newScrollTop = Math.max(0, scrollTop - pageStep)
          announce("Page up")
          break
        case "PageDown":
          event.preventDefault()
          newScrollTop = Math.min(scrollHeight - clientHeight, scrollTop + pageStep)
          announce("Page down")
          break
        case "Home":
          event.preventDefault()
          newScrollTop = 0
          announce("Scrolled to top")
          break
        case "End":
          event.preventDefault()
          newScrollTop = scrollHeight - clientHeight
          announce("Scrolled to bottom")
          break
        default:
          return
      }

      scrollRef.current.scrollTo({ top: newScrollTop, behavior: "smooth" })
    },
    [keyboardNavigation, announce],
  )

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" })
      announce("Scrolled to top")
    }
  }

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
      announce("Scrolled to bottom")
    }
  }

  return (
    <div className="relative">
      {/* Screen reader instructions */}
      <div className="sr-only">
        {label && <h3>{label}</h3>}
        {description && <p>{description}</p>}
        {isScrollable && keyboardNavigation && (
          <p>
            Use arrow keys to scroll, Page Up/Down for larger steps, Home/End for top/bottom.
            {itemCount && ` Contains ${itemCount} ${itemType}.`}
          </p>
        )}
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className={cn(
          "overflow-y-auto overflow-x-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          className,
        )}
        role="region"
        aria-label={label || "Scrollable content"}
        aria-describedby={description ? `${label}-description` : undefined}
        tabIndex={keyboardNavigation ? 0 : -1}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </div>

      {/* Scroll indicators for screen readers */}
      {isScrollable && (
        <>
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            Scroll position: {Math.round(scrollPosition.percentage)}%
          </div>

          {/* Visual scroll indicators */}
          <div className="absolute right-1 top-1 flex flex-col space-y-1">
            {scrollPosition.percentage > 5 && (
              <button
                onClick={scrollToTop}
                className="p-1 bg-dark-300/80 hover:bg-dark-400/80 rounded text-dark-800 transition-colors"
                aria-label="Scroll to top"
                title="Scroll to top"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            )}
            {scrollPosition.percentage < 95 && (
              <button
                onClick={scrollToBottom}
                className="p-1 bg-dark-300/80 hover:bg-dark-400/80 rounded text-dark-800 transition-colors"
                aria-label="Scroll to bottom"
                title="Scroll to bottom"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
