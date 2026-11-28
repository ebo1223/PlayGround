#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
export PORT

if [[ -f package.json ]]; then
  if [[ -f package-lock.json ]]; then
    /usr/bin/time -p npm ci --no-audit --no-fund
  else
    /usr/bin/time -p npm install --no-audit --no-fund
  fi
  has_build="$(/usr/bin/time -p node -e "const p=require('./package.json'); process.stdout.write(p.scripts?.build ? 'yes' : 'no')")"
  if [[ "$has_build" == yes ]]; then
    /usr/bin/time -p npm run build
  fi
fi

if [[ -f dist/index.html ]]; then
  STATIC_DIR="$PROJECT_DIR/dist"
elif [[ -f build/index.html ]]; then
  STATIC_DIR="$PROJECT_DIR/build"
elif [[ -f index.html ]]; then
  /usr/bin/time -p mkdir -p dist
  /usr/bin/time -p cp index.html dist/index.html
  STATIC_DIR="$PROJECT_DIR/dist"
else
  echo "No built static index.html found under $PROJECT_DIR (expected dist/, build/, or index.html)." >&2
  exit 1
fi

/usr/bin/time -p mkdir -p /home/runner/work/_temp/omgithub-web
/usr/bin/time -p node -e 'const fs=require("node:fs"); const p="/home/runner/work/PlayGround/PlayGround"; fs.writeFileSync("/home/runner/work/_temp/omgithub-web/deployment-output.json", JSON.stringify({project:p,directory:process.argv[1]}))' "$STATIC_DIR"
echo "Serving $STATIC_DIR on 0.0.0.0:$PORT"
exec /usr/bin/time -p python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$STATIC_DIR"
