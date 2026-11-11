/**
 * Privilege-separation interface (F1 scaffolding).
 *
 * The thin web UI / Next.js API never performs privileged work directly in the
 * target design. It calls a typed broker. Today the broker is an IN-PROCESS
 * fallback that refuses anything that must run in the sandbox boundary
 * (detonation). PLANNED: an out-of-process `hub-agentd` over a unix socket
 * (AGENT_SOCKET_PATH) with dropped caps / seccomp / AppArmor.
 *
 * Honest status: interface wired; daemon planned; detonation refused on-host.
 */

export type PrivOp =
  | { op: "detonate"; sha256: string; scopeId: string; attestation: string }
  | { op: "transcode"; url: string; scopeId: string; attestation: string }
  | { op: "adb"; serial: string; args: string[]; scopeId?: string; attestation?: string }

export interface PrivResult {
  ok: boolean
  backend: "in-process-fallback" | "hub-agentd"
  detail: string
  data?: unknown
}

export function agentSocketPath(): string | null {
  const p = process.env.AGENT_SOCKET_PATH?.trim()
  return p || null
}

export async function privCall(req: PrivOp): Promise<PrivResult> {
  const sock = agentSocketPath()
  if (sock) {
    // PLANNED: JSON-RPC over unix socket to hub-agentd. Not implemented yet —
    // report honestly instead of pretending.
    return {
      ok: false,
      backend: "hub-agentd",
      detail: `AGENT_SOCKET_PATH set (${sock}) but hub-agentd RPC is PLANNED, not yet implemented.`,
    }
  }
  if (req.op === "detonate") {
    return {
      ok: false,
      backend: "in-process-fallback",
      detail:
        "Detonation refused on-host. Run analysis inside the sandbox boundary (deploy/sandbox/docker-compose.yml `detonation` service, network_mode: none). Capture + quarantine + hashing are real.",
    }
  }
  return {
    ok: false,
    backend: "in-process-fallback",
    detail: `${req.op} is handled by its dedicated gated API route in-process today; broker routing is planned.`,
  }
}
