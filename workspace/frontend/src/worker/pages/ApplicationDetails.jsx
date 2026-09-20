import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import {
  getApplication, withdrawApplication, pay, distance, formatDate, EMPLOYMENT_LABEL,
} from '../api'
import {
  JobArt, StatusBadge, SegTabs, Loading, ErrorNote, Empty,
} from '../components'

const NODE_ICON = { DONE: 'check', CURRENT: 'clock', PENDING: 'clock' }

export default function ApplicationDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [app, setApp] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('timeline')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  useDocumentTitle('Application details')

  const load = () => {
    setError('')
    getApplication(id).then(setApp).catch(() => setError('We could not load this application.'))
  }
  useEffect(load, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const withdraw = async () => {
    setBusy(true)
    try {
      setApp(await withdrawApplication(id))
      setConfirming(false)
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not withdraw this application.')
    } finally {
      setBusy(false)
    }
  }

  if (error && !app) return <ErrorNote onRetry={load}>{error}</ErrorNote>
  if (!app) return <Loading rows={2} />

  const job = app.job || {}

  return (
    <>
      <button
        className="wk-link"
        style={{ background: 0, border: 0, padding: 0, cursor: 'pointer', font: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14 }}
        onClick={() => navigate('/worker/applications')}
      >
        <Icon name="chevronLeft" size={15} /> Application Details
      </button>

      <ErrorNote>{error}</ErrorNote>

      <div className="wk-card pad-lg">
        <div className="wk-job" style={{ alignItems: 'center' }}>
          <JobArt job={job} />
          <div className="meta" style={{ paddingRight: 0 }}>
            <Link to={`/worker/jobs/${job.id}`} className="ttl" style={{ color: 'inherit', display: 'block' }}>
              {job.title}
            </Link>
            <div className="biz">{job.businessName}</div>
            <div className="chips">
              {job.salary != null && <span className="wk-pay">{pay(job.salary, job.salaryUnit)}</span>}
              {(job.employmentType || job.workType) && (
                <span className="wk-chip">
                  {EMPLOYMENT_LABEL[job.employmentType || job.workType] || job.workType}
                </span>
              )}
            </div>
          </div>
          <StatusBadge status={app.status} />
        </div>

        <div style={{ marginTop: 20 }}>
          <SegTabs
            value={tab}
            onChange={setTab}
            tabs={[{ value: 'timeline', label: 'Timeline' }, { value: 'job', label: 'Job Details' }]}
          />
        </div>

        {tab === 'timeline' ? (
          <div className="wk-timeline">
            {(app.timeline || []).map((t, i, arr) => (
              <div className={`wk-tl ${String(t.state || 'PENDING').toLowerCase()}`} key={t.key}>
                <div className="rail">
                  <span className="node">
                    <Icon name={NODE_ICON[t.state] || 'clock'} size={13} strokeWidth={t.state === 'DONE' ? 3 : 2} />
                  </span>
                  {i < arr.length - 1 && <span className="line" />}
                </div>
                <div className="content">
                  <div className="lbl">{t.label}</div>
                  {t.at && <div className="at">{formatDate(t.at, true)}</div>}
                  {t.note && <div className="note">{t.note}</div>}
                </div>
              </div>
            ))}
            {!app.timeline?.length && <Empty icon="clock" title="No activity yet" />}
          </div>
        ) : (
          <div style={{ marginTop: 18 }}>
            <div className="wk-facts">
              <Fact icon="rupee" k="Salary" v={pay(job.salary, job.salaryUnit)} />
              <Fact icon="clock" k="Type" v={EMPLOYMENT_LABEL[job.employmentType || job.workType] || '—'} />
              <Fact icon="pin" k="Distance" v={distance(job.distanceKm) || 'Not set'} />
              <Fact icon="briefcase" k="Location" v={job.city || '—'} />
            </div>
            {job.description && (
              <p style={{ fontSize: 14.5, color: 'var(--body)', marginTop: 18 }}>{job.description}</p>
            )}
            <Link className="mk-btn mk-btn-outline mk-btn-sm" to={`/worker/jobs/${job.id}`} style={{ marginTop: 18 }}>
              Open full job
            </Link>
          </div>
        )}

        {app.offer && app.status === 'OFFERED' && (
          <Link className="mk-btn mk-btn-primary" to={`/worker/offers/${app.offer.id}`} style={{ width: '100%', marginTop: 20 }}>
            You have an offer — view it
          </Link>
        )}

        {app.canWithdraw && (
          <div style={{ marginTop: 20 }}>
            {confirming ? (
              <div className="wk-card" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
                <div style={{ fontSize: 14, color: '#b91c1c', fontWeight: 600 }}>
                  Withdraw this application?
                </div>
                <div style={{ fontSize: 13.5, color: '#b91c1c', marginTop: 4 }}>
                  The employer will no longer see you as a candidate. You can apply again later
                  while the job is open.
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={() => setConfirming(false)} disabled={busy}>
                    Keep it
                  </button>
                  <button
                    className="mk-btn mk-btn-sm"
                    style={{ background: '#dc2626', color: '#fff' }}
                    onClick={withdraw}
                    disabled={busy}
                  >
                    {busy ? 'Withdrawing…' : 'Yes, withdraw'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="mk-btn"
                style={{ width: '100%', background: '#fff', color: '#b91c1c', border: '1px solid #fecaca' }}
                onClick={() => setConfirming(true)}
              >
                Withdraw Application
              </button>
            )}
          </div>
        )}
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
