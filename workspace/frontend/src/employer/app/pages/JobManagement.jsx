import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { useDocumentTitle } from '../../../marketing/components'
import { JobArt, Loading, ErrorNote, SegTabs, Tile, Empty } from '../../../worker/components'
import {
  getJob, setJobStatus, getApplicants, pay, timeLabel, formatDate,
  JOB_STATUS_LABEL, JOB_STATUS_TONE, EMPLOYMENT_LABEL,
} from '../api'
import { DAYS } from '../engagement'

export default function JobManagement() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('overview')
  const [showFull, setShowFull] = useState(false)
  const [applicants, setApplicants] = useState(null)
  useDocumentTitle(job?.title || 'Job')

  const load = () => {
    setError('')
    getJob(jobId).then(setJob).catch(() => setError('We could not load this job.'))
  }
  useEffect(load, [jobId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab !== 'applications' || applicants) return
    getApplicants(jobId, 'ALL', 'MATCH')
      .then((d) => setApplicants(Array.isArray(d) ? d : []))
      .catch(() => setApplicants([]))
  }, [tab, jobId, applicants])

  const change = async (next) => {
    const before = job.status
    setJob((j) => ({ ...j, status: next }))
    try { await setJobStatus(jobId, next) } catch { setJob((j) => ({ ...j, status: before })) }
  }

  if (error && !job) return <ErrorNote onRetry={load}>{error}</ErrorNote>
  if (!job) return <Loading rows={2} />

  const live = job.status === 'OPEN' || job.status === 'ACTIVE'
  const days = (job.workingDays || []).map((d) => DAYS.find((x) => x.value === d)?.label).filter(Boolean)
  const description = job.description || ''
  const long = description.length > 180

  return (
    <>
      <Link className="wk-link" to="/employer/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
        <Icon name="chevronLeft" size={15} /> Back to My Jobs
      </Link>

      <div className="wk-card pad-lg">
        <div className="wk-job" style={{ alignItems: 'flex-start' }}>
          <JobArt job={job} size={72} radius={13} />
          <div className="meta" style={{ paddingRight: 0 }}>
            <div className="wk-row" style={{ alignItems: 'center', gap: 10 }}>
              <h1 className="wk-h1" style={{ fontSize: 20 }}>{job.title}</h1>
              <span className={`wk-badge ${JOB_STATUS_TONE[job.status] || 'viewed'}`}>
                {JOB_STATUS_LABEL[job.status] || job.status}
              </span>
            </div>
            <div className="biz">{job.businessName}</div>
            <div className="where">
              <Icon name="pin" size={12} />
              {[job.area, job.city].filter(Boolean).join(', ') || 'Location not set'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/worker/jobs/${job.id}`}>View</Link>
          <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/employer/post-job?edit=${job.id}`}>Edit</Link>
          {live ? (
            <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={() => change('PAUSED')}>Pause</button>
          ) : job.status === 'PAUSED' ? (
            <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={() => change('OPEN')}>Reopen</button>
          ) : null}
          {job.status !== 'CLOSED' && (
            <button
              className="mk-btn mk-btn-sm"
              style={{ background: '#fff', color: '#b91c1c', border: '1px solid #fecaca' }}
              onClick={() => change('CLOSED')}
            >
              Close
            </button>
          )}
        </div>

        <div style={{ marginTop: 20 }}>
          <SegTabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'overview', label: 'Overview' },
              { value: 'applications', label: 'Applications' },
              { value: 'insights', label: 'Insights' },
              { value: 'settings', label: 'Settings' },
            ]}
          />
        </div>

        {tab === 'overview' && (
          <div style={{ marginTop: 18 }}>
            <div className="wk-tiles">
              <Tile tone="blue" icon="doc" value={job.applicationsCount ?? 0} label="Applications" />
              <Tile tone="green" icon="eye" value={formatCount(job.jobViews)} label="Job Views" />
              <Tile tone="amber" icon="star" value={job.shortlistedCount ?? 0} label="Shortlisted" />
              <Tile tone="violet" icon="users" value={job.hiredCount ?? 0} label="Hired" />
            </div>

            <h2 className="wk-h2" style={{ marginTop: 24, marginBottom: 12 }}>Details</h2>
            <div className="emp-kv-grid">
              <KV k="Job Title" v={job.title} />
              <KV k="Employment Type" v={EMPLOYMENT_LABEL[job.employmentType] || '—'} />
              <KV k="Salary" v={job.salary > 0 ? pay(job.salary, job.salaryUnit) : '—'} />
              <KV k="Openings" v={job.workersNeeded ?? '—'} />
              <KV k="Working Days" v={days.length ? days.join(', ') : '—'} />
              {(job.shifts || []).length > 0 && (
                <KV k="Shift Timings" v={job.shifts.map((s, i) => (
                  <div key={i}>{timeLabel(s.startTime)} – {timeLabel(s.endTime)}</div>
                ))} />
              )}
              <KV k="Location" v={[job.area, job.city].filter(Boolean).join(', ') || '—'} />
              <KV k="Posted On" v={formatDate(job.postedAt) || '—'} />
              <KV k="Application Deadline" v={job.applicationDeadline ? formatDate(job.applicationDeadline) : 'No deadline'} />
            </div>

            {description && (
              <>
                <h2 className="wk-h2" style={{ marginTop: 24, marginBottom: 8 }}>Job Description</h2>
                <p style={{ fontSize: 14.5, color: 'var(--body)' }}>
                  {long && !showFull ? `${description.slice(0, 180)}…` : description}
                </p>
                {long && (
                  <button className="wk-link" style={{ border: 0, background: 0, padding: 0, marginTop: 8, cursor: 'pointer', font: 'inherit' }}
                    onClick={() => setShowFull((s) => !s)}>
                    {showFull ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </>
            )}

            {(job.responsibilities || []).length > 0 && (
              <>
                <h2 className="wk-h2" style={{ marginTop: 22, marginBottom: 8 }}>Key Responsibilities</h2>
                <ul className="wk-bullets">{job.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul>
              </>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 22 }}>
              <Link className="mk-btn mk-btn-primary mk-btn-sm" to={`/employer/jobs/${job.id}/applicants`}>
                View applicants
              </Link>
              <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/employer/jobs/${job.id}/recommended`}>
                Recommended workers
              </Link>
              <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/employer/jobs/${job.id}/shortlist`}>
                Shortlist
              </Link>
              <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/employer/jobs/${job.id}/interview-results`}>
                Results &amp; offers
              </Link>
            </div>
          </div>
        )}

        {tab === 'applications' && (
          <div style={{ marginTop: 18 }}>
            {!applicants ? <Loading rows={2} /> : applicants.length ? (
              <>
                <p className="wk-sub" style={{ marginBottom: 12 }}>
                  {applicants.length} {applicants.length === 1 ? 'application' : 'applications'}
                </p>
                <Link className="mk-btn mk-btn-primary mk-btn-sm" to={`/employer/jobs/${job.id}/applicants`}>
                  Manage applicants
                </Link>
              </>
            ) : (
              <Empty icon="doc" title="No applications yet" text="Workers matching this job will be notified automatically." />
            )}
          </div>
        )}

        {tab === 'insights' && (
          <div style={{ marginTop: 18 }}>
            <div className="wk-tiles">
              <Tile tone="green" icon="eye" value={formatCount(job.jobViews)} label="Job Views" />
              <Tile tone="blue" icon="doc" value={job.applicationsCount ?? 0} label="Applications" />
              <Tile tone="amber" icon="trending" value={conversion(job)} label="View → Apply" />
              <Tile tone="violet" icon="users" value={job.hiredCount ?? 0} label="Hired" />
            </div>
            <p className="wk-sub">
              Views count each time a worker opens this job. A low view-to-apply rate usually
              means the wage or the distance is putting people off.
            </p>
          </div>
        )}

        {tab === 'settings' && (
          <div style={{ marginTop: 18 }}>
            <div className="emp-kv-grid">
              <KV k="Auto-close when filled" v={job.autoCloseWhenFilled ? 'Yes' : 'No'} />
              <KV k="Interview type" v={job.interviewType || 'NONE'} />
              <KV k="Payment" v={job.paymentMode === 'CASH' ? 'Cash / Direct' : 'Through SkillBridge'} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
              <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/employer/post-job?edit=${job.id}`}>
                Edit these settings
              </Link>
              <button
                className="mk-btn mk-btn-sm"
                style={{ background: '#fff', color: '#b91c1c', border: '1px solid #fecaca' }}
                onClick={() => { change('CLOSED'); navigate('/employer/jobs') }}
              >
                Close this job
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

const formatCount = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n ?? 0))

function conversion(job) {
  const views = job.jobViews || 0
  const apps = job.applicationsCount || 0
  if (!views) return '—'
  return `${Math.round((apps / views) * 100)}%`
}

function KV({ k, v }) {
  return (
    <div className="r">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  )
}
