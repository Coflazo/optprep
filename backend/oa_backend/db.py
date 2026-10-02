"""SQLite storage: answer events (the analytics input), exam runs, and the latest
full client state snapshot (backup / cross-browser sync)."""
from __future__ import annotations

import json
import sqlite3
import threading
import time
from collections.abc import Iterable
from pathlib import Path
from typing import Any

SCHEMA = """
CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY,
  at REAL NOT NULL,
  section TEXT NOT NULL,
  family TEXT NOT NULL,
  correct INTEGER NOT NULL,
  ms REAL NOT NULL DEFAULT 0,
  difficulty INTEGER,
  confidence REAL,
  score REAL
);
CREATE INDEX IF NOT EXISTS answers_section ON answers(section, family);
CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY,
  at REAL NOT NULL,
  section TEXT NOT NULL,
  mode TEXT NOT NULL,
  score REAL NOT NULL,
  max REAL NOT NULL,
  payload TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at REAL NOT NULL
);
"""


class Database:
    """Thread-safe wrapper; the HTTP server handles requests on several threads."""

    def __init__(self, path: Path | str) -> None:
        self._conn = sqlite3.connect(str(path), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._lock = threading.Lock()
        with self._lock, self._conn:
            self._conn.executescript(SCHEMA)
            self._migrate()

    def _migrate(self) -> None:
        """v2: answers carry the item id, mode, hints and the belief behind a miss."""
        if self._conn.execute("PRAGMA user_version").fetchone()[0] >= 2:
            return
        have = {r[1] for r in self._conn.execute("PRAGMA table_info(answers)")}
        for col, kind in (("item_id", "TEXT"), ("mode", "TEXT"), ("hints", "INTEGER"), ("belief", "TEXT")):
            if col not in have:
                self._conn.execute(f"ALTER TABLE answers ADD COLUMN {col} {kind}")
        self._conn.execute("PRAGMA user_version = 2")

    def add_answers(self, rows: Iterable[dict[str, Any]]) -> int:
        clean = []
        for r in rows:
            for key in ("section", "family", "correct"):
                if key not in r:
                    raise ValueError(f"answer row missing {key}")
            clean.append((
                float(r.get("at") or time.time()), str(r["section"]), str(r["family"]), 1 if r["correct"] else 0,
                float(r.get("ms") or 0), r.get("difficulty"), r.get("confidence"),
                float(r["score"]) if r.get("score") is not None else (1.0 if r["correct"] else 0.0),
                r.get("item_id"), r.get("mode"), r.get("hints"), r.get("belief"),
            ))
        with self._lock, self._conn:
            self._conn.executemany(
                "INSERT INTO answers (at, section, family, correct, ms, difficulty, confidence, score, item_id, mode, hints, belief)"
                " VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", clean)
        return len(clean)

    def answers(self, section: str | None = None) -> list[dict[str, Any]]:
        q, args = "SELECT * FROM answers", ()
        if section:
            q, args = q + " WHERE section = ?", (section,)
        with self._lock:
            rows = self._conn.execute(q + " ORDER BY at, id", args).fetchall()
        return [{**dict(r), "correct": bool(r["correct"])} for r in rows]

    def add_run(self, run: dict[str, Any]) -> None:
        for key in ("section", "mode", "score", "max"):
            if key not in run:
                raise ValueError(f"run missing {key}")
        with self._lock, self._conn:
            self._conn.execute(
                "INSERT INTO runs (at, section, mode, score, max, payload) VALUES (?,?,?,?,?,?)",
                (float(run.get("finishedAt", time.time() * 1000)) / 1000, run["section"], run["mode"],
                 float(run["score"]), float(run["max"]), json.dumps(run)))

    def runs(self, section: str | None = None, mode: str | None = None) -> list[dict[str, Any]]:
        q, args = "SELECT * FROM runs WHERE 1=1", []
        if section:
            q += " AND section = ?"; args.append(section)
        if mode:
            q += " AND mode = ?"; args.append(mode)
        with self._lock:
            rows = self._conn.execute(q + " ORDER BY at, id", args).fetchall()
        return [dict(r) for r in rows]

    def put_state(self, state: dict[str, Any]) -> None:
        with self._lock, self._conn:
            self._conn.execute(
                "INSERT INTO state (key, value, updated_at) VALUES ('client', ?, ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
                (json.dumps(state), time.time()))

    def get_state(self) -> dict[str, Any] | None:
        with self._lock:
            row = self._conn.execute("SELECT value FROM state WHERE key = 'client'").fetchone()
        return json.loads(row["value"]) if row else None
