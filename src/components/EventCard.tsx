import { useState } from 'react'
import type { HealthEvent } from '../data/types'
import { TODAY } from '../data/patient'
import { TYPE_LABEL, fmtDate } from '../engine/util'
import { IconCheck, IconDoc, IconLock, IconSync, IconUser } from '../ui/Icons'
import Sparkline from './Sparkline'

const CHANNEL_LABEL = {
  provider_api: 'Hospital API',
  authorized_entry: 'Authorized entry',
  patient: 'Patient entry',
} as const

interface Props {
  event: HealthEvent
  open: boolean
  flash?: boolean
  onToggle: () => void
  /** Present only when the viewer is the patient: lets them annotate a locked clinician record. */
  onAddNote?: (text: string) => void
}

export default function EventCard({ event: e, open, flash, onToggle, onAddNote }: Props) {
  const p = e.provenance
  const verified = p.verification === 'provider_verified'
  const isCurrent = e.tags.includes('current')
  const [note, setNote] = useState('')
  const canAnnotate = verified && !!onAddNote

  function submitNote() {
    const text = note.trim()
    if (!text || !onAddNote) return
    onAddNote(text)
    setNote('')
  }

  return (
    <article className={`event-card${open ? ' open' : ''}${flash ? ' flash' : ''}`}>
      <button type="button" className="event-btn" onClick={onToggle} aria-expanded={open}>
        <div className="event-meta">
          <span>{fmtDate(e.date)}</span>
          {e.endDate && <span>→ {fmtDate(e.endDate)}</span>}
          <span className="chip">{TYPE_LABEL[e.type]}</span>
          <span className={`chip ${verified ? 'chip-verified' : 'chip-patient'}`}>
            {verified ? <IconCheck size={11} /> : <IconUser size={11} />}
            {verified ? `Provider-verified · ${CHANNEL_LABEL[p.channel]}` : 'Patient-reported'}
          </span>
          {isCurrent && <span className="chip chip-new">Current</span>}
        </div>
        <h3>{e.title}</h3>
        <p>{e.summary}</p>
        <div className="event-src">
          {p.channel === 'patient' ? <IconUser size={12} /> : p.channel === 'provider_api' ? <IconSync size={12} /> : <IconDoc size={12} />}
          {p.institution} · {p.city}, {p.country} · {CHANNEL_LABEL[p.channel]}
        </div>
      </button>

      {open && (
        <div className="event-detail">
          {e.reason && (
            <div className="detail-block">
              <h4>Reason for visit</h4>
              <p>{e.reason}</p>
            </div>
          )}
          {e.assessment && (
            <div className="detail-block">
              <h4>Clinical assessment</h4>
              <p>{e.assessment}</p>
            </div>
          )}
          {e.diagnosis && (
            <div className="detail-block">
              <h4>Diagnosis</h4>
              <p>
                {e.diagnosis.label}
                {e.diagnosis.code ? ` · ${e.diagnosis.code}` : ''}
              </p>
            </div>
          )}
          {!!e.medications?.length && (
            <div className="detail-block">
              <h4>Medications</h4>
              {e.medications.map((m) => (
                <div className="kv" key={m.name + m.dose}>
                  <span>
                    {m.name} {m.dose}
                    {m.otc ? ' (OTC)' : ''}
                  </span>
                  <span>
                    {m.frequency}
                    {m.duration ? ` · ${m.duration}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
          {!!e.allergies?.length && (
            <div className="detail-block">
              <h4>Allergies</h4>
              {e.allergies.map((a) => (
                <div className="kv" key={a.substance}>
                  <span>{a.substance}</span>
                  <span className="flag-high">{a.reaction}</span>
                </div>
              ))}
            </div>
          )}
          {!!e.labs?.length && (
            <div className="detail-block">
              <h4>Results</h4>
              {e.labs.map((l) => (
                <div className="kv" key={l.name}>
                  <span>{l.name}</span>
                  <span className={l.flag === 'normal' ? '' : `flag-${l.flag}`}>
                    {l.value} {l.unit} · ref {l.ref}
                    {l.flag === 'normal' ? '' : ` · ${l.flag}`}
                  </span>
                </div>
              ))}
            </div>
          )}
          {!!e.series?.length && (
            <div className="detail-block">
              <h4>Symptom trend</h4>
              <Sparkline series={e.series} />
              <div className="kv">
                <span>Severity by day</span>
                <span>{e.series.map((s) => `D${s.day}: ${s.severity}`).join(' · ')}</span>
              </div>
            </div>
          )}
          {!!e.plan?.length && (
            <div className="detail-block">
              <h4>Plan</h4>
              <ul>
                {e.plan.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          )}
          {e.outcome && (
            <div className="detail-block">
              <h4>Outcome</h4>
              {e.outcome.improvement && (
                <div className="kv">
                  <span>Improvement</span>
                  <span>{e.outcome.improvement}</span>
                </div>
              )}
              {e.outcome.adherence && (
                <div className="kv">
                  <span>Adherence</span>
                  <span>{e.outcome.adherence}</span>
                </div>
              )}
              {e.outcome.sideEffects && (
                <div className="kv">
                  <span>Side effects</span>
                  <span>{e.outcome.sideEffects}</span>
                </div>
              )}
              {e.outcome.status && (
                <div className="kv">
                  <span>Status</span>
                  <span>{e.outcome.status}</span>
                </div>
              )}
            </div>
          )}
          {e.notes && (
            <div className="detail-block">
              <h4>Notes</h4>
              <p>{e.notes}</p>
            </div>
          )}
          {(!!e.patientAnnotations?.length || canAnnotate) && (
            <div className="detail-block">
              <h4>Patient annotations</h4>
              {e.patientAnnotations?.map((a) => (
                <div className="annotation" key={a.date + a.text}>
                  {fmtDate(a.date)} — {a.text}
                </div>
              ))}
              {canAnnotate && (
                <form
                  className="ask-form"
                  style={{ marginTop: 8 }}
                  onSubmit={(ev) => {
                    ev.preventDefault()
                    submitNote()
                  }}
                >
                  <input
                    value={note}
                    onChange={(ev) => setNote(ev.target.value)}
                    placeholder={`Add a note (dated ${fmtDate(TODAY)})`}
                    aria-label={`Add a patient note to ${e.id}`}
                  />
                  <button type="submit" className="btn btn-sm" disabled={!note.trim()}>
                    Add note
                  </button>
                </form>
              )}
            </div>
          )}
          {verified && (
            <p className="tiny muted" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0 12px' }}>
              <IconLock size={12} /> Locked clinician record — the patient can annotate, not edit.
            </p>
          )}

          <div className="provenance">
            <h4 className="eyebrow" style={{ marginBottom: 6 }}>
              Provenance
            </h4>
            <div className="kv">
              <span>Source</span>
              <span>
                {p.institution} · {p.city}, {p.country}
              </span>
            </div>
            <div className="kv">
              <span>How it arrived</span>
              <span>{CHANNEL_LABEL[p.channel]}</span>
            </div>
            <div className="kv">
              <span>Entered by</span>
              <span>{p.enteredBy}</span>
            </div>
            {p.verifiedBy && (
              <div className="kv">
                <span>Verified by</span>
                <span>{p.verifiedBy}</span>
              </div>
            )}
            <div className="kv">
              <span>Recorded at</span>
              <span>{p.recordedAt.replace('T', ' ').slice(0, 16)}</span>
            </div>
            {p.sourceRef && (
              <div className="kv">
                <span>Source reference</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5 }}>{p.sourceRef}</span>
              </div>
            )}
            {p.standard && (
              <div className="kv">
                <span>Standard</span>
                <span>{p.standard}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  )
}
