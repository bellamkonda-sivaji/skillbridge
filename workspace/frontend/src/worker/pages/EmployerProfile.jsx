import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { getEmployer, getEmployerJobs, getUserReviews, formatDate } from '../api'
import { JobCard, Stars, Verified, Loading, Empty, ErrorNote, SegTabs } from '../components'
import { jobArt } from '../api'

const PHOTO_TONES = ['#2563eb', '#0f766e', '#b45309', '#6d28d9', '#be123c', '#0369a1']

export default function EmployerProfile() {
  const { id } = useParams()
  const [emp, setEmp] = useState(null)
  const [jobs, setJobs] = useState([])
  const [reviews, setReviews] = useState([])
  const [tab, setTab] = useState('about')
  const [error, setError] = useState('')
  useDocumentTitle(emp?.businessName || 'Employer')

  const load = () => {
    setError('')
    getEmployer(id).then(setEmp).catch(() => setError('We could not load this business profile.'))
    getEmployerJobs(id).then((d) => setJobs(Array.isArray(d) ? d : [])).catch(() => setJobs([]))
    getUserReviews('EMPLOYER', id).then((d) => setReviews(Array.isArray(d) ? d : [])).catch(() => setReviews([]))
  }
  useEffect(load, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error && !emp) return <ErrorNote onRetry={load}>{error}</ErrorNote>
  if (!emp) return <Loading rows={2} />

  const art = jobArt({ title: emp.businessName, businessName: emp.businessType })

  return (
    <>
      <Link className="wk-link" to="/worker/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
        <Icon name="chevronLeft" size={15} /> Back
      </Link>

      <div className="wk-card pad-lg">
        <div className="wk-emp-head">
          <span className="logo" style={{ background: art.bg, color: art.fg }} aria-hidden="true">
            <Icon name={art.icon} size={32} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="wk-h1">{emp.businessName}</h1>
            <p className="wk-sub">{emp.businessType || 'Local business'}</p>
            <div className="wk-row" style={{ marginTop: 9, flexWrap: 'wrap', gap: 10 }}>
              {emp.ratingCount > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Stars rating={emp.avgRating} />
                  <span className="wk-sub" style={{ marginTop: 0 }}>
                    {emp.avgRating?.toFixed(1)} ({emp.ratingCount} reviews)
                  </span>
                </span>
              )}
              {emp.verified && <Verified />}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <SegTabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'about', label: 'About' },
              { value: 'reviews', label: `Reviews${reviews.length ? ` (${reviews.length})` : ''}` },
              { value: 'jobs', label: `Jobs${jobs.length ? ` (${jobs.length})` : ''}` },
            ]}
          />
        </div>

        {tab === 'about' && (
          <div style={{ marginTop: 18 }}>
            <h2 className="wk-h2">About Us</h2>
            <p style={{ fontSize: 14.5, color: 'var(--body)', marginTop: 8 }}>
              {emp.description || `${emp.businessName} is a local business hiring through SkillBridge.`}
            </p>

            <div className="wk-kvlist">
              <Row icon="store" k="Business Type" v={emp.businessType || '—'} />
              <Row icon="pin" k="Location" v={[emp.area, emp.city].filter(Boolean).join(', ') || '—'} />
              {emp.founded && <Row icon="calendar" k="Founded" v={emp.founded} />}
              {emp.teamSize && <Row icon="users" k="Team Size" v={emp.teamSize} />}
              {emp.website && (
                <Row icon="globe" k="Website" v={<a href={emp.website} target="_blank" rel="noreferrer">{emp.website}</a>} />
              )}
            </div>

            <h2 className="wk-h2" style={{ marginTop: 24 }}>Photos</h2>
            {emp.photos?.length ? (
              <div className="wk-photos">
                {emp.photos.slice(0, 6).map((src, i) => (
                  <img className="wk-photo" key={i} src={src} alt="" style={{ objectFit: 'cover' }} />
                ))}
              </div>
            ) : (
              <div className="wk-photos">
                {[0, 1, 2].map((i) => (
                  <div className="wk-photo" key={i} style={{ background: PHOTO_TONES[i] + '22', color: PHOTO_TONES[i] }}>
                    <Icon name="store" size={22} />
                  </div>
                ))}
              </div>
            )}
            {!emp.photos?.length && (
              <p className="wk-sub">This business has not added photos yet.</p>
            )}

            {jobs.length > 0 && (
              <Link className="mk-btn mk-btn-primary" style={{ width: '100%', marginTop: 20 }} to="#jobs" onClick={(e) => { e.preventDefault(); setTab('jobs') }}>
                View All Jobs ({jobs.length})
              </Link>
            )}
          </div>
        )}

        {tab === 'reviews' && (
          <div style={{ marginTop: 18 }}>
            {reviews.length ? (
              <div className="wk-list">
                {reviews.map((r) => (
                  <div className="wk-card" key={r.id}>
                    <div className="wk-row">
                      <div className="grow">
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                          {r.authorName || 'Worker'}
                        </div>
                        <Stars rating={r.rating} />
                      </div>
                      <span className="wk-sub" style={{ marginTop: 0 }}>{formatDate(r.createdAt)}</span>
                    </div>
                    {r.comment && <p style={{ fontSize: 14, color: 'var(--body)', marginTop: 8 }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <Empty icon="star" title="No reviews yet" text="Workers who complete a job here can leave a review." />
            )}
          </div>
        )}

        {tab === 'jobs' && (
          <div style={{ marginTop: 18 }}>
            {jobs.length ? (
              <div className="wk-list">
                {jobs.map((j) => <JobCard key={j.id} job={j} compact />)}
              </div>
            ) : (
              <Empty icon="briefcase" title="No open jobs" text="This business has no open positions right now." />
            )}
          </div>
        )}
      </div>
    </>
  )
}

function Row({ icon, k, v }) {
  return (
    <div className="r">
      <span className="ic"><Icon name={icon} size={14} /></span>
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  )
}
