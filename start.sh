#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
DIST_DIR="$PROJECT_DIR/dist"
DEPLOYMENT_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
DEPLOYMENT_FILE="$DEPLOYMENT_DIR/deployment-output.json"

/usr/bin/time -p mkdir -p "$DEPLOYMENT_DIR"
/usr/bin/time -p npm install --no-audit --no-fund
/usr/bin/time -p npm run build
/usr/bin/time -p node -e 'const fs=require("node:fs"); const p=process.argv[1]; const d=process.argv[2]; fs.writeFileSync(p, JSON.stringify({project:d,directory:d+"/dist"})+"\n")' "$DEPLOYMENT_FILE" "$PROJECT_DIR"
/usr/bin/time -p ./node_modules/.bin/serve --single --listen "${PORT}" "$DIST_DIR"
