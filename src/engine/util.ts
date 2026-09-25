import type { EventType, HealthEvent } from '../data/types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}
export function fmtShort(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${d} ${MONTHS[m - 1]}`
}
export function monthYear(iso: string, long = false): string {
  const [y, m] = iso.slice(0, 10).split('-').map(Number)
  return `${(long ? MONTHS_LONG : MONTHS)[m - 1]} ${y}`
}
export function daysBetween(a: string, b: string): number {
  return Math.abs((new Date(a).getTime() - new Date(b).getTime()) / 86400000)
}
export function lowerFirst(s: string): string {
  return s ? s[0].toLowerCase() + s.slice(1) : s
}
export function stripPeriod(s: string): string {
  return s.replace(/\.\s*$/, '')
}

export const TYPE_LABEL: Record<EventType, string> = {
  diagnosis: 'Diagnosis',
  prescription: 'Prescription',
  visit: 'Clinic visit',
  lab: 'Lab result',
  medication_change: 'Medication change',
  symptom_log: 'Symptom log',
  patient_note: 'Patient note',
  treatment_outcome: 'Treatment outcome',
  lifestyle: 'Lifestyle',
}

/** Which sharing scope an event falls under (used to enforce the patient's consent). */
export function scopeOf(e: HealthEvent): string {
  switch (e.type) {
    case 'lab':
      return 'labs'
    case 'prescription':
    case 'medication_change':
      return 'medications'
    case 'symptom_log':
    case 'patient_note':
      return 'patient'
    case 'lifestyle':
      return 'lifestyle'
    default:
      return 'diagnoses'
  }
}

export function inScope(events: HealthEvent[], scopes: Record<string, boolean>): HealthEvent[] {
  return events.filter((e) => scopes[scopeOf(e)] !== false)
}

export const FACTOR_LABEL: Record<string, string> = {
  'frequent-headache': 'Frequent headaches (4–5 days/week)',
  'short-sleep': 'Short sleep (≈ 5 h/night)',
  'otc-analgesic': 'Near-daily OTC ibuprofen',
  'high-caffeine': 'High caffeine (5+ cups/day)',
  'work-stress': 'Work deadline pressure',
  travel: 'Long-haul travel',
}
