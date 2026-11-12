"""Vault operations used by both MCP tools and the REST API."""

from __future__ import annotations

import hashlib
import json
import sqlite3
import time
from pathlib import Path
from typing import Any

from . import __version__
from .config import Config
from .db import connect, has_messages_table, has_table, init_schema
from .evidence import HIT_LABEL, META_LABEL, annotate_hit
from .search import search as search_index


class VaultService:
    def __init__(self, cfg: Config) -> None:
        self.cfg = cfg

    def _connect(self, readonly: bool = True) -> sqlite3.Connection:
        if not readonly:
            self.cfg.db_path.parent.mkdir(parents=True, exist_ok=True)
            con = connect(self.cfg.db_path, readonly=False)
            init_schema(con)
            return con
        return connect(self.cfg.db_path, readonly=True)

    def db_exists(self) -> bool:
        return self.cfg.db_path.exists()

    def stats(self) -> dict[str, Any]:
        out: dict[str, Any] = {
            "ok": True,
            "version": __version__,
            "db_exists": self.db_exists(),
            "ingest_enabled": self.cfg.allow_ingest,
            "evidence_labels": {
                "hits": HIT_LABEL,
                "metadata": META_LABEL,
            },
        }
        if not self.db_exists():
            out["conversations"] = 0
            out["messages_fts"] = 0
            return out
        con = self._connect(readonly=True)
        try:
            if has_table(con, "conversations"):
                out["conversations"] = con.execute(
                    "SELECT COUNT(*) FROM conversations"
                ).fetchone()[0]
                try:
                    rows = con.execute(
                        "SELECT profile, COUNT(*) FROM conversations GROUP BY profile"
                    ).fetchall()
                    out["by_profile"] = {(r[0] or "self"): r[1] for r in rows}
                except sqlite3.Error:
                    pass
            else:
                out["conversations"] = 0
            if has_table(con, "messages_fts"):
                out["messages_fts"] = con.execute(
                    "SELECT COUNT(*) FROM messages_fts"
                ).fetchone()[0]
            else:
                out["messages_fts"] = 0
            if has_messages_table(con):
                out["messages"] = con.execute(
                    "SELECT COUNT(*) FROM messages"
                ).fetchone()[0]
        finally:
            con.close()
        return out

    def search(
        self,
        query: str,
        limit: int = 20,
        role: str | None = None,
        conversation_id: str | None = None,
        since: str | None = None,
        until: str | None = None,
    ) -> dict[str, Any]:
        if not self.db_exists():
            return {
                "ok": False,
                "error": "vault db missing — import a ChatGPT export first",
                "query": query,
                "count": 0,
                "hits": [],
            }
        con = self._connect(readonly=True)
        try:
            result = search_index(
                con,
                query,
                limit=limit,
                role=role,
                conversation_id=conversation_id,
                since=since,
                until=until,
            )
            result["ok"] = "error" not in result
            return result
        finally:
            con.close()

    def list_conversations(
        self,
        profile: str = "all",
        limit: int = 50,
        offset: int = 0,
    ) -> dict[str, Any]:
        limit = max(1, min(int(limit or 50), 500))
        offset = max(0, int(offset or 0))
        if not self.db_exists():
            return {
                "ok": False,
                "error": "vault db missing",
                "profile": profile,
                "count": 0,
                "conversations": [],
            }
        con = self._connect(readonly=True)
        try:
            if not has_table(con, "conversations"):
                return {
                    "ok": False,
                    "error": "conversations table missing",
                    "count": 0,
                    "conversations": [],
                }
            sql = (
                "SELECT id, title, create_time, update_time, message_count, profile, source "
                "FROM conversations "
            )
            params: list[Any]
            if profile in (None, "", "all"):
                cur = con.execute(
                    sql + "ORDER BY update_time DESC LIMIT ? OFFSET ?",
                    (limit, offset),
                )
            elif profile == "self":
                cur = con.execute(
                    sql
                    + "WHERE profile IS NULL OR profile = '' OR profile = 'self' "
                    + "ORDER BY update_time DESC LIMIT ? OFFSET ?",
                    (limit, offset),
                )
            else:
                cur = con.execute(
                    sql + "WHERE profile = ? ORDER BY update_time DESC LIMIT ? OFFSET ?",
                    (profile, limit, offset),
                )
            rows = [
                {
                    "id": r["id"],
                    "title": r["title"],
                    "create_time": r["create_time"],
                    "update_time": r["update_time"],
                    "message_count": r["message_count"],
                    "profile": r["profile"] or "self",
                    "source": r["source"] if "source" in r.keys() else None,
                    "evidence": META_LABEL,
                }
                for r in cur.fetchall()
            ]
            return {
                "ok": True,
                "profile": profile,
                "count": len(rows),
                "conversations": rows,
            }
        finally:
            con.close()

    def get_conversation(self, conversation_id: str, limit: int = 400) -> dict[str, Any]:
        limit = max(1, min(int(limit or 400), 2000))
        cid = (conversation_id or "").strip()
        if not cid:
            return {"ok": False, "error": "conversation_id required"}
        if not self.db_exists():
            return {"ok": False, "error": "vault db missing"}
        con = self._connect(readonly=True)
        try:
            meta = None
            if has_table(con, "conversations"):
                row = con.execute(
                    "SELECT id, title, create_time, update_time, message_count, profile, source "
                    "FROM conversations WHERE id = ?",
                    (cid,),
                ).fetchone()
                if row:
                    meta = {
                        "id": row["id"],
                        "title": row["title"],
                        "create_time": row["create_time"],
                        "update_time": row["update_time"],
                        "message_count": row["message_count"],
                        "profile": row["profile"] or "self",
                        "source": row["source"] if "source" in row.keys() else None,
                        "evidence": META_LABEL,
                    }
            messages: list[dict] = []
            if has_messages_table(con):
                cur = con.execute(
                    "SELECT message_id, role, text, create_time FROM messages "
                    "WHERE conversation_id = ? ORDER BY create_time, id LIMIT ?",
                    (cid, limit),
                )
            elif has_table(con, "messages_fts"):
                cur = con.execute(
                    "SELECT role, text, create_time FROM messages_fts "
                    "WHERE conversation_id = ? LIMIT ?",
                    (cid, limit),
                )
            else:
                cur = None
            if cur is not None:
                for r in cur.fetchall():
                    keys = r.keys()
                    messages.append(
                        annotate_hit(
                            {
                                "message_id": r["message_id"] if "message_id" in keys else None,
                                "role": r["role"],
                                "text": r["text"],
                                "create_time": r["create_time"],
                            }
                        )
                    )
            if meta is None and not messages:
                return {"ok": False, "error": "conversation not found", "id": cid}
            return {
                "ok": True,
                "conversation": meta or {"id": cid, "evidence": META_LABEL},
                "message_count": len(messages),
                "messages": messages,
            }
        finally:
            con.close()

    def ingest(
        self,
        title: str,
        conversation_id: str,
        payload: str,
        source_note: str = "connector",
    ) -> dict[str, Any]:
        if not self.cfg.allow_ingest:
            return {
                "ok": False,
                "error": "ingest_disabled",
                "detail": (
                    "Write tools are staged-ladder gated and off by default. "
                    "Restart with --allow-ingest or GHOSTLIGHT_ALLOW_INGEST=1."
                ),
            }
        ts = time.strftime("%Y%m%dT%H%M%S")
        safe_id = "".join(
            c if c.isalnum() or c in "-_" else "_"
            for c in (conversation_id or "unknown")
        )[:80]
        raw = (payload or "").encode("utf-8", errors="replace")
        if len(raw) > 8 * 1024 * 1024:
            return {"ok": False, "error": "payload too large (8 MiB max)"}
        digest = hashlib.sha256(raw).hexdigest()
        meta = {
            "title": title,
            "conversation_id": conversation_id,
            "source_note": source_note,
            "ingested_at": ts,
            "sha256": digest,
            "bytes": len(raw),
            "evidence": META_LABEL,
        }
        base = self.cfg.ingest_dir / f"{ts}_{safe_id}"
        base.mkdir(parents=True, exist_ok=True)
        (base / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
        body_name = "conversation.json"
        try:
            json.loads(payload)
        except Exception:
            body_name = "conversation.md"
        (base / body_name).write_bytes(raw)
        ledger = self.cfg.ingest_dir / "LEDGER.jsonl"
        with ledger.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(meta) + "\n")
        return {"ok": True, "path": str(base), "meta": meta}

    def ready(self) -> tuple[bool, str]:
        if not self.db_exists():
            return False, "db missing"
        try:
            con = self._connect(readonly=True)
            con.execute("SELECT 1").fetchone()
            con.close()
            return True, "ready"
        except sqlite3.Error as exc:
            return False, str(exc)
