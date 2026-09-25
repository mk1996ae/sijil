import type { AccessGrant, AccessLogEntry } from '../data/types'
import { SCOPES } from '../data/patient'
import { IconCheck, IconEye, IconLock, IconShield, IconSpark, IconSync } from '../ui/Icons'

interface Props {
  grant: AccessGrant
  log: AccessLogEntry[]
  onShare: () => void
  onRevoke: () => void
}

const KIND_ICON = {
  grant: <IconShield size={13} />,
  view: <IconEye size={13} />,
  query: <IconSpark size={13} />,
  revoke: <IconLock size={13} />,
  sync: <IconSync size={13} />,
  source: <IconCheck size={13} />,
} as const

export default function AccessCard({ grant, log, onShare, onRevoke }: Props) {
  const shared = SCOPES.filter((s) => grant.scopes[s.key])
  const withheld = SCOPES.filter((s) => !grant.scopes[s.key])

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>Who can see my record</h2>
          <p>Scoped, time-limited, revocable.</p>
        </div>
        <div className="spacer" />
        <span className={`chip ${grant.active ? 'chip-verified' : ''}`}>{grant.active ? 'Active' : 'No active access'}</span>
      </div>

      <div className="card-body">
        {grant.active ? (
          <>
            <div className="requester">
              <span style={{ fontSize: 22 }}>{grant.flag}</span>
              <div className="row-main">
                <strong>
                  {grant.clinician} · {grant.role}
                </strong>
                <span>
                  {grant.institution}, {grant.city} — granted {grant.grantedAt}, expires in {grant.expiresHours} h
                </span>
              </div>
              <button type="button" className="btn btn-sm btn-danger" onClick={onRevoke}>
                Revoke
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {shared.map((s) => (
                <span className="chip chip-verified" key={s.key}>
                  <IconCheck size={11} /> {s.label}
                </span>
              ))}
              {withheld.map((s) => (
                <span className="chip" key={s.key}>
                  <IconLock size={11} /> {s.label} withheld
                </span>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="tiny muted">
              You are in London with a GP appointment today. Share the parts of your record you want Dr. Emily Carter to see — nothing more.
            </p>
            <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={onShare}>
              <IconShield size={15} /> Share with Dr. Emily Carter
            </button>
          </>
        )}

        <h3 className="eyebrow" style={{ margin: '18px 0 2px' }}>
          Access log
        </h3>
        <div className="rows">
          {log.map((entry, i) => (
            <div className="row" key={`${entry.time}-${i}`}>
              <span className="row-time">{entry.time}</span>
              <div className="row-main">
                <strong>
                  {entry.actor} — {entry.action}
                </strong>
                {entry.detail && <span>{entry.detail}</span>}
              </div>
              <span className="muted" style={{ paddingTop: 2 }}>
                {KIND_ICON[entry.kind]}
              </span>
            </div>
          ))}
          {!log.length && <p className="tiny muted" style={{ padding: '10px 0' }}>Nothing yet.</p>}
        </div>
      </div>
    </section>
  )
}
