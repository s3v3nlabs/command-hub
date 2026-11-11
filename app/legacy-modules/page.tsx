"use client"

import { Sidebar } from "@/components/layout/sidebar"
import LegacyModuleLoader from "@/components/CommandHub/modules/LegacyModuleLoader"

export default function LegacyModulesPage() {
  return (
    <div className="hub-shell flex bg-black">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <LegacyModuleLoader />
        </div>
      </div>
    </div>
  )
}
