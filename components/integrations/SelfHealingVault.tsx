"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type VaultEntry = {
  id: string
  module: string
  suggestion: string
  approved: boolean
  timestamp: string
}

export function SelfHealingVault() {
  const [filter, setFilter] = useState("")
  const [entries, setEntries] = useState<VaultEntry[]>([
    {
      id: "001",
      module: "SignalVisualizer.tsx",
      suggestion: "Guard array map with array?.length check",
      approved: true,
      timestamp: "2025-05-07T14:21:33Z",
    },
    {
      id: "002",
      module: "ReconScanner.tsx",
      suggestion: "Add fallback for missing domain config props",
      approved: false,
      timestamp: "2025-05-07T14:23:44Z",
    },
  ])

  const filtered = entries.filter(
    (e) =>
      e.module.toLowerCase().includes(filter.toLowerCase()) ||
      e.suggestion.toLowerCase().includes(filter.toLowerCase()),
  )

  return (
    <Card className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">AI Proposal Vault</h2>
      <div className="space-y-2">
        <Label>Filter by keyword or module</Label>
        <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="e.g., SignalVisualizer" />
      </div>

      <Table className="mt-4">
        <TableHeader>
          <TableRow>
            <TableHead>Module</TableHead>
            <TableHead>Suggestion</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-medium">{entry.module}</TableCell>
              <TableCell>{entry.suggestion}</TableCell>
              <TableCell>
                <Badge variant={entry.approved ? "default" : "destructive"}>
                  {entry.approved ? "Approved" : "Unapproved"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
