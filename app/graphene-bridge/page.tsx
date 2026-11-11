"use client"

import { Sidebar } from "@/components/layout/sidebar"
import GrapheneBridge from "@/components/CommandHub/modules/GrapheneBridge"

export default function GrapheneBridgePage() {
  return (
    <div className="hub-shell flex bg-black">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <GrapheneBridge />
        </div>
      </div>
    </div>
  )
}
