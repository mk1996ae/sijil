import { useState } from 'react'
import LifestyleCard from './components/LifestyleCard'
import Passport from './components/Passport'
import SourcesCard from './components/SourcesCard'
import Timeline from './components/Timeline'
import { events as seedEvents, lifestyle, patient, sources } from './data/patient'
import { IconLock, IconStethoscope, IconUser } from './ui/Icons'

type Tab = 'patient' | 'clinician'

export default function App() {
  const [tab, setTab] = useState<Tab>('patient')
  const events = seedEvents

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">س</span>
          <span>
            Sijil
            <small>The health memory that travels with you</small>
          </span>
        </div>

        <div className="segmented" role="group" aria-label="Switch view">
          <button type="button" aria-pressed={tab === 'patient'} onClick={() => setTab('patient')}>
            <IconUser size={14} /> Patient
          </button>
          <button type="button" aria-pressed={tab === 'clinician'} onClick={() => setTab('clinician')}>
            <IconStethoscope size={14} /> Clinician
          </button>
        </div>

        <div className="topbar-spacer" />
        <span className="link-status">
          <IconLock size={13} /> No access granted
        </span>
      </header>

      <main className="page">
        {tab === 'patient' ? (
          <div className="columns">
            <div className="stack">
              <Passport patient={patient} events={events} />
              <Timeline events={events} />
            </div>
            <div className="stack">
              <LifestyleCard lifestyle={lifestyle} />
              <SourcesCard sources={sources} />
            </div>
          </div>
        ) : (
          <div className="locked">
            <div className="locked-inner">
              <span className="lock-ring">
                <IconLock size={26} />
              </span>
              <h2>No access granted yet</h2>
              <p className="muted">
                A clinician only sees what the patient has explicitly shared, for as long as they have shared it. Access is granted from the patient
                view.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="footer-note">Synthetic demo data — fictional patient. Not medical advice.</footer>
    </div>
  )
}
