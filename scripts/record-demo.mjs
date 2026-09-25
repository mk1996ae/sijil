// Records the demo click path (final audit steps a–h) on the live site.
// Usage: node scripts/record-demo.mjs [url] [outDir]
// Output: <outDir>/demo.webm — convert with: ffmpeg -i demo.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart demo.mp4
import { chromium } from 'playwright'
import { mkdirSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const URL = process.argv[2] ?? 'https://mk1996ae.github.io/sijil/'
const OUT = process.argv[3] ?? 'demo-video'
const PAUSE = 2000
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
})
const page = await context.newPage()
await page.goto(URL, { waitUntil: 'networkidle' })

const caption = async (text) => {
  await page.evaluate((t) => {
    let bar = document.getElementById('demo-caption')
    if (!bar) {
      bar = document.createElement('div')
      bar.id = 'demo-caption'
      Object.assign(bar.style, {
        position: 'fixed', left: '0', right: '0', bottom: '0', zIndex: '99999',
        padding: '14px 28px', background: 'rgba(16,35,31,0.94)', color: '#fff',
        font: '600 17px/1.4 "Inter Variable", Inter, system-ui, sans-serif', letterSpacing: '0.01em',
        boxShadow: '0 -6px 24px rgba(0,0,0,0.25)', transition: 'opacity 0.3s',
      })
      document.body.appendChild(bar)
    }
    bar.textContent = t
  }, text)
}
const pause = (ms = PAUSE) => page.waitForTimeout(ms)
const tab = (name) => page.getByRole('button', { name: new RegExp(`^${name}`) }).first().click()
const eventCard = (title) => page.locator('.event-card', { hasText: title }).first()
const ask = async (q) => {
  const input = page.locator('.ask-form input')
  await input.click()
  await input.fill('')
  await input.pressSequentially(q, { delay: 28 })
  await pause(600)
  await input.press('Enter')
}

await caption('Sijil — the health memory that travels with you. Mohammed Al Noor, 34, Abu Dhabi → London, headaches 5 of the last 7 days.')
await pause(3000)

// a
await caption('a. Patient view — 10 Health Events, every record carries its provenance.')
await pause()
await eventCard('frequent headaches during deadline').locator('.event-btn').click()
await eventCard('frequent headaches during deadline').scrollIntoViewIfNeeded()
await caption('a. E4, March 2024 — authorized entry by R. Menon, verified by Dr. Omar Khalil. Locked clinician record; the patient can annotate, not edit.')
await pause(3500)
await eventCard('frequent headaches during deadline').locator('.event-btn').click()
await pause(800)
await page.locator('#daily-life').scrollIntoViewIfNeeded()
await caption('a. Daily life — 14-day patient-reported log: sleep, headache severity, ibuprofen days, the flight to London.')
await pause(3500)
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
await pause(800)

// b
await caption('b. Share — Mohammed grants Dr. Emily Carter 24-hour scoped access, Labs on, Mental health off.')
await page.getByRole('button', { name: /^Share/ }).first().click()
await pause()
await page.getByRole('button', { name: '24 hours' }).click()
await pause(1200)
await page.getByRole('button', { name: /^Grant access/ }).click()
await pause()

// c
await tab('Clinician')
await caption('c. Clinician view — the 30-second brief: 6 sections, 15 items, every line cited to a Health Event.')
await pause(3500)
await page.locator('.brief-section').last().scrollIntoViewIfNeeded()
await pause()

// d
await page.locator('.ask-form').scrollIntoViewIfNeeded()
await caption('d. Ask Sijil — "What happened the last time he had similar symptoms?"')
await ask('What happened the last time he had similar symptoms?')
await pause()
await page.locator('.claim').last().scrollIntoViewIfNeeded()
await caption('d. March 2024 — 5 of 6 factors match; 6 claims, 6 of 6 statements cited. Not a diagnosis.')
await pause(3500)
await page.locator('.claim .cite', { hasText: 'E6' }).first().click()
await caption('d. Clicking a citation opens the exact source record — E6, a patient-reported symptom log.')
await pause(3000)
await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
await pause(600)

// e
await page.locator('.ask-form').scrollIntoViewIfNeeded()
await caption('e. "Does he have diabetes?" — when the record does not contain it, Sijil says so. No invented facts.')
await ask('Does he have diabetes?')
await pause(3000)

// f
await page.getByRole('button', { name: /File this visit to Sijil/ }).scrollIntoViewIfNeeded()
await caption('f. Dr. Carter files today’s visit — it syncs back into Mohammed’s record as E11, provider-verified.')
await pause(1200)
await page.getByRole('button', { name: /File this visit to Sijil/ }).click()
await pause()
await tab('Patient')
await pause(800)
await caption('f. E11 — Harbourside Medical Practice · Hospital API · verified by Dr. Emily Carter. 11 events now.')
await pause(3000)

// g
const accessCard = page.locator('section.card', { hasText: 'Who can see my record' })
await accessCard.scrollIntoViewIfNeeded()
await caption('g. Access log — grant, brief view, each question, each citation opened, the E11 filing. Actor + time, patient-visible.')
await pause(3500)

// h
await caption('h. Revoke — Mohammed withdraws access; the clinician view locks immediately.')
await page.getByRole('button', { name: /^Revoke/ }).click()
await pause(1500)
await tab('Clinician')
await pause(2500)
await caption('Sijil — patient-owned, provenance on every record, every answer cited. Synthetic demo data — fictional patient. Not medical advice.')
await pause(3000)

const video = page.video()
await context.close()
await browser.close()
const path = await video.path()
renameSync(path, join(OUT, 'demo.webm'))
console.log(`Recorded ${join(OUT, 'demo.webm')}`)
