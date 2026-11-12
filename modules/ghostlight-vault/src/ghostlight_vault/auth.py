"""Bearer-token auth for HTTP (MCP and REST). Fail closed when no token is set."""

from __future__ import annotations

import hmac
import secrets
from pathlib import Path

from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from .config import OPEN_PATHS


def generate_token() -> str:
    return secrets.token_urlsafe(32)


def write_token_file(path: Path, token: str | None = None) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    tok = token or generate_token()
    path.write_text(tok + "\n", encoding="utf-8")
    try:
        path.chmod(0o600)
    except OSError:
        pass
    return tok


def tokens_match(presented: str, expected: str) -> bool:
    if not presented or not expected:
        return False
    a = presented.encode("utf-8")
    b = expected.encode("utf-8")
    if len(a) != len(b):
        # Keep a constant-time compare in the equal-length path only;
        # length mismatch is an immediate reject.
        return False
    return hmac.compare_digest(a, b)


def extract_bearer(headers: dict[str, str]) -> str:
    auth = headers.get("authorization") or ""
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return (headers.get("x-ghostlight-token") or "").strip()


class BearerAuthMiddleware:
    """Pure ASGI middleware so Streamable HTTP / SSE bodies are not buffered."""

    def __init__(self, app: ASGIApp, token: str) -> None:
        self.app = app
        self.token = token

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        path = scope.get("path") or ""
        method = (scope.get("method") or "GET").upper()
        if method == "OPTIONS" or path in OPEN_PATHS:
            await self.app(scope, receive, send)
            return
        headers = {
            k.decode("latin-1").lower(): v.decode("latin-1")
            for k, v in (scope.get("headers") or [])
        }
        if not self.token:
            resp = JSONResponse(
                {
                    "ok": False,
                    "error": "server_misconfigured",
                    "detail": "GHOSTLIGHT_MCP_TOKEN is not set. Refusing HTTP requests.",
                },
                status_code=503,
            )
            await resp(scope, receive, send)
            return
        presented = extract_bearer(headers)
        if not tokens_match(presented, self.token):
            resp = JSONResponse(
                {"ok": False, "error": "unauthorized"},
                status_code=401,
                headers={"WWW-Authenticate": "Bearer"},
            )
            await resp(scope, receive, send)
            return
        await self.app(scope, receive, send)
