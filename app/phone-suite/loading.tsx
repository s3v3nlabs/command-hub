import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function PhoneSuiteLoading() {
  return (
    <div className="flex h-screen bg-black">
      <div className="w-64 bg-black border-r border-gray-800">
        <Skeleton className="h-full w-full bg-gray-900" />
      </div>
      <div className="flex-1 p-6">
        <div className="space-y-6">
          <Card className="bg-black border border-gray-800">
            <CardHeader>
              <Skeleton className="h-6 w-64 bg-gray-800" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full bg-gray-800" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="bg-black border border-gray-800">
              <CardContent className="p-4">
                <Skeleton className="h-64 w-full bg-gray-800" />
              </CardContent>
            </Card>

            <div className="lg:col-span-3">
              <Card className="bg-black border border-gray-800">
                <CardContent className="p-4">
                  <Skeleton className="h-96 w-full bg-gray-800" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
