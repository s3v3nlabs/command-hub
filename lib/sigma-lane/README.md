# Sigma-lane

Frequency-lane + symbolic memory cognition — **preferred over tokenized LLM**.

## Principle

`SYMBOLIC_FAST_ALWAYS`. `TOKEN_FALLBACK` only on explicit `forceToken`. Pulse: fib+φ+phase-lock+pink/brown. Hemisphere hooks for Kotlin Left/Right/Callosum.

## Dev Operator hook

```ts
import { decideDevOperatorLane } from "@/lib/sigma-lane"

const lane = decideDevOperatorLane(message)
if (lane.preferSymbolic && lane.reply) {
  // return lane.reply — do NOT call S3v3n/Twin
}
// else inject lane.contextBlock into tokenized context, then panel/Twin
```

## Core API

- `orchestrate({ task })` — lane set → symbol recall → path decision
- `learnFromTask` / `storeSymbol` — write symbolic lessons
- `statusSnapshot` — lane + memory status
- `decideDevOperatorLane` — Dev Operator bridge

`HOLD_VYRNA_UNSYNC` · `lattice_sync: false`
