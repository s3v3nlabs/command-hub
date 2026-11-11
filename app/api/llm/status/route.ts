export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { providerStatus } from "@/lib/llm"

/** GET /api/llm/status — which AI providers are usable. Never returns key values. */
export async function GET() {
  return NextResponse.json(await providerStatus())
}
