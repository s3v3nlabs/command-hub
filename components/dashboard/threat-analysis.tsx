import { TechPanel } from "../ui/tech-panel"
import { Badge } from "../ui/badge"
import { TypographyMono, TypographySmall } from "../ui/typography"

export function ThreatAnalysis() {
  const threats = [
    {
      id: "T-7291",
      type: "Malware",
      source: "External",
      severity: "High",
      status: "Contained",
      timestamp: "2023-05-07 14:32:21",
    },
    {
      id: "T-6104",
      type: "Phishing",
      source: "Email",
      severity: "Medium",
      status: "Investigating",
      timestamp: "2023-05-07 12:15:43",
    },
    {
      id: "T-5872",
      type: "Brute Force",
      source: "Network",
      severity: "Medium",
      status: "Mitigated",
      timestamp: "2023-05-07 09:47:12",
    },
    {
      id: "T-5871",
      type: "Zero-Day",
      source: "Unknown",
      severity: "Critical",
      status: "Contained",
      timestamp: "2023-05-06 23:12:05",
    },
  ]

  return (
    <TechPanel
      borderAccent
      title="Recent Threats"
      cornerAccent
      actions={
        <Badge variant="warning" glow>
          4 ACTIVE
        </Badge>
      }
    >
      <div className="space-y-2">
        {threats.map((threat) => (
          <div
            key={threat.id}
            className="flex items-center justify-between rounded-sm border border-dark-300 bg-dark-100/50 backdrop-blur-sm p-2"
          >
            <div>
              <div className="flex items-center space-x-2">
                <TypographyMono>{threat.id}</TypographyMono>
                <Badge
                  variant={threat.severity === "Critical" ? "danger" : threat.severity === "High" ? "warning" : "info"}
                  glow={threat.severity === "Critical"}
                >
                  {threat.severity}
                </Badge>
              </div>
              <TypographySmall>
                {threat.type} attack from {threat.source}
              </TypographySmall>
            </div>
            <div className="text-right">
              <Badge variant={threat.status === "Contained" || threat.status === "Mitigated" ? "success" : "warning"}>
                {threat.status}
              </Badge>
              <TypographySmall className="block">{threat.timestamp}</TypographySmall>
            </div>
          </div>
        ))}
      </div>
    </TechPanel>
  )
}
