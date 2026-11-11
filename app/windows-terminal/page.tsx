"use client"

import { Sidebar } from "@/components/layout/sidebar"
import WindowsTerminal from "@/components/CommandHub/modules/WindowsTerminal"

export default function WindowsTerminalPage() {
  return (
    <div className="hub-shell flex bg-black">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <WindowsTerminal />
        </div>
      </div>
    </div>
  )
}
