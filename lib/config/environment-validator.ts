/**
 * Environment Configuration Validator
 * Enhanced with ALLOWED_ORIGINS validation and management
 */

import * as fs from "fs"

export interface EnvironmentConfig {
  // Deployment
  nodeEnv: "development" | "production" | "test"
  deploymentType: "local-dev" | "wsl2-dev" | "vm-prod" | "pi-zero" | "docker" | "cloud"
  appUrl: string
  port: number

  // Database
  dbType: "postgresql" | "mysql" | "sqlite"
  databaseUrl?: string
  sqlitePath?: string

  // Security Keys
  whisperMeshKey: string
  grapheneBridgeKey: string
  grapheneCertPath: string
  grapheneKeyPath: string
  dbEncryptionKey: string
  jwtSecret: string
  apiEncryptionKey: string

  // Networking
  whisperMeshPort: number
  whisperMeshNodes: string[]
  grapheneBridgePort: number
  httpsPort: number
  allowedOrigins: string[]

  // Features
  v0BridgeEnabled: boolean
  consciousnessMode: boolean
  encryptionEnabled: boolean
  vpnEnabled: boolean
  torEnabled: boolean
  airgapMode: boolean

  // API Keys
  openaiApiKey?: string
  groqApiKey?: string
  xaiApiKey?: string
  shodanApiKey?: string
  mapboxToken?: string
}

export class EnvironmentValidator {
  private static instance: EnvironmentValidator
  private config: EnvironmentConfig

  private constructor() {
    this.config = this.validateAndLoadConfig()
  }

  public static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator()
    }
    return EnvironmentValidator.instance
  }

  public getConfig(): EnvironmentConfig {
    return this.config
  }

  private validateAndLoadConfig(): EnvironmentConfig {
    const errors: string[] = []
    const warnings: string[] = []

    // Required environment variables
    const requiredKeys = ["WHISPER_MESH_ENCRYPTION_KEY", "GRAPHENE_BRIDGE_KEY", "DB_ENCRYPTION_KEY", "JWT_SECRET"]

    for (const key of requiredKeys) {
      if (!process.env[key]) {
        errors.push(`Missing required environment variable: ${key}`)
      }
    }

    // Validate paths exist
    const certPath = process.env.GRAPHENE_CERT_PATH || "./certs/graphene-bridge.crt"
    const keyPath = process.env.GRAPHENE_KEY_PATH || "./certs/graphene-bridge.key"

    if (process.env.NODE_ENV !== "test") {
      try {
        if (!fs.existsSync(certPath)) {
          errors.push(`GrapheneBridge certificate not found: ${certPath}`)
        }
        if (!fs.existsSync(keyPath)) {
          errors.push(`GrapheneBridge private key not found: ${keyPath}`)
        }
      } catch (err) {
        console.warn("Could not validate certificate paths:", err)
      }
    }

    // Parse and validate ALLOWED_ORIGINS
    const allowedOrigins = this.parseAndValidateOrigins()

    // Validate origins for production
    if (process.env.NODE_ENV === "production") {
      const originValidation = this.validateProductionOrigins(allowedOrigins)
      warnings.push(...originValidation.warnings)
      if (!originValidation.valid) {
        errors.push(...originValidation.errors)
      }
    }

    // Parse WhisperMesh nodes
    const whisperMeshNodes = process.env.WHISPER_MESH_NODES
      ? process.env.WHISPER_MESH_NODES.split(",").map((node) => node.trim())
      : ["localhost:8889", "localhost:8890"]

    if (errors.length > 0) {
      console.error("⚠️  Environment Configuration Errors:")
      errors.forEach((error) => console.error(`   ${error}`))
      console.error("\n💡 Run: npm run setup:keys to generate missing keys")
      console.error("💡 Run: npm run configure:origins to setup CORS origins")

      if (process.env.NODE_ENV === "production") {
        throw new Error("Invalid environment configuration for production")
      }
    }

    if (warnings.length > 0) {
      console.warn("⚠️  Environment Configuration Warnings:")
      warnings.forEach((warning) => console.warn(`   ${warning}`))
    }

    return {
      // Deployment
      nodeEnv: (process.env.NODE_ENV as any) || "development",
      deploymentType: (process.env.DEPLOYMENT_TYPE as any) || "local-dev",
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      port: Number.parseInt(process.env.PORT || "3000"),

      // Database
      dbType: (process.env.DB_TYPE as any) || "postgresql",
      databaseUrl: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      sqlitePath: process.env.SQLITE_DATABASE_PATH || "./data/commandhub.db",

      // Security Keys
      whisperMeshKey: process.env.WHISPER_MESH_ENCRYPTION_KEY || "",
      grapheneBridgeKey: process.env.GRAPHENE_BRIDGE_KEY || "",
      grapheneCertPath: certPath,
      grapheneKeyPath: keyPath,
      dbEncryptionKey: process.env.DB_ENCRYPTION_KEY || "",
      jwtSecret: process.env.JWT_SECRET || "",
      apiEncryptionKey: process.env.API_ENCRYPTION_KEY || "",

      // Networking
      whisperMeshPort: Number.parseInt(process.env.WHISPER_MESH_PORT || "8888"),
      whisperMeshNodes: whisperMeshNodes,
      grapheneBridgePort: Number.parseInt(process.env.GRAPHENE_BRIDGE_PORT || "9999"),
      httpsPort: Number.parseInt(process.env.HTTPS_PORT || "8443"),
      allowedOrigins: allowedOrigins,

      // Features
      v0BridgeEnabled: process.env.V0_BRIDGE_ENABLED === "true",
      consciousnessMode: process.env.V0_CONSCIOUSNESS_MODE === "true",
      encryptionEnabled: process.env.ENCRYPTION_ENABLED !== "false",
      vpnEnabled: process.env.VPN_ENABLED === "true",
      torEnabled: process.env.TOR_ENABLED === "true",
      airgapMode: process.env.AIRGAP_MODE === "true",

      // API Keys
      openaiApiKey: process.env.OPENAI_API_KEY,
      groqApiKey: process.env.GROQ_API_KEY,
      xaiApiKey: process.env.XAI_API_KEY,
      shodanApiKey: process.env.SHODAN_API_KEY,
      mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    }
  }

  private parseAndValidateOrigins(): string[] {
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS
    const deploymentType = process.env.DEPLOYMENT_TYPE || "local-dev"

    // Default origins based on deployment type
    const defaultOrigins = this.getDefaultOrigins(deploymentType)

    if (!allowedOriginsEnv) {
      console.log(`ℹ️  Using default origins for ${deploymentType}`)
      return defaultOrigins
    }

    // Parse comma-separated origins
    const parsedOrigins = allowedOriginsEnv
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0)

    // Validate each origin
    const validOrigins: string[] = []
    const invalidOrigins: string[] = []

    for (const origin of parsedOrigins) {
      if (this.validateOrigin(origin)) {
        validOrigins.push(origin)
      } else {
        invalidOrigins.push(origin)
      }
    }

    if (invalidOrigins.length > 0) {
      console.warn(`⚠️  Invalid origins ignored: ${invalidOrigins.join(", ")}`)
    }

    if (validOrigins.length === 0) {
      console.warn("⚠️  No valid origins found, using defaults")
      return defaultOrigins
    }

    // Combine with defaults for development
    if (process.env.NODE_ENV === "development") {
      return [...new Set([...validOrigins, ...defaultOrigins])]
    }

    return validOrigins
  }

  private getDefaultOrigins(deploymentType: string): string[] {
    switch (deploymentType) {
      case "local-dev":
      case "wsl2-dev":
        return [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://127.0.0.1:3000",
          "https://localhost:8443",
          "https://127.0.0.1:8443",
        ]

      case "pi-zero":
        return [
          "https://localhost:8443",
          "https://127.0.0.1:8443",
          "https://raspberrypi.local:8443",
          "https://commandhub.local:8443",
        ]

      case "vm-prod":
        return ["https://commandhub.local:8443", "https://192.168.56.100:8443", "https://10.0.0.100:8443"]

      case "docker":
        return ["https://localhost:8443", "https://commandhub:8443", "https://commandhub.docker.internal:8443"]

      case "cloud":
        return [] // Must be explicitly configured

      default:
        return ["http://localhost:3000"]
    }
  }

  private validateOrigin(origin: string): boolean {
    // Allow wildcard for development
    if (origin === "*") {
      return process.env.NODE_ENV === "development"
    }

    // Validate URL format
    try {
      const url = new URL(origin)

      // Must be HTTP or HTTPS
      if (!["http:", "https:"].includes(url.protocol)) {
        return false
      }

      // Must have valid hostname
      if (!url.hostname) {
        return false
      }

      // Additional validation for production
      if (process.env.NODE_ENV === "production") {
        // No localhost in production
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          return false
        }

        // Prefer HTTPS in production
        if (url.protocol === "http:") {
          console.warn(`⚠️  HTTP origin in production: ${origin}`)
        }
      }

      return true
    } catch (error) {
      return false
    }
  }

  private validateProductionOrigins(origins: string[]): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for wildcard
    if (origins.includes("*")) {
      errors.push("Wildcard origin (*) not allowed in production")
    }

    // Check for localhost
    const localhostOrigins = origins.filter((origin) => origin.includes("localhost") || origin.includes("127.0.0.1"))
    if (localhostOrigins.length > 0) {
      errors.push(`Localhost origins not allowed in production: ${localhostOrigins.join(", ")}`)
    }

    // Check for HTTP
    const httpOrigins = origins.filter((origin) => origin.startsWith("http://"))
    if (httpOrigins.length > 0) {
      warnings.push(`HTTP origins detected in production: ${httpOrigins.join(", ")}`)
    }

    // Check for empty origins
    if (origins.length === 0) {
      errors.push("No allowed origins configured for production")
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  public validateApiKeys(): { valid: string[]; missing: string[] } {
    const apiKeys = {
      OpenAI: this.config.openaiApiKey,
      Groq: this.config.groqApiKey,
      xAI: this.config.xaiApiKey,
      Shodan: this.config.shodanApiKey,
      Mapbox: this.config.mapboxToken,
    }

    const valid: string[] = []
    const missing: string[] = []

    Object.entries(apiKeys).forEach(([name, key]) => {
      if (key && key.length > 0) {
        valid.push(name)
      } else {
        missing.push(name)
      }
    })

    return { valid, missing }
  }

  public validateOrigins(): { valid: boolean; origins: string[]; warnings: string[] } {
    const warnings: string[] = []

    // Check for wildcard in production
    if (this.config.nodeEnv === "production" && this.config.allowedOrigins.includes("*")) {
      warnings.push("Wildcard origin (*) detected in production")
    }

    // Check for HTTP in production
    if (this.config.nodeEnv === "production") {
      const httpOrigins = this.config.allowedOrigins.filter((origin) => origin.startsWith("http://"))
      if (httpOrigins.length > 0) {
        warnings.push(`HTTP origins in production: ${httpOrigins.join(", ")}`)
      }
    }

    return {
      valid: warnings.length === 0,
      origins: this.config.allowedOrigins,
      warnings,
    }
  }

  public getSecurityStatus(): {
    encryptionEnabled: boolean
    keysGenerated: boolean
    certificatesValid: boolean
    networkSecure: boolean
    originsSecure: boolean
  } {
    const originValidation = this.validateOrigins()

    return {
      encryptionEnabled: this.config.encryptionEnabled,
      keysGenerated: !!(this.config.whisperMeshKey && this.config.grapheneBridgeKey),
      certificatesValid: !!(this.config.grapheneCertPath && this.config.grapheneKeyPath),
      networkSecure: this.config.vpnEnabled || this.config.torEnabled || this.config.airgapMode,
      originsSecure: originValidation.valid,
    }
  }

  public addAllowedOrigin(origin: string): boolean {
    if (!this.validateOrigin(origin)) {
      return false
    }

    if (!this.config.allowedOrigins.includes(origin)) {
      this.config.allowedOrigins.push(origin)
      this.updateEnvironmentFile("ALLOWED_ORIGINS", this.config.allowedOrigins.join(","))
      return true
    }

    return false
  }

  public removeAllowedOrigin(origin: string): boolean {
    const index = this.config.allowedOrigins.indexOf(origin)
    if (index > -1) {
      this.config.allowedOrigins.splice(index, 1)
      this.updateEnvironmentFile("ALLOWED_ORIGINS", this.config.allowedOrigins.join(","))
      return true
    }
    return false
  }

  private updateEnvironmentFile(key: string, value: string): void {
    const envFile = ".env.local"

    if (!fs.existsSync(envFile)) {
      fs.writeFileSync(envFile, `${key}=${value}\n`)
      return
    }

    let content = fs.readFileSync(envFile, "utf8")
    const regex = new RegExp(`^${key}=.*$`, "m")

    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`)
    } else {
      content += `\n${key}=${value}\n`
    }

    fs.writeFileSync(envFile, content)
  }
}

// Export singleton instance
export const envConfig = EnvironmentValidator.getInstance()
