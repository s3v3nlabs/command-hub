"use client"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { TechPanel, TechPanelSection } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { TypographyHeading2, TypographyMono } from "@/components/ui/typography"
import { BarChart3 } from "lucide-react"

const modules = [
  {
    title: "CCTV Surveillance",
    route: "/intelligence/cctv",
    status: "online",
    description: "Monitor security camera feeds and alerts",
  },
  {
    title: "OSINT Operations",
    route: "/intelligence/osint",
    status: "online",
    description: "Open-source intelligence gathering and analysis",
  },
  {
    title: "Shodan Scanner",
    route: "/intelligence/shodan",
    status: "online",
    description: "Internet-wide device and vulnerability scanning",
  },
  {
    title: "Kepler Geospatial",
    route: "/intelligence/hunter",
    status: "online",
    description: "Advanced geospatial intelligence and mapping",
  },
  {
    title: "Signal Intelligence",
    route: "/intelligence/signal",
    status: "standby",
    description: "Radio frequency monitoring and analysis",
  },
  {
    title: "Recruitment Analysis",
    route: "/intelligence/recruit",
    status: "online",
    description: "Talent identification and assessment",
  },
  {
    title: "Secure Messaging",
    route: "/intelligence/secure",
    status: "online",
    description: "Encrypted communications platform",
  },
  {
    title: "Vault Streams",
    route: "/intelligence/vault-streams",
    status: "online",
    description: "Monitor and analyze vault activity logs",
  },
]

export default function IntelligenceDashboard() {
  return (
    <div className="flex flex-col h-screen">
      <Header title="INTELLIGENCE DASHBOARD" />

      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TechPanel className="md:col-span-2 lg:col-span-3" cornerAccent borderAccent>
            <div className="flex items-center justify-between">
              <TypographyHeading2>Intelligence Operations</TypographyHeading2>
              <div className="flex items-center space-x-2">
                <StatusIndicator status="online" pulse />
                <TypographyMono>SYSTEM READY</TypographyMono>
              </div>
            </div>
            <p className="text-dark-600 mt-2">
              Select an intelligence module to begin surveillance and data collection operations. All modules are
              operating under standard security protocols.
            </p>
            <div className="mt-4 pt-4 border-t border-dark-300/20">
              <Link href="/">
                <TechButton
                  variant="outline"
                  cornerAccent
                  glow
                  className="w-full"
                  icon={<BarChart3 className="w-4 h-4" />}
                >
                  RETURN TO MAIN INTERFACE
                </TechButton>
              </Link>
            </div>
          </TechPanel>

          {modules.map((mod, idx) => (
            <Link href={mod.route} key={idx} className="block">
              <TechPanel className="h-full transition-all hover:border-dark-400" cornerAccent>
                <TechPanelSection>
                  <div className="flex justify-between items-start mb-2">
                    <TypographyMono className="font-bold">{mod.title}</TypographyMono>
                    <StatusIndicator status={mod.status as any} size="sm" />
                  </div>
                  <p className="text-sm text-dark-600 mb-4">{mod.description}</p>
                  <TechButton className="w-full" cornerAccent>
                    ACCESS MODULE
                  </TechButton>
                </TechPanelSection>
              </TechPanel>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
