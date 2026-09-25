// Sijil core data model.
// Everything in the record is a HealthEvent. Every HealthEvent carries Provenance.

export type EventType =
  | 'diagnosis'
  | 'prescription'
  | 'visit'
  | 'lab'
  | 'medication_change'
  | 'symptom_log'
  | 'patient_note'
  | 'treatment_outcome'
  | 'lifestyle'

/** How the event entered Sijil. */
export type Channel =
  | 'provider_api' // Scenario A: provider EHR/LIS pushes via API (e.g. HL7 FHIR R4)
  | 'authorized_entry' // Scenario B: provider has no API; an authorized records officer transcribes + verifies
  | 'patient' // patient-generated

export type Verification = 'provider_verified' | 'patient_reported'

export interface Provenance {
  institution: string
  city: string
  country: string
  channel: Channel
  enteredBy: string
  recordedAt: string // ISO datetime the event entered Sijil
  verification: Verification
  verifiedBy?: string
  sourceRef?: string // original record id at the provider
  standard?: string // e.g. "HL7 FHIR R4 · Encounter"
}

export interface Medication {
  name: string
  dose: string
  frequency: string
  duration?: string
  status?: 'active' | 'completed' | 'stopped' | 'as-needed'
  otc?: boolean
}

export interface LabValue {
  name: string
  value: string
  unit: string
  ref: string
  flag: 'low' | 'high' | 'normal'
}

export interface SeriesPoint {
  day: number
  date: string
  severity: number // 0-10 patient-reported
  sleepHours?: number
  note?: string
}

export interface PatientAnnotation {
  date: string
  text: string
}

export interface HealthEvent {
  id: string
  date: string // ISO date (start date)
  endDate?: string
  type: EventType
  title: string
  summary: string
  provider?: string
  specialty?: string
  reason?: string
  assessment?: string
  diagnosis?: { label: string; code?: string }
  medications?: Medication[]
  allergies?: { substance: string; reaction: string }[]
  labs?: LabValue[]
  series?: SeriesPoint[]
  plan?: string[]
  notes?: string
  outcome?: { adherence?: string; improvement?: string; sideEffects?: string; status?: string }
  /** Patient annotations on a clinician record. Patients can add context; they can never edit the verified record. */
  patientAnnotations?: PatientAnnotation[]
  attachments?: string[]
  /** Clinical/contextual factors used by the similarity engine. */
  factors?: string[]
  tags: string[]
  provenance: Provenance
}

export interface Patient {
  id: string
  name: string
  nameAr: string
  age: number
  sex: 'M' | 'F'
  dob: string
  bloodType: string
  residence: string
  currentLocation: string
  languages: string[]
  emergencyContact: string
}

export interface DailyLog {
  date: string
  sleepHours: number
  bedtime: string
  wake: string
  caffeineCups: number
  headache: number // 0-10
  ibuprofen: boolean
  exercise: boolean
}

export interface Lifestyle {
  sleepTypical: string
  exercise: string
  caffeine: string
  diet: string
  work: string
  supplements: { name: string; dose: string; since: string }[]
  routine: { time: string; item: string; kind: 'med' | 'meal' | 'sleep' | 'activity' | 'supplement' }[]
  log: DailyLog[]
}

export interface DataSource {
  name: string
  city: string
  country: string
  flag: string
  channel: Channel
  status: string
  detail: string
}

export interface AccessGrant {
  clinician: string
  role: string
  institution: string
  city: string
  flag: string
  scopes: Record<string, boolean>
  grantedAt: string
  expiresHours: number
  active: boolean
}

export interface AccessLogEntry {
  time: string
  actor: string
  action: string
  detail?: string
  kind: 'grant' | 'view' | 'query' | 'revoke' | 'sync' | 'source'
}
