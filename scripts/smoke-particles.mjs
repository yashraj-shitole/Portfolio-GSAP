// scripts/smoke-particles.mjs
// Verify the ParticleReveal effect inside the hero: capture screenshots
// at multiple scroll positions to see the particles fly in and the
// image assemble. Targets #hero (the portrait is now in the hero's
// right column, not a separate section).
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

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page
    .waitForFunction(
      () => !document.querySelector('.preloader'),
      { timeout: 5_000 },
    )
    .catch(() => console.warn('Preloader still present after 5s — continuing.'))
  await new Promise((r) => setTimeout(r, 500))

  // Resolve the hero section once and use it as the reference for all
  // scroll positions. The portrait is inside #hero's right column.
  const heroRect = await page.evaluate(() => {
    const sec = document.getElementById('hero')
    if (!sec) return null
    const r = sec.getBoundingClientRect()
    return { top: r.top + window.scrollY, height: r.height }
  })
  if (!heroRect) {
    throw new Error('#hero not found in DOM — is the smoke running against the right URL?')
  }

  // Helper: scroll to absolute Y, bypassing Lenis smooth animation.
  const scrollTo = async (y) => {
    await page.evaluate((target) => {
      const lenis = (window).__lenis
      if (lenis && lenis.scrollTo) {
        lenis.scrollTo(target, { immediate: true })
      } else {
        window.scrollTo({ top: target, behavior: 'instant' })
      }
    }, y)
  }

  // 1. Page load: scrollY=0, image hidden, particles off-screen
  await scrollTo(0)
  await new Promise((r) => setTimeout(r, 1500))
  await page.screenshot({ path: `${OUT_DIR}/particles-0.png`, fullPage: false })
  console.log('0%: image hidden, particles off-screen')

  // 2. 30% of hero scroll — particles flying in, image starting to show
  await scrollTo(Math.round(heroRect.height * 0.3))
  await new Promise((r) => setTimeout(r, 1500))
  await page.screenshot({ path: `${OUT_DIR}/particles-30.png`, fullPage: false })
  console.log('30%: particles flying in, image partially visible')

  // 3. 50% — image mostly visible
  await scrollTo(Math.round(heroRect.height * 0.5))
  await new Promise((r) => setTimeout(r, 1500))
  await page.screenshot({ path: `${OUT_DIR}/particles-50.png`, fullPage: false })
  console.log('50%: image mostly visible, most particles landed')

  // 4. 70% — image fully revealed
  await scrollTo(Math.round(heroRect.height * 0.7))
  await new Promise((r) => setTimeout(r, 1500))
  await page.screenshot({ path: `${OUT_DIR}/particles-70.png`, fullPage: false })
  console.log('70%: image fully visible, particles mostly gone')

  // 5. End of hero — image at native resolution
  await scrollTo(Math.round(heroRect.height))
  await new Promise((r) => setTimeout(r, 1500))
  await page.screenshot({ path: `${OUT_DIR}/particles-100.png`, fullPage: false })
  console.log('100%: image fully revealed at native resolution')

  // Probe
  const info = await page.evaluate(() => {
    const particles = document.querySelectorAll('#hero [class*="rounded-full"]')
    const img = document.querySelector('#hero img')
    return {
      heroHeight: document.getElementById('hero')?.getBoundingClientRect().height,
      particleCount: particles.length,
      imgLoaded: img ? (img.complete && img.naturalWidth > 0) : false,
      imgDims: img ? `${img.naturalWidth}×${img.naturalHeight}` : 'none',
    }
  })
  console.log('Probe:', JSON.stringify(info))

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
