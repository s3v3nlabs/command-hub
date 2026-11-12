"""Environment and CLI configuration. Binds to localhost by default."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765
OPEN_PATHS = frozenset({
    "/healthz",
    "/readyz",
    "/health",
    "/ready",
})


def _truthy(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


@dataclass
class Config:
    vault_root: Path
    token: str
    host: str
    port: int
    allow_ingest: bool
    allow_remote_bind: bool
    ingest_dir: Path

    @property
    def db_path(self) -> Path:
        return self.vault_root / "index" / "vault.sqlite3"

    @property
    def conversations_dir(self) -> Path:
        return self.vault_root / "conversations"


def load_config(
    vault: str | Path | None = None,
    host: str | None = None,
    port: int | None = None,
    allow_ingest: bool | None = None,
    token: str | None = None,
) -> Config:
    root = Path(
        vault
        or os.environ.get("GHOSTLIGHT_VAULT")
        or os.environ.get("GHOSTLIGHT_VAULT_ROOT")
        or "./data/vault"
    ).expanduser().resolve()
    raw_host = host or os.environ.get("GHOSTLIGHT_HOST") or DEFAULT_HOST
    raw_port = int(port or os.environ.get("GHOSTLIGHT_PORT") or DEFAULT_PORT)
    ingest = (
        allow_ingest
        if allow_ingest is not None
        else _truthy("GHOSTLIGHT_ALLOW_INGEST")
    )
    allow_remote = _truthy("GHOSTLIGHT_ALLOW_REMOTE")
    tok = (
        token
        if token is not None
        else (
            os.environ.get("GHOSTLIGHT_MCP_TOKEN")
            or os.environ.get("GHOSTLIGHT_VAULT_TOKEN")
            or ""
        )
    ).strip()
    ingest_dir = Path(
        os.environ.get(
            "GHOSTLIGHT_INGEST",
            str(root / "raw" / "connector_ingest"),
        )
    )
    return Config(
        vault_root=root,
        token=tok,
        host=raw_host,
        port=raw_port,
        allow_ingest=ingest,
        allow_remote_bind=allow_remote,
        ingest_dir=ingest_dir,
    )


def assert_bind_safe(cfg: Config) -> None:
    """Refuse non-loopback binds unless the operator explicitly opted in."""
    loopback = {"127.0.0.1", "localhost", "::1", "0:0:0:0:0:0:0:1"}
    if cfg.host not in loopback and cfg.host != "" and not cfg.allow_remote_bind:
        raise SystemExit(
            f"Refusing to bind to {cfg.host}: set GHOSTLIGHT_ALLOW_REMOTE=1 "
            "if you really want a non-loopback bind. Auth is required, but "
            "localhost-only is the default."
        )
