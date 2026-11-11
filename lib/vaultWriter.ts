import fs from "fs"
import path from "path"

/**
 * Logs a message to the vault
 * @param message The message to log
 * @param metadata Optional metadata to include with the log
 */
export async function logVault(message: string, metadata?: any) {
  // Log to console
  console.log("[VaultLog]", message, metadata || "")

  // Mock file system logging
  try {
    const dataDir = path.join(process.cwd(), "data")
    const filePath = path.join(dataDir, "healing.json")

    // Create directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Read existing logs or create new file
    let logs = []
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8")
      logs = JSON.parse(fileContent)
    }

    // Add new log entry
    logs.push({
      timestamp: new Date().toISOString(),
      message,
      metadata,
      level: metadata?.level || "info",
    })

    // Write back to file (keep only last 1000 logs)
    fs.writeFileSync(filePath, JSON.stringify(logs.slice(-1000), null, 2))

    return true
  } catch (error) {
    console.error("Failed to write to log file:", error)
    return false
  }
}
