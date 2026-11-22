#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
CAPTURE_URL="${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
CAPTURE_DIR="${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence directory}"
RUNNER_TEMP="${RUNNER_TEMP:-/home/runner/work/_temp}"
PLAYWRIGHT_ROOT="${PLAYWRIGHT_ROOT:-$HOME/.local/share/omgithub-playwright}"
CAPTURE_SCRIPT=""
cleanup() {
  if [[ -n "$CAPTURE_SCRIPT" && -f "$CAPTURE_SCRIPT" ]]; then
    /usr/bin/time -p rm -f "$CAPTURE_SCRIPT"
  fi
}
trap cleanup EXIT

/usr/bin/time -p mkdir -p "$CAPTURE_DIR" "$RUNNER_TEMP"
CAPTURE_SCRIPT="$(/usr/bin/time -p mktemp "$RUNNER_TEMP/chess-master-capture.XXXXXX.mjs")"
/usr/bin/time -p cat > "$CAPTURE_SCRIPT" <<'NODE'
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const runtime = process.env.PLAYWRIGHT_ROOT;
const localRequire = createRequire(path.join(runtime, 'package.json'));
const { chromium } = localRequire('playwright');
const config = JSON.parse(fs.readFileSync(path.join(runtime, 'linux.json'), 'utf8'));
const url = process.env.CAPTURE_URL;
const output = process.env.CAPTURE_DIR;

(async () => {
  let browser;
  try {
    try {
      browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 });
    } catch (error) {
      console.error(`Browser infrastructure failure: ${error.message}`);
      process.exitCode = 75;
      return;
    }
    for (const [name, width, height] of [['desktop', 1280, 900], ['mobile', 390, 844]]) {
      let page;
      try {
        page = await browser.newPage({ viewport: { width, height } });
      } catch (error) {
        console.error(`Browser infrastructure failure: ${error.message}`);
        process.exitCode = 75;
        return;
      }
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      let response;
      try {
        response = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      } catch (error) {
        console.error(`Navigation/browser infrastructure failure for ${url}: ${error.message}`);
        process.exitCode = 75;
        return;
      }
      if (!response || !response.ok()) {
        const status = response?.status();
        console.error(`Preview navigation returned HTTP ${status ?? 'no response'}: ${url}`);
        process.exitCode = !status || [408, 429, 500, 502, 503, 504].includes(status) ? 75 : 1;
        return;
      }
      try {
        await page.locator('body').waitFor({ state: 'visible', timeout: 10000 });
        await page.locator('#board').waitFor({ state: 'visible', timeout: 15000 });
        await page.waitForFunction(() => document.fonts.status === 'loaded', { timeout: 10000 });
        const squares = await page.locator('#board .square').count();
        const title = await page.title();
        const status = await page.locator('#status').textContent();
        if (pageErrors.length || squares !== 64 || !title.includes('Chess Master') || !status?.trim()) {
          throw new Error(`Rendered app validation failed: squares=${squares}, title=${JSON.stringify(title)}, status=${JSON.stringify(status)}, pageErrors=${pageErrors.join('; ') || 'none'}`);
        }
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(output, `final-${name}.png`), fullPage: true, timeout: 30000 });
        console.log(`Captured ${name} (${width}x${height}) from ${url}: ${squares} board squares, ${status.trim()}`);
      } catch (error) {
        console.error(`Rendering/script defect in ${name} view: ${error.message}`);
        process.exitCode = 1;
        return;
      } finally {
        await page.close().catch(error => console.error(`Could not close capture page: ${error.message}`));
      }
    }
  } finally {
    if (browser) await browser.close().catch(error => {
      console.error(`Browser cleanup failure: ${error.message}`);
      process.exitCode ||= 75;
    });
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
NODE
export PLAYWRIGHT_ROOT
/usr/bin/time -p env DISPLAY=":$(/usr/bin/time -p cat "$PLAYWRIGHT_ROOT/display")" node "$CAPTURE_SCRIPT"
