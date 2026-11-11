"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type Proposal = {
  id: string
  module: string
  suggestion: string
  approved: boolean
  timestamp: string
}

type SelfHealingContextType = {
  memoryVault: Proposal[]
  setMemoryVault: (entries: Proposal[]) => void
  logProposal: (p: Proposal) => void
  approveLast: () => void
}

const SelfHealingContext = createContext<SelfHealingContextType | null>(null)

export function useSelfHealing() {
  const ctx = useContext(SelfHealingContext)
  if (!ctx) throw new Error("SelfHealingContext not found")
  return ctx
}

export function SelfHealingRouterProvider({ children }: { children: ReactNode }) {
  const [memoryVault, setMemoryVault] = useState<Proposal[]>([])

  const logProposal = (proposal: Proposal) => {
    setMemoryVault((prev) => [...prev, proposal])
  }

  const approveLast = () => {
    setMemoryVault((prev) => {
      if (!prev.length) return prev
      const last = prev[prev.length - 1]
      const updated = { ...last, approved: true }
      return [...prev.slice(0, -1), updated]
    })
  }

  return (
    <SelfHealingContext.Provider value={{ memoryVault, setMemoryVault, logProposal, approveLast }}>
      {children}
    </SelfHealingContext.Provider>
  )
}
