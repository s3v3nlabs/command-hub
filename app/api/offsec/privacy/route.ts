export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { execFile } from "child_process"
import { promisify } from "util"

const run = promisify(execFile)

const BINS = [
  "protonvpn-cli",
  "protonvpn",
  "proton-bridge",
  "protonmail-bridge",
  "proton-vpn-cli",
  "proxychains4",
  "proxychains",
  "wireguard",
  "wg",
  "openvpn",
  "tor",
  "torsocks",
  "nginx",
  "caddy",
  "stunnel4",
  "stunnel",
  "ssh",
  "gpg",
  "age",
  "sops",
]

/**
 * Read-only presence + env configuration check for the privacy stack.
 * Reports whether a tool binary exists and whether a related env var NAME is set
 * (never the value). No credentials are read or returned.
 */
async function present(bin: string): Promise<boolean> {
  if (!/^[a-zA-Z0-9._-]+$/.test(bin)) return false
  try {
    await run("which", [bin], { timeout: 2500 })
    return true
  } catch {
    return false
  }
}

const ENV_FLAGS = [
  "PROTONVPN_USERNAME",
  "PROTON_BRIDGE_HOST",
  "PROTON_BRIDGE_PORT",
  "PROTON_SMTP_HOST",
  "HTTPS_PROXY",
  "HTTP_PROXY",
  "ALL_PROXY",
  "SOCKS_PROXY",
  "REVERSE_PROXY_UPSTREAM",
]

export async function GET() {
  const results = await Promise.all(BINS.map(async (b) => [b, await present(b)] as const))
  const bins: Record<string, boolean> = {}
  for (const [b, p] of results) bins[b] = p
  const env: Record<string, boolean> = {}
  for (const k of ENV_FLAGS) env[k] = Boolean(process.env[k])
  return NextResponse.json({
    ok: true,
    platform: process.platform,
    bins,
    envSet: env,
    note: "Presence + env-NAME-set check only. No credential values are read or stored. Configure secrets in .env.local, never in git.",
    lattice_sync: false,
  })
}
