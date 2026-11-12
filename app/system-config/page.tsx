"use client"

import { EnvironmentManager } from "@/components/config/environment-manager"
import { LearningDashboard } from "@/components/learning/learning-dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SystemConfigPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">System Configuration</h1>
        <p className="text-gray-400">
          Configure environment variables and inspect the learning system. The repair simulator was removed — it never performed real repairs.
        </p>
      </div>

      <Tabs defaultValue="environment" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="environment">Environment & AI</TabsTrigger>
          <TabsTrigger value="learning">Learning System</TabsTrigger>
        </TabsList>

        <TabsContent value="environment">
          <EnvironmentManager />
        </TabsContent>

        <TabsContent value="learning">
          <LearningDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
