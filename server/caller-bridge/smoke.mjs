#!/usr/bin/env node
/**
 * AI Caller smoke test (no Twilio account needed).
 *  1. unit checks: number validation, bulk rejection, confirm tokens, DNC, μ-law, TwiML disclosure
 *  2. bridge: starts on a temp port, opens a fake Twilio Media Stream with a valid token,
 *     and checks bad tokens are rejected.
 *  3. API (optional): if HUB_URL is set (e.g. http://127.0.0.1:3000) runs a DEMO call end-to-end.
 * Usage: npm run caller:smoke   [HUB_URL=http://127.0.0.1:3000]
 */
import assert from "node:assert/strict"
import os from "node:os"
import path from "node:path"
import fs from "node:fs"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "caller-smoke-"))
process.env.CALLER_DATA_DIR = tmp
process.env.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "smoke-test-token"
const C = await import("../../lib/caller/core.mjs")
const L = await import("../../lib/llm/core.mjs")
let pass = 0
const ok = (name) => {
  pass++
  console.log("  ✓", name)
}

console.log("unit")
assert.equal(C.normalizeNumber("(385) 555-0100").number, "+13855550100"); ok("normalises US numbers to E.164")
assert.equal(C.normalizeNumber("+13855550100, +13855550101").ok, false); ok("rejects lists (no bulk dialing)")
assert.equal(C.normalizeNumber(["+13855550100"]).ok, false); ok("rejects arrays")
assert.equal(C.normalizeNumber("+19005550100").ok, false); ok("blocks premium-rate 900")
const t = C.issueConfirmToken("+13855550100", "say hi")
assert.equal(C.verifyConfirmToken(t.token, "+13855550100", "say hi").ok, true); ok("confirm token verifies")
assert.equal(C.verifyConfirmToken(t.token, "+13855550100", "say hi").ok, false); ok("confirm token is single-use")
assert.equal(C.verifyConfirmToken(C.issueConfirmToken("+13855550100", "a").token, "+13855550100", "b").ok, false); ok("token bound to objective")
C.addDnc("+13855550199", "test")
assert.equal(C.policyCheck("+13855550199", true).ok, false); ok("DNC blocks dialing")
assert.match(C.buildTwiml("call_x"), /AI virtual assistant calling on behalf of .*This call is being recorded/); ok("TwiML speaks fixed disclosure")
assert.match(C.buildTwiml("call_x"), /<Parameter name="token"/); ok("TwiML carries stream token")
for (let s = -30000; s <= 30000; s += 1500) assert.ok(Math.abs(L.mulawToPcm(L.pcmToMulaw(s)) - s) <= Math.max(16, Math.abs(s) * 0.07))
ok("μ-law encode/decode round-trip")
assert.equal(L.mulawToWav(Buffer.alloc(80, 0xff)).length, 44 + 160); ok("μ-law → WAV")

console.log("bridge")
const port = 18000 + Math.floor(Math.random() * 1000)
const bridge = spawn(process.execPath, [path.join(ROOT, "server/caller-bridge/index.mjs")], {
  env: { ...process.env, CALLER_BRIDGE_PORT: String(port), CALLER_DATA_DIR: tmp },
  stdio: ["ignore", "pipe", "pipe"],
})
await new Promise((res, rej) => {
  const to = setTimeout(() => rej(new Error("bridge did not start")), 8000)
  bridge.stdout.on("data", (d) => String(d).includes("listening") && (clearTimeout(to), res()))
})
const h = await (await fetch(`http://127.0.0.1:${port}/bridge/health`)).json()
assert.equal(h.ok, true); ok("bridge health endpoint")
const { WebSocket } = await import("ws")
const closedFast = await new Promise((res) => {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/media`)
  ws.on("open", () => ws.send(JSON.stringify({ event: "start", start: { streamSid: "MZ1", customParameters: { callId: "nope", token: "bad" } } })))
  ws.on("close", () => res(true))
  setTimeout(() => res(false), 3000)
})
assert.equal(closedFast, true); ok("bridge rejects streams with bad token")
C.upsertCall({ id: "call_smoke", to: "+13855550100", objective: "say hello", mode: "live", status: "ringing" })
const accepted = await new Promise((res) => {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/media`)
  ws.on("open", () => {
    ws.send(JSON.stringify({ event: "start", start: { streamSid: "MZ2", customParameters: { callId: "call_smoke", token: C.streamToken("call_smoke") } } }))
    setTimeout(() => {
      ws.send(JSON.stringify({ event: "stop" }))
      ws.close()
      res(true)
    }, 1500)
  })
  ws.on("close", () => res(false))
})
assert.equal(accepted, true); ok("bridge accepts stream with valid token")
await new Promise((r) => setTimeout(r, 300))
const tr = C.readTranscript("call_smoke")
assert.ok(tr.some((e) => e.speaker === "ai" && /AI virtual assistant/.test(e.text))); ok("bridge logs disclosure to transcript")
bridge.kill()

if (process.env.HUB_URL) {
  console.log("api (demo call via", process.env.HUB_URL + ")")
  const base = process.env.HUB_URL.replace(/\/$/, "")
  const cfg = await (await fetch(`${base}/api/caller/config`)).json()
  assert.ok(cfg.disclosure); ok(`config ok (mode=${cfg.mode})`)
  const bulk = await fetch(`${base}/api/caller/prepare`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: ["+13855550100", "+13855550101"], objective: "x x x x x" }) })
  assert.equal(bulk.status, 400); ok("API rejects bulk")
  const noConfirm = await fetch(`${base}/api/caller/call`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: "+13855550100", objective: "say hello there" }) })
  assert.equal(noConfirm.status, 403); ok("API refuses to dial without confirm token")
  if (cfg.mode === "demo" && !cfg.active) {
    const prep = await (await fetch(`${base}/api/caller/prepare`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: "+13855550100", objective: "say hello there" }) })).json()
    assert.ok(prep.confirmToken); ok("prepare returns confirm token")
    const call = await (await fetch(`${base}/api/caller/call`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: "+13855550100", objective: "say hello there", confirmToken: prep.confirmToken }) })).json()
    assert.equal(call.mode, "demo"); ok("demo call started")
    await new Promise((r) => setTimeout(r, 3500))
    const hist = await (await fetch(`${base}/api/caller/history?id=${call.id}`)).json()
    assert.ok(hist.transcript.some((e) => /DEMO MODE/.test(e.text))); ok("demo transcript is labelled DEMO")
    await fetch(`${base}/api/caller/hangup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: call.id }) })
    ok("demo call hung up")
  }
}
fs.rmSync(tmp, { recursive: true, force: true })
console.log(`\n${pass} checks passed`)
process.exit(0)
