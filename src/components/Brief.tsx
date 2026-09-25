import { useMemo } from 'react'
import type { HealthEvent, Lifestyle, Patient } from '../data/types'
import { buildBrief } from '../engine/brief'
import { IconClock, IconLock } from '../ui/Icons'
import Cite from './Cite'

interface Props {
  patient: Patient
  all: HealthEvent[]
  shared: HealthEvent[]
  lifestyle: Lifestyle
  lifestyleShared: boolean
  onOpenSource: (id: string) => void
}

export default function Brief({ patient, all, shared, lifestyle, lifestyleShared, onOpenSource }: Props) {
  const brief = useMemo(() => buildBrief(all, shared, lifestyle, lifestyleShared), [all, shared, lifestyle, lifestyleShared])

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>
            <IconClock size={14} /> 30-second brief — {patient.name}
          </h2>
          <p>
            {patient.age} · {patient.sex === 'M' ? 'Male' : 'Female'} · {patient.bloodType} · {patient.residence}
          </p>
        </div>
      </div>

      <div className="card-body">
        {brief.sections.map((s) => (
          <div className="brief-section" key={s.key}>
            <h3>{s.title}</h3>
            {s.items.map((item) => (
              <div className={`brief-item tone-${item.tone}`} key={item.text}>
                <i />
                <span>
                  {item.text}
                  <Cite ids={item.cites} onOpen={onOpenSource} />
                </span>
              </div>
            ))}
          </div>
        ))}

        {brief.hidden > 0 && (
          <div className="notice" style={{ marginTop: 14 }}>
            <IconLock size={15} />
            <span>
              {brief.hidden} {brief.hidden === 1 ? 'line is' : 'lines are'} hidden because the patient did not share {brief.hidden === 1 ? 'that' : 'those'}{' '}
              category. Ask the patient directly if you need it.
            </span>
          </div>
        )}

        <div className="safety">
          Relevant historical context from the patient’s own records — not a diagnosis or treatment recommendation. Discuss with the treating clinician.
        </div>
        <div className="engine-row">
          <span>
            Built from {brief.stats.records} records · {brief.stats.verified} provider-verified · {brief.stats.patient} patient-reported ·{' '}
            {brief.stats.institutions} institutions · {brief.stats.countries} countries
          </span>
        </div>
      </div>
    </section>
  )
}
