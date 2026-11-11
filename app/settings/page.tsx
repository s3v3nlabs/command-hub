import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Window } from "@/components/ui/window"
import { SettingsIcon } from "lucide-react"
import { TechPanel } from "@/components/ui/tech-panel"
import { TypographyHeading2, TypographyMono } from "@/components/ui/typography"
import { TechButton } from "@/components/ui/tech-button"
import { GridItem, GridLayout } from "@/components/ui/grid-layout"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SettingsPage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800 dot-bg">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="SYSTEM SETTINGS" />
        <main className="hub-shell-scroll p-6">
          <Window title="CONFIGURATION" icon={<SettingsIcon size={16} />} variant="glass" size="full" className="mb-6">
            <GridLayout className="gap-6">
              <GridItem colSpan={2}>
                <TechPanel cornerAccent borderAccent>
                  <TypographyHeading2 className="mb-4">System Configuration</TypographyHeading2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <TypographyMono className="text-sm">System Version</TypographyMono>
                        <span className="text-sm">v3.7.2</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <TypographyMono className="text-sm">Last Updated</TypographyMono>
                        <span className="text-sm">2023-05-05</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <TypographyMono className="text-sm">Environment</TypographyMono>
                        <Badge variant="outline">PRODUCTION</Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <TypographyMono className="text-sm">Auto Updates</TypographyMono>
                        <Badge variant="outline">ENABLED</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <TypographyMono className="text-sm">Telemetry</TypographyMono>
                        <Badge variant="outline">DISABLED</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <TypographyMono className="text-sm">Debug Mode</TypographyMono>
                        <Badge variant="outline">DISABLED</Badge>
                      </div>
                    </div>
                  </div>
                </TechPanel>
              </GridItem>
              <GridItem colSpan={1}>
                <TechPanel cornerAccent borderAccent>
                  <TypographyHeading2 className="mb-4">Interface Settings</TypographyHeading2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center gap-3">
                      <div>
                        <TypographyMono className="text-sm">Theme / Accent</TypographyMono>
                        <p className="text-[10px] text-dark-500 font-mono mt-1">
                          Ghostlight default · light/dark + palette (persisted)
                        </p>
                      </div>
                      <ThemeToggle />
                    </div>
                    <div className="flex justify-between items-center">
                      <TypographyMono className="text-sm">Animation Effects</TypographyMono>
                      <Badge variant="outline">ENABLED</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <TypographyMono className="text-sm">Sound Effects</TypographyMono>
                      <Badge variant="outline">ENABLED</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <TypographyMono className="text-sm">Notifications</TypographyMono>
                      <Badge variant="outline">ENABLED</Badge>
                    </div>
                  </div>
                </TechPanel>

                <TechPanel cornerAccent borderAccent className="mt-6">
                  <TypographyHeading2 className="mb-4">Actions</TypographyHeading2>
                  <div className="space-y-3">
                    <TechButton className="w-full" cornerAccent>
                      CHECK FOR UPDATES
                    </TechButton>
                    <TechButton className="w-full" cornerAccent>
                      RESET TO DEFAULTS
                    </TechButton>
                    <TechButton className="w-full" cornerAccent variant="danger">
                      FACTORY RESET
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
