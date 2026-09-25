import type { Lifestyle } from '../data/types'
import { fmtShort } from '../engine/util'

interface Props {
  lifestyle: Lifestyle
}

/** 14-day patient log: sleep hours as bars, headache severity as a line, OTC ibuprofen days marked. */
export default function LifestyleCard({ lifestyle }: Props) {
  const log = lifestyle.log
  const w = 520
  const h = 168
  const padX = 8
  const padTop = 14
  const padBottom = 26
  const plot = h - padTop - padBottom
  const band = (w - padX * 2) / log.length
  const barW = Math.min(20, band * 0.52)
  const sleepMax = 9
  const yHead = (v: number) => padTop + (1 - v / 10) * plot
  const cx = (i: number) => padX + band * i + band / 2

  const line = log.map((d, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)} ${yHead(d.headache).toFixed(1)}`).join(' ')

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>Sleep &amp; lifestyle — last 14 days</h2>
          <p>Patient-reported. Context, not a diagnosis.</p>
        </div>
      </div>
      <div className="card-body">
        <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Sleep hours and headache severity over the last 14 days">
          {[0, 5, 10].map((v) => (
            <line key={v} x1={padX} x2={w - padX} y1={yHead(v)} y2={yHead(v)} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 4" />
          ))}
          {log.map((d, i) => {
            const barH = (d.sleepHours / sleepMax) * plot
            return (
              <rect
                key={d.date}
                x={cx(i) - barW / 2}
                y={padTop + plot - barH}
                width={barW}
                height={barH}
                rx="4"
                fill={d.sleepHours < 6 ? 'var(--warn-bg)' : 'var(--brand-soft)'}
              />
            )
          })}
          <path d={line} fill="none" stroke="var(--patient)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {log.map((d, i) => (
            <circle key={d.date} cx={cx(i)} cy={yHead(d.headache)} r={d.ibuprofen ? 4 : 2.8} fill={d.ibuprofen ? 'var(--warn)' : 'var(--patient)'} />
          ))}
          {log.map((d, i) =>
            i % 3 === 0 ? (
              <text key={d.date} x={cx(i)} y={h - 8} textAnchor="middle" fontSize="9.5" fill="var(--muted)">
                {fmtShort(d.date)}
              </text>
            ) : null,
          )}
        </svg>
        <div className="legend">
          <span>
            <i style={{ background: 'var(--brand-soft)' }} />
            Sleep hours
          </span>
          <span>
            <i style={{ background: 'var(--warn-bg)' }} />
            Sleep under 6 h
          </span>
          <span>
            <i style={{ background: 'var(--patient)' }} />
            Headache severity 0–10
          </span>
          <span>
            <i style={{ background: 'var(--warn)' }} />
            OTC ibuprofen taken
          </span>
        </div>

        <div className="rows" style={{ marginTop: 14 }}>
          <div className="row">
            <span className="row-time">Sleep</span>
            <div className="row-main">
              <span>{lifestyle.sleepTypical}</span>
            </div>
          </div>
          <div className="row">
            <span className="row-time">Caffeine</span>
            <div className="row-main">
              <span>{lifestyle.caffeine}</span>
            </div>
          </div>
          <div className="row">
            <span className="row-time">Exercise</span>
            <div className="row-main">
              <span>{lifestyle.exercise}</span>
            </div>
          </div>
          <div className="row">
            <span className="row-time">Work</span>
            <div className="row-main">
              <span>{lifestyle.work}</span>
            </div>
          </div>
          <div className="row">
            <span className="row-time">Supplements</span>
            <div className="row-main">
              <span>{lifestyle.supplements.map((s) => `${s.name} ${s.dose}`).join(' · ')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
