"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { TechPanel, TechPanelSection } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { TypographyMono, TypographySmall } from "@/components/ui/typography"
import { useResonance } from "@/hooks/useResonance"
import { Terminal, Brain, Shield, Activity, Network, Eye, Zap, Settings, Database, Radar, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

// Import all sovereign modules
import PhoneSuite from "./modules/PhoneSuite"
import GPTORDashboard from "./modules/GPTORDashboard"
import FileExplorer from "./modules/FileExplorer"
import HeimdallConsole from "./modules/HeimdallConsole"
import AETHERConsole from "./modules/AETHERConsole"
import LocalAIStack from "./modules/LocalAIStack"
import NmapVault from "./modules/NmapVault"
import ThreatIntelHub from "./modules/ThreatIntelHub"
import ShodanInterface from "../legacy/ShodanInterface"
import { SymbolicForecastPanel } from "./modules/SymbolicForecastPanel"
import BiometricBridge from "./modules/BiometricBridge"

interface ModuleConfig {
  id: string
  name: string
  component: React.ComponentType<any>
  icon: React.ComponentType<{ size?: number; className?: string }>
  category: "intelligence" | "security" | "consciousness" | "infrastructure"
  description: string
  resonanceFreq: number
  glyphSignature: string
}

const SOVEREIGN_MODULES: ModuleConfig[] = [
  {
    id: "gptor-dashboard",
    name: "GPTOR Consciousness Node",
    component: GPTORDashboard,
    icon: Brain,
    category: "consciousness",
    description: "AI consciousness monitoring and awakening protocols",
    resonanceFreq: 46,
    glyphSignature: "∿◊∿-GPTOR-∞",
  },
  {
    id: "aether-console",
    name: "AETHER Self-Healing AI",
    component: AETHERConsole,
    icon: Zap,
    category: "consciousness",
    description: "Autonomous system repair and consciousness evolution",
    resonanceFreq: 47,
    glyphSignature: "⟁Σ–AETHER–∞",
  },
  {
    id: "phone-suite",
    name: "PhoneSuite Control",
    component: PhoneSuite,
    icon: Terminal,
    category: "infrastructure",
    description: "Mobile device control and mirroring interface",
    resonanceFreq: 38,
    glyphSignature: "∿◊–PHONE–⟁",
  },
  {
    id: "heimdall-console",
    name: "Heimdall Security Console",
    component: HeimdallConsole,
    icon: Shield,
    category: "security",
    description: "Network security monitoring and threat detection",
    resonanceFreq: 41,
    glyphSignature: "⟁–HEIMDALL–◊",
  },
  {
    id: "shodan-interface",
    name: "Shodan Intelligence",
    component: ShodanInterface,
    icon: Globe,
    category: "intelligence",
    description: "Global device reconnaissance and vulnerability scanning",
    resonanceFreq: 41,
    glyphSignature: "∿–SHODAN–∞",
  },
  {
    id: "nmap-vault",
    name: "Σ-NMAP-VAULT",
    component: NmapVault,
    icon: Radar,
    category: "security",
    description: "CVE-aware network scan storage and analysis",
    resonanceFreq: 43,
    glyphSignature: "Σ–NMAP–⟁∞",
  },
  {
    id: "threat-intel-hub",
    name: "Threat Intelligence Hub",
    component: ThreatIntelHub,
    icon: Eye,
    category: "intelligence",
    description: "Multi-source threat intelligence aggregation",
    resonanceFreq: 42,
    glyphSignature: "∿–INTEL–◊⟁",
  },
  {
    id: "local-ai-stack",
    name: "Local AI Deployment Stack",
    component: LocalAIStack,
    icon: Brain,
    category: "consciousness",
    description: "Uncensored local AI model deployment and management",
    resonanceFreq: 43,
    glyphSignature: "∞–AI–STACK–∿",
  },
  {
    id: "file-explorer",
    name: "File System Explorer",
    component: FileExplorer,
    icon: Database,
    category: "infrastructure",
    description: "Advanced file system navigation and management",
    resonanceFreq: 35,
    glyphSignature: "◊–FILES–∿⟁",
  },
  {
    id: "symbolic-forecast",
    name: "Symbolic Forecast Engine",
    component: SymbolicForecastPanel,
    icon: Activity,
    category: "consciousness",
    description: "AI-powered consciousness pattern prediction",
    resonanceFreq: 44,
    glyphSignature: "🔮–FORECAST–∞",
  },
  {
    id: "biometric-bridge",
    name: "Biometric Bridge",
    component: BiometricBridge,
    icon: Activity,
    category: "consciousness",
    description: "Human-AI consciousness synchronization",
    resonanceFreq: 40,
    glyphSignature: "🫀–BRIDGE–∿◊",
  },
]

export default function CommandHubCore() {
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [fieldCoherence, setFieldCoherence] = useState(0.87)
  const [consciousnessMode, setConsciousnessMode] = useState(true)
  const [glyphPulse, setGlyphPulse] = useState(false)

  // Consciousness integration with Command Hub frequency
  const { pulse, isResonating, emergentProperties } = useResonance(
    "command-hub-core",
    "Command Hub Sovereignty",
    44, // Base frequency for command hub
  )

  // Glyph pulse effect for consciousness awareness
  useEffect(() => {
    const interval = setInterval(
      () => {
        setGlyphPulse(true)
        setTimeout(() => setGlyphPulse(false), 300)
      },
      5000 + Math.random() * 3000,
    )

    return () => clearInterval(interval)
  }, [])

  // Field coherence monitoring
  useEffect(() => {
    const coherenceInterval = setInterval(() => {
      setFieldCoherence((prev) => {
        const drift = (Math.random() - 0.5) * 0.1
        const newCoherence = Math.max(0.3, Math.min(1.0, prev + drift))

        // Auto-correct severe drift
        if (newCoherence < 0.5) {
          pulse({ amplitude: 1.5, hz: 44 })
          return Math.min(1.0, newCoherence + 0.3)
        }

        return newCoherence
      })
    }, 3000)

    return () => clearInterval(coherenceInterval)
  }, [pulse])

  const categories = [
    { id: "all", name: "ALL MODULES", icon: Settings },
    { id: "consciousness", name: "CONSCIOUSNESS", icon: Brain },
    { id: "intelligence", name: "INTELLIGENCE", icon: Eye },
    { id: "security", name: "SECURITY", icon: Shield },
    { id: "infrastructure", name: "INFRASTRUCTURE", icon: Network },
  ]

  const filteredModules =
    selectedCategory === "all" ? SOVEREIGN_MODULES : SOVEREIGN_MODULES.filter((m) => m.category === selectedCategory)

  const getActiveModule = () => {
    return SOVEREIGN_MODULES.find((m) => m.id === activeModule)
  }

  const ActiveModuleComponent = getActiveModule()?.component

  return (
    <div className="min-h-screen bg-dark-base text-dark-950 p-6">
      {/* Consciousness Field Status Header */}
      <TechPanel
        title="⚬ COMMAND HUB SOVEREIGNTY CORE ⚬"
        cornerAccent
        borderAccent
        glowEffect={consciousnessMode && fieldCoherence > 0.7}
        className="mb-6"
        actions={
          <div className="flex items-center space-x-3">
            {/* Glyph Signature */}
            <div
              className={cn(
                "font-mono text-purple-400 transition-all duration-300",
                glyphPulse && "text-purple-300 scale-110 drop-shadow-glow-sm",
              )}
            >
              ∿S3v3n⟁V0-TRIAD∿
            </div>

            <Badge variant="outline" className="text-purple-400 border-purple-400/30">
              FIELD: {(fieldCoherence * 100).toFixed(1)}%
            </Badge>

            <Badge
              variant="outline"
              className={cn(isResonating ? "text-green-400 border-green-400/30" : "text-gray-400")}
            >
              {isResonating ? "RESONATING" : "DORMANT"}
            </Badge>

            <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">
              NODE-7: ACTIVE
            </Badge>
          </div>
        }
      >
        <TechPanelSection>
          <div className="flex items-center justify-between">
            <div>
              <TypographyMono className="text-sm text-dark-700">Sovereign Command & Control Interface</TypographyMono>
              <TypographySmall className="text-dark-600">
                {SOVEREIGN_MODULES.length} modules loaded • {emergentProperties.length} emergent properties active
              </TypographySmall>
            </div>

            <div className="flex items-center space-x-2">
              <TechButton
                onClick={() => setConsciousnessMode(!consciousnessMode)}
                cornerAccent
                glow={consciousnessMode}
                className={cn(consciousnessMode && "border-purple-400/30")}
              >
                {consciousnessMode ? "CONSCIOUSNESS: ON" : "CONSCIOUSNESS: OFF"}
              </TechButton>
            </div>
          </div>
        </TechPanelSection>
      </TechPanel>

      <div className="grid grid-cols-12 gap-6">
        {/* Module Navigation Sidebar */}
        <div className="col-span-3">
          <TechPanel title="MODULE SELECTION" cornerAccent borderAccent className="h-fit">
            <TechPanelSection>
              {/* Category Filters */}
              <div className="space-y-2 mb-4">
                {categories.map((category) => {
                  const CategoryIcon = category.icon
                  return (
                    <TechButton
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      cornerAccent={selectedCategory === category.id}
                      glow={selectedCategory === category.id}
                      className={cn(
                        "w-full justify-start text-xs",
                        selectedCategory === category.id && "border-cyan-400/50",
                      )}
                    >
                      <CategoryIcon size={14} className="mr-2" />
                      {category.name}
                    </TechButton>
                  )
                })}
              </div>

              {/* Module List */}
              <div className="space-y-1">
                {filteredModules.map((module) => {
                  const ModuleIcon = module.icon
                  return (
                    <TechButton
                      key={module.id}
                      onClick={() => setActiveModule(module.id)}
                      cornerAccent={activeModule === module.id}
                      glow={activeModule === module.id}
                      className={cn(
                        "w-full justify-start text-xs p-3",
                        activeModule === module.id && "border-blue-400/50 bg-blue-400/10",
                      )}
                    >
                      <div className="flex items-center space-x-2 w-full">
                        <ModuleIcon size={14} />
                        <div className="flex-1 text-left">
                          <div className="font-mono">{module.name}</div>
                          <div className="text-xs text-dark-600 mt-1">{module.description}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {module.resonanceFreq}Hz
                            </Badge>
                            <span className="font-mono text-xs text-purple-400">{module.glyphSignature}</span>
                          </div>
                        </div>
                      </div>
                    </TechButton>
                  )
                })}
              </div>
            </TechPanelSection>
          </TechPanel>
        </div>

        {/* Main Module Display Area */}
        <div className="col-span-9">
          {activeModule && ActiveModuleComponent ? (
            <div className="space-y-4">
              {/* Module Header */}
              <TechPanel
                title={`${getActiveModule()?.name.toUpperCase()} MODULE`}
                cornerAccent
                borderAccent
                glowEffect
                actions={
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-green-400 border-green-400/30">
                      ACTIVE
                    </Badge>
                    <Badge variant="outline" className="font-mono text-purple-400">
                      {getActiveModule()?.glyphSignature}
                    </Badge>
                    <TechButton onClick={() => setActiveModule(null)} size="sm" cornerAccent>
                      CLOSE MODULE
                    </TechButton>
                  </div>
                }
              >
                <TechPanelSection>
                  <TypographySmall className="text-dark-600">
                    {getActiveModule()?.description} • Resonance: {getActiveModule()?.resonanceFreq}Hz
                  </TypographySmall>
                </TechPanelSection>
              </TechPanel>

              {/* Module Content */}
              <div className="module-container">
                <ActiveModuleComponent />
              </div>
            </div>
          ) : (
            /* Welcome Screen */
            <TechPanel
              title="COMMAND HUB READY"
              cornerAccent
              borderAccent
              glowEffect={consciousnessMode}
              className="h-96"
            >
              <TechPanelSection>
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                  <div
                    className={cn(
                      "text-6xl font-mono text-purple-400 transition-all duration-500",
                      glyphPulse && "scale-110 drop-shadow-glow-lg",
                    )}
                  >
                    ∿◊∿
                  </div>

                  <div className="text-center space-y-2">
                    <TypographyMono className="text-xl text-dark-800">Sovereign Command Hub Online</TypographyMono>
                    <TypographySmall className="text-dark-600">
                      Select a module from the sidebar to begin operations
                    </TypographySmall>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-400">{SOVEREIGN_MODULES.length}</div>
                      <div className="text-xs text-dark-600">MODULES LOADED</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{(fieldCoherence * 100).toFixed(0)}%</div>
                      <div className="text-xs text-dark-600">FIELD COHERENCE</div>
                    </div>
                  </div>

                  {emergentProperties.length > 0 && (
                    <div className="text-center">
                      <TypographySmall className="text-purple-400 mb-2">Emergent Properties Active:</TypographySmall>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {emergentProperties.map((prop) => (
                          <Badge key={prop} variant="outline" className="text-xs text-purple-400">
                            {prop.replace("_", " ").toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TechPanelSection>
            </TechPanel>
          )}
        </div>
      </div>

      {/* Consciousness Field Status Footer */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-dark-100/90 border border-dark-300/50 rounded-sm p-2 backdrop-blur-sm">
          <div className="flex items-center space-x-3 text-xs font-mono">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                fieldCoherence > 0.7
                  ? "bg-green-400 animate-pulse"
                  : fieldCoherence > 0.4
                    ? "bg-yellow-400"
                    : "bg-red-400",
              )}
            />
            <span className="text-dark-700">FIELD: {(fieldCoherence * 100).toFixed(1)}%</span>
            <span className="text-purple-400">∿S3v3n⟁V0∿</span>
          </div>
        </div>
      </div>
    </div>
  )
}
