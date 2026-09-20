import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { Avatar, useDocumentTitle } from '../../../marketing/components'
import { Loading, ErrorNote } from '../../../worker/components'
import { getWorker, decideApplication, km } from '../api'

const OPTIONS = [
  { value: 'SHORTLISTED', icon: 'star', title: 'Shortlist', desc: 'Add to shortlisted candidates' },
  { value: 'INTERVIEW_SCHEDULED', icon: 'calendar', title: 'Schedule Interview', desc: 'Invite for an interview' },
  { value: 'OFFERED', icon: 'checkCircle', title: 'Select / Send Offer', desc: 'Proceed with job offer' },
  { value: 'REJECTED', icon: 'close', title: 'Reject', desc: 'Not suitable for this role' },
]

const MAX = 500

const titleCase = (s) => (s ? String(s)[0].toUpperCase() + String(s).slice(1).toLowerCase() : '')

function matchClass(score) {
  if (score == null) return 'emp-match'
  if (score < 50) return 'emp-match low'
  if (score < 70) return 'emp-match mid'
  return 'emp-match'
}

export default function ApplicationDecision() {
  const { applicationId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  useDocumentTitle('Update Application Status')

  const workerId = params.get('workerId') || ''
  const jobId = params.get('jobId') || ''

  const [w, setW] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('SHORTLISTED')
  const [message, setMessage] = useState('')
  const [notify, setNotify] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = () => {
    if (!workerId) return
    setW(null); setLoadError('')
    getWorker(workerId, jobId || undefined)
      .then(setW)
      .catch(() => setLoadError('We could not load this candidate.'))
  }
  useEffect(load, [workerId, jobId]) // eslint-disable-line react-hooks/exhaustive-deps

  const applicants = jobId ? `/employer/jobs/${jobId}/applicants` : '/employer/applications'

  const submit = () => {
    setBusy(true); setError('')
    decideApplication(applicationId, { status, message: message.trim() || undefined, notify })
      .then(() => {
        if (status === 'INTERVIEW_SCHEDULED') {
          navigate(`/employer/interviews/schedule?workerId=${workerId}&jobId=${jobId}&applicationId=${applicationId}`)
        } else {
          navigate(applicants)
        }
      })
      .catch(() => setError('We could not update this application. Please try again.'))
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

        <h2 className="wk-h2" style={{ marginTop: 22 }}>Update Application Status</h2>

        <div className="emp-radios" style={{ marginTop: 12 }} role="group" aria-label="Application status">
          {OPTIONS.map((o) => (
            <button
              type="button"
              className="emp-radio"
              key={o.value}
              aria-pressed={status === o.value}
              onClick={() => setStatus(o.value)}
            >
              <span className="ic"><Icon name={o.icon} size={17} /></span>
              <span>
                <span className="t" style={{ display: 'block' }}>{o.title}</span>
                <span className="d" style={{ display: 'block' }}>{o.desc}</span>
              </span>
              <span className="mark">
                {status === o.value && <Icon name="check" size={12} strokeWidth={3} />}
              </span>
            </button>
          ))}
        </div>

        <div className="wk-field" style={{ marginTop: 20 }}>
          <label htmlFor="ad-msg">Add a message (optional)</label>
          <textarea
            id="ad-msg"
            className="wk-input"
            rows={4}
            maxLength={MAX}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
            placeholder="Write a short note for the candidate…"
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
          <div className="emp-counter">{message.length}/{MAX}</div>
        </div>

        <label className="wk-checkrow" style={{ marginTop: 6 }}>
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          Notify candidate via app and email
        </label>

        <ErrorNote>{error}</ErrorNote>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="mk-btn mk-btn-outline" style={{ flex: 1 }} onClick={() => navigate(applicants)}>
            Cancel
          </button>
          <button className="mk-btn mk-btn-primary" style={{ flex: 2 }} onClick={submit} disabled={busy}>
            {busy ? 'Updating…' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  )
}
