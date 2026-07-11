// scripts/smoke-dark.mjs
// Same as smoke.mjs but with dark color scheme.
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

  // Dark color scheme + skip preloader
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }])
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('portfolio-loaded', '1')
  })

  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30_000 })
  await new Promise((r) => setTimeout(r, 1500))

  await page.screenshot({ path: `${OUT_DIR}/dark-hero.png`, fullPage: false })
  console.log(`Screenshot: ${OUT_DIR}/dark-hero.png`)

  const sections = ['about', 'skills', 'projects']
  for (const id of sections) {
    await page.evaluate((sectionId) => {
      const el = document.getElementById(sectionId)
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
    }, id)
    await new Promise((r) => setTimeout(r, 700))
    await page.screenshot({ path: `${OUT_DIR}/dark-${id}.png`, fullPage: false })
    console.log(`Screenshot: ${OUT_DIR}/dark-${id}.png`)
  }

  await browser.close()
}

main().catch((err) => { console.error('Dark smoke failed:', err); process.exit(1) })
