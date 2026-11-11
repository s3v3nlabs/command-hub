"use client"

import { useMemo, useState } from "react"
import { Copy, Check, X, ArrowDown, Fingerprint } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"
import { TRANSFORMS, applyChain, type TransformId } from "@/lib/offsec/transforms"
import { identifyHash } from "@/lib/offsec/hash-id"

export default function ToolkitPage() {
  const [tab, setTab] = useState<"chef" | "hash">("chef")
  const [input, setInput] = useState("")
  const [chain, setChain] = useState<TransformId[]>([])
  const [copied, setCopied] = useState(false)
  const [hashInput, setHashInput] = useState("")

  const output = useMemo(() => applyChain(input, chain), [input, chain])
  const guesses = useMemo(() => identifyHash(hashInput), [hashInput])

  const groups = Array.from(new Set(TRANSFORMS.map((t) => t.group)))

  return (
    <SuiteShell
      title="DATA TOOLKIT"
      status="real"
      nav={
        <>
          <SuiteNavLink href="/offsec" label="Arsenal" />
          <SuiteNavLink href="/offsec/osint" label="OSINT Suite" />
        </>
      }
    >
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex gap-1.5">
          <button type="button" className="ghost-btn" data-on={tab === "chef"} onClick={() => setTab("chef")}>
            Data transforms
          </button>
          <button type="button" className="ghost-btn" data-on={tab === "hash"} onClick={() => setTab("hash")}>
            <Fingerprint size={12} /> Hash-ID
          </button>
          <span className="ghost-chip ml-auto self-center">100% offline / client-side</span>
        </div>

        {tab === "chef" ? (
          <div className="space-y-3">
            <div className="ghost-glass ghost-brackets rounded-[2px] p-3">
              <div className="ghost-label mb-2">Recipe (applied top → bottom)</div>
              <div className="flex flex-wrap gap-1.5">
                {groups.map((g) => (
                  <div key={g} className="flex flex-wrap items-center gap-1">
                    <span className="ghost-label">{g}:</span>
                    {TRANSFORMS.filter((t) => t.group === g).map((t) => (
                      <button key={t.id} type="button" className="ghost-btn" onClick={() => setChain((c) => [...c, t.id])}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              {chain.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {chain.map((id, i) => {
                    const t = TRANSFORMS.find((x) => x.id === id)
                    return (
                      <span key={i} className="ghost-chip accent inline-flex items-center gap-1">
                        {t?.label}
                        <button type="button" className="hover:text-white" onClick={() => setChain((c) => c.filter((_, j) => j !== i))}>
                          <X size={10} />
                        </button>
                      </span>
                    )
                  })}
                  <button type="button" className="ghost-btn danger" onClick={() => setChain([])}>
                    clear
                  </button>
                </div>
              )}
            </div>
            <div className="ghost-glass rounded-[2px] p-3">
              <div className="ghost-label mb-1">Input</div>
              <textarea className="ghost-input font-mono" rows={5} value={input} onChange={(e) => setInput(e.target.value)} placeholder="paste data…" />
            </div>
            <div className="flex justify-center">
              <ArrowDown size={16} className="text-[color:var(--ghost-faint)]" />
            </div>
            <div className="ghost-glass rounded-[2px] p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="ghost-label">Output</span>
                <button
                  type="button"
                  className="ghost-icon-btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(output)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 1200)
                    } catch {
                      /* ignore */
                    }
                  }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
              <pre className="ghost-scroll max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono text-[12px] text-[color:var(--ghost-ink)]">{output || "—"}</pre>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="ghost-glass ghost-brackets rounded-[2px] p-3">
              <div className="ghost-label mb-1">Hash / token</div>
              <textarea className="ghost-input font-mono" rows={3} value={hashInput} onChange={(e) => setHashInput(e.target.value)} placeholder="paste a hash…" />
            </div>
            <div className="ghost-glass rounded-[2px] p-3">
              <div className="ghost-label mb-2">Candidates</div>
              {!hashInput.trim() ? (
                <div className="text-[11px] text-[color:var(--ghost-dim)]">Paste a hash to identify mode / format.</div>
              ) : (
                <div className="space-y-1.5">
                  {guesses.map((g, i) => (
                    <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-[2px] border border-[color:var(--ghost-line)] bg-black/40 p-2">
                      <span className="font-mono text-[12px] text-[color:var(--ghost-ink)]">{g.name}</span>
                      <div className="flex items-center gap-1.5">
                        {g.hashcat && <span className="ghost-chip accent">hashcat -m {g.hashcat}</span>}
                        {g.john && <span className="ghost-chip">john --format={g.john}</span>}
                        <span className={`ghost-chip ${g.confidence === "high" ? "accent" : g.confidence === "low" ? "warn" : ""}`}>{g.confidence}</span>
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-[color:var(--ghost-faint)]">
                    Heuristic (length/charset/structure), like hashid / name-that-hash. Crack only hashes you are
                    authorized to, offline, with hashcat/john.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SuiteShell>
  )
}
