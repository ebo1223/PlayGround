import { cp, mkdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const project = dirname(dirname(fileURLToPath(import.meta.url)))
const source = join(project, 'app')
const output = join(project, 'dist')

await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await cp(source, output, { recursive: true })
console.log(`Built static game into ${output}`)
