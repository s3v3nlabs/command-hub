# Privacy Fortress

**Routes:** `/privacy` · `/api/privacy/status`  
**Hold:** `HOLD_VYRNA_UNSYNC`  
**Scope:** live reclaim UI (`v0-user-interface/latest`) — S3v3n panel + Command Hub  
**Doctrine:** Singular/ty defensive + authorized-ops on **Operator-owned** stack only.  
**Out of scope:** exploits, malware, attack PoCs, unauthorized access tooling.

## What shipped

1. **`lib/privacy/`**
   - `antiTelemetry.ts` — strip analytics headers, refuse body logging / beacon sinks, `safeLog`
   - `localCrypto.ts` — AES-256-GCM encrypt-at-rest; key from `S3V3N_PRIVACY_KEY` or generated once under reclaim vault (`chmod 600`, never commit)
   - `egress.ts` — profiles `direct` | `vpn` | `tor` | `proxy-chain`; `privacyFetch` / `egressAwareFetch` via undici `ProxyAgent` when `S3V3N_HTTP_PROXY` is `http(s)://…`
   - `privacyPolicy.ts` — constants + `getPrivacyStatus()` for UI

2. **S3v3n panel** (`lib/selfHealing/S3v3nPanel.ts` / `/api/s3v3n-panel`)
   - Never logs prompt/response bodies
   - Optional persist when `S3V3N_PANEL_PERSIST=1` — encrypted blob preferred
   - Non-local seats (e.g. Venice) use `egressAwareFetch`

3. **UI**
   - `/privacy` — Privacy Fortress status card
   - Command Hub module rail link (ADD-ONLY)
   - `/test-harness` egress mode chip

## Env (names only — never commit secrets)

| Var | Role |
|-----|------|
| `S3V3N_PRIVACY_KEY` | Optional passphrase / 64-hex / 32-byte b64 for AES-GCM |
| `S3V3N_PRIVACY_VAULT` | Optional vault dir (default reclaim privacy-vault path) |
| `S3V3N_PANEL_PERSIST` | `1` to write encrypted evidence under reclaim vault |
| `S3V3N_EGRESS_MODE` | `direct` (default) \| `vpn` \| `tor` \| `proxy-chain` |
| `S3V3N_HTTP_PROXY` | `http(s)://host:port` honored for server-side non-local fetches when mode ≠ direct |
| `S3V3N_TOR_SOCKS` | Default `socks5://127.0.0.1:9050` — TCP reachability check only |

## Operator runbook (high-level)

### WireGuard (VPN profile)

1. Install and configure WireGuard on the **host** (Operator-managed). Bring the interface up before starting Next.
2. Set `S3V3N_EGRESS_MODE=vpn`.
3. If Node still needs an explicit HTTP proxy (corporate / split tunnel), set `S3V3N_HTTP_PROXY` to that proxy URL.
4. Confirm routing with your usual `wg show` / connectivity checks — this app does **not** configure tunnels.

### Tor

1. Install and run Tor so a SOCKS listener exists (commonly `127.0.0.1:9050`).
2. Set `S3V3N_EGRESS_MODE=tor` and optionally `S3V3N_TOR_SOCKS=socks5://127.0.0.1:9050`.
3. `/privacy` performs a **passive TCP connect** to confirm something is listening — it does not speak Tor protocol or attack anything.
4. Native `undici` `ProxyAgent` expects an **HTTP** proxy. For fetch through Tor, either:
   - Point `S3V3N_HTTP_PROXY` at an Operator-run HTTP→SOCKS bridge, or
   - Run the Node process under an external Torifying wrapper you already trust.
5. Prefer local seats (Twin RAG, Ollama, Axios local, Ghostlight `127.0.0.1`) to avoid egress entirely.

### Proxy chain

1. Set `S3V3N_EGRESS_MODE=proxy-chain`.
2. Set `S3V3N_HTTP_PROXY` to the first hop HTTP(S) proxy you operate.
3. Further hops are Operator infrastructure — this module only attaches one HTTP proxy agent.

### Encrypt-at-rest transcripts

1. Optionally export `S3V3N_PRIVACY_KEY` in `.env.local` (never commit).
2. Or let `localCrypto` generate a key file once under the reclaim privacy vault (`chmod 600`).
3. Set `S3V3N_PANEL_PERSIST=1` only when you want encrypted evidence files written.

## APIs

| Method | Path | Role |
|--------|------|------|
| `GET` | `/api/privacy/status` | Telemetry / encryption / egress / Tor TCP status (no secrets) |
|  |  | Also: `proxyChainSelected` / `proxyChainConfigured` / `proxyChainHonesty` · `lattice_sync: false` |
| `GET`/`POST` | `/api/s3v3n-panel` | Existing panel; never logs bodies |

## Smoke

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/command-hub
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/privacy
curl -s http://127.0.0.1:3000/api/privacy/status | head -c 400
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/api/s3v3n-panel
```

## Notes

- Venice seat only with Operator-owned `VENICE_API_KEY` — never scrape/spoof.
- Ollama: start locally if desired (`ollama serve`); panel probes loopback.
- Ghostlight modules untouched.

---

## Appendix A — ProtonVPN WireGuard → `S3V3N_EGRESS_MODE=vpn` (docs only)

**Purpose:** Operator-owned Privacy Fortress egress via host WireGuard.  
**This app never configures tunnels, never stores Proton passwords, and never embeds `.conf` secrets.**  
**Do not paste private keys, WireGuard configs, or API tokens into the repo.**

### Identity (path cite only)

- Operator identity: (redacted — configure locally, never commit)
- WireGuard profile generation / Termux `wg-quick` guidance lives in Operator vault / evidence extracts — **cite paths only; do not open secrets into commits.**

### Operator steps (host)

1. In ProtonVPN account (Operator login in browser / Proton app — **not** performed by this hub), download or generate a **WireGuard** profile for your device.
2. Install WireGuard on the **host** that runs Next (`wg` / `wg-quick` or OS WireGuard app).
3. Place the Operator-managed config **outside the repo** (e.g. host path under `/etc/wireguard/` or Operator home — exact path is Operator choice).
4. Bring the interface up with Operator tooling, e.g. host `wg-quick up <iface>` (Operator runs this; hub agents must **not** attempt VPN login or `wg-quick`).
5. Confirm tunnel with Operator checks: `wg show`, usual connectivity tests.
6. In hub env (names only — values in `.env.local`, never committed):
   - `S3V3N_EGRESS_MODE=vpn`
   - Optional: `S3V3N_HTTP_PROXY=http(s)://host:port` if Node still needs an explicit HTTP proxy under split tunnel
7. Restart the Next process so `lib/privacy/egress.ts` reads the mode.
8. Verify: `GET /api/privacy/status` and `/privacy` UI show egress mode `vpn` (no secrets returned).

### Env names (repeat)

| Var | Role |
|-----|------|
| `S3V3N_EGRESS_MODE` | Set to `vpn` after host WireGuard is up |
| `S3V3N_HTTP_PROXY` | Optional HTTP(S) proxy URL for undici when needed |
| `S3V3N_TOR_SOCKS` | Tor profile only — not required for VPN mode |

### Explicit non-goals

- No in-app Proton SDK / OAuth.
- No automated `wg-quick`, no credential paste into docs.
- No burner farming; VPN is Operator-owned egress only.
