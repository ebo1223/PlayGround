#!/usr/bin/env bash
set -euo pipefail
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence output directory}"

/usr/bin/time -p node --input-type=module <<'NODE'
import { createRequire } from 'node:module'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const output = process.env.CAPTURE_DIR
const target = process.env.CAPTURE_URL
const runtime = join(process.env.HOME, '.local/share/omgithub-playwright')
const require = createRequire(join(runtime, 'package.json'))
const { chromium } = require('playwright')
const config = JSON.parse(readFileSync(join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json'), 'utf8'))
if (process.platform === 'linux') process.env.DISPLAY ||= ':' + readFileSync(join(runtime, 'display'), 'utf8').trim()
mkdirSync(output, { recursive: true })
const temporary = error => Object.assign(new Error(error?.message || String(error)), { exitCode: 75 })
let browser
let defect = ''
try {
  try { browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 }) }
  catch (error) { throw temporary(error) }
  for (const [name, width, height] of [['desktop', 1280, 900], ['mobile', 390, 844]]) {
    let page
    try { page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 }) }
    catch (error) { throw temporary(error) }
    page.setDefaultTimeout(20000)
    page.on('pageerror', error => { defect ||= `Browser rendering error: ${error.message}` })
    page.on('response', response => {
      try {
        if (response.status() >= 400 && new URL(response.url()).origin === new URL(target).origin) {
          defect ||= `Application resource returned HTTP ${response.status()}: ${response.url()}`
        }
      } catch {}
    })
    let response
    try { response = await page.goto(target, { waitUntil: 'load', timeout: 45000 }) }
    catch (error) { await page.close().catch(() => {}); throw temporary(error) }
    if (!response?.ok()) {
      await page.close().catch(() => {})
      const status = response?.status()
      throw Object.assign(new Error(`Preview navigation returned HTTP ${status ?? 'no response'}`), {
        exitCode: !status || [408, 429, 500, 502, 503, 504].includes(status) || status >= 500 ? 75 : 1
      })
    }
    try {
      await page.locator('body').waitFor({ state: 'visible', timeout: 15000 })
      await page.waitForFunction(() => document.readyState === 'complete' && document.body && (
        document.body.innerText.trim().length > 0 || document.querySelector('canvas, main, [role="main"]')
      ), { timeout: 15000 })
      await page.waitForTimeout(600)
    } catch (error) {
      await page.close().catch(() => {})
      throw new Error(`Page loaded but rendered content did not become visible: ${error.message}`)
    }
    try { await page.screenshot({ path: join(output, `final-${name}.png`), timeout: 30000 }) }
    catch (error) { await page.close().catch(() => {}); throw temporary(error) }
    console.log(`Captured ${name} (${width}x${height}) from ${target}`)
    await page.close()
  }
  if (defect) throw new Error(defect)
} catch (error) {
  console.error(error)
  process.exitCode = error.exitCode || 1
} finally {
  if (browser) {
    try { await browser.close() }
    catch (error) { console.error(`Could not close capture browser: ${error.message}`); process.exitCode ||= 75 }
  }
}
NODE
