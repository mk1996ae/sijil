import type { SeriesPoint } from '../data/types'
import { fmtShort } from '../engine/util'

interface Props {
  series: SeriesPoint[]
}

/** Patient-reported severity over the days of an episode. */
export default function Sparkline({ series }: Props) {
  const w = 320
  const h = 64
  const pad = 6
  const maxDay = Math.max(...series.map((p) => p.day))
  const x = (p: SeriesPoint) => pad + ((p.day - 1) / Math.max(1, maxDay - 1)) * (w - pad * 2)
  const y = (p: SeriesPoint) => pad + (1 - p.severity / 10) * (h - pad * 2)
  const line = series.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p).toFixed(1)} ${y(p).toFixed(1)}`).join(' ')
  const area = `${line} L${x(series[series.length - 1]).toFixed(1)} ${h - pad} L${x(series[0]).toFixed(1)} ${h - pad} Z`

  return (
    <div>
      <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="Patient-reported headache severity over the episode">
        <path d={area} fill="var(--patient-bg)" />
        <path d={line} fill="none" stroke="var(--patient)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {series.map((p) => (
          <circle key={p.day} cx={x(p)} cy={y(p)} r="2.8" fill="var(--patient)" />
        ))}
      </svg>
      <div className="legend">
        <span>
          Day {series[0].day} · {fmtShort(series[0].date)} — {series[0].severity}/10
        </span>
        <span>
          Day {series[series.length - 1].day} · {fmtShort(series[series.length - 1].date)} — {series[series.length - 1].severity}/10
        </span>
        <span>Patient-reported severity (0–10)</span>
      </div>
    </div>
  )
}
