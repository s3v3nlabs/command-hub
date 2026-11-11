"use client"

import { useEffect, useState } from "react"
import { Moon, Sun, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ACCENT_PALETTES, useHubTheme, type AccentPalette } from "@/lib/theme-context"
import { cn } from "@/lib/utils"

/**
 * Ghostlight theme control: light/dark + accent palette.
 * Preference persisted via hub theme context (localStorage).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleMode, accent, setAccent } = useHubTheme()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-dark-500" disabled aria-hidden />
      </div>
    )
  }

  return (
    <div className={cn("relative flex items-center gap-1", className)}>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 text-dark-500 hover:text-dark-700 hover:bg-dark-100/10"
        onClick={toggleMode}
        title={theme === "light" ? "Switch to dark" : "Switch to light"}
      >
        {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        <span className="sr-only">Toggle light/dark</span>
      </Button>

      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 text-dark-500 hover:text-dark-700 hover:bg-dark-100/10"
        onClick={() => setOpen((v) => !v)}
        title="Accent palette"
        aria-expanded={open}
      >
        <Palette className="h-4 w-4" style={{ color: "var(--hub-accent, #A3A3A3)" }} />
        <span className="sr-only">Accent palette</span>
      </Button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close palette"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-9 z-50 min-w-[11rem] rounded-sm border border-dark-300/50 bg-black/95 p-2 shadow-xl backdrop-blur-md">
            <div className="mb-1.5 px-1 text-[10px] font-mono uppercase tracking-widest text-dark-500">
              Accent
            </div>
            <div className="flex flex-col gap-0.5">
              {ACCENT_PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setAccent(p.id as AccentPalette)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs font-mono transition-colors",
                    accent === p.id
                      ? "bg-dark-200/30 text-dark-800"
                      : "text-dark-600 hover:bg-dark-100/20 hover:text-dark-700",
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/20"
                    style={{ backgroundColor: p.swatch }}
                  />
                  <span>{p.label}</span>
                  {p.id === "ghostlight" && (
                    <span className="ml-auto text-[9px] uppercase tracking-wider text-dark-500">default</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
