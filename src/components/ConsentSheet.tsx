import { useState } from 'react'
import type { AccessGrant } from '../data/types'
import { SCOPES } from '../data/patient'
import { IconAlert, IconClock, IconShield } from '../ui/Icons'

interface Props {
  grant: AccessGrant
  onCancel: () => void
  onGrant: (scopes: Record<string, boolean>, hours: number) => void
}

const DURATIONS = [1, 24, 72]

export default function ConsentSheet({ grant, onCancel, onGrant }: Props) {
  const [scopes, setScopes] = useState<Record<string, boolean>>({ ...grant.scopes })
  const [hours, setHours] = useState(grant.expiresHours)
  const shared = SCOPES.filter((s) => scopes[s.key]).length

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Share your record">
      <div className="sheet">
        <div className="sheet-head">
          <span className="eyebrow">Access request</span>
          <h2>Share your record with {grant.clinician}</h2>
          <p>You choose what she sees and for how long. You can revoke at any moment.</p>
        </div>

        <div className="sheet-body">
          <div className="requester">
            <span style={{ fontSize: 22 }}>{grant.flag}</span>
            <div className="row-main">
              <strong>
                {grant.clinician} · {grant.role}
              </strong>
              <span>
                {grant.institution} — {grant.city}
              </span>
            </div>
            <span className="chip chip-verified">Verified clinician</span>
          </div>

          <div>
            <h3 className="eyebrow" style={{ marginBottom: 8 }}>
              What she can see
            </h3>
            {SCOPES.map((s) => {
              const on = !!scopes[s.key]
              return (
                <button
                  type="button"
                  key={s.key}
                  className={`scope${on ? ' on' : ''}`}
                  onClick={() => setScopes((prev) => ({ ...prev, [s.key]: !prev[s.key] }))}
                  aria-label={`${on ? 'Stop sharing' : 'Share'} ${s.label}`}
                >
                  <span className="scope-text">
                    <strong>
                      {s.label}
                      {s.sensitive && (
                        <span className="chip chip-warn" style={{ marginLeft: 8 }}>
                          <IconAlert size={10} /> Sensitive
                        </span>
                      )}
                    </strong>
                    <span>{s.hint}</span>
                  </span>
                  <span className="switch" role="switch" aria-checked={on} />
                </button>
              )
            })}
          </div>

          <div>
            <h3 className="eyebrow" style={{ marginBottom: 8 }}>
              For how long
            </h3>
            <div className="filters" style={{ padding: 0, border: 0 }}>
              {DURATIONS.map((d) => (
                <button key={d} type="button" aria-pressed={hours === d} onClick={() => setHours(d)}>
                  {d === 1 ? '1 hour' : `${d} hours`}
                </button>
              ))}
            </div>
          </div>

          <div className="notice info">
            <IconClock size={15} />
            <span>
              Access expires automatically after {hours === 1 ? '1 hour' : `${hours} hours`}. Every time she opens a record or asks a question it is
              written to your access log.
            </span>
          </div>
        </div>

        <div className="sheet-foot">
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
          <div className="spacer" />
          <button type="button" className="btn btn-primary" onClick={() => onGrant(scopes, hours)} disabled={shared === 0}>
            <IconShield size={15} /> Grant access to {shared} {shared === 1 ? 'category' : 'categories'}
          </button>
        </div>
      </div>
    </div>
  )
}
