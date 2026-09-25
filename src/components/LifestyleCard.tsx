import type { Lifestyle } from '../data/types'
import { fmtShort } from '../engine/util'
import { IconAlert, IconUser } from '../ui/Icons'
import Cite from './Cite'

interface Props {
  lifestyle: Lifestyle
  onOpenSource: (id: string) => void
}

const FLIGHT_DATE = '2026-09-21'
const LAUNCH_START = '2026-09-14'
const SLEEP_CUTOFF = 6

const ROUTINE_ORDER = (t: string) => (/^\d{2}:\d{2}$/.test(t) ? Number(t.replace(':', '')) : 9999)

/** Daily life: 14-day patient log as a hand-drawn SVG, plus stats, insight, supplements, routine. All patient-reported. */
export default function LifestyleCard({ lifestyle, onOpenSource }: Props) {
  const log = lifestyle.log

  const short = log.filter((d) => d.sleepHours < SLEEP_CUTOFF)
  const rested = log.filter((d) => d.sleepHours >= SLEEP_CUTOFF)
  const shortHead = short.filter((d) => d.headache > 0).length
  const restedHead = rested.filter((d) => d.headache > 0).length

  const last8 = log.slice(-8)
  const ibuDays = last8.filter((d) => d.ibuprofen).length

  const w = 600
  const h = 230
  const padL = 26
  const padR = 10
  const padTop = 30
  const padBottom = 44
  const plot = h - padTop - padBottom
  const band = (w - padL - padR) / log.length
  const barW = Math.min(22, band * 0.55)
  const cx = (i: number) => padL + band * i + band / 2
  const ySleep = (v: number) => padTop + (1 - Math.min(v, 8) / 8) * plot
  const yHead = (v: number) => padTop + (1 - v / 10) * plot
  const axisY = padTop + plot

  const flightIdx = log.findIndex((d) => d.date === FLIGHT_DATE)
  const launchIdx = log.findIndex((d) => d.date === LAUNCH_START)
  const line = log.map((d, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)} ${yHead(d.headache).toFixed(1)}`).join(' ')

  const routine = [...lifestyle.routine].sort((a, b) => ROUTINE_ORDER(a.time) - ROUTINE_ORDER(b.time))

  return (
    <section className="card" id="daily-life">
      <div className="card-head">
        <div>
          <h2>Daily life — last 14 days</h2>
          <p>Everything here is patient-reported by Mohammed. Context, not a diagnosis.</p>
        </div>
        <span className="spacer" />
        <span className="chip chip-patient">
          <IconUser size={11} /> Patient-reported
        </span>
      </div>
      <div className="card-body">
        <div className="life-stats">
          {[
            ['Sleep', lifestyle.sleepTypical],
            ['Caffeine', lifestyle.caffeine],
            ['Exercise', lifestyle.exercise],
            ['Work & travel', lifestyle.work],
          ].map(([k, v]) => (
            <div className="life-stat" key={k}>
              <span className="eyebrow">{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>

        <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Sleep hours, headache severity and ibuprofen use over the last 14 days">
          {launchIdx >= 0 && (
            <>
              <rect x={cx(launchIdx) - band / 2} y={padTop - 6} width={w - padR - (cx(launchIdx) - band / 2)} height={plot + 6} fill="var(--warn-bg)" opacity="0.55" rx="6" />
              <text x={cx(launchIdx) - band / 2 + 6} y={padTop + 6} fontSize="9.5" fontWeight="600" fill="var(--warn)">
                Launch week
              </text>
            </>
          )}
          {[0, 4, 8].map((v) => (
            <g key={v}>
              <line x1={padL} x2={w - padR} y1={ySleep(v)} y2={ySleep(v)} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 4" />
              <text x={padL - 5} y={ySleep(v) + 3} textAnchor="end" fontSize="8.5" fill="var(--muted)">
                {v} h
              </text>
            </g>
          ))}
          {log.map((d, i) => (
            <rect
              key={d.date}
              data-sleep={d.sleepHours}
              x={cx(i) - barW / 2}
              y={ySleep(d.sleepHours)}
              width={barW}
              height={axisY - ySleep(d.sleepHours)}
              rx="4"
              fill="var(--brand)"
              opacity={d.sleepHours < SLEEP_CUTOFF ? 0.55 : 0.9}
            />
          ))}
          <path d={line} fill="none" stroke="var(--warn)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
          {log.map((d, i) => (
            <circle key={d.date} data-headache={d.headache} cx={cx(i)} cy={yHead(d.headache)} r="3.6" fill="var(--warn)" stroke="#fff" strokeWidth="1.5" />
          ))}
          {flightIdx >= 0 && (
            <g className="flight-marker">
              <line x1={cx(flightIdx)} x2={cx(flightIdx)} y1={padTop - 14} y2={axisY} stroke="var(--ink)" strokeWidth="1.2" strokeDasharray="2 3" />
              <text x={cx(flightIdx) + 5} y={padTop - 16} fontSize="9.5" fontWeight="600" fill="var(--ink)">
                ✈ Abu Dhabi → London
              </text>
            </g>
          )}
          <line x1={padL} x2={w - padR} y1={axisY} y2={axisY} stroke="var(--line)" />
          {log.map((d, i) => (
            <text key={d.date} x={cx(i)} y={axisY + 12} textAnchor="middle" fontSize="8.5" fill="var(--muted)">
              {fmtShort(d.date).replace(' Sep', '')}
            </text>
          ))}
          {log.map((d, i) =>
            d.ibuprofen ? (
              <g key={d.date} className="ibu-pill" data-date={d.date}>
                <rect x={cx(i) - band / 2 + 2} y={axisY + 18} width={band - 4} height="13" rx="6.5" fill="var(--warn-bg)" stroke="var(--warn)" strokeWidth="0.8" />
                <text x={cx(i)} y={axisY + 27.5} textAnchor="middle" fontSize="7" fontWeight="600" fill="var(--warn)">
                  Ibuprofen
                </text>
              </g>
            ) : null,
          )}
        </svg>
        <div className="legend">
          <span>
            <i style={{ background: 'var(--brand)' }} />
            Sleep hours (bars, 0–8 h)
          </span>
          <span>
            <i style={{ background: 'var(--warn)' }} />
            Headache severity (line, 0–10)
          </span>
          <span>
            <i style={{ background: 'var(--warn-bg)', border: '1px solid var(--warn)' }} />
            Ibuprofen day
          </span>
          <span className="muted">· Patient-reported</span>
        </div>

        <div className="insight">
          <IconUser size={14} />
          <span>
            In his own logs, headache was reported on <b>{shortHead} of {short.length}</b> days with &lt; {SLEEP_CUTOFF} h sleep, vs{' '}
            <b>{restedHead} of {rested.length}</b> days with ≥ {SLEEP_CUTOFF} h. Association only — not a diagnosis.
          </span>
        </div>

        <div className="warn-card">
          <IconAlert size={15} />
          <span>
            Ibuprofen on {ibuDays} of the last {last8.length} days. In March 2024 a clinician documented a possible medication-overuse component{' '}
            <Cite ids={['E4']} onOpen={onOpenSource} /> Review with a healthcare professional.
          </span>
        </div>

        <div className="life-grid">
          <div>
            <h4 className="eyebrow">Supplements</h4>
            {lifestyle.supplements.map((s) => (
              <div className="kv" key={s.name}>
                <span>{s.name}</span>
                <span>
                  {s.dose} · since {s.since}
                </span>
              </div>
            ))}
          </div>
          <div>
            <h4 className="eyebrow">Today’s routine</h4>
            <ol className="routine">
              {routine.map((r) => (
                <li key={r.time + r.item} className={`routine-${r.kind}`}>
                  <span className="row-time">{r.time}</span>
                  <span>{r.item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
