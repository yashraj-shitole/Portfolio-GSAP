import puppeteer from 'puppeteer-core'

const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
const p = await b.newPage()
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }])
await p.evaluateOnNewDocument(() => sessionStorage.setItem('portfolio-loaded', '1'))
await p.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded', timeout: 60000 })
await p.waitForFunction(() => !document.querySelector('.preloader'), { timeout: 5000 }).catch(() => {})
await new Promise((r) => setTimeout(r, 1500))

const probe = await p.evaluate(() => {
  const img = document.querySelector('#hero img')
  const imgWrap = img?.parentElement
  const wrap = imgWrap?.parentElement
  const iw = imgWrap.getBoundingClientRect()
  const ww = wrap.getBoundingClientRect()
  const ps = Array.from(imgWrap.querySelectorAll('[class*=rounded-full]')).slice(0, 5)
  return {
    wrapRect: { x: ww.x, y: ww.y, w: ww.width, h: ww.height },
    imgWrapRect: { x: iw.x, y: iw.y, w: iw.width, h: iw.height },
    imgRect: img.getBoundingClientRect().toJSON(),
    sample: ps.map((el, i) => {
      const m = el.style.transform.match(/translate\(([^,]+)px, ([^\)]+)px\)/)
      const t = m ? `${parseFloat(m[1]).toFixed(1)},${parseFloat(m[2]).toFixed(1)}` : 'n/a'
      return { i, t, o: el.style.opacity }
    }),
    loadT: wrap.__loadState?.t,
    scrollT: wrap.__scrollState?.t,
  }
})
console.log(JSON.stringify(probe, null, 2))
await b.close()
