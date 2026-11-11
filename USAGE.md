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
| Threat Field | `/offsec/threat-field` | Nash + Fourier + Monte-Carlo model field (3D/2D) |
| CCTV wall | `/intelligence/cctv` | Multi-feed wall + per-tile recon metadata |
| Dev Operator | `/dev-operator` | Defensive coding assistant (HOLD_VYRNA_UNSYNC) |
| Help | `/help` | In-hub docs index |
| WIP Lab | `/offsec/lab` | Honest non-functional shells |

Command builders only **render text** for you to copy into your own authorized terminal. The hub does not auto-run exploits.


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
