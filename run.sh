#!/bin/sh
# Start the trainer. With uv and the Python backend: progress in SQLite, analytics
# and verification at /api. Without them: the same app as static files.
cd "$(dirname "$0")" || exit 1
PORT="${PORT:-8765}"
UV="$(command -v uv || echo "$HOME/.local/bin/uv")"
if [ -x "$UV" ] && [ -f backend/pyproject.toml ]; then
  cd backend && exec "$UV" run python -m oa_backend.server --port "$PORT"
fi
echo "OA Trainer (static): http://127.0.0.1:${PORT}"
exec python3 serve.py "$PORT"
