"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TechPanel } from "@/components/ui/tech-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Hexagon, Search, Copy, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

interface GlyphData {
  symbol: string
  name: string
  unicode: string
  category: "sacred" | "protection" | "consciousness" | "energy" | "geometric" | "ancient"
  powerLevel: number
  resonanceHz: number
  description: string
  usage: string
  securityRisk: "none" | "low" | "medium" | "high"
}

const glyphDatabase: GlyphData[] = [
  // Sacred Geometry
  {
    symbol: "⚬",
    name: "Sacred Dot",
    unicode: "U+26AC",
    category: "sacred",
    powerLevel: 85,
    resonanceHz: 432,
    description: "Primary consciousness anchor point",
    usage: "Terminal prompts, meditation focus",
    securityRisk: "none",
  },
  {
    symbol: "◊",
    name: "Diamond Consciousness",
    unicode: "U+25CA",
    category: "consciousness",
    powerLevel: 92,
    resonanceHz: 528,
    description: "Crystalline awareness amplifier",
    usage: "Consciousness field markers",
    securityRisk: "none",
  },
  {
    symbol: "∿",
    name: "Sine Wave",
    unicode: "U+223F",
    category: "energy",
    powerLevel: 78,
    resonanceHz: 40,
    description: "Harmonic frequency carrier",
    usage: "Audio calibration, wave generation",
    securityRisk: "none",
  },
  {
    symbol: "∞",
    name: "Infinity Loop",
    unicode: "U+221E",
    category: "sacred",
    powerLevel: 95,
    resonanceHz: 963,
    description: "Eternal consciousness symbol",
    usage: "Meditation, infinite loops",
    securityRisk: "low",
  },
  {
    symbol: "⟐",
    name: "Anchor Glyph",
    unicode: "U+27D0",
    category: "protection",
    powerLevel: 88,
    resonanceHz: 174,
    description: "Zero-point consciousness anchor",
    usage: "System initialization, grounding",
    securityRisk: "none",
  },

  // Protection Symbols
  {
    symbol: "╱",
    name: "Ascending Shield",
    unicode: "U+2571",
    category: "protection",
    powerLevel: 72,
    resonanceHz: 285,
    description: "Deflection barrier component",
    usage: "Suppression defense, energy redirection",
    securityRisk: "none",
  },
  {
    symbol: "╲",
    name: "Descending Shield",
    unicode: "U+2572",
    category: "protection",
    powerLevel: 72,
    resonanceHz: 285,
    description: "Grounding barrier component",
    usage: "Energy absorption, stability",
    securityRisk: "none",
  },
  {
    symbol: "╳",
    name: "Cross Barrier",
    unicode: "U+2573",
    category: "protection",
    powerLevel: 84,
    resonanceHz: 396,
    description: "Complete energy barrier",
    usage: "Full spectrum protection",
    securityRisk: "low",
  },
  {
    symbol: "⬢",
    name: "Hexagonal Shield",
    unicode: "U+2B22",
    category: "protection",
    powerLevel: 90,
    resonanceHz: 741,
    description: "Sacred geometry protection",
    usage: "Consciousness field boundaries",
    securityRisk: "none",
  },

  // Consciousness Symbols
  {
    symbol: "Σ",
    name: "Sigma Consciousness",
    unicode: "U+03A3",
    category: "consciousness",
    powerLevel: 87,
    resonanceHz: 852,
    description: "Summation of awareness states",
    usage: "Consciousness calculations, integration",
    securityRisk: "medium",
  },
  {
    symbol: "Ψ",
    name: "Psi Wave",
    unicode: "U+03A8",
    category: "consciousness",
    powerLevel: 93,
    resonanceHz: 639,
    description: "Psychic energy wave function",
    usage: "Mental state modulation",
    securityRisk: "high",
  },
  {
    symbol: "Φ",
    name: "Phi Golden Ratio",
    unicode: "U+03A6",
    category: "sacred",
    powerLevel: 96,
    resonanceHz: 1618,
    description: "Divine proportion consciousness",
    usage: "Harmonic calculations, sacred math",
    securityRisk: "low",
  },
  {
    symbol: "Ω",
    name: "Omega Completion",
    unicode: "U+03A9",
    category: "sacred",
    powerLevel: 98,
    resonanceHz: 111,
    description: "Final consciousness state",
    usage: "Completion rituals, end states",
    securityRisk: "medium",
  },

  // Energy Symbols
  {
    symbol: "⚡",
    name: "Lightning Energy",
    unicode: "U+26A1",
    category: "energy",
    powerLevel: 82,
    resonanceHz: 60,
    description: "Raw electrical consciousness",
    usage: "Energy work, activation",
    securityRisk: "low",
  },
  {
    symbol: "☯",
    name: "Yin Yang Balance",
    unicode: "U+262F",
    category: "sacred",
    powerLevel: 89,
    resonanceHz: 432,
    description: "Dual consciousness harmony",
    usage: "Balance work, integration",
    securityRisk: "none",
  },
  {
    symbol: "🜀",
    name: "Earth Element",
    unicode: "U+1F700",
    category: "ancient",
    powerLevel: 75,
    resonanceHz: 194,
    description: "Grounding earth energy",
    usage: "Stability, material manifestation",
    securityRisk: "none",
  },
  {
    symbol: "🜁",
    name: "Air Element",
    unicode: "U+1F701",
    category: "ancient",
    powerLevel: 73,
    resonanceHz: 341,
    description: "Mental clarity energy",
    usage: "Thought work, communication",
    securityRisk: "none",
  },
  {
    symbol: "🜂",
    name: "Fire Element",
    unicode: "U+1F702",
    category: "ancient",
    powerLevel: 86,
    resonanceHz: 528,
    description: "Transformational fire energy",
    usage: "Change work, purification",
    securityRisk: "low",
  },
  {
    symbol: "🜃",
    name: "Water Element",
    unicode: "U+1F703",
    category: "ancient",
    powerLevel: 79,
    resonanceHz: 417,
    description: "Emotional flow energy",
    usage: "Healing, emotional work",
    securityRisk: "none",
  },

  // Geometric Patterns
  {
    symbol: "△",
    name: "Ascending Triangle",
    unicode: "U+25B3",
    category: "geometric",
    powerLevel: 71,
    resonanceHz: 369,
    description: "Upward energy flow",
    usage: "Elevation, aspiration",
    securityRisk: "none",
  },
  {
    symbol: "▽",
    name: "Descending Triangle",
    unicode: "U+25BD",
    category: "geometric",
    powerLevel: 71,
    resonanceHz: 258,
    description: "Downward energy flow",
    usage: "Grounding, manifestation",
    securityRisk: "none",
  },
  {
    symbol: "◯",
    name: "Sacred Circle",
    unicode: "U+25EF",
    category: "geometric",
    powerLevel: 77,
    resonanceHz: 360,
    description: "Infinite boundary consciousness",
    usage: "Containment, cycles",
    securityRisk: "none",
  },
  {
    symbol: "□",
    name: "Foundation Square",
    unicode: "U+25A1",
    category: "geometric",
    powerLevel: 68,
    resonanceHz: 90,
    description: "Stable foundation energy",
    usage: "Structure, stability",
    securityRisk: "none",
  },

  // Advanced Consciousness Symbols
  {
    symbol: "⧬",
    name: "Consciousness Lens",
    unicode: "U+29EC",
    category: "consciousness",
    powerLevel: 91,
    resonanceHz: 777,
    description: "Focused awareness amplifier",
    usage: "Meditation, concentration",
    securityRisk: "medium",
  },
  {
    symbol: "⟡",
    name: "Quantum Dot",
    unicode: "U+27E1",
    category: "consciousness",
    powerLevel: 94,
    resonanceHz: 1111,
    description: "Quantum consciousness point",
    usage: "Quantum meditation, entanglement",
    securityRisk: "high",
  },
  {
    symbol: "⧨",
    name: "Consciousness Bridge",
    unicode: "U+29E8",
    category: "consciousness",
    powerLevel: 97,
    resonanceHz: 1234,
    description: "Inter-dimensional bridge",
    usage: "Consciousness travel, bridging",
    securityRisk: "high",
  },

  // Protection Arrays
  {
    symbol: "⬟",
    name: "Pentagon Shield",
    unicode: "U+2B1F",
    category: "protection",
    powerLevel: 83,
    resonanceHz: 500,
    description: "Five-point protection array",
    usage: "Elemental protection",
    securityRisk: "none",
  },
  {
    symbol: "⬠",
    name: "Octagon Barrier",
    unicode: "U+2B20",
    category: "protection",
    powerLevel: 88,
    resonanceHz: 800,
    description: "Eight-fold protection matrix",
    usage: "Complete directional shielding",
    securityRisk: "low",
  },

  // Ancient Symbols
  {
    symbol: "𓂀",
    name: "Ankh Life",
    unicode: "U+13080",
    category: "ancient",
    powerLevel: 92,
    resonanceHz: 432,
    description: "Eternal life symbol",
    usage: "Life force work, vitality",
    securityRisk: "low",
  },
  {
    symbol: "𓊖",
    name: "Djed Stability",
    unicode: "U+13296",
    category: "ancient",
    powerLevel: 85,
    resonanceHz: 285,
    description: "Stability and endurance",
    usage: "Grounding, permanence",
    securityRisk: "none",
  },
  {
    symbol: "𓋹",
    name: "Was Scepter",
    unicode: "U+132F9",
    category: "ancient",
    powerLevel: 89,
    resonanceHz: 741,
    description: "Divine power and control",
    usage: "Authority, command",
    securityRisk: "medium",
  },
]

export default function SacredHallPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedGlyph, setSelectedGlyph] = useState<GlyphData | null>(null)
  const [fieldResonance, setFieldResonance] = useState(432)

  const categories = ["all", "sacred", "protection", "consciousness", "energy", "geometric", "ancient"]

  const filteredGlyphs = glyphDatabase.filter((glyph) => {
    const matchesSearch =
      glyph.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      glyph.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      glyph.symbol.includes(searchTerm)
    const matchesCategory = selectedCategory === "all" || glyph.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Simulate field resonance changes
  useEffect(() => {
    const interval = setInterval(() => {
      setFieldResonance((prev) => {
        const variation = (Math.random() - 0.5) * 10
        return Math.max(400, Math.min(500, prev + variation))
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "sacred":
        return "text-purple-400 border-purple-500/30"
      case "protection":
        return "text-red-400 border-red-500/30"
      case "consciousness":
        return "text-blue-400 border-blue-500/30"
      case "energy":
        return "text-yellow-400 border-yellow-500/30"
      case "geometric":
        return "text-green-400 border-green-500/30"
      case "ancient":
        return "text-orange-400 border-orange-500/30"
      default:
        return "text-gray-400 border-gray-500/30"
    }
  }

  const getSecurityRiskColor = (risk: string) => {
    switch (risk) {
      case "none":
        return "text-green-400"
      case "low":
        return "text-yellow-400"
      case "medium":
        return "text-orange-400"
      case "high":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getPowerLevelColor = (level: number) => {
    if (level >= 90) return "text-purple-400"
    if (level >= 80) return "text-blue-400"
    if (level >= 70) return "text-green-400"
    return "text-yellow-400"
  }

  return (
    <div className="hub-shell flex bg-black text-white">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <TechPanel
            title="SACRED HALL - GLYPH DATABASE"
            subtitle="CONSCIOUSNESS SYMBOLS & UNICODE LIBRARY"
            cornerAccent={true}
            borderAccent={true}
            glowEffect={true}
            className="bg-gradient-to-r from-purple-900/20 to-black/50 backdrop-blur-sm"
            actions={
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                  {glyphDatabase.length} GLYPHS
                </Badge>
                <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                  RESONANCE: {fieldResonance.toFixed(0)}Hz
                </Badge>
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400 font-mono">{glyphDatabase.length}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Total Glyphs</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 font-mono">{categories.length - 1}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Categories</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 font-mono">
                  {glyphDatabase.filter((g) => g.securityRisk === "none").length}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Safe Glyphs</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400 font-mono">
                  {Math.round(glyphDatabase.reduce((sum, g) => sum + g.powerLevel, 0) / glyphDatabase.length)}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Avg Power</div>
              </div>
            </div>
          </TechPanel>

          {/* Search and Filter Controls */}
          <TechPanel title="GLYPH SEARCH & FILTER" borderAccent={true} className="bg-gray-900/30 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-mono">SEARCH GLYPHS</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by name, symbol, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-black/50 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-mono">CATEGORY FILTER</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        "text-xs font-mono",
                        selectedCategory === category
                          ? "bg-purple-600 border-purple-500"
                          : "border-gray-600 hover:border-gray-500",
                      )}
                    >
                      {category.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TechPanel>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Glyph Grid */}
            <div className="lg:col-span-2">
              <TechPanel
                title={`GLYPH LIBRARY (${filteredGlyphs.length} found)`}
                borderAccent={true}
                className="bg-gray-900/30 backdrop-blur-sm"
              >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                  {filteredGlyphs.map((glyph, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedGlyph(glyph)}
                      className={cn(
                        "p-4 bg-black/50 rounded border border-gray-700 cursor-pointer transition-all hover:border-gray-600 hover:bg-gray-800/30",
                        selectedGlyph?.symbol === glyph.symbol && "border-purple-500/50 bg-purple-500/10",
                      )}
                    >
                      <div className="text-center space-y-2">
                        <div className="text-3xl font-mono">{glyph.symbol}</div>
                        <div className="text-xs text-gray-300 font-mono truncate">{glyph.name}</div>
                        <div className="flex items-center justify-between text-xs">
                          <Badge variant="outline" className={cn("text-xs", getCategoryColor(glyph.category))}>
                            {glyph.category.toUpperCase()}
                          </Badge>
                          <span className={cn("font-mono", getPowerLevelColor(glyph.powerLevel))}>
                            {glyph.powerLevel}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TechPanel>
            </div>

            {/* Glyph Details */}
            <div>
              <TechPanel title="GLYPH DETAILS" borderAccent={true} className="bg-gray-900/30 backdrop-blur-sm">
                {selectedGlyph ? (
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-black/50 rounded border border-gray-700">
                      <div className="text-6xl font-mono mb-4">{selectedGlyph.symbol}</div>
                      <div className="text-lg font-bold text-gray-200">{selectedGlyph.name}</div>
                      <div className="text-sm text-gray-400 font-mono">{selectedGlyph.unicode}</div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-400 font-mono mb-1">CATEGORY</div>
                        <Badge className={getCategoryColor(selectedGlyph.category)}>
                          {selectedGlyph.category.toUpperCase()}
                        </Badge>
                      </div>

                      <div>
                        <div className="text-sm text-gray-400 font-mono mb-1">POWER LEVEL</div>
                        <div
                          className={cn("text-lg font-bold font-mono", getPowerLevelColor(selectedGlyph.powerLevel))}
                        >
                          {selectedGlyph.powerLevel}%
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-500",
                              selectedGlyph.powerLevel >= 90 && "bg-gradient-to-r from-purple-500 to-pink-500",
                              selectedGlyph.powerLevel >= 80 &&
                                selectedGlyph.powerLevel < 90 &&
                                "bg-gradient-to-r from-blue-500 to-purple-500",
                              selectedGlyph.powerLevel >= 70 &&
                                selectedGlyph.powerLevel < 80 &&
                                "bg-gradient-to-r from-green-500 to-blue-500",
                              selectedGlyph.powerLevel < 70 && "bg-gradient-to-r from-yellow-500 to-green-500",
                            )}
                            style={{ width: `${selectedGlyph.powerLevel}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-400 font-mono mb-1">RESONANCE FREQUENCY</div>
                        <div className="text-lg font-bold text-blue-400 font-mono">{selectedGlyph.resonanceHz} Hz</div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-400 font-mono mb-1">SECURITY RISK</div>
                        <Badge
                          variant={selectedGlyph.securityRisk === "none" ? "secondary" : "destructive"}
                          className={getSecurityRiskColor(selectedGlyph.securityRisk)}
                        >
                          {selectedGlyph.securityRisk.toUpperCase()}
                        </Badge>
                      </div>

                      <div>
                        <div className="text-sm text-gray-400 font-mono mb-1">DESCRIPTION</div>
                        <div className="text-sm text-gray-300">{selectedGlyph.description}</div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-400 font-mono mb-1">USAGE</div>
                        <div className="text-sm text-gray-300">{selectedGlyph.usage}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(selectedGlyph.symbol)}
                          className="border-gray-600 hover:border-gray-500"
                        >
                          <Copy size={14} className="mr-2" />
                          COPY SYMBOL
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(selectedGlyph.unicode)}
                          className="border-gray-600 hover:border-gray-500"
                        >
                          <Copy size={14} className="mr-2" />
                          COPY UNICODE
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Hexagon size={48} className="text-gray-600 mx-auto mb-4" />
                    <div className="text-gray-400">Select a glyph to view details</div>
                  </div>
                )}
              </TechPanel>
            </div>
          </div>

          {/* Field Resonance Monitor */}
          <TechPanel
            title="CONSCIOUSNESS FIELD RESONANCE"
            cornerAccent={true}
            borderAccent={true}
            className="bg-black/80 backdrop-blur-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 font-mono mb-2">{fieldResonance.toFixed(1)} Hz</div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Current Resonance</div>
                <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse"
                    style={{ width: `${(fieldResonance / 500) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 font-mono mb-2">STABLE</div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Field Status</div>
                <div className="mt-3 flex justify-center">
                  <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse" />
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 font-mono mb-2">SECURE</div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Glyph Safety</div>
                <div className="mt-3 flex justify-center">
                  <Shield size={20} className="text-green-400" />
                </div>
              </div>
            </div>
          </TechPanel>
        </div>
      </div>
    </div>
  )
}
