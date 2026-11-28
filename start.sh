#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
export PORT

# This static game has no external dependencies; copying public/ into dist/ is its build step.
/usr/bin/time -p test -f public/index.html
/usr/bin/time -p mkdir -p dist
/usr/bin/time -p cp -a public/. dist/
/usr/bin/time -p node -e 'const fs=require("node:fs");const path=require("node:path");const project=process.cwd();const directory=path.join(project,"dist");const metadata=process.env.OPENCODE_WEB_DIR||"/home/runner/work/_temp/omgithub-web";fs.mkdirSync(metadata,{recursive:true});fs.writeFileSync(path.join(metadata,"deployment-output.json"),JSON.stringify({project,directory}));'

/usr/bin/time -p node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(process.cwd(), 'dist');
const port = Number(process.env.PORT || 3000);
const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end('Bad request'); return; }
  const file = path.resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end('Forbidden'); return; }
  let target = file;
  try { if (fs.statSync(target).isDirectory()) target = path.join(target, 'index.html'); }
  catch { res.writeHead(404).end('Not found'); return; }
  fs.readFile(target, (error, data) => {
    if (error) { res.writeHead(error.code === 'ENOENT' ? 404 : 500).end('Not found'); return; }
    res.writeHead(200, {'Content-Type':types[path.extname(target)] || 'application/octet-stream','Cache-Control':'no-cache'});
    res.end(data);
  });
});
server.listen(port, '0.0.0.0', () => console.log(`Vampire Kingdom serving ${root} on port ${port}`));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
NODE
