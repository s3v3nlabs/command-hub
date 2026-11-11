"use client"

import type React from "react"

import { useState } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Brain, Send } from "lucide-react"

interface AiConsoleProps {
  className?: string
}

export function AiConsole({ className }: AiConsoleProps) {
  const [input, setInput] = useState("")
  const [processing, setProcessing] = useState(false)
  const [response, setResponse] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || processing) return

    setProcessing(true)
    setResponse(null)

    // Simulate AI processing
    setTimeout(() => {
      // Mock responses based on input keywords
      if (input.toLowerCase().includes("status")) {
        setResponse("All systems are operating within normal parameters. No anomalies detected in the last 24 hours.")
      } else if (input.toLowerCase().includes("threat") || input.toLowerCase().includes("security")) {
        setResponse(
          "Current threat assessment: MODERATE. 3 potential security concerns identified in the last scan. Recommend running 'security_audit' macro for detailed analysis.",
        )
      } else if (input.toLowerCase().includes("help")) {
        setResponse(
          "I can assist with system diagnostics, security analysis, and operational queries. Try asking about system status, security threats, or resource allocation.",
        )
      } else {
        setResponse(
          `I've processed your query: "${input}". Would you like me to perform a specific analysis or action based on this information?`,
        )
      }

      setProcessing(false)
    }, 1500)
  }

  return (
    <TechPanel
      variant="default"
      cornerAccent
      borderAccent
      title="AI CONSOLE"
      className={cn("flex flex-col", className)}
      actions={<Badge variant={processing ? "warning" : "outline"}>{processing ? "PROCESSING" : "READY"}</Badge>}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 mb-2 overflow-auto">
          {response && (
            <div className="p-3 bg-dark-100/20 rounded-sm mb-2 text-sm">
              <div className="flex items-center mb-1">
                <Brain size={14} className="mr-1 text-dark-500" />
                <span className="text-xs font-mono text-dark-500">SINGULARITY AI:</span>
              </div>
              {response}
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask SingularityAI..."
            className="flex-1 resize-none h-20 text-sm"
            disabled={processing}
          />
          <TechButton
            type="submit"
            variant="default"
            size="sm"
            className="self-end"
            disabled={!input.trim() || processing}
          >
            <Send size={14} className="mr-1" />
            ASK AI
          </TechButton>
        </div>
      </form>
    </TechPanel>
  )
}
