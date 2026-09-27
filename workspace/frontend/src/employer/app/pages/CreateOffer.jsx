import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { useDocumentTitle } from '../../../marketing/components'
import { Loading, ErrorNote, PageHead } from '../../../worker/components'
import { WhenBanner, SummaryTable, EstimateBox } from '../hiring'
import { getOfferDraft, sendOffer, money, pay, formatDate } from '../api'

const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'PERMANENT', label: 'Permanent' },
]

const BENEFITS = [
  { value: 'MEALS', label: 'Meals provided' },
  { value: 'ACCOMMODATION', label: 'Accommodation' },
  { value: 'TRANSPORT', label: 'Transport allowance' },
  { value: 'PF_ESI', label: 'PF / ESI' },
  { value: 'BONUS', label: 'Festival bonus' },
  { value: 'UNIFORM', label: 'Uniform provided' },
]

const PROBATION = [
  { value: 0, label: 'No probation' },
  { value: 1, label: '1 month' },
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
]

const unitLabel = (u) => ({
  HOURLY: 'Per hour', PER_SHIFT: 'Per shift', DAILY: 'For the day',
  PER_WEEK: 'Per week', MONTHLY: 'Per month',
}[u] || u)

/**
 * Screens 22 & 23 — Create Offer, then Preview & Send.
 *
 * What the employer fills in is decided by the job's duration. A one-day job
 * produces a plain work confirmation: pay type, amount, and what it will cost.
 * A months-long job produces a real employment offer, with a joining date,
 * employment type, probation and benefits.
 */
export default function CreateOffer() {
  const { applicationId } = useParams()
  const navigate = useNavigate()
  const [draft, setDraft] = useState(null)
  const [form, setForm] = useState(null)
  const [stage, setStage] = useState('edit') // edit | preview
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  useDocumentTitle(stage === 'edit' ? 'Create Offer' : 'Offer Preview')

  const load = () => {
    setDraft(null); setError('')
    getOfferDraft(applicationId)
      .then((d) => {
        setDraft(d)
        setForm({
          salary: d.salary ?? '',
          salaryUnit: d.salaryUnit || (d.allowedSalaryUnits || [])[0] || 'DAILY',
          joiningDate: d.suggestedJoiningDate || '',
          workDate: d.workDate || '',
          employmentType: d.employmentType || 'FULL_TIME',
          probationMonths: d.probationMonths ?? 3,
          benefits: Array.isArray(d.benefits) ? d.benefits : [],
          message: '',
          notifyWorker: true,
        })
      })
      .catch((e) => setError(e?.response?.data?.message || 'We could not prepare this offer.'))
  }
  useEffect(load, [applicationId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error && !draft) return <ErrorNote onRetry={load}>{error}</ErrorNote>
  if (!draft || !form) return <Loading rows={3} />

  const short = !!draft.isShortJob
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const toggleBenefit = (v) =>
    set({ benefits: form.benefits.includes(v) ? form.benefits.filter((b) => b !== v) : [...form.benefits, v] })

  /* The cost shown is the server's, recomputed only when the amount the
     employer typed differs from the draft it priced. */
  const amountChanged = Number(form.salary) !== Number(draft.salary)
    || form.salaryUnit !== draft.salaryUnit

  const send = async () => {
    setSending(true); setError('')
    const body = {
      salary: Number(form.salary),
      salaryUnit: form.salaryUnit,
      message: form.message || undefined,
      notifyWorker: form.notifyWorker,
    }
    if (short) body.workDate = form.workDate || undefined
    else {
      body.joiningDate = form.joiningDate || undefined
      body.employmentType = form.employmentType
      body.probationMonths = Number(form.probationMonths) || 0
      body.benefits = form.benefits
    }
    try {
      const offer = await sendOffer(applicationId, body)
      navigate(`/employer/offers?sent=${offer?.id || ''}`)
    } catch (e) {
      setError(e?.response?.data?.message || 'We could not send that offer. Please try again.')
      setStage('edit')
    } finally {
      setSending(false)
    }
  }

  /* ---------------- preview (screen 23) ---------------- */

  if (stage === 'preview') {
    return (
      <>
        <button className="wk-link" onClick={() => setStage('edit')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14, border: 0, background: 'transparent', cursor: 'pointer', padding: 0 }}>
          <Icon name="chevronLeft" size={15} /> Back to edit
        </button>

        <WhenBanner id="offer-preview">
          This is the last check before the {draft.offerLabel || 'offer'} reaches the worker. Nothing is sent until you press Send.
        </WhenBanner>

        <PageHead
          title="Offer Preview"
          sub={`Review what ${draft.workerName} will see`}
        />

        <ErrorNote>{error}</ErrorNote>

        <div className="wk-card pad-lg">
          <h2 className="wk-h2" style={{ marginBottom: 12 }}>Offer Summary</h2>
          <SummaryTable
            rows={[
              ['Candidate', draft.workerName],
              ['Job Title', draft.jobTitle],
              ['Work Location', draft.workLocation],
              short
                ? ['Work Date', formatDate(form.workDate) || formatDate(draft.workDate)]
                : ['Joining Date', formatDate(form.joiningDate)],
              short ? ['Working Time', draft.workingTimeLabel] : ['Working Days', draft.workingDaysLabel],
              !short && ['Employment Type', (EMPLOYMENT_TYPES.find((t) => t.value === form.employmentType) || {}).label],
              ['Pay', `${money(form.salary)} · ${unitLabel(form.salaryUnit)}`],
              !short && ['Probation Period', Number(form.probationMonths) ? `${form.probationMonths} months` : 'No probation'],
              !short && ['Benefits', form.benefits.length
                ? form.benefits.map((b) => (BENEFITS.find((x) => x.value === b) || {}).label || b).join(', ')
                : 'None'],
            ]}
          />

          {!amountChanged && (
            <div style={{ marginTop: 16, maxWidth: 380 }}>
              <EstimateBox
                workerPay={draft.estimatedWorkerPay}
                fee={draft.platformFee}
                total={draft.estimatedEmployerTotal}
              />
            </div>
          )}

          <h2 className="wk-h2" style={{ marginTop: 24, marginBottom: 8 }}>
            Message to {short ? 'Worker' : 'Candidate'}
          </h2>
          <textarea
            className="wk-input"
            rows={4}
            placeholder={short
              ? 'e.g. Please reach the store by 8:45 AM and ask for Ramesh at the counter.'
              : 'e.g. We are glad to have you on the team. Please bring your Aadhaar and bank passbook on your first day.'}
            value={form.message}
            onChange={(e) => set({ message: e.target.value })}
          />

          <label className="wk-row" style={{ gap: 9, marginTop: 14, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.notifyWorker}
              onChange={(e) => set({ notifyWorker: e.target.checked })}
            />
            <span style={{ fontSize: 13.5, color: 'var(--body)' }}>
              Notify {draft.workerName} by app notification and SMS
            </span>
          </label>

          <p className="wk-sub">
            The worker gets the {draft.offerLabel || 'offer'} immediately and can accept or decline from their app.
          </p>

          <div className="wk-row" style={{ gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <button className="mk-btn mk-btn-outline" onClick={() => setStage('edit')} disabled={sending}>
              Back
            </button>
            <button className="mk-btn mk-btn-primary" onClick={send} disabled={sending}>
              {sending ? 'Sending…' : `Send ${short ? 'Work Confirmation' : 'Offer'}`}
            </button>
          </div>
        </div>
      </>
    )
  }

  /* ---------------- edit (screen 22) ---------------- */

  const canContinue = Number(form.salary) > 0 && (short ? true : !!form.joiningDate)

  return (
    <>
      <Link
        className="wk-link"
        to={draft.jobId ? `/employer/jobs/${draft.jobId}/interview-results` : '/employer/jobs'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14 }}
      >
        <Icon name="chevronLeft" size={15} /> Back to candidates
      </Link>

      <WhenBanner id="create-offer">
        You reach this screen after selecting a candidate. What you fill in here depends on how long the job runs —
        a short job only needs the pay agreed, a longer one needs a full offer.
      </WhenBanner>

      <PageHead
        title={short ? 'Confirm Work' : 'Create Offer'}
        sub={`For ${draft.workerName} · ${draft.jobTitle}`}
      />

      <ErrorNote>{error}</ErrorNote>

      {short && (
        <div className="emp-when" style={{ borderColor: '#fde68a', background: '#fffbeb' }}>
          <span className="ic" style={{ color: '#b45309', borderColor: '#fde68a' }} aria-hidden="true">
            <Icon name="clock" size={14} />
          </span>
          <div className="bd">
            <div className="t" style={{ color: '#92400e' }}>This is a short job</div>
            <div className="d">
              We’ll create a simple work confirmation instead of a full employment offer — no probation,
              no employment type, just the work and the pay.
            </div>
          </div>
        </div>
      )}

      <div className="wk-card pad-lg">
        <h2 className="wk-h2" style={{ marginBottom: 12 }}>Job Details</h2>
        <SummaryTable
          rows={[
            ['Job Title', draft.jobTitle],
            ['Work Location', draft.workLocation],
            short
              ? ['Work Date', formatDate(draft.workDate)]
              : ['Start Date', formatDate(draft.startDate) || 'To be agreed'],
            short ? ['Working Time', draft.workingTimeLabel] : ['Working Days', draft.workingDaysLabel],
            ['Posted Pay', draft.salary != null ? pay(draft.salary, draft.salaryUnit) : '—'],
          ]}
        />
      </div>

      <div className="wk-card pad-lg" style={{ marginTop: 14 }}>
        <h2 className="wk-h2" style={{ marginBottom: 14 }}>
          {short ? 'Work Confirmation Details' : 'Offer Details'}
        </h2>

        <div className="wk-form">
          {!short && (
            <label className="wk-field">
              <span className="lb">Proposed Joining Date</span>
              <input
                className="wk-input"
                type="date"
                value={form.joiningDate || ''}
                onChange={(e) => set({ joiningDate: e.target.value })}
              />
            </label>
          )}

          {short && draft.workDate && (
            <label className="wk-field">
              <span className="lb">Work Date</span>
              <input
                className="wk-input"
                type="date"
                value={form.workDate || ''}
                onChange={(e) => set({ workDate: e.target.value })}
              />
            </label>
          )}

          {!short && (
            <label className="wk-field">
              <span className="lb">Employment Type</span>
              <select className="wk-select" value={form.employmentType} onChange={(e) => set({ employmentType: e.target.value })}>
                {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
          )}

          <label className="wk-field">
            <span className="lb">Pay Type</span>
            <select className="wk-select" value={form.salaryUnit} onChange={(e) => set({ salaryUnit: e.target.value })}>
              {(draft.allowedSalaryUnits || [form.salaryUnit]).map((u) => (
                <option key={u} value={u}>{unitLabel(u)}</option>
              ))}
            </select>
          </label>

          <label className="wk-field">
            <span className="lb">Amount (₹)</span>
            <input
              className="wk-input"
              type="number"
              min="0"
              inputMode="numeric"
              value={form.salary}
              onChange={(e) => set({ salary: e.target.value })}
            />
          </label>

          {!short && (
            <label className="wk-field">
              <span className="lb">Probation Period</span>
              <select className="wk-select" value={form.probationMonths} onChange={(e) => set({ probationMonths: Number(e.target.value) })}>
                {PROBATION.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </label>
          )}
        </div>

        {!short && (
          <>
            <h3 className="wk-h2" style={{ fontSize: 15, marginTop: 22, marginBottom: 10 }}>Benefits</h3>
            <div style={{ display: 'grid', gap: 9, gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
              {BENEFITS.map((b) => (
                <label key={b.value} className="wk-row" style={{ gap: 9, cursor: 'pointer', fontSize: 13.5 }}>
                  <input
                    type="checkbox"
                    checked={form.benefits.includes(b.value)}
                    onChange={() => toggleBenefit(b.value)}
                  />
                  <span>{b.label}</span>
                </label>
              ))}
            </div>
          </>
        )}

        <label className="wk-field" style={{ marginTop: 20 }}>
          <span className="lb">Additional Note (optional)</span>
          <textarea
            className="wk-input"
            rows={3}
            placeholder="Anything the worker should know before starting."
            value={form.message}
            onChange={(e) => set({ message: e.target.value })}
          />
        </label>

        {amountChanged && (
          <p className="wk-sub">
            You changed the pay. The final cost will be recalculated by SkillBridge when the offer is sent.
          </p>
        )}
      </div>

      {!amountChanged && draft.estimatedEmployerTotal != null && (
        <div style={{ marginTop: 14, maxWidth: 380 }}>
          <EstimateBox
            workerPay={draft.estimatedWorkerPay}
            fee={draft.platformFee}
            total={draft.estimatedEmployerTotal}
          />
        </div>
      )}

      <div className="wk-row" style={{ gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <Link className="mk-btn mk-btn-outline" to={draft.jobId ? `/employer/jobs/${draft.jobId}/interview-results` : '/employer/jobs'}>
          Cancel
        </Link>
        <button className="mk-btn mk-btn-primary" disabled={!canContinue} onClick={() => setStage('preview')}>
          Preview {short ? 'Confirmation' : 'Offer'}
        </button>
        {!canContinue && (
          <span className="wk-sub" style={{ marginTop: 0 }}>
            {Number(form.salary) > 0 ? 'Pick a joining date to continue.' : 'Enter the amount to continue.'}
          </span>
        )}
      </div>
    </>
  )
}
