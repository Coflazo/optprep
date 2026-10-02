"""Run OptPrep with its Python backend on any OS, no uv needed (stdlib only, Python 3.10+).

    python serve.py [port]        # default 8765

This starts the same hardened server as `uv run python -m oa_backend.server`: the app,
progress in SQLite and the /api endpoints, on 127.0.0.1 only.
"""
import sys
from pathlib import Path

if sys.version_info < (3, 10):
    sys.exit("OptPrep's backend needs Python 3.10 or newer. Without it, run: npx optprep")

sys.path.insert(0, str(Path(__file__).resolve().parent / "backend"))
from oa_backend.server import main  # noqa: E402

if __name__ == "__main__":
    if len(sys.argv) == 2 and sys.argv[1].isdigit():  # the old `serve.py 8765` form
        sys.argv[1:] = ["--port", sys.argv[1]]
    main()
