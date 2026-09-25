import type { DataSource } from '../data/types'
import { IconDoc, IconSync } from '../ui/Icons'

interface Props {
  sources: DataSource[]
}

export default function SourcesCard({ sources }: Props) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>Connected sources</h2>
          <p>Where the record comes from.</p>
        </div>
      </div>
      <div className="card-body">
        <div className="rows">
          {sources.map((s) => (
            <div className="row" key={s.name}>
              <span className="row-time" style={{ fontSize: 16 }}>
                {s.flag}
              </span>
              <div className="row-main">
                <strong>{s.name}</strong>
                <span>
                  {s.city}, {s.country} — {s.detail}
                </span>
              </div>
              <span className={`chip ${s.channel === 'provider_api' ? 'chip-verified' : ''}`}>
                {s.channel === 'provider_api' ? <IconSync size={11} /> : <IconDoc size={11} />}
                {s.status}
              </span>
            </div>
          ))}
        </div>
        <p className="tiny muted" style={{ marginTop: 12 }}>
          Where a provider has no API, an authorized records officer transcribes the record and the treating clinician verifies it — provenance is kept
          either way.
        </p>
      </div>
    </section>
  )
}
