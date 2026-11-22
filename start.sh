#!/usr/bin/env bash
set -Eeuo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
DIST_DIR="$PROJECT_DIR/dist"
DEPLOYMENT_FILE="${RUNNER_TEMP:-/home/runner/work/_temp}/omgithub-web/deployment-output.json"

# Keep command output visible while reporting wall-clock, user, and system time.
timed() {
  printf '+ '
  printf '%q ' "$@"
  printf '\n'
  /usr/bin/time -p "$@"
}

# This is a dependency-free static project. For a package-based variant, install
# locked dependencies and run its build script before serving the generated dist.
if [[ -f "$PROJECT_DIR/package.json" ]]; then
  if [[ -f "$PROJECT_DIR/package-lock.json" ]]; then
    timed npm ci --prefix "$PROJECT_DIR"
  else
    timed npm install --prefix "$PROJECT_DIR"
  fi
  if timed node -e "const p=require(process.argv[1]); process.exit(p.scripts?.build ? 0 : 1)" "$PROJECT_DIR/package.json"; then
    timed npm run --prefix "$PROJECT_DIR" build
  fi
fi

timed test -s "$DIST_DIR/index.html"
timed mkdir -p "$(dirname "$DEPLOYMENT_FILE")"
timed node -e 'const fs=require("node:fs"); const path=require("node:path"); const project=process.argv[1]; const directory=process.argv[2]; const output=process.argv[3]; fs.writeFileSync(output, JSON.stringify({project,directory:path.resolve(directory)}, null, 2)+"\n")' "$PROJECT_DIR" "$DIST_DIR" "$DEPLOYMENT_FILE"
printf 'Serving %s on port %s\n' "$DIST_DIR" "$PORT"
exec /usr/bin/time -p python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$DIST_DIR"
