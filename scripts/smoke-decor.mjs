// scripts/smoke-decor.mjs
// Verify SectionDecors: scroll into each section, wait for the
// reveal-in animation to peak, screenshot. The decor objects should be
// visible behind the text.
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

  // Scroll to the middle of each section so the decor is at peak reveal.
  const sections = ['about', 'experience', 'skills', 'projects', 'education', 'contact']
  for (const id of sections) {
    await page.evaluate((sectionId) => {
      const el = document.getElementById(sectionId)
      if (!el) return
      // Scroll to ~40% into the section so decor is mid-reveal and well into the path
      const rect = el.getBoundingClientRect()
      const top = window.scrollY + rect.top + rect.height * 0.4
      window.scrollTo({ top, behavior: 'instant' })
    }, id)
    await new Promise((r) => setTimeout(r, 1200))
    await page.screenshot({ path: `${OUT_DIR}/decor-${id}.png`, fullPage: false })
    console.log(`Screenshot: ${OUT_DIR}/decor-${id}.png`)
  }

  // Probe: how many SectionDecor SVGs rendered?
  const decorCount = await page.$$eval('section svg', (els) => els.length)
  console.log(`Section SVG count (incl. code-hint): ${decorCount}`)

  if (errors.length) {
    console.error('\n=== ERRORS ===')
    errors.forEach((e) => console.error(e))
    process.exitCode = 1
  } else {
    console.log('\nNo errors. SectionDecors rendered.')
  }

  await browser.close()
}

main().catch((err) => { console.error('Smoke failed:', err); process.exit(1) })
