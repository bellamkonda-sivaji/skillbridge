import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { useDocumentTitle } from '../../../marketing/components'
import { JobArt, Loading, Empty, ErrorNote, PillTabs } from '../../../worker/components'
import {
  listJobs, setJobStatus, deleteJob, pay, timeAgo,
  JOB_STATUS_LABEL, JOB_STATUS_TONE, EMPLOYMENT_LABEL,
} from '../api'

const TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'FILLED', label: 'Filled' },
  { value: 'DRAFT', label: 'Drafts' },
]

export default function MyJobs() {
  useDocumentTitle('My Jobs')
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || 'ALL'

  const [jobs, setJobs] = useState(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [menuFor, setMenuFor] = useState(null)

  const load = useCallback(() => {
    setJobs(null); setError('')
    listJobs('ALL')
      .then((d) => setJobs(Array.isArray(d) ? d : []))
      .catch(() => setError('We could not load your jobs.'))
  }, [])
  useEffect(load, [load])

  const counts = useMemo(() => {
    const c = { ALL: jobs?.length }
    if (!jobs) return c
    c.ACTIVE = jobs.filter((j) => j.status === 'OPEN' || j.status === 'ACTIVE').length
    c.PAUSED = jobs.filter((j) => j.status === 'PAUSED').length
    c.FILLED = jobs.filter((j) => j.status === 'FILLED').length
    c.DRAFT = jobs.filter((j) => j.status === 'DRAFT').length
    return c
  }, [jobs])

  const shown = useMemo(() => {
    if (!jobs) return []
    const term = q.trim().toLowerCase()
    return jobs.filter((j) => {
      if (status === 'ACTIVE' && !(j.status === 'OPEN' || j.status === 'ACTIVE')) return false
      if (status !== 'ALL' && status !== 'ACTIVE' && j.status !== status) return false
      if (term && ![j.title, j.city, j.area].join(' ').toLowerCase().includes(term)) return false
      return true
    })
  }, [jobs, status, q])

  const act = async (job, next) => {
    setMenuFor(null)
    const before = jobs
    setJobs((l) => l.map((j) => (j.id === job.id ? { ...j, status: next } : j)))
    try { await setJobStatus(job.id, next) } catch { setJobs(before) }
  }

  const removeDraft = async (job) => {
    setMenuFor(null)
    const before = jobs
    setJobs((l) => l.filter((j) => j.id !== job.id))
    try { await deleteJob(job.id) } catch { setJobs(before) }
  }

  return (
    <>
      <div className="wk-row" style={{ marginBottom: 16 }}>
        <div className="grow">
          <h1 className="wk-h1">My Jobs</h1>
          <p className="wk-sub">Manage all your job postings in one place.</p>
        </div>
        <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/employer/post-job">
          <Icon name="sparkles" size={15} /> Post a Job
        </Link>
      </div>

      <PillTabs
        tabs={TABS.map((t) => ({ ...t, count: counts[t.value] }))}
        value={status}
        onChange={(v) => { const p = new URLSearchParams(params); p.set('status', v); setParams(p) }}
      />

      <div className="emp-toolbar" style={{ marginTop: 14 }}>
        <div className="wk-bar grow">
          <Icon name="search" size={16} style={{ color: '#64748b', flexShrink: 0 }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jobs…" aria-label="Search jobs" />
        </div>
      </div>

      <ErrorNote onRetry={load}>{error}</ErrorNote>

      {!jobs && !error ? (
        <Loading rows={3} />
      ) : shown.length ? (
        <div className="wk-list">
          {shown.map((j) => {
            const isDraft = j.status === 'DRAFT'
            const live = j.status === 'OPEN' || j.status === 'ACTIVE'
            return (
              <div className="wk-card wk-clicky" key={j.id} style={{ position: 'relative' }}>
                <Link to={isDraft ? `/employer/post-job?edit=${j.id}` : `/employer/jobs/${j.id}`} className="wk-overlay" aria-label={j.title || 'Job details'} />
                <div className="wk-job" style={{ alignItems: 'center' }}>
                  <JobArt job={j} />
                  <div className="meta" style={{ paddingRight: 34 }}>
                    <Link
                      to={isDraft ? `/employer/post-job?edit=${j.id}` : `/employer/jobs/${j.id}`}
                      className="ttl"
                      style={{ color: 'inherit', display: 'block' }}
                    >
                      {j.title || 'Untitled job'}
                    </Link>
                    <div className="where">
                      <Icon name="pin" size={12} />
                      {[j.area, j.city].filter(Boolean).join(', ') || 'Location not set'}
                    </div>
                    <div className="chips">
                      <span className={`wk-badge ${JOB_STATUS_TONE[j.status] || 'viewed'}`}>
                        {JOB_STATUS_LABEL[j.status] || j.status}
                      </span>
                      {j.salary > 0 && <span className="wk-pay">{pay(j.salary, j.salaryUnit)}</span>}
                      {j.employmentType && (
                        <span className="wk-chip">{EMPLOYMENT_LABEL[j.employmentType] || j.employmentType}</span>
                      )}
                    </div>
                    <div className="where" style={{ marginTop: 8 }}>
                      {isDraft
                        ? `Saved ${timeAgo(j.postedAt)}`
                        : `${j.applicantsCount || 0} applicant${j.applicantsCount === 1 ? '' : 's'} · Posted ${timeAgo(j.postedAt)}`}
                    </div>
                  </div>
                </div>

                <button
                  className="emp-menu-btn"
                  style={{ position: 'absolute', top: 12, right: 12 }}
                  aria-label={`Actions for ${j.title}`}
                  aria-expanded={menuFor === j.id}
                  onClick={() => setMenuFor(menuFor === j.id ? null : j.id)}
                >
                  <Icon name="menu" size={16} />
                </button>

                {menuFor === j.id && (
                  <div className="wk-card" style={{ position: 'absolute', top: 44, right: 12, width: 190, padding: 6, zIndex: 20, boxShadow: 'var(--shadow-lg)' }}>
                    {isDraft ? (
                      <>
                        <MenuItem onClick={() => navigate(`/employer/post-job?edit=${j.id}`)}>Continue editing</MenuItem>
                        <MenuItem danger onClick={() => removeDraft(j)}>Delete draft</MenuItem>
                      </>
                    ) : (
                      <>
                        <MenuItem onClick={() => navigate(`/employer/jobs/${j.id}`)}>View job</MenuItem>
                        <MenuItem onClick={() => navigate(`/employer/jobs/${j.id}/applicants`)}>View applicants</MenuItem>
                        <MenuItem onClick={() => navigate(`/employer/post-job?edit=${j.id}`)}>Edit</MenuItem>
                        {live
                          ? <MenuItem onClick={() => act(j, 'PAUSED')}>Pause</MenuItem>
                          : <MenuItem onClick={() => act(j, 'OPEN')}>Reopen</MenuItem>}
                        <MenuItem danger onClick={() => act(j, 'CLOSED')}>Close job</MenuItem>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        !error && (
          <div className="wk-card">
            <Empty
              icon="briefcase"
              title={status === 'ALL' ? 'No jobs posted yet' : 'Nothing in this tab'}
              text="Post a job and verified workers nearby will start applying."
            >
              <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/employer/post-job">Post a Job</Link>
            </Empty>
          </div>
        )
      )}
    </>
  )
}

function MenuItem({ children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '9px 11px', borderRadius: 8, border: 0,
        background: 'transparent', font: 'inherit', fontSize: 14,
        cursor: 'pointer', color: danger ? '#b91c1c' : '#0f172a',
      }}
    >
      {children}
    </button>
  )
}
