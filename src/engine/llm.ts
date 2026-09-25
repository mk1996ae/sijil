// Optional Claude mode. The model only sees the Health Events the patient has shared,
// must return claims with citations, and any claim citing a non-existent event is dropped.
// On any failure we fall back to the grounded engine so the demo never breaks.
import type { HealthEvent } from '../data/types'
import { askGrounded, type Answer, type Claim } from './ask'

export async function askClaude(question: string, events: HealthEvent[]): Promise<Answer> {
  const t0 = performance.now()
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 15000)
  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question, events }),
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`api ${res.status}`)
    const data = (await res.json()) as { claims?: { text: string; cites: string[]; kind?: string }[]; followUps?: string[] }
    const ids = new Set(events.map((e) => e.id))
    const raw = data.claims ?? []
    const claims: Claim[] = raw
      .map((c) => ({ text: String(c.text), cites: (c.cites ?? []).filter((id) => ids.has(id)), kind: (c.kind as Claim['kind']) ?? 'fact' }))
      .filter((c) => c.cites.length > 0 || c.kind === 'none')
    if (!claims.length) throw new Error('no cited claims')
    const dropped = raw.length - claims.length
    const base = askGrounded(question, events)
    return {
      ...base,
      claims,
      match: undefined,
      followUps: data.followUps?.slice(0, 3) ?? base.followUps,
      engine: 'claude',
      retrieved: [...new Set(claims.flatMap((c) => c.cites))],
      ms: Math.round(performance.now() - t0),
      note: dropped > 0 ? `${dropped} uncited statement${dropped > 1 ? 's' : ''} removed by citation guard` : undefined,
    }
  } catch (err) {
    const a = askGrounded(question, events)
    return { ...a, note: `Claude unavailable (${(err as Error).message}) — answered by the offline grounded engine` }
  } finally {
    clearTimeout(timer)
  }
}
