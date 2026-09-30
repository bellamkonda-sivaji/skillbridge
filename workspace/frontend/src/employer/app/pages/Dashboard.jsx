import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { Avatar, useDocumentTitle } from '../../../marketing/components'
import { Tile, Loading, Empty, ErrorNote, StatusBadge } from '../../../worker/components'
import { getDashboard, getDemandAlerts, timeAgo, km, APPLICANT_STATUS_LABEL, APPLICANT_STATUS_TONE } from '../api'
import { DemandAdvice } from '../pricing'

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function EmployerDashboard() {
  useDocumentTitle('Employer dashboard')
  const [data, setData] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState('')

  const load = () => {
    setError('')
    getDashboard().then(setData).catch(() => setError('We could not load your dashboard just now.'))
  }
  useEffect(load, [])

  // The jobs that are not going to fill by themselves. These come first, above the counters:
  // a dashboard that leads with totals hides the one thing the employer needs to act on.
  useEffect(() => {
    getDemandAlerts().then((d) => setAlerts(Array.isArray(d) ? d : [])).catch(() => setAlerts([]))
  }, [])

  const firstName = (data?.greetingName || '').split(' ')[0] || 'there'

  return (
    <>
      <div className="wk-greet">
        <div className="wk-row" style={{ alignItems: 'flex-start' }}>
          <div className="grow">
            <div className="hi">{greeting()},</div>
            <h1>{firstName} <span aria-hidden="true">👋</span></h1>
            <p>Let’s build your team today.</p>
          </div>
          <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/employer/post-job">
            <Icon name="sparkles" size={15} /> Post a Job
          </Link>
        </div>
      </div>

      {alerts.length > 0 && (
        <div style={{ marginTop: 14 }}>
          {alerts.slice(0, 3).map((a) => (
            <Link key={a.jobId} to={`/employer/jobs/${a.jobId}`} style={{ textDecoration: 'none', display: 'block' }}>
              <DemandAdvice demand={a} compact />
            </Link>
          ))}
        </div>
      )}

      <div className="wk-tiles" style={{ marginTop: 14 }}>
        <Tile tone="blue" icon="briefcase" value={data?.activeJobs ?? '—'} label="Active Jobs" />
        <Tile tone="green" icon="doc" value={data?.applications ?? '—'} label="Applications" />
        <Tile tone="amber" icon="calendar" value={data?.interviewsThisWeek ?? '—'} label="Interviews This Week" />
        <Tile tone="violet" icon="users" value={data?.workersHired ?? '—'} label="Workers Hired" />
      </div>

      <div className="wk-section-head">
        <h2 className="wk-h2 grow">Recent Applications</h2>
        <Link className="wk-link" to="/employer/applications">View All</Link>
      </div>

      <ErrorNote onRetry={load}>{error}</ErrorNote>

      {!data && !error ? (
        <Loading rows={3} />
      ) : data?.recentApplications?.length ? (
        <div className="wk-list">
          {data.recentApplications.map((a) => (
            <Link
              className="wk-card"
              key={a.applicationId || a.workerId}
              to={a.workerId ? `/employer/workers/${a.workerId}` : '/employer/applications'}
              style={{ display: 'block' }}
            >
              <div className="emp-app-row">
                <Avatar name={a.name || 'Applicant'} size={42} />
                <span className="meta">
                  <span className="nm" style={{ display: 'block' }}>{a.name}</span>
                  <span className="sb" style={{ display: 'block' }}>
                    {[a.jobTitle, km(a.distanceKm)].filter(Boolean).join(' · ')}
                  </span>
                  <span className="sb">Applied {timeAgo(a.appliedAt)}</span>
                </span>
                {a.isNew && a.status === 'APPLIED' ? (
                  <span className="wk-badge viewed">New</span>
                ) : (
                  <span className={`wk-badge ${APPLICANT_STATUS_TONE[a.status] || 'viewed'}`}>
                    {APPLICANT_STATUS_LABEL[a.status] || a.status}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        !error && (
          <div className="wk-card">
            <Empty
              icon="doc"
              title="No applications yet"
              text="Post a job and verified workers nearby will start applying."
            >
              <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/employer/post-job">Post a Job</Link>
            </Empty>
          </div>
        )
      )}

      <div className="wk-card pad-lg" style={{ marginTop: 18, background: 'linear-gradient(120deg,#eff6ff,#dbeafe)', borderColor: 'var(--blue-100)' }}>
        <div className="wk-row" style={{ alignItems: 'flex-start', gap: 16 }}>
          <div className="grow">
            <h3 className="wk-h2" style={{ fontSize: 18 }}>Find the right people, faster</h3>
            <p className="wk-sub">Post a job and get matched with verified workers near your business.</p>
            <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/employer/post-job" style={{ marginTop: 14 }}>
              Post a Job
            </Link>
          </div>
          <span
            className="mk-icon-box"
            style={{ width: 64, height: 64, background: '#fff', color: 'var(--blue)', marginBottom: 0, flexShrink: 0 }}
            aria-hidden="true"
          >
            <Icon name="users" size={30} />
          </span>
        </div>
      </div>
    </>
  )
}
