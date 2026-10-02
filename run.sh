#!/bin/sh
# Start OptPrep with the Python backend: progress in SQLite, analytics and verification
# at /api. Uses uv when installed, otherwise plain python3 (stdlib only).
# No Python at all? Run `npx optprep` (or `npm start`) for the app without the backend.
cd "$(dirname "$0")" || exit 1
PORT="${PORT:-8765}"
UV="$(command -v uv || echo "$HOME/.local/bin/uv")"
if [ -x "$UV" ] && [ -f backend/pyproject.toml ]; then
  cd backend && exec "$UV" run python -m oa_backend.server --port "$PORT"
fi
exec python3 serve.py "$PORT"
