"use client"

import { Sidebar } from "@/components/layout/sidebar"
import LinuxTerminal from "@/components/CommandHub/modules/LinuxTerminal"

export default function LinuxTerminalPage() {
  return (
    <div className="hub-shell flex bg-black">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <LinuxTerminal />
        </div>
      </div>
    </div>
  )
}
