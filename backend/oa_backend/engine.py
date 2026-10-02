"""Client for the C++ oa-engine: one long-lived process speaking JSON lines."""
from __future__ import annotations

import json
import os
import subprocess
import threading
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parents[2]


def find_binary() -> Path:
    """OA_ENGINE if set, else the first build output that exists (Ninja/Make, MinGW, MSVC)."""
    if os.environ.get("OA_ENGINE"):
        return Path(os.environ["OA_ENGINE"])
    build = REPO / "engine" / "build"
    candidates = [build / "oa-engine", build / "oa-engine.exe", build / "Release" / "oa-engine.exe"]
    return next((c for c in candidates if c.is_file()), candidates[0])


DEFAULT_BINARY = find_binary()


class EngineError(RuntimeError):
    """The engine rejected a request or died."""


class Engine:
    def __init__(self, binary: Path | str = DEFAULT_BINARY) -> None:
        self.binary = Path(binary)
        if not self.binary.exists():
            raise FileNotFoundError(f"oa-engine not built at {self.binary} (cmake --build engine/build)")
        self._proc = subprocess.Popen([str(self.binary)], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                      stderr=subprocess.PIPE, text=True, encoding="utf-8", bufsize=1)
        self._lock = threading.Lock()

    def call(self, request: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            if self._proc.poll() is not None:
                raise EngineError("oa-engine exited")
            assert self._proc.stdin and self._proc.stdout
            self._proc.stdin.write(json.dumps(request) + "\n")
            self._proc.stdin.flush()
            line = self._proc.stdout.readline()
        if not line:
            raise EngineError("oa-engine closed its output")
        out = json.loads(line)
        if not out.get("ok"):
            raise EngineError(out.get("error", "unknown engine error"))
        return out

    def close(self) -> None:
        if self._proc.poll() is None:
            self._proc.stdin and self._proc.stdin.close()
            self._proc.wait(timeout=5)

    def __enter__(self) -> "Engine":
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()


def available(binary: Path | str = DEFAULT_BINARY) -> bool:
    return Path(binary).exists()
