import { TechPanel } from "../ui/tech-panel"
import { ProgressBar } from "../ui/progress-bar"
import { TypographyMono } from "../ui/typography"

export function SystemResources() {
  return (
    <TechPanel borderAccent title="System Resources" cornerAccent>
      <div className="space-y-4">
        <div>
          <ProgressBar value={32} max={100} label="CPU Usage" showValue variant="info" size="md" />
          <div className="mt-1 grid grid-cols-4 gap-2">
            <div className="text-center">
              <TypographyMono className="text-xs text-dark-600">Core 1</TypographyMono>
              <TypographyMono className="text-xs">28%</TypographyMono>
            </div>
            <div className="text-center">
              <TypographyMono className="text-xs text-dark-600">Core 2</TypographyMono>
              <TypographyMono className="text-xs">42%</TypographyMono>
            </div>
            <div className="text-center">
              <TypographyMono className="text-xs text-dark-600">Core 3</TypographyMono>
              <TypographyMono className="text-xs">35%</TypographyMono>
            </div>
            <div className="text-center">
              <TypographyMono className="text-xs text-dark-600">Core 4</TypographyMono>
              <TypographyMono className="text-xs">23%</TypographyMono>
            </div>
          </div>
        </div>

        <ProgressBar value={58} max={100} label="Memory Usage" showValue variant="info" size="md" />

        <ProgressBar value={72} max={100} label="Storage" showValue variant="warning" size="md" />

        <ProgressBar value={45} max={100} label="Network I/O" showValue variant="info" size="md" />
      </div>
    </TechPanel>
  )
}
