"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Maximize2, Play, Pause, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { speak } from "@/lib/audio"

interface CameraType {
  id: string
  name: string
  location: string
  status: "online" | "offline" | "alert"
  feed: string // URL to image
}

export default function CCTVViewer() {
  const [cameras, setCameras] = useState<CameraType[]>([
    {
      id: "cam1",
      name: "Main Entrance",
      location: "Building A",
      status: "online",
      feed: "/placeholder.svg?key=o0yzl",
    },
    {
      id: "cam2",
      name: "Server Room",
      location: "Building B",
      status: "alert",
      feed: "/placeholder.svg?key=packz",
    },
    {
      id: "cam3",
      name: "Parking Lot",
      location: "South Side",
      status: "online",
      feed: "/placeholder.svg?key=3cgrc",
    },
    {
      id: "cam4",
      name: "Research Lab",
      location: "Building C",
      status: "offline",
      feed: "/placeholder.svg?key=vzqjy",
    },
    {
      id: "cam5",
      name: "Loading Dock",
      location: "Warehouse",
      status: "online",
      feed: "/placeholder.svg?key=apehp",
    },
    {
      id: "cam6",
      name: "Executive Office",
      location: "Building A",
      status: "online",
      feed: "/placeholder.svg?key=ks3os",
    },
  ])

  const [selectedCamera, setSelectedCamera] = useState<CameraType | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    // Simulate random camera alerts
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const randomIndex = Math.floor(Math.random() * cameras.length)
        const updatedCameras = [...cameras]

        if (updatedCameras[randomIndex].status !== "alert") {
          updatedCameras[randomIndex].status = "alert"
          setCameras(updatedCameras)

          speak(`Alert detected on camera ${updatedCameras[randomIndex].name}`)
        }
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [cameras])

  const handleCameraSelect = (camera: CameraType) => {
    setSelectedCamera(camera)
    if (camera.status === "alert") {
      speak(`Viewing alert on ${camera.name}`)
    }
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
    speak(isPaused ? "Resuming video feeds" : "Pausing video feeds")
  }

  return (
    <Card className="bg-dark-50 border-dark-300 shadow-lg h-full">
      <CardHeader className="border-b border-dark-300 bg-dark-100 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-blue-500" />
          CCTV Surveillance
        </CardTitle>
        <div className="flex gap-2">
          <button onClick={togglePause} className="text-gray-400 hover:text-white transition-colors">
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {selectedCamera ? (
          <div className="mb-4">
            <div className="relative">
              <img
                src={selectedCamera.feed || "/placeholder.svg"}
                alt={selectedCamera.name}
                className={`w-full h-64 object-cover rounded-md ${isPaused ? "opacity-80" : ""}`}
              />
              {isPaused && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Badge className="bg-red-900/50 text-red-400 border-red-500">PAUSED</Badge>
                </div>
              )}
              {selectedCamera.status === "alert" && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-red-900/50 text-red-400 border-red-500 animate-pulse">
                    <AlertTriangle className="h-3 w-3 mr-1" /> ALERT
                  </Badge>
                </div>
              )}
              <div className="absolute bottom-2 left-2 right-2 flex justify-between">
                <Badge className="bg-black/70 text-white">
                  {selectedCamera.name} - {selectedCamera.location}
                </Badge>
                <button className="bg-black/70 p-1 rounded text-white hover:bg-black/90">
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <button onClick={() => setSelectedCamera(null)} className="mt-2 text-sm text-blue-400 hover:text-blue-300">
              Back to grid view
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {cameras.map((camera) => (
              <div key={camera.id} className="relative cursor-pointer" onClick={() => handleCameraSelect(camera)}>
                <img
                  src={camera.feed || "/placeholder.svg"}
                  alt={camera.name}
                  className={`w-full h-32 object-cover rounded-md ${
                    camera.status === "offline" ? "grayscale" : ""
                  } ${isPaused ? "opacity-80" : ""}`}
                />
                {isPaused && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Badge className="bg-red-900/50 text-red-400 border-red-500">PAUSED</Badge>
                  </div>
                )}
                {camera.status === "alert" && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-red-900/50 text-red-400 border-red-500 animate-pulse">
                      <AlertTriangle className="h-3 w-3 mr-1" /> ALERT
                    </Badge>
                  </div>
                )}
                {camera.status === "offline" && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-gray-900/50 text-gray-400 border-gray-500">OFFLINE</Badge>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 right-2">
                  <Badge className="bg-black/70 text-white text-xs w-full overflow-hidden text-ellipsis">
                    {camera.name}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
