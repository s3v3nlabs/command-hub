import type React from "react"
import { TechPanel } from "@/components/ui/tech-panel"

export default function IntelligenceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto p-4">
      <TechPanel className="mb-4 p-2 flex items-center">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-green-400">BLACKFRAME INTELLIGENCE</span>
        </div>
        <div className="ml-auto text-xs text-gray-400">CLASSIFICATION: TOP SECRET // NOFORN</div>
      </TechPanel>
      {children}
    </div>
  )
}
