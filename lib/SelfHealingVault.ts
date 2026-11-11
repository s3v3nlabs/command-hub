interface ProposalEntry {
  id: string
  timestamp: string
  action: string
  reason: string
  approved: boolean
  executedAt?: string
  result?: string
}

// In-memory storage for proposals (would be replaced with database in production)
const proposalHistory: ProposalEntry[] = []

/**
 * Stores a new proposal in the vault
 */
export function storeProposal(proposal: Omit<ProposalEntry, "id" | "timestamp">): ProposalEntry {
  const newEntry: ProposalEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    ...proposal,
  }

  proposalHistory.push(newEntry)

  // In production, this would write to a database
  return newEntry
}

/**
 * Retrieves historical proposal entries
 */
export function getProposalHistory(limit = 10): ProposalEntry[] {
  return [...proposalHistory].slice(-limit)
}

/**
 * Updates an existing proposal with execution results
 */
export function updateProposal(id: string, updates: Partial<ProposalEntry>): ProposalEntry | null {
  const index = proposalHistory.findIndex((p) => p.id === id)

  if (index === -1) return null

  proposalHistory[index] = {
    ...proposalHistory[index],
    ...updates,
  }

  return proposalHistory[index]
}

/**
 * Generates a simple ID for proposals
 */
function generateId(): string {
  return `prop-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}
