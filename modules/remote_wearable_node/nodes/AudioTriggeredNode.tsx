"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Speaker, VolumeX, Settings, Play, Square, Zap, Power } from "lucide-react"

interface AudioTriggeredNodeProps {
  node: any
  onAction: (action: string) => void
}

export function AudioTriggeredNode({ node, onAction }: AudioTriggeredNodeProps) {
  const [isListening, setIsListening] = useState(node.status === "listening")
  const [currentFreq, setCurrentFreq] = useState(0)
  const [targetFreq, setTargetFreq] = useState(108)
  const [sensitivity, setSensitivity] = useState(75)
  const [noiseFloor, setNoiseFloor] = useState(12)
  const [matchThreshold, setMatchThreshold] = useState(95)
  const [detectionCount, setDetectionCount] = useState(0)
  const [lastDetection, setLastDetection] = useState<string | null>(null)
  const [audioSpectrum, setAudioSpectrum] = useState<number[]>(Array(8).fill(0))
  const [eidosActivated, setEidosActivated] = useState(false)

  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        // Simulate audio spectrum analysis
        const newSpectrum = Array(8)
          .fill(0)
          .map(() => Math.random() * 100)
        setAudioSpectrum(newSpectrum)

        // Simulate frequency detection
        const detectedFreq = 50 + Math.random() * 1000
        setCurrentFreq(detectedFreq)

        // Check for harmonic match
        if (Math.abs(detectedFreq - targetFreq) < 5 && Math.random() > 0.95) {
          handleHarmonicMatch()
        }

        // Update noise floor
        setNoiseFloor(8 + Math.random() * 8)
      }, 200)

      return () => clearInterval(interval)
    }
  }, [isListening, targetFreq])

  const handleHarmonicMatch = () => {
    setDetectionCount((prev) => prev + 1)
    setLastDetection(new Date().toISOString())
    setEidosActivated(true)
    onAction("eidos_activate")

    setTimeout(() => setEidosActivated(false), 3000)
  }

  const handleStartListening = () => {
    setIsListening(true)
    onAction("start_listening")
  }

  const handleStopListening = () => {
    setIsListening(false)
    onAction("stop_listening")
  }

  const handleCalibrate = () => {
    setNoiseFloor(5 + Math.random() * 5)
    setSensitivity(80)
  }

  const getFrequencyMatch = () => {
    const diff = Math.abs(currentFreq - targetFreq)
    if (diff < 2) return 100
    if (diff < 5) return 85
    if (diff < 10) return 60
    return Math.max(0, 100 - diff)
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <Speaker className="w-5 h-5 mr-2 text-purple-400" />
          Audio-Triggered Pocket Node - {node.id}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Status</span>
              <Badge className={isListening ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                {isListening ? "LISTENING" : "IDLE"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Battery</span>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-2 bg-gray-700 rounded-sm">
                  <div className="h-full bg-green-500 rounded-sm" style={{ width: `${node.batteryLevel}%` }} />
                </div>
                <span className="text-sm text-white">{node.batteryLevel}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Detections</span>
              <span className="text-sm text-white">{detectionCount}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Target Freq</span>
              <span className="text-sm text-white">{targetFreq}Hz</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Current Freq</span>
              <span className="text-sm text-white">{currentFreq.toFixed(1)}Hz</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">EIDOS</span>
              <div
                className={`w-2 h-2 rounded-full ${eidosActivated ? "bg-purple-500 animate-pulse" : "bg-gray-500"}`}
              />
            </div>
          </div>
        </div>

        {/* Audio Spectrum Analyzer */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white">Real-Time Audio Spectrum</h4>
          <div className="p-3 bg-gray-800 rounded-lg">
            <div className="flex items-end justify-between h-20 mb-2">
              {audioSpectrum.map((level, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-t from-purple-600 to-purple-400 rounded-t"
                  style={{
                    height: `${level}%`,
                    width: "10%",
                    opacity: isListening ? 1 : 0.3,
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>50Hz</span>
              <span>200Hz</span>
              <span>500Hz</span>
              <span>1kHz</span>
              <span>2kHz</span>
              <span>5kHz</span>
              <span>10kHz</span>
              <span>20kHz</span>
            </div>
          </div>
        </div>

        {/* Frequency Matching */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white">Harmonic Frequency Matching</h4>
          <div className="p-3 bg-gray-800 rounded-lg space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Target Frequency: {targetFreq}Hz</label>
              <Input
                type="range"
                min="50"
                max="1000"
                value={targetFreq}
                onChange={(e) => setTargetFreq(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>50Hz</span>
                <span>1000Hz</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Frequency Match</span>
                <span>{getFrequencyMatch().toFixed(0)}%</span>
              </div>
              <Progress value={getFrequencyMatch()} className="h-2" />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTargetFreq(108)}
                className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent text-xs"
              >
                108Hz
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTargetFreq(432)}
                className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent text-xs"
              >
                432Hz
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTargetFreq(528)}
                className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent text-xs"
              >
                528Hz
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTargetFreq(963)}
                className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent text-xs"
              >
                963Hz
              </Button>
            </div>
          </div>
        </div>

        {/* Detection Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white">Detection Settings</h4>
          <div className="p-3 bg-gray-800 rounded-lg space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Sensitivity: {sensitivity}%</label>
              <Input
                type="range"
                min="0"
                max="100"
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Match Threshold: {matchThreshold}%</label>
              <Input
                type="range"
                min="50"
                max="100"
                value={matchThreshold}
                onChange={(e) => setMatchThreshold(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Noise Floor</span>
              <div className="flex items-center space-x-2">
                <VolumeX className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white">{noiseFloor.toFixed(1)}dB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Last Detection Info */}
        {lastDetection && (
          <div className="p-3 bg-purple-900/20 border border-purple-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Last Harmonic Detection</span>
            </div>
            <div className="text-xs text-gray-400">{new Date(lastDetection).toLocaleString()}</div>
            <div className="text-xs text-purple-300 mt-1">EIDOS Scrollkeeper session activated</div>
          </div>
        )}

        {/* Control Actions */}
        <div className="flex space-x-2">
          <Button
            onClick={isListening ? handleStopListening : handleStartListening}
            className={isListening ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
          >
            {isListening ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isListening ? "Stop Listening" : "Start Listening"}
          </Button>
          <Button
            variant="outline"
            className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
            onClick={handleCalibrate}
          >
            <Settings className="w-4 h-4 mr-2" />
            Calibrate
          </Button>
          <Button
            variant="outline"
            className="border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
            onClick={() => onAction(node.status === "active" ? "deactivate" : "activate")}
          >
            <Power className="w-4 h-4 mr-2" />
            {node.status === "active" ? "Deactivate" : "Activate"}
          </Button>
        </div>

        {/* Capabilities */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-white">Capabilities</h4>
          <div className="flex flex-wrap gap-2">
            {node.capabilities.map((capability: string) => (
              <Badge key={capability} variant="outline" className="text-xs">
                {capability.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
