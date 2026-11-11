"use client"

import { useMemo, useState } from "react"
import { Copy, Check, Terminal } from "lucide-react"
import type { CommandTemplate } from "@/lib/offsec/arsenal"

const TOKEN = /\{([a-zA-Z0-9_]+)\}/g

function tokensOf(templates: CommandTemplate[]): string[] {
  const set = new Set<string>()
  for (const t of templates) {
    let m: RegExpExecArray | null
    TOKEN.lastIndex = 0
    while ((m = TOKEN.exec(t.template))) set.add(m[1])
  }
  return Array.from(set)
}

/**
 * Builds safe command strings from documented templates. It only renders text
 * for the operator to copy into their own terminal — it never executes anything.
 */
export function CommandBuilder({ commands }: { commands: CommandTemplate[] }) {
  const tokens = useMemo(() => tokensOf(commands), [commands])
  const [vals, setVals] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<number | null>(null)

  const render = (tpl: string) => tpl.replace(TOKEN, (_, k) => (vals[k] ? vals[k] : `{${k}}`))

  const copy = async (text: string, i: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(i)
      setTimeout(() => setCopied(null), 1200)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-3">
      {tokens.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {tokens.map((t) => (
            <label key={t} className="flex flex-col gap-1">
              <span className="ghost-label">{t}</span>
              <input
                className="ghost-input font-mono"
                placeholder={t}
                value={vals[t] || ""}
                onChange={(e) => setVals((v) => ({ ...v, [t]: e.target.value }))}
              />
            </label>
          ))}
        </div>
      )}
      <div className="space-y-2">
        {commands.map((c, i) => {
          const out = render(c.template)
          return (
            <div key={i} className="rounded-[2px] border border-[color:var(--ghost-line)] bg-black/40 p-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="ghost-label">{c.label}</span>
                <button type="button" className="ghost-icon-btn" onClick={() => copy(out, i)} title="Copy">
                  {copied === i ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <pre className="ghost-scroll overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] text-[color:var(--ghost-ink)]">
                <span className="text-[color:var(--ghost-faint)]">$ </span>
                {out}
              </pre>
              {c.note && <div className="mt-1 text-[10px] text-[color:var(--ghost-faint)]">{c.note}</div>}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-[color:var(--ghost-faint)]">
        <Terminal size={11} /> Copy into your own authorized terminal. This panel never executes commands.
      </div>
    </div>
  )
}
