"""HTTP server: the static trainer plus a JSON API on 127.0.0.1.

    GET  /api/health            engine and database status
    POST /api/answers           [{section, family, correct, ms, difficulty?, confidence?, score?}]
    POST /api/runs              {section, mode, score, max, ...}
    GET  /api/state             last client state snapshot
    PUT  /api/state             store a client state snapshot (backup and cross-browser sync)
    GET  /api/analytics         forecasts, weakest families and calibration per section
    GET  /api/verification      latest library verification report
    GET  /api/banks/<name>      precomputed puzzle bank (Zap-N)
"""
from __future__ import annotations

import argparse
import http.server
import json
import re
from pathlib import Path
from typing import Any
from urllib.parse import unquote

from . import analytics
from .db import Database
from .engine import available as engine_available

REPO = Path(__file__).resolve().parents[2]
DATA = REPO / "backend" / "data"
MAX_BODY = 2_000_000
BANK_NAME = re.compile(r"^[a-z0-9-]{1,40}$")
SECTIONS = ["mm", "bto", "nl", "ll", "iv", "ob"]
# Only the app itself is served: never dot-directories (.git) or backend/engine/tools/tests files.
PRIVATE_DIRS = {"backend", "engine", "tools", "tests", "node_modules", "screenshots"}
# Every app file has a plain ASCII name; anything else (escapes left after decoding, backslashes,
# colons, '~' short names, non-ASCII look-alikes) is refused.
SAFE_SEGMENT = re.compile(r"^[a-z0-9_-][a-z0-9._-]*$")


def is_private(raw_path: str) -> bool:
    """True unless the request path names an ordinary app file.

    Decodes, then normalises, then case-folds before checking, so /%62ackend/... and
    /Backend/... (on a case-insensitive file system) cannot reach backend files.
    """
    path = unquote(raw_path.split("?", 1)[0].split("#", 1)[0])
    for part in (p.casefold() for p in path.replace("\\", "/").split("/") if p):
        # Leading dot: '.', '..', .git. Trailing dot: Windows reads 'backend.' as 'backend'.
        if not SAFE_SEGMENT.match(part) or part.endswith("."):
            return True
        if part in PRIVATE_DIRS or part.startswith("brag-output"):
            return True
    return False


def section_families(section: str, db: Database) -> list[str]:
    lib = DATA / "library" / f"{section}.json"
    if lib.exists():
        try:
            return json.loads(lib.read_text(encoding="utf-8"))["families"]
        except (OSError, KeyError, json.JSONDecodeError):
            pass
    return sorted({a["family"] for a in db.answers(section)})


def build_analytics(db: Database) -> dict[str, Any]:
    out: dict[str, Any] = {"sections": {}}
    all_rows = db.answers()
    for s in SECTIONS:
        rows = [r for r in all_rows if r["section"] == s]
        fams = section_families(s, db)
        if not rows or not fams:
            out["sections"][s] = {"answers": len(rows), "forecast": None, "weakest": []}
            continue
        out["sections"][s] = {
            "answers": len(rows),
            "forecast": analytics.forecast_section(s, rows, fams, seed=7),
            "weakest": analytics.weakest_families(s, rows, fams),
        }
    out["calibration"] = analytics.calibration([r for r in all_rows if r["section"] in ("bto", "nl")])
    return out


def make_handler(db: Database, root: Path):
    class Handler(http.server.SimpleHTTPRequestHandler):
        # Explicit types: the Windows registry can map .js to text/plain, which breaks ES modules.
        extensions_map = {
            **http.server.SimpleHTTPRequestHandler.extensions_map,
            ".js": "text/javascript",
            ".mjs": "text/javascript",
            ".webmanifest": "application/manifest+json",
        }

        def __init__(self, *a: Any, **kw: Any) -> None:
            super().__init__(*a, directory=str(root), **kw)

        def log_message(self, *args: Any) -> None:  # quiet
            pass

        # Browsers let any website send requests to 127.0.0.1. Two checks keep other
        # origins out: the Host header must name this server (defeats DNS rebinding),
        # and writes must be JSON (a cross-origin JSON write needs a CORS preflight,
        # which this server never grants).
        def _host_ok(self) -> bool:
            port = self.server.server_address[1]
            return (self.headers.get("Host") or "") in {f"127.0.0.1:{port}", f"localhost:{port}"}

        def _guard(self, write: bool = False) -> bool:
            if not self._host_ok():
                self._json(403, {"ok": False, "error": "forbidden host"})
                return False
            if write and (self.headers.get("Content-Type") or "").split(";")[0].strip() != "application/json":
                self._json(415, {"ok": False, "error": "writes must be application/json"})
                return False
            return True

        def end_headers(self) -> None:
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            super().end_headers()

        def _json(self, code: int, payload: Any) -> None:
            body = json.dumps(payload).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _body(self) -> Any:
            length = int(self.headers.get("Content-Length") or 0)
            if length <= 0 or length > MAX_BODY:
                raise ValueError("body missing or too large")
            return json.loads(self.rfile.read(length))

        def do_HEAD(self) -> None:  # noqa: N802
            if not self._guard() or is_private(self.path):
                return None if not self._host_ok() else self.send_error(404)
            return super().do_HEAD()

        def do_GET(self) -> None:  # noqa: N802
            if not self._guard():
                return None
            path = self.path.split("?", 1)[0]
            if not path.startswith("/api/"):
                if is_private(path):
                    return self._json(404, {"ok": False, "error": "not found"})
                return super().do_GET()
            try:
                if path == "/api/health":
                    return self._json(200, {"ok": True, "engine": engine_available(), "answers": len(db.answers())})
                if path == "/api/state":
                    return self._json(200, {"ok": True, "state": db.get_state()})
                if path == "/api/analytics":
                    return self._json(200, {"ok": True, **build_analytics(db)})
                if path == "/api/verification":
                    f = DATA / "verification" / "report.json"
                    return self._json(200, {"ok": True, "report": json.loads(f.read_text(encoding="utf-8")) if f.exists() else None})
                if path.startswith("/api/banks/"):
                    name = path.rsplit("/", 1)[1]
                    f = DATA / "banks" / f"{name}.json"
                    if not BANK_NAME.match(name) or not f.exists():
                        return self._json(404, {"ok": False, "error": "no such bank"})
                    return self._json(200, {"ok": True, "bank": json.loads(f.read_text(encoding="utf-8"))})
                return self._json(404, {"ok": False, "error": "unknown endpoint"})
            except Exception as e:  # report, never crash the server thread
                return self._json(500, {"ok": False, "error": str(e)})

        def do_POST(self) -> None:  # noqa: N802
            if not self._guard(write=True):
                return None
            try:
                body = self._body()
                if self.path == "/api/answers":
                    rows = body if isinstance(body, list) else [body]
                    return self._json(200, {"ok": True, "stored": db.add_answers(rows)})
                if self.path == "/api/runs":
                    db.add_run(body)
                    return self._json(200, {"ok": True})
                return self._json(404, {"ok": False, "error": "unknown endpoint"})
            except (ValueError, json.JSONDecodeError, TypeError) as e:
                return self._json(400, {"ok": False, "error": str(e)})

        def do_PUT(self) -> None:  # noqa: N802
            if not self._guard(write=True):
                return None
            try:
                if self.path != "/api/state":
                    return self._json(404, {"ok": False, "error": "unknown endpoint"})
                body = self._body()
                if not isinstance(body, dict) or body.get("version") not in (1, 2):
                    raise ValueError("state must be a version 1 or 2 object")
                db.put_state(body)
                return self._json(200, {"ok": True})
            except (ValueError, json.JSONDecodeError) as e:
                return self._json(400, {"ok": False, "error": str(e)})

    return Handler


def make_server(port: int, db_path: Path, root: Path = REPO) -> http.server.ThreadingHTTPServer:
    db = Database(db_path)
    return http.server.ThreadingHTTPServer(("127.0.0.1", port), make_handler(db, root))


def main() -> None:
    ap = argparse.ArgumentParser(description="OptPrep backend")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--db", type=Path, default=DATA / "progress.db")
    args = ap.parse_args()
    args.db.parent.mkdir(parents=True, exist_ok=True)
    srv = make_server(args.port, args.db)
    print(f"OptPrep is running at http://127.0.0.1:{args.port} (engine: {'on' if engine_available() else 'not built'}; Ctrl+C to stop)", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
