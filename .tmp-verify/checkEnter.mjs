import puppeteer from 'puppeteer-core'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = 'http://localhost:5199/app'

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  userDataDir: mkdtempSync(join(tmpdir(), 'gix-check-')),
  args: ['--no-first-run', '--disable-extensions'],
})

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  await page.goto(URL, { waitUntil: 'networkidle2' })

  // Open the Ask Gix popup
  await page.waitForSelector('[aria-label^="Ask Gix"]', { timeout: 10000 })
  await page.evaluate(() => {
    const btn = document.querySelector('[aria-label^="Ask Gix"]')
    btn.click()
  })
  await page.waitForSelector('textarea[aria-label="Message for Gix"]', { timeout: 5000 })

  const ta = 'textarea[aria-label="Message for Gix"]'
  await page.type(ta, 'hello gix')
  await page.keyboard.press('Enter')

  // Give React a beat to flush state
  await new Promise((r) => setTimeout(r, 800))

  const result = await page.evaluate((sel) => {
    const textarea = document.querySelector(sel)
    const bubbles = [...document.querySelectorAll('[role="dialog"] div')].filter(
      (el) => el.textContent?.trim() === 'hello gix',
    )
    return {
      textareaValue: textarea ? textarea.value : null,
      textareaNewlines: textarea ? (textarea.value.match(/\n/g) || []).length : -1,
      userBubbleFound: bubbles.length > 0,
    }
  }, ta)

  console.log(JSON.stringify(result))
  const pass =
    result.userBubbleFound &&
    result.textareaValue === '' &&
    result.textareaNewlines === 0
  console.log(pass ? 'PASS: Enter sent the message, no newline inserted' : 'FAIL')
  process.exitCode = pass ? 0 : 1
} finally {
  await browser.close()
}
