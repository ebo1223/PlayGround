import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const started = performance.now()
const logTime = (label, begin) => console.log(`timing ${label}: ${((performance.now() - begin) / 1000).toFixed(2)}s`)
const url = process.env.CAPTURE_URL
const output = process.env.CAPTURE_DIR
if (!url || !output) throw new Error('Set CAPTURE_URL and CAPTURE_DIR.')
await mkdir(output, { recursive: true })
const runtime = join(process.env.HOME, '.local/share/omgithub-playwright')
const require = createRequire(pathToFileURL(join(runtime, 'package.json')))
const { chromium } = require('playwright')
const config = JSON.parse(await readFile(join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json'), 'utf8'))
if (process.platform === 'linux') process.env.DISPLAY ||= `:${(await readFile(join(runtime, 'display'), 'utf8')).trim()}`
const transient = error => Object.assign(error, { exitCode: 75 })
let browser
let exitCode = 1
try {
  let begin = performance.now()
  browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 }).catch(error => { throw transient(error) })
  logTime('browser launch', begin)

  for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    begin = performance.now()
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 }).catch(error => { throw transient(error) })
    const pageErrors = []
    page.on('pageerror', error => pageErrors.push(error.message))
    let response
    try {
      response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    } catch (error) {
      await page.close().catch(() => {})
      throw transient(error)
    }
    if (!response?.ok()) {
      const status = response?.status()
      await page.close().catch(() => {})
      throw Object.assign(new Error(`HTTP ${status ?? 'unknown'} loading ${url}`), {
        exitCode: !status || [408, 429, 500, 502, 503, 504].includes(status) ? 75 : 1,
      })
    }
    try {
      await page.locator('#game').waitFor({ state: 'visible', timeout: 15000 })
      await page.waitForFunction(() => {
        const canvas = document.querySelector('#game')
        return canvas && canvas.width > 0 && canvas.height > 0 && document.readyState !== 'loading'
      }, { timeout: 15000 })
      const title = await page.title()
      if (!title.includes('Whack-a-Mole')) throw new Error(`Unexpected page title: ${title}`)
      await page.waitForTimeout(300)
      const rendered = await page.evaluate(() => {
        const canvas = document.querySelector('#game')
        const c = canvas.getContext('2d')
        if (!c) return false
        const pixels = c.getImageData(0, 0, canvas.width, canvas.height).data
        let varied = false
        const first = [pixels[0], pixels[1], pixels[2]]
        for (let i = 4; i < pixels.length; i += Math.max(4, Math.floor(pixels.length / 5000 / 4) * 4)) {
          if (pixels[i] !== first[0] || pixels[i + 1] !== first[1] || pixels[i + 2] !== first[2]) { varied = true; break }
        }
        return varied && document.body.innerText.trim().length > 0
      })
      if (!rendered) throw new Error('The game canvas or visible page content did not render.')
      if (pageErrors.length) throw new Error(`Browser rendering error: ${pageErrors.join('; ')}`)
      logTime(`${name} navigation and render`, begin)
      begin = performance.now()
      await page.screenshot({ path: join(output, `final-${name}.png`), fullPage: false, timeout: 30000 }).catch(error => { throw transient(error) })
      logTime(`${name} screenshot`, begin)
    } finally {
      await page.close().catch(() => {})
    }
  }
  exitCode = 0
} catch (error) {
  console.error(error)
  exitCode = error.exitCode ?? 1
} finally {
  if (browser) {
    const begin = performance.now()
    await browser.close().catch(error => { console.error(error); exitCode ||= 75 })
    logTime('browser close', begin)
  }
  logTime('total capture', started)
}
process.exitCode = exitCode
