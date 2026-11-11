"use client"

import type React from "react"

interface GlyphProps {
  activated: boolean
  glyph: string
  onClick: () => void
}

const Glyph: React.FC<GlyphProps> = ({ activated, glyph, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ease-in-out
        ${activated ? "bg-purple-600 border-purple-400 shadow-inner shadow-purple-500/50" : "bg-black/60 border-purple-800"}
        hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500
      `}
    >
      <span
        className={`text-2xl font-bold transition-colors duration-200 ease-in-out
          ${activated ? "text-white" : "text-purple-400"}
        `}
      >
        {glyph}
      </span>
      {activated && <div className="absolute inset-0 rounded-full bg-purple-400 opacity-20 animate-pulse"></div>}
    </button>
  )
}

interface GlyphSystemProps {
  glyphs: string[]
  activatedGlyphs: Set<string>
  onGlyphClick: (glyph: string) => void
}

const GlyphSystem: React.FC<GlyphSystemProps> = ({ glyphs, activatedGlyphs, onGlyphClick }) => {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {glyphs.map((glyph) => (
        <Glyph key={glyph} glyph={glyph} activated={activatedGlyphs.has(glyph)} onClick={() => onGlyphClick(glyph)} />
      ))}
    </div>
  )
}

export default GlyphSystem
