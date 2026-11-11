"use client"

import { useEffect, useState } from "react"

type Status = { chat: Array<{ id: string; label: string; configured: boolean; model: string }> }

/** Shows which AI provider will answer (or a clear NEEDS KEY badge). */
export function ProviderBadge({ className = "" }: { className?: string }) {
  const [s, setS] = useState<Status | null>(null)
  useEffect(() => {
    fetch("/api/llm/status")
      .then((r) => r.json())
      .then(setS)
      .catch(() => setS({ chat: [] }))
  }, [])
  if (!s) return <span className={`font-mono text-[10px] text-gray-500 ${className}`}>checking AI providers…</span>
  const live = s.chat.filter((c) => c.configured)
  if (!live.length)
    return (
      <span
        className={`rounded border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-300 ${className}`}
        title="Set XAI_API_KEY, OPENAI_API_KEY, VENICE_API_KEY or GROQ_API_KEY in .env.local, or run Ollama"
      >
        NEEDS AI KEY · add XAI/OPENAI/VENICE/GROQ key or run Ollama
      </span>
    )
  return (
    <span className={`rounded border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300 ${className}`}>
      LIVE · {live[0].label} ({live[0].model}){live.length > 1 ? ` +${live.length - 1}` : ""}
    </span>
  )
}
