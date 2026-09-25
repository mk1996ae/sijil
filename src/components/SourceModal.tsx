import type { HealthEvent } from '../data/types'
import EventCard from './EventCard'

interface Props {
  event: HealthEvent
  onClose: () => void
}

export default function SourceModal({ event, onClose }: Props) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={`Source ${event.id}`} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <span className="eyebrow">Source · Health Event {event.id}</span>
          <h2>{event.title}</h2>
          <p>The record this claim came from, exactly as it was filed.</p>
        </div>
        <div className="sheet-body">
          <EventCard event={event} open onToggle={() => {}} />
        </div>
        <div className="sheet-foot">
          <div className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
