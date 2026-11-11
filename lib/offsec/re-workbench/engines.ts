/** Honest engine detection — never claims an engine that is not installed/configured. */

import { r2Binary, r2Version } from "./radare2"
import { ghidraHeadless } from "./ghidra"
import { reaConfig, reaHandshake } from "./rea-client"
import type { EngineStatus } from "./types"

export const INSTALL_GUIDE: Record<EngineStatus["id"], string[]> = {
  rea: [
    "Requires Node.js 22.23.4+/24.22.1+ (REA's stated minimum).",
    "npm install --global rea-agents   (or use: npx -y rea-agents@6.8.0 mcp)",
    'Set REA_MCP_COMMAND="rea mcp" in .env.local (stdio, REA\'s native transport) and restart the hub.',
    "Native analysis inside REA needs a provider: Ghidra (GHIDRA_INSTALL_DIR + JAVA_HOME), IDA, Hopper or Kuna. REA 6.8.0 accepts Ghidra 12.1.x only (verified 12.1.4) — run `rea doctor --json` to check.",
    "Pin the provider per session with the provider_id field (or REA_ANALYSIS_PROVIDER=ghidra).",
    "Optional: REA_MCP_URL=http://127.0.0.1:<port>/mcp if you expose REA through an MCP Streamable-HTTP bridge.",
  ],
  radare2: [
    "Debian/Ubuntu: sudo apt install radare2  (or the .deb from github.com/radareorg/radare2/releases)",
    "macOS: brew install radare2   ·   from source: git clone https://github.com/radareorg/radare2 && radare2/sys/install.sh",
    "Optional: RADARE2_BIN=/abs/path/to/radare2 if not on PATH.",
  ],
  ghidra: [
    "Download Ghidra from github.com/NationalSecurityAgency/ghidra/releases and the JDK it requires (Ghidra/application.properties `application.java.min`; Ghidra 12.x needs JDK 25, e.g. Eclipse Temurin).",
    "Export JAVA_HOME=<that JDK> in the hub's environment — analyzeHeadless cannot prompt for a JDK without a TTY.",
    "Unzip it and set GHIDRA_INSTALL_DIR=/abs/path/to/ghidra_<ver>_PUBLIC (support/analyzeHeadless must be executable).",
    "Each headless run performs full auto-analysis (seconds for small ELFs, minutes for large binaries); results are cached by sha256. Ghidra rebases images (e.g. 0x100000) — use addresses from the Ghidra Functions list."
  ],
}

export async function engineStatuses(opts: { probeRea?: boolean } = {}): Promise<EngineStatus[]> {
  const out: EngineStatus[] = []

  const cfg = reaConfig()
  if (cfg.mode === "none") {
    out.push({ id: "rea", label: "REA (MCP broker)", available: false, state: "not configured", detail: "REA MCP server not configured/running: set REA_MCP_COMMAND or REA_MCP_URL.", install: INSTALL_GUIDE.rea })
  } else if (!opts.probeRea) {
    out.push({ id: "rea", label: "REA (MCP broker)", available: true, state: `configured (${cfg.mode}) — not yet probed`, detail: cfg.mode === "stdio" ? `command: ${cfg.command!.join(" ")}` : `url: ${cfg.url}`, install: INSTALL_GUIDE.rea })
  } else {
    try {
      const info = await reaHandshake()
      out.push({ id: "rea", label: "REA (MCP broker)", available: true, state: `connected (${cfg.mode})`, detail: `server ${info.name || "?"} ${info.version || ""}`.trim(), install: INSTALL_GUIDE.rea, version: info.version })
    } catch (e) {
      out.push({ id: "rea", label: "REA (MCP broker)", available: false, state: "configured but not reachable", detail: (e as Error).message.slice(0, 500), install: INSTALL_GUIDE.rea })
    }
  }

  const r2 = r2Binary()
  out.push(
    r2
      ? { id: "radare2", label: "radare2 (headless, sandboxed)", available: true, state: "installed", detail: r2, install: INSTALL_GUIDE.radare2, version: await r2Version(r2) }
      : { id: "radare2", label: "radare2 (headless, sandboxed)", available: false, state: "analysis engine not installed", detail: "radare2 / r2 not found on PATH (or RADARE2_BIN).", install: INSTALL_GUIDE.radare2 },
  )

  const gh = ghidraHeadless()
  out.push(
    gh
      ? { id: "ghidra", label: "Ghidra headless", available: true, state: "installed", detail: gh, install: INSTALL_GUIDE.ghidra }
      : { id: "ghidra", label: "Ghidra headless", available: false, state: "analysis engine not installed", detail: "analyzeHeadless not found (set GHIDRA_INSTALL_DIR).", install: INSTALL_GUIDE.ghidra },
  )
  return out
}
