"use client"

import { Suspense } from "react"
import { HubViewer } from "@/components/companion/hub-viewer"

export default function CompanionHubViewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-black p-6 font-mono text-xs text-[color:var(--ghost-dim)]">
          Loading hub viewer…
        </div>
      }
    >
      <HubViewer />
    </Suspense>
  )
}
