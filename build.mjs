import { cp, mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const output = resolve(root, 'dist')
await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
for (const file of ['index.html', 'styles.css', 'game.js']) {
  await cp(resolve(root, file), resolve(output, file))
}
console.log(`Built static game into ${output}`)
