import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { NetworkStatus } from "@/components/dashboard/network-status"
import { Window } from "@/components/ui/window"
import { NetworkIcon } from "@/components/ui/icons"
import { GridItem, GridLayout } from "@/components/ui/grid-layout"
import { TechPanel } from "@/components/ui/tech-panel"
import { TypographyHeading2, TypographyMono } from "@/components/ui/typography"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"

export default function NetworkSecurityPage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800 dot-bg">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="NETWORK SECURITY" />
        <main className="hub-shell-scroll p-6">
          <Window
            title="NETWORK PROTECTION"
            icon={<NetworkIcon size={16} />}
            variant="glass"
            size="full"
            className="mb-6"
          >
            <GridLayout className="gap-6">
              <GridItem colSpan={2}>
                <TechPanel cornerAccent borderAccent>
                  <div className="flex items-center justify-between mb-4">
                    <TypographyHeading2>Network Status</TypographyHeading2>
                    <div className="flex items-center space-x-2">
                      <StatusIndicator status="online" pulse />
                      <TypographyMono>FIREWALL ACTIVE</TypographyMono>
                    </div>
                  </div>
                  <NetworkStatus />
                </TechPanel>
              </GridItem>
              <GridItem colSpan={1}>
                <TechPanel cornerAccent borderAccent>
                  <TypographyHeading2 className="mb-4">Firewall Controls</TypographyHeading2>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Intrusion Prevention</span>
                      <Badge variant="outline">ACTIVE</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Deep Packet Inspection</span>
                      <Badge variant="outline">ACTIVE</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Geo-blocking</span>
                      <Badge variant="outline">ENABLED</Badge>
                    </div>
                    <div className="mt-4 space-y-2">
                      <TechButton className="w-full" cornerAccent>
                        UPDATE RULES
                      </TechButton>
                      <TechButton className="w-full" cornerAccent>
                        VIEW LOGS
                      </TechButton>
                    </div>
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
