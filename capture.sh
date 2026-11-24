#!/usr/bin/env bash
set -euo pipefail

: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL.}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence output directory.}"
/usr/bin/time -p node -e 'const u=new URL(process.env.CAPTURE_URL); if(!["http:","https:"].includes(u.protocol)) throw new Error("CAPTURE_URL must use HTTP or HTTPS.")'
case "$(cd "$(dirname "$CAPTURE_DIR")" 2>/dev/null && pwd)/$(basename "$CAPTURE_DIR")/" in
  "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"/*) echo 'CAPTURE_DIR must be outside the project source.' >&2; exit 1 ;;
esac
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"

/usr/bin/time -p node --input-type=module <<'NODE'
import { readFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'

const runtime = join(process.env.HOME, '.local/share/omgithub-playwright')
const require = createRequire(join(runtime, 'package.json'))
const { chromium } = require('playwright')
const configPath = join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json')
let config
try { config = JSON.parse(readFileSync(configPath, 'utf8')) }
catch (error) { console.error(`Playwright setup unavailable: ${error.message}`); process.exit(75) }
if (process.platform === 'linux') {
  try { process.env.DISPLAY ||= ':' + readFileSync(join(runtime, 'display'), 'utf8').trim() }
  catch (error) { console.error(`Browser display unavailable: ${error.message}`); process.exit(75) }
}
const url = process.env.CAPTURE_URL
const output = resolve(process.env.CAPTURE_DIR)
mkdirSync(output, { recursive: true })
let browser
let exitCode = 0
const temporary = error => {
  const e = new Error(`Temporary browser/navigation failure: ${error.message}`)
  e.exitCode = 75
  return e
}
try {
  try { browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 }) }
  catch (error) { throw temporary(error) }
  for (const [name, width, height] of [['desktop', 1280, 900], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
    page.setDefaultTimeout(20000)
    const pageErrors = []
    page.on('pageerror', error => pageErrors.push(error.message))
    let response
    try { response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }) }
    catch (error) { await page.close().catch(() => {}); throw temporary(error) }
    if (!response) { await page.close(); throw temporary(new Error('Navigation returned no HTTP response.')) }
    if (!response.ok()) {
      await page.close()
      const status = response.status()
      const error = new Error(`Preview responded with HTTP ${status}: ${url}`)
      error.exitCode = status >= 500 || status === 408 || status === 429 ? 75 : 1
      throw error
    }
    await page.locator('#gameCanvas').waitFor({ state: 'visible' })
    await page.waitForFunction(() => document.fonts.status === 'loaded' && document.querySelector('#gameCanvas')?.dataset.rendered === 'true')
    if (!await page.title().then(title => title.includes('Math Challenge 3D'))) throw new Error('Rendered page title does not identify Math Challenge 3D.')
    const start = page.locator('#startButton')
    if (!await start.isVisible()) throw new Error('Game start control did not render.')
    await start.click()
    await page.waitForFunction(() => document.querySelector('#overlay')?.classList.contains('hidden') && document.querySelector('#equation')?.textContent.includes('?'))
    await page.waitForTimeout(500)
    if (pageErrors.length) throw new Error(`Game rendering/runtime error: ${pageErrors.join('; ')}`)
    await page.screenshot({ path: join(output, `final-${name}.png`), fullPage: false, timeout: 30000 }).catch(error => {
      if (!browser.isConnected() || error.name === 'TimeoutError') throw temporary(error)
      throw error
    })
    console.log(`Captured ${name} (${width}x${height}) from ${url}`)
    await page.close()
  }
} catch (error) {
  console.error(error)
  exitCode = error.exitCode || (error.name === 'TimeoutError' ? 75 : 1)
} finally {
  if (browser) {
    try { await browser.close() }
    catch (error) { console.error(`Could not close capture browser cleanly: ${error.message}`); exitCode ||= 75 }
  }
}
process.exitCode = exitCode
NODE
