#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
[[ "$PORT" =~ ^[0-9]+$ ]] && (( PORT > 0 && PORT < 65536 )) || { echo "PORT must be between 1 and 65535." >&2; exit 1; }

if [[ -f package.json ]]; then
  if [[ -f package-lock.json ]]; then
    /usr/bin/time -p npm ci --no-audit --no-fund
  else
    /usr/bin/time -p npm install --no-audit --no-fund
  fi
  if /usr/bin/time -p node -e "process.exit(require('./package.json').scripts?.build ? 0 : 1)"; then
    /usr/bin/time -p npm run build
  fi
fi

if [[ -f "$PROJECT_DIR/dist/index.html" ]]; then
  STATIC_DIR="$PROJECT_DIR/dist"
elif [[ -f "$PROJECT_DIR/index.html" ]]; then
  STATIC_DIR="$PROJECT_DIR"
else
  echo "No built static index.html found in dist/ or project root." >&2
  exit 1
fi

WEB_META_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
/usr/bin/time -p mkdir -p "$WEB_META_DIR"
/usr/bin/time -p env PROJECT_DIR="$PROJECT_DIR" STATIC_DIR="$STATIC_DIR" WEB_META_DIR="$WEB_META_DIR" node -e 'const fs=require("node:fs");const path=require("node:path");const file=path.join(process.env.WEB_META_DIR,"deployment-output.json");fs.writeFileSync(file,JSON.stringify({project:path.resolve(process.env.PROJECT_DIR),directory:path.resolve(process.env.STATIC_DIR)}));'
echo "Serving $STATIC_DIR on 0.0.0.0:$PORT"
/usr/bin/time -p python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$STATIC_DIR"
