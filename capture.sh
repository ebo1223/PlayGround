#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)}"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR for screenshots}"
if [[ "$CAPTURE_DIR" == "$PROJECT_DIR" || "$CAPTURE_DIR" == "$PROJECT_DIR"/* ]]; then
  echo "CAPTURE_DIR must be outside the project source directory." >&2
  exit 1
fi

/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p node --input-type=module <<'NODE'
import { createRequire } from 'node:module'
import { readFileSync, mkdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'

const runtime = join(process.env.HOME, '.local/share/omgithub-playwright')
const require = createRequire(join(runtime, 'package.json'))
const { chromium } = require('playwright')
const config = JSON.parse(readFileSync(join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json'), 'utf8'))
if (process.platform === 'linux') process.env.DISPLAY ||= ':' + readFileSync(join(runtime, 'display'), 'utf8').trim()
const url = process.env.CAPTURE_URL
const output = resolve(process.env.CAPTURE_DIR)
mkdirSync(output, { recursive: true })
const elapsed = (label, start) => console.log(`TIMING ${label}: ${((performance.now() - start) / 1000).toFixed(3)}s`)
const transient = error => Object.assign(error, { exitCode: 75 })
let browser
let exitCode = 0
const totalStart = performance.now()
try {
  let start = performance.now()
  try {
    browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 })
  } catch (error) {
    throw transient(error)
  }
  elapsed('browser launch', start)

  for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    const pageStart = performance.now()
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
    page.setDefaultTimeout(20000)
    const pageErrors = []
    const origin = new URL(url).origin
    page.on('pageerror', error => pageErrors.push(error.message))
    page.on('response', response => {
      if (response.status() >= 400 && new URL(response.url()).origin === origin) {
        pageErrors.push(`HTTP ${response.status()} ${response.url()}`)
      }
    })

    start = performance.now()
    let response
    try {
      response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    } catch (error) {
      throw transient(error)
    }
    if (!response?.ok()) {
      const status = response?.status()
      throw Object.assign(new Error(`Preview navigation failed (${status ?? 'no response'}) at ${url}`), {
        exitCode: !status || [408, 429, 500, 502, 503, 504].includes(status) ? 75 : 1
      })
    }
    elapsed(`${name} navigation`, start)

    start = performance.now()
    try {
      await page.waitForFunction(() => {
        const canvas = document.querySelector('canvas')
        return canvas && canvas.width > 0 && canvas.height > 0 && getComputedStyle(canvas).display !== 'none'
      }, { timeout: 20000 })
      await page.locator('#start').waitFor({ state: 'visible', timeout: 10000 })
      await page.locator('#start').click({ timeout: 10000 })
      await page.waitForFunction(() => {
        const canvas = document.querySelector('canvas')
        return canvas && canvas.width > 0 && canvas.height > 0 && document.querySelector('#overlay')?.style.display === 'none'
      }, { timeout: 10000 })
      await page.waitForTimeout(1200)
    } catch (error) {
      throw new Error(`Rendered game check failed on ${name}: ${error.message}`)
    }
    if (pageErrors.length) throw new Error(`Browser rendering error on ${name}: ${pageErrors.join('; ')}`)
    elapsed(`${name} rendered game`, start)

    start = performance.now()
    const image = join(output, `final-${name}.png`)
    try {
      await page.screenshot({ path: image, fullPage: false, timeout: 30000 })
      if (statSync(image).size < 10000) throw new Error(`Screenshot looks empty: ${image}`)
    } catch (error) {
      if (error.name === 'TimeoutError' || !browser.isConnected()) throw transient(error)
      throw error
    }
    elapsed(`${name} screenshot`, start)
    await page.close()
    elapsed(`${name} total`, pageStart)
  }
} catch (error) {
  console.error(error)
  exitCode = error.exitCode || 1
} finally {
  if (browser) {
    const closeStart = performance.now()
    try { await browser.close() } catch (error) { console.error(error); exitCode ||= 75 }
    elapsed('browser close', closeStart)
  }
  elapsed('capture total', totalStart)
}
process.exitCode = exitCode
NODE
