#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
export PORT

# Keep all build products in the project; RUNNER_TEMP is reserved for worker metadata.
/usr/bin/time -p npm install --no-audit --no-fund
/usr/bin/time -p npm run build
/usr/bin/time -p mkdir -p "${RUNNER_TEMP:-/home/runner/work/_temp}/omgithub-web"
/usr/bin/time -p node -e 'const fs=require("node:fs");const path=require("node:path");const project=process.cwd();const target=path.join(process.env.RUNNER_TEMP||"/home/runner/work/_temp","omgithub-web","deployment-output.json");fs.writeFileSync(target,JSON.stringify({project,directory:path.join(project,"dist")}));console.log(`Wrote ${target}`)'
/usr/bin/time -p node server.js
