# Phone Suite Live Upgrade

Date: 2026-09-24 (America/Denver)

## What changed

- `/app/phone-suite/page.tsx` now mounts the full CommandHub `PhoneSuite` (ADB Scan Devices / Connected Devices / Mirror tabs + `/api/adb/*` hooks) instead of thin `PhoneSuiteDemo`.
- Ghostlight `Sidebar` + `Header` shell retained (same pattern as SignalFrame).
- Root class on `components/CommandHub/PhoneSuite.tsx` changed from `min-h-screen` → `h-full` so it nests in the shell without a double full-page scroll.
- Secondary page tab: **ADB Suite** (default) | **WebUSB Connect** (`RealPhoneSuite`) — ADB remains primary.
- Home `/` quick actions: added prominent **Phone Suite** next to SignalFrame / Evidence Explorer.
- Sidebar `/phone-suite` link was already present; unchanged.
- `.env.local` left untouched (chmod 600).

## Smoke

- `GET /phone-suite` — expect 200
- `GET /` — expect 200
- `GET /api/adb/devices` — expect JSON response (may be empty / ADB-not-connected)

## Not done

- No GitHub push
- No business-ui tree changes
