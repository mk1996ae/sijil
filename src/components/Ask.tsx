import { useState } from 'react'
import type { HealthEvent } from '../data/types'
import { SUGGESTED, askGrounded, type Answer } from '../engine/ask'
import { IconArrow, IconSpark } from '../ui/Icons'
import Cite from './Cite'

interface Props {
  shared: HealthEvent[]
  onOpenSource: (id: string) => void
  onQuery: (question: string, retrieved: number) => void
}

export default function Ask({ shared, onOpenSource, onQuery }: Props) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<Answer | null>(null)

  function run(q: string) {
    const text = q.trim()
    if (!text) return
    const a = askGrounded(text, shared)
    setAnswer(a)
    setQuestion(text)
    onQuery(text, a.retrieved.length)
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>
            <IconSpark size={14} /> Ask the record
          </h2>
          <p>Answers are assembled only from Health Events the patient shared. Every sentence cites its source.</p>
        </div>
      </div>

      <div className="card-body">
        <form
          className="ask-form"
          onSubmit={(e) => {
            e.preventDefault()
            run(question)
          }}
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What happened the last time he had similar symptoms?"
            aria-label="Ask a question about this patient's record"
          />
          <button type="submit" className="btn btn-primary">
            Ask <IconArrow size={15} />
          </button>
        </form>

        <div className="suggestions">
          {(answer?.followUps.length ? answer.followUps : SUGGESTED).map((s) => (
            <button type="button" key={s} onClick={() => run(s)}>
              {s}
            </button>
          ))}
        </div>

        {answer && (
          <div className="answer">
            <span className="eyebrow">Answer</span>
            {answer.claims.map((c) => (
              <div className={`claim kind-${c.kind}`} key={c.text}>
                <i />
                <span>
                  {c.text}
                  <Cite ids={c.cites} onOpen={onOpenSource} />
                </span>
              </div>
            ))}

            {answer.match && (
              <div className="match">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <strong style={{ fontSize: 13.5 }}>Closest earlier episode — {answer.match.label}</strong>
                  <span className="spacer" />
                  <span className="chip chip-verified">
                    {answer.match.matched} of {answer.match.total} factors match
                  </span>
                </div>
                <div className="match-bar">
                  <i style={{ width: `${(answer.match.matched / Math.max(1, answer.match.total)) * 100}%` }} />
                </div>
                {answer.match.factors.map((f) => (
                  <div className={`factor${f.matched ? '' : ' no'}`} key={f.key}>
                    <span style={{ color: f.matched ? 'var(--verified)' : 'var(--muted)' }}>{f.matched ? '●' : '○'}</span>
                    {f.label}
                    {!f.matched && ' — new this time'}
                  </div>
                ))}
                <p className="tiny muted" style={{ marginTop: 8 }}>
                  Worth reviewing — not a diagnosis.
                </p>
              </div>
            )}

            <div className="safety">{answer.safety}</div>

            <div className="engine-row">
              <span className="chip">Grounded engine</span>
              <span>
                {answer.considered} Health Events considered · {answer.retrieved.length} cited · {answer.ms} ms
              </span>
              {answer.note && <span className="chip chip-warn">{answer.note}</span>}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
