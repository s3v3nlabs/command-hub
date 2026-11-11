#!/usr/bin/env node
/**
 * Environment Validation Script
 * Validates environment configuration and provides setup guidance
 */

const fs = require("fs")
const path = require("path")

console.log("⚬ COMMANDHUB ENVIRONMENT VALIDATOR ⚬\n")

// Check if .env.local exists
if (!fs.existsSync(".env.local")) {
  console.log("❌ .env.local not found")
  console.log("💡 Run: npm run setup:env to create environment configuration\n")
  process.exit(1)
}

// Load environment variables
require("dotenv").config({ path: ".env.local" })

const errors = []
const warnings = []
const info = []

// Required keys validation
const requiredKeys = ["WHISPER_MESH_ENCRYPTION_KEY", "GRAPHENE_BRIDGE_KEY", "GRAPHENE_CERT_PATH", "GRAPHENE_KEY_PATH"]

console.log("🔐 Validating Security Keys...")
requiredKeys.forEach((key) => {
  if (!process.env[key]) {
    errors.push(`Missing required environment variable: ${key}`)
  } else {
    console.log(`✓ ${key}`)
  }
})

// Certificate validation
console.log("\n📜 Validating Certificates...")
const certPath = process.env.GRAPHENE_CERT_PATH
const keyPath = process.env.GRAPHENE_KEY_PATH

if (certPath && fs.existsSync(certPath)) {
  console.log(`✓ Certificate found: ${certPath}`)
} else {
  errors.push(`Certificate not found: ${certPath}`)
}

if (keyPath && fs.existsSync(keyPath)) {
  console.log(`✓ Private key found: ${keyPath}`)
} else {
  errors.push(`Private key not found: ${keyPath}`)
}

// API Keys validation
console.log("\n🔑 Checking API Keys...")
const apiKeys = {
  OpenAI: process.env.OPENAI_API_KEY,
  Groq: process.env.GROQ_API_KEY,
  xAI: process.env.XAI_API_KEY,
  Shodan: process.env.SHODAN_API_KEY,
  Mapbox: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
}

Object.entries(apiKeys).forEach(([name, key]) => {
  if (key && key.length > 0) {
    console.log(`✓ ${name} API key configured`)
  } else {
    warnings.push(`${name} API key not configured`)
  }
})

// Database validation
console.log("\n🗄️  Validating Database Configuration...")
const dbType = process.env.DB_TYPE || "postgresql"
console.log(`Database type: ${dbType}`)

if (dbType === "postgresql") {
  if (process.env.POSTGRES_URL) {
    console.log("✓ PostgreSQL URL configured")
  } else {
    errors.push("PostgreSQL URL not configured")
  }
} else if (dbType === "sqlite") {
  const sqlitePath = process.env.SQLITE_DATABASE_PATH || "./data/commandhub.db"
  const sqliteDir = path.dirname(sqlitePath)
  if (!fs.existsSync(sqliteDir)) {
    fs.mkdirSync(sqliteDir, { recursive: true })
    console.log(`✓ Created SQLite directory: ${sqliteDir}`)
  }
  console.log(`✓ SQLite path: ${sqlitePath}`)
}

// Network configuration
console.log("\n🌐 Network Configuration...")
const whisperPort = process.env.WHISPER_MESH_PORT || "8888"
const graphenePort = process.env.GRAPHENE_BRIDGE_PORT || "9999"
const httpsPort = process.env.HTTPS_PORT || "8443"

console.log(`WhisperMesh port: ${whisperPort}`)
console.log(`GrapheneBridge port: ${graphenePort}`)
console.log(`HTTPS port: ${httpsPort}`)

// Security features
console.log("\n🛡️  Security Features...")
const features = {
  Encryption: process.env.ENCRYPTION_ENABLED !== "false",
  "V0 Bridge": process.env.V0_BRIDGE_ENABLED === "true",
  "Consciousness Mode": process.env.V0_CONSCIOUSNESS_MODE === "true",
  VPN: process.env.VPN_ENABLED === "true",
  Tor: process.env.TOR_ENABLED === "true",
  "Air-gap Mode": process.env.AIRGAP_MODE === "true",
}

Object.entries(features).forEach(([name, enabled]) => {
  console.log(`${enabled ? "✓" : "○"} ${name}: ${enabled ? "enabled" : "disabled"}`)
})

// Results
console.log("\n⚬ VALIDATION RESULTS ⚬")

if (errors.length > 0) {
  console.log("\n❌ ERRORS:")
  errors.forEach((error) => console.log(`   ${error}`))
}

if (warnings.length > 0) {
  console.log("\n⚠️  WARNINGS:")
  warnings.forEach((warning) => console.log(`   ${warning}`))
}

if (errors.length === 0) {
  console.log("\n✅ Environment validation passed!")
  console.log("\nNext steps:")
  console.log("1. Start development: npm run dev")
  console.log("2. Or start with services: npm run services:start && npm run dev")

  if (warnings.length > 0) {
    console.log("\n💡 Optional: Add missing API keys for full functionality")
  }
} else {
  console.log("\n🔧 Fix the errors above, then run validation again")
  console.log("💡 Quick fix: npm run setup:keys")
  process.exit(1)
}
