#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PID="$ROOT/.artifacts/wx-debug/uni-dev.pid"

[[ -f "$PID" ]] || { echo "No watcher pid file."; exit 0; }
P="$(cat "$PID" || true)"
[[ -n "$P" ]] || { rm -f "$PID"; exit 0; }

if kill -0 "$P" >/dev/null 2>&1; then
  echo "Stopping uni watcher pid=$P"
  kill "$P"
  for _ in $(seq 1 20); do
    if ! kill -0 "$P" >/dev/null 2>&1; then
      rm -f "$PID"
      echo "Stopped."
      exit 0
    fi
    sleep 0.2
  done
  echo "Process did not stop gracefully; inspect manually."
  exit 1
fi

rm -f "$PID"
echo "Watcher is not running."
