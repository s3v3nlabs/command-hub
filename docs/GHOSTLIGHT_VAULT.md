# Ghostlight Vault

A shareable, local-first search tool for a **ChatGPT data export**. It ships inside Singular/ty Command Hub as:

- a packaged Python server (`modules/ghostlight-vault/`) that speaks **MCP** (streamable HTTP + stdio) and a small **REST/JSON API**
- an in-hub route **`/vault`** with a Ghostlight HUD search UI, a health panel, and copy-paste configs for AI nodes
- Next.js API routes at `/api/vault/*` that proxy to the Python service and **degrade honestly** when it is down

This is **not** a backdoor into OpenAI's private or hidden thread store. It only searches what you exported (or, if you opt in, what you explicitly ingested).

**Credit:** Christian Wilford (s3v3n), Founder, Singular/ty Defense Solutions, LLC. Licensed **Apache-2.0**.

---

## 1. Install

From a Command Hub checkout, Python 3.10+:

```bash
cd modules/ghostlight-vault
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Or just run `./run.sh` — it creates the venv, generates a bearer token file if missing, and starts the server. The token is written to `.bearer_token` (mode 0600) and **is not printed**.

Default bind: `127.0.0.1:8765`. Non-loopback binds are refused unless you set `GHOSTLIGHT_ALLOW_REMOTE=1`.

If something is already listening on 8765 (for example the legacy Ghostlight connector), do **not** kill it from this guide — pick another port:

```bash
GHOSTLIGHT_PORT=8766 ./run.sh
# hub:
# GHOSTLIGHT_VAULT_URL=http://127.0.0.1:8766
```


## 2. Generate a token

```bash
cd modules/ghostlight-vault
PYTHONPATH=src .venv/bin/python -m ghostlight_vault gen-token --out .bearer_token
export GHOSTLIGHT_MCP_TOKEN="$(cat .bearer_token)"   # do not echo this into logs or chat
```

`--force` rotates an existing file. Never commit `.bearer_token`, `RUNTIME_API_KEY.txt`, `TUNNEL_ID.txt`, `PUBLIC_MCP_URL.txt`, conversation exports, or the SQLite index. They are gitignored.

## 3. Import a ChatGPT export

1. In ChatGPT: **Settings → Data controls → Export data**. OpenAI emails a zip.
2. Unzip it. The file you want is `conversations.json`.
3. Point the vault at a data directory and import:

```bash
export GHOSTLIGHT_VAULT="$PWD/data/vault"          # or any path you own
PYTHONPATH=src .venv/bin/python -m ghostlight_vault import /path/to/conversations.json
# also accepts an export directory or the zip itself
```

`--rebuild` drops and recreates the index. The importer understands the official ChatGPT `mapping` tree and writes:

- `<vault>/index/vault.sqlite3` — `conversations`, `messages`, and an FTS5 `messages_fts` table
- `<vault>/conversations/<id>.json` — a sanitized per-thread copy (skip with `--no-write-json`)

`GHOSTLIGHT_VAULT` is the only path you need to configure. The packaged server will also open an older Ghostlight index that only has `conversations` + `messages_fts` (no structured `messages` table).

## 4. Run

```bash
export GHOSTLIGHT_VAULT="$PWD/data/vault"
export GHOSTLIGHT_MCP_TOKEN="$(cat .bearer_token)"
./run.sh
# equivalent:
# PYTHONPATH=src .venv/bin/python -m ghostlight_vault serve --host 127.0.0.1 --port 8765
```

Stdio mode (Claude Desktop, Cursor, Claude Code local):

```bash
PYTHONPATH=src .venv/bin/python -m ghostlight_vault serve --stdio
```

Stdio does not require a token (the client is a local subprocess). HTTP **does**: the server refuses to start if `GHOSTLIGHT_MCP_TOKEN` is empty.

Ingest / write tools are **off by default** (staged-ladder). Enable only when you intend to accept dumps from a connected node:

```bash
./run.sh --allow-ingest
# or: GHOSTLIGHT_ALLOW_INGEST=1
```

### Endpoints

| Path | Auth | Purpose |
|------|------|---------|
| `POST /mcp` | Bearer | MCP streamable HTTP |
| `GET /healthz` (`/health`) | none | liveness: `live` |
| `GET /readyz` (`/ready`) | none | readiness: `ready`, or `503` if the DB is missing/unreadable |
| `GET /api/status` | Bearer | version, counts, ingest flag (no token, no personal paths) |
| `GET /api/stats` | Bearer | same counts, plus profile breakdown |
| `GET\|POST /api/search` | Bearer | `q` / `query`, `limit`, `role`, `conversation_id`, `since`, `until` |
| `GET /api/conversations` | Bearer | `profile`, `limit`, `offset` |
| `GET /api/conversations/{id}` | Bearer | one thread + messages |
| `POST /api/ingest` | Bearer | write path; **403** unless ingest is enabled |

### Search robustness

FTS5 treats `:` as a column filter, so a raw query of `11:30` used to return **0 hits** even when the text was in the index. The packaged server:

1. Quotes each token (`"11:30" AND "candy"`) so punctuation is literal.
2. Honors already-quoted phrases and `AND` / `OR` / `NOT`.
3. Falls back to a `LIKE` scan (with escaped `%` / `_`) when FTS errors or returns nothing.
4. Applies role, conversation, and ISO date-range filters in SQL on both paths.
5. Returns a snippet with `>>>match<<<` context and an evidence label (`DOCUMENTED` for hit text, `OBSERVED` for titles/timestamps).

## 5. Hub wiring (`/vault`)

In `.env.local` (never commit values):

```bash
GHOSTLIGHT_VAULT_URL=http://127.0.0.1:8765
GHOSTLIGHT_VAULT_TOKEN=<same token as GHOSTLIGHT_MCP_TOKEN>
```

Restart the Next.js hub. Open **`/vault`**. The page talks only to `/api/vault/*` on the hub; the bearer token stays server-side. If the Python service is down, unconfigured, or rejects the token, the API returns `{ ok: false, degraded: true, reason: "…" }` and the UI shows that state — it does not invent hits.

The module is registered at `modules/ghostlight-vault/module.json` (disk-scanned by `/modules` and the command palette) and listed in the sidebar and Help.

## 6. Tunnel options (ChatGPT needs HTTPS)

The vault binds to localhost. A browser ChatGPT session on the public internet cannot reach it directly.

**OpenAI Secure tunnel-client** (the path already used with this vault). Health for the *tunnel process* is on `127.0.0.1:8080`:

- `/readyz` → `ready` (200)
- `/healthz` → `live` (200)
- `/api/status`
- `/ready` and `/health` on that port return **404** — that is a gotcha. Use the `z` suffix.

Do not commit `RUNTIME_API_KEY.txt`, `TUNNEL_ID.txt`, or `PUBLIC_MCP_URL.txt`. This repository does **not** vendor the tunnel-client binary; install it from OpenAI's distribution and point it at `http://127.0.0.1:8765`.

**Cloudflare quick tunnel** (fine for a short test, not a standing exposure):

```bash
cloudflared tunnel --url http://127.0.0.1:8765
```

A public tunnel exposes the MCP and REST ports to the internet. Bearer auth is required on those routes, but you should still prefer a Secure tunnel, Cloudflare Access, or a tailnet. Rotate the token if a tunnel URL leaks.

## 7. Connect AI nodes

Copy-paste configs also live in `modules/ghostlight-vault/clients/` and on the `/vault` Connect panel. **Only capabilities verified from each client's published docs are described.** Where remote MCP is uncertain, the REST fallback is the honest path.

### ChatGPT

- **Developer mode connector** (known-working path for this project): Settings → Apps / Developer mode → create a connector with `https://<tunnel>/mcp` and a Bearer token from `.bearer_token`. Scan tools, enable in a chat.
- **OpenAI Responses API** (documented): a tool of `"type": "mcp"` with `server_url` and `authorization`. See `clients/openai_responses_mcp.json.example`.
- **ChatGPT desktop / Codex**: documented to support Streamable HTTP and `bearer_token_env_var`.
- The ChatGPT *web* "Add custom MCP server" plugin UI, per current OpenAI docs, advertises **OAuth or no authentication**. If a raw bearer field is not shown, use the Secure tunnel or the Responses API — do not disable auth on the vault.

### Claude Desktop

Stdio only, in `claude_desktop_config.json`:

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

See `clients/claude_desktop.json.example`. A `url` / `"type": "http"` entry in that file is **not** supported. Quit the app fully after editing. For HTTP, use Claude Code or a stdio bridge such as the community `mcp-remote` tool.

### Claude Code

```bash
claude mcp add --transport http ghostlight-vault http://127.0.0.1:8765/mcp \
  --header "Authorization: Bearer $GHOSTLIGHT_MCP_TOKEN"
```

Project file: `.mcp.json`. Remote entries **must** include `"type": "http"` (`"streamable-http"` is accepted as an alias). A `url` without `type` is a config error. Stdio: `claude mcp add -- python3 -m ghostlight_vault serve --stdio`. Example: `clients/claude_code.mcp.json.example`.

### Cursor

Project: `.cursor/mcp.json`. Global: `~/.cursor/mcp.json`. Stdio (`command` / `args` / `env`) and remote (`url` + `headers`) are both documented. Interpolation includes `${env:NAME}` and `${workspaceFolder}`. Example: `clients/cursor.mcp.json.example`. Restart Cursor after editing. Commit placeholders only, never a live token.

### Grok / xAI

The public xAI API is OpenAI-compatible for chat completions. We could **not** verify a first-party remote-MCP client config comparable to Cursor or Claude Code. Grok Bot can host its own MCP connectors; that is a different surface. Use REST, or the OpenAI-compatible tool-calling shim below.

### Ollama / local models

Ollama does not speak MCP. Use `clients/ollama_shim.py`, which advertises `vault_*` tools and executes them against the REST API. A tool-capable model is required (e.g. `llama3.1`). The hub Compute router (`/compute`) can front Ollama; you can also feed it results from `/api/vault/search`.

```bash
export GHOSTLIGHT_MCP_TOKEN="$(cat modules/ghostlight-vault/.bearer_token)"
export OLLAMA_BASE_URL=http://127.0.0.1:11434
export OLLAMA_MODEL=llama3.1
python3 modules/ghostlight-vault/clients/ollama_shim.py \
  "Search the vault for 11:30 and quote DOCUMENTED hits only."
```

### Venice

Venice offers an OpenAI-compatible chat API. We could **not** verify a native remote-MCP connector. Point the same shim at Venice (`OLLAMA_BASE_URL=https://api.venice.ai/api/v1`, `OLLAMA_API_KEY=$VENICE_API_KEY`) or call REST and paste results into a Venice character. Do not put the vault token in a character card that might be shared. The hub `/venice` surface does not auto-wire this vault.

### Generic curl

See `clients/curl_examples.sh`. REST is the easy path. Raw MCP curl must capture the `Mcp-Session-Id` response header from `initialize` and send it on every later call (see troubleshooting).

## 8. Security notes

- HTTP is fail-closed: no token, no start; wrong token, `401`. Comparison is constant-time and same-length.
- Loopback bind by default. `/healthz` and `/readyz` are unauthenticated and return no secrets.
- Ingest is off until you flip the staged-ladder flag. Payload cap is 8 MiB. Writes go to `GHOSTLIGHT_INGEST` (default `<vault>/raw/connector_ingest`) with a SHA-256 ledger.
- The hub proxy scrubs secret-shaped strings (API keys, PEMs, `Bearer …`, `PSID=`) from snippets before they reach the browser.
- A public tunnel is an exposure. Rotate the token if the URL leaks. Do not log tokens. Do not commit exports.
- This tool searches **your** export. Treat the index as personal data.

## 9. Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| MCP `tools/call` fails with "Missing session ID" | After `initialize`, the client must send the `Mcp-Session-Id` **response** header on subsequent requests (including `notifications/initialized`). Official ChatGPT / Claude / Cursor clients do this. Raw curl must do it by hand — see `clients/curl_examples.sh`. |
| OpenAI tunnel `/ready` or `/health` is 404 | The tunnel-client health server on `:8080` only serves `/readyz` and `/healthz`. The packaged vault itself also aliases `/ready` and `/health`. |
| `vault_search` returns 0 hits for `11:30` | That was a bug in the original connector (FTS5 column-filter parse). The packaged server quotes tokens and falls back to LIKE. Run `scripts/smoke.sh` to confirm. |
| Hub `/vault` shows DEGRADED | Python service not running, wrong `GHOSTLIGHT_VAULT_URL`, or missing/mismatched `GHOSTLIGHT_VAULT_TOKEN`. The UI will say so; it will not invent results. |
| Server exits: "Refusing to start HTTP" | `GHOSTLIGHT_MCP_TOKEN` is empty. Run `gen-token` or use `--stdio`. |
| Server exits: "Refusing to bind" | You set a non-loopback host without `GHOSTLIGHT_ALLOW_REMOTE=1`. |
| `ingest` returns `ingest_disabled` | Expected. Restart with `--allow-ingest`. |
| Import finds 0 conversations | Point at `conversations.json` (or the export zip / folder that contains it), not a random JSON dump. |

## 10. Smoke test

```bash
modules/ghostlight-vault/scripts/smoke.sh
```

This indexes a **synthetic** fixture (`fixtures/tiny_export.json`, including a message with `11:30`), searches it, starts an ephemeral HTTP server on a random port, and checks that unauthenticated and wrong-token requests are `401`. It does **not** touch a live vault or a process already bound to `:8765`.

## 11. Evidence labels

Used wherever a result is shown:

| Label | Meaning here |
|-------|----------------|
| `DOCUMENTED` | Verbatim text present in the vaulted export |
| `OBSERVED` | Recorded metadata (id, role, title, timestamp, counts) |
| `CORRELATED` | Reserved for joins by a shared identifier (not emitted by search itself) |
| `INFERRED` / `PREDICTED` | Not emitted by this tool |

---

Questions about lawful, authorized use: see `LEGAL.md` and `SECURITY.md`.
