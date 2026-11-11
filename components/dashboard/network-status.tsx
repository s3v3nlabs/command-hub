import { TechPanel } from "../ui/tech-panel"
import { Badge } from "../ui/badge"
import { DataDisplay } from "../ui/data-display"

export function NetworkStatus() {
  return (
    <TechPanel
      borderAccent
      title="Network Status"
      cornerAccent
      actions={
        <Badge variant="success" glow>
          SECURE
        </Badge>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <DataDisplay label="Bandwidth Usage" value={42.7} unit="Mbps" trend="stable" trendValue="Normal traffic" />
        <DataDisplay label="Active Connections" value={183} trend="up" trendValue="+12 in last hour" />
        <DataDisplay label="Packet Loss" value={0.02} unit="%" trend="down" trendValue="Optimal" />
        <DataDisplay label="Latency" value={24} unit="ms" trend="stable" trendValue="Good" />
      </div>
    </TechPanel>
  )
}
