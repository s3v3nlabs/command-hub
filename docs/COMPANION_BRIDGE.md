# Device Bridge (hub-served PWA)

An installable phone companion **served by the Command Hub itself**. The phone
streams its camera and microphone to the hub over WebRTC, pushes GPS / battery /
network telemetry, and can trigger a short list of safe hub actions. The hub
can share a webcam back when one is attached.

This is **not** the Termux companion. Termux stays the scripting / recon node
(`companions/termux/`). The PWA is the sensor bridge — browsers give real
`getUserMedia` and WebRTC, which Termux:API does not.

Credit: **Christian Wilford (s3v3n), AI Architect, Offensive Security
Enthusiast, Founder of Singular/ty Defense Solutions, LLC.** Apache-2.0.

## Routes

| Route | Role |
|-------|------|
| `/companion` | Phone landing: what this is, PWA install, pair, bodycam |
| `/companion/bridge` | Same phone bridge UI, skipping the intro (start_url-friendly) |
| `/companion/hub-view` | Hub seat: watch the bodycam, read telemetry, optional reverse cam, ask the phone to open a module |
| `/intelligence/cctv` | CCTV wall lists live bodycams and links here (does not embed a second peer) |

APIs under `/api/companion/*`: `status` (softer auth), `sessions` (create/join/end), `signal` (SDP/ICE POST), `events` (SSE), `telemetry`, `actions`.

Sessions and the last telemetry fix persist under `data/companion/` (gitignored via `data/*`). Signaling subscribers are **in-process**.

## Install the PWA on a phone

1. The hub must be reachable from the phone over **HTTPS**, or at `http://localhost` / `http://127.0.0.1` for lab. A raw LAN IP over HTTP is **not** a secure context — the browser will refuse camera, mic, and often geolocation. Use a reverse proxy with TLS, or Tailscale Serve / a tunnel that terminates HTTPS.
2. Open `https://<hub-host>/companion` in Chrome (Android) or Safari (iOS).
3. **Android Chrome:** menu → **Add to Home Screen** (or the in-page Install button when Chrome fires `beforeinstallprompt`).
4. **iOS Safari:** Share → **Add to Home Screen**. iOS has no native install prompt.
5. Launch it from the home screen (standalone display). The service worker caches the shell only; a live call still needs a network.

The hub process should bind a reachable interface: `npx next start -H 0.0.0.0 -p 3100`.

## Pair with a token

On any shared or reachable host, set in `.env.local`:

```
SECURE_MODE=1
HUB_API_TOKEN=<long random secret>
```

1. On the phone, paste that same token into **Pair with hub**, give the device a label, tap **Pair & open session**.
2. The hub returns a **session id** and a **one-time ticket**. The ticket is stored in the page's `sessionStorage` and sent as `x-companion-ticket` (or `?ticket=` for EventSource, which cannot set `Authorization`). It is **not** the hub token, and it is scoped to one session + role.
3. On a desktop at the hub, open `/companion/hub-view`, paste the same operator token, and **Take seat** on the live session (or open `/companion/hub-view?session=<id>`).
4. On the phone, tap **Start bodycam** and accept the browser permission prompts. The hub viewer should show the feed and telemetry (GPS / battery / network, when the APIs exist).

`SECURE_MODE=1` with no token configured **denies** session join and live media. With no token and `SECURE_MODE` off (open lab on localhost) pairing works without a secret — do not do that on a reachable network.

## What is and is not shipped

- **WebRTC is 1:1.** One phone + one hub viewer per session. A second viewer steals the seat. The CCTV wall therefore *lists* live bodycams and links to the hub seat rather than opening a second peer.
- **No TURN server.** Same LAN or Tailscale usually works on host ICE candidates. A public STUN server (`stun.l.google.com:19302`) is used for NAT discovery. Symmetric NAT on the public internet will fail.
- **No SFU, no mesh, no recording service.** The browsers talk RTP to each other. The hub only brokers SDP/ICE.
- **Signaling is SSE+POST in this Node process.** Multi-instance or serverless deploys will not share the bus — run a single hub process.
- **Safe remote actions only:** SignalFrame presence heartbeat, and an allowlisted in-hub navigation prompt. The phone does not auto-navigate (that would drop the call). No shell, no ladder-gated offensive tools.
- **This is your device and your hub.** It does not bypass phone permissions, and it is not a covert implant. Third-party CCTV connect stays behind the staged ladder (`CCTV_CONNECT_ENABLED`) and is a separate path.

## Termux

Keep using [`companions/termux/`](../companions/termux/README.md) for operator-deck scripting (health ping, audit peek, Black Aurora redeem, nmap/adb when those tools are on the phone). Point both at the same hub.
