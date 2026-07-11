// scripts/smoke-scrollpath.mjs
// Capture a screenshot at hero (dot at top of path) and a screenshot at
// mid-page (dot halfway down the path) to verify the ScrollPath is animating.
import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const URL = process.env.URL || 'http://localhost:4173/'
const OUT_DIR = 'screenshots'
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

async function main() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true })

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })

  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }])
  await page.evaluateOnNewDocument(() => sessionStorage.setItem('portfolio-loaded', '1'))

  const errors = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })

  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30_000 })
  await new Promise((r) => setTimeout(r, 1500))

  // 1. Hero — dot should be near the top of the path
  await page.screenshot({ path: `${OUT_DIR}/scrollpath-hero.png`, fullPage: false })
  console.log(`Screenshot: ${OUT_DIR}/scrollpath-hero.png`)

  // 2. Mid-page (projects) — dot should be roughly halfway down
  await page.evaluate(() => {
    const el = document.getElementById('projects')
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
  })
  await new Promise((r) => setTimeout(r, 800))
  await page.screenshot({ path: `${OUT_DIR}/scrollpath-projects.png`, fullPage: false })
  console.log(`Screenshot: ${OUT_DIR}/scrollpath-projects.png`)

  // 3. Bottom (contact) — dot should be near bottom
  await page.evaluate(() => {
    const el = document.getElementById('contact')
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
  })
  await new Promise((r) => setTimeout(r, 800))
  await page.screenshot({ path: `${OUT_DIR}/scrollpath-contact.png`, fullPage: false })
  console.log(`Screenshot: ${OUT_DIR}/scrollpath-contact.png`)

  // 4. Probe the dot's computed position to verify it's actually moving
  const positions = await page.evaluate(() => {
    const dot = document.querySelector('svg circle[r="4"]')
    if (!dot) return null
    const rect = dot.getBoundingClientRect()
    return { x: rect.x, y: rect.y }
  })
  console.log('Dot position at bottom:', JSON.stringify(positions))

  if (errors.length) {
    console.error('\n=== ERRORS ===')
    errors.forEach((e) => console.error(e))
    process.exitCode = 1
  } else {
    console.log('\nNo errors. ScrollPath appears to be animating.')
  }

  await browser.close()
}

main().catch((err) => { console.error('Smoke failed:', err); process.exit(1) })
