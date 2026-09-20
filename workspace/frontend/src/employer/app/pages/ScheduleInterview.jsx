import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { Avatar, useDocumentTitle } from '../../../marketing/components'
import { Loading, ErrorNote } from '../../../worker/components'
import { getWorker, getJob, scheduleInterview, km, timeLabel } from '../api'

const MODES = [
  { value: 'IN_PERSON', icon: 'store', label: 'In-person' },
  { value: 'PHONE', icon: 'phone', label: 'Phone call' },
  { value: 'VIDEO', icon: 'chat', label: 'Video call' },
]

const MAX = 300

/** 30-minute slots from 08:00 to 20:00. */
const SLOTS = (() => {
  const out = []
  for (let m = 8 * 60; m <= 20 * 60; m += 30) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
  }
  return out
})()

const todayISO = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

const titleCase = (s) => (s ? String(s)[0].toUpperCase() + String(s).slice(1).toLowerCase() : '')

function matchClass(score) {
  if (score == null) return 'emp-match'
  if (score < 50) return 'emp-match low'
  if (score < 70) return 'emp-match mid'
  return 'emp-match'
}

export default function ScheduleInterview() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  useDocumentTitle('Schedule Interview')

  const workerId = params.get('workerId') || ''
  const jobId = params.get('jobId') || ''
  const applicationId = params.get('applicationId') || ''

  const [w, setW] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState('IN_PERSON')
  const [date, setDate] = useState(todayISO)
  const [time, setTime] = useState('10:00')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [sendDetails, setSendDetails] = useState(true)
  const [busy, setBusy] = useState(false)
  const locationRef = useRef(null)

  const load = () => {
    if (!workerId) return
    setW(null); setLoadError('')
    getWorker(workerId, jobId || undefined)
      .then(setW)
      .catch(() => setLoadError('We could not load this candidate.'))
  }
  useEffect(load, [workerId, jobId]) // eslint-disable-line react-hooks/exhaustive-deps

  // The job carries the business address, so it doubles as the default venue.
  useEffect(() => {
    if (!jobId) return
    getJob(jobId)
      .then((job) => {
        const prefill = job?.address || [job?.area, job?.city].filter(Boolean).join(', ') || job?.businessName
        if (prefill) setLocation((v) => v || prefill)
      })
      .catch(() => {})
  }, [jobId])

  const applicants = jobId ? `/employer/jobs/${jobId}/applicants` : '/employer/applications'

  const submit = () => {
    setBusy(true); setError('')
    scheduleInterview({
      workerId, jobId, applicationId: applicationId || undefined,
      mode, date, time, location, notes: notes.trim() || undefined, sendDetails,
    })
      .then(() => navigate('/employer/interviews'))
      .catch(() => setError('We could not schedule this interview. Please try again.'))
      .finally(() => setBusy(false))
  }

  const meta = w
    ? [titleCase(w.gender), w.age != null ? `${w.age} years` : null, km(w.distanceKm)]
      .filter(Boolean).join(' · ')
    : ''

  return (
    <div style={{ maxWidth: 640 }}>
      <Link className="wk-link" to={applicants} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
        <Icon name="chevronLeft" size={15} /> Back to Applicants
      </Link>

      <ErrorNote onRetry={load}>{loadError}</ErrorNote>

      <div className="wk-card pad-lg">
        {workerId && !w && !loadError ? (
          <Loading rows={1} />
        ) : (
          <div className="emp-app-row" style={{ flexWrap: 'wrap' }}>
            <Avatar name={w?.name || '?'} size={52} />
            <div className="meta">
              <div className="nm">{w?.name || 'Candidate'}</div>
              {w?.jobTitle && <div className="sb">{w.jobTitle}</div>}
              {meta && <div className="sb">{meta}</div>}
            </div>
            {w?.matchScore != null && (
              <span className={matchClass(w.matchScore)}>{Math.round(w.matchScore)}% match</span>
            )}
          </div>
        )}

        <h2 className="wk-h2" style={{ marginTop: 22 }}>Interview Details</h2>

        <div className="wk-field" style={{ marginTop: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Interview Type</span>
          <div
            className="emp-radios"
            role="group"
            aria-label="Interview type"
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
          >
            {MODES.map((m) => (
              <button
                type="button"
                className="emp-radio"
                key={m.value}
                aria-pressed={mode === m.value}
                onClick={() => setMode(m.value)}
                style={{ flex: '1 1 140px', padding: 11, gap: 9 }}
              >
                <span className="ic" style={{ width: 30, height: 30 }}><Icon name={m.icon} size={15} /></span>
                <span className="t">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 16 }}>
          <div className="wk-field">
            <label htmlFor="si-date">Date</label>
            <input
              id="si-date"
              type="date"
              className="wk-input"
              value={date}
              min={todayISO()}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="wk-field">
            <label htmlFor="si-time">Time</label>
            <select id="si-time" className="wk-select" value={time} onChange={(e) => setTime(e.target.value)}>
              {SLOTS.map((s) => <option key={s} value={s}>{timeLabel(s)}</option>)}
            </select>
          </div>
        </div>

        <div className="wk-field" style={{ marginTop: 16 }}>
          <div className="wk-row">
            <label className="grow" htmlFor="si-loc" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
              Location
            </label>
            <button
              type="button"
              className="wk-link"
              style={{ border: 0, background: 'transparent', cursor: 'pointer', font: 'inherit' }}
              onClick={() => locationRef.current?.focus()}
            >
              Change
            </button>
          </div>
          <input
            id="si-loc"
            ref={locationRef}
            className="wk-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where should the candidate go?"
          />
          <span className="wk-sub" style={{ marginTop: 0 }}>Prefilled from your business address.</span>
        </div>

        <div className="wk-field" style={{ marginTop: 16 }}>
          <label htmlFor="si-notes">Notes for Candidate (optional)</label>
          <textarea
            id="si-notes"
            className="wk-input"
            rows={4}
            maxLength={MAX}
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, MAX))}
            placeholder="Anything they should bring or know…"
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
          <div className="emp-counter">{notes.length}/{MAX}</div>
        </div>

        <label className="wk-checkrow" style={{ marginTop: 6 }}>
          <input type="checkbox" checked={sendDetails} onChange={(e) => setSendDetails(e.target.checked)} />
          Send interview details to candidate
        </label>

        <ErrorNote>{error}</ErrorNote>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="mk-btn mk-btn-outline" style={{ flex: 1 }} onClick={() => navigate(applicants)}>
            Cancel
          </button>
          <button
            className="mk-btn mk-btn-primary"
            style={{ flex: 2 }}
            onClick={submit}
            disabled={busy || !date || !time}
          >
            {busy ? 'Scheduling…' : 'Schedule Interview'}
          </button>
        </div>
      </div>
    </div>
  )
}
