import fs from "fs"
import path from "path"

// In-memory storage as primary option
const memoryVault: Record<string, any[]> = {
  proposals: [],
}

/**
 * Stores a patch proposal in the vault
 * @param proposal The proposal to store
 */
export async function storeProposal(proposal: any) {
  // Add timestamp
  const timestampedProposal = {
    ...proposal,
    timestamp: new Date().toISOString(),
    id: `proposal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  }

  // Store in memory
  memoryVault.proposals.push(timestampedProposal)

  // Attempt to store in file system as fallback
  try {
    const dataDir = path.join(process.cwd(), "data")
    const filePath = path.join(dataDir, "selfHealingVault.json")

    // Create directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Read existing data or create new file
    let existingData: { proposals: any[] } = { proposals: [] }
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8")
      existingData = JSON.parse(fileContent)
    }

    // Add new proposal and write back
    existingData.proposals.push(timestampedProposal)
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2))
  } catch (error) {
    console.error("Failed to write to filesystem vault:", error)
    // Continue with in-memory storage only
  }

  return timestampedProposal
}

/**
 * Retrieves proposals from the vault
 * @param limit Maximum number of proposals to retrieve
 * @param filter Optional filter criteria
 */
export async function getProposals(limit = 10, filter?: Record<string, any>) {
  // Try to read from file system first
  try {
    const filePath = path.join(process.cwd(), "data", "selfHealingVault.json")

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8")
      const data = JSON.parse(fileContent)

      let proposals = data.proposals || []

      // Apply filter if provided
      if (filter) {
        proposals = proposals.filter((p: any) => {
          for (const [key, value] of Object.entries(filter)) {
            if (p[key] !== value) return false
          }
          return true
        })
      }

      // Sort by timestamp (newest first) and limit
      return proposals
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
    }
  } catch (error) {
    console.error("Failed to read from filesystem vault:", error)
    // Fall back to memory storage
  }

  // Return from memory storage
  let proposals = [...memoryVault.proposals]

  // Apply filter if provided
  if (filter) {
    proposals = proposals.filter((p) => {
      for (const [key, value] of Object.entries(filter)) {
        if (p[key] !== value) return false
      }
      return true
    })
  }

  // Sort by timestamp (newest first) and limit
  return proposals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit)
}
