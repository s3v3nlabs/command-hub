"""CLI: serve, import, gen-token, smoke.

  python -m ghostlight_vault serve
  python -m ghostlight_vault serve --stdio
  python -m ghostlight_vault import path/to/conversations.json
  python -m ghostlight_vault gen-token
  python -m ghostlight_vault smoke
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from . import __publisher__, __version__
from .auth import generate_token, write_token_file
from .config import load_config


def _add_common(p: argparse.ArgumentParser) -> None:
    p.add_argument(
        "--vault",
        default=os.environ.get("GHOSTLIGHT_VAULT"),
        help="Vault root (env GHOSTLIGHT_VAULT). Index lives at <vault>/index/vault.sqlite3",
    )


def cmd_serve(args: argparse.Namespace) -> int:
    cfg = load_config(
        vault=args.vault,
        host=args.host,
        port=args.port,
        allow_ingest=True if args.allow_ingest else None,
        token=os.environ.get("GHOSTLIGHT_MCP_TOKEN"),
    )
    if args.allow_ingest:
        cfg.allow_ingest = True
    from .server import serve_http, serve_stdio

    if args.stdio:
        serve_stdio(cfg)
        return 0
    serve_http(cfg)
    return 0


def cmd_import(args: argparse.Namespace) -> int:
    from .importer import import_export

    cfg = load_config(vault=args.vault)
    dest = cfg.conversations_dir if not args.no_write_json else None
    result = import_export(
        source=Path(args.source),
        db_path=cfg.db_path,
        conversations_dir=dest,
        profile=args.profile,
        source_tag=args.source_tag,
        rebuild=args.rebuild,
    )
    print(json.dumps(result, indent=2))
    return 0 if result.get("ok") else 1


def cmd_gen_token(args: argparse.Namespace) -> int:
    path = Path(args.out).expanduser()
    if path.exists() and not args.force:
        print(f"token file already exists: {path} (use --force to rotate)", file=sys.stderr)
        return 1
    write_token_file(path)
    print(f"Wrote a new bearer token to {path} (mode 0600).")
    print("Export it with:  export GHOSTLIGHT_MCP_TOKEN=\"$(cat %s)\"" % path)
    print("The token itself is not printed.")
    return 0


def cmd_smoke(args: argparse.Namespace) -> int:
    from .smoke import run_smoke

    return run_smoke(port=args.port)


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="ghostlight_vault",
        description=f"Ghostlight Vault v{__version__} — {__publisher__}",
    )
    p.add_argument("--version", action="version", version=f"ghostlight-vault {__version__}")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("serve", help="Run the MCP + REST server")
    _add_common(s)
    s.add_argument("--stdio", action="store_true", help="MCP over stdio (no HTTP, no token required)")
    s.add_argument("--host", default=None, help="Bind host (default 127.0.0.1)")
    s.add_argument("--port", type=int, default=None, help="Bind port (default 8765)")
    s.add_argument(
        "--allow-ingest",
        action="store_true",
        help="Enable write/ingest tools (staged ladder; off by default)",
    )
    s.set_defaults(func=cmd_serve)

    i = sub.add_parser("import", help="Index a ChatGPT conversations.json export")
    _add_common(i)
    i.add_argument("source", help="conversations.json, an export directory, or a zip")
    i.add_argument("--profile", default="self")
    i.add_argument("--source-tag", default="chatgpt-export")
    i.add_argument("--rebuild", action="store_true", help="Drop and recreate the index")
    i.add_argument("--no-write-json", action="store_true", help="Do not write per-conversation JSON copies")
    i.set_defaults(func=cmd_import)

    g = sub.add_parser("gen-token", help="Generate a bearer token file (does not print the token)")
    g.add_argument("--out", default=".bearer_token")
    g.add_argument("--force", action="store_true")
    g.set_defaults(func=cmd_gen_token)

    k = sub.add_parser("smoke", help="Index a synthetic fixture, search (incl. 11:30), check auth")
    k.add_argument("--port", type=int, default=0, help="HTTP port (0 = ephemeral)")
    k.set_defaults(func=cmd_smoke)
    return p


def main(argv: list[str] | None = None) -> int:
    raw = list(sys.argv[1:] if argv is None else argv)
    # Convenience: `--stdio` / `--host` without a subcommand means `serve`.
    flags_only = raw and raw[0] not in {
        "serve", "import", "gen-token", "smoke", "-h", "--help", "--version",
    } and raw[0].startswith("-") and raw[0] not in {"-h", "--help", "--version"}
    if flags_only:
        raw = ["serve", *raw]
    args = build_parser().parse_args(raw)
    return int(args.func(args) or 0)


if __name__ == "__main__":
    raise SystemExit(main())
