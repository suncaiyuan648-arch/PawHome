#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ART="$ROOT/.artifacts/wx-debug"
LOG="$ART/logs/uni-dev.log"
PID="$ART/uni-dev.pid"
OUT="$ROOT/unpackage/dist/dev/mp-weixin"

mkdir -p "$ART/logs" "$ART/screenshots" "$ART/reports"

if [[ ! -d "$ROOT/node_modules" ]]; then
  echo "node_modules not found. Run: cd \"$ROOT\" && npm ci"
  exit 1
fi

if [[ -f "$PID" ]]; then
  OLD_PID="$(cat "$PID" || true)"
  if [[ -n "$OLD_PID" ]] && kill -0 "$OLD_PID" >/dev/null 2>&1; then
    echo "uni watcher already running (pid=$OLD_PID)"
    exit 0
  fi
  rm -f "$PID"
fi

(
  cd "$ROOT"
  nohup npm run dev:mp-weixin >"$LOG" 2>&1 &
  echo $! >"$PID"
)

echo "watcher pid: $(cat "$PID")"
echo "log: $LOG"
echo "Waiting for compiled app.json..."

for _ in $(seq 1 60); do
  if [[ -f "$OUT/app.json" ]]; then
    echo "Compiled output ready: $OUT"
    [[ -f "$OUT/project.config.json" ]] && echo "project.config.json: ready" || echo "WARNING: compiled project.config.json not present"
    exit 0
  fi
  P="$(cat "$PID")"
  if ! kill -0 "$P" >/dev/null 2>&1; then
    echo "Watcher exited unexpectedly."
    tail -n 80 "$LOG" || true
    exit 1
  fi
  sleep 1
done

echo "Timed out waiting for output."
tail -n 80 "$LOG" || true
exit 1
