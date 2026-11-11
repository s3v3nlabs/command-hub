"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

type ModuleStatus = {
  id: string
  name: string
  description: string
  enabled: boolean
  fixes: number
  approvals: number
  replays: number
}

const MOCK_MODULES: ModuleStatus[] = [
  {
    id: "001",
    name: "SelfHealingAgentCore",
    description: "Main logic core + proposal vault memory",
    enabled: true,
    fixes: 4,
    approvals: 3,
    replays: 1,
  },
  {
    id: "002",
    name: "SelfHealingVault",
    description: "Historical audit + filtering system",
    enabled: true,
    fixes: 5,
    approvals: 5,
    replays: 0,
  },
  {
    id: "003",
    name: "SelfHealingReplay",
    description: "Patch preview + simulation interface",
    enabled: false,
    fixes: 2,
    approvals: 2,
    replays: 2,
  },
]

export function AutonomyGovernor() {
  const [modules, setModules] = useState<ModuleStatus[]>(MOCK_MODULES)

  const toggleModule = (id: string) => {
    setModules((prev) => prev.map((mod) => (mod.id === id ? { ...mod, enabled: !mod.enabled } : mod)))
  }

  return (
    <Card className="p-4 space-y-5">
      <h2 className="text-xl font-semibold">Autonomy Governor Panel</h2>

      <div className="space-y-4">
        {modules.map((mod) => (
          <Card key={mod.id} className="p-3 bg-muted">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="font-semibold text-base">{mod.name}</h3>
                <p className="text-sm text-muted-foreground">{mod.description}</p>
              </div>
              <Switch checked={mod.enabled} onCheckedChange={() => toggleModule(mod.id)} />
            </div>
            <div className="flex gap-3 text-sm">
              <Badge variant="secondary">Fixes: {mod.fixes}</Badge>
              <Badge variant={mod.approvals === mod.fixes ? "default" : "outline"}>Approved: {mod.approvals}</Badge>
              <Badge variant="outline">Replays: {mod.replays}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  )
}
