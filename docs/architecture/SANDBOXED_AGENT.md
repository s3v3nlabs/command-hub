# Sandboxed Agent Architecture

**Status:** design + documented scaffolding. The privilege-separation *interface* and a reference
container profile ship in-repo; the out-of-process privileged daemon is **PLANNED** (not yet wired).
Today, privileged-ish work (ADB, ffmpeg, `which` probes) runs in the Next.js server process behind
`requireHubAuth` + the staged ladder. This doc describes where that work moves.

## Why not a ring-0 "god-mode" agent (the anti-CarbonBlack rationale)

Kernel-resident EDR/agents (ring 0) are the **highest-value target on a box**: compromise of the
agent = compromise of the host, and a single bad update can brick fleets. A hub that touches
attacker-supplied data (decoy payloads, recon results, camera streams) must assume that data is
hostile. So the design is the opposite of a kernel agent:

- **Thin web UI** — renders, never holds privilege, never trusted with raw capability.
- **Least-privilege local daemon** — holds the privileged work behind a narrow, typed RPC.
- **Per-operator isolation** — one container / VM / Linux namespace set per operator (pod).
- **No ambient authority** — every privileged call carries a scope id + attestation (staged ladder).

## Topology

```
 Browser (UI, untrusted)
     │  HTTPS + HUB_API_TOKEN
     ▼
 Next.js hub (app/api/*)  ── requireHubAuth · middleware headers · Heimdall IDS
     │  typed RPC over unix socket (lib/agent/privsep.ts interface)
     ▼
 hub-agentd (PLANNED)  ── dropped caps · seccomp · AppArmor · read-only rootfs
     │
     ├─ detonation sandbox (gVisor/Firecracker microVM, no network)
     ├─ ADB / scrcpy broker (USB passthrough to THIS pod only)
     └─ ffmpeg transcode worker (egress allowlist = scope targets)
```

## Pod self-containment boundary

Each operator pod is the blast-radius unit (mirrors `hive-lab-sim` findings: linked pods must not
share ambient trust). A compromise inside a pod's detonation VM must not reach:
the hub process, other pods, or the host. Updates crossing the boundary are **signed + verified**.

## Container hardening (reference: `deploy/sandbox/`)

- `cap_drop: [ALL]`, add back only what a worker needs (none for detonation).
- `security_opt: no-new-privileges:true`, seccomp profile (`deploy/sandbox/seccomp-detonation.json`),
  AppArmor profile sketch (`deploy/sandbox/apparmor-hub-agent`).
- `read_only: true` rootfs, `tmpfs` scratch, non-root UID, `network_mode: none` for detonation.
- Resource limits (pids, memory, cpu) to bound fork bombs / miners.

## Signed + verified updates

Planned: release artifacts signed (minisign / sigstore cosign); agentd refuses unsigned updates;
public key pinned in config. No auto-update from the UI.

## What is wired vs planned

| Piece | State |
|-------|-------|
| `lib/agent/privsep.ts` typed interface + in-process fallback | **wired** (fallback refuses detonation) |
| `deploy/sandbox/docker-compose.yml` reference | **provided** (operator runs it) |
| seccomp / AppArmor sketches | **provided** (review before use) |
| `hub-agentd` daemon over unix socket | **planned** |
| Detonation microVM | **planned** — capture/quarantine is real today; detonation is refused on-host |
| Signed update verification | **planned** |
