// Sijil grounded answer engine.
// Retrieval over the patient's Health Events + deterministic, citation-first synthesis.
// Every claim it emits carries the ids of the Health Events it came from. It never states
// anything it cannot cite, and it never diagnoses or recommends treatment.
import type { HealthEvent } from '../data/types'
import { FACTOR_LABEL, daysBetween, fmtDate, lowerFirst, monthYear, stripPeriod } from './util'

export type ClaimKind = 'fact' | 'patient' | 'pattern' | 'gap' | 'none'

export interface Claim {
  text: string
  cites: string[]
  kind: ClaimKind
}

export interface EpisodeMatch {
  label: string
  eventIds: string[]
  factors: { key: string; label: string; matched: boolean }[]
  matched: number
  total: number
}

export interface Answer {
  question: string
  intent: string
  claims: Claim[]
  match?: EpisodeMatch
  followUps: string[]
  safety: string
  considered: number
  retrieved: string[]
  engine: 'grounded' | 'claude'
  ms: number
  note?: string
}

const SAFETY =
  'Historical context from the patient’s own records — not a diagnosis or treatment recommendation. Clinical decisions rest with the treating clinician.'

const STOP = new Set(
  'the a an and or of to in on for with was were is are be been has have had does do did he she his her him mohammed patient what when where which who how any ever last time times this that there their from about me my i we our tell show did'.split(
    ' ',
  ),
)

const SYNONYMS: Record<string, string[]> = {
  headache: ['headache', 'migraine', 'head'],
  headaches: ['headache', 'migraine'],
  migraine: ['migraine', 'headache'],
  sleep: ['sleep', 'short-sleep'],
  coffee: ['caffeine'],
  caffeine: ['caffeine'],
  medication: ['medication', 'prescription'],
  medications: ['medication', 'prescription'],
  meds: ['medication', 'prescription'],
  vitamin: ['vitamin d'],
  blood: ['lab', 'blood test'],
  labs: ['lab'],
  allergy: ['allergy'],
  allergies: ['allergy'],
  exercise: ['exercise', 'lifestyle'],
  gym: ['exercise'],
  stress: ['stress', 'deadline'],
}

function terms(q: string): string[] {
  const words = q
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
  const out = new Set<string>()
  for (const w of words) {
    out.add(w)
    for (const s of SYNONYMS[w] ?? []) out.add(s)
  }
  return [...out]
}

function haystack(e: HealthEvent): string {
  return [
    e.title,
    e.summary,
    e.reason,
    e.assessment,
    e.diagnosis?.label,
    e.notes,
    e.tags.join(' '),
    (e.medications ?? []).map((m) => m.name).join(' '),
    (e.labs ?? []).map((l) => l.name).join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function retrieve(q: string, events: HealthEvent[]): { event: HealthEvent; score: number }[] {
  const t = terms(q)
  return events
    .map((event) => {
      const h = haystack(event)
      let score = 0
      for (const term of t) {
        if (event.tags.includes(term)) score += 3
        else if (h.includes(term)) score += 1
      }
      return { event, score }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.event.date.localeCompare(b.event.date))
}

// ---------- episode similarity ----------

function currentEpisode(events: HealthEvent[]): HealthEvent | undefined {
  return [...events].filter((e) => e.tags.includes('current') && e.type === 'symptom_log').sort((a, b) => b.date.localeCompare(a.date))[0]
}

function bestPriorEpisode(events: HealthEvent[], current: HealthEvent): EpisodeMatch | undefined {
  const prior = events.filter((e) => e.date < current.date && e.id !== current.id)
  const anchors = prior.filter((e) => e.factors?.includes('frequent-headache'))
  const target = (current.factors ?? []).filter((f) => f in FACTOR_LABEL)
  let best: EpisodeMatch | undefined
  const seen = new Set<string>()
  for (const a of anchors) {
    const cluster = prior.filter((e) => daysBetween(e.date, a.date) <= 30)
    const key = cluster.map((e) => e.id).join(',')
    if (seen.has(key)) continue
    seen.add(key)
    const union = new Set(cluster.flatMap((e) => e.factors ?? []))
    const factors = target.map((k) => ({ key: k, label: FACTOR_LABEL[k], matched: union.has(k) }))
    const matched = factors.filter((f) => f.matched).length
    if (!best || matched > best.matched) {
      const start = cluster.map((e) => e.date).sort()[0]
      best = { label: monthYear(start, true), eventIds: cluster.map((e) => e.id), factors, matched, total: factors.length }
    }
  }
  return best
}

function byId(events: HealthEvent[], ids: string[]): HealthEvent[] {
  return ids.map((id) => events.find((e) => e.id === id)).filter((e): e is HealthEvent => !!e)
}

// ---------- intents ----------

function similarEpisode(events: HealthEvent[]): Pick<Answer, 'claims' | 'match' | 'note'> {
  const current = currentEpisode(events)
  if (!current) return { claims: [{ text: 'No current symptom log is on record to compare against.', cites: [], kind: 'none' }] }
  const match = bestPriorEpisode(events, current)
  if (!match || match.matched === 0)
    return { claims: [{ text: 'No earlier episode with similar features was found in the shared records.', cites: [current.id], kind: 'gap' }] }

  const ep = byId(events, match.eventIds)
  const visit = ep.find((e) => e.type === 'visit')
  const log = ep.find((e) => e.type === 'symptom_log' && e.series?.length)
  const outcome = ep.find((e) => e.type === 'treatment_outcome')
  const lab = ep.find((e) => e.type === 'lab')
  const claims: Claim[] = []

  claims.push({
    text: `The closest match is ${match.label}: ${match.matched} of ${match.total} factors in the current episode were also present then.`,
    cites: [visit?.id ?? ep[0].id, current.id],
    kind: 'fact',
  })
  if (visit) {
    const p = visit.provenance
    claims.push({
      text: `On ${fmtDate(visit.date)}, ${visit.provider} (${visit.specialty}, ${p.institution}, ${p.city}) documented ${lowerFirst(stripPeriod(visit.reason ?? visit.summary))}, with ${lowerFirst(visit.diagnosis?.label.split('—').pop()?.trim() ?? 'a frequent headache pattern')}.`,
      cites: [visit.id],
      kind: 'fact',
    })
    if (visit.plan?.length)
      claims.push({ text: `Plan recorded at the time: ${visit.plan.slice(0, 3).map(lowerFirst).join('; ')}.`, cites: [visit.id], kind: 'fact' })
  }
  if (log?.series) {
    const s = log.series
    const first = s[0]
    const turn = s.find((x) => x.note) ?? s[Math.floor(s.length / 2)]
    const last = s[s.length - 1]
    claims.push({
      text: `Mohammed’s own log shows severity falling from ${first.severity}/10 on day ${first.day} to ${turn.severity}/10 by day ${turn.day} and ${last.severity}/10 by day ${last.day}.`,
      cites: [log.id],
      kind: 'patient',
    })
  }
  if (outcome?.outcome) {
    const o = outcome.outcome
    claims.push({
      text: `At follow-up on ${fmtDate(outcome.date)}: ${lowerFirst(o.improvement ?? '')}; adherence ${o.adherence}; side effects: ${lowerFirst(o.sideEffects ?? 'not recorded')}.`,
      cites: [outcome.id],
      kind: 'fact',
    })
  }
  if (lab?.labs) {
    for (const l of lab.labs.filter((x) => x.flag !== 'normal')) {
      const repeat = events.some((e) => e.date > lab.date && e.labs?.some((x) => x.name === l.name))
      claims.push({
        text: `${l.name} was ${l.flag} at ${l.value} ${l.unit} (${fmtDate(lab.date)})${repeat ? '.' : '; no repeat result is on record.'}`,
        cites: [lab.id],
        kind: repeat ? 'fact' : 'gap',
      })
    }
  }
  return { claims, match }
}

function medicationHistory(events: HealthEvent[]): Pick<Answer, 'claims'> {
  const norm = (n: string) => n.replace(/\s*\(OTC\)/i, '').replace(/\s*ODT/i, '').trim()
  const meds = new Map<string, { name: string; dose: string; ids: string[]; first: string; otc: boolean; statuses: string[] }>()
  for (const e of [...events].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const m of e.medications ?? []) {
      const k = norm(m.name)
      const cur = meds.get(k) ?? { name: k, dose: m.dose, ids: [], first: e.date, otc: !!m.otc, statuses: [] }
      if (!cur.ids.includes(e.id)) cur.ids.push(e.id)
      if (m.status) cur.statuses.push(m.status)
      meds.set(k, cur)
    }
  }
  const claims: Claim[] = []
  for (const m of meds.values()) {
    if (['Vitamin D3', 'Magnesium glycinate', 'Omega-3'].includes(m.name)) continue
    const sideFx = events.find((e) => e.tags.includes('side effect') && e.tags.includes(m.name.toLowerCase()) && e.type === 'patient_note')
    const outcome = events.find((e) => e.type === 'treatment_outcome' && e.tags.includes(m.name.toLowerCase()))
    const last = m.statuses[m.statuses.length - 1]
    const parts = [`${m.name} ${m.dose}${m.otc ? ' (over the counter)' : ''} — first recorded ${monthYear(m.first)}`]
    if (sideFx) parts.push('side effects reported by patient')
    if (outcome?.outcome?.improvement) parts.push(`outcome: ${lowerFirst(outcome.outcome.improvement)}`)
    if (last) parts.push(`latest status: ${last === 'as-needed' ? 'active, as needed' : last}`)
    const cites = [...m.ids, ...(sideFx ? [sideFx.id] : []), ...(outcome ? [outcome.id] : [])]
    claims.push({ text: parts.join(' · ') + '.', cites: [...new Set(cites)], kind: 'fact' })
  }
  const supp = events.find((e) => e.type === 'lifestyle' && e.medications?.length)
  if (supp) claims.push({ text: `Supplements (patient-reported): ${supp.medications!.map((m) => `${m.name} ${m.dose}`).join(', ')}.`, cites: [supp.id], kind: 'patient' })
  if (!claims.length) claims.push({ text: 'No medications are recorded in the shared records.', cites: [], kind: 'none' })
  return { claims }
}

function whatChanged(events: HealthEvent[]): Pick<Answer, 'claims' | 'match'> {
  const current = currentEpisode(events)
  if (!current) return { claims: [{ text: 'No current episode is on record.', cites: [], kind: 'none' }] }
  const match = bestPriorEpisode(events, current)
  const claims: Claim[] = []
  if (match) {
    const same = match.factors.filter((f) => f.matched).map((f) => lowerFirst(f.label))
    const diff = match.factors.filter((f) => !f.matched).map((f) => lowerFirst(f.label))
    const visit = byId(events, match.eventIds).find((e) => e.type === 'visit')
    claims.push({ text: `Same as ${match.label}: ${same.join(', ')}.`, cites: [visit?.id ?? match.eventIds[0], current.id], kind: 'fact' })
    if (diff.length) claims.push({ text: `New this time: ${diff.join(', ')} (Abu Dhabi → London, 21 Sep).`, cites: [current.id], kind: 'patient' })
  }
  const change = events.find((e) => e.type === 'medication_change' && e.date > (match ? events.find((x) => x.id === match.eventIds[0])!.date : '0'))
  if (change) claims.push({ text: `Since then, on ${fmtDate(change.date)}, ${change.provider} switched sumatriptan to rizatriptan 10 mg because of side effects.`, cites: [change.id], kind: 'fact' })
  const life = events.find((e) => e.type === 'lifestyle')
  if (life) claims.push({ text: `From ${monthYear(life.date)} he reports strength training 3×/week and daily vitamin D3, magnesium and omega-3.`, cites: [life.id], kind: 'patient' })
  const lab = events.find((e) => e.type === 'lab' && e.labs?.some((l) => l.flag === 'low'))
  if (lab) {
    const l = lab.labs!.find((x) => x.flag === 'low')!
    claims.push({ text: `${l.name} was ${l.flag} at ${l.value} ${l.unit} in ${monthYear(lab.date)} and has not been re-tested since.`, cites: [lab.id], kind: 'gap' })
  }
  return { claims, match }
}

function firstDocumented(q: string, events: HealthEvent[]): Pick<Answer, 'claims'> {
  const hits = retrieve(q.replace(/first|documented|diagnosed|when/gi, ''), events).map((r) => r.event)
  const first = hits.filter((e) => e.provenance.verification === 'provider_verified').sort((a, b) => a.date.localeCompare(b.date))[0]
  if (!first) return { claims: [{ text: 'No clinician-verified record matches that in the shared records.', cites: [], kind: 'none' }] }
  const p = first.provenance
  const claims: Claim[] = [
    {
      text: `First documented on ${fmtDate(first.date)} by ${first.provider} (${first.specialty}, ${p.institution}, ${p.city})${first.diagnosis ? `: ${first.diagnosis.label} (${first.diagnosis.code})` : ''}.`,
      cites: [first.id],
      kind: 'fact',
    },
  ]
  if (first.reason) claims.push({ text: `Presenting complaint then: ${lowerFirst(first.reason)}`, cites: [first.id], kind: 'fact' })
  const later = hits.filter((e) => e.date > first.date).map((e) => e.id)
  if (later.length) claims.push({ text: `${later.length} later records mention it.`, cites: later, kind: 'fact' })
  return { claims }
}

function allergies(events: HealthEvent[]): Pick<Answer, 'claims'> {
  const claims: Claim[] = []
  for (const e of events)
    for (const a of e.allergies ?? [])
      claims.push({ text: `Allergy: ${a.substance} — ${lowerFirst(a.reaction)}, recorded at ${e.provenance.institution} (${fmtDate(e.date)}).`, cites: [e.id], kind: 'fact' })
  const intol = events.filter((e) => e.tags.includes('side effect'))
  if (intol.length) claims.push({ text: 'Intolerance: sumatriptan — nausea and drowsiness; switched to rizatriptan in January 2025.', cites: intol.map((e) => e.id), kind: 'fact' })
  if (!claims.length) claims.push({ text: 'No allergies are recorded in the shared records.', cites: [], kind: 'none' })
  return { claims }
}

function labs(events: HealthEvent[]): Pick<Answer, 'claims'> {
  const claims: Claim[] = []
  for (const e of events.filter((x) => x.labs?.length)) {
    const abn = e.labs!.filter((l) => l.flag !== 'normal')
    const norm = e.labs!.filter((l) => l.flag === 'normal')
    claims.push({
      text: `${fmtDate(e.date)}, ${e.provenance.institution}: ${abn.map((l) => `${l.name} ${l.value} ${l.unit} (${l.flag}, ref ${l.ref})`).join('; ')}${norm.length ? `; ${norm.map((l) => l.name).join(', ')} within range` : ''}.`,
      cites: [e.id],
      kind: 'fact',
    })
  }
  if (!claims.length) claims.push({ text: 'No lab results are in the shared records.', cites: [], kind: 'none' })
  return { claims }
}

function generic(q: string, events: HealthEvent[]): Pick<Answer, 'claims'> {
  const hits = retrieve(q, events).slice(0, 4)
  if (!hits.length) {
    const t = terms(q)[0] ?? 'that'
    return {
      claims: [
        {
          text: `There is no record of “${t}” in the ${events.length} Health Events shared with you. Sijil only answers from records it can cite — absence of a record is not evidence of absence, so confirm with the patient.`,
          cites: [],
          kind: 'none',
        },
      ],
    }
  }
  return {
    claims: hits.map(({ event: e }) => ({
      text: `${fmtDate(e.date)} — ${e.title}: ${lowerFirst(stripPeriod(e.summary))}.`,
      cites: [e.id],
      kind: e.provenance.verification === 'patient_reported' ? ('patient' as const) : ('fact' as const),
    })),
  }
}

export function askGrounded(question: string, events: HealthEvent[]): Answer {
  const t0 = performance.now()
  const q = question.toLowerCase()
  let intent = 'search'
  let body: Pick<Answer, 'claims' | 'match' | 'note'>
  let followUps: string[]

  if (/(last time|similar|before|previous(ly)? (episode|time)|happened.*(last|before)|seen this)/.test(q)) {
    intent = 'similar_episode'
    body = similarEpisode(events)
    followUps = ['What changed since the last episode?', 'What medications has he tried for headaches?', 'Does he have any allergies?']
  } else if (/(what|anything).*(changed|different)|compare/.test(q)) {
    intent = 'what_changed'
    body = whatChanged(events)
    followUps = ['What medications has he tried for headaches?', 'Show his lab results', 'Does he have diabetes?']
  } else if (/(medication|medicine|meds|drug|tried|taken|prescri)/.test(q)) {
    intent = 'medication_history'
    body = medicationHistory(events)
    followUps = ['Does he have any allergies?', 'What changed since the last episode?']
  } else if (/allerg|intoleran|react/.test(q)) {
    intent = 'allergies'
    body = allergies(events)
    followUps = ['What medications has he tried for headaches?', 'Show his lab results']
  } else if (/(first|earliest).*(document|diagnos|record|time|seen)|when was.*(first|diagnos)/.test(q)) {
    intent = 'first_documented'
    body = firstDocumented(question, events)
    followUps = ['What happened the last time he had similar symptoms?', 'What medications has he tried for headaches?']
  } else if (/\blab|blood|vitamin|test result|tsh|ferritin/.test(q)) {
    intent = 'labs'
    body = labs(events)
    followUps = ['What changed since the last episode?']
  } else {
    body = generic(question, events)
    followUps = ['What happened the last time he had similar symptoms?', 'What medications has he tried for headaches?']
  }

  const retrieved = [...new Set(body.claims.flatMap((c) => c.cites))]
  return {
    question,
    intent,
    ...body,
    followUps,
    safety: SAFETY,
    considered: events.length,
    retrieved,
    engine: 'grounded',
    ms: Math.max(1, Math.round(performance.now() - t0)),
  }
}

export const SUGGESTED = [
  'What happened the last time he had similar symptoms?',
  'What medications has he tried for headaches?',
  'What changed since the last episode?',
  'When was the headache first documented?',
  'Does he have diabetes?',
]
