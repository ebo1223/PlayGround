import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'

const root = resolve(process.cwd(), 'dist')
if (!existsSync(join(root, 'index.html'))) throw new Error(`Missing built site at ${root}; run npm run build first.`)
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' }
const server = createServer((req, res) => {
  let requested
  try { requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname) } catch { res.writeHead(400).end('Bad request'); return }
  let file = resolve(root, `.${requested}`)
  if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end('Forbidden'); return }
  try { if (statSync(file).isDirectory()) file = join(file, 'index.html') } catch { file = join(root, 'index.html') }
  if (!existsSync(file)) { res.writeHead(404).end('Not found'); return }
  res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' })
  createReadStream(file).pipe(res)
})
const port = Number(process.env.PORT || 3000)
server.listen(port, '0.0.0.0', () => console.log(`Math Challenge 3D serving ${root} on port ${port}`))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)))
