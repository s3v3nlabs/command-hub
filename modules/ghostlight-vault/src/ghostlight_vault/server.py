"""MCP (streamable HTTP + stdio) and REST/JSON API for Ghostlight Vault."""

from __future__ import annotations

import json
from typing import Any

from starlette.requests import Request
from starlette.responses import JSONResponse, PlainTextResponse, Response

from . import __publisher__, __version__
from .auth import BearerAuthMiddleware
from .config import Config
from .service import VaultService

INSTRUCTIONS = (
    "Ghostlight Vault searches a local ChatGPT data-export index. "
    "Use vault_search for full-text queries (punctuation like 11:30 is safe). "
    "Use list_conversations and get_conversation to browse. "
    "Hits are DOCUMENTED text from the operator's export; timestamps/titles "
    "are OBSERVED metadata. This server cannot read OpenAI's private store. "
    "Ingest is disabled unless the operator enabled the staged-ladder flag."
)


def _json(data: Any, status: int = 200) -> JSONResponse:
    return JSONResponse(data, status_code=status)


def build_mcp(svc: VaultService):
    from mcp.server.mcpserver import MCPServer

    mcp = MCPServer(
        "ghostlight-vault",
        title="Ghostlight Vault",
        description="Search a local ChatGPT export vault (FTS + REST).",
        instructions=INSTRUCTIONS,
        version=__version__,
    )

    @mcp.tool()
    def vault_stats() -> str:
        """Return counts for the local ChatGPT vault (conversations, FTS messages)."""
        return json.dumps(svc.stats(), indent=2)

    @mcp.tool()
    def vault_search(
        query: str,
        limit: int = 20,
        role: str = "",
        conversation_id: str = "",
        since: str = "",
        until: str = "",
    ) -> str:
        """Full-text search the ChatGPT vault. Punctuation (e.g. 11:30) is safe.

        Args:
            query: Search text. Multi-word queries are AND-joined; OR is honored.
            limit: Max rows, 1-100 (default 20).
            role: Optional filter: user, assistant, system, or tool.
            conversation_id: Optional restrict to one conversation.
            since: Optional ISO-8601 lower bound on message create_time.
            until: Optional ISO-8601 upper bound on message create_time.
        """
        return json.dumps(
            svc.search(
                query,
                limit=limit,
                role=role or None,
                conversation_id=conversation_id or None,
                since=since or None,
                until=until or None,
            ),
            indent=2,
            ensure_ascii=False,
        )

    @mcp.tool()
    def list_conversations(profile: str = "all", limit: int = 50) -> str:
        """List vaulted conversations (title, times, message_count).

        Args:
            profile: 'self', another profile name, or 'all' (default).
            limit: Max rows, 1-500.
        """
        return json.dumps(svc.list_conversations(profile=profile, limit=limit), indent=2)

    @mcp.tool()
    def get_conversation(conversation_id: str, limit: int = 400) -> str:
        """Return one conversation and its messages.

        Args:
            conversation_id: The vault conversation id.
            limit: Max messages to return (default 400).
        """
        return json.dumps(
            svc.get_conversation(conversation_id, limit=limit),
            indent=2,
            ensure_ascii=False,
        )

    if svc.cfg.allow_ingest:

        @mcp.tool()
        def ingest_conversation_payload(
            title: str,
            conversation_id: str,
            payload: str,
            source_note: str = "chatgpt-connector",
        ) -> str:
            """Ingest a conversation JSON or text dump (staged-ladder; enabled on this process).

            Args:
                title: Human title.
                conversation_id: ChatGPT conversation id if known.
                payload: Full JSON or markdown of the conversation.
                source_note: Short provenance tag.
            """
            return json.dumps(
                svc.ingest(title, conversation_id, payload, source_note),
                indent=2,
            )

    @mcp.tool()
    def connector_help() -> str:
        """Explain what this connector can and cannot do."""
        ingest = "enabled" if svc.cfg.allow_ingest else "disabled (default)"
        return (
            "Ghostlight Vault MCP bridges a local ChatGPT data-export index.\n"
            "CAN: vault_stats, vault_search (filters: role, conversation_id, since, until), "
            "list_conversations, get_conversation.\n"
            f"INGEST: {ingest}. Write tools stay behind --allow-ingest / "
            "GHOSTLIGHT_ALLOW_INGEST=1 (staged ladder, off by default).\n"
            "CANNOT: read OpenAI's private/hidden thread store; only what was exported "
            "or explicitly ingested.\n"
            "Hits are DOCUMENTED; titles/timestamps are OBSERVED.\n"
            f"Publisher: {__publisher__}. Apache-2.0.\n"
            "HTTP clients must send Authorization: Bearer <token> and, after MCP "
            "initialize, the Mcp-Session-Id response header on subsequent calls."
        )

    # --- REST routes (auth is enforced by BearerAuthMiddleware, including these) ---
    # custom_route normally skips MCP's own OAuth; our middleware wraps the whole app.

    @mcp.custom_route("/healthz", methods=["GET"])
    async def healthz(_request: Request) -> Response:
        return PlainTextResponse("live")

    @mcp.custom_route("/health", methods=["GET"])
    async def health(_request: Request) -> Response:
        # Friendly alias. The OpenAI Secure tunnel-client itself uses /healthz
        # on its own :8080 port — that is a different process.
        return PlainTextResponse("live")

    @mcp.custom_route("/readyz", methods=["GET"])
    async def readyz(_request: Request) -> Response:
        ok, reason = svc.ready()
        return PlainTextResponse(
            "ready" if ok else f"not ready: {reason}",
            status_code=200 if ok else 503,
        )

    @mcp.custom_route("/ready", methods=["GET"])
    async def ready(_request: Request) -> Response:
        ok, reason = svc.ready()
        return PlainTextResponse(
            "ready" if ok else f"not ready: {reason}",
            status_code=200 if ok else 503,
        )

    @mcp.custom_route("/api/status", methods=["GET"])
    async def api_status(_request: Request) -> Response:
        ok, reason = svc.ready()
        st = svc.stats()
        # Do not include the token or absolute personal paths.
        return _json(
            {
                "ok": ok,
                "ready": ok,
                "reason": reason,
                "version": __version__,
                "ingest_enabled": svc.cfg.allow_ingest,
                "db_exists": st.get("db_exists"),
                "conversations": st.get("conversations"),
                "messages_fts": st.get("messages_fts"),
                "publisher": __publisher__,
            }
        )

    @mcp.custom_route("/api/stats", methods=["GET"])
    async def api_stats(_request: Request) -> Response:
        return _json(svc.stats())

    @mcp.custom_route("/api/search", methods=["GET", "POST"])
    async def api_search(request: Request) -> Response:
        if request.method == "POST":
            try:
                body = await request.json()
            except Exception:
                body = {}
            if not isinstance(body, dict):
                body = {}
        else:
            body = dict(request.query_params)
        q = str(body.get("q") or body.get("query") or "").strip()
        if not q:
            return _json({"ok": False, "error": "query required", "count": 0, "hits": []}, 400)
        try:
            limit = int(body.get("limit") or 20)
        except (TypeError, ValueError):
            limit = 20
        result = svc.search(
            q,
            limit=limit,
            role=(body.get("role") or None) or None,
            conversation_id=(body.get("conversation_id") or body.get("conversation") or None)
            or None,
            since=(body.get("since") or None) or None,
            until=(body.get("until") or None) or None,
        )
        return _json(result, 200 if result.get("ok", True) else 404)

    @mcp.custom_route("/api/conversations", methods=["GET"])
    async def api_conversations(request: Request) -> Response:
        qp = request.query_params
        try:
            limit = int(qp.get("limit") or 50)
        except (TypeError, ValueError):
            limit = 50
        try:
            offset = int(qp.get("offset") or 0)
        except (TypeError, ValueError):
            offset = 0
        return _json(
            svc.list_conversations(
                profile=qp.get("profile") or "all",
                limit=limit,
                offset=offset,
            )
        )

    @mcp.custom_route("/api/conversations/{conversation_id}", methods=["GET"])
    async def api_get_conversation(request: Request) -> Response:
        cid = request.path_params.get("conversation_id") or ""
        try:
            limit = int(request.query_params.get("limit") or 400)
        except (TypeError, ValueError):
            limit = 400
        result = svc.get_conversation(cid, limit=limit)
        return _json(result, 200 if result.get("ok") else 404)

    @mcp.custom_route("/api/ingest", methods=["POST"])
    async def api_ingest(request: Request) -> Response:
        try:
            body = await request.json()
        except Exception:
            return _json({"ok": False, "error": "invalid JSON"}, 400)
        if not isinstance(body, dict):
            return _json({"ok": False, "error": "invalid JSON"}, 400)
        result = svc.ingest(
            title=str(body.get("title") or ""),
            conversation_id=str(body.get("conversation_id") or ""),
            payload=str(body.get("payload") or ""),
            source_note=str(body.get("source_note") or "rest"),
        )
        status = 200 if result.get("ok") else (403 if result.get("error") == "ingest_disabled" else 400)
        return _json(result, status)

    return mcp


def build_http_app(cfg: Config, svc: VaultService | None = None):
    """Starlette app: REST + MCP /mcp, wrapped in real bearer-token auth."""
    svc = svc or VaultService(cfg)
    mcp = build_mcp(svc)
    app = mcp.streamable_http_app(host=cfg.host, streamable_http_path="/mcp")
    # Middleware is prepended; added last so it runs first on the way in.
    app.add_middleware(BearerAuthMiddleware, token=cfg.token)
    app.state.vault = svc
    app.state.config = cfg
    return app


def serve_http(cfg: Config) -> None:
    import uvicorn

    from .config import assert_bind_safe

    assert_bind_safe(cfg)
    if not cfg.token:
        raise SystemExit(
            "Refusing to start HTTP: GHOSTLIGHT_MCP_TOKEN is empty. "
            "Run `python -m ghostlight_vault gen-token` or set the env var. "
            "Stdio mode (--stdio) does not require a token."
        )
    svc = VaultService(cfg)
    app = build_http_app(cfg, svc)
    print(
        f"Ghostlight Vault v{__version__}  http://{cfg.host}:{cfg.port}/mcp  "
        f"(REST /api/*, ingest={'on' if cfg.allow_ingest else 'off'})",
        flush=True,
    )
    uvicorn.run(app, host=cfg.host, port=cfg.port, log_level="info")


def serve_stdio(cfg: Config) -> None:
    svc = VaultService(cfg)
    mcp = build_mcp(svc)
    mcp.run(transport="stdio")
