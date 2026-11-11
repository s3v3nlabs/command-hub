# Vault / secrets for the deception + Heimdall subsystems

All keys are read from the environment (or an external keystore you inject into the environment).
**Nothing is committed.** `.env.example` lists only empty var NAMES. Password store: Bitwarden.

| Key | Used by | Notes |
|-----|---------|-------|
| `HEIMDALL_LOG_KEY` | `lib/heimdall/eyes-only.ts` | AES-256-GCM key for eyes-only logs. 32-byte hex/base64, or any passphrase (scrypt-derived). |
| `HEIMDALL_SUBSYSTEM_TOKEN` | eyes-only read gate | Only a caller presenting this may decrypt. Falls back to `HEIMDALL_LOG_KEY`. |
| `VT_API_KEY` | `lib/offsec/deception/vt.ts` | VirusTotal. Hash lookup is low-risk; sample upload is opt-in + ladder-gated. |
| `HUB_API_TOKEN` | all gated APIs | Bearer / `X-Hub-Token`. |
| `AGENT_SOCKET_PATH` | `lib/agent/privsep.ts` | Planned privsep daemon socket; unset = in-process fallback. |

## Keystore patterns (reuse existing hub conventions)

- Local dev: `.env.local` (gitignored).
- Shared host: inject via your process manager / container secrets (Docker/compose `env_file`, systemd `EnvironmentFile`, k8s Secret). See `deploy/sandbox/docker-compose.yml`.
- The hub never logs secret values (see `lib/privacy/antiTelemetry`). `lib/config/hub-config.ts` emits empty strings when unset — no placeholder secrets.

## Rotating the Heimdall log key

Rotating `HEIMDALL_LOG_KEY` makes prior sealed records undecryptable (by design — forward-secrecy-ish
for eyes-only history). Export/transcribe anything you need before rotating.
