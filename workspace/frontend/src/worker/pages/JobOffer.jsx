import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import {
  getOffer, acceptOffer, declineOffer, pay, formatDate, daysLabel, hhmm, EMPLOYMENT_LABEL,
} from '../api'
import { JobArt, Loading, ErrorNote } from '../components'

const BENEFIT_LABEL = {
  MEALS: 'Meals / Food', TRAVEL: 'Travel Allowance',
  BONUS: 'Performance Bonus', OTHER: 'Other benefits',
}
const BENEFIT_ICON = { MEALS: 'cup', TRAVEL: 'car', BONUS: 'trending', OTHER: 'sparkles' }

const CONFETTI = [
  ['6%', '14%', '#2563eb'], ['88%', '10%', '#f59e0b'], ['0%', '54%', '#10b981'],
  ['94%', '48%', '#ef4444'], ['18%', '90%', '#8b5cf6'], ['76%', '88%', '#0ea5e9'],
]

export default function JobOffer() {
  useDocumentTitle('Job offer')
  const { id } = useParams()
  const navigate = useNavigate()
  const [offer, setOffer] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [confirmDecline, setConfirmDecline] = useState(false)

  const load = () => {
    setError('')
    getOffer(id).then(setOffer).catch(() => setError('We could not load this offer.'))
  }
  useEffect(load, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (kind) => {
    setBusy(kind); setError('')
    try {
      setOffer(await (kind === 'accept' ? acceptOffer(id) : declineOffer(id)))
      setConfirmDecline(false)
    } catch (e) {
      setError(e?.response?.data?.message || `Could not ${kind} this offer.`)
    } finally { setBusy('') }
  }

  if (error && !offer) return <ErrorNote onRetry={load}>{error}</ErrorNote>
  if (!offer) return <Loading rows={2} />

  // Screen 17 — the confirmation the worker sees after accepting.
  if (offer.status === 'ACCEPTED') return <Accepted offer={offer} />

  const declined = offer.status === 'DECLINED'

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <Link className="wk-link" to="/worker/applications" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
        <Icon name="chevronLeft" size={15} /> Back to My Applications
      </Link>

      <ErrorNote>{error}</ErrorNote>

      {declined ? (
        <div className="mk-note" style={{ marginBottom: 14 }}>
          You declined this offer. It is no longer active on your applications.
        </div>
      ) : (
        <div className="mk-success" style={{ marginBottom: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Icon name="checkCircle" size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <span><strong>You have received a job offer!</strong> Review the details below.</span>
        </div>
      )}

      <div className="wk-card pad-lg">
        <div className="wk-job" style={{ alignItems: 'center' }}>
          <JobArt job={{ title: offer.jobTitle, businessName: offer.employerName }} />
          <div className="meta" style={{ paddingRight: 0 }}>
            <div className="ttl">{offer.jobTitle}</div>
            {offer.employerId ? (
              <Link to={`/worker/employers/${offer.employerId}`} className="biz" style={{ color: 'var(--blue)' }}>
                {offer.employerName}
              </Link>
            ) : <div className="biz">{offer.employerName}</div>}
          </div>
        </div>

        <div className="wk-facts" style={{ marginTop: 16 }}>
          <Fact icon="rupee" k="Salary" v={pay(offer.salary, offer.salaryUnit)} />
          <Fact icon="briefcase" k="Employment Type" v={EMPLOYMENT_LABEL[offer.employmentType] || offer.employmentType || '—'} />
          {offer.joiningDate && <Fact icon="calendar" k="Joining Date" v={formatDate(offer.joiningDate)} />}
          {offer.workingDays?.length > 0 && <Fact icon="calendar" k="Working Days" v={daysLabel(offer.workingDays)} />}
          {offer.shiftStart && (
            <Fact icon="clock" k="Shift Timings" v={`${hhmm(offer.shiftStart)} – ${hhmm(offer.shiftEnd)}`} />
          )}
          {offer.workLocation && <Fact icon="pin" k="Location" v={offer.workLocation} />}
        </div>

        {(offer.benefits || []).length > 0 && (
          <>
            <h2 className="wk-h2" style={{ marginTop: 22 }}>Additional Benefits</h2>
            <div className="mk-chips" style={{ marginTop: 10 }}>
              {offer.benefits.map((bnf) => (
                <span className="wk-chip" key={bnf}>
                  <Icon name={BENEFIT_ICON[bnf] || 'check'} size={13} />
                  {BENEFIT_LABEL[bnf] || bnf}
                </span>
              ))}
            </div>
          </>
        )}

        {!declined && (
          <div
            style={{
              display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 20,
              background: 'var(--blue-50)', border: '1px solid var(--blue-100)',
              borderRadius: 11, padding: '12px 14px', fontSize: 13.5, color: 'var(--blue-700)',
            }}
          >
            <Icon name="checkCircle" size={17} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Please confirm your acceptance to proceed with joining instructions.</span>
          </div>
        )}

        {declined ? (
          <Link className="mk-btn mk-btn-outline" style={{ width: '100%', marginTop: 20 }} to="/worker/jobs">
            Find other jobs
          </Link>
        ) : confirmDecline ? (
          <div className="wk-card" style={{ marginTop: 20, borderColor: '#fecaca', background: '#fef2f2' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#b91c1c' }}>Decline this offer?</div>
            <div style={{ fontSize: 13.5, color: '#b91c1c', marginTop: 4 }}>
              This cannot be undone, and the position may be offered to someone else.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={() => setConfirmDecline(false)} disabled={!!busy}>
                Go back
              </button>
              <button className="mk-btn mk-btn-sm" style={{ background: '#dc2626', color: '#fff' }}
                onClick={() => act('decline')} disabled={!!busy}>
                {busy === 'decline' ? 'Declining…' : 'Yes, decline'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              className="mk-btn"
              style={{ flex: 1, background: '#fff', color: '#b91c1c', border: '1px solid #fecaca' }}
              onClick={() => setConfirmDecline(true)} disabled={!!busy}
            >
              Decline Offer
            </button>
            <button className="mk-btn mk-btn-primary" style={{ flex: 1 }} onClick={() => act('accept')} disabled={!!busy}>
              {busy === 'accept' ? 'Accepting…' : 'Accept Offer'}
            </button>
          </div>
        )}

        {offer.applicationId && (
          <button
            className="wk-link"
            style={{ background: 0, border: 0, marginTop: 16, cursor: 'pointer', font: 'inherit', display: 'block', width: '100%', textAlign: 'center' }}
            onClick={() => navigate(`/worker/applications/${offer.applicationId}`)}
          >
            View application timeline
          </button>
        )}
      </div>
    </div>
  )
}

/* ---------- 17. Offer accepted ---------- */

const NEXT_STEPS = [
  'Employer will confirm your acceptance',
  'You will receive joining details shortly',
  'Complete any document verification if required',
  'Get ready to start your new job!',
]

function Accepted({ offer }) {
  useDocumentTitle('Offer accepted')
  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="wk-card">
        <div className="wk-offer">
          <div className="tick">
            <span className="emp-confetti" aria-hidden="true">
              {CONFETTI.map(([left, top, bg], i) => <span key={i} style={{ left, top, background: bg }} />)}
            </span>
            <Icon name="check" size={34} strokeWidth={3} />
          </div>
          <h1>Offer Accepted!</h1>
          <p className="lede">You have successfully accepted the job offer.</p>

          <div className="wk-card" style={{ marginTop: 24, textAlign: 'left' }}>
            <h2 className="wk-h2" style={{ fontSize: 15 }}>Next Steps</h2>
            <div className="wk-list" style={{ gap: 10, marginTop: 12 }}>
              {NEXT_STEPS.map((s) => (
                <div key={s} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: 'var(--body)' }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: '#d1fae5', color: '#047857', display: 'grid', placeItems: 'center',
                  }}>
                    <Icon name="check" size={11} strokeWidth={4} />
                  </span>
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10, marginTop: 22 }}>
            {offer.employmentId ? (
              <Link className="mk-btn mk-btn-primary" to={`/worker/work/${offer.employmentId}/joining`}>
                View Joining Details
              </Link>
            ) : (
              <Link className="mk-btn mk-btn-primary" to="/worker/work">Go to My Work</Link>
            )}
            <Link className="mk-btn mk-btn-outline" to="/worker/applications">Back to My Applications</Link>
          </div>
        </div>
      </div>
    </div>
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
