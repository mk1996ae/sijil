// Engine smoke test — run: npx tsx scripts/smoke.ts
// Fails (exit 1) if any claim is uncited, cites a non-existent event, or if safety language slips.
import { events, lifestyle, initialGrant } from '../src/data/patient'
import { askGrounded, SUGGESTED } from '../src/engine/ask'
import { buildBrief } from '../src/engine/brief'
import { inScope } from '../src/engine/util'

let fail = 0
const ids = new Set(events.map((e) => e.id))
const BANNED = /\b(you have|diagnosed with (?!migraine)|you should (stop|start|take)|stop taking|increase (the )?dose)\b/i
const shared = inScope(events, initialGrant.scopes)
for (const q of SUGGESTED) {
  const a = askGrounded(q, shared)
  console.log(`\nQ: ${q}  [${a.intent}]`)
  for (const c of a.claims) {
    const bad = (c.kind !== 'none' && c.cites.length === 0) || c.cites.some((id) => !ids.has(id)) || BANNED.test(c.text)
    if (bad) fail++
    console.log(`  ${bad ? 'FAIL' : 'ok  '} ${c.text}  [${c.cites.join(', ')}]`)
  }
}
const sim = askGrounded(SUGGESTED[0], shared)
if (!sim.match || sim.match.label !== 'March 2024') { fail++; console.log('FAIL similar-episode should match March 2024') }
const b = buildBrief(events, shared, lifestyle, true)
for (const s of b.sections) for (const i of s.items) if (!i.cites.length || i.cites.some((id) => !ids.has(id))) { fail++; console.log('FAIL brief', i.text) }
const noLabs = buildBrief(events, inScope(events, { ...initialGrant.scopes, labs: false }), lifestyle, true)
if (noLabs.hidden < 1) { fail++; console.log('FAIL scope: labs off should hide the vitamin D line') }
console.log(fail ? `\n${fail} FAILURES` : '\nALL CHECKS PASSED')
process.exit(fail ? 1 : 0)
