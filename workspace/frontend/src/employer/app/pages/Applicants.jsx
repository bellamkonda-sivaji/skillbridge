import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { Avatar, useDocumentTitle } from '../../../marketing/components'
import { Loading, Empty, ErrorNote, PillTabs, PageHead } from '../../../worker/components'
import { getApplicants, getJob, decideApplication, bulkDecide, km, formatDate } from '../api'

const JOB_LABEL = {
  OPEN: 'Active', ACTIVE: 'Active', PAUSED: 'Paused',
  FILLED: 'Filled', CLOSED: 'Closed', DRAFT: 'Draft', CANCELLED: 'Cancelled',
}
const JOB_TONE = {
  PAUSED: 'pending', FILLED: 'interview',
  CLOSED: 'withdrawn', DRAFT: 'withdrawn', CANCELLED: 'rejected',
}

/** Tab -> the applicant statuses it holds. */
const GROUPS = {
  all: null,
  new: ['APPLIED'],
  shortlisted: ['SHORTLISTED'],
  interview: ['INTERVIEW_SCHEDULED'],
  rejected: ['REJECTED', 'WITHDRAWN'],
}

const SORTS = [
  { value: 'MATCH', label: 'Match' },
  { value: 'RECENT', label: 'Most recent' },
  { value: 'EXPERIENCE', label: 'Experience' },
]

const FILTERS = [
  { value: 'ALL', label: 'All applicants' },
  { value: 'VERIFIED', label: 'Verified only' },
  { value: 'AVAILABLE', label: 'Available now' },
  { value: 'NEARBY', label: 'Within 5 km' },
]

const titleCase = (s) => (s ? String(s)[0].toUpperCase() + String(s).slice(1).toLowerCase() : '')
const yrs = (n) => `${n} yr${n === 1 ? '' : 's'}`

function matchClass(score) {
  if (score == null) return 'emp-match'
  if (score < 50) return 'emp-match low'
  if (score < 70) return 'emp-match mid'
  return 'emp-match'
}

function personLine(a) {
  return [
    titleCase(a.gender),
    a.experienceYears != null ? `${yrs(a.experienceYears)} exp` : null,
    km(a.distanceKm),
  ].filter(Boolean).join(' · ')
}

export default function Applicants() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  useDocumentTitle('Applicants')

  const [job, setJob] = useState(null)
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [sort, setSort] = useState('MATCH')
  const [selected, setSelected] = useState([])
  const [menu, setMenu] = useState(null)
  const [busy, setBusy] = useState(false)

  // Counts need every applicant, so the tab filtering happens on the client and
  // only the sort is handed to the server.
  const load = () => {
    setRows(null); setError(''); setSelected([])
    getApplicants(jobId, 'ALL', sort)
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setError('We could not load the applicants for this job.'))
  }
  useEffect(load, [jobId, sort]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getJob(jobId).then(setJob).catch(() => setJob(null))
  }, [jobId])

  const count = (key) => {
    if (!rows) return undefined
    const g = GROUPS[key]
    return g ? rows.filter((a) => g.includes(a.status)).length : rows.length
  }

  const shown = useMemo(() => {
    if (!rows) return []
    const needle = q.trim().toLowerCase()
    const g = GROUPS[tab]
    let list = g ? rows.filter((a) => g.includes(a.status)) : rows
    if (needle) {
      list = list.filter((a) =>
        [a.name, a.jobTitle, ...(a.skills || [])]
          .filter(Boolean).join(' ').toLowerCase().includes(needle)
      )
    }
    if (filter === 'VERIFIED') list = list.filter((a) => a.verified)
    if (filter === 'AVAILABLE') list = list.filter((a) => /now|immediate/i.test(a.availability || ''))
    if (filter === 'NEARBY') list = list.filter((a) => a.distanceKm != null && a.distanceKm <= 5)
    // Mirrors the server sort so the list still reorders if the API ignores it.
    const by = {
      MATCH: (a, b) => (b.matchScore || 0) - (a.matchScore || 0),
      RECENT: (a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0),
      EXPERIENCE: (a, b) => (b.experienceYears || 0) - (a.experienceYears || 0),
    }[sort]
    return by ? [...list].sort(by) : list
  }, [rows, tab, q, filter, sort])

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const runBulk = (status) => {
    if (!selected.length) return
    setBusy(true)
    bulkDecide(selected, status)
      .then(load)
      .catch(() => setError('That bulk update did not go through. Please try again.'))
      .finally(() => setBusy(false))
  }

  const decide = (applicationId, status) => {
    setMenu(null)
    if (!applicationId) return
    decideApplication(applicationId, { status })
      .then(load)
      .catch(() => setError('We could not update that application.'))
  }

  const status = job?.status
  const total = rows ? rows.length : 0

  return (
    <>
      <PageHead
        title={job?.title || 'Applicants'}
        sub={rows ? `${total} applicant${total === 1 ? '' : 's'} for this job` : 'Loading applicants…'}
        back={{ to: `/employer/jobs/${jobId}`, label: 'Back to job' }}
      >
        <span className={`wk-badge ${JOB_TONE[status] || 'shortlisted'}`}>
          {JOB_LABEL[status] || 'Active'}
        </span>
        <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/employer/jobs/${jobId}`}>
          View Job
        </Link>
      </PageHead>

      <PillTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'all', label: 'All', count: count('all') },
          { value: 'new', label: 'New', count: count('new') },
          { value: 'shortlisted', label: 'Shortlisted', count: count('shortlisted') },
          { value: 'interview', label: 'Interview', count: count('interview') },
          { value: 'rejected', label: 'Rejected', count: count('rejected') },
        ]}
      />

      <div className="emp-toolbar" style={{ marginTop: 14 }}>
        <div className="wk-bar grow" style={{ padding: '9px 12px' }}>
          <Icon name="search" size={16} style={{ color: '#64748b', flexShrink: 0 }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search applicants"
            aria-label="Search applicants"
          />
        </div>
        <select
          className="wk-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter applicants"
          style={{ width: 'auto' }}
        >
          {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select
          className="wk-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort applicants"
          style={{ width: 'auto' }}
        >
          {SORTS.map((s) => <option key={s.value} value={s.value}>Sort: {s.label}</option>)}
        </select>
      </div>

      {selected.length > 0 && (
        <div className="wk-card" style={{ marginBottom: 12, background: 'var(--blue-50)', borderColor: 'var(--blue-100)' }}>
          <div className="wk-row" style={{ flexWrap: 'wrap' }}>
            <span className="grow" style={{ fontSize: 13.5, fontWeight: 600 }}>
              {selected.length} selected
            </span>
            <button className="mk-btn mk-btn-primary mk-btn-sm" disabled={busy} onClick={() => runBulk('SHORTLISTED')}>
              Shortlist
            </button>
            <button className="mk-btn mk-btn-outline mk-btn-sm" disabled={busy} onClick={() => runBulk('REJECTED')}>
              Reject
            </button>
            <button className="mk-btn mk-btn-ghost mk-btn-sm" onClick={() => setSelected([])}>
              Clear
            </button>
          </div>
        </div>
      )}

      <ErrorNote onRetry={load}>{error}</ErrorNote>

      {!rows && !error ? (
        <Loading rows={3} />
      ) : shown.length ? (
        <div className="wk-list">
          {shown.map((a) => (
            <div
              className="wk-card"
              key={a.applicationId || a.workerId}
              onClick={() => navigate(`/employer/workers/${a.workerId}?jobId=${jobId}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="emp-app-row" style={{ flexWrap: 'wrap' }}>
                {a.applicationId != null && (
                  <input
                    type="checkbox"
                    checked={selected.includes(a.applicationId)}
                    onChange={() => toggle(a.applicationId)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${a.name}`}
                    style={{ width: 16, height: 16, accentColor: 'var(--blue)', flexShrink: 0 }}
                  />
                )}
                <Avatar name={a.name || '?'} size={42} />

                <div className="meta">
                  <div className="wk-row" style={{ gap: 7, flexWrap: 'wrap' }}>
                    <Link
                      className="nm"
                      to={`/employer/workers/${a.workerId}?jobId=${jobId}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: 'inherit' }}
                    >
                      {a.name}
                    </Link>
                    {a.isNew && <span className="wk-badge viewed">New</span>}
                  </div>
                  <div className="sb">{personLine(a)}</div>
                  {a.appliedAt && (
                    <div className="sb">Applied {formatDate(a.appliedAt)}</div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {a.matchScore != null && (
                    <span className={matchClass(a.matchScore)}>{Math.round(a.matchScore)}%</span>
                  )}
                  <div style={{ position: 'relative' }}>
                    <button
                      className="emp-menu-btn"
                      aria-label={`Actions for ${a.name}`}
                      aria-expanded={menu === a.applicationId}
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenu((m) => (m === a.applicationId ? null : a.applicationId))
                      }}
                    >
                      <Icon name="menu" size={16} />
                    </button>

                    {menu != null && menu === a.applicationId && (
                      <>
                        <button
                          aria-label="Close menu"
                          onClick={(e) => { e.stopPropagation(); setMenu(null) }}
                          style={{ position: 'fixed', inset: 0, zIndex: 55, border: 0, background: 'transparent', cursor: 'default' }}
                        />
                        <div
                          className="wk-card"
                          onClick={(e) => e.stopPropagation()}
                          style={{ position: 'absolute', right: 0, top: 34, width: 200, padding: 6, zIndex: 60, boxShadow: 'var(--shadow-lg)' }}
                        >
                          <button
                            className="mk-btn mk-btn-ghost mk-btn-sm mk-btn-block"
                            style={{ justifyContent: 'flex-start' }}
                            onClick={() => { setMenu(null); navigate(`/employer/workers/${a.workerId}?jobId=${jobId}`) }}
                          >
                            View profile
                          </button>
                          <button
                            className="mk-btn mk-btn-ghost mk-btn-sm mk-btn-block"
                            style={{ justifyContent: 'flex-start' }}
                            onClick={() => decide(a.applicationId, 'SHORTLISTED')}
                          >
                            Shortlist
                          </button>
                          <button
                            className="mk-btn mk-btn-ghost mk-btn-sm mk-btn-block"
                            style={{ justifyContent: 'flex-start' }}
                            onClick={() => {
                              setMenu(null)
                              navigate(`/employer/interviews/schedule?workerId=${a.workerId}&jobId=${jobId}&applicationId=${a.applicationId}`)
                            }}
                          >
                            Schedule interview
                          </button>
                          <button
                            className="mk-btn mk-btn-ghost mk-btn-sm mk-btn-block"
                            style={{ justifyContent: 'flex-start', color: '#b91c1c' }}
                            onClick={() => decide(a.applicationId, 'REJECTED')}
                          >
                            Reject
                          </button>
                        </div>
                      </>
                    )}
                  </div>
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
              title={tab === 'all' ? 'No applicants yet' : 'Nothing in this tab'}
              text={
                tab === 'all'
                  ? 'As workers apply to this job they will show up here.'
                  : 'Applicants move between these tabs as you review them.'
              }
            >
              <Link className="mk-btn mk-btn-primary mk-btn-sm" to={`/employer/jobs/${jobId}/recommended`}>
                See recommended workers
              </Link>
            </Empty>
          </div>
        )
      )}
    </>
  )
}
