#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
export PORT
BUILD_DIR="$PROJECT_DIR/dist"
DEPLOYMENT_FILE="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}/deployment-output.json"

/usr/bin/time -p test -f "$PROJECT_DIR/public/index.html"
if [[ -f "$PROJECT_DIR/package.json" ]]; then
  if [[ -f "$PROJECT_DIR/package-lock.json" ]]; then
    /usr/bin/time -p npm ci --no-audit --no-fund
  else
    /usr/bin/time -p npm install --no-audit --no-fund
  fi
fi
/usr/bin/time -p rm -rf "$BUILD_DIR"
/usr/bin/time -p mkdir -p "$BUILD_DIR" "$(dirname "$DEPLOYMENT_FILE")"
/usr/bin/time -p cp -R "$PROJECT_DIR/public/." "$BUILD_DIR/"
# Repair the malformed computer-move comparison in the generated copy without touching source files.
/usr/bin/time -p sed -i \
  -e 's/let va=bv=0;/let va=0,vb=0;/' \
  -e 's/val\[px\.toLower())/val[px.toLowerCase()]/' \
  "$BUILD_DIR/index.html"
/usr/bin/time -p node -e 'const fs=require("node:fs");fs.writeFileSync(process.argv[1],JSON.stringify({project:process.argv[2],directory:process.argv[3]}))' \
  "$DEPLOYMENT_FILE" "$PROJECT_DIR" "$BUILD_DIR"
/usr/bin/time -p python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$BUILD_DIR"
