#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT="$ROOT/unpackage/dist/dev/mp-weixin"

echo "== PawHome WeChat Debug Preflight =="
echo "root: $ROOT"
echo "output: $OUT"
echo

fail=0
check_cmd() {
  local cmd="$1"
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "[PASS] $cmd: $(command -v "$cmd")"
  else
    echo "[FAIL] missing command: $cmd"
    fail=1
  fi
}

check_cmd node
check_cmd npm

[[ -f "$ROOT/package.json" ]] && echo "[PASS] package.json" || { echo "[FAIL] package.json missing"; fail=1; }
[[ -f "$ROOT/package-lock.json" ]] && echo "[PASS] package-lock.json (use npm)" || echo "[WARN] package-lock.json missing"

if [[ -f "$ROOT/project.config.json" ]]; then
  echo "[PASS] root project.config.json"
  node -e 'const fs=require("fs");const p=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));console.log("       appid:",p.appid||"<missing>");console.log("       compileType:",p.compileType||"<missing>");' "$ROOT/project.config.json"
else
  echo "[WARN] root project.config.json missing"
fi

echo
if command -v wechatide >/dev/null 2>&1; then
  echo "[PASS] wechatide: $(command -v wechatide)"
else
  echo "[WARN] wechatide not found; preferred workflow requires DevTools Nightly."
fi

SKILL_YAML="$(find /Applications -path '*miniprogram-dev-skill/skill.yaml' -print -quit 2>/dev/null || true)"
if [[ -n "$SKILL_YAML" ]]; then
  echo "[PASS] Nightly skill.yaml: $SKILL_YAML"
  VERSION="$(grep -E '^[[:space:]]*version[[:space:]]*:' "$SKILL_YAML" | head -n1 | sed -E 's/^[^:]+:[[:space:]]*//' || true)"
  [[ -n "$VERSION" ]] && echo "       skill version: $VERSION"
else
  echo "[WARN] Nightly miniprogram-dev-skill not found under /Applications"
fi

echo
[[ -d "$ROOT/node_modules" ]] && echo "[PASS] node_modules exists" || echo "[WARN] node_modules missing. Run: npm ci"
[[ -f "$OUT/app.json" ]] && echo "[PASS] compiled app.json exists" || echo "[INFO] compiled output not ready; run start-dev.sh"
[[ -f "$OUT/project.config.json" ]] && echo "[PASS] compiled project.config.json exists" || echo "[INFO] compiled project.config.json not found yet"

echo
if [[ "$fail" -ne 0 ]]; then
  echo "Preflight: FAIL"
  exit 1
fi
echo "Preflight: PASS with possible WARN/INFO items above."
