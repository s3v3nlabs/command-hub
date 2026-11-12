"use client"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Window } from "@/components/ui/window"
import LiamERD from "@/components/CommandHub/legacy/LiamERD"

export default function ERDPage() {
  return (
    <div className="hub-shell flex bg-black text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="LIAM ERD / DATABASE STRUCTURE VISUALIZATION" />
        <div className="flex-1 p-6 overflow-hidden">
          <Window title="INVESTIGATION MATRIX" variant="glass" className="w-full h-full">
            <div className="w-full h-full overflow-hidden">
              <LiamERD />
            </div>
          </Window>
        </div>
      </div>
    </div>
  )
}
