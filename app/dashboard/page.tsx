'use client'

import { AppShell } from '@/components/app-shell'
import { BentoDashboard } from '@/components/dashboard/bento-dashboard'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

export default function DashboardPage() {
  useKeyboardShortcuts()

  return (
    <AppShell>
      <div className="p-6">
        <BentoDashboard />
      </div>
    </AppShell>
  )
}
