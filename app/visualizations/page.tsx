"use client"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import dynamic from "next/dynamic"
import { Window } from "@/components/ui/window"
import { SecurityIcon } from "@/components/ui/icons"
import { TechPanel } from "@/components/ui/tech-panel"
import { TypographyHeading2 } from "@/components/ui/typography"
import { Suspense } from "react"

// Dynamically import 3D components with no SSR to prevent hydration issues
const NetworkVisualization = dynamic(
  () => import("@/components/3d/network-visualization").then((mod) => ({ default: mod.NetworkVisualization })),
  { ssr: false },
)

const ThreatMap = dynamic(() => import("@/components/3d/threat-map").then((mod) => ({ default: mod.ThreatMap })), {
  ssr: false,
})

const SystemHealth = dynamic(
  () => import("@/components/3d/system-health").then((mod) => ({ default: mod.SystemHealth })),
  { ssr: false },
)

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex h-64 items-center justify-center bg-dark-200/50 rounded-md">
    <div className="text-cyan-500 animate-pulse">Loading visualization...</div>
  </div>
)

export default function VisualizationsPage() {
  return (
    <div className="hub-shell flex bg-black text-white">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="SECURITY VISUALIZATIONS" />
        <main className="hub-shell-scroll p-6">
          <Window
            title="3D SECURITY VISUALIZATIONS"
            icon={<SecurityIcon size={16} />}
            variant="glass"
            size="full"
            className="mb-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TechPanel cornerAccent borderAccent>
                <TypographyHeading2 className="mb-4">Network Topology</TypographyHeading2>
                <Suspense fallback={<LoadingFallback />}>
                  <NetworkVisualization />
                </Suspense>
              </TechPanel>

              <TechPanel cornerAccent borderAccent>
                <TypographyHeading2 className="mb-4">Threat Map</TypographyHeading2>
                <Suspense fallback={<LoadingFallback />}>
                  <ThreatMap />
                </Suspense>
              </TechPanel>

              <TechPanel className="lg:col-span-2" cornerAccent borderAccent>
                <TypographyHeading2 className="mb-4">System Health</TypographyHeading2>
                <Suspense fallback={<LoadingFallback />}>
                  <SystemHealth />
                </Suspense>
              </TechPanel>
            </div>
          </Window>
        </main>
      </div>
    </div>
  )
}
