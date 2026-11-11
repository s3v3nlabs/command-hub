"use client"

import { Sidebar } from "@/components/layout/sidebar"
import CommandHubExplorer from "@/components/CommandHub/modules/CommandHubExplorer"

export default function FileExplorerPage() {
  return (
    <div className="hub-shell flex bg-black">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <CommandHubExplorer />
        </div>
      </div>
    </div>
  )
}
