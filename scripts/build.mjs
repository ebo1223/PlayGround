import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { resolve, join } from 'node:path'

const project = resolve(process.cwd())
const source = join(project, 'src')
const output = join(project, 'dist')
rmSync(output, { recursive: true, force: true })
mkdirSync(output, { recursive: true })
cpSync(source, output, { recursive: true })
console.log(`Built static site: ${output}`)
