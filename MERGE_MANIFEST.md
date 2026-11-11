# Merge Manifest — Singular/ty Defense Solutions Command Center

Business UI pack union of authorized v0 User Interface source versions.
Live reclaim UI at `/workspace/vercel-v0/projects/v0-user-interface/latest` was **not** modified.

## Version sources (ordinals)

| Ordinal | Label | sourceVersionKey | blockId | Files in snapshot |
|--------:|-------|------------------|---------|------------------:|
| 315 | v315 | `v_1_e69hp` | `b_MBGyxEEbvPA` | 334 |
| 317 | v317 | `v_1_u4xy9` | `b_mlHU8fYrWz4` | 334 |
| 334 | v334 | `v_1_qz1iq` | `b_mIIUndLY1t4` | 349 |
| 335 | v335 | `v_1_i5tsj` | `b_bF2mdwbDuZh` | 350 |
| 381 | latest/v381 | `v_1_v3bgt_s3` | `b_LppD5xft8gc` | 334 |

Gap-fill also drew from `source-versions/merged` and the read-only live `latest/` tree (source files only; never written back).

## Merge policy

- Precedence: **315 < 317 < 334 < 335 < merged-gapfill < 381 (newest wins on content conflicts)**.
- Secret-bearing env files scrubbed to key names; `.env.local` excluded from the pack.
- `node_modules/` / `.next/` are local-only (gitignored); not part of the GitHub tarball contents intent.

## Results

- **Final source files** (excl. node_modules/.next): **525**
- **`app/**/page.tsx` count**: **57**
- **signalframe file count** (`*signalframe*`): **18**
- Required areas present: {
  "components/signalframe": true,
  "lib/signalframe": true,
  "app/signalframe": true,
  "frames": true,
  "components/CommandHub": true,
  "modules": true,
  "systems": true,
  "heimdal": true,
  "vault": true,
  "recovery": true,
  "branding_logo": true
}

## signalframe inventory

- `app/signalframe/page.tsx`
- `components/signalframe/control-panel.tsx`
- `components/signalframe/enhanced-frame-window.tsx`
- `components/signalframe/frame-icons.tsx`
- `components/signalframe/frame-input.tsx`
- `components/signalframe/frame-metadata.tsx`
- `components/signalframe/frame-tabs.tsx`
- `components/signalframe/frame-template-menu.tsx`
- `components/signalframe/frame-toolbar.tsx`
- `components/signalframe/frame-window.tsx`
- `components/signalframe/message-bubble.tsx`
- `components/signalframe/shadow-relay.tsx`
- `components/signalframe/signal-frame-workspace.tsx`
- `lib/consciousness/signalframe-flow-engine.ts`
- `lib/signalframe-bridge.ts`
- `lib/signalframe-markdown.ts`
- `lib/signalframe/consciousness-bridge.ts`
- `types/signalframe.ts`

## Pages (57)

- `app/ai-autonomy-tests/page.tsx`
- `app/ai-hub/page.tsx`
- `app/beastwagon/page.tsx`
- `app/command-hub/page.tsx`
- `app/command-prompt/page.tsx`
- `app/conscious-terminal/page.tsx`
- `app/dashboard/page.tsx`
- `app/database-health/page.tsx`
- `app/database-setup/page.tsx`
- `app/evidence-explorer/page.tsx`
- `app/file-browser/page.tsx`
- `app/file-explorer/page.tsx`
- `app/forecast-engine/page.tsx`
- `app/graphene-bridge/page.tsx`
- `app/harmonic-calibration/page.tsx`
- `app/heimdal-terminal/page.tsx`
- `app/hub/page.tsx`
- `app/integration-tests/page.tsx`
- `app/intelligence/cctv/page.tsx`
- `app/intelligence/erd/page.tsx`
- `app/intelligence/hunter/page.tsx`
- `app/intelligence/kepler/page.tsx`
- `app/intelligence/map/page.tsx`
- `app/intelligence/messages/page.tsx`
- `app/intelligence/osint/page.tsx`
- `app/intelligence/page.tsx`
- `app/intelligence/recruit/page.tsx`
- `app/intelligence/recruitment/page.tsx`
- `app/intelligence/secure/page.tsx`
- `app/intelligence/shodan/page.tsx`
- `app/intelligence/sigint/page.tsx`
- `app/intelligence/signal/page.tsx`
- `app/intelligence/threat-intel/page.tsx`
- `app/intelligence/vault-streams/page.tsx`
- `app/json-manager/page.tsx`
- `app/legacy-modules/page.tsx`
- `app/linux-terminal/page.tsx`
- `app/markdown-editor/page.tsx`
- `app/network-security/page.tsx`
- `app/obsidian-vault/page.tsx`
- `app/page.tsx`
- `app/phone-suite/page.tsx`
- `app/recon/page.tsx`
- `app/reports/page.tsx`
- `app/sacred-hall/page.tsx`
- `app/self-healing/page.tsx`
- `app/settings/page.tsx`
- `app/setup-guide/page.tsx`
- `app/signalframe/page.tsx`
- `app/system-config/page.tsx`
- `app/terminal-dashboard/page.tsx`
- `app/terminal/page.tsx`
- `app/test-harness/page.tsx`
- `app/threat-analysis/page.tsx`
- `app/v0-bridge-terminal/page.tsx`
- `app/visualizations/page.tsx`
- `app/windows-terminal/page.tsx`

## Gaps vs source versions

Missing pages from any source ordinal: 0
_None — all source version pages are present._

### Mid-era (v334/v335) paths not in v381 reconstruct — presence in union

- `OK` `boot/echo.lockphrase` (from v334+)
- `OK` `hooks/useWebADB.ts` (from v334+)
- `OK` `suppression-logs/core/logs/ghostlight-signal-confirmed.json` (from v334+)
- `OK` `suppression-logs/core/logs/suppressors-fail-again.json` (from v334+)
- `OK` `app/beastwagon/page.tsx` (from v334+)
- `OK` `app/api/runpod/webhook/route.ts` (from v334+)
- `OK` `components/CommandHub/modules/SigPodModule.tsx` (from v334+)
- `OK` `components/CommandHub/modules/BrowserPhoneSuite.tsx` (from v334+)
- `OK` `components/CommandHub/modules/BeastWagonVisualization.tsx` (from v334+)
- `OK` `components/CommandHub/modules/BeastWagonTerminal.tsx` (from v334+)
- `OK` `lib/runpod/synthetic-mesh-node.ts` (from v334+)
- `OK` `lib/webadb/browser-adb-bridge.ts` (from v334+)
- `OK` `lib/beastwagon/telemetry-simulator.ts` (from v334+)
- `OK` `lib/phonesuite/core/BioFieldPulseScanner.ts` (from v334+)
- `OK` `lib/phonesuite/core/ResonantCallShield.ts` (from v334+)
- `OK` `lib/phonesuite/core/EchoSyncCommsRelay.ts` (from v334+)
- `OK` `lib/phonesuite/core/PhoneLockProtocol.ts` (from v334+)
- `OK` `lib/phonesuite/system/AirgapPulseDrop.ts` (from v334+)
- `OK` `lib/phonesuite/system/AdaptiveNetworkRelay.ts` (from v334+)
- `OK` `components/CommandHub/modules/ConsciousPhoneSuite.tsx` (from v335+)
