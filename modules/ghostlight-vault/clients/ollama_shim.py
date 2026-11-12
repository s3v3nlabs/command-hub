#!/usr/bin/env python3
"""Tool-calling shim: Ollama (or any OpenAI-compatible chat API) + Ghostlight REST.

Ollama does not speak MCP. This script advertises vault_search / vault_stats /
list_conversations / get_conversation as tools, executes them against the
vault REST API, and feeds the results back to the model.

Usage:
  export GHOSTLIGHT_MCP_TOKEN=...          # required
  export GHOSTLIGHT_URL=http://127.0.0.1:8765
  export OLLAMA_BASE_URL=http://127.0.0.1:11434   # or any OpenAI-compat base
  export OLLAMA_MODEL=llama3.1
  python3 ollama_shim.py "Search the vault for 11:30 and quote DOCUMENTED hits."

Venice (OpenAI-compatible) can use the same shim:
  OLLAMA_BASE_URL=https://api.venice.ai/api/v1  OLLAMA_API_KEY=... OLLAMA_MODEL=...
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

VAULT = os.environ.get("GHOSTLIGHT_URL", "http://127.0.0.1:8765").rstrip("/")
TOKEN = (os.environ.get("GHOSTLIGHT_MCP_TOKEN") or os.environ.get("GHOSTLIGHT_VAULT_TOKEN") or "").strip()
LLM_BASE = (os.environ.get("OLLAMA_BASE_URL") or "http://127.0.0.1:11434").rstrip("/")
# Ollama's native OpenAI-compat path is /v1; a raw Ollama URL has no /v1.
if not LLM_BASE.endswith("/v1"):
    LLM_BASE = LLM_BASE + "/v1"
MODEL = os.environ.get("OLLAMA_MODEL") or os.environ.get("OLLAMA_OPS_MODEL") or "llama3.1"
LLM_KEY = (os.environ.get("OLLAMA_API_KEY") or os.environ.get("VENICE_API_KEY") or "").strip()

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "vault_search",
            "description": "Full-text search the local ChatGPT vault. Punctuation like 11:30 is safe.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "limit": {"type": "integer", "default": 10},
                    "role": {"type": "string"},
                    "conversation_id": {"type": "string"},
                    "since": {"type": "string"},
                    "until": {"type": "string"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "vault_stats",
            "description": "Return conversation and message counts for the vault.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_conversations",
            "description": "List vaulted conversations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "profile": {"type": "string", "default": "all"},
                    "limit": {"type": "integer", "default": 20},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_conversation",
            "description": "Fetch one conversation and its messages.",
            "parameters": {
                "type": "object",
                "properties": {
                    "conversation_id": {"type": "string"},
                    "limit": {"type": "integer", "default": 200},
                },
                "required": ["conversation_id"],
            },
        },
    },
]


def _http(method: str, url: str, body: dict | None = None, headers: dict | None = None, timeout: float = 60):
    data = None if body is None else json.dumps(body).encode("utf-8")
    hdrs = {"Accept": "application/json", **(headers or {})}
    if data is not None:
        hdrs["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw.decode() or "null")
    except urllib.error.HTTPError as exc:
        raw = exc.read()
        try:
            parsed = json.loads(raw.decode() or "null")
        except Exception:
            parsed = {"error": raw.decode(errors="replace")[:400]}
        return exc.code, parsed


def vault(path: str, params: dict | None = None) -> str:
    if not TOKEN:
        return json.dumps({"ok": False, "error": "GHOSTLIGHT_MCP_TOKEN is not set"})
    q = ""
    if params:
        from urllib.parse import urlencode
        cleaned = {k: v for k, v in params.items() if v not in (None, "")}
        if cleaned:
            q = "?" + urlencode(cleaned)
    st, data = _http("GET", VAULT + path + q, headers={"Authorization": f"Bearer {TOKEN}"})
    return json.dumps({"http": st, **(data if isinstance(data, dict) else {"data": data})})


def dispatch(name: str, args: dict) -> str:
    if name == "vault_search":
        return vault(
            "/api/search",
            {
                "q": args.get("query") or args.get("q"),
                "limit": args.get("limit") or 10,
                "role": args.get("role"),
                "conversation_id": args.get("conversation_id"),
                "since": args.get("since"),
                "until": args.get("until"),
            },
        )
    if name == "vault_stats":
        return vault("/api/stats")
    if name == "list_conversations":
        return vault(
            "/api/conversations",
            {"profile": args.get("profile") or "all", "limit": args.get("limit") or 20},
        )
    if name == "get_conversation":
        cid = args.get("conversation_id") or ""
        return vault(f"/api/conversations/{cid}", {"limit": args.get("limit") or 200})
    return json.dumps({"error": f"unknown tool {name}"})


def chat(messages: list) -> dict:
    headers = {}
    if LLM_KEY:
        headers["Authorization"] = f"Bearer {LLM_KEY}"
    st, data = _http(
        "POST",
        LLM_BASE + "/chat/completions",
        body={"model": MODEL, "messages": messages, "tools": TOOLS, "tool_choice": "auto"},
        headers=headers,
        timeout=120,
    )
    if st >= 400:
        raise SystemExit(f"LLM error {st}: {data}")
    return data


def main() -> int:
    prompt = " ".join(sys.argv[1:]).strip() or "What is in the vault? Give counts, then a sample search."
    messages = [
        {
            "role": "system",
            "content": (
                "You are a vault research assistant. Call tools to answer. "
                "Quote DOCUMENTED hits; do not invent content that was not returned. "
                "Timestamps and titles are OBSERVED metadata."
            ),
        },
        {"role": "user", "content": prompt},
    ]
    for _ in range(6):
        data = chat(messages)
        choice = (data.get("choices") or [{}])[0]
        msg = choice.get("message") or {}
        tool_calls = msg.get("tool_calls") or []
        if not tool_calls:
            print(msg.get("content") or json.dumps(msg, indent=2))
            return 0
        messages.append(msg)
        for tc in tool_calls:
            fn = (tc.get("function") or {})
            name = fn.get("name") or ""
            try:
                args = json.loads(fn.get("arguments") or "{}")
            except json.JSONDecodeError:
                args = {}
            result = dispatch(name, args if isinstance(args, dict) else {})
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tc.get("id") or name,
                    "name": name,
                    "content": result,
                }
            )
    print("Stopped after max tool rounds.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
