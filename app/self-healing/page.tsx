import { SelfHealingAgentCore } from "@/components/integrations/SelfHealingAgentCore"
import { SelfHealingVault } from "@/components/integrations/SelfHealingVault"
import { SelfHealingReplay } from "@/components/integrations/SelfHealingReplay"
import { AutonomyGovernor } from "@/components/integrations/AutonomyGovernor"
import { SelfHealingRouterProvider } from "@/components/integrations/SelfHealingRouter"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Window } from "@/components/ui/window"
import { BrainCircuitIcon } from "lucide-react"
import { TechPanel } from "@/components/ui/tech-panel"
import { TypographyHeading2 } from "@/components/ui/typography"
import { GridItem, GridLayout } from "@/components/ui/grid-layout"

export default function SelfHealingPage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800 dot-bg">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="SELF-HEALING SYSTEM" />
        <main className="hub-shell-scroll p-6">
          <Window
            title="AUTONOMOUS REPAIR SYSTEM"
            icon={<BrainCircuitIcon size={16} />}
            variant="glass"
            size="full"
            className="mb-6"
          >
            <SelfHealingRouterProvider>
              <GridLayout className="gap-6">
                <GridItem colSpan={2}>
                  <TechPanel cornerAccent borderAccent>
                    <TypographyHeading2 className="mb-4">Agent Core</TypographyHeading2>
                    <SelfHealingAgentCore />
                  </TechPanel>
                </GridItem>
                <GridItem colSpan={2}>
                  <TechPanel cornerAccent borderAccent>
                    <TypographyHeading2 className="mb-4">Vault</TypographyHeading2>
                    <SelfHealingVault />
                  </TechPanel>
                </GridItem>
                <GridItem colSpan={2}>
                  <TechPanel cornerAccent borderAccent>
                    <TypographyHeading2 className="mb-4">Replay System</TypographyHeading2>
                    <SelfHealingReplay />
                  </TechPanel>
                </GridItem>
                <GridItem colSpan={2}>
                  <TechPanel cornerAccent borderAccent>
                    <TypographyHeading2 className="mb-4">Autonomy Governor</TypographyHeading2>
                    <AutonomyGovernor />
                  </TechPanel>
                </GridItem>
              </GridLayout>
            </SelfHealingRouterProvider>
          </Window>
        </main>
      </div>
    </div>
  )
}
