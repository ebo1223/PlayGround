#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

run_timed() {
  echo "+ $*" >&2
  /usr/bin/time -p "$@"
}

PORT="${PORT:-3000}"
DIST_DIR="$PROJECT_DIR/dist"
mkdir -p "$PROJECT_DIR" "$DIST_DIR"

# Build the static entry. Copy CSS and convert the browser entry to a plain ES module.
run_timed mkdir -p "$DIST_DIR/src"
run_timed cp "$PROJECT_DIR/src/style.css" "$DIST_DIR/src/style.css"
run_timed cp "$PROJECT_DIR/src/index.html" "$DIST_DIR/index.html"
python3 - "$PROJECT_DIR/src/src.jsx" "$DIST_DIR/src/src.jsx" "$DIST_DIR/src/app.js" <<'PY'
import sys
src, jsx_dst, js_dst = sys.argv[1:]
text = open(src, encoding="utf-8").read()
text = text.replace("import './style.css';", "")
open(jsx_dst, "w", encoding="utf-8").write(text)
open(js_dst, "w", encoding="utf-8").write(text)
PY
python3 - "$DIST_DIR/index.html" <<'PY'
import sys
p = sys.argv[1]
text = open(p, encoding="utf-8").read()
text = text.replace("</head>", '<link rel="stylesheet" href="/src/style.css"></head>')
text = text.replace('/src/src.jsx', '/src/app.js')
open(p, "w", encoding="utf-8").write(text)
PY

WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
run_timed mkdir -p "$WEB_DIR"
run_timed python3 - "$WEB_DIR/deployment-output.json" "$PROJECT_DIR" "$DIST_DIR" <<'PY'
import json, sys
metadata_path, project, directory = sys.argv[1:]
with open(metadata_path, "w", encoding="utf-8") as f:
    json.dump({"project": project, "directory": directory}, f)
PY

# Serve the project-local static build on the required foreground port.
exec /usr/bin/time -p python3 -m http.server "$PORT" --directory "$DIST_DIR"
