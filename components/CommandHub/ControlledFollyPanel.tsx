"use client"

import { useState } from "react"
import { TechPanel, TechPanelSection } from "@/components/ui/tech-panel"
import { Input } from "@/components/ui/input"
import { TypographyMono } from "@/components/ui/typography"
import { controlledFollyEngine, type ControlledFollyPrinciple } from "@/lib/doctrine/controlled-folly"
import { Infinity } from "lucide-react"

export default function ControlledFollyPanel() {
  const [currentSituation, setCurrentSituation] = useState("")
  const [guidance, setGuidance] = useState<ControlledFollyPrinciple[]>([])
  const [activeSignature, setActiveSignature] = useState("")

  const handleSituationChange = (situation: string) => {
    setCurrentSituation(situation)
    if (situation.trim()) {
      const newGuidance = controlledFollyEngine.getGuidance(situation)
      setGuidance(newGuidance)
      setActiveSignature(controlledFollyEngine.generateQuantumSignature())
    } else {
      setGuidance([])
      setActiveSignature("")
    }
  }

  return (
    <TechPanel title="CONTROLLED FOLLY GUIDANCE" cornerAccent borderAccent icon={<Infinity size={16} />}>
      <TechPanelSection>
        <div className="space-y-4">
          <div>
            <TypographyMono className="text-xs mb-2">CURRENT SITUATION:</TypographyMono>
            <Input
              value={currentSituation}
              onChange={(e) => handleSituationChange(e.target.value)}
              placeholder="Describe your current decision point..."
              className="bg-dark-100 border-dark-300 text-dark-800 placeholder-dark-600"
            />
          </div>

          {activeSignature && (
            <div>
              <TypographyMono className="text-xs mb-1">QUANTUM SIGNATURE:</TypographyMono>
              <div className="font-mono text-xs text-purple-400 bg-dark-100 p-2 rounded border border-dark-300">
                {activeSignature}
              </div>
            </div>
          )}

          {guidance.length > 0 && (
            <div className="space-y-3">
              <TypographyMono className="text-xs">APPLICABLE PRINCIPLES:</TypographyMono>
              {guidance.map((principle, index) => (
                <div key={index} className="p-3 bg-dark-100 border border-dark-300 rounded">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{principle.symbol}</span>
                    <TypographyMono className="text-sm font-bold">{principle.name}</TypographyMono>
                  </div>
                  <div className="text-xs text-dark-600 mb-2">{principle.resonance}</div>
                  <div className="text-xs text-dark-700">{principle.application}</div>
                  {principle.warning && <div className="text-xs text-amber-600 mt-2 italic">⚠ {principle.warning}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </TechPanelSection>
    </TechPanel>
  )
}
