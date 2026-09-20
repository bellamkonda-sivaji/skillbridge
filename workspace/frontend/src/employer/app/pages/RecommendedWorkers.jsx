import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Avatar, useDocumentTitle } from '../../../marketing/components'
import { Verified, Loading, Empty, ErrorNote, PillTabs, PageHead } from '../../../worker/components'
import { getRecommended, inviteWorker, km } from '../api'

const TABS = [
  { value: 'TOP', label: 'Top Matches' },
  { value: 'NEARBY', label: 'Nearby' },
  { value: 'AVAILABLE_NOW', label: 'Available Now' },
  { value: 'SIMILAR', label: 'Similar Jobs' },
]

const yrs = (n) => `${n} yr${n === 1 ? '' : 's'}`

function matchClass(score) {
  if (score == null) return 'emp-match'
  if (score < 50) return 'emp-match low'
  if (score < 70) return 'emp-match mid'
  return 'emp-match'
}

function workerLine(w) {
  return [
    w.experienceYears != null ? yrs(w.experienceYears) : null,
    w.jobTitle,
    km(w.distanceKm),
  ].filter(Boolean).join(' · ')
}

export default function RecommendedWorkers() {
  const { jobId } = useParams()
  useDocumentTitle('Recommended Workers')

  const [tab, setTab] = useState('TOP')
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [invited, setInvited] = useState([])
  const [inviting, setInviting] = useState(null)

  const load = () => {
    setRows(null); setError('')
    getRecommended(jobId, tab)
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setError('We could not load recommended workers right now.'))
  }
  useEffect(load, [jobId, tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const invite = (workerId) => {
    setInviting(workerId)
    inviteWorker(jobId, workerId)
      .then(() => setInvited((list) => [...list, workerId]))
      .catch(() => setError('That invite did not go through. Please try again.'))
      .finally(() => setInviting(null))
  }

  return (
    <>
      <PageHead
        title="Recommended Workers"
        sub="AI-powered matching based on your job requirements."
        back={{ to: `/employer/jobs/${jobId}/applicants`, label: 'Back to applicants' }}
      />

      <PillTabs tabs={TABS} value={tab} onChange={setTab} />

      <div style={{ marginTop: 16 }}>
        <ErrorNote onRetry={load}>{error}</ErrorNote>

        {!rows && !error ? (
          <Loading rows={3} />
        ) : rows && rows.length ? (
          <div className="wk-list">
            {rows.map((w) => (
              <div className="wk-card wk-clicky" key={w.workerId}>
                <Link to={`/employer/workers/${w.workerId}?jobId=${jobId}`} className="wk-overlay" aria-label={w.name || 'Worker profile'} />
                <div className="emp-app-row" style={{ flexWrap: 'wrap' }}>
                  <Avatar name={w.name || '?'} size={42} />

                  <div className="meta">
                    <div className="wk-row" style={{ gap: 7, flexWrap: 'wrap' }}>
                      <Link
                        className="nm"
                        to={`/employer/workers/${w.workerId}?jobId=${jobId}`}
                        style={{ color: 'inherit' }}
                      >
                        {w.name}
                      </Link>
                      {w.verified && <Verified label="Verified" />}
                    </div>
                    <div className="sb">{workerLine(w)}</div>
                    {w.availability && <div className="sb">{w.availability}</div>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
                    {w.matchScore != null && (
                      <span className={matchClass(w.matchScore)}>{Math.round(w.matchScore)}% match</span>
                    )}
                    <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/employer/workers/${w.workerId}?jobId=${jobId}`}>
                      View Profile
                    </Link>
                    <button
                      className="mk-btn mk-btn-primary mk-btn-sm"
                      onClick={() => invite(w.workerId)}
                      disabled={inviting === w.workerId || invited.includes(w.workerId)}
                    >
                      {invited.includes(w.workerId) ? 'Invited' : inviting === w.workerId ? '…' : 'Invite to apply'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !error && (
            <div className="wk-card">
              <Empty
                icon="sparkles"
                title="No matches in this tab yet"
                text="Try another tab, or widen the requirements on your job post to reach more workers."
              >
                <Link className="mk-btn mk-btn-primary mk-btn-sm" to={`/employer/jobs/${jobId}`}>
                  View job
                </Link>
              </Empty>
            </div>
          )
        )}
      </div>
    </>
  )
}
