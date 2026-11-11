export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { execFile } from "child_process"
import { promisify } from "util"
import { allBins } from "@/lib/offsec/arsenal"

const run = promisify(execFile)

/**
 * Read-only local tool detection. Probes each known binary with `which`.
 * No arguments are taken from the client; the binary list is fixed in-repo,
 * so this cannot be used to execute arbitrary commands.
 */
async function detect(bin: string): Promise<string | null> {
  if (!/^[a-zA-Z0-9._-]+$/.test(bin)) return null
  try {
    const { stdout } = await run("which", [bin], { timeout: 2500 })
    const p = stdout.trim().split("\n")[0]
    return p || null
  } catch {
    return null
  }
}

export async function GET() {
  const bins = allBins()
  const results = await Promise.all(
    bins.map(async (b) => [b, await detect(b)] as const),
  )
  const present: Record<string, string> = {}
  for (const [b, p] of results) if (p) present[b] = p
  return NextResponse.json({
    ok: true,
    platform: process.platform,
    probed: bins.length,
    installed: present,
    installedCount: Object.keys(present).length,
    note: "Read-only `which` probe of a fixed in-repo binary list. No client input is executed.",
    lattice_sync: false,
  })
}
