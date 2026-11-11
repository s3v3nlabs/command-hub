# package.json local patches (not from v0 block)

Applied only so `npm install` works on box registry (2026-09-24):

1. Removed invalid/builtin stubs: `fs`, `path`, `child_process`, `os`, `types`
2. Replaced unpublished `@fal-ai/serverless@^0.14.3` → `@fal-ai/client@^1.2.0`
3. Pinned `@ai-sdk/openai` from `2.0.32` → `^1.0.0` (peer-compatible with `ai@^4`)

Original package.json bytes preserved in reconstruct block sources / VERSION_INDEX.
