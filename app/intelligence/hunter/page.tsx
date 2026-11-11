"use client"

import KeplerMap from "@/components/CommandHub/legacy/KeplerMap"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { TypographyHeading2 } from "@/components/ui/typography"

export default function KeplerMapPage() {
  return (
    <div className="flex flex-col h-screen">
      <Header title="KEPLER GEOSPATIAL" />

      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <TypographyHeading2>Geospatial Intelligence</TypographyHeading2>
          <Link href="/intelligence">
            <TechButton variant="outline" size="sm" cornerAccent>
              Return to Intelligence Hub
            </TechButton>
          </Link>
        </div>

        <TechPanel className="p-4 h-[calc(100vh-200px)]" cornerAccent borderAccent>
          <KeplerMap />
        </TechPanel>
      </div>
    </div>
  )
}
