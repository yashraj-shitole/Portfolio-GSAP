// Take screenshots of the page in both light and dark themes
// to verify the toggle works.
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { setTimeout as wait } from 'node:timers/promises'

const URL = 'http://localhost:5186/'
const OUT = (name) => `Y:/AI_Projects/Portfolio/screenshots/theme-${name}.png`

const port = 9337
const chrome = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1440,900',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=C:/Users/yashr/AppData/Local/Temp/chrome-theme',
    URL,
  ],
  { stdio: ['ignore', 'pipe', 'pipe'] },
)

chrome.stderr.on('data', () => {})
chrome.stdout.on('data', () => {})

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
function send(method, params = {}, sessionId) {
  const mid = ++id
  return new Promise((res, rej) => {
    pending.set(mid, { res, rej })
    const m = { id: mid, method, params }
    if (sessionId) m.sessionId = sessionId
    ws.send(JSON.stringify(m))
  })
}

const tabs = await send('Target.getTargets')
const pageTarget = tabs.targetInfos.find((t) => t.type === 'page')
const { sessionId } = await send('Target.attachToTarget', {
  targetId: pageTarget.targetId,
  flatten: true,
})
const sendSession = (method, params = {}) => send(method, params, sessionId)

await sendSession('Page.enable')
await sendSession('Runtime.enable')

async function screenshot(name) {
  const r = await sendSession('Page.captureScreenshot', { format: 'png' })
  writeFileSync(OUT(name), Buffer.from(r.data, 'base64'))
  console.log(`wrote ${name}`)
}

async function setTheme(t) {
  await sendSession('Runtime.evaluate', {
    expression: `document.documentElement.setAttribute('data-theme', ${JSON.stringify(t)})`,
  })
  await wait(300) // let CSS variables resolve
}

async function getTheme() {
  const r = await sendSession('Runtime.evaluate', {
    expression: `document.documentElement.getAttribute('data-theme')`,
    returnByValue: true,
  })
  return r.result.value
}

await wait(800)

// Force light first
await setTheme('light')
console.log('current theme:', await getTheme())
await screenshot('light')

// Force dark
await setTheme('dark')
console.log('current theme:', await getTheme())
await screenshot('dark')

// Click the toggle to switch from dark to light
const clicked = await sendSession('Runtime.evaluate', {
  expression: `
    (() => {
      const btn = document.querySelector('button[aria-label*="theme"]')
      if (!btn) return 'no button'
      btn.click()
      return 'clicked'
    })()
  `,
  returnByValue: true,
})
console.log('click result:', clicked.result.value)
await wait(400)
console.log('after click:', await getTheme())
await screenshot('after-click')

// Click again to flip back
await sendSession('Runtime.evaluate', {
  expression: `document.querySelector('button[aria-label*="theme"]').click()`,
})
await wait(400)
console.log('after second click:', await getTheme())
await screenshot('after-second-click')

await sendSession('Browser.close')
chrome.kill()
process.exit(0)
