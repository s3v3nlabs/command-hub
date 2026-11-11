# Plugin SDK

Drop-in modules for the Singular/ty Command Hub. A plugin is a **manifest** plus
(optionally) its own Next.js route. Core never executes third-party code — the
trust boundary is real.

## Contract at a glance

- SDK version: **1.0.0** (`PLUGIN_API_VERSION` in `lib/modules/plugin-sdk.ts`).
- A plugin ships a `module.json` manifest and declares the permissions it needs.
- The hub validates the manifest (`validatePluginManifest`) and, for registry
  distribution, verifies a detached **ed25519** signature over the index.
- Plugins may call ONLY the documented public API surface
  (`PLUGIN_API_SURFACE`) with an operator-issued `HUB_API_TOKEN`.
- Core does **not** run a plugin's `entry` code. A plugin ships its own route
  (dropped into `app/`) or points at a hosted surface.
- `lattice_sync` must be `false` (HOLD_VYRNA_UNSYNC).
- Exploit/malware-flavored ids/names/descriptions are rejected.

## Manifest schema

```jsonc
{
  "id": "acme-recon",                 // unique, no exploit/malware words
  "name": "ACME Recon",
  "version": "1.2.0",                 // semver
  "description": "Passive recon dashboards for authorized engagements.",
  "route": "/plugins/acme-recon",     // absolute path your route serves
  "nav": { "label": "ACME Recon", "group": "intel", "order": 50, "badge": "new" },
  "permissions": ["ui", "read"],      // ui|read|dev|messaging|ai|privacy|ops
  "entry": null,                       // core never executes entry code
  "enabled": true,
  "kind": "route",
  "lattice_sync": false,

  // --- optional SDK metadata ---
  "sdkVersion": "1.0.0",
  "publisher": "ACME Security Labs",
  "homepage": "https://example.com/acme-recon",
  "license": "Apache-2.0",
  "minHubVersion": "0.1.0"
}
```

## Worked example

1. **Create the manifest** at `modules/acme-recon/module.json` (disk-scanned) or
   add it to the signed registry index (`public/registry/modules.json`).
2. **Ship the route** at `app/plugins/acme-recon/page.tsx` — a normal Next.js
   page that renders your UI and talks to the hub API with the operator token.
3. **Validate locally**:

   ```ts
   import { validatePluginManifest } from "@/lib/modules/plugin-sdk"
   const res = validatePluginManifest(require("./modules/acme-recon/module.json"))
   if (!res.ok) throw new Error(res.errors.join("; "))
   ```

4. **Call the hub API** (operator token required):

   ```ts
   const r = await fetch("/api/modules", {
     headers: { Authorization: `Bearer ${process.env.HUB_API_TOKEN}` },
   })
   const { modules } = await r.json()
   ```

## Distribution via the marketplace

See `/marketplace`. The module **index** is a signed JSON manifest
(`public/registry/modules.json`) with a detached ed25519 signature
(`modules.json.sig`) verified against `public/registry/registry.pub` or the
`REGISTRY_PUBLIC_KEY` env var. Operators sign their own index with
`scripts/sign-registry.mjs`. If no key is configured the marketplace shows an
**unverified** state and never silently trusts the index.

Swap the bundled index for a hosted one by setting `REGISTRY_INDEX_URL`.
