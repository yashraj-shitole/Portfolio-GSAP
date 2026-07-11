// scripts/verify-particles.mjs
// One-off: open the dev server, capture screenshots at three points
// (wait → fly-in 80% → scroll 100%), then exit.
//
// Uses Chrome's remote-debugging protocol over a WebSocket — keeps
// the dep footprint at zero (we just need Node 18+'s built-in
// WebSocket).
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { setTimeout as wait } from 'node:timers/promises'

const URL = 'http://localhost:5180/'
const OUT = (name) => `Y:/AI_Projects/Portfolio/screenshots/verify-${name}.png`

const port = 9333
const chrome = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1440,900',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=C:/Users/yashr/AppData/Local/Temp/chrome-verify',
    URL,
  ],
  { stdio: ['ignore', 'pipe', 'pipe'] },
)

chrome.stderr.on('data', () => {}) // suppress noisy logs
chrome.stdout.on('data', () => {})

// Poll for the debug endpoint to come up.
async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (r.ok) {
        const j = await r.json()
        return j.webSocketDebuggerUrl
      }
    } catch {}
    await wait(300)
  }
  throw new Error('Chrome debug endpoint never came up')
}

const wsUrl = await getWsUrl()
const ws = new WebSocket(wsUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })

let id = 0
const pending = new Map()
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id != null && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) rej(new Error(msg.error.message))
    else res(msg.result)
  }
}
function send(method, params = {}) {
  const mid = ++id
  return new Promise((res, rej) => {
    pending.set(mid, { res, rej })
    ws.send(JSON.stringify({ id: mid, method, params }))
  })
}

// Attach to the page target (one tab, opened with URL above).
const tabs = await send('Target.getTargets')
const pageTarget = tabs.targetInfos.find((t) => t.type === 'page')
const { sessionId } = await send('Target.attachToTarget', {
  targetId: pageTarget.targetId,
  flatten: true,
})

function sendSession(method, params = {}) {
  const mid = ++id
  return new Promise((res, rej) => {
    pending.set(mid, { res, rej })
    ws.send(JSON.stringify({ sessionId, id: mid, method, params }))
  })
}

await sendSession('Page.enable')
await sendSession('Runtime.enable')

async function screenshot(name) {
  const r = await sendSession('Page.captureScreenshot', { format: 'png' })
  writeFileSync(OUT(name), Buffer.from(r.data, 'base64'))
  console.log(`wrote ${name}`)
}

// Reload to start timing from zero.
await sendSession('Page.reload', { ignoreCache: true })

// Install an FPS sampler on the page so we can measure the
// actual frame rate during the reveal. We override
// requestAnimationFrame to capture deltas.
await sendSession('Runtime.evaluate', {
  expression: `
    (() => {
      window.__frameTimes = []
      let last = performance.now()
      const tick = (t) => {
        window.__frameTimes.push(t - last)
        last = t
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })()
  `,
})

// t = 0.5s: still in wait phase (1.0s wait) — should show no particles
//   and no portrait.
await wait(500)
await screenshot('wait')

// t = 4s: mid phase 1 fly-in (wait + 3s of 6s fly-in).
await wait(3500)
await screenshot('phase1-mid')

// t = 7.5s: fly-in landed (1s + 6s = 7s), 0.5s into float hold.
//   Image should be at 80% with particles floating at waypoint.
await wait(3500)
await screenshot('float-hold')

// t = 8.5s: float hold over (7.5s), 1s into the staggered fly-out
//   window (0..2s). Some particles should be flying off-screen,
//   others still at the waypoint.
await wait(1000)
await screenshot('flyout-early')

// t = 10s: ~3s into fly-out window — most particles should be
//   off-screen, last few stragglers still leaving.
await wait(1500)
await screenshot('flyout-mid')

// t = 12s: well after the full fly-out (1 + 6 + 0.5 + 2 + 1.5 = 11s).
//   All particles should be off-screen; image still at 80% opacity.
await wait(2000)
await screenshot('after-flyout')

// Scroll to push image to 100%. Since we use `instant: true` for
// scroll, image opacity should jump and remaining particles (if
// any) snap to targets.
await sendSession('Runtime.evaluate', { expression: 'window.scrollTo({top: 600, behavior: "instant"})' })
await wait(900)
await screenshot('after-scroll')

// Pull the frame-time samples and report.
const fpsResult = await sendSession('Runtime.evaluate', {
  expression: `
    (() => {
      const t = window.__frameTimes || []
      if (!t.length) return null
      const sorted = t.slice().sort((a, b) => a - b)
      const p50 = sorted[Math.floor(sorted.length * 0.5)]
      const p95 = sorted[Math.floor(sorted.length * 0.95)]
      const p99 = sorted[Math.floor(sorted.length * 0.99)]
      const max = sorted[sorted.length - 1]
      const avg = t.reduce((a, b) => a + b, 0) / t.length
      const slow = t.filter(x => x > 33.3).length
      return {
        samples: t.length,
        avg: +avg.toFixed(2),
        p50: +p50.toFixed(2),
        p95: +p95.toFixed(2),
        p99: +p99.toFixed(2),
        max: +max.toFixed(2),
        slowFrames: slow,
        fpsAvg: +(1000 / avg).toFixed(1),
      }
    })()
  `,
  returnByValue: true,
})
console.log('FPS stats:', JSON.stringify(fpsResult.result.value))

await sendSession('Browser.close')
chrome.kill()
process.exit(0)
