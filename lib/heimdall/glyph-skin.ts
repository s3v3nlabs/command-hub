/**
 * GLYPH / SYMBOL LOG SKIN — COSMETIC ONLY.
 *
 * ⚠️ This is a DISPLAY / ENCODING skin that sits ON TOP of the real AES-256-GCM
 * crypto in eyes-only.ts. It provides **NO security whatsoever**. The symbols,
 * glyphstream, "EchoNexus", "resonance", and "harmonic" naming are UI flavor /
 * reversible obfuscation only. Anyone can reverse this mapping. Do NOT rely on
 * it to protect anything, and never represent frequency/resonance as security.
 *
 * The AEAD (eyes-only.ts) is what secures the data; this just renders it pretty.
 */

// Reversible, public, cosmetic nibble→glyph mapping (16 symbols).
const GLYPHS = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ", "ᛈ", "ᛇ", "ᛉ", "ᛊ"]
const REVERSE: Record<string, number> = Object.fromEntries(GLYPHS.map((g, i) => [g, i]))

/** Cosmetic: render arbitrary text as a public, reversible glyphstream. NOT encryption. */
export function toGlyphstream(text: string): string {
  const bytes = Buffer.from(text, "utf8")
  let out = ""
  for (const b of bytes) {
    out += GLYPHS[(b >> 4) & 0xf] + GLYPHS[b & 0xf]
  }
  return out
}

/** Reverse the cosmetic glyphstream. Works for anyone — it is not secret. */
export function fromGlyphstream(glyphs: string): string {
  const chars = Array.from(glyphs)
  const bytes: number[] = []
  for (let i = 0; i + 1 < chars.length; i += 2) {
    const hi = REVERSE[chars[i]]
    const lo = REVERSE[chars[i + 1]]
    if (hi == null || lo == null) continue
    bytes.push((hi << 4) | lo)
  }
  return Buffer.from(bytes).toString("utf8")
}

export const GLYPH_SKIN_DISCLAIMER =
  "Cosmetic display skin only. The glyph/symbol/resonance layer provides NO security — AES-256-GCM (Heimdall eyes-only) is what protects the data."
