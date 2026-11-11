"use client"

import { useState } from "react"
import { ExternalLink, ChevronDown, CheckCircle2, Circle, FlaskConical } from "lucide-react"
import type { ArsenalTool } from "@/lib/offsec/arsenal"
import { CommandBuilder } from "./command-builder"

export function ToolCard({ tool, installed }: { tool: ArsenalTool; installed: Record<string, string> }) {
  const [open, setOpen] = useState(false)
  const present = tool.bins.filter((b) => installed[b])
  const detectable = tool.bins.length > 0
  const riskLabel = tool.risk === "launch" ? "launcher" : tool.risk === "reference" ? "reference" : "wip"

  return (
    <div className="ghost-glass ghost-brackets rounded-[2px] p-3">
      <button type="button" className="flex w-full items-start justify-between gap-2 text-left" onClick={() => setOpen((v) => !v)}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[13px] uppercase tracking-[0.08em] text-[color:var(--ghost-ink)]">{tool.name}</span>
            <span className={`ghost-chip ${tool.risk === "wip" ? "warn" : ""}`}>{riskLabel}</span>
            {tool.certs?.map((c) => (
              <span key={c} className="ghost-chip accent">
                {c}
              </span>
            ))}
            {detectable &&
              (present.length > 0 ? (
                <span className="ghost-chip accent inline-flex items-center gap-1">
                  <CheckCircle2 size={10} /> installed
                </span>
              ) : (
                <span className="ghost-chip inline-flex items-center gap-1">
                  <Circle size={10} /> not detected
                </span>
              ))}
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ghost-dim)]">{tool.summary}</p>
        </div>
        <ChevronDown size={16} className={`mt-1 shrink-0 text-[color:var(--ghost-faint)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-[color:var(--ghost-line)] pt-3">
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[color:var(--ghost-dim)]">
            <a href={tool.link} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 hover:text-[color:var(--ghost-ink)]">
              <ExternalLink size={11} /> {tool.link.replace(/^https?:\/\//, "")}
            </a>
            <span>credit: {tool.credit}</span>
          </div>
          {tool.install && (
            <div className="rounded-[2px] border border-[color:var(--ghost-line)] bg-black/40 p-2 font-mono text-[11px] text-[color:var(--ghost-dim)]">
              <span className="ghost-label mr-2">install</span>
              {tool.install}
            </div>
          )}
          {present.length > 0 && (
            <div className="font-mono text-[10px] text-[color:var(--ghost-faint)]">
              detected: {present.map((b) => `${b} → ${installed[b]}`).join(" · ")}
            </div>
          )}
          {tool.commands && tool.commands.length > 0 && <CommandBuilder commands={tool.commands} />}
          {tool.notes && tool.notes.length > 0 && (
            <ul className="space-y-1 text-[11px] text-[color:var(--ghost-dim)]">
              {tool.notes.map((n) => (
                <li key={n} className="flex gap-2">
                  <span className="text-[color:var(--ghost-faint)]">›</span>
                  {n}
                </li>
              ))}
            </ul>
          )}
          {tool.risk === "reference" && (
            <div className="flex items-center gap-1.5 text-[10px] text-[color:var(--ghost-faint)]">
              <FlaskConical size={11} /> Reference only — review upstream docs; run in your own authorized lab.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
