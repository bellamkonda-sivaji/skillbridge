import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { Avatar, useDocumentTitle } from '../../marketing/components'
import { JobArt, Loading, Empty, ErrorNote, PillTabs, SegTabs, PageHead } from '../components'
import {
  getInterviews, getInterview, rescheduleInterview, cancelInterview,
  formatDate, timeOnly, MODE_LABEL,
} from '../api'

const mapsLink = (lat, lng, label) =>
  lat && lng
    ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(label || '')}`

/* ---------- 13. Interview invitations ---------- */

export function InterviewInvitations() {
  useDocumentTitle('Interviews')
  const [list, setList] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('UPCOMING')

  const load = () => {
    setList(null); setError('')
    getInterviews()
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => setError('We could not load your interviews.'))
  }
  useEffect(load, [])

  const upcoming = (list || []).filter(
    (i) => i.isUpcoming ?? (i.status === 'PENDING' || i.status === 'CONFIRMED')
  )
  const past = (list || []).filter((i) => !upcoming.includes(i))
  const shown = tab === 'UPCOMING' ? upcoming : past

  return (
    <>
      <PageHead title="Interview Invitations" sub="Confirm, reschedule or prepare for your interviews." />

      <PillTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'UPCOMING', label: 'Upcoming', count: list ? upcoming.length : undefined },
          { value: 'PAST', label: 'Past', count: list ? past.length : undefined },
        ]}
      />

      <div style={{ marginTop: 16 }}>
        <ErrorNote onRetry={load}>{error}</ErrorNote>
        {!list && !error ? <Loading rows={2} /> : shown.length ? (
          <div className="wk-list">
            {shown.map((iv) => <InterviewCard key={iv.id} iv={iv} onChanged={load} />)}
          </div>
        ) : (
          !error && (
            <div className="wk-card">
              <Empty
                icon="calendar"
                title={tab === 'UPCOMING' ? 'No interviews scheduled' : 'No past interviews'}
                text="When an employer invites you, the details appear here."
              >
                <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/worker/applications">My applications</Link>
              </Empty>
            </div>
          )
        )}
      </div>

      {tab === 'UPCOMING' && upcoming.length > 0 && <Tips />}
    </>
  )
}

function InterviewCard({ iv, onChanged }) {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  const act = async (kind) => {
    setBusy(kind); setError('')
    try {
      await (kind === 'cancel' ? cancelInterview(iv.id) : rescheduleInterview(iv.id))
      setConfirming(false)
      onChanged()
    } catch (e) {
      setError(e?.response?.data?.message || `Could not ${kind} this interview.`)
    } finally { setBusy('') }
  }

  return (
    <div className="wk-card">
      <div className="wk-job" style={{ alignItems: 'center' }}>
        <JobArt job={{ title: iv.jobTitle, businessName: iv.businessName }} />
        <div className="meta" style={{ paddingRight: 0 }}>
          <Link to={`/worker/interviews/${iv.id}`} className="ttl" style={{ color: 'inherit', display: 'block' }}>
            {iv.jobTitle}
          </Link>
          <div className="biz">{iv.businessName}</div>
        </div>
        <span className={`wk-badge ${iv.status === 'COMPLETED' ? 'accepted' : iv.status === 'CANCELLED' ? 'rejected' : 'interview'}`}>
          {iv.status === 'PENDING' ? 'Invited' : iv.status?.[0] + iv.status?.slice(1).toLowerCase()}
        </span>
      </div>

      <div className="wk-facts" style={{ marginTop: 14 }}>
        <Fact icon="calendar" k="Date" v={formatDate(iv.scheduledAt)} />
        <Fact icon="clock" k="Time" v={`${timeOnly(iv.scheduledAt)}${iv.endsAt ? ` – ${timeOnly(iv.endsAt)}` : ''}`} />
        <Fact icon="users" k="Type" v={MODE_LABEL[iv.mode] || iv.mode} />
        <Fact icon="pin" k="Location" v={iv.location || '—'} />
      </div>

      <ErrorNote>{error}</ErrorNote>

      {iv.isUpcoming !== false && iv.status !== 'CANCELLED' && iv.status !== 'COMPLETED' && (
        confirming ? (
          <div className="wk-card" style={{ marginTop: 14, borderColor: '#fecaca', background: '#fef2f2' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#b91c1c' }}>Cancel this interview?</div>
            <div style={{ fontSize: 13.5, color: '#b91c1c', marginTop: 4 }}>
              The employer is told straight away. You can still be considered for the job.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={() => setConfirming(false)} disabled={!!busy}>
                Keep it
              </button>
              <button className="mk-btn mk-btn-sm" style={{ background: '#dc2626', color: '#fff' }}
                onClick={() => act('cancel')} disabled={!!busy}>
                {busy === 'cancel' ? 'Cancelling…' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <Link className="mk-btn mk-btn-primary mk-btn-sm" to={`/worker/interviews/${iv.id}`}>View details</Link>
            <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={() => act('reschedule')} disabled={!!busy}>
              {busy === 'reschedule' ? 'Requesting…' : 'Reschedule'}
            </button>
            <button className="mk-btn mk-btn-sm" style={{ background: '#fff', color: '#b91c1c', border: '1px solid #fecaca' }}
              onClick={() => setConfirming(true)}>
              Cancel
            </button>
          </div>
        )
      )}
    </div>
  )
}

const DEFAULT_TIPS = [
  'Be on time (10 minutes early)',
  'Carry a valid ID proof',
  'Dress neatly and be professional',
  'Be ready to talk about your experience',
  'Ask questions about the job if needed',
]

function Tips({ tips }) {
  return (
    <div className="wk-card pad-lg" style={{ marginTop: 16 }}>
      <h2 className="wk-h2">Interview Tips</h2>
      <ul className="wk-bullets" style={{ marginTop: 12 }}>
        {(tips?.length ? tips : DEFAULT_TIPS).map((t) => <li key={t}>{t}</li>)}
      </ul>
    </div>
  )
}

/* ---------- 14 + 15. Interview details / feedback ---------- */

export function InterviewDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [iv, setIv] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('details')
  const [busy, setBusy] = useState('')
  useDocumentTitle(iv ? `${iv.jobTitle} interview` : 'Interview')

  const load = () => {
    setError('')
    getInterview(id).then(setIv).catch(() => setError('We could not load this interview.'))
  }
  useEffect(load, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (kind) => {
    setBusy(kind)
    try {
      await (kind === 'cancel' ? cancelInterview(id) : rescheduleInterview(id))
      load()
    } catch (e) {
      setError(e?.response?.data?.message || `Could not ${kind} this interview.`)
    } finally { setBusy('') }
  }

  /** Downloads a .ics so the interview lands in the worker's own calendar. */
  const addToCalendar = () => {
    const start = new Date(iv.scheduledAt)
    const end = iv.endsAt ? new Date(iv.endsAt) : new Date(start.getTime() + 30 * 60000)
    const stamp = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//JobOn//EN', 'BEGIN:VEVENT',
      `UID:interview-${iv.id}@skillbridge`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:Interview – ${iv.jobTitle} at ${iv.businessName}`,
      `LOCATION:${(iv.addressLine || iv.location || '').replace(/,/g, '\\,')}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n')
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `interview-${iv.id}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (error && !iv) return <ErrorNote onRetry={load}>{error}</ErrorNote>
  if (!iv) return <Loading rows={2} />

  // Screen 15: once the interview is done the page becomes a status view.
  if (iv.status === 'COMPLETED') return <InterviewFeedback iv={iv} />

  const cancelled = iv.status === 'CANCELLED'

  return (
    <>
      <Link className="wk-link" to="/worker/interviews" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
        <Icon name="chevronLeft" size={15} /> Back to Interviews
      </Link>

      <ErrorNote>{error}</ErrorNote>

      <div className="wk-card pad-lg">
        <div className="wk-job" style={{ alignItems: 'center' }}>
          <JobArt job={{ title: iv.jobTitle, businessName: iv.businessName }} />
          <div className="meta" style={{ paddingRight: 0 }}>
            <div className="ttl">{iv.jobTitle}</div>
            <div className="biz">{iv.businessName}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{formatDate(iv.scheduledAt)}</div>
            <div className="wk-sub" style={{ marginTop: 0 }}>{timeOnly(iv.scheduledAt)}</div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <SegTabs
            value={tab}
            onChange={setTab}
            tabs={[{ value: 'details', label: 'Details' }, { value: 'prep', label: 'Preparation' }]}
          />
        </div>

        {tab === 'details' ? (
          <div className="wk-kvlist" style={{ marginTop: 18 }}>
            <KV icon="users" k="Interview Type" v={MODE_LABEL[iv.mode] || iv.mode} />
            <KV icon="calendar" k="Interview Date" v={formatDate(iv.scheduledAt)} />
            <KV icon="clock" k="Time" v={`${timeOnly(iv.scheduledAt)}${iv.endsAt ? ` – ${timeOnly(iv.endsAt)}` : ''}`} />
            <KV icon="pin" k="Location" v={
              <>
                {iv.addressLine || iv.location || '—'}
                {(iv.addressLine || iv.location) && (
                  <> · <a href={mapsLink(iv.latitude, iv.longitude, iv.addressLine || iv.location)}
                    target="_blank" rel="noreferrer">View on Map</a></>
                )}
              </>
            } />
            {iv.interviewerName && (
              <div className="r">
                <span className="ic"><Icon name="user" size={14} /></span>
                <span className="k">Interviewer</span>
                <span className="v" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={iv.interviewerName} size={26} />
                  {iv.interviewerName}
                  {iv.interviewerRole && <span className="wk-sub" style={{ marginTop: 0 }}>· {iv.interviewerRole}</span>}
                </span>
              </div>
            )}
            {iv.interviewerPhone && (
              <KV icon="phone" k="Contact" v={<a href={`tel:${iv.interviewerPhone}`}>{iv.interviewerPhone}</a>} />
            )}
            {iv.notes && <KV icon="doc" k="Notes" v={iv.notes} />}
          </div>
        ) : (
          <div style={{ marginTop: 18 }}>
            <h2 className="wk-h2">How to prepare</h2>
            <ul className="wk-bullets" style={{ marginTop: 12 }}>
              {(iv.preparationTips?.length ? iv.preparationTips : DEFAULT_TIPS).map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
        )}

        {!cancelled && (
          <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
            <button className="mk-btn mk-btn-outline" onClick={addToCalendar}>
              <Icon name="calendar" size={16} /> Add to Calendar
            </button>
            <button className="mk-btn mk-btn-primary" onClick={() => act('reschedule')} disabled={!!busy}>
              {busy === 'reschedule' ? 'Requesting…' : 'Reschedule'}
            </button>
          </div>
        )}
        {cancelled && (
          <p className="wk-sub" style={{ marginTop: 18 }}>
            This interview was cancelled. Your application is still open —
            check <Link to="/worker/applications">My Applications</Link> for its status.
          </p>
        )}
      </div>
    </>
  )
}

/* ---------- 15. Interview feedback ---------- */

function InterviewFeedback({ iv }) {
  useDocumentTitle('Interview completed')
  const steps = [
    { label: 'Interview Completed', at: formatDate(iv.scheduledAt, true), state: 'DONE' },
    { label: 'Under Review', at: 'In progress', state: 'CURRENT' },
    { label: 'Final Decision', at: 'Pending', state: 'PENDING' },
  ]

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="wk-card">
        <div className="wk-offer" style={{ paddingBottom: 18 }}>
          <div className="tick" style={{ background: '#dbeafe', color: '#1e40af' }}>
            <Icon name="checkCircle" size={34} />
          </div>
          <h1>Interview Completed!</h1>
          <p className="lede">Thank you for attending the interview.</p>
        </div>

        <div className="mk-note" style={{ margin: '0 4px' }}>
          The employer is now reviewing your interview. We will notify you once a decision is made.
        </div>

        <div className="wk-timeline" style={{ marginTop: 20 }}>
          {steps.map((s, i) => (
            <div className={`wk-tl ${s.state.toLowerCase()}`} key={s.label}>
              <div className="rail">
                <span className="node">
                  <Icon name={s.state === 'DONE' ? 'check' : 'clock'} size={13} strokeWidth={s.state === 'DONE' ? 3 : 2} />
                </span>
                {i < steps.length - 1 && <span className="line" />}
              </div>
              <div className="content">
                <div className="lbl">{s.label}</div>
                <div className="at">{s.at}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <Link className="mk-btn mk-btn-outline" style={{ flex: 1 }} to="/worker/interviews">Back to Interviews</Link>
          <Link className="mk-btn mk-btn-primary" style={{ flex: 1 }} to="/worker/applications">My Applications</Link>
        </div>
      </div>
    </div>
  )
}

/* ---------- shared ---------- */

function Fact({ icon, k, v }) {
  return (
    <div className="wk-fact">
      <span className="ic"><Icon name={icon} size={15} /></span>
      <span style={{ minWidth: 0 }}>
        <span className="v" style={{ display: 'block' }}>{v}</span>
        <span className="k">{k}</span>
      </span>
    </div>
  )
}

function KV({ icon, k, v }) {
  return (
    <div className="r">
      <span className="ic"><Icon name={icon} size={14} /></span>
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  )
}
