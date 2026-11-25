#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
export PORT
BUILD_DIR="$PROJECT_DIR/dist"
DEPLOYMENT_OUTPUT="/home/runner/work/_temp/omgithub-web/deployment-output.json"

/usr/bin/time -p npm install --ignore-scripts --no-audit --no-fund --package-lock=false
/usr/bin/time -p test -f "$PROJECT_DIR/public/index.html"
/usr/bin/time -p rm -rf "$BUILD_DIR"
/usr/bin/time -p mkdir -p "$BUILD_DIR"
/usr/bin/time -p cp -a "$PROJECT_DIR/public/." "$BUILD_DIR/"
/usr/bin/time -p mkdir -p "$(dirname -- "$DEPLOYMENT_OUTPUT")"
/usr/bin/time -p node -e 'const fs=require("node:fs"); const path=require("node:path"); const out=process.argv[1]; const project=process.argv[2]; const directory=process.argv[3]; fs.writeFileSync(out, JSON.stringify({project,directory}, null, 2)+"\n")' "$DEPLOYMENT_OUTPUT" "$PROJECT_DIR" "$BUILD_DIR"
/usr/bin/time -p python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$BUILD_DIR"
