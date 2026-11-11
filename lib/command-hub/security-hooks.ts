/**
 * Command Hub — high-security / IDS / account-rail hooks (P2 prepare).
 * Stubs only. Do NOT consume credentials here. Login wiring is follow-on.
 * HOLD_VYRNA_UNSYNC.
 */

export type SecHookId = "ids-rail" | "high-sec-panel" | "account-rails"

export interface SecHookSpec {
  id: SecHookId
  label: string
  status: "stub" | "planned"
  detail: string
  deepLink?: string
  consumesCredentials: false
}

export const COMMAND_HUB_SEC_HOOKS: SecHookSpec[] = [
  {
    id: "ids-rail",
    label: "IDS / anomaly rail",
    status: "stub",
    detail:
      "Hook point for Command Hub intrusion/anomaly signals. Wire to network-security + evidence later. No live IDS ingest yet.",
    deepLink: "/network-security",
    consumesCredentials: false,
  },
  {
    id: "high-sec-panel",
    label: "High-security panel",
    status: "planned",
    detail:
      "Placeholder for elevated Command Hub controls (airgap cues, vault lock status). Does not unlock or read secrets.",
    deepLink: "/command-hub",
    consumesCredentials: false,
  },
  {
    id: "account-rails",
    label: "Account rails",
    status: "stub",
    detail:
      "Provider account deep-links only (ChatGPT / Grok / Venice / v0). Login/session wiring deferred — Twin and Ops never paste keys.",
    deepLink: "/ai-hub",
    consumesCredentials: false,
  },
]

export function listCommandHubSecHooks(): SecHookSpec[] {
  return COMMAND_HUB_SEC_HOOKS.map((h) => ({ ...h, consumesCredentials: false as const }))
}
