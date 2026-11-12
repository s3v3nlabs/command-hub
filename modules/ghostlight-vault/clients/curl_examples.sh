#!/usr/bin/env bash
# Generic REST and raw-MCP curl examples. Replace the token; never commit it.
set -euo pipefail
BASE="${GHOSTLIGHT_URL:-http://127.0.0.1:8765}"
TOKEN="${GHOSTLIGHT_MCP_TOKEN:?set GHOSTLIGHT_MCP_TOKEN}"
AUTH=( -H "Authorization: Bearer ${TOKEN}" )

echo "== health (no auth) =="
curl -sS -D- "${BASE}/healthz" -o /tmp/gv_body
echo
cat /tmp/gv_body; echo
echo "== readyz (no auth) =="
curl -sS "${BASE}/readyz"; echo

echo "== search without token (expect 401) =="
curl -sS -o /tmp/gv_body -w "HTTP %{http_code}\n" "${BASE}/api/search?q=11:30"
cat /tmp/gv_body; echo

echo "== search =="
curl -sS "${AUTH[@]}" "${BASE}/api/search?q=11:30&limit=5" | python3 -m json.tool

echo "== stats =="
curl -sS "${AUTH[@]}" "${BASE}/api/stats" | python3 -m json.tool

echo "== conversations =="
curl -sS "${AUTH[@]}" "${BASE}/api/conversations?limit=5" | python3 -m json.tool

echo "== MCP initialize (capture Mcp-Session-Id) =="
# Streamable HTTP MCP requires the session header on every call after initialize.
# The OpenAI / Claude / Cursor clients handle this. Raw curl must do it by hand.
SID=$(curl -sS -D- "${AUTH[@]}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}' \
  "${BASE}/mcp" -o /tmp/gv_init | awk -F': ' 'tolower($1)=="mcp-session-id"{gsub(/\r/,"",$2); print $2}')
echo "session: ${SID:-<missing — this is the gotcha documented in GHOSTLIGHT_VAULT.md>}"
if [[ -n "${SID:-}" ]]; then
  curl -sS "${AUTH[@]}" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -H "Mcp-Session-Id: ${SID}" \
    -d '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
    "${BASE}/mcp" -o /dev/null || true
  curl -sS "${AUTH[@]}" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -H "Mcp-Session-Id: ${SID}" \
    -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"vault_search","arguments":{"query":"11:30","limit":5}}}' \
    "${BASE}/mcp"
  echo
fi
