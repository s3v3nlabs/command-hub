"""Robust vault search.

FTS5 treats colons as column filters, so a query like ``11:30`` returns 0
hits (or errors) even when the text is in the index. We:

1. Quote each user token so punctuation is literal (``"11:30"``).
2. AND together unquoted multi-word queries.
3. Fall back to a LIKE scan when FTS errors or returns nothing.
4. Apply role / conversation / date-range filters in SQL in both paths.
5. Return a snippet with surrounding context and an evidence label.
"""

from __future__ import annotations

import re
import sqlite3
from typing import Any

from .db import has_table
from .evidence import annotate_hit

_OPS = {"AND", "OR", "NOT", "NEAR"}
_TOKEN_RE = re.compile(r'"[^"]*"|\S+')
_LIKE_ESCAPE = "\\"


def escape_like(term: str) -> str:
    return (
        term.replace(_LIKE_ESCAPE, _LIKE_ESCAPE + _LIKE_ESCAPE)
        .replace("%", _LIKE_ESCAPE + "%")
        .replace("_", _LIKE_ESCAPE + "_")
    )


def quote_fts_token(tok: str) -> str:
    return '"' + tok.replace('"', '""') + '"'


def to_fts_query(raw: str) -> str:
    """Sanitize a user query into a safe FTS5 MATCH expression.

    Tokens with punctuation (``11:30``, ``foo-bar``) are quoted so FTS5
    does not treat ``:`` as a column filter. Bare multi-word input is
    AND-joined. Existing operators (AND/OR/NOT) and already-quoted
    phrases are preserved.
    """
    raw = (raw or "").strip()
    if not raw:
        return ""
    parts = _TOKEN_RE.findall(raw)
    out: list[str] = []
    pending_and = False
    for p in parts:
        up = p.upper()
        if p.startswith('"') and p.endswith('"') and len(p) >= 2:
            inner = p[1:-1].replace('"', '""')
            token = f'"{inner}"'
            if pending_and:
                out.append("AND")
            out.append(token)
            pending_and = True
        elif up in _OPS:
            out.append(up)
            pending_and = False
        elif p in {"(", ")"}:
            out.append(p)
            pending_and = p == ")"
        else:
            cleaned = p.replace('"', "")
            if not cleaned:
                continue
            if pending_and:
                out.append("AND")
            out.append(quote_fts_token(cleaned))
            pending_and = True
    return " ".join(out)


def like_terms(raw: str) -> list[str]:
    """Plain terms for a LIKE fallback (operators stripped)."""
    terms: list[str] = []
    for p in _TOKEN_RE.findall(raw or ""):
        if p.upper() in _OPS or p in {"(", ")"}:
            continue
        if p.startswith('"') and p.endswith('"') and len(p) >= 2:
            p = p[1:-1]
        p = p.strip()
        if p:
            terms.append(p)
    return terms


def make_snippet(text: str, terms: list[str], radius: int = 90) -> str:
    if not text:
        return ""
    hay = text
    low = hay.lower()
    pos = -1
    hit_len = 0
    for t in terms:
        i = low.find(t.lower())
        if i >= 0 and (pos < 0 or i < pos):
            pos = i
            hit_len = len(t)
    if pos < 0:
        body = hay[: radius * 2].replace("\n", " ")
        return (body + "…") if len(hay) > radius * 2 else body
    start = max(0, pos - radius)
    end = min(len(hay), pos + hit_len + radius)
    fragment = hay[start:end]
    marked = (
        fragment[: pos - start]
        + ">>>"
        + fragment[pos - start : pos - start + hit_len]
        + "<<<"
        + fragment[pos - start + hit_len :]
    )
    marked = marked.replace("\n", " ")
    prefix = "…" if start > 0 else ""
    suffix = "…" if end < len(hay) else ""
    return prefix + marked + suffix


def _filter_sql(
    role: str | None,
    conversation_id: str | None,
    since: str | None,
    until: str | None,
    alias: str = "m",
) -> tuple[str, list[Any]]:
    clauses: list[str] = []
    params: list[Any] = []
    if role:
        clauses.append(f"{alias}.role = ?")
        params.append(role)
    if conversation_id:
        clauses.append(f"{alias}.conversation_id = ?")
        params.append(conversation_id)
    if since:
        clauses.append(f"{alias}.create_time >= ?")
        params.append(since)
    if until:
        clauses.append(f"{alias}.create_time <= ?")
        params.append(until)
    sql = (" AND " + " AND ".join(clauses)) if clauses else ""
    return sql, params


def _row_to_hit(row: sqlite3.Row, terms: list[str], backend: str) -> dict:
    keys = row.keys()
    text = row["snip"] if "snip" in keys and row["snip"] else None
    if not text:
        raw = row["text"] if "text" in keys else ""
        text = make_snippet(raw or "", terms)
    title = row["title"] if "title" in keys else None
    profile = row["profile"] if "profile" in keys else None
    return annotate_hit(
        {
            "conversation_id": row["conversation_id"],
            "role": row["role"],
            "snip": text,
            "create_time": row["create_time"],
            "title": title,
            "profile": profile or "self",
            "backend": backend,
        }
    )


def _join_conversations(con: sqlite3.Connection) -> str:
    if has_table(con, "conversations"):
        return " LEFT JOIN conversations c ON c.id = m.conversation_id "
    return " "


def search(
    con: sqlite3.Connection,
    query: str,
    limit: int = 20,
    role: str | None = None,
    conversation_id: str | None = None,
    since: str | None = None,
    until: str | None = None,
) -> dict:
    limit = max(1, min(int(limit or 20), 100))
    q = (query or "").strip()
    if not q:
        return {"query": query, "count": 0, "hits": [], "backend": None, "fts_query": ""}
    if not has_table(con, "messages_fts"):
        return {
            "query": query,
            "count": 0,
            "hits": [],
            "backend": None,
            "error": "messages_fts table missing — import an export first",
        }

    fts_q = to_fts_query(q)
    terms = like_terms(q)
    filt, filt_params = _filter_sql(role, conversation_id, since, until, "m")
    join = _join_conversations(con)
    hits: list[dict] = []
    backend = "fts"
    fts_error = None

    try:
        sql = (
            "SELECT m.conversation_id AS conversation_id, m.role AS role, "
            "snippet(messages_fts, 2, '>>>', '<<<', '…', 24) AS snip, "
            "m.create_time AS create_time, m.text AS text"
            + (
                ", c.title AS title, c.profile AS profile"
                if "conversations c" in join
                else ", NULL AS title, NULL AS profile"
            )
            + " FROM messages_fts m"
            + join
            + " WHERE messages_fts MATCH ?"
            + filt
            + " LIMIT ?"
        )
        rows = con.execute(sql, (fts_q, *filt_params, limit)).fetchall()
        hits = [_row_to_hit(r, terms, "fts") for r in rows]
    except sqlite3.Error as exc:
        fts_error = str(exc)
        hits = []

    if not hits:
        backend = "like"
        like_clauses = []
        like_params: list[Any] = []
        for t in terms:
            like_clauses.append("m.text LIKE ? ESCAPE ?")
            like_params.extend([f"%{escape_like(t)}%", _LIKE_ESCAPE])
        where = " AND ".join(like_clauses) if like_clauses else "1=0"
        sql = (
            "SELECT m.conversation_id AS conversation_id, m.role AS role, "
            "m.text AS text, m.create_time AS create_time"
            + (
                ", c.title AS title, c.profile AS profile"
                if "conversations c" in join
                else ", NULL AS title, NULL AS profile"
            )
            + " FROM messages_fts m"
            + join
            + " WHERE "
            + where
            + filt
            + " LIMIT ?"
        )
        try:
            rows = con.execute(sql, (*like_params, *filt_params, limit)).fetchall()
            hits = [_row_to_hit(r, terms, "like") for r in rows]
        except sqlite3.Error as exc:
            return {
                "query": query,
                "fts_query": fts_q,
                "count": 0,
                "hits": [],
                "backend": None,
                "error": fts_error or str(exc),
            }

    return {
        "query": query,
        "fts_query": fts_q,
        "count": len(hits),
        "hits": hits,
        "backend": backend if hits else ("like" if not fts_error else "error"),
        **({"fts_error": fts_error} if fts_error else {}),
    }
