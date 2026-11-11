import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { ThreatAnalysis } from "@/components/dashboard/threat-analysis"
import { Window } from "@/components/ui/window"
import { ThreatIcon } from "@/components/ui/icons"
import { GridItem, GridLayout } from "@/components/ui/grid-layout"
import { TechPanel } from "@/components/ui/tech-panel"
import { TypographyHeading2, TypographyMono } from "@/components/ui/typography"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { TechButton } from "@/components/ui/tech-button"

export default function ThreatAnalysisPage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800 dot-bg">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="THREAT ANALYSIS" />
        <main className="hub-shell-scroll p-6">
          <Window
            title="THREAT ASSESSMENT"
            icon={<ThreatIcon size={16} />}
            variant="glass"
            size="full"
            className="mb-6"
          >
            <GridLayout className="gap-6">
              <GridItem colSpan={3}>
                <TechPanel cornerAccent borderAccent>
                  <div className="flex items-center justify-between mb-4">
                    <TypographyHeading2>Active Threat Analysis</TypographyHeading2>
                    <div className="flex items-center space-x-2">
                      <StatusIndicator status="warning" pulse />
                      <TypographyMono>THREATS DETECTED</TypographyMono>
                    </div>
                  </div>
                  <ThreatAnalysis />
                </TechPanel>
              </GridItem>
              <GridItem colSpan={1}>
                <TechPanel cornerAccent borderAccent>
                  <TypographyHeading2 className="mb-4">Threat Response</TypographyHeading2>
                  <div className="space-y-3">
                    <TechButton className="w-full" cornerAccent>
                      INITIATE SCAN
                    </TechButton>
                    <TechButton className="w-full" cornerAccent>
                      UPDATE SIGNATURES
                    </TechButton>
                    <TechButton className="w-full" cornerAccent variant="danger">
                      QUARANTINE THREATS
                    </TechButton>
                  </div>
                </TechPanel>
              </GridItem>
            </GridLayout>
          </Window>
        </main>
      </div>
    </div>
  )
}
