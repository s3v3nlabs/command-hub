/**
 * Privacy Fortress policy constants + getPrivacyStatus() for UI.
 * Defensive / authorized-ops on Operator-owned stack only.
 */

import { TELEMETRY_POLICY } from "./antiTelemetry"
import { isEncryptionAvailable, privacyKeyFingerprint, PRIVACY_VAULT_DIR } from "./localCrypto"
import { checkTorSocksReachable, getEgressConfig, type EgressMode } from "./egress"

export const PRIVACY_FORTRESS = {
  name: "Privacy Fortress",
  version: "1.0.0",
  scope: "reclaim-ui-s3v3n-panel",
  hold: "HOLD_VYRNA_UNSYNC" as const,
  doctrine: "Singular/ty defensive + authorized-ops (own stack). No exploits / malware / unauthorized access.",
  env: [
    "S3V3N_PRIVACY_KEY",
    "S3V3N_PRIVACY_VAULT",
    "S3V3N_PANEL_PERSIST",
    "S3V3N_EGRESS_MODE",
    "S3V3N_HTTP_PROXY",
    "S3V3N_TOR_SOCKS",
  ] as const,
} as const

export type PrivacyStatus = {
  ok: true
  fortress: typeof PRIVACY_FORTRESS.name
  version: string
  hold: typeof PRIVACY_FORTRESS.hold
  telemetry: {
    analytics: "OFF"
    bodyLogging: "REFUSED"
    consoleBodies: boolean
    networkBeacons: boolean
  }
  encryption: {
    available: boolean
    persistFlag: boolean
    keyFingerprint: string | null
    vaultDir: string
    alg: "aes-256-gcm"
  }
  egress: {
    mode: EgressMode
    proxyActive: boolean
    httpProxyConfigured: boolean
    /** True when S3V3N_EGRESS_MODE=proxy-chain */
    proxyChainSelected: boolean
    /** True when proxy-chain selected AND usable http(s) proxy is set (agent would attach). */
    proxyChainConfigured: boolean
    /** Human honesty: configured vs not for proxy-chain (never secrets). */
    proxyChainHonesty: string
    torSocks: string
    torReachable: boolean
    torDetail: string
    note: string
  }
  panel: {
    neverLogBodies: true
    persistEncryptedOnlyWhen: "S3V3N_PANEL_PERSIST=1"
  }
  lattice_sync: false
  checkedAt: string
}

export async function getPrivacyStatus(): Promise<PrivacyStatus> {
  const egress = getEgressConfig()
  const tor = await checkTorSocksReachable(egress.torSocks)
  const persistFlag = process.env.S3V3N_PANEL_PERSIST === "1"
  const enc = isEncryptionAvailable()

  return {
    ok: true,
    fortress: PRIVACY_FORTRESS.name,
    version: PRIVACY_FORTRESS.version,
    hold: PRIVACY_FORTRESS.hold,
    telemetry: {
      analytics: TELEMETRY_POLICY.analytics,
      bodyLogging: TELEMETRY_POLICY.bodyLogging,
      consoleBodies: TELEMETRY_POLICY.consoleBodies,
      networkBeacons: TELEMETRY_POLICY.networkBeacons,
    },
    encryption: {
      available: enc,
      persistFlag,
      keyFingerprint: enc ? privacyKeyFingerprint() : null,
      vaultDir: PRIVACY_VAULT_DIR,
      alg: "aes-256-gcm",
    },
    egress: {
      mode: egress.mode,
      proxyActive: egress.proxyActive,
      httpProxyConfigured: Boolean(egress.httpProxy),
      proxyChainSelected: egress.mode === "proxy-chain",
      proxyChainConfigured: egress.mode === "proxy-chain" && egress.proxyActive,
      proxyChainHonesty:
        egress.mode !== "proxy-chain"
          ? `not selected (mode=${egress.mode})`
          : egress.proxyActive
            ? "CONFIGURED — first-hop ProxyAgent ready"
            : egress.httpProxy
              ? "SELECTED but proxy URL not http(s):// — NOT READY"
              : "SELECTED but S3V3N_HTTP_PROXY unset — NOT CONFIGURED",
      torSocks: egress.torSocks,
      torReachable: tor.reachable,
      torDetail: `${tor.host}:${tor.port} ${tor.detail}`,
      note: egress.note,
    },
    panel: {
      neverLogBodies: true,
      persistEncryptedOnlyWhen: "S3V3N_PANEL_PERSIST=1",
    },
    lattice_sync: false,
    checkedAt: new Date().toISOString(),
  }
}
