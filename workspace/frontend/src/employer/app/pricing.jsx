import React, { useEffect, useState } from 'react'
import Icon from '../../marketing/icons'
import { getJobPricing, changeJobPrice, getJobDemand, money } from './api'
import { calculateCost } from './engagement'

/**
 * The money screens for a live job: what the employer pays, what the worker takes home, and
 * the one piece of advice that matters when nobody is applying.
 *
 * Two rules run through all of it.
 *
 * First, the split is never hidden. An employer who discovers the commission at payout time
 * stops posting, so it is on the posting screen, on the job page and in the confirmation of
 * every price change.
 *
 * Second, we never show an advised price we cannot back. When the server returns no
 * suggestion - because there are too few comparable local jobs to read a rate from - this
 * renders the problem and a way to reach a human, not a made-up number.
 */

const UNIT_SUFFIX = {
  HOURLY: ' per hour', PER_SHIFT: ' per shift', DAILY: ' per day',
  PER_WEEK: ' per week', MONTHLY: ' per month',
}

/* ================================================================= the split ================= */

/** What the employer pays. Only that: the fee and the worker's share are ours. */
export function PriceSplit({ pricing, compact }) {
  if (!pricing || !pricing.postedSalary) return null
  const unit = UNIT_SUFFIX[pricing.salaryUnit] || ''
  if (compact) {
    return (
      <div className="wk-sub" style={{ marginTop: 2 }}>
        You pay {money(pricing.postedSalary)}
      </div>
    )
  }
  return (
    <>
      <div className="emp-price-split">
        <div className="row total">
          <span className="k">You pay</span>
          <span className="v">{money(pricing.postedSalary)}<span className="u">{unit}</span></span>
        </div>
      </div>
    </>
  )
}

/* ================================================================= editing the price ========== */

/**
 * Changing what a live job pays.
 *
 * The plus and minus buttons exist because typing a number on a cheap phone is the step people
 * abandon. They move in steps sized to the amount, so a Rs 900 day moves by Rs 50 and a
 * Rs 18,000 salary moves by Rs 500 — never by an amount that makes the control useless.
 */
export function EditPrice({ job, pricing, suggested, onSaved, onCancel }) {
  const start = Number(pricing?.postedSalary || job?.salary || 0)
  const [value, setValue] = useState(suggested ? Number(suggested) : start)
  const [reason, setReason] = useState(suggested ? 'Raised to attract more workers' : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const step = value >= 10000 ? 500 : value >= 4000 ? 250 : value >= 1000 ? 50 : 20
  const cost = calculateCost(value)
  const changed = Math.abs(value - start) >= 1

  const save = async () => {
    if (!(value > 0)) { setError('Enter the new pay amount.'); return }
    setSaving(true); setError('')
    try {
      const next = await changeJobPrice(job.id, value, reason)
      onSaved?.(next)
    } catch (e) {
      setError(e?.response?.data?.message || 'We could not change the pay. Try again.')
    } finally { setSaving(false) }
  }

  return (
    <div className="wk-card pad-lg" style={{ marginTop: 14 }}>
      <h3 className="wk-h2" style={{ fontSize: 17 }}>Change the pay</h3>
      <p className="wk-sub">
        This is what you pay. Workers who already applied will see the new amount.
      </p>

      <div className="emp-price-stepper">
        <button
          type="button"
          className="stepbtn"
          aria-label={`Reduce by ${money(step)}`}
          onClick={() => setValue((v) => Math.max(0, Math.round(v - step)))}
        >
          <span aria-hidden="true">−</span>
        </button>
        <div className="amount">
          <span className="cur">₹</span>
          <input
            type="number"
            inputMode="numeric"
            value={value || ''}
            onChange={(e) => setValue(Number(e.target.value))}
            aria-label="New pay amount"
          />
          <span className="unit">{UNIT_SUFFIX[job?.salaryUnit] || ''}</span>
        </div>
        <button
          type="button"
          className="stepbtn"
          aria-label={`Increase by ${money(step)}`}
          onClick={() => setValue((v) => Math.round((Number(v) || 0) + step))}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>

      {value > 0 && (
        <div className="emp-price-split" style={{ marginTop: 14 }}>
          <div className="row total">
            <span className="k">You pay</span><span className="v">{money(cost.total)}</span>
          </div>
        </div>
      )}

      {changed && (
        <p className="wk-sub" style={{ marginTop: 10 }}>
          {value > start
            ? `Up ${money(value - start)} from ${money(start)}.`
            : `Down ${money(start - value)} from ${money(start)}.`}
        </p>
      )}

      <div style={{ marginTop: 14 }}>
        <label className="wk-sub" htmlFor="price-reason" style={{ display: 'block', marginBottom: 6 }}>
          Why? (optional)
        </label>
        <input
          id="price-reason"
          className="emp-price-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Not enough people applied"
        />
      </div>

      {error && <p className="wk-sub" style={{ color: '#b91c1c', marginTop: 10 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <button className="mk-btn" disabled={saving || !changed} onClick={save}>
          {saving ? 'Saving…' : 'Save new pay'}
        </button>
        <button className="mk-btn mk-btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </div>
  )
}

/* ================================================================= the advice ================= */

const TONE = {
  STALLED: { cls: 'bad', icon: 'bell' },
  SLOW: { cls: 'warn', icon: 'clock' },
  HEALTHY: { cls: 'good', icon: 'check' },
  TOO_EARLY: { cls: 'info', icon: 'clock' },
  DONE: { cls: 'info', icon: 'check' },
}

/**
 * One card that says how the job is doing and, where we can back it, what to do about it.
 *
 * `onRaise` is handed the suggested price so the page can open the editor already filled in -
 * acting on the advice is one tap, which is the whole point of giving it.
 */
export function DemandAdvice({ demand, onRaise, compact }) {
  if (!demand) return null
  const tone = TONE[demand.verdict] || { cls: 'info', icon: 'clock' }
  const canRaise = demand.suggestedSalary > 0

  return (
    <div className={`emp-advice ${tone.cls}`}>
      <span className="ic" aria-hidden="true"><Icon name={tone.icon} size={18} /></span>
      <div className="bd">
        {/* On the dashboard several of these stack up, so each must name its own job -
            "A few more would help" is useless when the employer has five jobs open. */}
        <div className="hd">
          {compact ? demand.jobTitle : demand.headline}
          {compact && <span className="tag">{demand.headline}</span>}
        </div>
        <p className="dt">{demand.detail}</p>

        {!compact && (
          <div className="facts">
            <span>{demand.applicants} applied · {demand.workersNeeded} needed</span>
            {demand.windowHours != null && (
              <span>
                {demand.windowPassed
                  ? `${demand.hoursLive}h live`
                  : `${demand.windowHours}h window`}
              </span>
            )}
            {demand.marketMedianSalary > 0 && (
              <span>Nearby pay {money(demand.marketMedianSalary)}{demand.comparableJobs ? ` (${demand.comparableJobs} jobs)` : ''}</span>
            )}
          </div>
        )}

        {canRaise && (
          <>
            {demand.reachNow != null && demand.reachAtSuggested != null
              && demand.reachAtSuggested > demand.reachNow && (
              <p className="dt" style={{ marginTop: 6 }}>
                At {money(demand.currentSalary)} this job suits {demand.reachNow} worker
                {demand.reachNow === 1 ? '' : 's'} near you. At {money(demand.suggestedSalary)} it
                suits {demand.reachAtSuggested}.
              </p>
            )}
            <button className="mk-btn mk-btn-sm" style={{ marginTop: 10 }}
              onClick={() => onRaise?.(demand.suggestedSalary)}>
              Raise to {money(demand.suggestedSalary)}
            </button>
          </>
        )}

        {!canRaise && (demand.verdict === 'SLOW' || demand.verdict === 'STALLED') && (
          <p className="dt" style={{ marginTop: 6 }}>
            We do not have enough nearby jobs like this to say what the right pay is, so we are
            not going to guess. Our team will call workers for you.
          </p>
        )}
      </div>
    </div>
  )
}

/** Loads the advice for one job and keeps it fresh while the employer is looking at it. */
export function useJobDemand(jobId, refreshMs = 120000) {
  const [demand, setDemand] = useState(null)
  useEffect(() => {
    if (!jobId) return undefined
    let alive = true
    const load = () => getJobDemand(jobId).then((d) => { if (alive) setDemand(d) }).catch(() => {})
    load()
    const timer = setInterval(load, refreshMs)
    return () => { alive = false; clearInterval(timer) }
  }, [jobId, refreshMs])
  return [demand, setDemand]
}

export function useJobPricing(jobId) {
  const [pricing, setPricing] = useState(null)
  useEffect(() => {
    if (!jobId) return
    getJobPricing(jobId).then(setPricing).catch(() => setPricing(null))
  }, [jobId])
  return [pricing, setPricing]
}
