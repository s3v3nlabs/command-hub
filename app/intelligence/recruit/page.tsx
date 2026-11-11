"use client"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Window } from "@/components/ui/window"
import { User } from "lucide-react"
import RecruitmentModule from "@/components/CommandHub/legacy/RecruitmentModule"

export default function RecruitPage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800 dot-bg">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="GIFTED RECRUITMENT" />
        <main className="hub-shell-scroll p-6">
          <Window
            title="SPECIALIZED TALENT ACQUISITION"
            icon={<User size={16} />}
            variant="glass"
            size="full"
            className="mb-6"
          >
            <RecruitmentModule />
          </Window>
        </main>
      </div>
    </div>
  )
}
