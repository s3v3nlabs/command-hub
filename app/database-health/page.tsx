import { DatabaseHealthCheck } from "@/components/CommandHub/DatabaseHealthCheck"

export default function DatabaseHealthPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Database Health Check</h1>
          <p className="text-muted-foreground">
            Verify that all required Supabase tables exist and are properly configured.
          </p>
        </div>

        <DatabaseHealthCheck />
      </div>
    </div>
  )
}
