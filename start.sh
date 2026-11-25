#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
OPENCODE_WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"

run_timed() {
  local label="$1" start end status
  shift
  start="$(date +%s%3N)"
  if "$@"; then status=0; else status=$?; fi
  end="$(date +%s%3N)"
  printf '[timing] %s: %s ms (exit %s)\n' "$label" "$((end - start))" "$status" >&2
  return "$status"
}

if [[ -f package-lock.json ]]; then
  run_timed 'npm ci' npm ci --no-audit --no-fund
else
  run_timed 'npm install' npm install --no-audit --no-fund
fi
run_timed 'npm run build' npm run build

[[ -f "$PROJECT_DIR/dist/index.html" ]] || { echo 'Build did not create dist/index.html' >&2; exit 1; }
run_timed 'write deployment metadata' env PROJECT_DIR="$PROJECT_DIR" OPENCODE_WEB_DIR="$OPENCODE_WEB_DIR" node -e 'const fs=require("node:fs");const path=require("node:path");const file=path.join(process.env.OPENCODE_WEB_DIR,"deployment-output.json");fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify({project:process.env.PROJECT_DIR,directory:path.join(process.env.PROJECT_DIR,"dist")}));'
run_timed 'vite preview' "$PROJECT_DIR/node_modules/.bin/vite" preview --host 0.0.0.0 --port "$PORT" --strictPort
