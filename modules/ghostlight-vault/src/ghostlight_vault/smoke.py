"""Smoke test: index a tiny synthetic export, search (including '11:30'),
and verify HTTP auth is rejected without a token.

Uses an ephemeral port and a temporary vault so it never touches a real
index or the currently running Ghostlight process.
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
import threading
import time
from pathlib import Path

from . import __version__
from .auth import generate_token
from .config import load_config
from .importer import import_export
from .search import to_fts_query
from .service import VaultService

FIXTURE = Path(__file__).resolve().parents[2] / "fixtures" / "tiny_export.json"


def _http_get(url: str, token: str | None = None, timeout: float = 5.0):
    import urllib.error
    import urllib.request

    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read()
            return resp.status, body, dict(resp.headers)
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read(), dict(exc.headers)


def run_smoke(port: int = 0, fixture: Path | None = None) -> int:
    fixture = Path(fixture or FIXTURE)
    if not fixture.exists():
        print(f"FAIL: fixture missing: {fixture}", file=sys.stderr)
        return 2

    failures: list[str] = []

    def check(cond: bool, msg: str) -> None:
        if cond:
            print(f"  ok  {msg}")
        else:
            print(f"  FAIL {msg}")
            failures.append(msg)

    print(f"Ghostlight Vault smoke v{__version__}")
    print(f"  fixture: {fixture}")

    # --- FTS sanitizer unit check ---
    fts = to_fts_query("11:30 candy aisle")
    check(
        '"11:30"' in fts and "AND" in fts,
        f'TS sanitize quotes 11:30 → {fts}',
    )

    with tempfile.TemporaryDirectory(prefix="ghostlight-smoke-") as tmp:
        root = Path(tmp) / "vault"
        db = root / "index" / "vault.sqlite3"
        result = import_export(
            source=fixture,
            db_path=db,
            conversations_dir=root / "conversations",
            profile="self",
            source_tag="synthetic-fixture",
            rebuild=True,
        )
        check(result.get("ok") is True, f"import ok ({result.get('conversations')} convs, {result.get('messages')} msgs)")
        check((result.get("messages") or 0) >= 2, "imported at least 2 messages")

        token = generate_token()
        cfg = load_config(vault=root, host="127.0.0.1", port=port or 0, allow_ingest=False, token=token)
        # load_config overwrites port from env if we passed 0 and env is set; force.
        cfg.port = port or 0
        cfg.token = token
        svc = VaultService(cfg)

        # In-process search, including the FTS-breaker token.
        for query, expect in (
            ("11:30", "candy"),
            ("candy aisle", "11:30"),
            ("synthetic fixture", "synthetic"),
        ):
            found = svc.search(query, limit=10)
            hits = found.get("hits") or []
            blob = " ".join((h.get("snip") or "") for h in hits).lower()
            check(
                found.get("count", 0) > 0 and expect.lower() in blob,
                f"search {query!r} found {found.get('count')} hit(s) via {found.get('backend')} "
                f"(expect {expect!r} in snippet)",
            )

        # Role filter
        users = svc.search("11:30", limit=10, role="user")
        check(
            users.get("count", 0) > 0
            and all(h.get("role") == "user" for h in users.get("hits") or []),
            "role=user filter",
        )

        # Evidence labels
        hit = (svc.search("11:30").get("hits") or [{}])[0]
        check(hit.get("evidence") == "DOCUMENTED", "hit evidence label is DOCUMENTED")

        # Ingest gated
        ing = svc.ingest("t", "x", "payload")
        check(ing.get("ok") is False and ing.get("error") == "ingest_disabled", "ingest off by default")

        # --- HTTP auth + search ---
        from .server import build_http_app
        import uvicorn

        app = build_http_app(cfg, svc)
        # Pick an ephemeral port if 0.
        sock_port = cfg.port
        config = uvicorn.Config(app, host="127.0.0.1", port=sock_port or 0, log_level="warning")
        server = uvicorn.Server(config)

        thread = threading.Thread(target=server.run, daemon=True)
        thread.start()
        # Wait until the server has bound.
        deadline = time.time() + 8
        bound = 0
        while time.time() < deadline:
            if server.started:
                # uvicorn stores the actual sockets on server.servers
                try:
                    servers = getattr(server, "servers", None) or []
                    if servers:
                        bound = servers[0].sockets[0].getsockname()[1]
                    elif config.port:
                        bound = config.port
                except Exception:
                    pass
                if bound:
                    break
            time.sleep(0.05)
        if not bound:
            # Fallback: inspect the config after start (uvicorn may rewrite port)
            bound = int(getattr(config, "port", 0) or 0)
        check(bound > 0, f"HTTP server started on 127.0.0.1:{bound}")
        if bound:
            base = f"http://127.0.0.1:{bound}"
            st, body, _ = _http_get(f"{base}/healthz")
            check(st == 200 and body.decode().strip() == "live", f"/healthz unauthenticated → {st}")
            st, body, _ = _http_get(f"{base}/readyz")
            check(st == 200 and b"ready" in body, f"/readyz → {st} {body[:40]!r}")

            st, body, _ = _http_get(f"{base}/api/search?q=11:30")
            check(st == 401, f"search without token is 401 (got {st})")

            st, body, _ = _http_get(f"{base}/api/search?q=11:30", token="wrong-token-value-0000000000000000")
            check(st == 401, f"search with wrong token is 401 (got {st})")

            st, body, _ = _http_get(f"{base}/api/search?q=11:30", token=token)
            try:
                data = json.loads(body.decode())
            except Exception:
                data = {}
            check(
                st == 200 and data.get("count", 0) > 0,
                f"search with token → {st} count={data.get('count')} backend={data.get('backend')}",
            )

            st, body, _ = _http_get(f"{base}/api/stats", token=token)
            try:
                stats = json.loads(body.decode())
            except Exception:
                stats = {}
            check(st == 200 and stats.get("conversations", 0) >= 1, f"stats → {st} convs={stats.get('conversations')}")

        server.should_exit = True
        thread.join(timeout=4)

    if failures:
        print(f"\n{len(failures)} failure(s).")
        return 1
    print("\nAll smoke checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(run_smoke())
