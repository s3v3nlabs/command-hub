/**
 * AI Caller core — shared by Next.js API routes and server/caller-bridge.
 * Plain ESM, Node built-ins only. All call data stays in local-data/caller (gitignored).
 *
 * Safety rules enforced here (not just in the UI):
 *  - fixed disclosure opening line (AI virtual assistant + call is recorded)
 *  - explicit confirm token required per dial (HMAC, short-lived, bound to number+objective)
 *  - one number per dial (no lists / bulk), one active call at a time
 *  - per-day call cap (CALLER_DAILY_CAP, default 10)
 *  - do-not-call list checked before every dial
 *  - caller ID is always TWILIO_FROM_NUMBER (never taken from the request)
 */
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

const env = (k, d = "") => {
  const v = process.env[k]
  return v && String(v).trim() ? String(v).trim() : d
}

export const DATA_DIR = () => env("CALLER_DATA_DIR") || path.join(process.cwd(), "local-data", "caller")
const CALLS = () => path.join(DATA_DIR(), "calls.json")
const DNC = () => path.join(DATA_DIR(), "dnc.json")
const SECRET_FILE = () => path.join(DATA_DIR(), ".confirm-secret")
export const transcriptPath = (id) => path.join(DATA_DIR(), "transcripts", `${String(id).replace(/[^a-zA-Z0-9_-]/g, "")}.jsonl`)

function ensureDir() {
  fs.mkdirSync(path.join(DATA_DIR(), "transcripts"), { recursive: true })
}
function readJson(p, d) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"))
  } catch {
    return d
  }
}
function writeJson(p, v) {
  ensureDir()
  const tmp = `${p}.${process.pid}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(v, null, 2))
  fs.renameSync(tmp, p)
}

// ------------------------------------------------------------------ config

export function ownerName() {
  return env("CALLER_OWNER_NAME", "the Command Hub owner")
}

/** The fixed, non-editable opening disclosure. */
export function disclosureLine() {
  return `Hi, this is an AI virtual assistant calling on behalf of ${ownerName()}. This call is being recorded.`
}

export function dailyCap() {
  const n = Number(env("CALLER_DAILY_CAP", "10"))
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 100) : 10
}

export function maxCallSeconds() {
  const n = Number(env("CALLER_MAX_CALL_SECONDS", "300"))
  return Number.isFinite(n) && n >= 30 ? Math.min(Math.floor(n), 1800) : 300
}

export function twilioConfigured() {
  return Boolean(env("TWILIO_ACCOUNT_SID") && env("TWILIO_AUTH_TOKEN") && env("TWILIO_FROM_NUMBER"))
}

export function publicBaseUrl() {
  return env("PUBLIC_BASE_URL").replace(/\/+$/, "")
}

export function mediaStreamUrl() {
  const explicit = env("PUBLIC_MEDIA_STREAM_URL")
  if (explicit) return explicit
  const base = publicBaseUrl()
  if (!base) return ""
  return base.replace(/^http/, "ws") + "/media"
}

export function mode() {
  return twilioConfigured() && publicBaseUrl() ? "live" : "demo"
}

export function maskNumber(n) {
  const s = String(n || "")
  return s.length > 4 ? `${s.slice(0, 2)}${"•".repeat(Math.max(0, s.length - 6))}${s.slice(-4)}` : s
}

// ------------------------------------------------------------------ numbers

/** Normalise to E.164. Accepts one number only; rejects lists. */
export function normalizeNumber(raw) {
  if (typeof raw !== "string") return { ok: false, error: "number must be a single string" }
  const s = raw.trim()
  if (/[,;\n]/.test(s) || (s.match(/\+/g) || []).length > 1) return { ok: false, error: "one number per call — lists / bulk dialing are not allowed" }
  let digits = s.replace(/[^\d+]/g, "")
  if (!digits.startsWith("+")) {
    const d = digits.replace(/\D/g, "")
    if (d.length === 10) digits = `+1${d}`
    else if (d.length === 11 && d.startsWith("1")) digits = `+${d}`
    else return { ok: false, error: "use E.164 format, e.g. +15551234567" }
  }
  if (!/^\+[1-9]\d{7,14}$/.test(digits)) return { ok: false, error: "invalid phone number" }
  // Block emergency / short codes / premium-rate prefixes (NANP 900/976)
  if (/^\+1(900|976)/.test(digits)) return { ok: false, error: "premium-rate numbers are blocked" }
  if (/^\+?(911|112|999)$/.test(digits.replace("+", ""))) return { ok: false, error: "emergency numbers are blocked" }
  return { ok: true, number: digits }
}

// ------------------------------------------------------------------ DNC

export function listDnc() {
  return readJson(DNC(), [])
}
export function isDnc(number) {
  return listDnc().some((e) => e.number === number)
}
export function addDnc(number, reason = "operator") {
  const n = normalizeNumber(number)
  if (!n.ok) return n
  const list = listDnc()
  if (!list.some((e) => e.number === n.number)) list.push({ number: n.number, reason: String(reason).slice(0, 120), addedAt: new Date().toISOString() })
  writeJson(DNC(), list)
  return { ok: true, number: n.number }
}
export function removeDnc(number) {
  const n = normalizeNumber(number)
  if (!n.ok) return n
  writeJson(DNC(), listDnc().filter((e) => e.number !== n.number))
  return { ok: true }
}

// ------------------------------------------------------------------ calls log

export function listCalls() {
  return readJson(CALLS(), [])
}
export function getCall(id) {
  return listCalls().find((c) => c.id === id) || null
}
export function upsertCall(call) {
  const calls = listCalls()
  const i = calls.findIndex((c) => c.id === call.id)
  if (i >= 0) calls[i] = { ...calls[i], ...call, updatedAt: new Date().toISOString() }
  else calls.unshift({ ...call, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  writeJson(CALLS(), calls.slice(0, 500))
  return getCall(call.id)
}
export function findCallBySid(sid) {
  return listCalls().find((c) => c.twilioSid === sid) || null
}

const ACTIVE = new Set(["queued", "initiated", "ringing", "in-progress", "dialing", "demo-active"])
export function activeCall() {
  const cutoff = Date.now() - (maxCallSeconds() + 120) * 1000
  return listCalls().find((c) => ACTIVE.has(c.status) && Date.parse(c.createdAt) > cutoff) || null
}

export function callsToday() {
  const today = new Date().toISOString().slice(0, 10)
  return listCalls().filter((c) => String(c.createdAt || "").slice(0, 10) === today && c.mode === "live").length
}
export function demoCallsToday() {
  const today = new Date().toISOString().slice(0, 10)
  return listCalls().filter((c) => String(c.createdAt || "").slice(0, 10) === today && c.mode === "demo").length
}

// ------------------------------------------------------------------ transcripts

export function appendTranscript(id, entry) {
  ensureDir()
  const line = JSON.stringify({ t: new Date().toISOString(), ...entry })
  fs.appendFileSync(transcriptPath(id), line + "\n")
}
export function readTranscript(id) {
  try {
    return fs
      .readFileSync(transcriptPath(id), "utf8")
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l))
  } catch {
    return []
  }
}

// ------------------------------------------------------------------ confirm tokens

function secret() {
  const s = env("CALLER_CONFIRM_SECRET")
  if (s) return s
  ensureDir()
  try {
    return fs.readFileSync(SECRET_FILE(), "utf8")
  } catch {
    const v = crypto.randomBytes(32).toString("hex")
    fs.writeFileSync(SECRET_FILE(), v, { mode: 0o600 })
    return v
  }
}
const digest = (s) => crypto.createHash("sha256").update(String(s || "")).digest("hex").slice(0, 16)

/** Issue a short-lived token the operator must send back with an explicit Confirm. */
export function issueConfirmToken(number, objective) {
  const exp = Date.now() + 2 * 60 * 1000
  const nonce = crypto.randomBytes(8).toString("hex")
  const payload = `${number}|${digest(objective)}|${exp}|${nonce}`
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("hex")
  return { token: Buffer.from(`${payload}|${sig}`).toString("base64url"), expiresAt: new Date(exp).toISOString() }
}

const USED = new Set()
export function verifyConfirmToken(token, number, objective) {
  try {
    const raw = Buffer.from(String(token), "base64url").toString()
    const [n, d, exp, nonce, sig] = raw.split("|")
    const expect = crypto.createHmac("sha256", secret()).update(`${n}|${d}|${exp}|${nonce}`).digest("hex")
    if (!sig || sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return { ok: false, error: "invalid confirmation" }
    if (Date.now() > Number(exp)) return { ok: false, error: "confirmation expired — review and confirm again" }
    if (n !== number || d !== digest(objective)) return { ok: false, error: "number or objective changed after confirmation" }
    if (USED.has(nonce)) return { ok: false, error: "confirmation already used" }
    USED.add(nonce)
    return { ok: true }
  } catch {
    return { ok: false, error: "invalid confirmation" }
  }
}

/** Pre-dial policy check shared by prepare + call. */
export function policyCheck(number, isLive) {
  if (isDnc(number)) return { ok: false, error: "number is on the do-not-call list" }
  const act = activeCall()
  if (act) return { ok: false, error: `another call is active (${act.id}) — end it first` }
  if (isLive && callsToday() >= dailyCap()) return { ok: false, error: `daily cap reached (${dailyCap()} live calls/day)` }
  if (!isLive && demoCallsToday() >= 50) return { ok: false, error: "demo cap reached for today" }
  return { ok: true }
}

// ------------------------------------------------------------------ stream auth

/** Token the bridge checks so only streams started by our TwiML are accepted. */
export function streamToken(callId) {
  return crypto.createHmac("sha256", env("TWILIO_AUTH_TOKEN") || secret()).update(`stream|${callId}`).digest("hex").slice(0, 32)
}
export function verifyStreamToken(callId, tok) {
  const a = streamToken(callId)
  return typeof tok === "string" && tok.length === a.length && crypto.timingSafeEqual(Buffer.from(tok), Buffer.from(a))
}

// ------------------------------------------------------------------ Twilio REST + signatures

export function validateTwilioSignature(url, params, signature) {
  const tok = env("TWILIO_AUTH_TOKEN")
  if (!tok || !signature) return false
  const data = Object.keys(params)
    .sort()
    .reduce((acc, k) => acc + k + params[k], url)
  const expect = crypto.createHmac("sha1", tok).update(Buffer.from(data, "utf-8")).digest("base64")
  return expect.length === signature.length && crypto.timingSafeEqual(Buffer.from(expect), Buffer.from(signature))
}

async function twilio(pathname, form) {
  const sid = env("TWILIO_ACCOUNT_SID")
  const auth = Buffer.from(`${sid}:${env("TWILIO_AUTH_TOKEN")}`).toString("base64")
  const body = new URLSearchParams()
  for (const [k, v] of form) body.append(k, v)
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}${pathname}`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`Twilio ${r.status}: ${String(j.message || "error").slice(0, 200)}`)
  return j
}

/** Place the outbound call. Caller ID is always TWILIO_FROM_NUMBER. */
export async function twilioCreateCall(callId, to) {
  const base = publicBaseUrl()
  const form = [
    ["To", to],
    ["From", env("TWILIO_FROM_NUMBER")],
    ["Url", `${base}/api/caller/twiml?callId=${encodeURIComponent(callId)}`],
    ["Method", "POST"],
    ["StatusCallback", `${base}/api/caller/status?callId=${encodeURIComponent(callId)}`],
    ["StatusCallbackMethod", "POST"],
    ["StatusCallbackEvent", "initiated"],
    ["StatusCallbackEvent", "ringing"],
    ["StatusCallbackEvent", "answered"],
    ["StatusCallbackEvent", "completed"],
    ["Record", "true"],
    ["Timeout", "30"],
    ["TimeLimit", String(maxCallSeconds())],
  ]
  return twilio("/Calls.json", form)
}

export async function twilioHangup(sid) {
  return twilio(`/Calls/${encodeURIComponent(sid)}.json`, [["Status", "completed"]])
}

export function xmlEscape(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] || c)
}

/** TwiML: Twilio speaks the fixed disclosure itself, then connects the media stream. */
export function buildTwiml(callId) {
  const ws = mediaStreamUrl()
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${xmlEscape(disclosureLine())}</Say>
  <Connect>
    <Stream url="${xmlEscape(ws)}">
      <Parameter name="callId" value="${xmlEscape(callId)}" />
      <Parameter name="token" value="${streamToken(callId)}" />
    </Stream>
  </Connect>
</Response>`
}

// ------------------------------------------------------------------ conversation prompt

export function callSystemPrompt(call) {
  return [
    `You are an AI virtual assistant on a live phone call, calling on behalf of ${ownerName()}.`,
    `The disclosure "${disclosureLine()}" has already been spoken. Never claim to be human; if asked, confirm you are an AI assistant.`,
    `Objective: ${call.objective || "(none given)"}`,
    call.script ? `Talking points / script from the operator:\n${call.script}` : "",
    "Rules: speak in short, natural sentences (1-2 sentences per turn). Be polite and warm. Don't invent facts about the owner beyond the objective and script. No pressure tactics, no sales spam, no threats, no impersonation.",
    'If the person asks not to be called again, apologise, say you will note it, and append the token [DNC] then [END_CALL].',
    "When the objective is done, or the person wants to end, say a brief goodbye and append [END_CALL].",
    "If they leave a message for the owner, repeat it back briefly to confirm.",
  ]
    .filter(Boolean)
    .join("\n\n")
}

/** Opening turn after the disclosure. */
export function openingTurn(call) {
  const o = String(call.objective || "").trim()
  return o ? `I'm calling because ${o.replace(/^[A-Z]/, (c) => c.toLowerCase()).replace(/\.$/, "")}. Is now an okay time for a quick moment?` : "Is now an okay time for a quick moment?"
}
