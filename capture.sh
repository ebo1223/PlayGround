#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence output directory}"

run_timed() {
  local label="$1" start end status
  shift
  start="$(date +%s%3N)"
  if "$@"; then status=0; else status=$?; fi
  end="$(date +%s%3N)"
  printf '[timing] %s: %s ms (exit %s)\n' "$label" "$((end - start))" "$status" >&2
  return "$status"
}

run_timed 'Playwright desktop and mobile captures' node --input-type=module <<'NODE'
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const output = process.env.CAPTURE_DIR
const target = process.env.CAPTURE_URL
const runtime = join(process.env.HOME, '.local/share/omgithub-playwright')
const require = createRequire(join(runtime, 'package.json'))
const { chromium } = require('playwright')
const config = JSON.parse(readFileSync(join(runtime, 'linux.json'), 'utf8'))
process.env.DISPLAY ||= ':' + readFileSync(join(runtime, 'display'), 'utf8').trim()

let parsedUrl
try {
  parsedUrl = new URL(target)
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Unsupported URL protocol')
} catch (error) {
  console.error(`Invalid CAPTURE_URL: ${error.message}`)
  process.exitCode = 1
}

if (process.exitCode !== 1) {
  mkdirSync(output, { recursive: true })
  let browser
  let failureCode = 0
  try {
    try {
      browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 })
    } catch (error) {
      error.exitCode = 75
      throw error
    }

    for (const [view, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
      page.setDefaultTimeout(30000)
      const runtimeErrors = []
      page.on('pageerror', error => runtimeErrors.push(error.message))
      page.on('response', response => {
        if (response.status() >= 400 && new URL(response.url()).origin === parsedUrl.origin) {
          runtimeErrors.push(`HTTP ${response.status()} for ${response.url()}`)
        }
      })

      let response
      try {
        response = await page.goto(target, { waitUntil: 'load', timeout: 45000 })
      } catch (error) {
        error.exitCode = 75
        throw error
      }
      if (!response || !response.ok()) {
        const status = response?.status()
        const temporary = !status || [408, 429, 500, 502, 503, 504].includes(status)
        const error = new Error(`Preview navigation failed${status ? ` with HTTP ${status}` : ''}: ${target}`)
        error.exitCode = temporary ? 75 : 1
        throw error
      }

      try {
        await page.locator('#game canvas').waitFor({ state: 'visible', timeout: 30000 })
        await page.locator('#overlay .panel').waitFor({ state: 'visible', timeout: 10000 })
        await page.evaluate(() => document.fonts.ready)
        await page.waitForTimeout(1200)
      } catch (error) {
        error.exitCode = 1
        throw new Error(`Application failed to render for ${view}: ${error.message}`, { cause: error })
      }

      if (runtimeErrors.length) {
        throw new Error(`Application runtime/rendering defects on ${view}: ${runtimeErrors.join('; ')}`)
      }

      try {
        await page.screenshot({ path: join(output, `final-${view}.png`), fullPage: false, timeout: 30000 })
      } catch (error) {
        error.exitCode = error.name === 'TimeoutError' || !browser.isConnected() ? 75 : 1
        throw error
      }
      console.log(`Saved ${join(output, `final-${view}.png`)} (${width}x${height})`)
      await page.close()
    }
  } catch (error) {
    failureCode = error.exitCode || (error.name === 'TimeoutError' || !browser?.isConnected() ? 75 : 1)
    console.error(error)
  } finally {
    if (browser) {
      try {
        await browser.close()
      } catch (error) {
        console.error(`Failed to close capture browser: ${error.message}`)
        if (!failureCode) failureCode = 75
      }
    }
  }
  if (failureCode) process.exitCode = failureCode
}
NODE
