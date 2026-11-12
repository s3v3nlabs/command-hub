/**
 * Copy-paste connection snippets for AI nodes.
 * Tokens are placeholders only — never interpolate a live secret here.
 * Capabilities described here were checked against each client's published docs.
 */

export type NodeConfig = {
  id: string
  name: string
  transport: string
  verified: string
  notes: string
  filename?: string
  language: "json" | "bash" | "text"
  snippet: string
}

export const VAULT_CONNECT_CONFIGS: NodeConfig[] = [
  {
    id: "chatgpt-developer",
    name: "ChatGPT (Developer mode / Secure tunnel)",
    transport: "Streamable HTTP via HTTPS tunnel",
    verified:
      "OpenAI documents Streamable HTTP MCP, the Secure MCP Tunnel for a local server, and (in Codex / ChatGPT desktop) bearer_token_env_var. The Responses API accepts type: mcp with server_url + authorization. The ChatGPT web 'Add custom MCP server' plugin UI advertises OAuth or no-auth; if a raw bearer field is not shown, use the Secure tunnel or the Responses API.",
    notes:
      "The vault binds to 127.0.0.1. ChatGPT on the public internet needs HTTPS. Use the OpenAI Secure tunnel-client (health on :8080 at /readyz, /healthz, /api/status — not /ready or /health) or a Cloudflare tunnel. After initialize, clients must send the Mcp-Session-Id header; official clients do this for you.",
    filename: "chatgpt connector",
    language: "text",
    snippet: `1. Start the vault:  modules/ghostlight-vault/run.sh
2. Start a tunnel to 127.0.0.1:8765 (OpenAI Secure tunnel-client, or: cloudflared tunnel --url http://127.0.0.1:8765)
3. ChatGPT → Settings → Apps / Developer mode → create connector
   URL:  https://<tunnel-host>/mcp
   Auth: Bearer  (paste the token from modules/ghostlight-vault/.bearer_token — do not commit it)
4. Scan tools → enable in a chat.

Responses API (verified):
{
  "type": "mcp",
  "server_label": "ghostlight_vault",
  "server_url": "https://<tunnel-host>/mcp",
  "authorization": "<YOUR_GHOSTLIGHT_TOKEN>"
}`,
  },
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    transport: "stdio (native). HTTP is not supported in claude_desktop_config.json.",
    verified:
      "Anthropic's Claude Desktop config (macOS: ~/Library/Application Support/Claude/claude_desktop_config.json, Windows: %APPDATA%\\Claude\\claude_desktop_config.json, Linux: ~/.config/Claude/claude_desktop_config.json) launches local MCP servers as stdio subprocesses via command/args/env. A url / type:http entry in that file is not supported. For HTTP, Claude Code or a stdio bridge such as mcp-remote is the documented path.",
    notes: "Quit Claude Desktop fully after editing the file. Use absolute paths. Stdio does not need a bearer token.",
    filename: "claude_desktop_config.json",
    language: "json",
    snippet: `{
  "mcpServers": {
    "ghostlight-vault": {
      "command": "python3",
      "args": ["-m", "ghostlight_vault", "serve", "--stdio"],
      "env": {
        "GHOSTLIGHT_VAULT": "/ABSOLUTE/PATH/TO/your-vault",
        "PYTHONPATH": "/ABSOLUTE/PATH/TO/command-hub/modules/ghostlight-vault/src"
      }
    }
  }
}`,
  },
  {
    id: "claude-code",
    name: "Claude Code",
    transport: "stdio or Streamable HTTP",
    verified:
      "Claude Code docs: `claude mcp add --transport http <name> <url>` and `--header \"Authorization: Bearer …\"`. Project JSON is `.mcp.json` and MUST set \"type\": \"http\" on remote entries (a url without type is a config error). \"streamable-http\" is accepted as an alias for \"http\". Stdio: `claude mcp add -- python3 -m ghostlight_vault serve --stdio`.",
    notes: "Prefer HTTP against the local server, or stdio for a private per-session process.",
    filename: ".mcp.json",
    language: "json",
    snippet: `{
  "mcpServers": {
    "ghostlight-vault": {
      "type": "http",
      "url": "http://127.0.0.1:8765/mcp",
      "headers": {
        "Authorization": "Bearer <YOUR_GHOSTLIGHT_TOKEN>"
      }
    }
  }
}`,
  },
  {
    id: "cursor",
    name: "Cursor",
    transport: "stdio or Streamable HTTP",
    verified:
      "Cursor docs (cursor.com/docs/mcp): project `.cursor/mcp.json` or `~/.cursor/mcp.json`. Stdio uses command/args/env. Remote uses url + optional headers. Interpolation: ${env:NAME}, ${workspaceFolder}, ${userHome}.",
    notes: "Commit a snippet with placeholders only — never a live token. Restart Cursor after editing.",
    filename: ".cursor/mcp.json",
    language: "json",
    snippet: `{
  "mcpServers": {
    "ghostlight-vault": {
      "command": "python3",
      "args": ["-m", "ghostlight_vault", "serve", "--stdio"],
      "env": {
        "GHOSTLIGHT_VAULT": "\${workspaceFolder}/local-data/ghostlight-vault",
        "PYTHONPATH": "\${workspaceFolder}/modules/ghostlight-vault/src"
      }
    },
    "ghostlight-vault-http": {
      "url": "http://127.0.0.1:8765/mcp",
      "headers": {
        "Authorization": "Bearer \${env:GHOSTLIGHT_MCP_TOKEN}"
      }
    }
  }
}`,
  },
  {
    id: "grok",
    name: "Grok / xAI",
    transport: "REST fallback (MCP support not verified on the public xAI API)",
    verified:
      "The public xAI API is OpenAI-compatible for chat completions. We could not verify a first-party remote-MCP client config for the xAI API comparable to Cursor or Claude Code. Grok Bot (this product) can host MCP connectors of its own; that is a different surface. Use the REST API or the OpenAI-compatible tool-calling shim.",
    notes: "Point any OpenAI-compatible tool-calling client at the REST endpoints below.",
    filename: "REST",
    language: "bash",
    snippet: `curl -sS -H "Authorization: Bearer \$GHOSTLIGHT_MCP_TOKEN" \\
  "http://127.0.0.1:8765/api/search?q=11:30&limit=10"`,
  },
  {
    id: "ollama",
    name: "Ollama / local models",
    transport: "REST via tool-calling shim (Ollama does not speak MCP)",
    verified:
      "Ollama exposes an OpenAI-compatible /v1/chat/completions with tools. It has no native MCP client. The shipped shim (modules/ghostlight-vault/clients/ollama_shim.py) advertises vault_* tools and executes them against the REST API. The hub Compute router (/compute) can also front a local Ollama — give it tool results from /api/vault/search, or run the shim.",
    notes: "Requires a tool-capable model (e.g. llama3.1).",
    filename: "ollama_shim.py",
    language: "bash",
    snippet: `export GHOSTLIGHT_MCP_TOKEN="$(cat modules/ghostlight-vault/.bearer_token)"
export OLLAMA_BASE_URL=http://127.0.0.1:11434
export OLLAMA_MODEL=llama3.1
python3 modules/ghostlight-vault/clients/ollama_shim.py \\
  "Search the vault for 11:30 and quote DOCUMENTED hits only."`,
  },
  {
    id: "venice",
    name: "Venice",
    transport: "REST / OpenAI-compatible shim (no native MCP verified)",
    verified:
      "Venice offers an OpenAI-compatible chat API. We could not verify a native remote-MCP connector in Venice's public docs. Use the same ollama_shim.py pointed at Venice, or call REST directly and paste results into a Venice character. The hub /venice characters are a separate chat surface and do not auto-wire this vault.",
    notes: "Do not put the vault token in a Venice character card that might be shared.",
    filename: "venice via shim",
    language: "bash",
    snippet: `export GHOSTLIGHT_MCP_TOKEN="$(cat modules/ghostlight-vault/.bearer_token)"
export OLLAMA_BASE_URL=https://api.venice.ai/api/v1
export OLLAMA_API_KEY=\$VENICE_API_KEY
export OLLAMA_MODEL=<your-venice-model>
python3 modules/ghostlight-vault/clients/ollama_shim.py "Search the vault for BlackFrame."`,
  },
  {
    id: "curl",
    name: "Generic curl (REST + raw MCP)",
    transport: "REST (recommended) or Streamable HTTP MCP",
    verified: "Standard HTTP. See modules/ghostlight-vault/clients/curl_examples.sh.",
    notes:
      "Raw MCP curl must capture the Mcp-Session-Id response header from initialize and send it on every later call. Official clients handle this. /healthz and /readyz are unauthenticated and return 'live' / 'ready' — there is no /health or /ready on older mental models of this server; both aliases exist on the packaged server, but the OpenAI tunnel-client's own health port (:8080) only serves /healthz and /readyz.",
    filename: "curl",
    language: "bash",
    snippet: `# REST (easy)
curl -sS -H "Authorization: Bearer \$GHOSTLIGHT_MCP_TOKEN" \\
  "http://127.0.0.1:8765/api/search?q=11:30&limit=5"

# Expect 401 without the header:
curl -sS -o /dev/null -w "%{http_code}\\n" "http://127.0.0.1:8765/api/search?q=test"

# Health (no auth)
curl -sS http://127.0.0.1:8765/healthz   # live
curl -sS http://127.0.0.1:8765/readyz   # ready`,
  },
]
