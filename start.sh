#!/usr/bin/env bash
set -euo pipefail

run() { /usr/bin/time -p "$@"; }
PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
export PORT
DIST_DIR="$PROJECT_DIR/dist"
DEPLOYMENT_FILE="/home/runner/work/_temp/omgithub-web/deployment-output.json"

run npm install --no-audit --no-fund

needs_build=true
if [[ -f "$DIST_DIR/index.html" ]]; then
  if run env PROJECT_DIR="$PROJECT_DIR" DIST_DIR="$DIST_DIR" node --input-type=module -e '
    import { readdirSync, statSync } from "node:fs";
    import { join } from "node:path";
    const source = join(process.env.PROJECT_DIR, "app");
    const outputIndex = join(process.env.DIST_DIR, "index.html");
    const builtAt = statSync(outputIndex).mtimeMs;
    function newest(path) {
      let latest = statSync(path).mtimeMs;
      if (statSync(path).isDirectory()) for (const name of readdirSync(path)) latest = Math.max(latest, newest(join(path, name)));
      return latest;
    }
    process.exit(newest(source) > builtAt ? 0 : 1);
  '; then
    needs_build=true
  else
    needs_build=false
  fi
fi
if [[ "$needs_build" == true ]]; then
  run npm run build
fi

run mkdir -p "$(dirname "$DEPLOYMENT_FILE")"
run env PROJECT_DIR="$PROJECT_DIR" DIST_DIR="$DIST_DIR" DEPLOYMENT_FILE="$DEPLOYMENT_FILE" node --input-type=module -e '
  import { writeFileSync } from "node:fs";
  writeFileSync(process.env.DEPLOYMENT_FILE, JSON.stringify({
    project: process.env.PROJECT_DIR,
    directory: process.env.DIST_DIR
  }));
'

run node scripts/serve.mjs
