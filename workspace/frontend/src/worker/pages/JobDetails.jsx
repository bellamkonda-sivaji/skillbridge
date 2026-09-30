import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import {
  getJob, saveJob, unsaveJob, applyToJob, pay, workerPay, distance, EMPLOYMENT_LABEL,
} from '../api'
import { JobArt, Stars, Verified, Bookmark, Loading, ErrorNote } from '../components'

/**
 * Employers write a free-text description. We split it into responsibilities and
 * requirements only when the text actually uses those headings; otherwise the
 * description is shown as written rather than invented structure.
 */
function splitSections(job) {
  const resp = job.responsibilities || []
  const reqs = job.requirements || []
  if (resp.length || reqs.length) return { resp, reqs, body: job.description }
  return { resp: [], reqs: job.requiredSkills || [], body: job.description }
}

export default function JobDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useDocumentTitle(job?.title || 'Job details')

  const load = () => {
    setError('')
    getJob(id).then(setJob).catch(() => setError('We could not load this job.'))
  }
  useEffect(load, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSave = async () => {
    const next = !job.saved
    setJob((j) => ({ ...j, saved: next }))
    try { await (next ? saveJob(job.id) : unsaveJob(job.id)) }
    catch { setJob((j) => ({ ...j, saved: !next })) }
  }

  const apply = async () => {
    setBusy(true)
    try {
      const application = await applyToJob(job.id)
      navigate(`/worker/applications/${application.id}`)
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not apply to this job.')
      setBusy(false)
    }
  }

  if (error && !job) return <ErrorNote onRetry={load}>{error}</ErrorNote>
  if (!job) return <Loading rows={2} />

  const { resp, reqs, body } = splitSections(job)
  const dist = distance(job.distanceKm)

  return (
    <>
      <Link className="wk-link" to="/worker/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
        <Icon name="chevronLeft" size={15} /> Back to Jobs
      </Link>

      <ErrorNote>{error}</ErrorNote>

      <div className="wk-card pad-lg">
        <div className="wk-detail-head">
          <JobArt job={job} size={96} radius={13} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="wk-h1">{job.title}</h1>
            <Link
              to={`/worker/employers/${job.employerId}`}
              style={{ fontSize: 15, color: 'var(--blue)', fontWeight: 600, display: 'inline-block', marginTop: 3 }}
            >
              {job.businessName}
            </Link>
            <div className="wk-row" style={{ marginTop: 9, flexWrap: 'wrap', gap: 10 }}>
              {job.employerRatingCount > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Stars rating={job.employerRating} />
                  <span className="wk-sub" style={{ marginTop: 0 }}>
                    {job.employerRating?.toFixed(1)} ({job.employerRatingCount} reviews)
                  </span>
                </span>
              )}
              {job.employerVerified && <Verified />}
              {job.urgent && <span className="wk-chip urgent">Urgent</span>}
            </div>
          </div>
          <button
            className={`wk-save${job.saved ? ' on' : ''}`}
            style={{ position: 'static' }}
            onClick={toggleSave}
            aria-pressed={!!job.saved}
            aria-label={job.saved ? 'Remove from saved' : 'Save job'}
          >
            <Bookmark filled={job.saved} size={20} />
          </button>
        </div>

        <div className="wk-facts">
          <Fact icon="rupee" k="You get" v={pay(workerPay(job), job.salaryUnit)} />
          <Fact icon="clock" k="Type" v={EMPLOYMENT_LABEL[job.employmentType || job.workType] || job.workType} />
          <Fact icon="pin" k="Distance" v={dist || 'Not set'} />
          <Fact icon="briefcase" k="Location" v={job.city || '—'} />
        </div>

        {body && (
          <div style={{ marginTop: 24 }}>
            <h2 className="wk-h2">Job Description</h2>
            <p style={{ fontSize: 14.5, color: 'var(--body)', marginTop: 8 }}>{body}</p>
          </div>
        )}

        {(resp.length > 0 || reqs.length > 0) && (
          <div className="wk-cols" style={{ marginTop: 24 }}>
            {resp.length > 0 && (
              <div>
                <h2 className="wk-h2">Responsibilities</h2>
                <ul className="wk-bullets">{resp.map((r) => <li key={r}>{r}</li>)}</ul>
              </div>
            )}
            {reqs.length > 0 && (
              <div>
                <h2 className="wk-h2">{resp.length ? 'Requirements' : 'Skills required'}</h2>
                <ul className="wk-bullets">{reqs.map((r) => <li key={r}>{r}</li>)}</ul>
              </div>
            )}
          </div>
        )}

        {job.workersNeeded > 0 && (
          <p className="wk-sub" style={{ marginTop: 20 }}>
            {job.workersNeeded} {job.workersNeeded === 1 ? 'position' : 'positions'} available
            {job.applicantsCount ? ` · ${job.applicantsCount} applied so far` : ''}
          </p>
        )}

        <div className="wk-sticky">
          <button className="mk-btn mk-btn-outline" onClick={toggleSave}>
            <Bookmark filled={job.saved} size={16} /> {job.saved ? 'Saved' : 'Save'}
          </button>
          {job.applied ? (
            <Link className="mk-btn mk-btn-outline" to="/worker/applications">View your application</Link>
          ) : (
            <button className="mk-btn mk-btn-primary" onClick={apply} disabled={busy}>
              {busy ? 'Applying…' : 'Apply Now'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function Fact({ icon, k, v }) {
  return (
    <div className="wk-fact">
      <span className="ic"><Icon name={icon} size={15} /></span>
      <span style={{ minWidth: 0 }}>
        <span className="v" style={{ display: 'block' }}>{v}</span>
        <span className="k">{k}</span>
      </span>
    </div>
  )
}
