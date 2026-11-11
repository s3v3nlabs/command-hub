"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Terminal, Truck, Zap, Activity } from "lucide-react"
import { beastWagonTelemetry } from "@/lib/beastwagon/telemetry-simulator"

interface TerminalOutput {
  id: string
  command: string
  output: string
  timestamp: number
  type: "command" | "telemetry" | "canbus" | "system"
}

export default function BeastWagonTerminal() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState<TerminalOutput[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [telemetryStream, setTelemetryStream] = useState(false)

  useEffect(() => {
    // Subscribe to telemetry updates
    const unsubscribe = beastWagonTelemetry.subscribe((data) => {
      if (telemetryStream) {
        addOutput(
          "telemetry",
          `TELEMETRY: BAT:${data.battery.toFixed(1)}% PWR:${data.power.toFixed(1)}W TEMP:${data.temperature.toFixed(1)}°C SIG:${data.signalStrength.toFixed(0)}%`,
          "telemetry",
        )
      }
    })

    return unsubscribe
  }, [telemetryStream])

  const addOutput = (command: string, result: string, type: TerminalOutput["type"] = "command") => {
    const newOutput: TerminalOutput = {
      id: `output_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      command,
      output: result,
      timestamp: Date.now(),
      type,
    }

    setOutput((prev) => [newOutput, ...prev.slice(0, 49)]) // Keep last 50 outputs
  }

  const executeCommand = async (cmd: string) => {
    const command = cmd.trim().toLowerCase()

    switch (command) {
      case "help":
        addOutput(
          cmd,
          `Available Commands:
connect - Connect to BeastWagon-77
disconnect - Disconnect from vehicle
status - Show vehicle status
telemetry - Show current telemetry
stream on/off - Toggle telemetry stream
canbus scan - Scan CAN bus for messages
canbus sniff - Start CAN bus sniffing
deploy container - Deploy container module
retract container - Retract container module
power solar/battery/hybrid - Switch power source
sensors on/off - Toggle sensor modules
scenario [deployment|storm|low_power|high_activity] - Simulate scenario
clear - Clear terminal output`,
        )
        break

      case "connect":
        setIsConnected(true)
        addOutput(
          cmd,
          "⟐ CONNECTING TO BEASTWAGON-77 ⟐\nEstablishing secure connection...\nHandshake complete.\nVehicle systems online.\n⟐ CONNECTION ESTABLISHED ⟐",
          "system",
        )
        break

      case "disconnect":
        setIsConnected(false)
        setTelemetryStream(false)
        addOutput(cmd, "⟐ DISCONNECTING FROM BEASTWAGON-77 ⟐\nClosing secure connection...\n⟐ DISCONNECTED ⟐", "system")
        break

      case "status":
        if (!isConnected) {
          addOutput(cmd, "ERROR: Not connected to vehicle. Use 'connect' first.", "system")
          break
        }
        addOutput(
          cmd,
          `BEASTWAGON-77 STATUS REPORT:
Vehicle: ONLINE
Container: ATTACHED
Power Source: HYBRID
Battery: 87.5%
Solar Input: 245.8W
System Load: 156.2W
Temperature: 42.3°C
Signal Strength: 89%
GPS: 45.5231, -122.6765, 152.4m
All systems nominal.`,
          "system",
        )
        break

      case "telemetry":
        if (!isConnected) {
          addOutput(cmd, "ERROR: Not connected to vehicle. Use 'connect' first.", "system")
          break
        }
        // Get current telemetry snapshot
        addOutput(
          cmd,
          "CURRENT TELEMETRY SNAPSHOT:\nBattery: 87.5% (Charging)\nSolar: 245.8W (Peak)\nPower: 156.2W (Normal)\nTemperature: 42.3°C (Normal)\nSignal: 89% (Strong)\nLocation: 45.5231, -122.6765, 152.4m",
          "telemetry",
        )
        break

      case "stream on":
        if (!isConnected) {
          addOutput(cmd, "ERROR: Not connected to vehicle. Use 'connect' first.", "system")
          break
        }
        setTelemetryStream(true)
        beastWagonTelemetry.start()
        addOutput(cmd, "⟐ TELEMETRY STREAM ACTIVATED ⟐\nReal-time data streaming...", "system")
        break

      case "stream off":
        setTelemetryStream(false)
        beastWagonTelemetry.stop()
        addOutput(cmd, "⟐ TELEMETRY STREAM DEACTIVATED ⟐", "system")
        break

      case "canbus scan":
        if (!isConnected) {
          addOutput(cmd, "ERROR: Not connected to vehicle. Use 'connect' first.", "system")
          break
        }
        addOutput(
          cmd,
          `CAN BUS SCAN RESULTS:
ID: 0x123 - Engine RPM: 850
ID: 0x456 - Vehicle Speed: 0 km/h
ID: 0x789 - Fuel Level: 85%
ID: 0xABC - Hydraulic Pressure: 2250 PSI
ID: 0xDEF - Battery Voltage: 12.8V
ID: 0x321 - Container Status: ATTACHED
ID: 0x654 - Solar Controller: ACTIVE
Scan complete. 7 active nodes detected.`,
          "canbus",
        )
        break

      case "canbus sniff":
        if (!isConnected) {
          addOutput(cmd, "ERROR: Not connected to vehicle. Use 'connect' first.", "system")
          break
        }
        addOutput(
          cmd,
          "⟐ CAN BUS SNIFFING STARTED ⟐\nMonitoring all CAN frames...\n[0x123] 08 50 03 2A 00 00 00 00\n[0x456] 00 00 00 00 00 00 00 00\n[0x789] 55 00 00 00 00 00 00 00\nPress Ctrl+C to stop sniffing.",
          "canbus",
        )
        break

      case "deploy container":
        if (!isConnected) {
          addOutput(cmd, "ERROR: Not connected to vehicle. Use 'connect' first.", "system")
          break
        }
        beastWagonTelemetry.simulateScenario("deployment")
        addOutput(
          cmd,
          "⟐ INITIATING CONTAINER DEPLOYMENT ⟐\nHydraulic systems: ACTIVE\nLowering container...\nDeployment legs extending...\nContainer status: DEPLOYING\nEstimated completion: 30 seconds",
          "system",
        )
        break

      case "retract container":
        if (!isConnected) {
          addOutput(cmd, "ERROR: Not connected to vehicle. Use 'connect' first.", "system")
          break
        }
        addOutput(
          cmd,
          "⟐ RETRACTING CONTAINER ⟐\nRetracting deployment legs...\nRaising container...\nSecuring to chassis...\nContainer status: ATTACHED",
          "system",
        )
        break

      case "power solar":
        if (!isConnected) {
          addOutput(cmd, "ERROR: Not connected to vehicle. Use 'connect' first.", "system")
          break
        }
        addOutput(
          cmd,
          "⟐ SWITCHING TO SOLAR POWER ⟐\nSolar controller: ACTIVE\nBattery charging: ENABLED\nPower source: SOLAR",
          "system",
        )
        break

      case "power battery":
        if (!isConnected) {
          addOutput(cmd, "ERROR: Not connected to vehicle. Use 'connect' first.", "system")
          break
        }
        beastWagonTelemetry.simulateScenario("low_power")
        addOutput(
          cmd,
          "⟐ SWITCHING TO BATTERY POWER ⟐\nSolar controller: STANDBY\nBattery discharge: ACTIVE\nPower source: BATTERY\nWARNING: Limited runtime on battery power",
          "system",
        )
        break

      case "power hybrid":
        if (!isConnected) {
          addOutput(cmd, "ERROR: Not connected to vehicle. Use 'connect' first.", "system")
          break
        }
        addOutput(
          cmd,
          "⟐ SWITCHING TO HYBRID POWER ⟐\nSolar controller: ACTIVE\nBattery management: AUTO\nPower source: HYBRID\nOptimal power distribution enabled",
          "system",
        )
        break

      case "sensors on":
        if (!isConnected) {
          addOutput(cmd, "ERROR: Not connected to vehicle. Use 'connect' first.", "system")
          break
        }
        beastWagonTelemetry.simulateScenario("high_activity")
        addOutput(
          cmd,
          "⟐ ACTIVATING ALL SENSORS ⟐\nRadar: ONLINE\nCamera: ONLINE\nDrone dock: DEPLOYING\nScanner array: ACTIVE\nAll sensor modules operational",
          "system",
        )
        break

      case "sensors off":
        if (!isConnected) {
          addOutput(cmd, "ERROR: Not connected to vehicle. Use 'connect' first.", "system")
          break
        }
        addOutput(
          cmd,
          "⟐ DEACTIVATING NON-ESSENTIAL SENSORS ⟐\nRadar: STANDBY\nCamera: STANDBY\nDrone dock: RETRACTED\nScanner array: STANDBY\nPower consumption reduced",
          "system",
        )
        break

      case "scenario deployment":
        beastWagonTelemetry.simulateScenario("deployment")
        addOutput(
          cmd,
          "⟐ SIMULATING DEPLOYMENT SCENARIO ⟐\nContainer deployment in progress...\nIncreased power consumption\nElevated system temperature",
          "system",
        )
        break

      case "scenario storm":
        beastWagonTelemetry.simulateScenario("storm")
        addOutput(
          cmd,
          "⟐ SIMULATING STORM SCENARIO ⟐\nWeather conditions: SEVERE\nSignal strength: DEGRADED\nSolar input: REDUCED\nCamera systems: OFFLINE",
          "system",
        )
        break

      case "scenario low_power":
        beastWagonTelemetry.simulateScenario("low_power")
        addOutput(
          cmd,
          "⟐ SIMULATING LOW POWER SCENARIO ⟐\nBattery level: CRITICAL\nNon-essential systems: DISABLED\nPower conservation mode: ACTIVE",
          "system",
        )
        break

      case "scenario high_activity":
        beastWagonTelemetry.simulateScenario("high_activity")
        addOutput(
          cmd,
          "⟐ SIMULATING HIGH ACTIVITY SCENARIO ⟐\nAll systems: MAXIMUM LOAD\nSensor array: FULL DEPLOYMENT\nPower consumption: ELEVATED",
          "system",
        )
        break

      case "clear":
        setOutput([])
        return

      default:
        if (command.startsWith("scenario ")) {
          addOutput(cmd, "Unknown scenario. Available: deployment, storm, low_power, high_activity", "system")
        } else {
          addOutput(cmd, `Command not recognized: ${command}\nType 'help' for available commands.`, "system")
        }
        break
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    executeCommand(input)
    setInput("")
  }

  const getOutputColor = (type: TerminalOutput["type"]) => {
    switch (type) {
      case "telemetry":
        return "text-blue-400"
      case "canbus":
        return "text-purple-400"
      case "system":
        return "text-green-400"
      default:
        return "text-gray-300"
    }
  }

  return (
    <TechPanel
      title="BEASTWAGON-77 TERMINAL"
      subtitle="VEHICLE COMMAND & CONTROL INTERFACE"
      cornerAccent
      borderAccent
      icon={<Terminal size={16} />}
    >
      <div className="space-y-4">
        {/* Status Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
              <span className="font-mono text-sm">{isConnected ? "CONNECTED" : "DISCONNECTED"}</span>
            </div>
            {telemetryStream && (
              <Badge variant="outline" className="text-blue-400 border-blue-400/50">
                <Activity size={12} className="mr-1 animate-pulse" />
                STREAMING
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <TechButton
              onClick={() => executeCommand("connect")}
              disabled={isConnected}
              size="sm"
              className="bg-green-600 hover:bg-green-500 text-white font-mono"
              icon={<Truck size={12} />}
            >
              CONNECT
            </TechButton>
            <TechButton
              onClick={() => executeCommand("stream " + (telemetryStream ? "off" : "on"))}
              disabled={!isConnected}
              size="sm"
              variant="outline"
              className="border-blue-400/50 text-blue-400 font-mono"
              icon={<Activity size={12} />}
            >
              {telemetryStream ? "STOP" : "STREAM"}
            </TechButton>
          </div>
        </div>

        {/* Terminal Output */}
        <div className="bg-black/50 rounded border border-dark-300/30 p-4 h-64">
          <ScrollArea className="h-full">
            <div className="space-y-2 font-mono text-sm">
              {output.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  <Terminal className="w-16 h-16 mx-auto mb-4" />
                  <div>BeastWagon-77 Terminal Ready</div>
                  <div className="text-xs">Type 'help' for available commands</div>
                </div>
              ) : (
                output.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-green-400">$ {item.command}</span>
                      <span className="text-gray-500 text-xs">{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className={`pl-2 border-l border-gray-600 whitespace-pre-wrap ${getOutputColor(item.type)}`}>
                      {item.output}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Command Input */}
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <span className="text-green-400 font-mono">$</span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter command..."
            className="flex-1 bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm"
          />
          <TechButton type="submit" disabled={!input.trim()} size="sm" cornerAccent icon={<Zap size={12} />}>
            EXECUTE
          </TechButton>
        </form>

        {/* Quick Commands */}
        <div className="flex flex-wrap gap-2">
          {["status", "telemetry", "canbus scan", "deploy container", "sensors on"].map((cmd) => (
            <TechButton
              key={cmd}
              onClick={() => executeCommand(cmd)}
              size="sm"
              variant="outline"
              className="border-dark-400/50 text-dark-600 font-mono text-xs"
              disabled={!isConnected && cmd !== "connect"}
            >
              {cmd.toUpperCase()}
            </TechButton>
          ))}
        </div>
      </div>
    </TechPanel>
  )
}
