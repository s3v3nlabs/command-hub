"use client"

import ShodanInterface from "@/components/CommandHub/legacy/ShodanInterface"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { TypographyHeading2 } from "@/components/ui/typography"

export default function ShodanScannerPage() {
  return (
    <div className="flex flex-col h-screen">
      <Header title="SHODAN SCANNER" />

      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <TypographyHeading2>Vulnerability Scanner</TypographyHeading2>
          <Link href="/intelligence">
            <TechButton variant="outline" size="sm" cornerAccent>
              Return to Intelligence Hub
            </TechButton>
          </Link>
        </div>

        <TechPanel className="p-4" cornerAccent borderAccent>
          <ShodanInterface />
        </TechPanel>
      </div>
    </div>
  )
}
