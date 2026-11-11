import { TechPanel } from "../ui/tech-panel"
import { TechButton } from "../ui/tech-button"
import { AlertIcon, NetworkIcon, ReportsIcon, SecurityIcon, SettingsIcon } from "../ui/icons"

export function QuickActions() {
  return (
    <TechPanel borderAccent title="Quick Actions" cornerAccent>
      <div className="grid grid-cols-2 gap-2">
        <TechButton
          variant="default"
          cornerAccent
          glow
          icon={<SecurityIcon size={16} />}
          className="h-10 flex items-center justify-center"
        >
          <span className="truncate">Run System Scan</span>
        </TechButton>
        <TechButton
          variant="default"
          cornerAccent
          glow
          icon={<SettingsIcon size={16} />}
          className="h-10 flex items-center justify-center"
        >
          <span className="truncate">Update Definitions</span>
        </TechButton>
        <TechButton
          variant="default"
          cornerAccent
          glow
          icon={<ReportsIcon size={16} />}
          className="h-10 flex items-center justify-center"
        >
          <span className="truncate">Backup Data</span>
        </TechButton>
        <TechButton
          variant="default"
          cornerAccent
          glow
          icon={<NetworkIcon size={16} />}
          className="h-10 flex items-center justify-center"
        >
          <span className="truncate">Network Diagnostics</span>
        </TechButton>
        <TechButton
          variant="danger"
          cornerAccent
          className="col-span-2 h-10 flex items-center justify-center"
          glow
          icon={<AlertIcon size={16} />}
        >
          <span className="truncate">Lockdown Mode</span>
        </TechButton>
      </div>
    </TechPanel>
  )
}
