"""Build a SQLite/FTS index from a standard ChatGPT data export.

Accepts:
  - a conversations.json file (the official OpenAI export)
  - a directory containing conversations.json
  - a zip of a ChatGPT export
  - a directory of per-conversation JSON files
"""

from __future__ import annotations

import json
import sqlite3
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from .db import connect, has_messages_table, init_schema


def utc_from_ts(ts: Any) -> str | None:
    if ts is None:
        return None
    if isinstance(ts, str) and "T" in ts:
        return ts
    try:
        return datetime.fromtimestamp(float(ts), tz=timezone.utc).isoformat()
    except (TypeError, ValueError, OSError, OverflowError):
        return str(ts) if ts else None


def extract_text_parts(message: dict | None) -> str:
    if not message:
        return ""
    content = message.get("content") or {}
    out: list[str] = []
    if isinstance(content, str):
        return content.strip()
    if not isinstance(content, dict):
        return ""
    for k in ("text", "content", "model_set_context"):
        v = content.get(k)
        if isinstance(v, str) and v.strip():
            out.append(v)
    thoughts = content.get("thoughts")
    if isinstance(thoughts, list):
        for t in thoughts:
            if isinstance(t, dict):
                for k in ("summary", "content"):
                    if isinstance(t.get(k), str) and t[k].strip():
                        out.append(t[k])
            elif isinstance(t, str) and t.strip():
                out.append(t)
    parts = content.get("parts") or []
    for p in parts:
        if isinstance(p, str):
            out.append(p)
        elif isinstance(p, dict):
            for k in ("text", "transcript", "content", "value", "alt_text"):
                if isinstance(p.get(k), str) and p[k].strip():
                    out.append(p[k])
    seen: set[str] = set()
    uniq: list[str] = []
    for s in out:
        if s not in seen:
            seen.add(s)
            uniq.append(s)
    return "\n".join(uniq).strip()


def walk_mapping(mapping: dict | None) -> list[dict]:
    """Linearize a ChatGPT conversation tree into ordered messages."""
    if not mapping:
        return []
    roots = [k for k, v in mapping.items() if not (v or {}).get("parent")]
    if not roots:
        roots = list(mapping.keys())
    ordered: list[dict] = []
    seen_nodes: set[str] = set()
    for r in roots:
        stack = [r]
        while stack:
            node_id = stack.pop()
            if node_id in seen_nodes:
                continue
            seen_nodes.add(node_id)
            node = mapping.get(node_id) or {}
            msg = node.get("message")
            role = (msg or {}).get("author", {}) or {}
            role_name = role.get("role") if isinstance(role, dict) else None
            if msg and role_name in {"user", "assistant", "system", "tool"}:
                ordered.append(
                    {
                        "id": msg.get("id") or node_id,
                        "role": role_name,
                        "create_time": utc_from_ts(msg.get("create_time")),
                        "text": extract_text_parts(msg),
                    }
                )
            children = list(node.get("children") or [])
            # Preserve original order by pushing reversed (DFS preorder).
            for child in reversed(children):
                stack.append(child)
    # Stable-sort by create_time when present, keeping walk order as tiebreak.
    def sort_key(m: dict) -> tuple:
        return (m.get("create_time") or "",)

    indexed = list(enumerate(ordered))
    indexed.sort(key=lambda iv: (sort_key(iv[1]), iv[0]))
    return [m for _, m in indexed]


def _load_conversations_from_json(data: Any) -> list[dict]:
    if isinstance(data, list):
        return [c for c in data if isinstance(c, dict)]
    if isinstance(data, dict):
        if "mapping" in data and ("id" in data or "title" in data):
            return [data]
        for key in ("conversations", "items", "data"):
            if isinstance(data.get(key), list):
                return [c for c in data[key] if isinstance(c, dict)]
    return []


def load_export(source: Path) -> list[dict]:
    source = Path(source)
    if not source.exists():
        raise FileNotFoundError(source)
    if source.is_file() and source.suffix.lower() == ".zip":
        with zipfile.ZipFile(source) as zf:
            names = [n for n in zf.namelist() if n.endswith("conversations.json")]
            if not names:
                raise ValueError("zip does not contain conversations.json")
            with zf.open(names[0]) as fh:
                data = json.loads(fh.read().decode("utf-8"))
        return _load_conversations_from_json(data)
    if source.is_file():
        data = json.loads(source.read_text(encoding="utf-8"))
        convs = _load_conversations_from_json(data)
        if convs:
            return convs
        raise ValueError(f"unrecognized export JSON: {source}")
    # directory
    direct = source / "conversations.json"
    if direct.exists():
        return load_export(direct)
    convs: list[dict] = []
    for p in sorted(source.rglob("*.json")):
        if p.name.startswith("."):
            continue
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        convs.extend(_load_conversations_from_json(data))
    if not convs:
        raise ValueError(f"no conversations found under {source}")
    return convs


def _upsert_conversation(
    con: sqlite3.Connection,
    conv: dict,
    dest: Path | None,
    profile: str,
    source_tag: str,
    write_messages: bool,
) -> int:
    cid = str(conv.get("id") or conv.get("conversation_id") or "")
    if not cid:
        return 0
    title = conv.get("title") or conv.get("name") or "(untitled)"
    create_time = utc_from_ts(conv.get("create_time"))
    update_time = utc_from_ts(conv.get("update_time") or conv.get("create_time"))
    mapping = conv.get("mapping")
    messages = walk_mapping(mapping) if mapping else list(conv.get("messages") or [])
    # normalize alternate message shape
    norm: list[dict] = []
    for m in messages:
        if not isinstance(m, dict):
            continue
        text = m.get("text") if "text" in m else extract_text_parts(m)
        role = m.get("role") or ((m.get("author") or {}) or {}).get("role")
        if not text:
            continue
        norm.append(
            {
                "id": m.get("id") or m.get("message_id"),
                "role": role or "unknown",
                "create_time": utc_from_ts(m.get("create_time")),
                "text": text,
            }
        )
    path = None
    if dest is not None:
        dest.mkdir(parents=True, exist_ok=True)
        safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in cid)[:120]
        out = dest / f"{safe}.json"
        out.write_text(
            json.dumps(
                {
                    "id": cid,
                    "title": title,
                    "create_time": create_time,
                    "update_time": update_time,
                    "messages": norm,
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )
        path = str(out)

    con.execute(
        """
        INSERT INTO conversations (id, title, create_time, update_time, message_count, path, profile, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            title=excluded.title,
            create_time=excluded.create_time,
            update_time=excluded.update_time,
            message_count=excluded.message_count,
            path=excluded.path,
            profile=excluded.profile,
            source=excluded.source
        """,
        (cid, title, create_time, update_time, len(norm), path, profile, source_tag),
    )
    con.execute("DELETE FROM messages_fts WHERE conversation_id = ?", (cid,))
    if write_messages:
        con.execute("DELETE FROM messages WHERE conversation_id = ?", (cid,))
    for m in norm:
        mid = m.get("id")
        if write_messages:
            cur = con.execute(
                "INSERT INTO messages (message_id, conversation_id, role, text, create_time) "
                "VALUES (?, ?, ?, ?, ?)",
                (mid, cid, m["role"], m["text"], m["create_time"]),
            )
            _ = cur.lastrowid
        con.execute(
            "INSERT INTO messages_fts (conversation_id, role, text, create_time) VALUES (?, ?, ?, ?)",
            (cid, m["role"], m["text"], m["create_time"]),
        )
    return len(norm)


def import_export(
    source: Path,
    db_path: Path,
    conversations_dir: Path | None = None,
    profile: str = "self",
    source_tag: str = "chatgpt-export",
    rebuild: bool = False,
) -> dict:
    convs = load_export(Path(source))
    con = connect(db_path, readonly=False)
    try:
        if rebuild:
            for table in ("messages_fts", "messages", "conversations"):
                try:
                    con.execute(f"DROP TABLE IF EXISTS {table}")
                except sqlite3.OperationalError:
                    pass
            con.commit()
        init_schema(con)
        write_messages = has_messages_table(con)
        total_msgs = 0
        imported = 0
        for conv in convs:
            n = _upsert_conversation(
                con, conv, conversations_dir, profile, source_tag, write_messages
            )
            if n or conv.get("id"):
                imported += 1
                total_msgs += n
        con.commit()
        return {
            "ok": True,
            "conversations": imported,
            "messages": total_msgs,
            "db": str(db_path),
            "source": str(source),
        }
    finally:
        con.close()
