"use client"

import type React from "react"

import { useState } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Eye, Database, Globe, Lock, Radio, Zap } from "lucide-react"
import { TypographyMono, TypographySmall } from "@/components/ui/typography"

interface ModuleTogglesProps {
  className?: string
}

interface Module {
  id: string
  name: string
  description: string
  enabled: boolean
  icon: React.ReactNode
  status: "operational" | "degraded" | "offline"
  type: "core" | "extension"
}

export function ModuleToggles({ className }: ModuleTogglesProps) {
  const [modules, setModules] = useState<Module[]>([
    {
      id: "sightline",
      name: "SightLine",
      description: "Advanced visual recognition and pattern matching",
      enabled: true,
      icon: <Eye size={16} />,
      status: "operational",
      type: "core",
    },
    {
      id: "osint",
      name: "OSINT",
      description: "Open-source intelligence gathering and analysis",
      enabled: true,
      icon: <Globe size={16} />,
      status: "operational",
      type: "core",
    },
    {
      id: "vault",
      name: "Vault",
      description: "Secure credential and key management",
      enabled: true,
      icon: <Lock size={16} />,
      status: "operational",
      type: "core",
    },
    {
      id: "nexus",
      name: "Nexus",
      description: "Distributed database and knowledge graph",
      enabled: false,
      icon: <Database size={16} />,
      status: "offline",
      type: "extension",
    },
    {
      id: "pulse",
      name: "Pulse",
      description: "Real-time signal processing and analysis",
      enabled: true,
      icon: <Radio size={16} />,
      status: "degraded",
      type: "extension",
    },
    {
      id: "catalyst",
      name: "Catalyst",
      description: "Automated workflow and process acceleration",
      enabled: false,
      icon: <Zap size={16} />,
      status: "offline",
      type: "extension",
    },
  ])

  const toggleModule = (id: string) => {
    setModules((prevModules) =>
      prevModules.map((module) =>
        module.id === id
          ? {
              ...module,
              enabled: !module.enabled,
              status: !module.enabled ? "operational" : "offline",
            }
          : module,
      ),
    )
  }

  const getStatusBadge = (status: Module["status"]) => {
    switch (status) {
      case "operational":
        return (
          <Badge variant="success" className="text-[10px] px-1 py-0">
            OPERATIONAL
          </Badge>
        )
      case "degraded":
        return (
          <Badge variant="warning" className="text-[10px] px-1 py-0">
            DEGRADED
          </Badge>
        )
      case "offline":
        return (
          <Badge variant="outline" className="text-[10px] px-1 py-0">
            OFFLINE
          </Badge>
        )
    }
  }

  return (
    <TechPanel
      variant="default"
      cornerAccent
      borderAccent
      title="MODULE TOGGLES"
      className={cn("flex flex-col h-full", className)}
      actions={
        <Badge variant="outline" className="text-[10px]">
          {modules.filter((m) => m.enabled).length}/{modules.length} ACTIVE
        </Badge>
      }
    >
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-2 space-y-2">
          {modules.map((module) => (
            <div
              key={module.id}
              className={cn(
                "border rounded-sm p-2 transition-all duration-200 hover:shadow-sm",
                module.enabled
                  ? "border-dark-300 bg-dark-100/10 hover:bg-dark-100/20"
                  : "border-dark-300/30 bg-dark-100/5 hover:bg-dark-100/10",
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className={cn("flex-shrink-0 text-dark-500", module.enabled && "text-dark-800")}>
                    {module.icon}
                  </div>
                  <TypographyMono
                    className={cn("text-sm truncate", module.enabled ? "text-dark-800" : "text-dark-500")}
                  >
                    {module.name}
                  </TypographyMono>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {getStatusBadge(module.status)}
                  <Switch
                    checked={module.enabled}
                    onCheckedChange={() => toggleModule(module.id)}
                    className="scale-75"
                  />
                </div>
              </div>
              <TypographySmall className="text-dark-500 text-xs leading-tight mb-2 break-words">
                {module.description}
              </TypographySmall>
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="text-[9px] px-1 py-0">
                  {module.type.toUpperCase()}
                </Badge>
                {module.enabled && (
                  <div className="text-[9px] text-dark-600">Last ping: {Math.floor(Math.random() * 60)}s ago</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </TechPanel>
  )
}
