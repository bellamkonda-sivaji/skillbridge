import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { Avatar, useDocumentTitle } from '../../../marketing/components'
import { Loading, Empty, ErrorNote, PageHead } from '../../../worker/components'
import { getShortlist, getJob, bulkDecide, km, formatDate } from '../api'

const BULK = [
  { value: '', label: 'Bulk Actions' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Schedule interview' },
  { value: 'OFFERED', label: 'Send offer' },
  { value: 'REJECTED', label: 'Reject' },
]

const yrs = (n) => `${n} yr${n === 1 ? '' : 's'}`

function line(c) {
  return [
    c.experienceYears != null ? `${yrs(c.experienceYears)} exp` : null,
    km(c.distanceKm),
  ].filter(Boolean).join(' · ')
}

export default function Shortlist() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  useDocumentTitle('Shortlisted Candidates')

  const [job, setJob] = useState(null)
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState([])
  const [compare, setCompare] = useState([])
  const [action, setAction] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    setRows(null); setError(''); setSelected([]); setCompare([])
    getShortlist(jobId)
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setError('We could not load your shortlist for this job.'))
  }
  useEffect(load, [jobId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getJob(jobId).then(setJob).catch(() => setJob(null))
  }, [jobId])

  const flip = (setter) => (id) =>
    setter((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))
  const toggleSelected = flip(setSelected)
  const toggleCompare = flip(setCompare)

  const applyBulk = () => {
    if (!action || !selected.length) return
    setBusy(true)
    bulkDecide(selected, action)
      .then(() => { setAction(''); load() })
      .catch(() => setError('That bulk update did not go through. Please try again.'))
      .finally(() => setBusy(false))
  }

  const total = rows ? rows.length : 0

  return (
    <>
      <PageHead
        title="Shortlisted Candidates"
        sub="Manage your shortlisted candidates for this job."
        back={{ to: `/employer/jobs/${jobId}/applicants`, label: 'Back to applicants' }}
      />

      <div className="wk-row" style={{ flexWrap: 'wrap', marginBottom: 14 }}>
        <div className="grow">
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>
            {job?.title || 'This job'}
          </div>
          <div className="wk-sub" style={{ marginTop: 2 }}>
            {total} shortlisted candidate{total === 1 ? '' : 's'}
          </div>
        </div>
        <button
          className="mk-btn mk-btn-primary mk-btn-sm"
          disabled={compare.length < 2}
          onClick={() => navigate(`/employer/compare?workerIds=${compare.join(',')}&jobId=${jobId}`)}
        >
          Compare selected{compare.length ? ` (${compare.length})` : ''}
        </button>
      </div>

      <div className="emp-toolbar">
        <select
          className="wk-select grow"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          aria-label="Bulk action"
        >
          {BULK.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
        <button
          className="mk-btn mk-btn-outline mk-btn-sm"
          onClick={applyBulk}
          disabled={busy || !action || !selected.length}
        >
          Apply{selected.length ? ` to ${selected.length}` : ''}
        </button>
      </div>

      <ErrorNote onRetry={load}>{error}</ErrorNote>

      {!rows && !error ? (
        <Loading rows={3} />
      ) : rows && rows.length ? (
        <div className="wk-list">
          {rows.map((c) => (
            <div className="wk-card wk-clicky" key={c.applicationId || c.workerId}>
              <Link to={`/employer/workers/${c.workerId}?jobId=${jobId}`} className="wk-overlay" aria-label={c.name || 'Worker profile'} />
              <div className="emp-app-row" style={{ flexWrap: 'wrap' }}>
                {c.applicationId != null && (
                  <input
                    type="checkbox"
                    checked={selected.includes(c.applicationId)}
                    onChange={() => toggleSelected(c.applicationId)}
                    aria-label={`Select ${c.name} for bulk actions`}
                    style={{ width: 16, height: 16, accentColor: 'var(--blue)', flexShrink: 0 }}
                  />
                )}
                <Avatar name={c.name || '?'} size={42} />

                <div className="meta">
                  <Link
                    className="nm"
                    to={`/employer/workers/${c.workerId}?jobId=${jobId}`}
                    style={{ color: 'inherit' }}
                  >
                    {c.name}
                  </Link>
                  <div className="sb">{line(c)}</div>
                  {(c.shortlistedAt || c.appliedAt) && (
                    <div className="sb">Shortlisted {formatDate(c.shortlistedAt || c.appliedAt)}</div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <Link
                    className="emp-menu-btn"
                    to={`/employer/interviews/schedule?workerId=${c.workerId}&jobId=${jobId}${c.applicationId ? `&applicationId=${c.applicationId}` : ''}`}
                    aria-label={`Message ${c.name} about an interview`}
                  >
                    <Icon name="chat" size={16} />
                  </Link>
                  <label className="wk-checkrow" style={{ fontSize: 12.5 }}>
                    <input
                      type="checkbox"
                      checked={compare.includes(c.workerId)}
                      onChange={() => toggleCompare(c.workerId)}
                    />
                    Compare
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !error && (
          <div className="wk-card">
            <Empty
              icon="users"
              title="No shortlisted candidates yet"
              text="Shortlist applicants and they will gather here for comparison."
            >
              <Link className="mk-btn mk-btn-primary mk-btn-sm" to={`/employer/jobs/${jobId}/applicants`}>
                Review applicants
              </Link>
            </Empty>
          </div>
        )
      )}
    </>
  )
}
