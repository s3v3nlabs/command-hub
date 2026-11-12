"""SQLite index helpers. Compatible with the original Ghostlight schema
(conversations + messages_fts) and with the packaged schema that also
has a structured `messages` table.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT,
    create_time TEXT,
    update_time TEXT,
    message_count INTEGER,
    path TEXT,
    profile TEXT,
    source TEXT
);
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY,
    message_id TEXT,
    conversation_id TEXT NOT NULL,
    role TEXT,
    text TEXT,
    create_time TEXT
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_time ON messages(create_time);
"""

FTS_SQL = """
CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
    conversation_id UNINDEXED,
    role UNINDEXED,
    text,
    create_time UNINDEXED
);
"""


def connect(db_path: Path, readonly: bool = False) -> sqlite3.Connection:
    db_path = Path(db_path)
    if readonly:
        if not db_path.exists():
            raise FileNotFoundError(db_path)
        uri = f"file:{db_path}?mode=ro"
        con = sqlite3.connect(uri, uri=True)
    else:
        db_path.parent.mkdir(parents=True, exist_ok=True)
        con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA busy_timeout=5000")
    con.execute("PRAGMA foreign_keys=ON")
    return con


def init_schema(con: sqlite3.Connection) -> None:
    con.executescript(SCHEMA)
    # FTS5 table: CREATE VIRTUAL TABLE IF NOT EXISTS is a no-op when a
    # previous index (possibly with the same columns) already exists.
    try:
        con.execute(FTS_SQL)
    except sqlite3.OperationalError:
        # Existing FTS from an older vault — leave it alone.
        pass
    _ensure_column(con, "conversations", "profile", "TEXT")
    _ensure_column(con, "conversations", "source", "TEXT")
    con.commit()


def _ensure_column(con: sqlite3.Connection, table: str, column: str, decl: str) -> None:
    cols = {r[1] for r in con.execute(f"PRAGMA table_info({table})").fetchall()}
    if column not in cols:
        con.execute(f"ALTER TABLE {table} ADD COLUMN {column} {decl}")


def has_table(con: sqlite3.Connection, name: str) -> bool:
    row = con.execute(
        "SELECT 1 FROM sqlite_master WHERE type IN ('table','view') AND name = ?",
        (name,),
    ).fetchone()
    return row is not None


def has_messages_table(con: sqlite3.Connection) -> bool:
    return has_table(con, "messages")
