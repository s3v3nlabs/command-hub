// Routes whose main panel still renders sample or simulated data (no real backend wired).
// Keep this in sync with docs/MODULE_STATUS.md. A banner is shown on these routes so
// nobody mistakes sample output for live data.
export const SIMULATED_ROUTES: Record<string, string> = {
  "/beastwagon": "Telemetry is simulated; no vehicle/data feed is connected.",
  "/command-prompt": "Sandboxed mock shell with a fake filesystem. A real remote shell is deliberately not exposed.",
  "/linux-terminal": "Sandboxed mock shell with a fake filesystem. A real remote shell is deliberately not exposed.",
  "/windows-terminal": "Sandboxed mock shell with a fake filesystem. A real remote shell is deliberately not exposed.",
  "/file-explorer": "Mock file tree. Use /evidence-explorer for real files under EVIDENCE_ROOT.",
  "/file-browser": "Mock file tree. Use /evidence-explorer for real files under EVIDENCE_ROOT.",
  "/conscious-terminal": "Responses are scripted/simulated. Use /ai-hub or /heimdal-terminal for real LLM chat.",
  "/terminal": "Command output is simulated (scan/vuln results are generated).",
  "/terminal-dashboard": "Logs and panes are sample data.",
  "/intelligence/cctv": "No camera feeds connected; alerts are simulated.",
  "/intelligence/erd": "Investigation graph uses sample data.",
  "/intelligence/osint": "Search results are simulated.",
  "/intelligence/recruit": "Search results are simulated.",
  "/intelligence/recruitment": "Search results are simulated.",
  "/intelligence/secure": "Messages are sample data; nothing is sent or encrypted.",
  "/intelligence/messages": "Messages are sample data.",
  "/intelligence/sigint": "Signal logs are simulated.",
  "/intelligence/signal": "Band readings are simulated.",
  "/intelligence/vault-streams": "Postgres panel returns mock query results.",
  "/legacy-modules": "Module list is sample data.",
  "/sacred-hall": "Field readings are simulated.",
  "/system-config": "Environment manager and repair simulator use sample data.",
  "/obsidian-vault": "Vault contents are sample data; no Obsidian vault is read.",
  "/markdown-editor": "Saving to an Obsidian vault is simulated (editing works in-browser).",
  "/self-healing": "Agent, vault and replay panels run on sample incidents.",
  "/visualizations": "Network and system-health 3D views are sample data (the threat globe uses real cached data packs).",
  "/network-security": "Network status values are sample data.",
  "/threat-analysis": "Threat list is sample data. Use /intelligence/threat-intel for real lookups.",
  "/reports": "Report list is sample data.",
  "/hub": "Harmonic and threat panels are sample data.",
}

export function simulatedReason(pathname: string | null | undefined): string | null {
  if (!pathname) return null
  return SIMULATED_ROUTES[pathname] ?? null
}
