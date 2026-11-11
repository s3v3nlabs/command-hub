"use client"

import { useEffect, useState, useRef } from "react"
import {
  AlertCircle,
  ChevronRight,
  Crosshair,
  Database,
  Download,
  Info,
  Maximize2,
  Power,
  Shield,
  Signal,
} from "lucide-react"

export default function FuturisticHUD() {
  const [loading, setLoading] = useState(true)
  const [systemStatus, setSystemStatus] = useState("INITIALIZING")
  const [powerLevel, setPowerLevel] = useState(0)
  const [noiseLevel, setNoiseLevel] = useState(0)
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 })
  const [currentTime, setCurrentTime] = useState("")
  const [selectedSection, setSelectedSection] = useState(1)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Simulate loading sequence
    const loadingTimer = setTimeout(() => {
      setLoading(false)
      setSystemStatus("ONLINE")
    }, 3000)

    // Update power level
    const powerTimer = setInterval(() => {
      setPowerLevel((prev) => {
        const newValue = prev + (Math.random() * 5 - 2)
        return Math.min(Math.max(newValue, 60), 100)
      })
    }, 2000)

    // Update noise level
    const noiseTimer = setInterval(() => {
      setNoiseLevel(Math.floor(Math.random() * 30))
    }, 1500)

    // Update coordinates
    const coordTimer = setInterval(() => {
      setCoordinates({
        x: Math.floor(Math.random() * 100),
        y: Math.floor(Math.random() * 100),
      })
    }, 3000)

    // Update time
    const timeTimer = setInterval(() => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, "0")
      const minutes = now.getMinutes().toString().padStart(2, "0")
      const seconds = now.getSeconds().toString().padStart(2, "0")
      setCurrentTime(`${hours}:${minutes}:${seconds}`)
    }, 1000)

    // Draw radar animation
    const drawRadar = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw outer circle
      ctx.strokeStyle = "#0ea5e9"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 10, 0, 2 * Math.PI)
      ctx.stroke()

      // Draw inner circle
      ctx.beginPath()
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 4, 0, 2 * Math.PI)
      ctx.stroke()

      // Draw crosshairs
      ctx.beginPath()
      ctx.moveTo(canvas.width / 2, 10)
      ctx.lineTo(canvas.width / 2, canvas.height - 10)
      ctx.moveTo(10, canvas.height / 2)
      ctx.lineTo(canvas.width - 10, canvas.height / 2)
      ctx.stroke()

      // Draw rotating radar line
      const time = new Date().getTime() / 1000
      const angle = ((time % 4) * Math.PI) / 2

      ctx.strokeStyle = "rgba(14, 165, 233, 0.7)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(canvas.width / 2, canvas.height / 2)
      ctx.lineTo(
        canvas.width / 2 + Math.cos(angle) * (canvas.width / 2 - 10),
        canvas.height / 2 + Math.sin(angle) * (canvas.width / 2 - 10),
      )
      ctx.stroke()

      // Draw radar sweep
      ctx.fillStyle = "rgba(14, 165, 233, 0.1)"
      ctx.beginPath()
      ctx.moveTo(canvas.width / 2, canvas.height / 2)
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 10, angle - 0.2, angle, false)
      ctx.fill()

      // Draw random dots (signals)
      ctx.fillStyle = "#0ea5e9"
      for (let i = 0; i < 5; i++) {
        const dotAngle = Math.random() * Math.PI * 2
        const dotDistance = Math.random() * (canvas.width / 2 - 20)
        ctx.beginPath()
        ctx.arc(
          canvas.width / 2 + Math.cos(dotAngle) * dotDistance,
          canvas.height / 2 + Math.sin(dotAngle) * dotDistance,
          2,
          0,
          2 * Math.PI,
        )
        ctx.fill()
      }

      requestAnimationFrame(drawRadar)
    }

    drawRadar()

    return () => {
      clearTimeout(loadingTimer)
      clearInterval(powerTimer)
      clearInterval(noiseTimer)
      clearInterval(coordTimer)
      clearInterval(timeTimer)
    }
  }, [])

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-mono text-sm">
      {/* Corner borders */}
      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-sky-500"></div>
      <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-sky-500"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-sky-500"></div>
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-sky-500"></div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
          <div className="text-sky-500 text-4xl mb-4">LOADING...</div>
          <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-300"
              style={{ width: `${Math.random() * 100}%` }}
            ></div>
          </div>
          <div className="text-gray-400 mt-4">INITIALIZING SYSTEM</div>
          <div className="text-gray-500 mt-2 text-xs">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="my-1">
                {Math.random().toString(36).substring(2, 10).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1/3 border border-sky-800 bg-black bg-opacity-50 p-2">
        <div className="flex justify-between items-center">
          <div className="text-sky-500 flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            SYSTEM: {systemStatus}
          </div>
          <div className="text-gray-400">{currentTime}</div>
          <div className="text-orange-500 flex items-center">
            <Power className="w-4 h-4 mr-2" />
            PWR: {powerLevel.toFixed(1)}%
          </div>
        </div>
      </header>

      {/* Left sidebar */}
      <div className="absolute top-1/2 left-6 transform -translate-y-1/2 w-64 border border-gray-800 bg-black bg-opacity-50 p-4">
        <div className="text-sky-500 mb-4 flex items-center">
          <Database className="w-4 h-4 mr-2" />
          SYSTEM DIAGNOSTICS
        </div>

        <div className="space-y-4">
          {["MAIN POWER", "AUXILIARY SYSTEMS", "DEFENSE MATRIX", "COMMUNICATIONS"].map((system, index) => (
            <div key={index} className="flex justify-between items-center">
              <div className="text-gray-400 text-xs">{system}</div>
              <div className="w-24 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${index === 0 ? "bg-sky-500" : index === 1 ? "bg-green-500" : index === 2 ? "bg-orange-500" : "bg-purple-500"}`}
                  style={{ width: `${70 + Math.random() * 30}%` }}
                ></div>
              </div>
              <div className="text-gray-400 text-xs">OK</div>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-gray-800 pt-4">
          <div className="text-sky-500 mb-2 flex items-center">
            <Signal className="w-4 h-4 mr-2" />
            NOISE GAIN OUT
          </div>
          <div className="flex items-center">
            <div className="text-gray-400 text-xs mr-2">DB:</div>
            <div className="text-orange-500">{noiseLevel}</div>
          </div>
          <div className="flex items-center mt-1">
            <div className="text-gray-400 text-xs mr-2">RF-3:</div>
            <div className="text-orange-500">{(noiseLevel * 1.5).toFixed(1)}</div>
          </div>
          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-orange-500" style={{ width: `${noiseLevel * 3}%` }}></div>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-800 pt-4">
          <div className="text-sky-500 mb-2 flex items-center">
            <Crosshair className="w-4 h-4 mr-2" />
            COORDINATES
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <div className="text-gray-400 text-xs mr-2">X:</div>
              <div className="text-sky-500">{coordinates.x}</div>
            </div>
            <div className="flex items-center">
              <div className="text-gray-400 text-xs mr-2">Y:</div>
              <div className="text-sky-500">{coordinates.y}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="absolute top-1/2 right-6 transform -translate-y-1/2 w-64 border border-gray-800 bg-black bg-opacity-50 p-4">
        <div className="text-sky-500 mb-4 flex items-center">
          <Info className="w-4 h-4 mr-2" />
          SYSTEM INFO
        </div>

        <canvas ref={canvasRef} width={200} height={200} className="border border-gray-800 mx-auto mb-4"></canvas>

        <div className="space-y-2 mt-4">
          {["PROTOCOL DIAGNOSIS", "SYNCHRONIC DATA", "SATELLITE LINK", "TERMINAL INGEST"].map((item, index) => (
            <div
              key={index}
              className={`flex justify-between items-center p-2 cursor-pointer ${selectedSection === index ? "bg-sky-900 bg-opacity-30 border-l-2 border-sky-500" : "hover:bg-gray-900"}`}
              onClick={() => setSelectedSection(index)}
            >
              <div className="text-gray-400 text-xs">{item}</div>
              <ChevronRight className="w-4 h-4 text-sky-500" />
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-gray-800 pt-4">
          <div className="text-sky-500 mb-2 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            ALERTS
          </div>
          <div className="text-orange-500 text-xs">
            {noiseLevel > 20 ? "HIGH NOISE LEVEL DETECTED" : "NO CRITICAL ALERTS"}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-2/3 border border-gray-800 bg-black bg-opacity-50 p-2">
        <div className="flex justify-between items-center">
          <div className="text-gray-500 text-xs">ID: 507-K</div>
          <div className="flex space-x-4">
            {["BUTTON", "BUTTON 02", "BUTTON 03", "INFO"].map((btn, index) => (
              <button
                key={index}
                className="bg-gray-900 border border-gray-700 text-gray-300 px-4 py-1 text-xs flex items-center hover:bg-gray-800"
              >
                {btn} <ChevronRight className="w-3 h-3 ml-1" />
              </button>
            ))}
          </div>
          <div className="text-gray-500 text-xs">02/05</div>
        </div>
      </div>

      {/* Center content */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute -top-24 -left-24 w-48 h-48 border border-sky-800 bg-black bg-opacity-50 p-3">
            <div className="text-sky-500 text-xs mb-2">WEAPON CONTAINER 01</div>
            <div className="border border-gray-800 h-[calc(100%-20px)] flex items-center justify-center">
              <div className="text-gray-500 text-xs">NO DATA</div>
            </div>
          </div>

          <div className="absolute -top-24 -right-24 w-48 h-48 border border-sky-800 bg-black bg-opacity-50 p-3">
            <div className="text-sky-500 text-xs mb-2">BOOSTER ENGINE COOLING</div>
            <div className="grid grid-cols-6 gap-1 h-[calc(100%-20px)]">
              {[...Array(36)].map((_, i) => (
                <div key={i} className="bg-gray-800 h-4"></div>
              ))}
            </div>
          </div>

          <div className="absolute -bottom-24 -left-24 w-48 h-48 border border-sky-800 bg-black bg-opacity-50 p-3">
            <div className="text-sky-500 text-xs mb-2">RIGHT WEAPON CONTAINER</div>
            <div className="grid grid-cols-1 gap-1 h-[calc(100%-20px)]">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-800 h-4 transform -rotate-45"></div>
              ))}
            </div>
          </div>

          <div className="absolute -bottom-24 -right-24 w-48 h-48 border border-sky-800 bg-black bg-opacity-50 p-3">
            <div className="text-sky-500 text-xs mb-2">SYSTEM TEST</div>
            <div className="border border-gray-800 h-[calc(100%-20px)] flex items-center justify-center">
              <div className="text-green-500 text-xs">PASSED</div>
            </div>
          </div>

          <div className="w-48 h-48 border-2 border-sky-500 flex items-center justify-center relative">
            <Maximize2 className="w-8 h-8 text-sky-500 absolute" />
            <div className="text-sky-500 text-xl">SAT.3</div>
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-sky-500"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-sky-500"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-sky-500"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-sky-500"></div>
          </div>
        </div>

        <div className="mt-8 flex items-center">
          <div className="text-orange-500 mr-2">
            <Download className="w-4 h-4" />
          </div>
          <div className="text-gray-400 text-xs">SIGNAL</div>
          <div className="mx-2 w-24 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500" style={{ width: `${60 + Math.random() * 40}%` }}></div>
          </div>
          <div className="text-orange-500 text-xs">{Math.floor(60 + Math.random() * 40)}%</div>
        </div>
      </div>

      {/* Vertical side indicators */}
      <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-6 h-48 flex flex-col items-center justify-center">
        <div className="text-gray-500 text-xs transform -rotate-90 whitespace-nowrap">ID: F.2.22.3.2</div>
      </div>
      <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-6 h-48 flex flex-col items-center justify-center">
        <div className="text-gray-500 text-xs transform rotate-90 whitespace-nowrap">B: 42.2</div>
      </div>
    </div>
  )
}
