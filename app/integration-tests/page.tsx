"use client"

import { IntegrationTester } from "@/components/testing/integration-tester"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"

export default function IntegrationTestsPage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800 dot-bg">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="INTEGRATION TESTING" />
        <main className="hub-shell-scroll p-6">
          <IntegrationTester />
        </main>
      </div>
    </div>
  )
}
