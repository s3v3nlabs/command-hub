"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type ReplayEntry = {
  id: string
  module: string
  suggestion: string
  fixPreview: string
}

const MOCK_APPROVED_FIXES: ReplayEntry[] = [
  {
    id: "001",
    module: "SignalVisualizer.tsx",
    suggestion: "Add array.length check before mapping result[].waveform",
    fixPreview: `if (Array.isArray(result?.waveform) && result.waveform.length > 0) {\n  result.waveform.map(...)\n}`,
  },
  {
    id: "002",
    module: "ReconScanner.tsx",
    suggestion: "Add fallback config for missing domain key",
    fixPreview: `const domain = props.domain ?? 'example.com'`,
  },
]

export function SelfHealingReplay() {
  const [selected, setSelected] = useState<ReplayEntry | null>(null)

  return (
    <Card className="p-4 space-y-5">
      <h2 className="text-xl font-semibold">Replay Approved Fixes</h2>

      <div className="space-y-2">
        <Label>Select Fix to Preview</Label>
        <Select onValueChange={(id) => setSelected(MOCK_APPROVED_FIXES.find((f) => f.id === id) || null)}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a fix (sample data)" />
          </SelectTrigger>
          <SelectContent>
          {MOCK_APPROVED_FIXES.map((entry) => (
            <SelectItem key={entry.id} value={entry.id}>
              [{entry.module}] — {entry.suggestion.slice(0, 40)}...
            </SelectItem>
          ))}
          </SelectContent>
        </Select>
      </div>

      {selected && (
        <div className="space-y-4">
          <Label>Fix Preview</Label>
          <Textarea className="text-sm font-mono h-36" readOnly value={selected.fixPreview} />

          <div className="flex gap-2">
            <Button variant="secondary">Simulate</Button>
            <Button variant="default">Replay</Button>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
