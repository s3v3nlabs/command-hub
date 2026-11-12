/**
 * Command Hub live backends. Every export talks to a real source
 * (procfs, child_process, on-disk stores, or a live public API).
 * Credit: Christian Wilford (s3v3n), SingularityDefense / SLDS.
 */

export { liveFetch } from "./http"
export { runFile, runBash } from "./exec"
export { getSystemSnapshot } from "./sys"
export { getNetworkSnapshot, getFirewallLogs } from "./net"
export { listDir, readFilePreview, allowedRoots, resolveAllowed } from "./fs-browse"
export { execShell, getSession, DEFAULT_HOME } from "./shell"
export { liveOsint, classify, asLegacyProfile } from "./osint"
export { getThreats } from "./threats"
export { lookupLeaks } from "./leaks"
export { listMessages, sendMessage } from "./messages"
export { sqliteSchema, sqliteQuery, sqliteInsertEvent, postgresQuery, vaultStreamsOverview } from "./db"
export { listVault, readNote, writeNote, vaultRoot } from "./obsidian"
export { getSigint } from "./sigint"
export { getEdrSnapshot, resetIntegrityBaseline } from "./edr"
export { listReports, generateReport, readReport } from "./reports"
export { liveRecon } from "./recon"
export { getBeastWagon } from "./beastwagon"
export { searchTalent } from "./recruit"
