"use client"

import { EnvironmentManager } from "@/components/config/environment-manager"
import { LearningDashboard } from "@/components/learning/learning-dashboard"
import { RepairSimulator } from "@/components/simulation/repair-simulator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SystemConfigPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">System Configuration & Learning</h1>
        <p className="text-gray-400">
          Configure environment variables, manage AI integrations, and monitor the learning system.
        </p>
      </div>

      <Tabs defaultValue="environment" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="environment">Environment & AI</TabsTrigger>
          <TabsTrigger value="learning">Learning System</TabsTrigger>
          <TabsTrigger value="simulation">Repair Simulation</TabsTrigger>
        </TabsList>

        <TabsContent value="environment">
          <EnvironmentManager />
        </TabsContent>

        <TabsContent value="learning">
          <LearningDashboard />
        </TabsContent>

        <TabsContent value="simulation">
          <RepairSimulator />
        </TabsContent>
      </Tabs>
    </div>
  )
}
