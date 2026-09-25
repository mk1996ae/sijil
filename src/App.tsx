import { useEffect, useMemo, useState } from 'react'
import AccessCard from './components/AccessCard'
import ClinicianView from './components/ClinicianView'
import ConsentSheet from './components/ConsentSheet'
import LifestyleCard from './components/LifestyleCard'
import Passport from './components/Passport'
import SourceModal from './components/SourceModal'
import SourcesCard from './components/SourcesCard'
import Timeline from './components/Timeline'
import { SCOPES, TODAY, events as seedEvents, incomingEvent, initialGrant, lifestyle, patient, sources } from './data/patient'
import type { AccessGrant, AccessLogEntry } from './data/types'
import { inScope } from './engine/util'
import { IconCheck, IconLock, IconShield, IconStethoscope, IconUser } from './ui/Icons'

type Tab = 'patient' | 'clinician'

function now(): string {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

const SEED_LOG: AccessLogEntry[] = [
  { time: '08:12', actor: 'Corniche Medical Center', action: 'Synced 4 Health Events', detail: 'HL7 FHIR R4 · provider API', kind: 'source' },
  { time: '08:12', actor: 'Yas Diagnostics Laboratory', action: 'Synced 1 lab report', detail: 'Signed off by the lab director', kind: 'source' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('patient')
  const [events, setEvents] = useState([...seedEvents])
  const [grant, setGrant] = useState<AccessGrant>(initialGrant)
  const [log, setLog] = useState<AccessLogEntry[]>(SEED_LOG)
  const [consentOpen, setConsentOpen] = useState(false)
  const [sourceId, setSourceId] = useState<string | null>(null)
  const [filed, setFiled] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const shared = useMemo(() => (grant.active ? inScope(events, grant.scopes) : []), [events, grant])
  const sourceEvent = sourceId ? events.find((e) => e.id === sourceId) : undefined

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  function addLog(entry: AccessLogEntry) {
    setLog((prev) => [entry, ...prev])
  }

  function logBriefView() {
    addLog({ time: now(), actor: grant.clinician, action: 'Viewed the 30-second brief', detail: grant.institution, kind: 'view' })
  }

  function goTo(next: Tab) {
    if (next === 'clinician' && tab !== 'clinician' && grant.active) logBriefView()
    setTab(next)
  }

  function handleGrant(scopes: Record<string, boolean>, hours: number) {
    const labels = SCOPES.filter((s) => scopes[s.key]).map((s) => s.label)
    setGrant({ ...grant, scopes, expiresHours: hours, grantedAt: now(), active: true })
    setConsentOpen(false)
    addLog({
      time: now(),
      actor: 'You',
      action: `Granted ${grant.clinician} access for ${hours} h`,
      detail: labels.join(' · '),
      kind: 'grant',
    })
    logBriefView()
    setToast(`Access granted to ${grant.clinician} for ${hours} h`)
    setTab('clinician')
  }

  function handleAddNote(eventId: string, text: string) {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, patientAnnotations: [...(e.patientAnnotations ?? []), { date: TODAY, text }] } : e)),
    )
    setToast(`Note added to ${eventId} — the clinician record itself is unchanged`)
  }

  function handleRevoke() {
    setGrant((g) => ({ ...g, active: false }))
    addLog({ time: now(), actor: 'You', action: `Revoked ${grant.clinician}’s access`, kind: 'revoke' })
    setToast('Access revoked')
    setTab('patient')
  }

  function handleOpenSource(id: string) {
    setSourceId(id)
    const ev = events.find((e) => e.id === id)
    if (tab === 'clinician' && ev)
      addLog({ time: now(), actor: grant.clinician, action: `Opened source record ${id}`, detail: `${ev.title} · ${ev.provenance.institution}`, kind: 'view' })
  }

  function handleQuery(question: string, retrieved: number) {
    addLog({ time: now(), actor: grant.clinician, action: 'Asked the record', detail: `“${question}” — ${retrieved} events cited`, kind: 'query' })
  }

  function handleFileVisit() {
    setEvents((prev) => (prev.some((e) => e.id === incomingEvent.id) ? prev : [...prev, incomingEvent]))
    setFiled(true)
    addLog({
      time: now(),
      actor: incomingEvent.provenance.institution,
      action: 'Filed today’s visit to your record',
      detail: `${incomingEvent.title} · ${incomingEvent.provenance.standard}`,
      kind: 'sync',
    })
    setToast('London visit synced into the patient’s timeline')
    setTab('patient')
  }

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
          <button type="button" aria-pressed={tab === 'patient'} onClick={() => goTo('patient')}>
            <IconUser size={14} /> Patient
          </button>
          <button type="button" aria-pressed={tab === 'clinician'} onClick={() => goTo('clinician')}>
            <IconStethoscope size={14} /> Clinician
          </button>
        </div>

        <div className="topbar-spacer" />
        <span className={`link-status${grant.active ? ' on' : ''}`}>
          {grant.active ? <IconCheck size={13} /> : <IconLock size={13} />}
          {grant.active ? `${grant.clinician} · ${grant.expiresHours} h access` : 'No access granted'}
        </span>
      </header>

      <main className="page">
        {tab === 'patient' ? (
          <div className="columns">
            <div className="stack">
              <Passport patient={patient} events={events} />
              <Timeline events={events} flashId={filed ? incomingEvent.id : null} onAddNote={handleAddNote} />
              <LifestyleCard lifestyle={lifestyle} onOpenSource={handleOpenSource} />
            </div>
            <div className="stack">
              <AccessCard grant={grant} log={log} onShare={() => setConsentOpen(true)} onRevoke={handleRevoke} />
              <SourcesCard sources={sources} />
            </div>
          </div>
        ) : grant.active ? (
          <ClinicianView
            patient={patient}
            grant={grant}
            all={events}
            shared={shared}
            lifestyle={lifestyle}
            incoming={incomingEvent}
            filed={filed}
            onOpenSource={handleOpenSource}
            onQuery={handleQuery}
            onFileVisit={handleFileVisit}
          />
        ) : (
          <div className="locked">
            <div className="locked-inner">
              <span className="lock-ring">
                <IconLock size={26} />
              </span>
              <h2>No access granted yet</h2>
              <p className="muted">
                A clinician sees only what the patient has explicitly shared, for as long as they have shared it. Nothing is visible by default.
              </p>
              <button type="button" className="btn btn-primary" onClick={() => setTab('patient')}>
                <IconShield size={15} /> Go to the patient view to grant access
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="footer-note">Synthetic demo data — fictional patient. Not medical advice.</footer>

      {consentOpen && <ConsentSheet grant={grant} onCancel={() => setConsentOpen(false)} onGrant={handleGrant} />}
      {sourceEvent && <SourceModal event={sourceEvent} onClose={() => setSourceId(null)} />}
      {toast && (
        <div className="toast" role="status">
          <IconCheck size={15} /> {toast}
        </div>
      )}
    </div>
  )
}
