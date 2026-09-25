import type { HealthEvent, Patient } from '../data/types'
import { IconAlert, IconGlobe, IconShield } from '../ui/Icons'

interface Props {
  patient: Patient
  events: HealthEvent[]
}

export default function Passport({ patient, events }: Props) {
  const verified = events.filter((e) => e.provenance.verification === 'provider_verified').length
  const institutions = new Set(events.filter((e) => e.provenance.channel !== 'patient').map((e) => e.provenance.institution)).size
  const countries = new Set(events.map((e) => e.provenance.country)).size
  const allergies = events.flatMap((e) => e.allergies ?? []).filter((a, i, arr) => arr.findIndex((b) => b.substance === a.substance) === i)
  const initials = patient.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')

  return (
    <section className="passport">
      <div className="passport-top">
        <div className="avatar">{initials}</div>
        <div>
          <h1>{patient.name}</h1>
          <div className="ar" dir="rtl" lang="ar">
            {patient.nameAr}
          </div>
          <div className="passport-id">{patient.id}</div>
        </div>
        <div className="spacer" />
        <span className="chip" style={{ background: 'rgba(255,255,255,0.1)', color: '#eaf4f3' }}>
          <IconShield size={13} /> Patient-owned
        </span>
      </div>

      <dl className="passport-grid">
        <div>
          <dt>Age / Sex</dt>
          <dd>
            {patient.age} · {patient.sex === 'M' ? 'Male' : 'Female'}
          </dd>
        </div>
        <div>
          <dt>Blood type</dt>
          <dd>{patient.bloodType}</dd>
        </div>
        <div>
          <dt>Residence</dt>
          <dd>{patient.residence}</dd>
        </div>
        <div>
          <dt>Currently</dt>
          <dd>{patient.currentLocation}</dd>
        </div>
        <div>
          <dt>Languages</dt>
          <dd>{patient.languages.join(' · ')}</dd>
        </div>
        <div>
          <dt>Emergency contact</dt>
          <dd>{patient.emergencyContact}</dd>
        </div>
      </dl>

      <div className="passport-stats">
        {allergies.map((a) => (
          <span className="chip chip-warn" key={a.substance} title={a.reaction}>
            <IconAlert size={12} /> Allergy: {a.substance}
          </span>
        ))}
        <span className="chip">{events.length} Health Events</span>
        <span className="chip">{verified} clinician-verified</span>
        <span className="chip">{events.length - verified} patient-reported</span>
        <span className="chip">
          <IconGlobe size={12} /> {institutions} institutions · {countries} countries
        </span>
      </div>
    </section>
  )
}
