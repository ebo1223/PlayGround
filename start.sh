#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATIC_DIR="$PROJECT_DIR/dist"
PORT="${PORT:-3000}"
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"

run() {
  /usr/bin/time -p "$@"
}

cd "$PROJECT_DIR"
[[ "$PORT" =~ ^[0-9]+$ ]] && (( PORT > 0 && PORT < 65536 )) || { echo "PORT must be between 1 and 65535" >&2; exit 1; }

# This project is dependency-free static HTML/JavaScript. If a package manifest
# is added later, honor its install/build scripts before staging the static site.
if [[ -f package.json ]]; then
  if [[ -f package-lock.json ]]; then
    run npm ci --no-audit --no-fund
  else
    run npm install --no-audit --no-fund
  fi
  run npm run build --if-present
fi

run mkdir -p "$STATIC_DIR" "$WEB_DIR"
run cp "$PROJECT_DIR/index.html" "$STATIC_DIR/index.html"
run cp "$PROJECT_DIR/game.js" "$STATIC_DIR/game.js"
run python3 -c 'import json,os,sys; json.dump({"project":os.path.realpath(sys.argv[1]),"directory":os.path.realpath(sys.argv[2])},open(sys.argv[3],"w"),indent=2); print()' "$PROJECT_DIR" "$STATIC_DIR" "$WEB_DIR/deployment-output.json"
echo "Serving $STATIC_DIR on 0.0.0.0:$PORT"
exec /usr/bin/time -p python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$STATIC_DIR"
