#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT="$ROOT/unpackage/dist/dev/mp-weixin"

if ! command -v wechatide >/dev/null 2>&1; then
  echo "wechatide not found. Install WeChat Developer Tools Nightly or use the Stable automator fallback."
  exit 1
fi

if [[ ! -f "$OUT/project.config.json" ]]; then
  echo "Compiled project.config.json not found: $OUT/project.config.json"
  echo "Run start-dev.sh first and confirm the actual DevTools project root."
  exit 1
fi

wechatide -c Codex -t open_project_window --project "$OUT"
