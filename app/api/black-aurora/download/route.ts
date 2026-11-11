export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import { noStoreJson, withNoStore } from "@/lib/black-aurora/headers"
import { consumeDownloadGrant } from "@/lib/black-aurora/invites"
import { createSourceBundle, cleanupBundle, type BundleFormat } from "@/lib/black-aurora/bundle"
import { getBlackAuroraMode, PUBLIC_REPO_HONESTY } from "@/lib/black-aurora/mode"

/**
 * GET ?grant=...&format=bundle|tar
 * Streams a gated source artifact. Consumes the one-time download grant.
 */
export async function GET(request: NextRequest) {
  const grant = request.nextUrl.searchParams.get("grant") || ""
  const formatParam = (request.nextUrl.searchParams.get("format") || "bundle").toLowerCase()
  const format: BundleFormat = formatParam === "tar" ? "tar" : "bundle"

  const mode = getBlackAuroraMode()
  if (mode === "github-private") {
    return noStoreJson(
      {
        ok: false,
        error: "mode_github_private",
        detail:
          "BLACK_AURORA_MODE=github-private: no bundle is served. Operator should make the GitHub repo private and send a collaborator invite / fine-grained PAT out-of-band. See USAGE.md (Black Aurora).",
        honesty: PUBLIC_REPO_HONESTY,
      },
      { status: 501 },
    )
  }

  const consumed = consumeDownloadGrant(grant)
  if (!consumed.ok) {
    return noStoreJson(
      { ok: false, error: consumed.error, reason: consumed.reason },
      { status: 403 },
    )
  }

  const built = await createSourceBundle(format)
  if (!built.ok) {
    return noStoreJson(
      {
        ok: false,
        error: built.error,
        detail: built.detail,
        honesty: PUBLIC_REPO_HONESTY,
      },
      { status: 503 },
    )
  }

  try {
    const buf = fs.readFileSync(built.filePath)
    const res = new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": built.contentType,
        "Content-Disposition": `attachment; filename="${built.filename}"`,
        "Content-Length": String(built.bytes),
        "X-Black-Aurora-Format": built.format,
        "X-Black-Aurora-Invite": consumed.invite.code,
      },
    })
    return withNoStore(res)
  } finally {
    cleanupBundle(built.filePath)
  }
}
