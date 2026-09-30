#!/bin/sh
# Serve the trainer locally (ES modules need http://, not file://).
cd "$(dirname "$0")" || exit 1
PORT="${PORT:-8765}"
echo "OA Trainer: http://127.0.0.1:${PORT}"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
