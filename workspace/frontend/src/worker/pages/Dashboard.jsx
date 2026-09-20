import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { useAuth } from '../../context/AuthContext'
import { getDashboard, saveJob, unsaveJob, applyToJob, money } from '../api'
import { JobCard, Ring, Tile, Loading, Empty, ErrorNote } from '../components'

const DISMISS_KEY = 'sb_hide_profile_nudge'

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  useDocumentTitle('Dashboard')
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [applying, setApplying] = useState(null)
  const [hideNudge, setHideNudge] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')

  const load = () => {
    setError('')
    getDashboard().then(setData).catch(() => setError('We could not load your dashboard just now.'))
  }
  useEffect(load, [])

  const toggleSave = async (job) => {
    const next = !job.saved
    setData((d) => ({
      ...d,
      recommendedJobs: d.recommendedJobs.map((j) => (j.id === job.id ? { ...j, saved: next } : j)),
    }))
    try {
      await (next ? saveJob(job.id) : unsaveJob(job.id))
    } catch {
      setData((d) => ({
        ...d,
        recommendedJobs: d.recommendedJobs.map((j) => (j.id === job.id ? { ...j, saved: !next } : j)),
      }))
    }
  }

  const apply = async (job) => {
    setApplying(job.id)
    try {
      await applyToJob(job.id)
      setData((d) => ({
        ...d,
        applicationsCount: (d.applicationsCount || 0) + 1,
        recommendedJobs: d.recommendedJobs.map((j) => (j.id === job.id ? { ...j, applied: true } : j)),
      }))
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not apply to that job.')
    } finally {
      setApplying(null)
    }
  }

  const search = (e) => {
    e.preventDefault()
    navigate(`/worker/jobs${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`)
  }

  const dismiss = () => {
    setHideNudge(true)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  const name = data?.greetingName || user?.name || 'there'
  const completion = data?.profileCompletion ?? 0

  return (
    <>
      <div className="wk-greet">
        <div className="hi">{greeting()},</div>
        <h1>{name} <span aria-hidden="true">👋</span></h1>
        <p>Ready to find new opportunities?</p>
      </div>

      <form onSubmit={search} style={{ marginTop: 14 }}>
        <div className="wk-bar">
          <Icon name="search" size={17} style={{ color: '#64748b', flexShrink: 0 }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search jobs by title, company or location..."
            aria-label="Search jobs"
          />
        </div>
      </form>

      <div className="wk-bar" style={{ marginTop: 10 }}>
        <Icon name="pin" size={16} style={{ color: '#2563eb', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 14, color: 'var(--ink)' }}>
          {data?.locationLabel || 'Set your location'}
        </span>
        <Link className="act" to="/worker/profile">Change</Link>
      </div>

      {!hideNudge && completion < 100 && (
        <div className="wk-complete" style={{ marginTop: 14 }}>
          <button className="x" onClick={dismiss} aria-label="Dismiss"><Icon name="close" size={15} /></button>
          <Ring value={completion} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Complete your profile</div>
            <div style={{ fontSize: 13, color: 'var(--body)', marginTop: 2 }}>
              {data?.profileCompletionHint || 'Get more job matches'}
            </div>
            <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/worker/profile" style={{ marginTop: 10 }}>
              Continue
            </Link>
          </div>
        </div>
      )}

      <div className="wk-tiles" style={{ marginTop: 14 }}>
        <Tile tone="green" icon="briefcase" value={data?.jobsNearYou ?? '—'} label="Jobs near you" />
        <Tile tone="blue" icon="doc" value={data?.applicationsCount ?? '—'} label="Applications" />
        <Tile tone="amber" icon="calendar" value={data?.interviewsCount ?? '—'} label="Interviews" />
        <Tile tone="violet" icon="wallet" value={data ? money(data.earnings) : '—'} label="Earnings" />
      </div>

      <div className="wk-section-head">
        <h2 className="wk-h2 grow">Recommended Jobs</h2>
        <Link className="wk-link" to="/worker/jobs">View All</Link>
      </div>

      <ErrorNote onRetry={load}>{error}</ErrorNote>

      {!data && !error ? (
        <Loading rows={2} />
      ) : data?.recommendedJobs?.length ? (
        <div className="wk-list">
          {data.recommendedJobs.map((j) => (
            <JobCard key={j.id} job={j} onToggleSave={toggleSave} onApply={apply} applying={applying} />
          ))}
        </div>
      ) : (
        !error && (
          <div className="wk-card">
            <Empty
              icon="search"
              title="No matches yet"
              text="Add your skills and set your location so we can match you with jobs nearby."
            >
              <Link className="mk-btn mk-btn-primary mk-btn-sm" to="/worker/profile">Complete profile</Link>
            </Empty>
          </div>
        )
      )}
    </>
  )
}
