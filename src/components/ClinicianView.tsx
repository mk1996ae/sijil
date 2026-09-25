import type { AccessGrant, HealthEvent, Lifestyle, Patient } from '../data/types'
import { SCOPES } from '../data/patient'
import { TYPE_LABEL, fmtDate } from '../engine/util'
import { IconCheck, IconClock, IconLock, IconSync } from '../ui/Icons'
import Ask from './Ask'
import Brief from './Brief'

interface Props {
  patient: Patient
  grant: AccessGrant
  all: HealthEvent[]
  shared: HealthEvent[]
  lifestyle: Lifestyle
  incoming: HealthEvent
  filed: boolean
  onOpenSource: (id: string) => void
  onQuery: (question: string, retrieved: number) => void
  onFileVisit: () => void
}

export default function ClinicianView({
  patient,
  grant,
  all,
  shared,
  lifestyle,
  incoming,
  filed,
  onOpenSource,
  onQuery,
  onFileVisit,
}: Props) {
  const withheld = SCOPES.filter((s) => !grant.scopes[s.key])

  return (
    <div className="columns">
      <div className="stack">
        <Brief
          patient={patient}
          all={all}
          shared={shared}
          lifestyle={lifestyle}
          lifestyleShared={grant.scopes.lifestyle !== false}
          onOpenSource={onOpenSource}
        />
        <Ask shared={shared} onOpenSource={onOpenSource} onQuery={onQuery} />
      </div>

      <div className="stack">
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Your access</h2>
              <p>Granted by the patient.</p>
            </div>
            <div className="spacer" />
            <span className="chip chip-verified">
              <IconClock size={11} /> {grant.expiresHours} h
            </span>
          </div>
          <div className="card-body">
            <div className="rows">
              <div className="row">
                <span className="row-time">Clinician</span>
                <div className="row-main">
                  <strong>
                    {grant.clinician} · {grant.role}
                  </strong>
                  <span>
                    {grant.institution}, {grant.city}
                  </span>
                </div>
              </div>
              <div className="row">
                <span className="row-time">Granted</span>
                <div className="row-main">
                  <span>
                    {grant.grantedAt} today · expires automatically in {grant.expiresHours} h
                  </span>
                </div>
              </div>
              <div className="row">
                <span className="row-time">Scope</span>
                <div className="row-main">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {SCOPES.filter((s) => grant.scopes[s.key]).map((s) => (
                      <span className="chip chip-verified" key={s.key}>
                        <IconCheck size={11} /> {s.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {!!withheld.length && (
              <div className="notice" style={{ marginTop: 12 }}>
                <IconLock size={15} />
                <span>
                  Withheld by the patient: {withheld.map((s) => s.label).join(', ')}. Absence of a record here is not evidence of absence — ask the
                  patient.
                </span>
              </div>
            )}
            <p className="tiny muted" style={{ marginTop: 12 }}>
              {shared.length} of {all.length} Health Events are visible to you. Every record you open and every question you ask is written to the
              patient’s access log.
            </p>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>Today’s visit</h2>
              <p>{fmtDate(incoming.date)} · {incoming.provider}</p>
            </div>
            <div className="spacer" />
            <span className={`chip ${filed ? 'chip-verified' : ''}`}>{filed ? 'Filed to Sijil' : 'Draft'}</span>
          </div>
          <div className="card-body">
            <p className="tiny muted">{incoming.assessment}</p>
            <h3 className="eyebrow" style={{ margin: '14px 0 6px' }}>
              Plan
            </h3>
            <ul>
              {incoming.plan?.map((step) => (
                <li className="factor" key={step}>
                  <span style={{ color: 'var(--brand)' }}>●</span>
                  {step}
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: 14 }} onClick={onFileVisit} disabled={filed}>
              <IconSync size={15} /> {filed ? 'Synced to the patient’s record' : 'File this visit to Sijil'}
            </button>
            <p className="tiny muted" style={{ marginTop: 10 }}>
              Filing sends this {TYPE_LABEL[incoming.type].toLowerCase()} to the patient’s own record over {incoming.provenance.standard}. It stays
              his after your access expires.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
