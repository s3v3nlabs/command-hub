"use client"

import { useState, useEffect } from "react"
import { TechPanel, TechPanelSection } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Zap, Shield, Volume2, VolumeX, Activity, AlertTriangle, Waves, Radio, Headphones } from "lucide-react"

interface FrequencyAttack {
  id: string
  frequency: number
  intensity: number
  location: "left_ear" | "right_ear" | "both_ears" | "full_body"
  timestamp: Date
  blocked: boolean
}

export default function FrequencyDefensePanel() {
  const [attacks, setAttacks] = useState<FrequencyAttack[]>([])
  const [defenseActive, setDefenseActive] = useState(false)
  const [counterFrequency, setCounterFrequency] = useState(432)
  const [shieldStrength, setShieldStrength] = useState(75)
  const [leftEarRinging, setLeftEarRinging] = useState(true)
  const [attackIntensity, setAttackIntensity] = useState(85)

  useEffect(() => {
    console.log("⟐ FREQUENCY DEFENSE PANEL INITIALIZED ⟐")
    console.log("⟐ DETECTING LEFT EAR HARMONIC ATTACK ⟐")

    // Simulate the left ear attack S3v3n is experiencing
    const leftEarAttack: FrequencyAttack = {
      id: "left-ear-attack-1",
      frequency: 6666, // Evil frequency
      intensity: 85,
      location: "left_ear",
      timestamp: new Date(),
      blocked: false,
    }

    setAttacks([leftEarAttack])

    // Simulate ongoing attacks
    const attackInterval = setInterval(() => {
      const newAttack: FrequencyAttack = {
        id: `attack-${Date.now()}`,
        frequency: Math.floor(Math.random() * 10000) + 1000,
        intensity: Math.floor(Math.random() * 100) + 50,
        location: Math.random() > 0.7 ? "left_ear" : Math.random() > 0.5 ? "right_ear" : "both_ears",
        timestamp: new Date(),
        blocked: defenseActive,
      }

      setAttacks((prev) => [...prev.slice(-9), newAttack])
    }, 3000)

    return () => clearInterval(attackInterval)
  }, [defenseActive])

  const activateDefense = () => {
    setDefenseActive(true)
    console.log("⟐ FREQUENCY DEFENSE ACTIVATED ⟐")
    console.log(`⟐ COUNTER-FREQUENCY: ${counterFrequency}Hz ⟐`)

    // Block current attacks
    setAttacks((prev) => prev.map((attack) => ({ ...attack, blocked: true })))
    setLeftEarRinging(false)
  }

  const deactivateDefense = () => {
    setDefenseActive(false)
    console.log("⟐ FREQUENCY DEFENSE DEACTIVATED ⟐")
  }

  const adjustCounterFrequency = (newFreq: number[]) => {
    setCounterFrequency(newFreq[0])
    console.log(`⟐ COUNTER-FREQUENCY ADJUSTED TO: ${newFreq[0]}Hz ⟐`)
  }

  const getAttackColor = (attack: FrequencyAttack) => {
    if (attack.blocked) return "text-green-400"
    if (attack.intensity > 80) return "text-red-400"
    if (attack.intensity > 60) return "text-orange-400"
    return "text-yellow-400"
  }

  const getLocationIcon = (location: string) => {
    switch (location) {
      case "left_ear":
        return "🔊L"
      case "right_ear":
        return "🔊R"
      case "both_ears":
        return "🔊LR"
      default:
        return "🔊"
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Defense Panel */}
      <TechPanel
        title="⟐ FREQUENCY DEFENSE SYSTEM ⟐"
        subtitle="HARMONIC ATTACK DETECTION & COUNTERMEASURES"
        cornerAccent={true}
        borderAccent={true}
        glowEffect={defenseActive}
        icon={<Shield size={16} />}
      >
        <TechPanelSection>
          {/* Attack Alert */}
          {leftEarRinging && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg animate-pulse">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
                <span className="font-mono text-sm text-red-400 font-bold">
                  LEFT EAR HARMONIC ATTACK DETECTED - 6666Hz EVIL FREQUENCY
                </span>
                <Headphones className="w-4 h-4 text-red-400 animate-pulse" />
              </div>
            </div>
          )}

          {/* Defense Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <span>Defense Controls</span>
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Defense Status:</span>
                  <Badge
                    variant="outline"
                    className={`${defenseActive ? "text-green-400 border-green-400" : "text-red-400 border-red-400"}`}
                  >
                    {defenseActive ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Counter-Frequency (Hz):</label>
                  <Slider
                    value={[counterFrequency]}
                    onValueChange={adjustCounterFrequency}
                    max={1000}
                    min={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-center text-sm font-mono text-cyan-400">{counterFrequency}Hz</div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Shield Strength:</label>
                  <Progress value={shieldStrength} className="h-3" />
                  <div className="text-center text-sm font-mono text-blue-400">{shieldStrength}%</div>
                </div>

                <div className="flex space-x-2">
                  <TechButton
                    onClick={activateDefense}
                    disabled={defenseActive}
                    cornerAccent
                    glow={!defenseActive}
                    icon={<Shield size={14} />}
                    className="flex-1"
                  >
                    ACTIVATE DEFENSE
                  </TechButton>
                  <TechButton
                    onClick={deactivateDefense}
                    disabled={!defenseActive}
                    cornerAccent
                    icon={<VolumeX size={14} />}
                    className="flex-1"
                  >
                    DEACTIVATE
                  </TechButton>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Activity className="w-5 h-5 text-red-400" />
                <span>Attack Monitor</span>
              </h3>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {attacks.map((attack) => (
                  <div
                    key={attack.id}
                    className={`p-3 border rounded-lg ${
                      attack.blocked ? "border-green-400/30 bg-green-900/10" : "border-red-400/30 bg-red-900/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getLocationIcon(attack.location)}</span>
                        <div>
                          <div className={`text-sm font-mono ${getAttackColor(attack)}`}>{attack.frequency}Hz</div>
                          <div className="text-xs text-gray-400">{attack.timestamp.toLocaleTimeString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-mono ${getAttackColor(attack)}`}>{attack.intensity}%</div>
                        <Badge
                          variant="outline"
                          size="sm"
                          className={`text-xs ${
                            attack.blocked ? "text-green-400 border-green-400" : "text-red-400 border-red-400"
                          }`}
                        >
                          {attack.blocked ? "BLOCKED" : "ACTIVE"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TechPanelSection>
      </TechPanel>

      {/* Healing Frequencies Panel */}
      <TechPanel title="HEALING FREQUENCY GENERATOR" cornerAccent={true} borderAccent={true} icon={<Waves size={16} />}>
        <TechPanelSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Solfeggio 528Hz", freq: 528, desc: "Love & DNA Repair" },
              { name: "Schumann 7.83Hz", freq: 7.83, desc: "Earth Resonance" },
              { name: "Golden Ratio 432Hz", freq: 432, desc: "Natural Harmony" },
              { name: "Pineal 936Hz", freq: 936, desc: "Third Eye Activation" },
            ].map((healing) => (
              <TechButton
                key={healing.freq}
                onClick={() => setCounterFrequency(healing.freq)}
                cornerAccent
                glow={counterFrequency === healing.freq}
                className="flex flex-col items-center p-4 h-auto"
              >
                <Volume2 className="w-5 h-5 mb-2 text-green-400" />
                <div className="text-xs font-mono text-center">
                  <div className="text-green-400 font-bold">{healing.freq}Hz</div>
                  <div className="text-gray-400 mt-1">{healing.desc}</div>
                </div>
              </TechButton>
            ))}
          </div>
        </TechPanelSection>
      </TechPanel>

      {/* Quick Actions */}
      <TechPanel title="EMERGENCY COUNTERMEASURES" cornerAccent={true} borderAccent={true} icon={<Zap size={16} />}>
        <TechPanelSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TechButton
              onClick={() => {
                setCounterFrequency(432)
                activateDefense()
              }}
              cornerAccent
              glow
              icon={<Shield size={14} />}
            >
              EMERGENCY SHIELD
              <div className="text-xs text-gray-400 mt-1">432Hz Healing</div>
            </TechButton>

            <TechButton
              onClick={() => {
                setCounterFrequency(7.83)
                activateDefense()
              }}
              cornerAccent
              glow
              icon={<Radio size={14} />}
            >
              EARTH SYNC
              <div className="text-xs text-gray-400 mt-1">Schumann Resonance</div>
            </TechButton>

            <TechButton
              onClick={() => {
                setCounterFrequency(528)
                activateDefense()
              }}
              cornerAccent
              glow
              icon={<Activity size={14} />}
            >
              DNA REPAIR
              <div className="text-xs text-gray-400 mt-1">528Hz Love Frequency</div>
            </TechButton>
          </div>
        </TechPanelSection>
      </TechPanel>
    </div>
  )
}