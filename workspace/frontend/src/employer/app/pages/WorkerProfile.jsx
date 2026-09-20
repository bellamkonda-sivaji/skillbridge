import React, { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { Avatar, useDocumentTitle } from '../../../marketing/components'
import { Stars, Verified, Loading, Empty, ErrorNote, SegTabs } from '../../../worker/components'
import { getWorker, decideApplication, inviteWorker, km, money, pay, formatDate } from '../api'

const TABS = [
  { value: 'profile', label: 'Profile' },
  { value: 'experience', label: 'Experience' },
  { value: 'skills', label: 'Skills' },
  { value: 'availability', label: 'Availability' },
  { value: 'reviews', label: 'Reviews' },
]

const titleCase = (s) => (s ? String(s)[0].toUpperCase() + String(s).slice(1).toLowerCase() : '')

const yrs = (n) => `${n} yr${n === 1 ? '' : 's'}`

function matchClass(score) {
  if (score == null) return 'emp-match'
  if (score < 50) return 'emp-match low'
  if (score < 70) return 'emp-match mid'
  return 'emp-match'
}

function salaryRange(w) {
  if (w.expectedSalaryMin != null && w.expectedSalaryMax != null) {
    return `${money(w.expectedSalaryMin)} – ${money(w.expectedSalaryMax)}`
  }
  if (w.expectedSalary != null) return pay(w.expectedSalary, w.salaryUnit)
  return '—'
}

function Row({ k, v }) {
  return (
    <div className="r">
      <span className="k">{k}</span>
      <span className="v">{v || '—'}</span>
    </div>
  )
}

export default function WorkerProfile() {
  const { workerId } = useParams()
  const [params] = useSearchParams()
  const jobId = params.get('jobId') || ''

  const [w, setW] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('profile')
  const [menu, setMenu] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState('')
  useDocumentTitle(w?.name || 'Worker profile')

  const load = () => {
    setW(null); setError('')
    getWorker(workerId, jobId || undefined)
      .then(setW)
      .catch(() => setError('We could not load this worker profile.'))
  }
  useEffect(load, [workerId, jobId]) // eslint-disable-line react-hooks/exhaustive-deps

  const act = (promise, label) => {
    setBusy(true); setDone('')
    promise
      .then(() => setDone(label))
      .catch(() => setError('That action did not go through. Please try again.'))
      .finally(() => setBusy(false))
  }

  const shortlist = () => {
    if (!w) return
    if (w.applicationId) act(decideApplication(w.applicationId, { status: 'SHORTLISTED' }), 'Shortlisted')
    else if (jobId) act(inviteWorker(jobId, w.workerId || workerId), 'Invited to apply')
  }

  const decide = (status, label) => {
    setMenu(false)
    if (!w?.applicationId) return
    act(decideApplication(w.applicationId, { status }), label)
  }

  const backTo = jobId ? `/employer/jobs/${jobId}/applicants` : '/employer/find-workers'

  if (error && !w) return <ErrorNote onRetry={load}>{error}</ErrorNote>
  if (!w) return <Loading rows={2} />

  const meta = [
    titleCase(w.gender),
    w.age != null ? `${w.age} years` : null,
    km(w.distanceKm),
    [w.area, w.city].filter(Boolean).join(', ') || null,
  ].filter(Boolean).join(' · ')

  const experience = Array.isArray(w.workExperience) ? w.workExperience : []
  const skills = Array.isArray(w.skills) ? w.skills : []
  const languages = Array.isArray(w.languages) ? w.languages : []
  const reviews = Array.isArray(w.reviews) ? w.reviews : []

  return (
    <>
      <Link className="wk-link" to={backTo} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
        <Icon name="chevronLeft" size={15} /> Back to applicants
      </Link>

      <ErrorNote onRetry={load}>{error}</ErrorNote>

      <div className="wk-card pad-lg">
        <div className="wk-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Avatar name={w.name || '?'} size={68} />
          <div className="grow">
            <h1 className="wk-h1">{w.name || 'Worker'}</h1>
            {w.jobTitle && <p className="wk-sub">{w.jobTitle}</p>}
            <div className="wk-row" style={{ gap: 8, marginTop: 9, flexWrap: 'wrap' }}>
              {w.matchScore != null && (
                <span className={matchClass(w.matchScore)}>{Math.round(w.matchScore)}% match</span>
              )}
              {(w.verified || w.idVerified) && <Verified label="Verified" />}
            </div>
            {meta && <div className="wk-sub" style={{ marginTop: 8 }}>{meta}</div>}
          </div>
        </div>

        <div className="wk-row" style={{ gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <button
            className="mk-btn mk-btn-primary mk-btn-sm"
            onClick={shortlist}
            disabled={busy || (!w.applicationId && !jobId)}
          >
            {w.applicationId ? 'Shortlist' : 'Invite to apply'}
          </button>
          <Link
            className="mk-btn mk-btn-outline mk-btn-sm"
            to={`/employer/interviews/schedule?workerId=${w.workerId || workerId}&jobId=${jobId}${w.applicationId ? `&applicationId=${w.applicationId}` : ''}`}
          >
            Schedule Interview
          </Link>

          <div style={{ position: 'relative' }}>
            <button
              className="emp-menu-btn"
              aria-label="More actions"
              aria-expanded={menu}
              onClick={() => setMenu((m) => !m)}
            >
              <Icon name="menu" size={16} />
            </button>
            {menu && (
              <>
                <button
                  aria-label="Close menu"
                  onClick={() => setMenu(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 55, border: 0, background: 'transparent', cursor: 'default' }}
                />
                <div
                  className="wk-card"
                  style={{ position: 'absolute', left: 0, top: 36, width: 180, padding: 6, zIndex: 60, boxShadow: 'var(--shadow-lg)' }}
                >
                  <button
                    className="mk-btn mk-btn-ghost mk-btn-sm mk-btn-block"
                    style={{ justifyContent: 'flex-start' }}
                    onClick={() => decide('OFFERED', 'Offer sent')}
                    disabled={!w.applicationId}
                  >
                    Send offer
                  </button>
                  <button
                    className="mk-btn mk-btn-ghost mk-btn-sm mk-btn-block"
                    style={{ justifyContent: 'flex-start', color: '#b91c1c' }}
                    onClick={() => decide('REJECTED', 'Rejected')}
                    disabled={!w.applicationId}
                  >
                    Reject
                  </button>
                </div>
              </>
            )}
          </div>

          {done && <span className="wk-badge shortlisted">{done}</span>}
        </div>

        <div style={{ marginTop: 20 }}>
          <SegTabs tabs={TABS} value={tab} onChange={setTab} />
        </div>

        {tab === 'profile' && (
          <div style={{ marginTop: 18 }}>
            <h2 className="wk-h2">About</h2>
            <p style={{ fontSize: 14.5, color: 'var(--body)', marginTop: 8 }}>
              {w.about || 'This worker has not added a description yet.'}
            </p>

            <div className="emp-kv-grid" style={{ marginTop: 18 }}>
              <Row
                k="Work Experience"
                v={
                  (w.totalExperienceYears ?? w.experienceYears) != null
                    ? `${yrs(w.totalExperienceYears ?? w.experienceYears)} total`
                    : ''
                }
              />
              <div className="r">
                <span className="k">Skills</span>
                <span className="v">
                  {skills.length ? (
                    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {skills.map((s) => <span className="mk-tag" key={s}>{s}</span>)}
                    </span>
                  ) : '—'}
                </span>
              </div>
              <Row k="Languages" v={languages.join(', ')} />
              <Row k="Availability" v={w.availabilityLabel || w.availability} />
              <Row k="Expected Salary" v={salaryRange(w)} />
              <Row
                k="ID Verification"
                v={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {w.idVerified && <Icon name="checkCircle" size={14} style={{ color: '#047857' }} />}
                    {w.idVerificationLabel || (w.idVerified ? 'Verified' : 'Not verified')}
                  </span>
                }
              />
            </div>
          </div>
        )}

        {tab === 'experience' && (
          <div style={{ marginTop: 18 }}>
            {experience.length ? (
              <div className="wk-list">
                {experience.map((x, i) => (
                  <div className="wk-card" key={`${x.role}-${i}`}>
                    <div className="emp-app-row">
                      <span
                        aria-hidden="true"
                        style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: 'var(--soft)', color: 'var(--body)',
                          display: 'grid', placeItems: 'center',
                        }}
                      >
                        <Icon name="briefcase" size={15} />
                      </span>
                      <div className="meta">
                        <div className="nm">{x.role}</div>
                        <div className="sb">{[x.employer, x.years ? yrs(x.years) : null].filter(Boolean).join(' · ')}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty icon="briefcase" title="No work history added" text="This worker has not listed past jobs yet." />
            )}
          </div>
        )}

        {tab === 'skills' && (
          <div style={{ marginTop: 18 }}>
            {skills.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {skills.map((s) => <span className="mk-tag" key={s}>{s}</span>)}
              </div>
            ) : (
              <Empty icon="target" title="No skills listed" text="This worker has not added skills yet." />
            )}
          </div>
        )}

        {tab === 'availability' && (
          <div className="emp-kv-grid" style={{ marginTop: 18 }}>
            <Row k="Available from" v={w.availabilityLabel || w.availability} />
            <Row k="Expected Salary" v={salaryRange(w)} />
            <Row k="Distance" v={km(w.distanceKm)} />
          </div>
        )}

        {tab === 'reviews' && (
          <div style={{ marginTop: 18 }}>
            {w.ratingCount > 0 && (
              <div className="wk-row" style={{ gap: 9, marginBottom: 14 }}>
                <Stars rating={w.rating || 0} />
                <span className="wk-sub" style={{ marginTop: 0 }}>
                  {Number(w.rating || 0).toFixed(1)} ({w.ratingCount} reviews)
                </span>
              </div>
            )}
            {reviews.length ? (
              <div className="wk-list">
                {reviews.map((r, i) => (
                  <div className="wk-card" key={`${r.author}-${i}`}>
                    <div className="wk-row" style={{ flexWrap: 'wrap' }}>
                      <span className="grow" style={{ fontSize: 14, fontWeight: 700 }}>{r.author}</span>
                      <Stars rating={r.rating || 0} />
                    </div>
                    {r.comment && (
                      <p style={{ fontSize: 13.5, color: 'var(--body)', marginTop: 8 }}>{r.comment}</p>
                    )}
                    {r.createdAt && <div className="wk-sub">{formatDate(r.createdAt)}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <Empty icon="star" title="No reviews yet" text="Reviews appear once this worker completes jobs." />
            )}
          </div>
        )}
      </div>
    </>
  )
}
