// scripts/smoke-decor-reveal.mjs
// Verify the scale reveal: capture BEFORE entering section (decor should
// be hidden) and DURING section (decor should be revealed).
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

  // Scroll to top of page (hero), projects section is far below — its
  // decor should be scaled to 0.
  await page.screenshot({ path: `${OUT_DIR}/reveal-hero.png`, fullPage: false })
  console.log('Hero (projects decor should be hidden)')

  // Scroll to top of projects — decor should be at start of reveal
  await page.evaluate(() => {
    const el = document.getElementById('projects')
    if (el) {
      const rect = el.getBoundingClientRect()
      window.scrollTo({ top: window.scrollY + rect.top - 100, behavior: 'instant' })
    }
  })
  await new Promise((r) => setTimeout(r, 1000))
  await page.screenshot({ path: `${OUT_DIR}/reveal-projects-top.png`, fullPage: false })
  console.log('Projects top (decor should be revealing)')

  // Scroll into projects center
  await page.evaluate(() => {
    const el = document.getElementById('projects')
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' })
  })
  await new Promise((r) => setTimeout(r, 1000))
  await page.screenshot({ path: `${OUT_DIR}/reveal-projects-mid.png`, fullPage: false })
  console.log('Projects center (decor should be fully revealed)')

  if (errors.length) {
    console.error('\n=== ERRORS ===')
    errors.forEach((e) => console.error(e))
    process.exitCode = 1
  } else {
    console.log('\nNo errors.')
  }
  await browser.close()
}

main().catch((err) => { console.error('Smoke failed:', err); process.exit(1) })
