import { createReadStream, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const project = resolve(fileURLToPath(new URL('..', import.meta.url)))
const root = resolve(project, 'dist')
const port = Number(process.env.PORT || 3000)
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
}

const server = createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    const requested = resolve(root, `.${pathname}`)
    if (requested !== root && !requested.startsWith(`${root}/`)) {
      response.writeHead(403).end('Forbidden')
      return
    }
    let file = requested
    if (statSync(file).isDirectory()) file = join(file, 'index.html')
    const info = statSync(file)
    response.writeHead(200, {
      'Content-Type': mime[extname(file)] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': 'no-cache'
    })
    if (request.method === 'HEAD') response.end()
    else createReadStream(file).pipe(response)
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Serving ${root} on port ${port}`)
})
