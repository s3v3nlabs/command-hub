"use client"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Window } from "@/components/ui/window"
import { Lock } from "lucide-react"
import SecureMessages from "@/components/CommandHub/legacy/SecureMessages"

export default function SecureMessagesPage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800 dot-bg">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="SECURE MESSAGES" />
        <main className="hub-shell-scroll p-6">
          <Window
            title="ENCRYPTED COMMUNICATION CHANNEL"
            icon={<Lock size={16} />}
            variant="glass"
            size="full"
            className="mb-6"
          >
            <SecureMessages />
          </Window>
        </main>
      </div>
    </div>
  )
}
