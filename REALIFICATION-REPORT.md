# Command Hub realification report

**Date:** 12 November 2026 (America/New_York)
**Operator identity in consoles:** S3v3n@SingularityDefense / SLDS
**Credit:** Christian Wilford (s3v3n), Singular/ty Defense Solutions, LLC
**Repo:** s3v3nlabs/command-hub

This pass makes stub / "SIMULATED" modules **genuinely functional**. Features are not removed in this work. Every backend listed as live was executed on this host this run and returned real data. Nothing was relabelled "real" without a working data source behind it.

## Verification (record of this run)

A Vitest suite (`tests/live-backends.test.ts`) calls the TypeScript backends directly — the same functions `/api/live/[module]` uses. **18/18 tests passed** on 12 Nov 2026 at 16:36 America/New_York, in 2.24s, with no fixtures:

```
✓ sys snapshot is live and has this hostname          (38ms)
✓ net snapshot runs ss and reports real socket counts (36ms)
✓ fs browse lists the real repo                       (9ms)
✓ fs refuses to preview secret files                  (0ms)
✓ shell executes whoami for real                      (4ms)
✓ shell cd persists and ls is real                    (7ms)
✓ windows flavor translates dir to real ls            (7ms)
✓ sqlite is a real database and accepts SELECT        (82ms)
✓ encrypted messages persist and decrypt              (4ms)
✓ obsidian vault write and read are real              (1ms)
✓ threats include a live KEV catalog or an honest error (158ms)
✓ leaks lookup for a domain hits a live catalog         (115ms)
✓ osint classify + DNS for example.com is live          (1090ms)
✓ sigint returns real procfs counters                   (32ms)
✓ edr snapshot is live and lists real processes         (29ms)
✓ beastwagon is labelled as host telemetry, not a fake car (11ms)
✓ reports can be generated from a live snapshot         (11ms)
✓ vault streams overview points at a real sqlite file   (30ms)
```

What those probes actually showed:

- `getSystemSnapshot()` — live `/proc` + `df`/`free`, real hostname, memory total > 100 MB, CPU cores > 0.
- `getNetworkSnapshot()` — backend `ss + ip + nft/iptables (live)`, `activeConnections > 0`.
- `listDir(process.cwd())` — real listing including `package.json` and `app`.
- `readFilePreview(.env.local)` — **refused** (secret file, contents not returned).
- `execShell({command:"whoami"})` — exit 0, real username.
- `execShell({command:"dir", flavor:"windows"})` after `cd` to the repo — real `ls -la` containing `package.json`.
- `sqliteQuery("SELECT name FROM sqlite_master…")` — real tables including `hub_events`.
- `sendMessage` / `listMessages` — AES-256-GCM ciphertext at rest in `local-data/messages`; plaintext only after decrypt.
- `writeNote` / `readNote` — real file under `local-data/obsidian-vault`.
- `lookupLeaks("adobe.com")` — live Have I Been Pwned **domain catalog**; every row sourced "Have I Been Pwned… (live)". The old hardcoded ExampleCloud / John Doe map was not used.
- `liveOsint("example.com")` — live DNS A/AAAA (and RDAP, crt.sh, HTTP/TLS in the same fan-out).
- `getThreats()` — live CISA KEV HTTP + Heimdall IDS + `/proc` deleted-binary anomalies. KEV rows are labelled "Catalog (not a host detection)".
- `getBeastWagon()` — `vehicleAttached: false`, label `HOST WAGON — live host telemetry (not a vehicle)`.
- `generateReport()` — markdown written under `local-data/reports/` from the live snapshot.

API: `GET|POST /api/live/<module>`. GET is unauthenticated (same pattern as `/api/offsec/tools`). Mutating POSTs use `requireHubAuth`; with `SECURE_MODE=1` they require `HUB_API_TOKEN`.

A second lab shell at `/api/lab/shell` (`lib/offsec/lab-exec.ts`, landed in `5f530d4`) runs allowlisted verbs (`whoami`, `ss`, `osqueryi` when installed, `tcpdump` snap, `nft-list`, …) via `child_process` argv arrays. That is the backend for `/linux-terminal`.

## New live backends (`lib/live/*`, commit `1f174da`)

| Module | API | Was | Now |
|---|---|---|---|
| Host snapshot | `/api/live/sys` | Hardcoded 32% CPU, 42.7 Mbps, 183 conns | `/proc`, `os`, `df`, `free`, `/proc/net/dev` deltas |
| Network / firewall | `/api/live/net` | Sample "FIREWALL ACTIVE" | Live `ss -tulpn`, `ip`, `nft`/`iptables` (honest if CAP_NET_ADMIN is missing) |
| Firewall logs | `/api/live/firewall-logs` | Button did nothing | Live `journalctl -k` or `dmesg -T` |
| Filesystem | `/api/live/fs` | Fake tree and dates | Real `fs.readdir` under the repo / `local-data` / optional evidence & vault roots. Secret names (`.env.local`, `*.pem`, keys) are listable but **not readable** |
| Shell | `/api/live/shell` | Canned `uname`/`ps`/`git`/`adb` and a mock FS | Real `bash -lc` in a cwd-jailed session with a deny-list. Windows flavor translates `dir`/`type`/`ipconfig`/`tasklist`/`netstat` and **executes** the translation on this Linux host — labelled as such, not a Windows VM |
| OSINT | `/api/live/osint` | Hardcoded "John Smith" / "Jane Doe" | Live DNS, RDAP, crt.sh, Shodan InternetDB, ip-api geo, GitHub public API, HTTP probe, TLS peer cert |
| Recon | `/api/live/recon` | `getMockResults()` invented `93.184.216.34` and "Nginx 1.18" | Same live OSINT fan-out; optional active nmap **only** against `isLabHost` |
| Leaks | `/api/live/leaks` | Hardcoded example.com / john.doe@gmail.com maps | Live HIBP `/breaches?domain=` (no key). Per-account: `HIBP_API_KEY` if set, else XposedOrNot. Never invents a hit |
| Threats | `/api/live/threats` | Canned T-7291 "Malware" from 2023 | Live CISA KEV + IDS + `/proc` anomalies |
| EDR | `/api/live/edr` | Licensed-EDR stand-in | **EDR backend: osquery (live)** when `osqueryi` is on PATH; otherwise **host procfs collector (live)** + SHA-256 file integrity. This host did **not** have osqueryi (apt mirror 500 / unsigned); the procfs collector ran and was labelled honestly |
| Messages | `/api/live/messages` | Sample "Agent Corvus" thread, nothing encrypted | AES-256-GCM file store (`local-data/messages`, key mode 0600 or `HUB_MESSAGES_KEY`) |
| Vault streams | `/api/live/db` | Mock `users`/`posts` UUIDs | Real SQLite at `local-data/vault-streams/hub.sqlite` via `scripts/live-sqlite.py`. Optional live `pg` when `POSTGRES_URL` is set (not set here — reported unconfigured, not faked) |
| Obsidian | `/api/live/obsidian` | Sample notes, save was a no-op | Real markdown vault at `OBSIDIAN_VAULT_PATH` or `local-data/obsidian-vault` |
| SIGINT | `/api/live/sigint` | Random / canned bands | Real `/proc/net/snmp`, Mbps deltas, optional 3s `tcpdump`, `iw` / `rtl_test` only if present. No RTL-SDR here — RF is **not** simulated |
| Reports | `/api/live/reports` | Five canned 2023 rows | Real files under `local-data/reports`; Generate writes a host report from the live snapshot |
| BeastWagon | `/api/live/beastwagon` | Vehicle telemetry simulator | Live host telemetry, **honestly labelled HOST WAGON**, `vehicleAttached: false`. GPSD is polled and reported missing when it is |
| Recruit | `/api/live/recruit` | Hardcoded "Alex Chen, Ph.D. MIT, OE 92" | Live GitHub public user search. OE scores are **not invented** (stay 0 / `unknown`) |

Client helper: `hooks/use-live.ts` (`liveGet` / `livePost` / `useLive`). Windows-syntax terminal: `components/CommandHub/modules/WindowsTerminal.tsx` posts to `/api/live/shell` with `flavor: "windows"`.

## Honest remaining limitations

1. **Apt could not install extra packages** (`deb.debian.org` InRelease 500 / unsigned). No `dig`/`whois` binaries (Node DNS + RDAP used instead), no `sqlite3` CLI (Python `sqlite3` used), no `osqueryi` (procfs EDR collector, labelled as such). Wazuh / Falco / Keycloak were not started (RAM + unsigned apt). Licensed tenants (CrowdStrike, Carbon Black, Okta, Salesforce, Zoom, WebEx, Slack enterprise) are not faked with JSON.
2. **BeastWagon 3D overlay** can still run its original motion loop; the **API** is live host telemetry and will not pretend a vehicle is attached.
3. **CCTV** — no physical camera on this host. No invented motion. A real RTSP/HTTP feed is required.
4. Some **page UIs** (sacred-hall field number, some SIGINT plots, conscious-terminal scripted replies, markdown-editor save button, BeastWagon 3D, ERD sample graph) may still plot their own sample numbers even though `/api/live/*` is live. They must be pointed at the API; this report does not claim those renderers were all switched and still present at push time. Concurrent work on this shared checkout was deleting and reverting files during the pass, so UI wires that were applied were in some cases wiped before they could be committed. The **backends and `/api/live` route are committed and verified**.
5. **Shell** is cwd-jailed and deny-listed on purpose; it is still a real `child_process`.
6. **HIBP per-email** needs `HIBP_API_KEY`. Without it, domain-catalog metadata and XposedOrNot are used, and the response says so.
7. **Postgres** is live only with `POSTGRES_URL`. SQLite is always live.
8. **Packet loss** is not invented; `/api/live/net` only reports it when a sample is taken (default: not taken).
9. Two Next.js dev servers sharing `.next` (ports 3000 and 3110) corrupted the dev cache during this run. HTTP 500s on `/api/live/health` in that window were compile-cache races. The Vitest run is the verification of record.
10. A concurrent commit on this branch (`5f530d4`, `7bf6db0`) deleted a large set of pages/modules ("strip theater"). The standing operator instruction is **do not remove features**. Restoring those files from `f32a24f` is the correct follow-through; this report does not endorse those deletions.

## Operator notes

- Consoles identify the operator as **S3v3n@SingularityDefense / SLDS**.
- Teaching / doc prose uses generic placeholders where it describes third-party setup.
- `local-data/` is gitignored (includes the messages key).
- Credit: Christian Wilford (s3v3n).
