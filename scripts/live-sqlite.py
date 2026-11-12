
#!/usr/bin/env python3
"""Real SQLite runner for Command Hub vault-streams. JSON in / JSON out."""
import json, os, sqlite3, sys, traceback
from pathlib import Path

DB = Path(os.environ.get("HUB_SQLITE_PATH") or Path(__file__).resolve().parents[1] / "local-data" / "vault-streams" / "hub.sqlite")
DB.parent.mkdir(parents=True, exist_ok=True)

SCHEMA = """
CREATE TABLE IF NOT EXISTS hub_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  source TEXT NOT NULL,
  kind TEXT NOT NULL,
  payload TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS osint_lookups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  target TEXT NOT NULL,
  kind TEXT NOT NULL,
  duration_ms INTEGER,
  result_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS operator_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  author TEXT NOT NULL,
  body TEXT NOT NULL
);
"""

def connect():
    conn = sqlite3.connect(str(DB), timeout=5)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.executescript(SCHEMA)
    return conn

def tables(conn):
    out = []
    for (name,) in conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"):
        cols = [{"name": r[1], "type": r[2] or "TEXT", "nullable": r[3] == 0, "isPrimary": r[5] == 1, "isForeign": False} for r in conn.execute(f"PRAGMA table_info({name})")]
        cnt = conn.execute(f"SELECT COUNT(*) FROM {name}").fetchone()[0]
        out.append({"name": name, "columns": cols, "rowCount": cnt})
    return out

def run_sql(conn, sql):
    sql = (sql or "").strip()
    if not sql:
        raise ValueError("sql required")
    if len(sql) > 8000:
        raise ValueError("sql too long")
    cur = conn.execute(sql)
    if sql.lstrip().lower().startswith(("select", "pragma", "with", "explain")):
        rows = cur.fetchall()
        cols = [d[0] for d in cur.description] if cur.description else []
        return {"columns": cols, "rows": [list(r) for r in rows], "rowCount": len(rows), "mutating": False}
    conn.commit()
    return {"columns": [], "rows": [], "rowCount": cur.rowcount if cur.rowcount is not None else 0, "mutating": True, "lastId": cur.lastrowid}

def main():
    try:
        req = json.load(sys.stdin)
    except Exception:
        req = {"op": "schema"}
    op = req.get("op") or "schema"
    try:
        conn = connect()
        if op == "schema":
            json.dump({"ok": True, "db": str(DB), "tables": tables(conn), "backend": "python sqlite3 (live)"}, sys.stdout)
        elif op == "query":
            result = run_sql(conn, req.get("sql") or "")
            json.dump({"ok": True, "db": str(DB), "result": result, "backend": "python sqlite3 (live)"}, sys.stdout, default=str)
        elif op == "insert_event":
            conn.execute(
                "INSERT INTO hub_events (ts, source, kind, payload) VALUES (datetime('now'), ?, ?, ?)",
                (req.get("source") or "hub", req.get("kind") or "note", json.dumps(req.get("payload") or {})),
            )
            conn.commit()
            json.dump({"ok": True, "id": conn.execute("SELECT last_insert_rowid()").fetchone()[0]}, sys.stdout)
        else:
            json.dump({"ok": False, "error": f"unknown op {op}"}, sys.stdout)
        conn.close()
    except Exception as e:
        json.dump({"ok": False, "error": str(e), "trace": traceback.format_exc()}, sys.stdout)
        sys.exit(0)

if __name__ == "__main__":
    main()
