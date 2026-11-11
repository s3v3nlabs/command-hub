"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { useTheme as useNextTheme } from "next-themes"

/** Visual mode — Ghostlight boots dark. */
export type ThemeMode = "light" | "dark"

/**
 * Accent palettes layered on Ghostlight chrome.
 * `ghostlight` is the factory default (neutral silver).
 */
export type AccentPalette =
  | "ghostlight"
  | "cyan"
  | "amber"
  | "violet"
  | "emerald"
  | "matrix"
  | "rose"
  | "sky"
  | "crimson"
  | "gold"
  | "indigo"
  | "teal"

export const ACCENT_PALETTES: { id: AccentPalette; label: string; swatch: string }[] = [
  { id: "ghostlight", label: "Ghostlight", swatch: "#A3A3A3" },
  { id: "cyan", label: "Cyan Pulse", swatch: "#22D3EE" },
  { id: "amber", label: "Amber Ops", swatch: "#FBBF24" },
  { id: "violet", label: "Violet Field", swatch: "#A78BFA" },
  { id: "emerald", label: "Emerald Link", swatch: "#34D399" },
  { id: "matrix", label: "Matrix", swatch: "#4ADE80" },
  { id: "rose", label: "Rose Signal", swatch: "#FB7185" },
  { id: "sky", label: "Sky Link", swatch: "#38BDF8" },
  { id: "crimson", label: "Crimson Ops", swatch: "#EF4444" },
  { id: "gold", label: "Gold Wire", swatch: "#EAB308" },
  { id: "indigo", label: "Indigo Field", swatch: "#818CF8" },
  { id: "teal", label: "Teal Drift", swatch: "#14B8A6" },
]

const STORAGE_MODE = "hub-theme-mode"
const STORAGE_ACCENT = "hub-accent-palette"

interface ThemeContextProps {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  accent: AccentPalette
  setAccent: (accent: AccentPalette) => void
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: "dark",
  setTheme: () => {},
  accent: "ghostlight",
  setAccent: () => {},
  toggleMode: () => {},
})

function applyDomTheme(mode: ThemeMode, accent: AccentPalette) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.classList.toggle("dark", mode === "dark")
  root.classList.toggle("light", mode === "light")
  root.dataset.accent = accent
  root.dataset.theme = mode
  // Keep next-themes attribute compatible when present
  root.setAttribute("data-theme-mode", mode)
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { setTheme: setNextTheme } = useNextTheme()
  const [theme, setThemeState] = useState<ThemeMode>("dark")
  const [accent, setAccentState] = useState<AccentPalette>("ghostlight")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const storedMode = localStorage.getItem(STORAGE_MODE) as ThemeMode | null
      const storedAccent = localStorage.getItem(STORAGE_ACCENT) as AccentPalette | null
      // Legacy key from older theme-context
      const legacy = localStorage.getItem("theme") as ThemeMode | null
      const mode: ThemeMode =
        storedMode === "light" || storedMode === "dark"
          ? storedMode
          : legacy === "light" || legacy === "dark"
            ? legacy
            : "dark"
      const nextAccent: AccentPalette =
        storedAccent && ACCENT_PALETTES.some((p) => p.id === storedAccent) ? storedAccent : "ghostlight"
      setThemeState(mode)
      setAccentState(nextAccent)
      applyDomTheme(mode, nextAccent)
      setNextTheme(mode)
    } catch {
      applyDomTheme("dark", "ghostlight")
      setNextTheme("dark")
    }
    setReady(true)
  }, [setNextTheme])

  useEffect(() => {
    if (!ready) return
    applyDomTheme(theme, accent)
    setNextTheme(theme)
    try {
      localStorage.setItem(STORAGE_MODE, theme)
      localStorage.setItem(STORAGE_ACCENT, accent)
      localStorage.setItem("theme", theme) // legacy compat
    } catch {}
  }, [theme, accent, ready, setNextTheme])

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode)
  }, [])

  const setAccent = useCallback((next: AccentPalette) => {
    setAccentState(next)
  }, [])

  const toggleMode = useCallback(() => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accent, setAccent, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
export const useHubTheme = useTheme
