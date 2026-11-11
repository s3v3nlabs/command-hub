import { ReconScanner } from "@/components/recon/ReconScanner"
import { ZeroDayPulse } from "@/components/recon/ZeroDayPulse"
import { LeakMonitor } from "@/components/recon/LeakMonitor"

export default function ReconPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Reconnaissance Tools</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ReconScanner />
        <ZeroDayPulse />
      </div>

      <div className="mb-8">
        <LeakMonitor />
      </div>
    </div>
  )
}