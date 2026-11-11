"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe, Layers, Filter, Download } from "lucide-react"
import { speak } from "@/lib/audio"

export default function KeplerMap() {
  const [isLoading, setIsLoading] = useState(false)
  const [mapType, setMapType] = useState<"satellite" | "street" | "dark">("dark")
  const [dataLayer, setDataLayer] = useState<"heatmap" | "points" | "arcs">("points")

  const handleMapTypeChange = (type: "satellite" | "street" | "dark") => {
    setIsLoading(true)
    setMapType(type)
    speak(`Switching to ${type} map view`)

    // Simulate loading
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const handleDataLayerChange = (layer: "heatmap" | "points" | "arcs") => {
    setDataLayer(layer)
    speak(`Displaying ${layer} data layer`)
  }

  return (
    <Card className="bg-dark-50 border-dark-300 shadow-lg h-full">
      <CardHeader className="border-b border-dark-300 bg-dark-100 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-500" />
          Kepler.gl Geospatial Analysis
        </CardTitle>
        <div className="flex gap-2">
          <button
            onClick={() => speak("Exporting map data")}
            className="text-gray-400 hover:text-white transition-colors"
            title="Export Data"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-[500px] flex flex-col">
        <div className="flex border-b border-dark-300 bg-dark-200 p-2 gap-2">
          <div className="flex gap-1">
            <button
              onClick={() => handleMapTypeChange("dark")}
              className={`px-2 py-1 text-xs rounded ${
                mapType === "dark" ? "bg-blue-900 text-blue-300" : "bg-dark-300 text-gray-400"
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => handleMapTypeChange("satellite")}
              className={`px-2 py-1 text-xs rounded ${
                mapType === "satellite" ? "bg-blue-900 text-blue-300" : "bg-dark-300 text-gray-400"
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => handleMapTypeChange("street")}
              className={`px-2 py-1 text-xs rounded ${
                mapType === "street" ? "bg-blue-900 text-blue-300" : "bg-dark-300 text-gray-400"
              }`}
            >
              Street
            </button>
          </div>

          <div className="border-l border-dark-300 mx-1"></div>

          <div className="flex gap-1">
            <button
              onClick={() => handleDataLayerChange("points")}
              className={`px-2 py-1 text-xs rounded ${
                dataLayer === "points" ? "bg-blue-900 text-blue-300" : "bg-dark-300 text-gray-400"
              }`}
            >
              Points
            </button>
            <button
              onClick={() => handleDataLayerChange("heatmap")}
              className={`px-2 py-1 text-xs rounded ${
                dataLayer === "heatmap" ? "bg-blue-900 text-blue-300" : "bg-dark-300 text-gray-400"
              }`}
            >
              Heatmap
            </button>
            <button
              onClick={() => handleDataLayerChange("arcs")}
              className={`px-2 py-1 text-xs rounded ${
                dataLayer === "arcs" ? "bg-blue-900 text-blue-300" : "bg-dark-300 text-gray-400"
              }`}
            >
              Connection Arcs
            </button>
          </div>
        </div>

        <div className="relative flex-grow">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-900/50">
              <div className="text-white">Loading map...</div>
            </div>
          ) : (
            <iframe
              src={`/placeholder.svg?height=500&width=800&query=kepler.gl ${mapType} map with ${dataLayer} data visualization`}
              className="w-full h-full border-0"
              title="Kepler.gl Map"
            />
          )}

          <div className="absolute bottom-4 left-4 right-4 flex justify-between">
            <div className="bg-black/70 p-2 rounded text-white text-xs">
              <div className="font-bold mb-1">Active Signals</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>New York: 23</div>
                <div>London: 17</div>
                <div>Tokyo: 31</div>
                <div>Moscow: 12</div>
                <div>Beijing: 28</div>
                <div>Sydney: 9</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => speak("Filtering map data")}
                className="bg-black/70 p-2 rounded text-white hover:bg-black/90"
                title="Filter Data"
              >
                <Filter className="h-4 w-4" />
              </button>
              <button
                onClick={() => speak("Adjusting map layers")}
                className="bg-black/70 p-2 rounded text-white hover:bg-black/90"
                title="Layer Controls"
              >
                <Layers className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
