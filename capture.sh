#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence output directory}"
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p node --input-type=module <<'NODE'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const url = process.env.CAPTURE_URL
const output = process.env.CAPTURE_DIR
let parsed
try { parsed = new URL(url) } catch { console.error('CAPTURE_URL must be an absolute URL.'); process.exit(1) }
if (!['http:', 'https:'].includes(parsed.protocol)) { console.error('CAPTURE_URL must use HTTP or HTTPS.'); process.exit(1) }
const runtime = join(process.env.HOME, '.local/share/omgithub-playwright')
let chromium, config
try {
  const require = createRequire(join(runtime, 'package.json'))
  ;({ chromium } = require('playwright'))
  config = JSON.parse(readFileSync(join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json'), 'utf8'))
} catch (error) {
  console.error(`Browser runtime is unavailable: ${error.message}`)
  process.exit(75)
}
if (process.platform === 'linux') {
  try { process.env.DISPLAY ||= ':' + readFileSync(join(runtime, 'display'), 'utf8').trim() }
  catch (error) { console.error(`Browser display is unavailable: ${error.message}`); process.exit(75) }
}
let browser
let exitCode = 0
const infrastructure = error => Object.assign(error, { exitCode: 75 })
const defect = message => Object.assign(new Error(message), { exitCode: 1 })
try {
  browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 }).catch(infrastructure)
  for (const [name, width, height] of [['desktop', 1280, 800], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 }).catch(infrastructure)
    page.setDefaultTimeout(20000)
    const defects = []
    page.on('pageerror', error => defects.push(`Browser script error: ${error.message}`))
    page.on('response', response => {
      try {
        if (response.status() >= 400 && new URL(response.url()).origin === parsed.origin) defects.push(`HTTP ${response.status()} for ${response.url()}`)
      } catch {}
    })
    let response
    try { response = await page.goto(url, { waitUntil: 'load', timeout: 45000 }) }
    catch (error) { throw infrastructure(error) }
    if (!response?.ok()) {
      const status = response?.status()
      throw Object.assign(new Error(`Preview navigation failed${status ? ` with HTTP ${status}` : ''}.`), {
        exitCode: !status || [408, 429, 500, 502, 503, 504].includes(status) ? 75 : 1
      })
    }
    try {
      await page.waitForFunction(() => document.readyState === 'complete' && !!document.body && (
        document.body.innerText.trim().length > 0 || !!document.body.querySelector('canvas,svg,img,video')
      ), { timeout: 15000 })
      await page.waitForFunction(() => document.fonts.status === 'loaded', { timeout: 15000 })
    } catch (error) {
      throw defect(`Page loaded but rendered content did not become ready: ${error.message}`)
    }
    await page.waitForTimeout(700)
    try { await page.screenshot({ path: join(output, `final-${name}.png`), animations: 'disabled', timeout: 30000 }) }
    catch (error) { throw infrastructure(error) }
    await page.close().catch(error => { throw infrastructure(error) })
    if (defects.length) throw defect(`Rendering defects on ${name}: ${defects.join('; ')}`)
    console.log(`Captured ${name} (${width}x${height}) from ${url}`)
  }
} catch (error) {
  console.error(error)
  exitCode = error.exitCode || 1
} finally {
  if (browser) {
    try { await browser.close() }
    catch (error) { console.error(`Could not close capture browser: ${error.message}`); if (!exitCode) exitCode = 75 }
  }
}
process.exitCode = exitCode
NODE
