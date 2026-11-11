/**
 * CORS Manager - Cross-Origin Resource Sharing Configuration
 * Manages allowed origins for secure API access across different deployment scenarios
 */

import { envConfig } from "../config/environment-validator"
import { deploymentConfig } from "../deployment/deployment-config"

export interface CORSConfig {
  allowedOrigins: string[]
  allowedMethods: string[]
  allowedHeaders: string[]
  exposedHeaders: string[]
  credentials: boolean
  maxAge: number
  preflightContinue: boolean
  optionsSuccessStatus: number
}

export class CORSManager {
  private static instance: CORSManager
  private config: CORSConfig

  private constructor() {
    this.config = this.buildCORSConfig()
  }

  public static getInstance(): CORSManager {
    if (!CORSManager.instance) {
      CORSManager.instance = new CORSManager()
    }
    return CORSManager.instance
  }

  private buildCORSConfig(): CORSConfig {
    const envConf = envConfig.getConfig()
    const deployConf = deploymentConfig.getConfig()

    // Parse ALLOWED_ORIGINS from environment
    const allowedOrigins = this.parseAllowedOrigins()

    return {
      allowedOrigins,
      allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
      allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
        "X-Device-ID",
        "X-Node-ID",
        "X-API-Key",
        "X-Consciousness-Token",
        "X-Whisper-Mesh-ID",
        "X-GrapheneBridge-Token",
      ],
      exposedHeaders: [
        "X-Total-Count",
        "X-Rate-Limit-Remaining",
        "X-Rate-Limit-Reset",
        "X-Response-Time",
        "X-Node-Status",
        "X-Consciousness-State",
      ],
      credentials: true,
      maxAge: 86400, // 24 hours
      preflightContinue: false,
      optionsSuccessStatus: 200,
    }
  }

  private parseAllowedOrigins(): string[] {
    const envOrigins = process.env.ALLOWED_ORIGINS
    const deployConf = deploymentConfig.getConfig()

    // Default origins based on deployment type
    const defaultOrigins = this.getDefaultOrigins(deployConf.type)

    if (!envOrigins) {
      return defaultOrigins
    }

    // Parse comma-separated origins
    const parsedOrigins = envOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0)

    // Validate origins
    const validOrigins = parsedOrigins.filter((origin) => this.validateOrigin(origin))

    if (validOrigins.length === 0) {
      console.warn("⚠️  No valid origins found in ALLOWED_ORIGINS, using defaults")
      return defaultOrigins
    }

    return [...new Set([...validOrigins, ...defaultOrigins])]
  }

  private getDefaultOrigins(deploymentType: string): string[] {
    switch (deploymentType) {
      case "local-dev":
      case "wsl2-dev":
        return [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://127.0.0.1:3000",
          "http://127.0.0.1:3001",
          "https://localhost:8443",
          "https://127.0.0.1:8443",
        ]

      case "pi-zero":
        return [
          "https://localhost:8443",
          "https://127.0.0.1:8443",
          "https://192.168.1.100:8443", // Common Pi IP
          "https://commandhub.local:8443",
        ]

      case "vm-prod":
        return [
          "https://commandhub.local:8443",
          "https://192.168.56.100:8443", // VirtualBox default
          "https://10.0.0.100:8443", // VMware default
        ]

      case "docker":
        return ["https://localhost:8443", "https://commandhub:8443", "https://commandhub.docker.internal:8443"]

      case "cloud":
        return [] // Must be explicitly configured for cloud

      default:
        return ["http://localhost:3000"]
    }
  }

  private validateOrigin(origin: string): boolean {
    // Allow wildcard for development
    if (origin === "*") {
      const deployConf = deploymentConfig.getConfig()
      if (deployConf.environment === "development") {
        return true
      } else {
        console.warn("⚠️  Wildcard origin (*) not allowed in production")
        return false
      }
    }

    // Validate URL format
    try {
      const url = new URL(origin)

      // Must be HTTP or HTTPS
      if (!["http:", "https:"].includes(url.protocol)) {
        console.warn(`⚠️  Invalid protocol in origin: ${origin}`)
        return false
      }

      // Must have valid hostname
      if (!url.hostname) {
        console.warn(`⚠️  Invalid hostname in origin: ${origin}`)
        return false
      }

      return true
    } catch (error) {
      console.warn(`⚠️  Invalid origin format: ${origin}`)
      return false
    }
  }

  public getCORSConfig(): CORSConfig {
    return this.config
  }

  public isOriginAllowed(origin: string): boolean {
    if (!origin) return false

    // Check for wildcard
    if (this.config.allowedOrigins.includes("*")) {
      return true
    }

    // Exact match
    if (this.config.allowedOrigins.includes(origin)) {
      return true
    }

    // Pattern matching for subdomains
    return this.config.allowedOrigins.some((allowedOrigin) => {
      if (allowedOrigin.startsWith("*.")) {
        const domain = allowedOrigin.substring(2)
        return origin.endsWith(domain)
      }
      return false
    })
  }

  public addOrigin(origin: string): boolean {
    if (!this.validateOrigin(origin)) {
      return false
    }

    if (!this.config.allowedOrigins.includes(origin)) {
      this.config.allowedOrigins.push(origin)
      console.log(`✓ Added origin: ${origin}`)
    }

    return true
  }

  public removeOrigin(origin: string): boolean {
    const index = this.config.allowedOrigins.indexOf(origin)
    if (index > -1) {
      this.config.allowedOrigins.splice(index, 1)
      console.log(`✓ Removed origin: ${origin}`)
      return true
    }
    return false
  }

  public getExpressMiddleware() {
    return (req: any, res: any, next: any) => {
      const origin = req.headers.origin

      // Handle preflight requests
      if (req.method === "OPTIONS") {
        if (origin && this.isOriginAllowed(origin)) {
          res.header("Access-Control-Allow-Origin", origin)
        }

        res.header("Access-Control-Allow-Methods", this.config.allowedMethods.join(", "))
        res.header("Access-Control-Allow-Headers", this.config.allowedHeaders.join(", "))
        res.header("Access-Control-Max-Age", this.config.maxAge.toString())

        if (this.config.credentials) {
          res.header("Access-Control-Allow-Credentials", "true")
        }

        return res.status(this.config.optionsSuccessStatus).end()
      }

      // Handle actual requests
      if (origin && this.isOriginAllowed(origin)) {
        res.header("Access-Control-Allow-Origin", origin)
      }

      if (this.config.credentials) {
        res.header("Access-Control-Allow-Credentials", "true")
      }

      if (this.config.exposedHeaders.length > 0) {
        res.header("Access-Control-Expose-Headers", this.config.exposedHeaders.join(", "))
      }

      next()
    }
  }

  public getNextJSConfig() {
    return {
      async headers() {
        return [
          {
            source: "/api/:path*",
            headers: [
              {
                key: "Access-Control-Allow-Methods",
                value: this.config.allowedMethods.join(", "),
              },
              {
                key: "Access-Control-Allow-Headers",
                value: this.config.allowedHeaders.join(", "),
              },
              {
                key: "Access-Control-Max-Age",
                value: this.config.maxAge.toString(),
              },
            ],
          },
        ]
      },
    }
  }

  public logConfiguration(): void {
    console.log("⚬ CORS CONFIGURATION ⚬")
    console.log(`Allowed Origins: ${this.config.allowedOrigins.length}`)

    this.config.allowedOrigins.forEach((origin, index) => {
      console.log(`  ${index + 1}. ${origin}`)
    })

    console.log(`Credentials: ${this.config.credentials ? "enabled" : "disabled"}`)
    console.log(`Max Age: ${this.config.maxAge} seconds`)
    console.log(`Methods: ${this.config.allowedMethods.join(", ")}`)
  }

  public validateConfiguration(): { valid: boolean; warnings: string[] } {
    const warnings: string[] = []
    const deployConf = deploymentConfig.getConfig()

    // Check for wildcard in production
    if (deployConf.environment === "production" && this.config.allowedOrigins.includes("*")) {
      warnings.push("Wildcard origin (*) detected in production environment")
    }

    // Check for HTTP origins in production
    if (deployConf.environment === "production") {
      const httpOrigins = this.config.allowedOrigins.filter((origin) => origin.startsWith("http://"))
      if (httpOrigins.length > 0) {
        warnings.push(`HTTP origins detected in production: ${httpOrigins.join(", ")}`)
      }
    }

    // Check for localhost in production
    if (deployConf.environment === "production") {
      const localhostOrigins = this.config.allowedOrigins.filter(
        (origin) => origin.includes("localhost") || origin.includes("127.0.0.1"),
      )
      if (localhostOrigins.length > 0) {
        warnings.push(`Localhost origins detected in production: ${localhostOrigins.join(", ")}`)
      }
    }

    // Check for empty origins list
    if (this.config.allowedOrigins.length === 0) {
      warnings.push("No allowed origins configured - API will reject all cross-origin requests")
    }

    return {
      valid: warnings.length === 0,
      warnings,
    }
  }
}

// Export singleton instance
export const corsManager = CORSManager.getInstance()
