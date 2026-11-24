#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
OPENCODE_WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
export PORT

/usr/bin/time -p mkdir -p "$PROJECT_DIR/dist" "$OPENCODE_WEB_DIR"
# This project is dependency-free static HTML; copying public/ into dist/ is its build step.
/usr/bin/time -p cp "$PROJECT_DIR/public/index.html" "$PROJECT_DIR/dist/index.html"
/usr/bin/time -p node -e 'const fs=require("node:fs"); fs.writeFileSync(process.argv[1], JSON.stringify({project:process.argv[2],directory:process.argv[3]}))' "$OPENCODE_WEB_DIR/deployment-output.json" "$PROJECT_DIR" "$PROJECT_DIR/dist"
/usr/bin/time -p python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$PROJECT_DIR/dist"
