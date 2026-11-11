"use client"

import { useMemo, useState } from "react"
import { Copy, Check, ShieldAlert } from "lucide-react"
import {
  DUCKY_PRESETS,
  buildDucky,
  detectBadUsb,
  type DuckyPresetId,
} from "@/lib/offsec/duckyscript"

export function DuckyPanel() {
  const [presetId, setPresetId] = useState<DuckyPresetId>("awareness-notepad")
  const preset = DUCKY_PRESETS.find((p) => p.id === presetId) || DUCKY_PRESETS[0]
  const [vars, setVars] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const f of preset.fields) init[f.key] = f.defaultValue || ""
    return init
  })
  const [scanText, setScanText] = useState("")
  const [copied, setCopied] = useState(false)

  const script = useMemo(() => buildDucky(presetId, vars), [presetId, vars])
  const scan = useMemo(() => detectBadUsb(scanText || script), [scanText, script])

  const onPreset = (id: DuckyPresetId) => {
    setPresetId(id)
    const p = DUCKY_PRESETS.find((x) => x.id === id)!
    const init: Record<string, string> = {}
    for (const f of p.fields) init[f.key] = f.defaultValue || ""
    setVars(init)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(script)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="ghost-glass ghost-brackets space-y-3 rounded-[2px] p-4">
        <div className="font-mono text-[12px] uppercase tracking-[0.1em] text-[color:var(--ghost-ink)]">
          DuckyScript Generator
        </div>
        <p className="text-[11px] text-[color:var(--ghost-dim)]">
          Builds TEXT only for Hak5 Rubber Ducky / Flipper BadUSB. You encode and flash on YOUR hardware.
          Authorized labs and awareness exercises only.
        </p>
        <label className="flex flex-col gap-1">
          <span className="ghost-label">Preset</span>
          <select
            className="ghost-input font-mono"
            value={presetId}
            onChange={(e) => onPreset(e.target.value as DuckyPresetId)}
          >
            {DUCKY_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-[11px] text-[color:var(--ghost-dim)]">{preset.description}</p>
        <div className="grid gap-2">
          {preset.fields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1">
              <span className="ghost-label">{f.label}</span>
              {f.key === "body" || f.key === "message" ? (
                <textarea
                  className="ghost-input min-h-[72px] font-mono text-[11px]"
                  value={vars[f.key] || ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setVars((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              ) : (
                <input
                  className="ghost-input font-mono"
                  value={vars[f.key] || ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setVars((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              )}
            </label>
          ))}
        </div>
        <div className="relative">
          <pre className="ghost-scroll max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-[2px] border border-[color:var(--ghost-line)] bg-black/50 p-2 font-mono text-[11px] text-[color:var(--ghost-ink)]">
            {script}
          </pre>
          <button type="button" className="ghost-btn absolute right-2 top-2" onClick={() => void copy()}>
            {copied ? <Check size={11} /> : <Copy size={11} />} Copy
          </button>
        </div>
      </div>

      <div className="ghost-glass ghost-brackets space-y-3 rounded-[2px] p-4">
        <div className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[color:var(--ghost-ink)]">
          <ShieldAlert size={13} /> BadUSB Heuristic Detector
        </div>
        <p className="text-[11px] text-[color:var(--ghost-dim)]">
          Paste a DuckyScript (or leave blank to scan the generator output). Heuristic only — not a guarantee of
          malice or safety.
        </p>
        <textarea
          className="ghost-input min-h-[120px] font-mono text-[11px]"
          placeholder="Paste script to scan (optional — defaults to generator output)"
          value={scanText}
          onChange={(e) => setScanText(e.target.value)}
        />
        <div className="rounded-[2px] border border-[color:var(--ghost-line)] bg-black/40 p-2">
          <div className="font-mono text-[11px] text-[color:var(--ghost-ink)]">
            score {scan.score} — {scan.summary}
          </div>
          <ul className="mt-2 space-y-1">
            {scan.findings.length === 0 && (
              <li className="text-[11px] text-[color:var(--ghost-dim)]">No findings.</li>
            )}
            {scan.findings.map((f, i) => (
              <li key={`${f.rule}-${i}`} className="text-[11px] text-[color:var(--ghost-dim)]">
                <span
                  className={
                    f.severity === "high"
                      ? "text-red-400"
                      : f.severity === "medium"
                        ? "text-amber-300"
                        : "text-[color:var(--ghost-ink)]"
                  }
                >
                  [{f.severity}]
                </span>{" "}
                {f.rule}
                {f.line ? ` :L${f.line}` : ""} — {f.detail}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
