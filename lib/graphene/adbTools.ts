import { spawn } from "child_process"
import { promises as fs } from "fs"
import path from "path"

export interface ADBDevice {
  id: string
  model: string
  status: "device" | "offline" | "unauthorized" | "recovery" | "bootloader"
  transport: "usb" | "wifi"
  product: string
  androidVersion: string
  apiLevel: number
  batteryLevel?: number
  isGrapheneOS: boolean
  ipAddress?: string
  resolution?: string
  density?: number
}

export interface APKInfo {
  packageName: string
  versionName: string
  versionCode: number
  size: number
  permissions: string[]
  installLocation: string
}

export interface ScreenCapture {
  timestamp: Date
  format: "png" | "jpg"
  resolution: string
  size: number
  data: string // base64 encoded
}

export interface CallLog {
  id: string
  number: string
  name?: string
  type: "incoming" | "outgoing" | "missed"
  timestamp: Date
  duration: number
}

export interface SMSMessage {
  id: string
  address: string
  body: string
  type: "inbox" | "sent"
  timestamp: Date
  read: boolean
}

export class ADBTools {
  private devices: Map<string, ADBDevice> = new Map()
  private isConnected = false
  private adbPath: string

  constructor() {
    // Try to find ADB in common locations
    this.adbPath = this.findADBPath()
    this.initializeADB()
  }

  private findADBPath(): string {
    const commonPaths = [
      "/usr/bin/adb",
      "/usr/local/bin/adb",
      "/opt/android-sdk/platform-tools/adb",
      "C:\\Program Files\\Android\\android-sdk\\platform-tools\\adb.exe",
      "C:\\Android\\android-sdk\\platform-tools\\adb.exe",
      process.env.ANDROID_HOME ? path.join(process.env.ANDROID_HOME, "platform-tools", "adb") : "",
    ].filter(Boolean)

    // Default to 'adb' and let PATH resolve it
    return "adb"
  }

  private async executeADB(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.adbPath, args)
      let stdout = ""
      let stderr = ""

      process.stdout.on("data", (data) => {
        stdout += data.toString()
      })

      process.stderr.on("data", (data) => {
        stderr += data.toString()
      })

      process.on("close", (code) => {
        if (code === 0) {
          resolve(stdout.trim())
        } else {
          reject(new Error(`ADB command failed: ${stderr || stdout}`))
        }
      })

      process.on("error", (error) => {
        reject(new Error(`Failed to execute ADB: ${error.message}`))
      })
    })
  }

  private async initializeADB(): Promise<void> {
    try {
      await this.executeADB(["version"])
      this.isConnected = true
      console.log("ADB connection initialized successfully")
    } catch (error) {
      console.error("Failed to initialize ADB:", error)
      this.isConnected = false
    }
  }

  async getDevices(): Promise<ADBDevice[]> {
    if (!this.isConnected) {
      throw new Error("ADB not connected")
    }

    try {
      const output = await this.executeADB(["devices", "-l"])
      const lines = output.split("\n").slice(1) // Skip header
      const devices: ADBDevice[] = []

      for (const line of lines) {
        if (line.trim() === "") continue

        const parts = line.split(/\s+/)
        if (parts.length < 2) continue

        const deviceId = parts[0]
        const status = parts[1] as ADBDevice["status"]

        if (status === "device") {
          try {
            // Get device details
            const model = await this.executeADB(["-s", deviceId, "shell", "getprop", "ro.product.model"])
            const product = await this.executeADB(["-s", deviceId, "shell", "getprop", "ro.product.name"])
            const androidVersion = await this.executeADB([
              "-s",
              deviceId,
              "shell",
              "getprop",
              "ro.build.version.release",
            ])
            const apiLevel = await this.executeADB(["-s", deviceId, "shell", "getprop", "ro.build.version.sdk"])
            const buildFingerprint = await this.executeADB(["-s", deviceId, "shell", "getprop", "ro.build.fingerprint"])

            // Check if it's GrapheneOS
            const isGrapheneOS =
              buildFingerprint.includes("GrapheneOS") ||
              buildFingerprint.includes("grapheneos") ||
              product.includes("graphene")

            // Get battery level
            let batteryLevel: number | undefined
            try {
              const batteryOutput = await this.executeADB(["-s", deviceId, "shell", "dumpsys", "battery"])
              const levelMatch = batteryOutput.match(/level: (\d+)/)
              if (levelMatch) {
                batteryLevel = Number.parseInt(levelMatch[1])
              }
            } catch (e) {
              // Battery info not available
            }

            // Get display info
            let resolution: string | undefined
            let density: number | undefined
            try {
              const displayOutput = await this.executeADB(["-s", deviceId, "shell", "wm", "size"])
              const sizeMatch = displayOutput.match(/Physical size: (\d+x\d+)/)
              if (sizeMatch) {
                resolution = sizeMatch[1]
              }

              const densityOutput = await this.executeADB(["-s", deviceId, "shell", "wm", "density"])
              const densityMatch = densityOutput.match(/Physical density: (\d+)/)
              if (densityMatch) {
                density = Number.parseInt(densityMatch[1])
              }
            } catch (e) {
              // Display info not available
            }

            const device: ADBDevice = {
              id: deviceId,
              model: model.trim(),
              status,
              transport: line.includes("usb:") ? "usb" : "wifi",
              product: product.trim(),
              androidVersion: androidVersion.trim(),
              apiLevel: Number.parseInt(apiLevel.trim()),
              batteryLevel,
              isGrapheneOS,
              resolution,
              density,
            }

            devices.push(device)
            this.devices.set(deviceId, device)
          } catch (error) {
            console.error(`Failed to get details for device ${deviceId}:`, error)
          }
        }
      }

      return devices
    } catch (error) {
      throw new Error(`Failed to get devices: ${error}`)
    }
  }

  async installAPK(deviceId: string, apkPath: string): Promise<boolean> {
    if (!this.devices.has(deviceId)) {
      throw new Error(`Device ${deviceId} not found`)
    }

    try {
      await this.executeADB(["-s", deviceId, "install", apkPath])
      return true
    } catch (error) {
      throw new Error(`Failed to install APK: ${error}`)
    }
  }

  async uninstallPackage(deviceId: string, packageName: string): Promise<boolean> {
    if (!this.devices.has(deviceId)) {
      throw new Error(`Device ${deviceId} not found`)
    }

    try {
      await this.executeADB(["-s", deviceId, "uninstall", packageName])
      return true
    } catch (error) {
      throw new Error(`Failed to uninstall package: ${error}`)
    }
  }

  async getInstalledPackages(deviceId: string): Promise<APKInfo[]> {
    if (!this.devices.has(deviceId)) {
      throw new Error(`Device ${deviceId} not found`)
    }

    try {
      const output = await this.executeADB(["-s", deviceId, "shell", "pm", "list", "packages", "-f"])
      const packages: APKInfo[] = []

      for (const line of output.split("\n")) {
        if (!line.startsWith("package:")) continue

        const match = line.match(/package:(.+)=(.+)/)
        if (!match) continue

        const [, apkPath, packageName] = match

        try {
          // Get package info
          const infoOutput = await this.executeADB(["-s", deviceId, "shell", "dumpsys", "package", packageName])

          let versionName = "Unknown"
          let versionCode = 0
          const versionNameMatch = infoOutput.match(/versionName=([^\s]+)/)
          const versionCodeMatch = infoOutput.match(/versionCode=(\d+)/)

          if (versionNameMatch) versionName = versionNameMatch[1]
          if (versionCodeMatch) versionCode = Number.parseInt(versionCodeMatch[1])

          // Get APK size
          let size = 0
          try {
            const sizeOutput = await this.executeADB(["-s", deviceId, "shell", "stat", "-c", "%s", apkPath])
            size = Number.parseInt(sizeOutput.trim())
          } catch (e) {
            // Size not available
          }

          // Get permissions
          const permissions: string[] = []
          const permissionMatches = infoOutput.match(/android\.permission\.[A-Z_]+/g)
          if (permissionMatches) {
            permissions.push(...permissionMatches)
          }

          packages.push({
            packageName,
            versionName,
            versionCode,
            size,
            permissions: [...new Set(permissions)], // Remove duplicates
            installLocation: "auto",
          })
        } catch (error) {
          // Skip packages we can't get info for
          console.warn(`Failed to get info for package ${packageName}:`, error)
        }
      }

      return packages
    } catch (error) {
      throw new Error(`Failed to get installed packages: ${error}`)
    }
  }

  async captureScreen(deviceId: string, format: "png" | "jpg" = "png"): Promise<ScreenCapture> {
    if (!this.devices.has(deviceId)) {
      throw new Error(`Device ${deviceId} not found`)
    }

    try {
      const remotePath = `/sdcard/screenshot.${format}`
      const localPath = `/tmp/screenshot_${deviceId}_${Date.now()}.${format}`

      // Capture screenshot on device
      await this.executeADB(["-s", deviceId, "shell", "screencap", "-p", remotePath])

      // Pull screenshot to local machine
      await this.executeADB(["-s", deviceId, "pull", remotePath, localPath])

      // Read file and convert to base64
      const fileBuffer = await fs.readFile(localPath)
      const base64Data = fileBuffer.toString("base64")

      // Clean up files
      await this.executeADB(["-s", deviceId, "shell", "rm", remotePath])
      await fs.unlink(localPath)

      const device = this.devices.get(deviceId)!

      return {
        timestamp: new Date(),
        format,
        resolution: device.resolution || "Unknown",
        size: fileBuffer.length,
        data: base64Data,
      }
    } catch (error) {
      throw new Error(`Failed to capture screen: ${error}`)
    }
  }

  async executeShellCommand(deviceId: string, command: string): Promise<string> {
    if (!this.devices.has(deviceId)) {
      throw new Error(`Device ${deviceId} not found`)
    }

    try {
      return await this.executeADB(["-s", deviceId, "shell", command])
    } catch (error) {
      throw new Error(`Failed to execute shell command: ${error}`)
    }
  }

  async pushFile(deviceId: string, localPath: string, remotePath: string): Promise<boolean> {
    if (!this.devices.has(deviceId)) {
      throw new Error(`Device ${deviceId} not found`)
    }

    try {
      await this.executeADB(["-s", deviceId, "push", localPath, remotePath])
      return true
    } catch (error) {
      throw new Error(`Failed to push file: ${error}`)
    }
  }

  async pullFile(deviceId: string, remotePath: string, localPath: string): Promise<boolean> {
    if (!this.devices.has(deviceId)) {
      throw new Error(`Device ${deviceId} not found`)
    }

    try {
      await this.executeADB(["-s", deviceId, "pull", remotePath, localPath])
      return true
    } catch (error) {
      throw new Error(`Failed to pull file: ${error}`)
    }
  }

  async rebootDevice(deviceId: string, mode: "system" | "recovery" | "bootloader" = "system"): Promise<void> {
    if (!this.devices.has(deviceId)) {
      throw new Error(`Device ${deviceId} not found`)
    }

    try {
      const args = ["-s", deviceId, "reboot"]
      if (mode !== "system") {
        args.push(mode)
      }
      await this.executeADB(args)
    } catch (error) {
      throw new Error(`Failed to reboot device: ${error}`)
    }
  }

  async getCallLog(deviceId: string): Promise<CallLog[]> {
    if (!this.devices.has(deviceId)) {
      throw new Error(`Device ${deviceId} not found`)
    }

    try {
      const output = await this.executeADB([
        "-s",
        deviceId,
        "shell",
        "content",
        "query",
        "--uri",
        "content://call_log/calls",
        "--projection",
        "number,date,duration,type",
      ])

      const calls: CallLog[] = []
      const lines = output.split("\n").slice(1) // Skip header

      for (const line of lines) {
        if (!line.trim()) continue

        const parts = line.split(",")
        if (parts.length >= 4) {
          const [number, dateStr, durationStr, typeStr] = parts

          calls.push({
            id: `call_${Date.now()}_${Math.random()}`,
            number: number.trim(),
            type: typeStr === "1" ? "incoming" : typeStr === "2" ? "outgoing" : "missed",
            timestamp: new Date(Number.parseInt(dateStr)),
            duration: Number.parseInt(durationStr),
          })
        }
      }

      return calls
    } catch (error) {
      throw new Error(`Failed to get call log: ${error}`)
    }
  }

  async getSMSMessages(deviceId: string): Promise<SMSMessage[]> {
    if (!this.devices.has(deviceId)) {
      throw new Error(`Device ${deviceId} not found`)
    }

    try {
      const output = await this.executeADB([
        "-s",
        deviceId,
        "shell",
        "content",
        "query",
        "--uri",
        "content://sms",
        "--projection",
        "address,body,date,type,read",
      ])

      const messages: SMSMessage[] = []
      const lines = output.split("\n").slice(1) // Skip header

      for (const line of lines) {
        if (!line.trim()) continue

        const parts = line.split(",")
        if (parts.length >= 5) {
          const [address, body, dateStr, typeStr, readStr] = parts

          messages.push({
            id: `sms_${Date.now()}_${Math.random()}`,
            address: address.trim(),
            body: body.trim(),
            type: typeStr === "1" ? "inbox" : "sent",
            timestamp: new Date(Number.parseInt(dateStr)),
            read: readStr === "1",
          })
        }
      }

      return messages
    } catch (error) {
      throw new Error(`Failed to get SMS messages: ${error}`)
    }
  }

  async getBatteryInfo(deviceId: string): Promise<{ level: number; status: string; temperature: number }> {
    if (!this.devices.has(deviceId)) {
      throw new Error(`Device ${deviceId} not found`)
    }

    try {
      const output = await this.executeADB(["-s", deviceId, "shell", "dumpsys", "battery"])

      const levelMatch = output.match(/level: (\d+)/)
      const statusMatch = output.match(/status: (\d+)/)
      const temperatureMatch = output.match(/temperature: (\d+)/)

      const statusMap: { [key: string]: string } = {
        "1": "Unknown",
        "2": "Charging",
        "3": "Discharging",
        "4": "Not charging",
        "5": "Full",
      }

      return {
        level: levelMatch ? Number.parseInt(levelMatch[1]) : 0,
        status: statusMatch ? statusMap[statusMatch[1]] || "Unknown" : "Unknown",
        temperature: temperatureMatch ? Number.parseInt(temperatureMatch[1]) / 10 : 0, // Convert from tenths of degrees
      }
    } catch (error) {
      throw new Error(`Failed to get battery info: ${error}`)
    }
  }

  async getSystemInfo(deviceId: string): Promise<{
    cpuUsage: number
    memoryUsage: number
    storageUsage: number
    uptime: string
  }> {
    if (!this.devices.has(deviceId)) {
      throw new Error(`Device ${deviceId} not found`)
    }

    try {
      // Get CPU usage
      const cpuOutput = await this.executeADB(["-s", deviceId, "shell", "cat", "/proc/loadavg"])
      const cpuMatch = cpuOutput.match(/^([\d.]+)/)
      const cpuUsage = cpuMatch ? Number.parseFloat(cpuMatch[1]) * 100 : 0

      // Get memory usage
      const memOutput = await this.executeADB(["-s", deviceId, "shell", "cat", "/proc/meminfo"])
      const totalMatch = memOutput.match(/MemTotal:\s+(\d+) kB/)
      const availableMatch = memOutput.match(/MemAvailable:\s+(\d+) kB/)

      let memoryUsage = 0
      if (totalMatch && availableMatch) {
        const total = Number.parseInt(totalMatch[1])
        const available = Number.parseInt(availableMatch[1])
        memoryUsage = ((total - available) / total) * 100
      }

      // Get storage usage
      const storageOutput = await this.executeADB(["-s", deviceId, "shell", "df", "/data"])
      const storageMatch = storageOutput.match(/\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)%/)
      const storageUsage = storageMatch ? Number.parseInt(storageMatch[4]) : 0

      // Get uptime
      const uptimeOutput = await this.executeADB(["-s", deviceId, "shell", "cat", "/proc/uptime"])
      const uptimeMatch = uptimeOutput.match(/^([\d.]+)/)
      let uptime = "Unknown"
      if (uptimeMatch) {
        const seconds = Number.parseInt(uptimeMatch[1])
        const days = Math.floor(seconds / 86400)
        const hours = Math.floor((seconds % 86400) / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        uptime = `${days}d ${hours}h ${minutes}m`
      }

      return {
        cpuUsage: Math.min(cpuUsage, 100),
        memoryUsage: Math.min(memoryUsage, 100),
        storageUsage,
        uptime,
      }
    } catch (error) {
      throw new Error(`Failed to get system info: ${error}`)
    }
  }

  isADBConnected(): boolean {
    return this.isConnected
  }

  disconnect(): void {
    this.devices.clear()
    this.isConnected = false
  }
}

// Singleton instance
export const adbTools = new ADBTools()
