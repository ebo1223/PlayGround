#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
DIST_DIR="$PROJECT_DIR/dist"
METADATA_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"

/usr/bin/time -p test -f "$PROJECT_DIR/index.html"
if [[ -f "$PROJECT_DIR/package.json" ]]; then
  if [[ -f "$PROJECT_DIR/package-lock.json" ]]; then
    /usr/bin/time -p npm ci --no-audit --no-fund
  else
    /usr/bin/time -p npm install --no-audit --no-fund
  fi
fi
/usr/bin/time -p mkdir -p "$DIST_DIR"
/usr/bin/time -p cp "$PROJECT_DIR/index.html" "$DIST_DIR/index.html"
/usr/bin/time -p mkdir -p "$METADATA_DIR"
/usr/bin/time -p node -e 'const fs=require("node:fs"); const path=require("node:path"); const project=path.resolve(process.argv[1]); const directory=path.resolve(process.argv[2]); fs.writeFileSync(path.join(process.argv[3],"deployment-output.json"), JSON.stringify({project,directory}));' "$PROJECT_DIR" "$DIST_DIR" "$METADATA_DIR"

/usr/bin/time -p node -e '
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(process.argv[1]);
const port = Number(process.env.PORT || 3000);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
http.createServer((req, res) => {
  let requested;
  try { requested = decodeURIComponent(new URL(req.url, "http://localhost").pathname); } catch { res.writeHead(400).end("Bad request"); return; }
  let file = path.resolve(root, "." + requested);
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end("Forbidden"); return; }
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    const data = fs.readFileSync(file);
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(data);
  } catch { res.writeHead(404).end("Not found"); }
}).listen(port, "0.0.0.0", () => console.log(`Serving ${root} on port ${port}`));
' "$DIST_DIR"
