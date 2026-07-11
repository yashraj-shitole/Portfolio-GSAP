// scripts/smoke-decor-path.mjs
// Verify the motion path: scroll to top of section, then 50% deeper,
// take a screenshot at each. The SectionDecor should be at different
// positions in the path (waypoints are 100+ pixels apart).
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

  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30_000 })
  await new Promise((r) => setTimeout(r, 1500))

  // Scroll to ~10% into the projects section
  await page.evaluate(() => {
    const el = document.getElementById('projects')
    if (!el) return
    const rect = el.getBoundingClientRect()
    window.scrollTo({ top: window.scrollY + rect.top + rect.height * 0.1, behavior: 'instant' })
  })
  await new Promise((r) => setTimeout(r, 1000))
  await page.screenshot({ path: `${OUT_DIR}/decor-projects-10.png`, fullPage: false })

  // Scroll to ~70% into the projects section
  await page.evaluate(() => {
    const el = document.getElementById('projects')
    if (!el) return
    const rect = el.getBoundingClientRect()
    window.scrollTo({ top: window.scrollY + rect.top + rect.height * 0.7, behavior: 'instant' })
  })
  await new Promise((r) => setTimeout(r, 1000))
  await page.screenshot({ path: `${OUT_DIR}/decor-projects-70.png`, fullPage: false })

  // Probe: extract transform of a specific SectionDecor's <g> at two positions
  await page.evaluate(() => {
    const el = document.getElementById('projects')
    if (!el) return
    const rect = el.getBoundingClientRect()
    window.scrollTo({ top: window.scrollY + rect.top + rect.height * 0.1, behavior: 'instant' })
  })
  await new Promise((r) => setTimeout(r, 1000))
  const t1 = await page.$$eval('section#projects svg g', (gs) => gs.map((g) => g.getAttribute('style') || g.getAttribute('transform') || 'none'))

  await page.evaluate(() => {
    const el = document.getElementById('projects')
    if (!el) return
    const rect = el.getBoundingClientRect()
    window.scrollTo({ top: window.scrollY + rect.top + rect.height * 0.7, behavior: 'instant' })
  })
  await new Promise((r) => setTimeout(r, 1000))
  const t2 = await page.$$eval('section#projects svg g', (gs) => gs.map((g) => g.getAttribute('style') || g.getAttribute('transform') || 'none'))

  console.log('Projects decor transforms at 10%:', t1.length, 'elements')
  console.log('  sample[0]:', t1[0]?.slice(0, 120))
  console.log('Projects decor transforms at 70%:', t2.length, 'elements')
  console.log('  sample[0]:', t2[0]?.slice(0, 120))

  await browser.close()
}

main().catch((err) => { console.error('Smoke failed:', err); process.exit(1) })
