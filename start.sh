#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
export PORT

/usr/bin/time -p test -f package.json
/usr/bin/time -p npm install --no-audit --no-fund
/usr/bin/time -p npm run build

BUILT_DIR="$PROJECT_DIR/dist"
/usr/bin/time -p test -f "$BUILT_DIR/index.html"
case "$BUILT_DIR/" in "$PROJECT_DIR"/*) ;; *) echo 'Built output must stay inside the project directory.' >&2; exit 1 ;; esac

METADATA_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
/usr/bin/time -p mkdir -p "$METADATA_DIR"
env METADATA_DIR="$METADATA_DIR" PROJECT_PATH="$PROJECT_DIR" BUILT_PATH="$BUILT_DIR" /usr/bin/time -p node -e 'const fs=require("node:fs"); const path=require("node:path"); const file=path.join(process.env.METADATA_DIR,"deployment-output.json"); fs.writeFileSync(file, JSON.stringify({project:process.env.PROJECT_PATH,directory:process.env.BUILT_PATH},null,2)+"\n")'

/usr/bin/time -p npm run start
