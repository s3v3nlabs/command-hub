import type { BlackAuroraMode } from "./types"

/**
 * BLACK_AURORA_MODE:
 *  - "bundle" (default): portal serves a gated git-bundle / tarball after verify
 *  - "github-private": documented path only — operator makes the GitHub repo private
 *    and hands out collaborator invites / fine-grained PATs out-of-band. No live
 *    GitHub token minting is implemented.
 */
export function getBlackAuroraMode(): BlackAuroraMode {
  const raw = (process.env.BLACK_AURORA_MODE || "bundle").trim().toLowerCase()
  if (raw === "github-private") return "github-private"
  return "bundle"
}

export const PUBLIC_REPO_HONESTY =
  "A public GitHub repository cannot be code-gated for `git clone`. " +
  "Black Aurora gates a server-side bundle/tarball download (or, in github-private mode, " +
  "documents how to accept a private-repo invite). The public clone URL stays public."

export const SCREENSHOT_HONESTY =
  "Browser anti-screenshot / destroy-on-blur is a UX deterrent only — it is not enforceable. " +
  "Real controls are single-use tokens, server-side expiry/revoke, and Cache-Control: no-store."
