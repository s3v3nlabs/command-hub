export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import {
  hiveStatus,
  listHiveEvents,
  postHive,
  verifyHiveSecret,
  getHivePeers,
  hiveSecretConfigured,
} from "@/lib/hive/bus"
import {
  isIntelPacket,
  normalizeIntel,
  ingestIntelLocal,
  shouldReplicate,
} from "@/lib/hive/intel"

/**
 * Cross-hub AI hive bus + intel packets.
 * Every response includes lattice_sync: false (HOLD_VYRNA_UNSYNC).
 * Never logs prompt / intel summary bodies to console.
 */

export async function GET(req: Request) {
  const url = new URL(req.url)
  const limit = Number(url.searchParams.get("limit") || "40")
  const status = hiveStatus()
  const events = listHiveEvents(limit)
  return NextResponse.json({
    ...status,
    events,
  })
}

export async function POST(req: Request) {
  if (!verifyHiveSecret(req)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized", lattice_sync: false, hold: "HOLD_VYRNA_UNSYNC" },
      { status: 401 },
    )
  }
  try {
    const body = await req.json().catch(() => ({}))
    const kind = typeof body?.kind === "string" ? body.kind : "prompt"
    const skipPeerFanout = Boolean(body?._peerRelay)

    // --- Intel packet path ---
    if (kind === "intel" || body?.intel || (body?.severity && body?.title && body?.summary)) {
      const raw = body?.intel && typeof body.intel === "object" ? body.intel : body
      if (!isIntelPacket(raw)) {
        return NextResponse.json(
          { ok: false, error: "Invalid IntelPacket (or forbidden exploit-flavored content)", lattice_sync: false },
          { status: 400 },
        )
      }
      const packet = normalizeIntel(raw as Record<string, unknown>, typeof body?.fromHub === "string" ? body.fromHub : "local")
      const local = ingestIntelLocal(packet)

      const peerResults: { url: string; ok: boolean; status?: number }[] = []
      if (!skipPeerFanout && shouldReplicate(packet)) {
        const peers = getHivePeers()
        const secret = process.env.S3V3N_HIVE_SECRET?.trim()
        if (peers.length && secret) {
          await Promise.all(
            peers.map(async (base) => {
              const url = base.replace(/\/$/, "") + "/api/hive"
              try {
                const res = await fetch(url, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-s3v3n-hive-secret": secret,
                    S3V3N_HIVE_SECRET: secret,
                  },
                  body: JSON.stringify({
                    kind: "intel",
                    ...packet,
                    _peerRelay: true,
                    lattice_sync: false,
                    hold: "HOLD_VYRNA_UNSYNC",
                  }),
                  signal: AbortSignal.timeout(8000),
                })
                peerResults.push({ url, ok: res.ok, status: res.status })
              } catch {
                peerResults.push({ url, ok: false })
              }
            }),
          )
        }
      }

      return NextResponse.json({
        ok: true,
        kind: "intel",
        packet: { ...packet, lattice_sync: false },
        local,
        peerFanout: peerResults,
        secretConfigured: hiveSecretConfigured(),
        hold: "HOLD_VYRNA_UNSYNC",
        lattice_sync: false,
      })
    }

    // --- Prompt / consensus path ---
    const prompt = typeof body?.prompt === "string" ? body.prompt : ""
    const fromHub = typeof body?.fromHub === "string" ? body.fromHub : "local"
    const toHub = typeof body?.toHub === "string" ? body.toHub : undefined
    const panel = typeof body?.panel === "string" ? body.panel : undefined

    const result = await postHive({
      fromHub,
      toHub,
      prompt,
      panel,
      skipPeerFanout,
    })

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, lattice_sync: false, hold: "HOLD_VYRNA_UNSYNC" },
        { status: 400 },
      )
    }

    return NextResponse.json({
      ok: true,
      kind: "prompt",
      event: result.event,
      panelInvoked: result.panelInvoked,
      hold: "HOLD_VYRNA_UNSYNC",
      lattice_sync: false,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "hive failed"
    return NextResponse.json(
      {
        ok: false,
        error: message
          .replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]")
          .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
          .slice(0, 300),
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
      },
      { status: 500 },
    )
  }
}
