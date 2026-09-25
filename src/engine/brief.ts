// 30-second clinician brief — deterministic, derived from Health Events + patient logs, every line cited.
import type { HealthEvent, Lifestyle } from '../data/types'
import { fmtDate, monthYear } from './util'

export interface BriefItem {
  text: string
  cites: string[]
  tone: 'verified' | 'patient' | 'warn' | 'pattern'
}
export interface BriefSection {
  key: string
  title: string
  items: BriefItem[]
}
export interface Brief {
  sections: BriefSection[]
  hidden: number
  stats: { records: number; verified: number; patient: number; institutions: number; countries: number }
}

export function buildBrief(all: HealthEvent[], shared: HealthEvent[], life: Lifestyle, lifestyleShared: boolean): Brief {
  const has = (id: string) => shared.some((e) => e.id === id)
  const get = (id: string) => all.find((e) => e.id === id)!
  const last7 = life.log.slice(-7)
  const last8 = life.log.slice(-8)
  const hDays = last7.filter((d) => d.headache > 0)
  const maxSev = Math.max(...last7.map((d) => d.headache))
  const minSev = Math.min(...hDays.map((d) => d.headache))
  const ibu = last8.filter((d) => d.ibuprofen).length
  const avgSleep = last7.reduce((s, d) => s + d.sleepHours, 0) / last7.length
  const avgCaf = Math.round(last7.reduce((s, d) => s + d.caffeineCups, 0) / last7.length)

  const e1 = get('E1'), e4 = get('E4'), e5 = get('E5'), e6 = get('E6'), e7 = get('E7')
  const s6 = e6.series!

  const raw: BriefSection[] = [
    {
      key: 'today',
      title: 'Why he’s here today',
      items: [
        { text: `Headache on ${hDays.length} of the last 7 days, severity ${minSev}–${maxSev}/10`, cites: ['E10'], tone: 'patient' },
        ...(lifestyleShared
          ? [{ text: `Sleep avg ${avgSleep.toFixed(1)} h (00:30–05:30) · caffeine ~${avgCaf} cups/day`, cites: ['E10'], tone: 'patient' as const }]
          : []),
        { text: `OTC ibuprofen 400 mg on ${ibu} of the last 8 days · rizatriptan used twice`, cites: ['E10'], tone: 'patient' },
      ],
    },
    {
      key: 'history',
      title: 'Key history',
      items: [
        { text: `${e1.diagnosis!.label} — diagnosed ${monthYear(e1.date)}, Neurology (${e1.provenance.city})`, cites: ['E1'], tone: 'verified' },
        { text: `Probable medication-overuse headache — ${monthYear(e4.date)}, ${e7.outcome!.status!.toLowerCase()}`, cites: ['E4', 'E7'], tone: 'verified' },
      ],
    },
    {
      key: 'meds',
      title: 'Current medications',
      items: [
        { text: 'Rizatriptan 10 mg ODT at onset, as needed — since Jan 2025', cites: ['E8'], tone: 'verified' },
        { text: 'Ibuprofen 400 mg OTC — near-daily this week (self-reported)', cites: ['E10'], tone: 'patient' },
        { text: 'Vitamin D3 2,000 IU · magnesium 400 mg · omega-3 1 g', cites: ['E9'], tone: 'patient' },
      ],
    },
    {
      key: 'allergy',
      title: 'Allergies & intolerances',
      items: [
        { text: 'Penicillin — urticarial rash', cites: ['E4'], tone: 'warn' },
        { text: 'Sumatriptan — nausea, drowsiness → switched to rizatriptan', cites: ['E3', 'E8'], tone: 'warn' },
      ],
    },
    {
      key: 'worked',
      title: 'What worked last time',
      items: [
        { text: `${monthYear(e4.date)}: stopped ibuprofen + naproxen 500 mg twice daily × 10 days + sleep/caffeine plan`, cites: ['E4'], tone: 'verified' },
        { text: `Severity ${s6[0].severity}/10 → ${s6[s6.length - 1].severity}/10 in ${s6[s6.length - 1].day} days; improvement noticed by day 4`, cites: ['E6'], tone: 'patient' },
        { text: `Headache days 5/week → 1/week · adherence ${e7.outcome!.adherence!.split(' ')[0]} · no side effects`, cites: ['E7'], tone: 'verified' },
      ],
    },
    {
      key: 'review',
      title: 'Worth reviewing — not a diagnosis',
      items: [
        { text: 'Both frequent-headache periods coincide with sleep < 6 h and near-daily OTC pain relievers', cites: ['E4', 'E8', 'E10'], tone: 'pattern' },
        { text: `Vitamin D low (${e5.labs![0].value} ${e5.labs![0].unit}) on ${fmtDate(e5.date)} — no repeat on record`, cites: ['E5'], tone: 'pattern' },
      ],
    },
  ]

  let hidden = 0
  const sections = raw
    .map((s) => {
      const items = s.items.filter((i) => {
        const ok = i.cites.every(has)
        if (!ok) hidden++
        return ok
      })
      return { ...s, items }
    })
    .filter((s) => s.items.length)

  const cited = new Set(sections.flatMap((s) => s.items.flatMap((i) => i.cites)))
  const used = shared.filter((e) => cited.has(e.id))
  return {
    sections,
    hidden,
    stats: {
      records: used.length,
      verified: used.filter((e) => e.provenance.verification === 'provider_verified').length,
      patient: used.filter((e) => e.provenance.verification === 'patient_reported').length,
      institutions: new Set(used.filter((e) => e.provenance.channel !== 'patient').map((e) => e.provenance.institution)).size,
      countries: new Set(used.map((e) => e.provenance.country)).size,
    },
  }
}
