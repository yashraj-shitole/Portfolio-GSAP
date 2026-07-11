// scripts/smoke.mjs
// Quick smoke test: load the dev server, capture console errors and a
// screenshot, then exit. Useful for verifying a build before manual QA.
import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const URL = process.env.URL || 'http://localhost:4173/'
const OUT_DIR = 'screenshots'
const SHOT = `${OUT_DIR}/smoke.png`

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

  // Skip the preloader by pre-seeding sessionStorage.
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('portfolio-loaded', '1')
  })

  const errors = []
  const consoleMessages = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (msg) => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`)
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  page.on('requestfailed', (req) => {
    errors.push(`requestfailed: ${req.url()} - ${req.failure()?.errorText}`)
  })

  console.log(`Loading ${URL}...`)
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30_000 })

  // Wait for the page to settle
  await new Promise((r) => setTimeout(r, 1500))

  // Capture initial state
  await page.screenshot({ path: SHOT, fullPage: false })
  console.log(`Screenshot: ${SHOT}`)

  // Scroll through the page to fire scroll triggers
  const sections = ['about', 'experience', 'skills', 'projects', 'education', 'contact']
  for (const id of sections) {
    await page.evaluate((sectionId) => {
      const el = document.getElementById(sectionId)
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
    }, id)
    await new Promise((r) => setTimeout(r, 700))
    await page.screenshot({ path: `${OUT_DIR}/screenshot-${id}.png`, fullPage: false })
    console.log(`Screenshot: ${OUT_DIR}/screenshot-${id}.png`)
  }

  // Check basic content
  const headline = await page.$eval('h1', (el) => el.textContent).catch(() => 'NO H1')
  console.log(`Headline text: ${headline?.slice(0, 80)}`)

  const navItems = await page.$$eval('header nav button', (els) => els.length).catch(() => 0)
  console.log(`Nav items: ${navItems}`)

  console.log('\n=== CONSOLE MESSAGES ===')
  consoleMessages.forEach((m) => console.log(m))

  if (errors.length) {
    console.error('\n=== ERRORS ===')
    errors.forEach((e) => console.error(e))
    process.exitCode = 1
  } else {
    console.log('\nNo errors. Site loaded successfully.')
  }

  await browser.close()
}

main().catch((err) => {
  console.error('Smoke test failed:', err)
  process.exit(1)
})
