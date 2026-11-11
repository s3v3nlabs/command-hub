/**
 * DuckyScript generator + BadUSB heuristic detector.
 * Pure client-safe TypeScript. Generates TEXT only; never flashes hardware.
 */

export type DuckyPresetId =
  | "awareness-notepad"
  | "lock-workstation"
  | "open-url"
  | "wifi-profile-export-win"
  | "custom"

export interface DuckyPreset {
  id: DuckyPresetId
  label: string
  description: string
  /** Placeholders the UI can fill. */
  fields: Array<{ key: string; label: string; placeholder: string; defaultValue?: string }>
  build: (vars: Record<string, string>) => string
}

const esc = (s: string) => s.replace(/\r?\n/g, " ")

export const DUCKY_PRESETS: DuckyPreset[] = [
  {
    id: "awareness-notepad",
    label: "Awareness — Notepad message (Win)",
    description: "Authorized security-awareness demo: open Notepad and type a message.",
    fields: [
      { key: "message", label: "Message", placeholder: "This was an authorized awareness test.", defaultValue: "This was an authorized awareness test. Report stray USB devices." },
      { key: "delay_ms", label: "Initial delay (ms)", placeholder: "1000", defaultValue: "1000" },
    ],
    build: (v) => `REM Authorized awareness payload — do not use without written permission
DELAY ${Number(v.delay_ms) || 1000}
GUI r
DELAY 400
STRING notepad.exe
ENTER
DELAY 800
STRING ${esc(v.message || "")}
ENTER
`,
  },
  {
    id: "lock-workstation",
    label: "Lock workstation (Win)",
    description: "Win+L lock — harmless hygiene demo for authorized labs.",
    fields: [{ key: "delay_ms", label: "Initial delay (ms)", placeholder: "500", defaultValue: "500" }],
    build: (v) => `REM Lock workstation — authorized lab only
DELAY ${Number(v.delay_ms) || 500}
GUI l
`,
  },
  {
    id: "open-url",
    label: "Open URL (Win)",
    description: "Open a URL in the default browser via Run dialog.",
    fields: [
      { key: "url", label: "URL (https only recommended)", placeholder: "https://example.com/awareness", defaultValue: "https://example.com" },
      { key: "delay_ms", label: "Initial delay (ms)", placeholder: "1000", defaultValue: "1000" },
    ],
    build: (v) => `REM Open URL — authorized lab / awareness only
DELAY ${Number(v.delay_ms) || 1000}
GUI r
DELAY 400
STRING ${esc(v.url || "https://example.com")}
ENTER
`,
  },
  {
    id: "wifi-profile-export-win",
    label: "Wi-Fi profile export (Win, authorized)",
    description: "Export WLAN profiles on a machine you own / are authorized to audit. Review before use.",
    fields: [
      { key: "out_dir", label: "Output directory", placeholder: "C:\\temp\\wifi", defaultValue: "C:\\temp\\wifi" },
      { key: "delay_ms", label: "Initial delay (ms)", placeholder: "1500", defaultValue: "1500" },
    ],
    build: (v) => {
      const dir = esc(v.out_dir || "C:\\temp\\wifi")
      return `REM Wi-Fi profile export — AUTHORIZED audit of YOUR machine only
DELAY ${Number(v.delay_ms) || 1500}
GUI r
DELAY 400
STRING cmd /c mkdir ${dir} & netsh wlan export profile folder=${dir} key=clear
ENTER
`
    },
  },
  {
    id: "custom",
    label: "Custom (blank template)",
    description: "Blank DuckyScript skeleton with REM header.",
    fields: [{ key: "body", label: "Script body", placeholder: "DELAY 1000\nSTRING hello", defaultValue: "DELAY 1000\nSTRING hello" }],
    build: (v) => `REM Custom DuckyScript — authorized use only
${v.body || ""}
`,
  },
]

export interface BadUsbFinding {
  severity: "low" | "medium" | "high"
  rule: string
  detail: string
  line?: number
}

/** Heuristic scan of DuckyScript / similar HID automation text. Not a guarantee. */
export function detectBadUsb(script: string): { findings: BadUsbFinding[]; score: number; summary: string } {
  const findings: BadUsbFinding[] = []
  const lines = script.split(/\r?\n/)
  const lower = script.toLowerCase()

  const add = (f: BadUsbFinding) => findings.push(f)

  lines.forEach((line, i) => {
    const ln = i + 1
    const l = line.trim()
    const ll = l.toLowerCase()
    if (/powershell\s+(-|\/)?(e|enc|encodedcommand)/i.test(l)) {
      add({ severity: "high", rule: "encoded_powershell", detail: "Encoded PowerShell invocation", line: ln })
    }
    if (/iwr|invoke-webrequest|invoke-expression|iex\s*\(|downloadstring|downloadfile/i.test(l)) {
      add({ severity: "high", rule: "download_cradle", detail: "Remote download / IEX cradle pattern", line: ln })
    }
    if (/cmd\s+\/c\s+.*(curl|wget|bitsadmin|certutil)/i.test(l)) {
      add({ severity: "high", rule: "cmd_download", detail: "cmd download utility", line: ln })
    }
    if (/net\s+user\s+\w+\s+\/add|net\s+localgroup\s+administrators/i.test(l)) {
      add({ severity: "high", rule: "local_admin", detail: "Local user / admin group modification", line: ln })
    }
    if (/reg\s+add.*\\run|schtasks\s+\/create|sticky.?key|sethc\.exe|utilman\.exe/i.test(l)) {
      add({ severity: "high", rule: "persistence", detail: "Persistence / accessibility-feature abuse hint", line: ln })
    }
    if (/gui\s+r/i.test(l)) {
      add({ severity: "medium", rule: "run_dialog", detail: "Windows Run dialog (GUI r)", line: ln })
    }
    if (/^string\s+/i.test(l) && l.length > 120) {
      add({ severity: "medium", rule: "long_string", detail: "Long STRING line (possible packed payload)", line: ln })
    }
    if (/rm\s+-rf\s+\/|format\s+[cC]:|del\s+\/[fFsS].*\\windows/i.test(l)) {
      add({ severity: "high", rule: "destructive", detail: "Destructive filesystem command", line: ln })
    }
    if (/key=clear|wlan\s+export\s+profile/i.test(l)) {
      add({ severity: "medium", rule: "wifi_export", detail: "Wi-Fi profile export with cleartext keys", line: ln })
    }
    if (ll.includes("string") && (ll.includes("http://") || ll.includes("https://"))) {
      add({ severity: "low", rule: "url_string", detail: "URL typed via STRING", line: ln })
    }
  })

  if (/delay\s+\d+/i.test(script) && /gui\s+r/i.test(script) && /string\s+/i.test(script)) {
    add({ severity: "medium", rule: "delay_run_string", detail: "Classic DELAY → GUI r → STRING chain" })
  }
  if ((lower.match(/\bdelay\b/g) || []).length >= 5 && (lower.match(/\bstring\b/g) || []).length >= 5) {
    add({ severity: "medium", rule: "burst_hid", detail: "High DELAY/STRING density (automated HID burst)" })
  }

  const score =
    findings.reduce((acc, f) => acc + (f.severity === "high" ? 5 : f.severity === "medium" ? 2 : 1), 0) || 0

  let summary = "No suspicious patterns flagged (heuristic only — not a guarantee)."
  if (score >= 10) summary = "High suspicion — review carefully before any use."
  else if (score >= 4) summary = "Moderate suspicion — common BadUSB / awareness patterns present."
  else if (score > 0) summary = "Low suspicion — minor automation markers only."

  return { findings, score, summary }
}

export function buildDucky(presetId: DuckyPresetId, vars: Record<string, string>): string {
  const p = DUCKY_PRESETS.find((x) => x.id === presetId) || DUCKY_PRESETS[DUCKY_PRESETS.length - 1]
  return p.build(vars)
}
