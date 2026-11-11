import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Window } from "@/components/ui/window"
import { FileBarChartIcon } from "lucide-react"
import { TechPanel } from "@/components/ui/tech-panel"
import { TypographyHeading2, TypographyMono } from "@/components/ui/typography"
import { TechButton } from "@/components/ui/tech-button"
import { GridItem, GridLayout } from "@/components/ui/grid-layout"
import { Badge } from "@/components/ui/badge"

export default function ReportsPage() {
  const reports = [
    { id: 1, name: "Security Audit", date: "2023-05-01", status: "complete" },
    { id: 2, name: "Network Vulnerability Scan", date: "2023-05-03", status: "complete" },
    { id: 3, name: "Threat Intelligence", date: "2023-05-05", status: "in-progress" },
    { id: 4, name: "System Performance", date: "2023-05-07", status: "complete" },
    { id: 5, name: "User Activity", date: "2023-05-08", status: "scheduled" },
  ]

  return (
    <div className="hub-shell flex bg-dark-base text-dark-800 dot-bg">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="REPORTS & ANALYTICS" />
        <main className="hub-shell-scroll p-6">
          <Window
            title="SECURITY REPORTS"
            icon={<FileBarChartIcon size={16} />}
            variant="glass"
            size="full"
            className="mb-6"
          >
            <GridLayout className="gap-6">
              <GridItem colSpan={2}>
                <TechPanel cornerAccent borderAccent>
                  <TypographyHeading2 className="mb-4">Available Reports</TypographyHeading2>
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="border border-dark-200 p-3 rounded-sm hover:border-dark-400 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <TypographyMono className="font-bold">{report.name}</TypographyMono>
                            <div className="text-xs text-dark-600">Generated: {report.date}</div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge
                              variant={
                                report.status === "complete"
                                  ? "success"
                                  : report.status === "in-progress"
                                    ? "warning"
                                    : "outline"
                              }
                            >
                              {report.status.toUpperCase()}
                            </Badge>
                            <TechButton size="sm" cornerAccent>
                              VIEW
                            </TechButton>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TechPanel>
              </GridItem>
              <GridItem colSpan={1}>
                <TechPanel cornerAccent borderAccent>
                  <TypographyHeading2 className="mb-4">Report Actions</TypographyHeading2>
                  <div className="space-y-3">
                    <TechButton className="w-full" cornerAccent>
                      GENERATE NEW REPORT
                    </TechButton>
                    <TechButton className="w-full" cornerAccent>
                      SCHEDULE REPORT
                    </TechButton>
                    <TechButton className="w-full" cornerAccent>
                      EXPORT ALL REPORTS
                    </TechButton>
                  </div>
                </TechPanel>

                <TechPanel cornerAccent borderAccent className="mt-6">
                  <TypographyHeading2 className="mb-4">Report Settings</TypographyHeading2>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Auto-generate Reports</span>
                      <Badge variant="outline">ENABLED</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Email Notifications</span>
                      <Badge variant="outline">ENABLED</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Retention Period</span>
                      <span className="text-sm">90 DAYS</span>
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
