import * as C from "./index"

/** Parse a Twilio webhook and verify X-Twilio-Signature against PUBLIC_BASE_URL. */
export async function readTwilioWebhook(req: Request): Promise<{ ok: boolean; params: Record<string, string>; url: URL }> {
  const url = new URL(req.url)
  const text = await req.text()
  const params: Record<string, string> = {}
  for (const [k, v] of new URLSearchParams(text)) params[k] = v
  const publicUrl = `${C.publicBaseUrl()}${url.pathname}${url.search}`
  const sig = req.headers.get("x-twilio-signature") || ""
  const skip = process.env.CALLER_SKIP_SIGNATURE_CHECK === "1" && process.env.NODE_ENV !== "production"
  return { ok: skip || C.validateTwilioSignature(publicUrl, params, sig), params, url }
}
