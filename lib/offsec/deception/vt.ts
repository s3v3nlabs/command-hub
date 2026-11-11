/**
 * VirusTotal submission — OPT-IN, staged-ladder gated.
 * Uploading samples can tip off an attacker, so submission is never automatic.
 * Server-side VT_API_KEY only; never hardcode. Honors a simple rate note.
 */

export function vtKey(): string | null {
  const k = process.env.VT_API_KEY?.trim()
  return k ? k : null
}

export async function submitHashLookup(sha256: string): Promise<{
  ok: boolean
  status?: number
  positives?: number
  total?: number
  permalink?: string
  note?: string
}> {
  const key = vtKey()
  if (!key) return { ok: false, note: "VT_API_KEY not configured" }
  try {
    const r = await fetch(`https://www.virustotal.com/api/v3/files/${encodeURIComponent(sha256)}`, {
      headers: { "x-apikey": key, Accept: "application/json" },
      cache: "no-store",
    })
    if (r.status === 404) return { ok: true, status: 404, note: "unknown to VT (hash not seen) — no upload performed" }
    if (!r.ok) return { ok: false, status: r.status, note: `VT error ${r.status}` }
    const data = (await r.json()) as any
    const stats = data?.data?.attributes?.last_analysis_stats || {}
    const positives = Number(stats.malicious || 0) + Number(stats.suspicious || 0)
    const total = Object.values(stats).reduce((a: number, b: any) => a + Number(b || 0), 0)
    return {
      ok: true,
      status: 200,
      positives,
      total,
      permalink: `https://www.virustotal.com/gui/file/${sha256}`,
      note: "hash lookup only (no sample uploaded)",
    }
  } catch (e) {
    return { ok: false, note: e instanceof Error ? e.message.slice(0, 200) : "vt_error" }
  }
}

export async function submitSampleUpload(buffer: Buffer, filename: string): Promise<{
  ok: boolean
  status?: number
  permalink?: string
  analysisId?: string
  note?: string
}> {
  const key = vtKey()
  if (!key) return { ok: false, note: "VT_API_KEY not configured" }
  if (buffer.length > 32 * 1024 * 1024) return { ok: false, note: "sample >32MB — use VT large-file flow manually" }
  try {
    const form = new FormData()
    form.append("file", new Blob([new Uint8Array(buffer)]), filename || "sample.bin")
    const r = await fetch("https://www.virustotal.com/api/v3/files", {
      method: "POST",
      headers: { "x-apikey": key },
      body: form,
    })
    if (!r.ok) return { ok: false, status: r.status, note: `VT upload error ${r.status}` }
    const data = (await r.json()) as any
    const analysisId = data?.data?.id
    return {
      ok: true,
      status: 200,
      analysisId,
      note: "sample uploaded to VT (opt-in). This may tip off a sophisticated attacker.",
    }
  } catch (e) {
    return { ok: false, note: e instanceof Error ? e.message.slice(0, 200) : "vt_error" }
  }
}
