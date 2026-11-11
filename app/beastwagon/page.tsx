"use client"

import { Suspense } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import BeastWagonVisualization from "@/components/CommandHub/modules/BeastWagonVisualization"
import { TechPanel } from "@/components/ui/tech-panel"
import { Skeleton } from "@/components/ui/skeleton"

function BeastWagonLoading() {
  return (
    <div className="space-y-4">
      <TechPanel title="LOADING BEASTWAGON-77..." cornerAccent borderAccent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </TechPanel>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Skeleton className="h-96 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  )
}

export default function BeastWagonPage() {
  return (
    <div className="hub-shell flex bg-black">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Suspense fallback={<BeastWagonLoading />}>
            <BeastWagonVisualization />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
