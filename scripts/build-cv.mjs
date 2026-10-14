// scripts/build-cv.mjs
// Renders cv/cv.html to public/Yashraj-Shitole-CV.pdf (one A4 page, real text,
// ATS-friendly) and fails if the result is not exactly one page.
import puppeteer from 'puppeteer-core'
import { mkdir, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const SRC = path.resolve('cv/cv.html')
const OUT = path.resolve('public/Yashraj-Shitole-CV.pdf')
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'

await mkdir(path.dirname(OUT), { recursive: true })
const browser = await puppeteer.launch({ executablePath: chromePath, headless: 'new', args: ['--no-sandbox'] })
try {
  const page = await browser.newPage()
  await page.goto(pathToFileURL(SRC).href, { waitUntil: 'networkidle0' })

  // body is fixed to one A4 sheet with overflow hidden, so detect clipping explicitly.
  const { contentBottom, limit } = await page.evaluate(() => {
    const last = document.body.lastElementChild
    const pad = parseFloat(getComputedStyle(document.body).paddingBottom)
    return { contentBottom: last.getBoundingClientRect().bottom, limit: document.body.clientHeight - pad }
  })
  const slackMm = ((limit - contentBottom) * 25.4) / 96
  if (slackMm < 0) throw new Error(`CV overflows one page by ${(-slackMm).toFixed(1)} mm`)

  await page.pdf({ path: OUT, format: 'A4', printBackground: true, preferCSSPageSize: true })
  console.log(`wrote ${path.relative(process.cwd(), OUT)} (spare space at bottom: ${slackMm.toFixed(1)} mm)`)
} finally {
  await browser.close()
}

const pages = (await readFile(OUT)).toString('latin1').match(/\/Type\s*\/Page[^s]/g)?.length ?? 0
if (pages !== 1) throw new Error(`expected 1 page, got ${pages}`)
