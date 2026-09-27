import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { Avatar, useDocumentTitle } from '../../../marketing/components'
import { Stars, Loading, Empty, ErrorNote } from '../../../worker/components'
import { WhenBanner, DataTable, RatingBars } from '../hiring'
import {
  getWorker, getWorkHistory, decideApplication, inviteWorker,
  km, money, pay, formatDate, durationLabel,
} from '../api'

const titleCase = (s) =>
  s ? String(s).replace(/_/g, ' ').replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()) : ''

const yrs = (n) => (n == null ? null : `${n} year${n === 1 ? '' : 's'}`)

const DOC_TONE = { VERIFIED: '', PENDING: 'amber', NOT_UPLOADED: 'grey' }
const DOC_TEXT = { VERIFIED: 'Verified', PENDING: 'Pending', NOT_UPLOADED: 'Not uploaded' }

function Row({ k, v }) {
  return (
    <div className="r">
      <span className="k">{k}</span>
      <span className="v">{v == null || v === '' ? '—' : v}</span>
    </div>
  )
}

function Section({ title, extra, children }) {
  return (
    <div className="wk-card pad-lg emp-sec">
      <div className="emp-sec-head">
        <h2 className="wk-h2 grow" style={{ margin: 0 }}>{title}</h2>
        {extra}
      </div>
      {children}
    </div>
  )
}

/**
 * Worker Detail.
 *
 * This is the screen an employer reaches by tapping a candidate in the
 * applicants list, so it has to answer one question: should I hire this person?
 * That means the past work matters as much as the profile — where they worked,
 * for how many days, what they were paid, and what those employers said.
 */
export default function WorkerProfile() {
  const { workerId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const jobId = params.get('jobId') || ''

  const [w, setW] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState('')
  const [allHistory, setAllHistory] = useState(null)
  useDocumentTitle(w?.name || 'Worker profile')

  const load = () => {
    setW(null); setError(''); setAllHistory(null)
    getWorker(workerId, jobId || undefined)
      .then(setW)
      .catch(() => setError('We could not load this worker profile.'))
  }
  useEffect(load, [workerId, jobId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error && !w) return <ErrorNote onRetry={load}>{error}</ErrorNote>
  if (!w) return <Loading rows={3} />

  const act = (promise, label) => {
    setBusy(true); setDone('')
    promise
      .then(() => setDone(label))
      .catch(() => setError('That action did not go through. Please try again.'))
      .finally(() => setBusy(false))
  }

  const shortlist = () => {
    if (w.applicationId) act(decideApplication(w.applicationId, { status: 'SHORTLISTED' }), 'Shortlisted')
    else if (jobId) act(inviteWorker(jobId, w.workerId || workerId), 'Invited to apply')
  }

  const select = () => {
    if (!w.applicationId) return
    navigate(`/employer/applications/${w.applicationId}/offer`)
  }

  const showAllHistory = () => {
    getWorkHistory(w.workerId || workerId)
      .then((d) => setAllHistory(Array.isArray(d) ? d : []))
      .catch(() => setError('We could not load the full work history.'))
  }

  const skills = w.skills || []
  const matchedSkills = new Set(w.matchedSkills || [])
  const languages = w.languages || []
  const reviews = w.reviews || []
  const documents = w.documents || []
  const photos = w.photos || []
  const history = allHistory || w.workHistory || []
  const total = w.workHistoryCount ?? history.length
  const backTo = jobId ? `/employer/jobs/${jobId}/applicants` : '/employer/find-workers'

  return (
    <>
      <Link className="wk-link" to={backTo} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
        <Icon name="chevronLeft" size={15} /> Back to applicants
      </Link>

      <WhenBanner id="worker-detail">
        This screen appears when you tap a candidate in the applicants list, to see their full details —
        past work, pay and ratings — before shortlisting or selecting them.
      </WhenBanner>

      <ErrorNote>{error}</ErrorNote>

      {/* ---------- header ---------- */}
      <div className="wk-card pad-lg">
        <div className="emp-wd-head">
          {w.photoUrl
            ? <img src={w.photoUrl} alt="" style={{ width: 84, height: 84, borderRadius: 16, objectFit: 'cover', border: '1px solid var(--line)' }} />
            : <Avatar name={w.name || '?'} size={84} />}

          <div className="grow">
            <h1 className="wk-h1" style={{ marginBottom: 2 }}>{w.name || 'Worker'}</h1>
            {w.jobTitle && <p className="wk-sub" style={{ marginTop: 0 }}>{w.jobTitle}</p>}

            <div className="wk-row" style={{ gap: 9, marginTop: 8, flexWrap: 'wrap' }}>
              <Stars rating={w.rating || 0} />
              <span className="wk-sub" style={{ marginTop: 0 }}>
                {Number(w.rating || 0).toFixed(1)}
                {w.ratingCount ? ` · ${w.ratingCount} review${w.ratingCount === 1 ? '' : 's'}` : ' · no reviews yet'}
              </span>
            </div>

            <div className="emp-badges">
              {w.availabilityLabel && <span className="emp-badge">{w.availabilityLabel}</span>}
              {w.distanceKm != null && <span className="emp-badge blue">{km(w.distanceKm)} away</span>}
              {w.canTravelKm != null && <span className="emp-badge grey">Can travel up to {w.canTravelKm} km</span>}
              {w.idVerified && (
                <span className="emp-badge"><Icon name="checkCircle" size={12} /> ID Verified</span>
              )}
              {w.profileComplete && (
                <span className="emp-badge blue"><Icon name="check" size={12} /> Profile Complete</span>
              )}
              {w.reliable && (
                <span className="emp-badge amber"><Icon name="star" size={12} /> Reliable</span>
              )}
            </div>
          </div>

          {w.matchScore != null && (
            <span className={`emp-match${w.matchScore < 50 ? ' low' : w.matchScore < 70 ? ' mid' : ''}`}>
              {Math.round(w.matchScore)}% match
            </span>
          )}
        </div>

        <div className="emp-actionbar">
          {w.phone && (
            <a className="mk-btn mk-btn-outline mk-btn-sm" href={`tel:+91${w.phone}`}>
              <Icon name="phone" size={14} /> Call
            </a>
          )}
          <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/chat?workerId=${w.workerId || workerId}`}>
            <Icon name="chat" size={14} /> Message
          </Link>
          <button
            className="mk-btn mk-btn-outline mk-btn-sm"
            onClick={shortlist}
            disabled={busy || (!w.applicationId && !jobId)}
          >
            <Icon name="heart" size={14} /> {w.applicationId ? 'Shortlist' : 'Invite to apply'}
          </button>
          <button className="mk-btn mk-btn-primary mk-btn-sm" onClick={select} disabled={!w.applicationId}>
            Select This Worker
          </button>
          {done && <span className="wk-badge shortlisted">{done}</span>}
          <span className="hint">You can send a work offer in the next step.</span>
        </div>
      </div>

      {/* ---------- about ---------- */}
      <Section title="About">
        {w.about && (
          <p style={{ fontSize: 14.5, color: 'var(--body)', marginBottom: 16 }}>{w.about}</p>
        )}
        <div className="emp-kv-grid">
          <Row k="Age" v={w.age != null ? `${w.age} years` : null} />
          <Row k="Total Work Experience" v={yrs(w.totalExperienceYears ?? w.experienceYears)} />
          <Row k="Languages" v={languages.join(', ')} />
          <Row k="Lives in" v={w.livesIn || [w.area, w.city].filter(Boolean).join(', ')} />
          <Row k="Can Travel" v={w.canTravelKm != null ? `Up to ${w.canTravelKm} km` : null} />
          <Row k="Available From" v={w.availableFrom ? formatDate(w.availableFrom) : null} />
        </div>
      </Section>

      {/* ---------- skills ---------- */}
      <Section title="Skills">
        {skills.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {skills.map((s) => (
              <span key={s} className="mk-tag" style={matchedSkills.has(s) ? { borderColor: '#a7f3d0', background: '#ecfdf5', color: '#047857' } : undefined}>
                {s}{matchedSkills.has(s) ? ' · Good Fit' : ''}
              </span>
            ))}
          </div>
        ) : (
          <p className="wk-sub" style={{ marginTop: 0 }}>This worker has not listed any skills yet.</p>
        )}
      </Section>

      {/* ---------- work preference ---------- */}
      <Section title="Work Preference">
        <div className="emp-kv-grid">
          <Row k="Preferred Roles" v={(w.preferredRoles || []).join(', ')} />
          <Row k="Work Type" v={(w.preferredWorkTypes || []).map(titleCase).join(', ')} />
          <Row k="Preferred Hours" v={(w.preferredHours || []).join(', ')} />
          <Row
            k="Expected Pay"
            v={
              w.expectedSalaryMin != null && w.expectedSalaryMax != null
                ? `${money(w.expectedSalaryMin)} – ${money(w.expectedSalaryMax)}`
                : w.expectedSalary != null ? pay(w.expectedSalary, w.salaryUnit) : null
            }
          />
        </div>
      </Section>

      {/* ---------- work history ---------- */}
      <Section
        title="Work History"
        extra={
          total > history.length && !allHistory ? (
            <button className="mk-btn mk-btn-ghost mk-btn-sm" onClick={showAllHistory}>
              See All ({total})
            </button>
          ) : (
            <span className="wk-sub" style={{ marginTop: 0 }}>
              {total ? `${total} completed job${total === 1 ? '' : 's'}` : ''}
            </span>
          )
        }
      >
        {history.length ? (
          <DataTable head={['Business', 'Role', 'Period', 'Duration', 'Pay', 'Rating', 'Feedback']}>
            {history.map((h, i) => (
              <tr key={h.id ?? i}>
                <td>
                  <div className="nm">{h.businessName}</div>
                  {h.location && <div className="sb">{h.location}</div>}
                </td>
                <td>{h.role}</td>
                <td className="num">
                  {formatDate(h.startDate)}
                  {h.endDate ? ` – ${formatDate(h.endDate)}` : ' – ongoing'}
                </td>
                <td className="num">{durationLabel(h.durationDays)}</td>
                <td className="num">{h.pay != null ? pay(h.pay, h.salaryUnit) : '—'}</td>
                <td className="num">
                  {h.rating != null
                    ? <span style={{ color: '#b45309', fontWeight: 700 }}>{Number(h.rating).toFixed(1)} ★</span>
                    : <span style={{ color: 'var(--muted)' }}>—</span>}
                </td>
                <td style={{ maxWidth: 240, whiteSpace: 'normal' }}>
                  {h.feedback || <span style={{ color: 'var(--muted)' }}>No feedback</span>}
                </td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <Empty icon="briefcase" title="No work history yet" text="Jobs completed through SkillBridge will show here with pay and ratings." />
        )}
      </Section>

      {/* ---------- ratings & reviews ---------- */}
      <Section title="Ratings & Reviews">
        <div className="emp-rating-grid">
          <div>
            <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>
              {Number(w.rating || 0).toFixed(1)}
            </div>
            <Stars rating={w.rating || 0} />
            <div className="wk-sub">
              {w.ratingCount || 0} review{w.ratingCount === 1 ? '' : 's'}
            </div>
            <div style={{ marginTop: 14 }}>
              <RatingBars breakdown={w.ratingBreakdown || {}} total={w.ratingCount || 0} />
            </div>
          </div>

          <div>
            {reviews.length ? (
              <div className="wk-list">
                {reviews.map((r, i) => (
                  <div className="wk-card" key={r.id ?? i}>
                    <div className="wk-row" style={{ flexWrap: 'wrap' }}>
                      <span className="grow" style={{ fontSize: 14, fontWeight: 700 }}>{r.author || r.authorName}</span>
                      <Stars rating={r.rating || 0} />
                    </div>
                    {r.comment && <p style={{ fontSize: 13.5, color: 'var(--body)', marginTop: 8 }}>{r.comment}</p>}
                    {r.createdAt && <div className="wk-sub">{formatDate(r.createdAt)}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <Empty icon="star" title="No reviews yet" text="Reviews appear once this worker completes jobs through SkillBridge." />
            )}
          </div>
        </div>
      </Section>

      {/* ---------- documents ---------- */}
      {documents.length > 0 && (
        <Section title="Documents">
          <div className="emp-kv-grid">
            {documents.map((d) => (
              <div className="r" key={d.type}>
                <span className="k">{d.label}</span>
                <span className="v">
                  <span className={`emp-badge ${DOC_TONE[d.status] ?? 'grey'}`}>
                    {d.status === 'VERIFIED' && <Icon name="checkCircle" size={12} />}
                    {DOC_TEXT[d.status] || d.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ---------- photos ---------- */}
      {photos.length > 0 && (
        <Section title="Photos">
          <div className="emp-photos">
            {photos.map((src, i) => <img key={i} src={src} alt={`Work photo ${i + 1}`} />)}
          </div>
        </Section>
      )}
    </>
  )
}
