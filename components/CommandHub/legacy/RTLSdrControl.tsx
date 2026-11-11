"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Radio, Play, Pause, Save, ZoomIn, ZoomOut, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { speak } from "@/lib/audio"

export default function RTLSdrControl() {
  const [isScanning, setIsScanning] = useState(false)
  const [frequency, setFrequency] = useState(100.0)
  const [gain, setGain] = useState(20)
  const [bandwidth, setBandwidth] = useState(2.0)
  const [zoomLevel, setZoomLevel] = useState(1.0)
  const [showSettings, setShowSettings] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (isScanning) {
      // Draw waterfall
      drawWaterfall(ctx, canvas.width, canvas.height)

      // Draw frequency spectrum
      drawSpectrum(ctx, canvas.width, canvas.height)
    } else {
      // Draw "not scanning" message
      ctx.fillStyle = "#374151"
      ctx.font = "14px monospace"
      ctx.textAlign = "center"
      ctx.fillText("Press SCAN to start frequency analysis", canvas.width / 2, canvas.height / 2)
    }
  }, [isScanning, frequency, gain, bandwidth, zoomLevel])

  const drawWaterfall = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const waterfallHeight = height * 0.3
    const y = height - waterfallHeight

    // Draw waterfall background
    ctx.fillStyle = "#111827"
    ctx.fillRect(0, y, width, waterfallHeight)

    // Draw waterfall lines
    for (let i = 0; i < waterfallHeight; i++) {
      const alpha = 1 - i / waterfallHeight

      for (let x = 0; x < width; x++) {
        // Generate some random data based on frequency and position
        const intensity = Math.sin((x / width) * 10 + frequency / 10) * 0.5 + 0.5
        const noise = Math.random() * 0.3
        const value = intensity * (1 - noise) * alpha

        // Create color based on intensity
        let color
        if (value < 0.3) {
          color = `rgba(0, 0, ${Math.floor(value * 255 * 3)}, ${alpha})`
        } else if (value < 0.6) {
          color = `rgba(0, ${Math.floor((value - 0.3) * 255 * 3)}, ${Math.floor(255 - (value - 0.3) * 255 * 3)}, ${alpha})`
        } else {
          color = `rgba(${Math.floor((value - 0.6) * 255 * 3)}, ${Math.floor(255 - (value - 0.6) * 255 * 3)}, 0, ${alpha})`
        }

        ctx.fillStyle = color
        ctx.fillRect(x, y + i, 1, 1)
      }
    }

    // Draw waterfall label
    ctx.fillStyle = "#9ca3af"
    ctx.font = "10px monospace"
    ctx.textAlign = "left"
    ctx.fillText("WATERFALL", 5, height - waterfallHeight + 12)
  }

  const drawSpectrum = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const spectrumHeight = height * 0.7

    // Draw spectrum background
    ctx.fillStyle = "#1f2937"
    ctx.fillRect(0, 0, width, spectrumHeight)

    // Draw grid lines
    ctx.strokeStyle = "#374151"
    ctx.lineWidth = 1

    // Vertical grid lines (frequency)
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, spectrumHeight)
      ctx.stroke()

      // Frequency labels
      const freqLabel = (frequency - bandwidth / 2 + bandwidth * (i / 10)).toFixed(1)
      ctx.fillStyle = "#9ca3af"
      ctx.font = "10px monospace"
      ctx.textAlign = "center"
      ctx.fillText(`${freqLabel}`, x, spectrumHeight - 5)
    }

    // Horizontal grid lines (power)
    for (let i = 0; i <= 5; i++) {
      const y = (spectrumHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()

      // Power labels (dBm)
      const powerLabel = `-${i * 20}`
      ctx.fillStyle = "#9ca3af"
      ctx.font = "10px monospace"
      ctx.textAlign = "left"
      ctx.fillText(`${powerLabel} dBm`, 5, y + 12)
    }

    // Draw spectrum line
    ctx.beginPath()
    ctx.moveTo(0, spectrumHeight)

    for (let x = 0; x < width; x++) {
      // Generate some random data based on frequency and position
      const normalizedX = x / width
      const centerFreq = (normalizedX - 0.5) * 2 // -1 to 1, centered at current frequency

      // Create a peak around the center frequency
      const peak = Math.exp(-Math.pow(centerFreq * 5, 2)) * 0.8

      // Add some random noise
      const noise = Math.random() * 0.2

      // Calculate final value (0 to 1, where 0 is max power and 1 is min power)
      const value = 1 - (peak + noise)

      // Scale to spectrum height
      const y = value * spectrumHeight

      ctx.lineTo(x, y)
    }

    // Finish and stroke the path
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    ctx.stroke()

    // Fill area under the curve
    ctx.lineTo(width, spectrumHeight)
    ctx.lineTo(0, spectrumHeight)
    ctx.closePath()
    ctx.fillStyle = "rgba(59, 130, 246, 0.2)"
    ctx.fill()

    // Draw spectrum label
    ctx.fillStyle = "#9ca3af"
    ctx.font = "10px monospace"
    ctx.textAlign = "left"
    ctx.fillText("SPECTRUM", 5, 12)

    // Draw current frequency marker
    const centerX = width / 2
    ctx.beginPath()
    ctx.moveTo(centerX, 0)
    ctx.lineTo(centerX, spectrumHeight)
    ctx.strokeStyle = "#ef4444"
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = "#ef4444"
    ctx.font = "10px monospace"
    ctx.textAlign = "center"
    ctx.fillText(`${frequency.toFixed(1)} MHz`, centerX, 12)
  }

  const toggleScan = () => {
    setIsScanning(!isScanning)
    speak(isScanning ? "Stopping frequency scan" : "Starting frequency scan")
  }

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFrequency(Number.parseFloat(e.target.value))
  }

  const handleGainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGain(Number.parseInt(e.target.value))
  }

  const handleBandwidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBandwidth(Number.parseFloat(e.target.value))
  }

  const handleZoomIn = () => {
    if (zoomLevel < 4.0) {
      setZoomLevel(zoomLevel + 0.5)
      speak("Zooming in")
    }
  }

  const handleZoomOut = () => {
    if (zoomLevel > 0.5) {
      setZoomLevel(zoomLevel - 0.5)
      speak("Zooming out")
    }
  }

  const handleSave = () => {
    speak("Saving spectrum data")
    // In a real app, this would save the current spectrum data
    alert("Spectrum data saved (mock)")
  }

  return (
    <Card className="bg-dark-50 border-dark-300 shadow-lg h-full">
      <CardHeader className="border-b border-dark-300 bg-dark-100 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-blue-500" />
          RTL-SDR Scanner
        </CardTitle>
        <div className="flex gap-2">
          <button
            onClick={toggleScan}
            className="text-gray-400 hover:text-white transition-colors"
            title={isScanning ? "Stop Scan" : "Start Scan"}
          >
            {isScanning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button onClick={handleZoomIn} className="text-gray-400 hover:text-white transition-colors" title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={handleZoomOut} className="text-gray-400 hover:text-white transition-colors" title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-400 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-[500px] flex flex-col">
        <div className="relative flex-grow">
          <canvas ref={canvasRef} width={800} height={400} className="w-full h-full" />

          {isScanning && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-green-900/20 text-green-400 border-green-500 animate-pulse">SCANNING</Badge>
            </div>
          )}
        </div>

        {showSettings && (
          <div className="border-t border-dark-300 bg-dark-200 p-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Frequency (MHz)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="88.0"
                    max="108.0"
                    step="0.1"
                    value={frequency}
                    onChange={handleFrequencyChange}
                    className="flex-grow"
                  />
                  <span className="text-sm font-mono w-16 text-right">{frequency.toFixed(1)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Gain (dB)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={gain}
                    onChange={handleGainChange}
                    className="flex-grow"
                  />
                  <span className="text-sm font-mono w-16 text-right">{gain}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Bandwidth (MHz)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.5"
                    max="10.0"
                    step="0.5"
                    value={bandwidth}
                    onChange={handleBandwidthChange}
                    className="flex-grow"
                  />
                  <span className="text-sm font-mono w-16 text-right">{bandwidth.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
              >
                <Save className="h-3 w-3" /> Save Spectrum
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
