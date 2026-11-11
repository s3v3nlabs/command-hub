/**
 * BeastWagon Telemetry Simulator
 * Generates realistic telemetry data for the mobile command platform
 */

export interface BeastWagonTelemetry {
  timestamp: number
  battery: number
  solar: number
  power: number
  temperature: number
  signalStrength: number
  location: { lat: number; lng: number; alt: number }
  sensors: {
    radar: boolean
    camera: boolean
    drone: boolean
    scanner: boolean
  }
  containerStatus: "attached" | "detached" | "deploying"
  powerSource: "solar" | "generator" | "battery" | "hybrid"
  canBusData?: {
    engineRpm: number
    speed: number
    fuelLevel: number
    hydraulicPressure: number
    diagnosticCodes: string[]
  }
}

export class TelemetrySimulator {
  private baseLocation = { lat: 45.5231, lng: -122.6765, alt: 152.4 }
  private isRunning = false
  private interval: NodeJS.Timeout | null = null
  private callbacks: Array<(data: BeastWagonTelemetry) => void> = []

  constructor(private updateInterval = 2000) {}

  start() {
    if (this.isRunning) return

    this.isRunning = true
    this.interval = setInterval(() => {
      const telemetry = this.generateTelemetry()
      this.callbacks.forEach((callback) => callback(telemetry))
    }, this.updateInterval)

    console.log("⟐ BEASTWAGON TELEMETRY SIMULATOR STARTED ⟐")
  }

  stop() {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }

    console.log("⟐ BEASTWAGON TELEMETRY SIMULATOR STOPPED ⟐")
  }

  subscribe(callback: (data: BeastWagonTelemetry) => void) {
    this.callbacks.push(callback)
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback)
    }
  }

  private generateTelemetry(): BeastWagonTelemetry {
    const now = Date.now()
    const timeOfDay = (now / (1000 * 60 * 60 * 24)) % 1 // 0-1 representing time of day

    // Solar power varies with time of day (peak at noon)
    const solarMultiplier = Math.max(0, Math.sin((timeOfDay - 0.25) * Math.PI * 2))
    const baseSolar = 300 * solarMultiplier + Math.random() * 50

    // Battery drains slowly, charges during high solar
    const batteryDelta = baseSolar > 200 ? 0.1 : -0.05
    const battery = Math.max(0, Math.min(100, 75 + Math.sin(now / 100000) * 20 + batteryDelta))

    // Power consumption varies with activity
    const basePower = 150 + Math.random() * 100

    // Temperature varies with time of day and power usage
    const ambientTemp = 20 + 15 * Math.sin((timeOfDay - 0.25) * Math.PI * 2)
    const heatFromPower = basePower / 20
    const temperature = ambientTemp + heatFromPower + Math.random() * 5

    // Signal strength varies with location and weather
    const signalStrength = Math.max(0, Math.min(100, 85 + Math.sin(now / 30000) * 15 + Math.random() * 10))

    // Location drifts slightly (GPS noise)
    const locationDrift = {
      lat: this.baseLocation.lat + (Math.random() - 0.5) * 0.001,
      lng: this.baseLocation.lng + (Math.random() - 0.5) * 0.001,
      alt: this.baseLocation.alt + (Math.random() - 0.5) * 5,
    }

    // CAN bus data simulation
    const canBusData = {
      engineRpm: 800 + Math.random() * 200,
      speed: Math.random() * 5, // Stationary with minor GPS drift
      fuelLevel: 85 + Math.sin(now / 200000) * 10,
      hydraulicPressure: 2000 + Math.random() * 500,
      diagnosticCodes: Math.random() > 0.95 ? ["P0171", "P0420"] : [],
    }

    return {
      timestamp: now,
      battery,
      solar: baseSolar,
      power: basePower,
      temperature,
      signalStrength,
      location: locationDrift,
      sensors: {
        radar: true,
        camera: true,
        drone: Math.random() > 0.7, // Drone occasionally deployed
        scanner: true,
      },
      containerStatus: "attached", // Default state
      powerSource: baseSolar > 200 ? "solar" : battery > 50 ? "hybrid" : "battery",
      canBusData,
    }
  }

  // Manual telemetry injection for testing
  injectTelemetry(data: Partial<BeastWagonTelemetry>) {
    const fullTelemetry = {
      ...this.generateTelemetry(),
      ...data,
      timestamp: Date.now(),
    }

    this.callbacks.forEach((callback) => callback(fullTelemetry))
  }

  // Simulate specific scenarios
  simulateScenario(scenario: "deployment" | "storm" | "low_power" | "high_activity") {
    let telemetryOverride: Partial<BeastWagonTelemetry> = {}

    switch (scenario) {
      case "deployment":
        telemetryOverride = {
          containerStatus: "deploying",
          power: 250,
          temperature: 55,
        }
        break

      case "storm":
        telemetryOverride = {
          signalStrength: 25,
          solar: 50,
          temperature: 15,
          sensors: {
            radar: true,
            camera: false, // Camera disabled in storm
            drone: false,
            scanner: true,
          },
        }
        break

      case "low_power":
        telemetryOverride = {
          battery: 15,
          solar: 25,
          power: 75,
          powerSource: "battery",
          sensors: {
            radar: false, // Non-essential sensors disabled
            camera: true,
            drone: false,
            scanner: false,
          },
        }
        break

      case "high_activity":
        telemetryOverride = {
          power: 350,
          temperature: 65,
          signalStrength: 95,
          sensors: {
            radar: true,
            camera: true,
            drone: true,
            scanner: true,
          },
        }
        break
    }

    this.injectTelemetry(telemetryOverride)
  }

  isSimulatorRunning(): boolean {
    return this.isRunning
  }

  setUpdateInterval(interval: number) {
    this.updateInterval = interval
    if (this.isRunning) {
      this.stop()
      this.start()
    }
  }

  setBaseLocation(lat: number, lng: number, alt: number) {
    this.baseLocation = { lat, lng, alt }
  }
}

// Singleton instance
export const beastWagonTelemetry = new TelemetrySimulator()
