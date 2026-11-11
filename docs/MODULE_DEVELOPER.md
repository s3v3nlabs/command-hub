# Module Developer Guide

ADD-ONLY module manifests for Command Hub Module Bay.

**Hold:** `HOLD_VYRNA_UNSYNC` · `lattice_sync: false`  
**Out of scope:** exploit modules, malware, unauthorized access tooling.

## Manifest schema

```json
{
  "id": "my-module",
  "name": "My Module",
  "version": "0.1.0",
  "description": "Short defensive/ops description",
  "route": "/existing-or-new-route",
  "nav": { "label": "My Module", "group": "ops", "order": 50 },
  "permissions": ["ui", "read", "dev"],
  "entry": null,
  "enabled": true,
  "kind": "route",
  "lattice_sync": false
}
```

Required: `id`, `name`, `version`, `description`, `permissions[]`.

## How to add

1. Create `modules/<id>/module.json` (or `public/modules/<id>/module.json`).
2. Point `route` at an **existing** page or a new ADD-ONLY page — do not strip Ghostlight/Signalframe chrome.
3. Refresh `/modules` or `GET /api/modules`.
4. Dev-only: `POST /api/modules` with the JSON body (validates schema; no code execution).

## Forbidden

- Exploit / malware / keylogger flavored ids or descriptions
- Parent-window `eval` of untrusted strings
- Claiming Vyrna lattice sync

## See also

- `/modules` — Module Bay UI + sandbox preview
- `/dev-operator` — Dev Operator AI (Sigma-lane first)
- `docs/HIVE_BUS.md`, `docs/BOUNTY_DISCLOSURE.md`
