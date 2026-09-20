import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../marketing/icons'
import {
  jobArt, pay, distance, EMPLOYMENT_LABEL, STATUS_LABEL, STATUS_TONE,
} from './api'
import './worker.css'

/* ---------- small pieces ---------- */

export function Stars({ rating = 0 }) {
  const full = Math.round(rating)
  return (
    <span className="wk-stars" aria-label={`${rating} out of 5`}>
      {'★'.repeat(full)}<span style={{ color: '#e2e8f0' }}>{'★'.repeat(5 - full)}</span>
    </span>
  )
}

export function Verified({ label = 'Verified Business' }) {
  return (
    <span className="wk-verified">
      <Icon name="check" size={12} strokeWidth={3} /> {label}
    </span>
  )
}

export function StatusBadge({ status }) {
  return (
    <span className={`wk-badge ${STATUS_TONE[status] || 'pending'}`}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

export function JobArt({ job, size = 62, radius = 11 }) {
  const { bg, fg, icon } = jobArt(job)
  return (
    <span
      className="thumb"
      style={{ background: bg, color: fg, width: size, height: size, borderRadius: radius }}
      aria-hidden="true"
    >
      <Icon name={icon} size={Math.round(size * 0.42)} />
    </span>
  )
}

export function Empty({ icon = 'search', title, text, children }) {
  return (
    <div className="wk-empty">
      <div className="ic"><Icon name={icon} size={22} /></div>
      <div className="t">{title}</div>
      {text && <div className="d">{text}</div>}
      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  )
}

export function Loading({ rows = 3 }) {
  return (
    <div className="wk-list" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div className="wk-card" key={i}>
          <div className="wk-job">
            <div className="wk-skel" style={{ width: 62, height: 62, borderRadius: 11 }} />
            <div style={{ flex: 1 }}>
              <div className="wk-skel" style={{ height: 14, width: '45%' }} />
              <div className="wk-skel" style={{ height: 12, width: '30%', marginTop: 8 }} />
              <div className="wk-skel" style={{ height: 12, width: '60%', marginTop: 12 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ErrorNote({ children, onRetry }) {
  if (!children) return null
  return (
    <div className="wk-card" style={{ borderColor: '#fecaca', background: '#fef2f2', color: '#b91c1c' }}>
      <div style={{ fontSize: 14 }}>{children}</div>
      {onRetry && (
        <button className="mk-btn mk-btn-outline mk-btn-sm" style={{ marginTop: 10 }} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

/* ---------- progress ring ---------- */

export function Ring({ value = 0, size = 62 }) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="wk-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#bfdbfe" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="#2563eb" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(100, Math.max(0, value)) / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="pct">{Math.round(value)}%</span>
    </div>
  )
}

/* ---------- stat tile ---------- */

export function Tile({ tone = 'blue', icon, value, label }) {
  return (
    <div className={`wk-tile ${tone}`}>
      <span className="ic"><Icon name={icon} size={16} /></span>
      <span className="n">{value}</span>
      <span className="l">{label}</span>
    </div>
  )
}

/* ---------- job card ---------- */

export function JobCard({ job, onToggleSave, onApply, applying, compact }) {
  const dist = distance(job.distanceKm)
  const navigate = useNavigate()
  const openDetails = (e) => {
    if (e.target.closest('a, button')) return
    navigate(`/worker/jobs/${job.id}`)
  }
  return (
    <div className="wk-card wk-jobcard" onClick={openDetails}>
      <div className="wk-job">
        <JobArt job={job} />

        <div className="meta">
          <Link to={`/worker/jobs/${job.id}`} className="ttl" style={{ color: 'inherit', display: 'block' }}>
            {job.title}
          </Link>
          <div className="biz">{job.businessName}</div>
          <div className="where">
            {dist && <><Icon name="pin" size={12} />{dist}</>}
            {dist && job.city && <span>·</span>}
            {job.city && <span>{job.area ? `${job.area}, ${job.city}` : job.city}</span>}
          </div>
          <div className="chips">
            <span className="wk-pay">{pay(job.salary, job.salaryUnit)}</span>
            <span className="wk-chip">
              {EMPLOYMENT_LABEL[job.employmentType || job.workType] || job.workType}
            </span>
            {job.urgent && <span className="wk-chip urgent">Urgent</span>}
            {!compact && job.matchScore != null && (
              <span className="wk-chip match">{Math.round(job.matchScore)}% match</span>
            )}
          </div>
        </div>

        <div className="act">
          {job.applied ? (
            <Link className="mk-btn mk-btn-outline mk-btn-sm" to="/worker/applications">Applied</Link>
          ) : onApply ? (
            <button
              className="mk-btn mk-btn-primary mk-btn-sm"
              onClick={() => onApply(job)}
              disabled={applying === job.id}
            >
              {applying === job.id ? '…' : 'Apply'}
            </button>
          ) : (
            <Link className="mk-btn mk-btn-primary mk-btn-sm" to={`/worker/jobs/${job.id}`}>View</Link>
          )}
        </div>

        {onToggleSave && (
          <button
            className={`wk-save${job.saved ? ' on' : ''}`}
            onClick={() => onToggleSave(job)}
            aria-pressed={!!job.saved}
            aria-label={job.saved ? 'Remove from saved jobs' : 'Save this job'}
            title={job.saved ? 'Saved' : 'Save job'}
          >
            <Bookmark filled={job.saved} />
          </button>
        )}
      </div>
    </div>
  )
}

export function Bookmark({ filled, size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.5 3.5h11v17l-5.5-4-5.5 4z" />
    </svg>
  )
}

/* ---------- pill tabs ---------- */

export function PillTabs({ tabs, value, onChange }) {
  return (
    <div className="wk-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          className="wk-tab"
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
        >
          {t.label}{t.count != null ? ` (${t.count})` : ''}
        </button>
      ))}
    </div>
  )
}

export function SegTabs({ tabs, value, onChange }) {
  return (
    <div className="wk-seg" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function PageHead({ title, sub, back, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {back && (
        <Link to={back.to} className="wk-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
          <Icon name="chevronLeft" size={15} /> {back.label}
        </Link>
      )}
      <div className="wk-row">
        <div className="grow">
          <h1 className="wk-h1">{title}</h1>
          {sub && <p className="wk-sub">{sub}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}
