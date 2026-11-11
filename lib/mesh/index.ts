/**
 * GPU Mesh hub — Operator-owned seats only.
 * Rotate/combine jobs · combo-lock · assimilate → train bus.
 * FORBIDDEN: burner/trashable account farms.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false
 */

export * from "./policy"
export * from "./providers"
export * from "./quotaLedger"
export * from "./scheduler"
export * from "./assimilate"

import { HOLD } from "./policy"
import { listProviders, envKeysPresentFor, resolveProviderStatus } from "./providers"
import { readLedger } from "./quotaLedger"
import { listLocks } from "./scheduler"

export function meshHubStatus() {
  const providers = listProviders().map((p) => {
    const envKeysPresent = envKeysPresentFor(p)
    return {
      ...p,
      envKeysPresent,
      status: resolveProviderStatus(p),
      // Credentials/configuration do not mean a pod or training job is running.
      execution: "stub",
    }
  })
  const ledger = readLedger()
  const locks = listLocks()
  return {
    ok: true,
    service: "mesh",
    auth: "operator-owned" as const,
    forbidsBurnerAccounts: true as const,
    perishableMeans: "ephemeral pods/jobs — never identities" as const,
    providers,
    ledger,
    locks: {
      seats: Object.keys(locks.locks),
      recentJobs: locks.jobs.slice(-10),
    },
    docs: ["/docs/MESH_EFFICIENCY.md", "/docs/GPU_MESH.md"],
    links: {
      commandHub: "/command-hub",
      modules: "/modules",
      dimmDrive: "/dimm-drive",
      symtrain: "/symtrain",
      mesh: "/mesh",
    },
    hold: HOLD,
    lattice_sync: false as const,
  }
}
