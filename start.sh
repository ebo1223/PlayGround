#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)}"
PORT="${PORT:-3000}"
OPENCODE_WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
export PROJECT_DIR PORT OPENCODE_WEB_DIR
cd "$PROJECT_DIR"

run_timed() {
  /usr/bin/time -p "$@"
}

run_timed npm ci --no-audit --no-fund
run_timed npm run build
run_timed mkdir -p "$OPENCODE_WEB_DIR"
run_timed node -e 'const fs=require("node:fs"); const path=require("node:path"); const project=path.resolve(process.env.PROJECT_DIR); const directory=path.join(project,"dist"); if (!fs.existsSync(path.join(directory,"index.html"))) process.exit(1); fs.writeFileSync(path.join(process.env.OPENCODE_WEB_DIR,"deployment-output.json"), JSON.stringify({project,directory}));'

# Keep the static server attached to this process so the controller can manage it.
exec /usr/bin/time -p "$PROJECT_DIR/node_modules/.bin/serve" -l "$PORT" "$PROJECT_DIR/dist"
