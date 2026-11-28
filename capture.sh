#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR for screenshot evidence}"

/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p node --input-type=module <<'NODE'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const runtime = join(process.env.HOME, '.local/share/omgithub-playwright')
const require = createRequire(join(runtime, 'package.json'))
const { chromium } = require('playwright')
const config = JSON.parse(readFileSync(join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json'), 'utf8'))
if (process.platform === 'linux') process.env.DISPLAY ||= ':' + readFileSync(join(runtime, 'display'), 'utf8').trim()
const url = process.env.CAPTURE_URL
const output = process.env.CAPTURE_DIR
const temporary = error => Object.assign(error instanceof Error ? error : new Error(String(error)), { exitCode: 75 })
let browser
let exitCode = 0
const defects = []
try {
  try { browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 }) }
  catch (error) { throw temporary(error) }
  for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    let page
    try { page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 }) }
    catch (error) { throw temporary(error) }
    page.setDefaultTimeout(30000)
    const pageErrors = []
    page.on('pageerror', error => pageErrors.push(error.message))
    let response
    try { response = await page.goto(url, { waitUntil: 'load', timeout: 45000 }) }
    catch (error) { throw temporary(error) }
    if (!response?.ok()) {
      const status = response?.status()
      const transient = !status || status >= 500 || status === 408 || status === 429
      throw Object.assign(new Error(`Preview navigation failed with HTTP ${status ?? 'no response'}: ${url}`), { exitCode: transient ? 75 : 1 })
    }
    let rendered = true
    try {
      await page.locator('body').waitFor({ state: 'visible', timeout: 15000 })
      await page.locator('canvas').waitFor({ state: 'visible', timeout: 15000 })
      await page.waitForFunction(() => {
        const canvas = document.querySelector('canvas')
        if (!canvas || canvas.width < 2 || canvas.height < 2) return false
        const ctx = canvas.getContext('2d')
        if (!ctx) return false
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        for (let i = 3; i < pixels.length; i += Math.max(4, Math.floor(pixels.length / 2000 / 4) * 4)) if (pixels[i] > 0) return true
        return false
      }, { timeout: 5000 })
      await page.waitForTimeout(600)
    } catch (error) {
      rendered = false
      defects.push(`${name}: game canvas did not render (${error.message})`)
    }
    if (pageErrors.length) defects.push(`${name}: browser rendering error: ${pageErrors.join('; ')}`)
    try { await page.screenshot({ path: join(output, `final-${name}.png`), fullPage: true, timeout: 30000 }) }
    catch (error) { throw temporary(error) }
    await page.close()
    console.log(`Captured ${name} view from ${url}${rendered ? '' : ' (rendering defect recorded)'}`)
  }
  if (defects.length) throw new Error(`App rendering defects: ${defects.join(' | ')}`)
} catch (error) {
  console.error(error)
  exitCode = error.exitCode || 1
} finally {
  if (browser) {
    try { await browser.close() }
    catch (error) { console.error(`Could not close capture browser cleanly: ${error.message}`); exitCode ||= 75 }
  }
}
process.exitCode = exitCode
NODE
