import { useMemo, useState } from 'react'
import type { HealthEvent } from '../data/types'
import EventCard from './EventCard'

const FILTERS: { key: string; label: string; match: (e: HealthEvent) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'clinical', label: 'Clinician-verified', match: (e) => e.provenance.verification === 'provider_verified' },
  { key: 'mine', label: 'Patient-reported', match: (e) => e.provenance.verification === 'patient_reported' },
  { key: 'meds', label: 'Medications', match: (e) => e.type === 'prescription' || e.type === 'medication_change' },
  { key: 'labs', label: 'Labs', match: (e) => e.type === 'lab' },
]

interface Props {
  events: HealthEvent[]
  /** Event id to highlight (e.g. the visit that just synced in). */
  flashId?: string | null
  openId?: string | null
  onAddNote?: (eventId: string, text: string) => void
}

export default function Timeline({ events, flashId, openId, onAddNote }: Props) {
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState<string | null>(openId ?? null)

  const shown = useMemo(() => {
    const match = FILTERS.find((f) => f.key === filter)!.match
    return [...events].filter(match).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
  }, [events, filter])

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>Health timeline</h2>
          <p>Every record carries where it came from and who verified it.</p>
        </div>
        <div className="spacer" />
        <span className="chip">{shown.length} shown</span>
      </div>

      <div className="filters">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="timeline">
        {shown.map((e, i) => {
          const year = e.date.slice(0, 4)
          const newYear = i === 0 || year !== shown[i - 1].date.slice(0, 4)
          const patient = e.provenance.verification === 'patient_reported'
          return (
            <div key={e.id}>
              {newYear && <div className="tl-year">{year}</div>}
              <div className="event">
                <span className={`event-node${e.tags.includes('current') ? ' current' : patient ? ' patient' : ''}`} />
                <EventCard
                  event={e}
                  open={open === e.id}
                  flash={flashId === e.id}
                  onToggle={() => setOpen(open === e.id ? null : e.id)}
                  onAddNote={onAddNote ? (text) => onAddNote(e.id, text) : undefined}
                />
              </div>
            </div>
          )
        })}
        {!shown.length && <p className="muted tiny" style={{ padding: '18px 0 6px 34px' }}>No records match this filter.</p>}
      </div>
    </section>
  )
}
