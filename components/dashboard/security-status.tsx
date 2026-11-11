import { TechPanel, TechPanelDivider } from "../ui/tech-panel"
import { ProgressBar } from "../ui/progress-bar"
import { DataDisplay } from "../ui/data-display"
import { Badge } from "../ui/badge"

export function SecurityStatus() {
  return (
    <TechPanel
      borderAccent
      glowEffect
      title="Security Status"
      cornerAccent
      actions={<Badge variant="success">ACTIVE</Badge>}
    >
      <div className="space-y-4">
        <ProgressBar value={78} max={100} label="System Integrity" showValue variant="success" size="md" />
        <ProgressBar value={65} max={100} label="Firewall Strength" showValue variant="info" size="md" />
        <ProgressBar value={42} max={100} label="Intrusion Detection" showValue variant="warning" size="md" />

        <TechPanelDivider />

        <div className="grid grid-cols-2 gap-4">
          <DataDisplay label="Active Threats" value={3} trend="down" trendValue="2 less than yesterday" />
          <DataDisplay label="Security Score" value={742} trend="up" trendValue="+15 points" />
        </div>
      </div>
    </TechPanel>
  )
}
