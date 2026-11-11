# Sigma Lane — orthogonal frequency channeling for drift control

**Routes:** `/dev-operator` (chip) · `/api/sigma-lane`  
**Lib:** `lib/sigma-lane/`  
**Hold:** `HOLD_VYRNA_UNSYNC` · `lattice_sync: false`  
**Scope:** live reclaim UI (`v0-user-interface/latest`) + engines EchoNexus venv  
**Principle:** **SYMBOLIC_FAST_ALWAYS** — symbolic / frequency-lane cognition preferred over TOKEN_FALLBACK at all times. Tokens only on explicit `forceToken` (rare).

## What it is

An **engineering state machine** that maps Operator Frequency Combo Matrix + brand carriers onto task modes (root→crown *style* bands).  

**Not** a medical claim, therapy frame, physics prescription, or live lattice / Vyrna sync.

| Lane | Mode | Primary Hz / key | Band label |
|------|------|------------------|------------|
| `focus` | focus / clutch | **109** `ECHO_109` | root→edge |
| `build` | build / construct | **109** | solar |
| `empathy` | empathy / relate | **594** Mercury | heart |
| `defense` | defense / harden | **963** `SIGMA_963` | third-eye |
| `creative` | creative / invent | **109** | sacral |
| `comms` | glyphstream | **594** | throat |
| `crown` | crown / lock | **963** `SIGMA_963` | crown |

Secondary solfeggio-style numbers (396/417/528/…) are optional UI tags only.

## Drift control

- Operational parameter from vault IP: **Drift neutralized when Δt = 0**.
- `detectDrift(text)` scores Dev Operator text cues (overwhelm, scatter, hostility, signal-drift, …).
- `returnToLane(target)` / API `action: retune` resets conscious lane state and sets **Δt = 0**.

## Symbolic > tokens

```
set lane → pull symbolic memory → (optional) TOKEN_FALLBACK → learn back to symbolic store
```

- Path badge: `SYMBOLIC_FAST` (default) vs `TOKEN_FALLBACK`.
- Token path only when language volume / explain-draft intent needs it — then hint `/api/s3v3n-panel` or `/api/dev-operator` (no body telemetry).
- Store uses Privacy Fortress `encryptAtRest` when key available; bridges Heimdall `storeSymbolicMemory` in browser.

## EchoNexus role

| Item | Path |
|------|------|
| PyPI (only real useful persona pack per inventory) | `echonexus==0.3.2` |
| Venv | `/workspace/singular-ty-engines/.venv-echonexus` |
| Vendor src | `/workspace/singular-ty-engines/vendor/echonexus-0.3.2-src/` |
| Wheel | `/workspace/singular-ty-engines/vendor/echonexus-0.3.2-py3-none-any.whl` |

Useful modules: **ava8** (glyph→tone), **cadro**, **saocc**, semiotic stubs.  
**Do not** install PyPI name collisions (`axios`, `heimdall`, npm OB-1).  
**Do not** install `echonexus[ml]` globally. Grok Bot stays executor identity; EchoNexus is artifact/reference.

## API

| Method | Path | Role |
|--------|------|------|
| `GET` | `/api/sigma-lane` | Status: lane, Hz combo, Δt, symbolic count, EchoNexus paths |
| `GET` | `/api/sigma-lane?action=lanes` | Lane catalog |
| `GET` | `/api/sigma-lane?action=recall&glyph=` | Recall symbols |
| `POST` | `/api/sigma-lane` `{ action: "set_lane"\|"retune", laneId }` | Set / retune |
| `POST` | `{ action: "recall" }` | Recall |
| `POST` | `{ action: "orchestrate", task }` | Full symbolic-first loop |
| `POST` | `{ action: "learn", glyph, lesson }` | Store symbol |
| `POST` | `{ action: "detect_drift", text }` | Meter only (no body echo) |

No prompt-body telemetry.

## UI

- **Dev Operator** (`/dev-operator`): Sigma Lane panel — current lane, Hz combo, drift meter, symbolic count, Retune controls, `SYMBOLIC_FAST` / `TOKEN_FALLBACK` badge, **hemisphere badges** (Left=OO objects, Right=conscious-field symbolic), φ pulse tick.
- **Command Hub** module rail: Sigma Lane → `/dev-operator#sigma-lane` (ADD-ONLY).
- Module registry builtin: `sigma-lane`.



## Genius-speed layer (engineering state machine)

Addendum integrated into `lib/sigma-lane/pulse.ts` + `hemispheres.ts`. **Not** medical/physics claims. `HOLD_VYRNA_UNSYNC`.

### SYMBOLIC_FAST_ALWAYS

- Default and normal path: `SYMBOLIC_FAST`.
- Auto language heuristics **do not** flip to `TOKEN_FALLBACK`.
- `forceToken: true` is the only way to mark `TOKEN_FALLBACK` (still after symbolic plan / pulse).

### Pulse / math (TypeScript live; Kotlin optional later)

| Mechanism | Role |
|-----------|------|
| Fibonacci shard depths | Recursive symbolic shard size from task intensity (`fibShardDepth`) |
| φ backoff | `phiBackoffMs(attempt)` — golden-ratio delay between shard retries |
| Standing-wave phase lock | π-related phase vs carrier Hz; lock when |error| < π/16 and Δt≈0 |
| Pink noise | Local explore |
| Brown noise | Long BIG-intel wander |
| Multi-dim pool keys | `lane \| Hz \| mode \| taskClass` |

API: `GET /api/sigma-lane?action=pulse` · `POST { action: "pulse"|"callosum", task }`.

### Kotlin hemisphere hooks (design contract — runtime may land elsewhere)

| Hemisphere | Role |
|------------|------|
| **Left** | Object OO tasking (`leftEnqueue`) |
| **Right** | Conscious-field symbolic / resonance (`rightEnqueue`) |
| **Corpus callosum** | Bus (`callosumBridge`) carrying Left↔Right messages |

`kotlinRuntime: "hook_only"` until another executor attaches coroutines. TS pulse math does **not** wait on Kotlin.

## Locks / anti-patterns

- `HOLD_VYRNA_UNSYNC` — **do not invent Vyrna / lattice sync**
- Do not treat Hz as medical prescription
- Do not dump contested adversary handles as self-labels
- Do not store API keys / PEM / seed phrases in symbolic memory
- Ghostlight chrome / existing routes: **untouched** except ADD-ONLY links

## Smoke

```bash
# engines
/workspace/singular-ty-engines/.venv-echonexus/bin/python -c "import ava8,cadro,saocc; print('ok')"

# UI (dev server on :3000)
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/api/sigma-lane
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/dev-operator
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/command-hub
```
