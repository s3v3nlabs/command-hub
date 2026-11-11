/**
 * Black Aurora Labs — invite-token types.
 * Real single-use / expiry / revoke invites for gated hub access + bundle download.
 * HOLD_VYRNA_UNSYNC.
 */

export type BlackAuroraMode = "bundle" | "github-private"

export type InviteAuditEvent = {
  at: string
  action: "created" | "verified" | "downloaded" | "revoked" | "expired_check" | "denied"
  detail?: string
  ipHash?: string
}

export type Invite = {
  /** Opaque invite code (A-Z0-9), displayed as GhostNode::<CODE> */
  code: string
  /** Operator note — who this invite is for (e.g. "zerocipher/Jerry") */
  label: string
  /** Instructions shown after successful verify (install steps, welcome text) */
  instructions: string
  createdAt: string
  expiresAt: string | null
  maxUses: number
  uses: number
  revoked: boolean
  /** One-time download grant issued on verify; cleared after download or revoke */
  downloadGrant: string | null
  downloadGrantExpiresAt: string | null
  downloads: number
  redeemedBy: string | null
  redeemedAt: string | null
  audit: InviteAuditEvent[]
}

export type InvitePublicView = {
  code: string
  label: string
  instructions: string
  expiresAt: string | null
  maxUses: number
  uses: number
  revoked: boolean
  downloads: number
  redeemedBy: string | null
  redeemedAt: string | null
  status: "active" | "exhausted" | "expired" | "revoked"
}

export type VerifyResult =
  | {
      ok: true
      code: string
      label: string
      instructions: string
      downloadGrant: string
      mode: BlackAuroraMode
      honesty: string
    }
  | { ok: false; error: string; reason: "not_found" | "revoked" | "expired" | "exhausted" | "invalid" }
