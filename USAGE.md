# Usage

Authorized, lawful use only — see [LEGAL.md](./LEGAL.md). Written authorization required before testing systems you do not own.

## Quick tour

| Area | Route | Notes |
|------|-------|-------|
| Home / modules | `/` | Module tiles; honest SIMULATED banners where sample data remains |
| SignalFrame | `/signalframe` | Ghostnode mil-tech window manager |
| OffSec Arsenal | `/offsec` | Kill-chain + CTF catalog, command builders, local `which` detection |
| OSINT | `/offsec/osint` | Framework tree, dork builder, lookup launchers |
| Entity graph | `/offsec/graph` | Maltego-style investigative graph (our aesthetic) |
| Toolkit | `/offsec/toolkit` | CyberChef-style transforms + hash-ID (client-side) |
| Privacy | `/offsec/privacy` | Proton / proxy / messaging config panels |
| Engagements | `/offsec/engagements` | Scope / RoE / findings (file-backed) |
| Hardware & RF | `/offsec/hardware` | BT, CAN, USB/Ducky+BadUSB, LAN, Shodan+Censys, VoIP, SDR, Flipper |
| Phone Suite | `/offsec/phone` | scrcpy + ADB for **your** device; interception = WIP shell |
| Android Lab | `/offsec/android-lab` | Disposable local AVDs + adb for mobile-app QA/security testing |
| Threat Field | `/offsec/threat-field` | Nash + Fourier + Monte-Carlo model field (3D/2D) |
| CCTV wall | `/intelligence/cctv` | Multi-feed wall + per-tile recon metadata |
| Dev Operator | `/dev-operator` | Defensive coding assistant (HOLD_VYRNA_UNSYNC) |
| Compute / AI Pool | `/compute` | Multi-backend router, job queue, warm-pool; honest perf surface |
| Ghostlight Vault | `/vault` | Search a local ChatGPT export. MCP + REST for GPT and other AI nodes. See [docs/GHOSTLIGHT_VAULT.md](docs/GHOSTLIGHT_VAULT.md). |
| Help | `/help` | In-hub docs index |
| Termux companion | `companions/termux` (phone client @ `:8788`) | Talks to a remote hub; not a phone-hosted Next.js build |
| Device Bridge PWA | `/companion` · `/companion/bridge` · `/companion/hub-view` | Phone ↔ hub WebRTC cam/mic + telemetry; install to home screen |
| WIP Lab | `/offsec/lab` | Honest non-functional shells |

Command builders only **render text** for you to copy into your own authorized terminal. The hub does not auto-run exploits.





## Termux phone companion

The full hub is a Next.js 15 app and is **not** a good Termux install. A light Python companion client lives at [`companions/termux/`](./companions/termux/README.md):

```bash
pkg install python git -y
git clone https://github.com/s3v3nlabs/command-hub.git
cd command-hub/companions/termux
bash install.sh && bash start.sh
# open http://127.0.0.1:8788 and point Setup at the remote hub
```

It pings `/api/modules`, `/api/audit/timeline`, and `/api/offsec/attack-navigator`, offers workspace-preset chips as a local filter, deep-links into the remote hub, can soft-check / redeem a Black Aurora invite, and can send a SignalFrame presence heartbeat. It does not run Ghidra, the Android Lab, Docker, or the Next.js suite on the phone. The hub host must bind a reachable interface (`npx next start -H 0.0.0.0 -p 3100`).

## Device Bridge (hub-served PWA)

The recommended phone sensor path. Served by the hub at `/companion` (installable PWA) so the phone can **Add to Home Screen** and stream its own camera, mic, and telemetry to `/companion/hub-view`. Live sessions also appear as a strip on the [CCTV wall](/intelligence/cctv) — they link to the hub seat rather than opening a second WebRTC peer (the bridge is 1:1).

**Install.** Open `https://<hub-host>/companion` on the phone (HTTPS required for `getUserMedia`; `http://localhost` is fine for lab). Android Chrome: menu → Add to Home Screen. iOS Safari: Share → Add to Home Screen.

**Pair.** Set `HUB_API_TOKEN` (and `SECURE_MODE=1` on a shared host). Paste the same token into the Pair field, label the device, create a session. The page stores a short-lived session **ticket** (not the hub token) for SSE signaling. On the desktop, open `/companion/hub-view`, authorize, and take the seat. Then start the bodycam on the phone.

**Honest limits.** No TURN server (same LAN / Tailscale usually works; symmetric NAT will fail). Signaling is SSE+POST in a single Node process. Safe remote actions only (presence heartbeat, in-hub module prompt — the phone will not auto-navigate and drop the call). This is your device talking to your hub, behind the browser's own permission prompts. Full write-up: [docs/COMPANION_BRIDGE.md](./docs/COMPANION_BRIDGE.md).

## Compute / AI Acceleration

The hub does **not** invent fake speedups. `/compute` pools real inference backends (local Ollama, RunPod, OpenAI-compatible URLs) with health checks, least-loaded / cost-aware / speculative routing, a bounded job queue (TypeScript async + `worker_threads` — not Kotlin coroutines), warm-pool, and a circuit breaker that sheds to healthy peers.

Quantization, GPU offload, KV-cache, and continuous batching are **model-server** settings — documented on the page, not pretended as hub toggles. There is no "virtualized RAM into extra compute." Tiered memory = [DIMM Drive](./docs/DIMM_DRIVE.md) + picking a model that fits. Full write-up: [docs/COMPUTE.md](./docs/COMPUTE.md).

## Staged-ladder authorization (the gating standard)

Every capability that can touch a third-party target or carries legal risk uses the **same three-stage ladder**. Capability is never removed — it ships safe and unlocks only with real authorization.

| Stage | What | How |
|-------|------|-----|
| **1 — Locked** | Capability ships present but OFF by default | A per-feature env flag (e.g. `CCTV_CONNECT_ENABLED`, `ADB_SHELL_ENABLED`, `RECON_ACTIVE_ENABLED`, `DECEPTION_VT_SUBMIT_ENABLED`) on an authorized host |
| **2 — Scoped** | Operator creates + **activates** an engagement scope | `POST /api/offsec/scope` with `client`, `authorizationRef` (SOW/ROE), `authorizedTargets[]`, `operatorIdentity`, `startsAt`/`endsAt`; then `action: "activate"`. Capability unlocks only for targets in an active, in-window scope |
| **3 — Attested** | Per-action confirm + attestation | Pass `scopeId` + `attestation: "authorized under scope <id>"` on the action call. Every attempt (allowed or denied) is written to a hash-chained audit log |

- **Scopes:** `lib/offsec/scope-ladder.ts` → `data/offsec/scopes.json` (gitignored)
- **Audit log:** `local-data/scope-audit/audit.jsonl` (gitignored, sha256 hash chain), readable via `GET /api/offsec/scope?audit=1`
- **Enforcement helper:** `enforceLadder({ capability, scopeId, target, attestation, stage1Enabled, operator })` — returns blocked + stage + reason and audits the attempt.

Field operators edit the Stage-1 flags in `.env.local` and manage scopes per-engagement — no code changes needed.

**Cannot be made lawful by attestation (honest WIP shells only, never faked working):** live interception/recording of or third-party audio injection into calls the operator is not a party to (wiretapping); generating/distributing live self-propagating malware. The operator's OWN device (ADB / mirroring / call-log / recording) stays fully real.


## Android Lab (mobile app security testing)

Route: `/offsec/android-lab` · API: `/api/offsec/android-lab`.

A real Android Virtual Device manager in the hub: create / start / stop / delete AVDs, drive them over `adb` (shell, install/uninstall APK, push/pull, logcat, screencap, port-forward), and run an app assessment (inventory, static `dumpsys`/`aapt` info, traffic-capture hooks) against the currently selected emulator. The in-browser live view is an `adb screencap` stream; optional `scrcpy` opens a host-desktop window.

**These tools must only be used on devices and apps you own or are authorized to test.** See [LEGAL.md](./LEGAL.md). This module is built for disposable *local* emulators. Pointing it at a real external device requires the staged authorization model above.

### Host setup

If the Android SDK is not installed, the UI shows an honest **SDK not installed** state and exact install guidance — it will not fabricate a device or fake `adb` output.

1. Set in `.env.local` (optional; well-known paths are also probed):
   ```
   ANDROID_SDK_ROOT=$HOME/Android/Sdk
   ANDROID_AVD_HOME=$HOME/.android/avd
   ANDROID_LAB_WORKSPACE=   # optional override; default data/offsec/android-lab
   ```
2. Install official command-line tools, then:
   ```
   sdkmanager --sdk_root="$ANDROID_SDK_ROOT" --licenses
   sdkmanager --sdk_root="$ANDROID_SDK_ROOT" platform-tools emulator "cmdline-tools;latest" "system-images;android-34;google_apis;x86_64"
   ```
   Debian/Ubuntu supplements: `sudo apt-get install -y adb qemu-kvm unzip` and `sudo usermod -aG kvm "$USER"` so `/dev/kvm` is writable.
3. In `SECURE_MODE=1`, pass `HUB_API_TOKEN` in the lab panel. Interactive shell additionally requires `ADB_SHELL_ENABLED=1` (same gate as `/api/adb/*/shell`).
4. Drop APKs you own into `data/offsec/android-lab/apks/` (gitignored) to install them onto a selected AVD.

Implementation notes: every server-side command uses an argument array (no shell interpolation). AVD names, serials, package names, ports, and paths are allowlisted in `lib/offsec/android-lab/validate.ts`. SDK/tool detection (`lib/offsec/android-lab/sdk.ts`) is server-side and takes no client input.

## Shodan + Censys

1. Set `SHODAN_API_KEY` and/or `CENSYS_API_ID` + `CENSYS_API_SECRET` in `.env.local` (server-only).
2. Open **Hardware & RF → Shodan + Censys**.
3. In `SECURE_MODE=1`, pass your `HUB_API_TOKEN` in the panel.
4. Private / loopback / link-local / metadata IPs are blocked (SSRF guard).

## CCTV video wall

Route: `/intelligence/cctv`.

1. Acknowledge the legal banner (first use).
2. Create a layout (file-backed under `data/cctv/`, optionally bound to an engagement id).
3. Add tiles via URL / vendor pattern, or `POST /api/cctv/layouts` with `action: "add_from_recon"` and a Shodan/Censys host object — **metadata hydrates automatically**.
4. Each tile shows a compact intel block beside the view (network / device / exposure) with **Full detail** for geo, engagement binding, authorization status, stream URLs, CVEs, and operator notes.
5. **Staged unlock:** metadata display works while locked. Connecting / ffmpeg transcode of third-party targets requires:
   - `CCTV_CONNECT_ENABLED=1`
   - hub auth (`HUB_API_TOKEN` when `SECURE_MODE=1`)
   - per-tile `authorizationStatus` of `confirmed` or `in-scope`

### Where the metadata model lives

- **Types:** `lib/cctv/types.ts` — `CctvTileMeta` with `network`, `geo`, `device`, `exposure`, `engagement`, `notes`
- **Recon hydration:** `lib/cctv/recon-import.ts` — `fromShodan`, `fromCensys`, `fromUrl`
- **Vendor URL patterns:** `lib/cctv/vendors.ts`
- **Persistence:** `lib/cctv/store.ts` → `data/cctv/layouts.json` (gitignored)
- **APIs:** `/api/cctv/layouts`, `/api/cctv/transcode`

No real camera IPs or credentials are shipped in the repo.

## Threat Field

Open `/offsec/threat-field`. Recompute with a seed/trial count. Outputs are **modeled** (Nash mixed strategies, Fourier peaks, Monte-Carlo zone probabilities). Language stays preferred / estimated / modeled — never guaranteed / lock / certain.


## Deception Mesh

Route: `/offsec/deception`. Emulated USB/serial/service/route decoys, canary tokens, malware capture + quarantine, attacker fingerprinting. Every event hits Heimdall IDS and the eyes-only encrypted log.

- **Emulation honesty:** we emulate the *interface surface* BadUSB-style tooling finds attractive. We do not expose a real host USB stack.
- **Capture:** `POST /api/offsec/deception/capture` → sha256 + quarantine under `local-data/deception-quarantine/` (never executed). Detonation must run in the F1 sandbox, not on the host.
- **VirusTotal:** set `VT_API_KEY`. Hash lookup is free; sample *upload* is Stage-1 gated (`DECEPTION_VT_SUBMIT_ENABLED`) + Stage-2/3 ladder (can tip off an attacker).
- **Eyes-only logs:** set `HEIMDALL_LOG_KEY` (AES-256-GCM). Only a caller presenting `HEIMDALL_SUBSYSTEM_TOKEN` (or the log key) may decrypt. The glyph/symbol/"EchoNexus" skin is **cosmetic only** — it provides no security.
- **Vault keys:** see [docs/VAULT_KEYS.md](./docs/VAULT_KEYS.md).
- **Sandbox architecture:** [docs/architecture/SANDBOXED_AGENT.md](./docs/architecture/SANDBOXED_AGENT.md).

## Reverse Engineering Workbench

Route: `/offsec/reverse-engineering` · API: `/api/offsec/reverse-engineering/*` · libs: `lib/offsec/re-workbench/*` · Ghidra script: `scripts/ghidra/HubExportEvidence.java`.

Static analysis of binaries, APKs and firmware **you own or are explicitly authorized to analyze** (your own software, engagement-scoped targets, malware samples you captured for defense). Design follows [REA — Reverse Engineer Anything](https://github.com/morluto/rea) (MIT): **evidence over answers** and **one provider per session**.

### Engines

| Engine | How the hub uses it | Install |
|---|---|---|
| **REA** (preferred) | Hub is an **MCP client**. REA's native transport is stdio, so the hub spawns `REA_MCP_COMMAND` (no shell) and keeps one long-lived session; `REA_MCP_URL` is supported for a Streamable-HTTP bridge. Verified against `rea-agents` 6.8.0 (229 tools). | Node 22.23.4+/24.22.1+, then `npm install -g rea-agents` and set `REA_MCP_COMMAND="rea mcp"` (or `npx -y rea-agents@6.8.0 mcp`). REA's native analysis needs a provider (Ghidra via `GHIDRA_INSTALL_DIR` + `JAVA_HOME`, or IDA / Hopper / Kuna). **REA 6.8.0 accepts Ghidra 12.1.x only (verified 12.1.4)** — check with `rea doctor --json`. Pin it per session with the *provider_id* field (or `REA_ANALYSIS_PROVIDER=ghidra`). |
| **radare2** | Headless, `-N` (no rc files), `cfg.sandbox=true` (no `!` shell escapes / writes / network, confined to the target's own dir), read-only open, never `-d`. Pseudocode is r2 `pdc` (labelled as a naive pseudo-C, not a decompiler). | `sudo apt install radare2` or the `.deb` from github.com/radareorg/radare2/releases; or `RADARE2_BIN=/abs/path`. |
| **Ghidra** (direct) | `analyzeHeadless` + the bundled read-only export script into a throw-away project (deleted after each run). Real decompiler output. | Download Ghidra, install the JDK it requires (Ghidra 12.2 → **JDK 25**; see `Ghidra/application.properties` `application.java.min`), set `GHIDRA_INSTALL_DIR` **and** `JAVA_HOME` in the hub's environment. |

Missing engines are shown as **"analysis engine not installed"** / **"REA MCP server not configured"** with install steps. The workbench never fabricates disassembly, pseudocode or tool capabilities — failures come back as `kind: "error"` evidence records.

### Configure (`.env.local`, values never committed)

```bash
REA_MCP_COMMAND="rea mcp"          # or REA_MCP_URL=http://127.0.0.1:<port>/mcp
GHIDRA_INSTALL_DIR=/opt/ghidra_12.2_PUBLIC
JAVA_HOME=/opt/jdk-25
RADARE2_BIN=                        # optional; PATH is probed
RE_R2_ANALYSIS=aa                   # aa | aaa | aaaa
RE_MAX_UPLOAD_MB=256
RE_DYNAMIC_ENABLED=                 # Stage-1 for dynamic REA tools; leave empty on daily drivers
```

Restart the hub, open the page, press **Probe REA** to handshake.

### Use it

1. **Target** — upload a file (stored by sha256 under `local-data/re-workbench/targets/`, mode `0600`, never executed) or pick a sample already captured by the Deception Mesh quarantine (`local-data/deception-quarantine/`, read in place).
2. **Bind session** — choose REA / radare2 / Ghidra. The engine is bound to that target; asking for another engine is refused until you explicitly **rebind** (never silently swapped). Binding REA calls `open_binary`.
3. **Operations** — Overview, Functions, Strings, Symbols, Imports, and for a function name / `0x` address: Assembly, Pseudocode, Xrefs. Clicking a function opens its pseudocode. Ghidra rebases images (e.g. `0x100000`), so use addresses from the same engine's Functions list.
4. **Evidence panel** — each record shows `provider`, exact `source` command/tool, `limitations`, truncation, and is flagged **untrusted** (content comes from the analyzed file). Results are cached by target sha256 + engine + op.
5. **AI assist** — tick evidence records and ask a question. Uses only the local model (`LOCAL_LLM_BASE_URL` / `OLLAMA_BASE_URL` / `LOCAL_LLM_MODEL`); cites evidence ids, separates observed vs inferred, lists unknowns. Dev Operator posture: `HOLD_VYRNA_UNSYNC`, explains and annotates only — requests for exploits, payloads or EDR/AV evasion are declined.
6. **REA tool console** — lists REA's live catalog, each tagged `static` or `dynamic`. A curated read-only allowlist runs directly; **everything else is dynamic** (Frida, gdb, ADB, capture/observe, extraction, annotation) and requires the staged ladder: Stage 1 `RE_DYNAMIC_ENABLED=1`, Stage 2 an active engagement scope whose `authorizedTargets` contains `sha256:<target hash>`, Stage 3 attestation `authorized under scope <id>`. Every attempt is hash-chain audit-logged (`local-data/scope-audit/`). Absolute paths in tool args must stay inside the sandboxed analysis area.

### Malware-analysis safety

- Treat every sample as live. Keep suspicious files in `local-data/re-workbench/targets/` or `local-data/deception-quarantine/`; the hub stores them non-executable and only analyzes them statically.
- **Never execute live malware on the hub host.** Dynamic analysis belongs in an isolated, disposable VM/sandbox (see [docs/architecture/SANDBOXED_AGENT.md](./docs/architecture/SANDBOXED_AGENT.md)) with networking controlled — that is what the Stage-1 switch is for.
- Engine output (strings, symbol names, pseudocode) is attacker-controlled text: never paste it into a shell.

### Legal

Only analyze software you own, have written authorization to test, or samples you lawfully hold for defensive research. Respect EULAs / anti-reversing clauses and local law (e.g. DMCA §1201 interoperability/security-research exemptions in the US, EU Software Directive Art. 6). The workbench is for understanding, auditing and defending — not for cracking licenses or building exploits against third parties.

## Dev Operator

See the **Dev Operator** section below (Workstream E) once wired; route `/dev-operator`. Defensive-mode only (`lattice_sync: false`, no exploit generation).

## Secrets

Never commit `.env*`, keys, tokens, vaults, or `data/` / `local-data/` contents. Password store: **Bitwarden**. Public repo must stay gitleaks-clean (`.gitleaks.toml`).

## Dev Operator

Route: `/dev-operator` · API: `/api/dev-operator` · libs: `lib/dev-operator/*`, `lib/train/*`, `lib/sigma-lane/*`, panel via `lib/selfHealing/S3v3nPanel.ts`, twin via `lib/ai/operator-twin.ts`.

**Mode:** defensive only. `HOLD_VYRNA_UNSYNC` · `lattice_sync: false`. No exploit generation.

### What it does

- Chat as a senior defensive engineer for **this** hub: module stubs, patch proposals, hive status, learn/adapt loop.
- Actions: `create_module_stub`, `propose_patch`, `hive_status`, `open_module_bay`, `save_pref`, plus `correction` / `learn` notes.
- Aware of OffSec suites, Hardware/RF, Phone, Threat Field, CCTV wall, Help — see `lib/modules/registry.ts` (`listModules({ includeDevOnly: true })`) and `lib/dev-operator/system-prompt.ts`.

### How to talk to it

Open `/dev-operator`, type naturally ("stub a module for X", "propose a patch to harden Y"). Prefer concrete routes/files. Use **correction** when it drifts so the learn loop stores a note.

### Backend status indicator

The page shows which backend is live:

| Indicator | Meaning |
|-----------|---------|
| `model-connected` | Local LLM (Ollama / OpenAI-compatible) reachable and/or Venice key present — full answers |
| `panel / twin-rag` | No live model; panel + twin index / lessons — partial answers |
| `sigma-lane only` | Thin fallback — actions still work, chat replies are short |

### Wire a local model (full answers)

```bash
# .env.local — never commit values
LOCAL_LLM_BASE_URL=http://127.0.0.1:11434   # or OLLAMA_BASE_URL
LOCAL_LLM_MODEL=llama3.2                    # or OLLAMA_OPS_MODEL
# optional cloud seat (server-side only):
# VENICE_API_KEY=...
# VENICE_API_URL=https://api.venice.ai/api/v1
# VENICE_OPS_MODEL=llama-3.3-70b
```

1. Install and run [Ollama](https://ollama.com/) (or another OpenAI-compatible local server).
2. `ollama pull llama3.2` (or your chosen model).
3. Set the env vars above; restart the hub.
4. Confirm the Backend strip on `/dev-operator` shows **model-connected**.

Without a model, the operator still creates stubs/patches via actions; chat stays honestly thin.

## Updating & Upgrading

Keep the hub current without losing local data. All commands are copy-paste runnable
from the repo root.

### 1. Upgrade the hub (git flow)

```bash
# see what changed before pulling
git fetch origin
git log --oneline HEAD..origin/main        # review incoming commits

# pull the latest
git pull origin main

# pick up dependency/lockfile changes, then rebuild
npm install
npm run typecheck                           # must be 0 errors
npm run build                               # production build
# restart your process manager, or:
npm start                                   # next start (prod)
```

> `data/` and `local-data/` (engagements, CCTV layouts, IDS history, marketplace
> install state, Heimdall eyes-only logs) are local-only and are **not** touched by
> `git pull`. Back them up separately if you care about them.

### 2. Migration / build steps between versions

```bash
# after any pull that changed deps or schemas:
npm install
npm run build
npm test                                    # vitest — confirm libs still green
```

- Read `docs/DEPENDENCY_NOTES.md` before force-bumping majors (kepler / maplibre / shadcn).
- File-backed stores self-heal (missing files are recreated); no DB migration is required
  for the local-first stores.

### 3. Update an individual module via the Marketplace

Modules are distributed through a **signed** index (`public/registry/modules.json`).
To update one module (version bump + re-verify signature):

```bash
# 1. bump the module's "version" in its manifest (public/registry/modules.json
#    or modules/<id>/module.json), update its description/route as needed

# 2. re-sign the index (or an individual manifest) with your operator key
node scripts/sign-registry.mjs                                   # signs public/registry/modules.json
#   or: node scripts/sign-registry.mjs modules/<id>/module.json

# 3. VERIFY before trusting/enabling
node scripts/verify-registry.mjs                                 # -> "VERIFIED" (exit 0) or non-zero
#   or: node scripts/verify-registry.mjs modules/<id>/module.json
```

In the UI (`/marketplace`): the banner shows **VERIFIED** / **UNVERIFIED** / **INVALID**.
Only enable a module when the index verifies. Then use Install → Enable/Disable per module.
Point the hub at a hosted index later with `REGISTRY_INDEX_URL` (empty = bundled repo index).

First-time key setup (operator does this once):

```bash
node scripts/sign-registry.mjs --genkey
# private key -> local-data/registry-signing-key.pem  (gitignored, NEVER commit)
# public  key -> public/registry/registry.pub         (commit this trust anchor)
# or set env REGISTRY_PUBLIC_KEY to a PEM SPKI public key to override the bundled anchor
```

### 4. Env-var changes between versions

```bash
# compare your live env to the template for NEW variable NAMES (never commit values)
diff <(grep -oE '^[A-Z_]+=' .env.local | sort) <(grep -oE '^[A-Z_]+=' .env.example | sort)
```

New/relevant env vars introduced by the platform build:

- `REGISTRY_INDEX_URL` — hosted marketplace index URL (empty → bundled repo manifest).
- `REGISTRY_PUBLIC_KEY` — PEM ed25519 verify key override (else `public/registry/registry.pub`).
- `HUB_API_TOKEN` — when set, required (Bearer) for mutating API routes.
- `HEIMDALL_LOG_KEY` / `HEIMDALL_SUBSYSTEM_TOKEN` — eyes-only log encryption + read access.

Add any new names to `.env.local` with your own values, then restart the hub.

### 5. Rollback

```bash
git log --oneline -15                        # find the last good commit
git checkout -b rollback <good-commit-sha>   # inspect on a branch (non-destructive)
# verify it builds:
npm install && npm run build
# to make it live on main (only if you own the remote and have confirmed):
#   git checkout main && git reset --hard <good-commit-sha>   # DESTRUCTIVE — overwrites main
#   (force-push requires explicit confirmation; prefer a revert commit instead:)
git revert <bad-commit-sha>                  # safe, keeps history
```

Your local `data/` and `local-data/` are unaffected by a code rollback.


## Black Aurora Labs — Invite Portal

Monochrome classified-terminal portal for **invite-only access packaging**.

Routes: `/black-aurora` → `/black-aurora/verify` → `/black-aurora/drop/[code]` → `/black-aurora/access/[code]`. Admin: `/black-aurora/admin`.

### Honesty (read this)

- A **public** GitHub repo **cannot** be locked behind a code for `git clone`. Anyone can clone it.
- Black Aurora gates a **server-side bundle/tarball** after a valid invite is redeemed (`BLACK_AURORA_MODE=bundle`, default).
- For true clone-gating: make the GitHub repo **private** and set `BLACK_AURORA_MODE=github-private` (documented path — no live GitHub token minting). Hand out collaborator invites / fine-grained PATs out-of-band.
- SecureFrame anti-screenshot / destroy-on-blur is a **UX deterrent only**. Real controls: single-use tokens, server expiry/revoke, `Cache-Control: no-store`.

### Operator: mint a code

1. Set `HUB_API_TOKEN` (and ideally `SECURE_MODE=1`) in `.env.local`.
2. Open `/black-aurora/admin`, paste the token, fill recipient label (e.g. `zerocipher/Jerry`) + optional instructions / expiry / max-uses.
3. **GENERATE CODE** → copy the invite message (code + drop URL).
4. Send that to the tester. Revoke anytime from the same page.

API equivalent:

```bash
curl -s -X POST http://127.0.0.1:3100/api/black-aurora/invites \
  -H "Authorization: Bearer $HUB_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"create","label":"zerocipher/Jerry","expiresInHours":168,"maxUses":1}'
```

### Tester: verify + download

1. Open the drop URL (`/black-aurora/drop/<CODE>`) or enter the code at `/black-aurora/verify`.
2. Click **UNLOCK INSTALL PACKAGE** (this **redeems** one use and issues a 30-minute download grant).
3. On the access page: read instructions, then **DOWNLOAD GIT BUNDLE** (or tarball).
4. Locally:

```bash
git clone command-hub-*.bundle command-hub
# or: tar -xzf command-hub-*.tar.gz
cd command-hub
cp .env.example .env.local
npm install && npm run build
# see INSTALL.md / UPDATING.md
```

### Revoke

Admin UI → REVOKE, or:

```bash
curl -s -X POST http://127.0.0.1:3100/api/black-aurora/invites \
  -H "Authorization: Bearer $HUB_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"revoke","code":"XXXXXXXX"}'
```

### Env

- `BLACK_AURORA_MODE` — `bundle` (default) | `github-private`
- Reuses `HUB_API_TOKEN` / `SECURE_MODE` for admin APIs

Invites: `data/black-aurora/invites.json` (gitignored). Bundles: `local-data/black-aurora/bundles/` (gitignored). More: `docs/black-aurora/README.md`.
