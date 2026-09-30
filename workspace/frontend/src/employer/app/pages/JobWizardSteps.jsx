import React, { useEffect, useState } from 'react'
import Icon from '../../../marketing/icons'
import api from '../../../api'
import {
  DURATION_MODELS, durationOf, DAYS, BREAK_PRESETS, MONTH_OPTIONS, BENEFIT_TYPES,
  OVERTIME_BASES, HIRING_METHODS, hiringOptionsFor, payChoiceLabel, PAY_BASIS_SUFFIX,
  WORK_PATTERN_LABEL, calculateSchedule, calculateEarnings, calculateCost,
  incompatibleFields, addMonths, money,
} from '../engagement'

const toggle = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

/** The platform fee is configured on the server; never hard-code it here. */
export function usePlatformFee() {
  const [percent, setPercent] = useState(null)
  useEffect(() => {
    api.get('/config/pricing')
      .then((r) => setPercent(r.data?.platformFeePercent ?? null))
      .catch(() => setPercent(null))
  }, [])
  return percent
}

function Section({ title, sub, children }) {
  return (
    <div style={{ marginTop: 6 }}>
      <h2 className="wk-h2">{title}</h2>
      {sub && <p className="wk-sub" style={{ marginBottom: 18 }}>{sub}</p>}
      {children}
    </div>
  )
}

function RadioRow({ on, onClick, icon, title, sub }) {
  return (
    <button className="emp-radio" aria-pressed={on} onClick={onClick}>
      {icon && <span className="ic" aria-hidden="true"><Icon name={icon} size={17} /></span>}
      <span style={{ minWidth: 0 }}>
        <span className="t" style={{ display: 'block' }}>{title}</span>
        {sub && <span className="d">{sub}</span>}
      </span>
      <span className="mark" aria-hidden="true">{on && <Icon name="check" size={11} strokeWidth={4} />}</span>
    </button>
  )
}

function Field({ label, htmlFor, hint, children }) {
  return (
    <div className="wk-field">
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && <span className="wk-sub" style={{ marginTop: 2 }}>{hint}</span>}
    </div>
  )
}

function KV({ k, v }) {
  return <div className="r"><span className="k">{k}</span><span className="v">{v}</span></div>
}

function Fact({ k, v }) {
  return (
    <div className="wk-fact" style={{ background: '#fff' }}>
      <span style={{ minWidth: 0 }}>
        <span className="v" style={{ display: 'block' }}>{v}</span>
        <span className="k">{k}</span>
      </span>
    </div>
  )
}

/* ================= Step 2 — how long ================= */

export function StepDuration({ job, set }) {
  const [pending, setPending] = useState(null)
  const current = durationOf(job.durationType)

  const applyDuration = (m) => {
    const patch = { durationType: m.value, hiringMethod: m.defaultHiringMethod }
    // Keep only what still makes sense for the new duration. A monthly figure
    // carried onto a one-day job would read as ₹18,000 for a single day.
    if (!m.allowedPayBasis.includes(job.salaryUnit)) {
      patch.salaryUnit = m.defaultPayBasis
      patch.salary = ''
    }
    if (m.scheduleVariant === 'SINGLE_DATE') { patch.startDate = ''; patch.endDate = '' }
    else patch.workDate = ''
    if (m.scheduleVariant === 'RECURRING_ONGOING') patch.endDate = ''
    set(patch)
    setPending(null)
  }

  const choose = (m) => {
    const losing = current && job.salary ? incompatibleFields(current, m) : []
    if (losing.length) setPending({ model: m, losing })
    else applyDuration(m)
  }

  return (
    <Section
      title="How long do you need this worker?"
      sub="We’ll adjust the schedule and payment options for you."
    >
      {pending && (
        <div className="wk-card" style={{ borderColor: '#fde68a', background: '#fffbeb', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e' }}>
            Changing the duration will update {pending.losing.join(' and ')}. Continue?
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={() => setPending(null)}>Keep as it is</button>
            <button className="mk-btn mk-btn-primary mk-btn-sm" onClick={() => applyDuration(pending.model)}>
              Yes, change it
            </button>
          </div>
        </div>
      )}

      <div className="emp-radios">
        {DURATION_MODELS.map((m) => (
          <RadioRow key={m.value} on={job.durationType === m.value} onClick={() => choose(m)}
            icon={m.icon} title={m.label} sub={`${m.sub} ${m.example}`} />
        ))}
      </div>

      <p className="wk-sub">
        Not sure? Pick the closest one — you choose the exact dates on the next screen.
      </p>
    </Section>
  )
}

/* ================= Step 4 — schedule ================= */

export function StepSchedule({ job, set }) {
  const model = durationOf(job.durationType)
  const variant = model?.scheduleVariant || 'RECURRING'
  const sched = calculateSchedule(job)
  const shift = job.shifts?.[0] || {}
  const multi = (job.shifts || []).length > 1

  const setShift = (i, patch) =>
    set({ shifts: job.shifts.map((s, n) => (n === i ? { ...s, ...patch } : s)) })

  const setMonths = (months) =>
    set(months === 0
      ? { durationMonths: 0 }
      : { durationMonths: months, endDate: addMonths(job.startDate, months) })

  const title = variant === 'SINGLE_DATE' ? 'When do you need them?'
    : variant === 'DATE_RANGE_SIMPLE' ? 'Which days do you need them?'
      : 'When should they work?'

  return (
    <Section title={title} sub="Set the dates and the working time.">
      {variant === 'SINGLE_DATE' && (
        <Field label="Work date" htmlFor="sc-date">
          <input id="sc-date" className="wk-input" type="date" style={{ maxWidth: 260 }}
            min={new Date().toISOString().slice(0, 10)}
            value={job.workDate || ''} onChange={(e) => set({ workDate: e.target.value })} />
        </Field>
      )}

      {(variant === 'DATE_RANGE_SIMPLE' || variant === 'DATE_RANGE_RECURRING') && (
        <div className="emp-two">
          <Field label="Start date" htmlFor="sc-start">
            <input id="sc-start" className="wk-input" type="date" value={job.startDate || ''}
              onChange={(e) => set({ startDate: e.target.value })} />
          </Field>
          <Field label="End date" htmlFor="sc-end">
            <input id="sc-end" className="wk-input" type="date" value={job.endDate || ''}
              min={job.startDate || undefined} onChange={(e) => set({ endDate: e.target.value })} />
          </Field>
        </div>
      )}

      {variant === 'RECURRING' && (
        <>
          <Field label="Start date" htmlFor="sc-start">
            <input id="sc-start" className="wk-input" type="date" style={{ maxWidth: 260 }}
              value={job.startDate || ''}
              onChange={(e) => set({
                startDate: e.target.value,
                endDate: job.durationMonths ? addMonths(e.target.value, job.durationMonths) : job.endDate,
              })} />
          </Field>
          <Field label="How long?">
            <div className="emp-pay">
              {MONTH_OPTIONS.map((o) => (
                <button key={o.label} className="emp-pay-opt" aria-pressed={job.durationMonths === o.value}
                  onClick={() => setMonths(o.value)}>
                  <span className="mark" aria-hidden="true" />{o.label}
                </button>
              ))}
            </div>
          </Field>
          {job.durationMonths === 0 && (
            <Field label="End date" htmlFor="sc-end">
              <input id="sc-end" className="wk-input" type="date" style={{ maxWidth: 260 }}
                value={job.endDate || ''} min={job.startDate || undefined}
                onChange={(e) => set({ endDate: e.target.value })} />
            </Field>
          )}
        </>
      )}

      {variant === 'RECURRING_ONGOING' && (
        <>
          <Field label="Joining date" htmlFor="sc-start">
            <input id="sc-start" className="wk-input" type="date" style={{ maxWidth: 260 }}
              value={job.startDate || ''} onChange={(e) => set({ startDate: e.target.value })} />
          </Field>
          <div className="mk-note" style={{ marginBottom: 16 }}>This is a regular ongoing job — no end date.</div>
        </>
      )}

      {sched.usesWeekdays && (
        <Field label="Working days">
          <div className="emp-days">
            {DAYS.map((d) => (
              <button key={d.value} className="emp-day" aria-pressed={job.workingDays.includes(d.value)}
                onClick={() => set({ workingDays: toggle(job.workingDays, d.value) })}>
                {d.label}
              </button>
            ))}
          </div>
        </Field>
      )}

      {!multi && (
        <>
          {variant !== 'SINGLE_DATE' && (
            <div className="ob-check" style={{ margin: '4px 0 14px' }}>
              <input id="sc-same" type="checkbox" checked={job.sameTimeEveryDay !== false}
                onChange={(e) => set({ sameTimeEveryDay: e.target.checked })} />
              <label htmlFor="sc-same">Same working time every day</label>
            </div>
          )}

          <div className="emp-two">
            <Field label="Start time" htmlFor="sc-from">
              <input id="sc-from" className="wk-input" type="time" value={shift.startTime || ''}
                onChange={(e) => setShift(0, { startTime: e.target.value })} />
            </Field>
            <Field label="End time" htmlFor="sc-to">
              <input id="sc-to" className="wk-input" type="time" value={shift.endTime || ''}
                onChange={(e) => setShift(0, { endTime: e.target.value })} />
            </Field>
          </div>

          <Field label="Break time">
            <div className="emp-pay">
              {BREAK_PRESETS.map((b) => {
                const custom = b.value === -1
                const mins = Number(shift.breakMinutes) || 0
                const on = custom ? ![0, 30, 60].includes(mins) : mins === b.value
                return (
                  <button key={b.label} className="emp-pay-opt" aria-pressed={on}
                    onClick={() => setShift(0, { breakMinutes: custom ? 45 : b.value })}>
                    <span className="mark" aria-hidden="true" />{b.label}
                  </button>
                )
              })}
            </div>
            {![0, 30, 60].includes(Number(shift.breakMinutes) || 0) && (
              <input className="wk-input" style={{ maxWidth: 190, marginTop: 10 }} type="number" min={0} max={480}
                aria-label="Break minutes" value={shift.breakMinutes || ''}
                onChange={(e) => setShift(0, { breakMinutes: Number(e.target.value) })} />
            )}
          </Field>
        </>
      )}

      {multi && job.shifts.map((s, i) => (
        <div className="wk-card" key={i} style={{ marginBottom: 10 }}>
          <div className="wk-row" style={{ marginBottom: 10 }}>
            <strong style={{ fontSize: 13.5, flex: 1 }}>Shift {i + 1}</strong>
            <button className="emp-menu-btn" aria-label={`Remove shift ${i + 1}`}
              onClick={() => set({ shifts: job.shifts.filter((_, n) => n !== i) })}>
              <Icon name="close" size={15} />
            </button>
          </div>
          <div className="emp-two">
            <Field label="Start time">
              <input className="wk-input" type="time" value={s.startTime || ''}
                onChange={(e) => setShift(i, { startTime: e.target.value })} />
            </Field>
            <Field label="End time">
              <input className="wk-input" type="time" value={s.endTime || ''}
                onChange={(e) => setShift(i, { endTime: e.target.value })} />
            </Field>
          </div>
        </div>
      ))}

      <button className="mk-btn mk-btn-outline mk-btn-sm" style={{ marginTop: 6 }}
        onClick={() => set({ shifts: [...job.shifts, { startTime: '16:00', endTime: '21:00', breakMinutes: 0 }] })}>
        <Icon name="sparkles" size={14} /> Add another shift
      </button>

      {multi && (
        <Field label="Will this worker work all these shifts?">
          <div className="emp-radios">
            <RadioRow on={job.shiftArrangement !== 'ONE_OF_SHIFTS'}
              onClick={() => set({ shiftArrangement: 'ALL_SHIFTS' })} title="Worker works all these shifts" />
            <RadioRow on={job.shiftArrangement === 'ONE_OF_SHIFTS'}
              onClick={() => set({ shiftArrangement: 'ONE_OF_SHIFTS' })} title="Worker will work one assigned shift" />
          </div>
        </Field>
      )}

      <ScheduleSummary sched={sched} model={model} />
    </Section>
  )
}

/** The two or three numbers the employer actually cares about. */
export function ScheduleSummary({ sched, model, onEdit, compact }) {
  const monthly = model?.payroll === 'MONTHLY'
  return (
    <div className="wk-card" style={{ marginTop: 20, background: 'var(--blue-50)', borderColor: 'var(--blue-100)' }}>
      <div className="wk-row" style={{ alignItems: 'flex-start' }}>
        <div className="grow">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
            {compact ? 'Work schedule' : 'This works out as'}
          </div>
          <div className="wk-sub" style={{ marginTop: 2 }}>
            {model?.label} · {sched.periodLabel}
            {sched.workPattern !== 'FULL_DAY' ? ` · ${WORK_PATTERN_LABEL[sched.workPattern]}` : ''}
          </div>
        </div>
        {onEdit && (
          <button className="wk-link" style={{ border: 0, background: 0, cursor: 'pointer', font: 'inherit' }}
            onClick={onEdit}>Edit schedule</button>
        )}
      </div>

      <div className="wk-facts" style={{ marginTop: 12 }}>
        {monthly ? (
          <>
            <Fact k="Work days / month" v={sched.daysPerMonth || '—'} />
            <Fact k="Hours / day" v={sched.paidHoursPerDay || '—'} />
            <Fact k="Hours / week" v={sched.paidHoursPerWeek || '—'} />
          </>
        ) : (
          <>
            <Fact k="Work days" v={sched.scheduledDays || '—'} />
            <Fact k="Hours / day" v={sched.paidHoursPerDay || '—'} />
            {/* a run of consecutive days has no meaningful weekly figure */}
            {sched.usesWeekdays && <Fact k="Hours / week" v={sched.paidHoursPerWeek || '—'} />}
            <Fact k="Total hours" v={sched.expectedPaidHours || '—'} />
          </>
        )}
      </div>

      {sched.warnings.map((w) => <p key={w} className="wk-sub" style={{ color: '#b45309' }}>{w}</p>)}
    </div>
  )
}

/* ================= Step 5 — pay & benefits ================= */

export function StepPay({ job, set, onEditSchedule, feePercent }) {
  const model = durationOf(job.durationType)
  const sched = calculateSchedule(job)
  const earnings = calculateEarnings(job, sched)
  const cost = calculateCost(earnings.amount, feePercent)
  const allowed = model?.allowedPayBasis || ['DAILY']
  const [moreBenefits, setMoreBenefits] = useState(false)

  const has = (t) => (job.benefits || []).some((b) => b.benefitType === t)
  const benefitOf = (t) => (job.benefits || []).find((b) => b.benefitType === t) || {}
  const setBenefit = (t, patch) => {
    const list = job.benefits || []
    set({
      benefits: list.some((b) => b.benefitType === t)
        ? list.map((b) => (b.benefitType === t ? { ...b, ...patch } : b))
        : [...list, { benefitType: t, ...patch }],
    })
  }
  const toggleBenefit = (t) =>
    has(t) ? set({ benefits: (job.benefits || []).filter((b) => b.benefitType !== t) }) : setBenefit(t, {})

  // A one-day job only needs the food question unless the employer asks for more.
  const oneDay = model?.value === 'ONE_DAY'
  const benefitList = oneDay && !moreBenefits
    ? BENEFIT_TYPES.filter((b) => b.value === 'MEALS')
    : BENEFIT_TYPES
  const askOvertime = model && model.value !== 'ONE_DAY' && model.value !== 'FEW_DAYS'

  return (
    <Section title="How much will you pay?" sub="We’ll work out the total for you.">
      <ScheduleSummary sched={sched} model={model} onEdit={onEditSchedule} compact />

      <Field label="Pay type">
        <div className="emp-pay" style={{ marginTop: 4 }}>
          {allowed.map((p) => (
            <button key={p} className="emp-pay-opt" aria-pressed={job.salaryUnit === p}
              onClick={() => set({ salaryUnit: p })}>
              <span className="mark" aria-hidden="true" />{payChoiceLabel(p, model)}
            </button>
          ))}
        </div>
      </Field>

      <Field label={`Amount (₹)${PAY_BASIS_SUFFIX[job.salaryUnit] || ''}`} htmlFor="pay-amount">
        <input id="pay-amount" className="wk-input" style={{ maxWidth: 260 }} type="number" min={0}
          placeholder={job.salaryUnit === 'MONTHLY' ? '18000' : '700'}
          value={job.salary} onChange={(e) => set({ salary: e.target.value })} />
      </Field>

      {Number(job.salary) > 0 && sched.scheduledDays > 0 && (
        <div className="wk-card" style={{ marginTop: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
            You will pay <span className="wk-sub" style={{ marginTop: 0, fontWeight: 500 }}>(estimate)</span>
          </div>
          <div className="emp-kv-grid" style={{ marginTop: 12 }}>
            <KV k={model?.payroll === 'MONTHLY' ? 'You pay each month' : 'You pay'}
              v={<strong style={{ color: 'var(--blue-dark)' }}>{money(cost.total)}</strong>} />
            <KV k={`JobOn fee (${cost.percent}%)`} v={<strong>− {money(cost.fee)}</strong>} />
            <KV k="Worker gets" v={<strong style={{ color: 'var(--green-dark, #15803d)' }}>{money(cost.workerPay)}</strong>} />
          </div>
          {earnings.label && <p className="wk-sub">{earnings.label}</p>}
          <p className="wk-sub">
            Our fee comes out of this amount — you pay exactly what you typed. The worker sees{' '}
            <strong>{money(cost.workerPay)}</strong> on the job, which is what reaches them.
            {cost.slab && ` ${cost.percent}% is the rate for this pay band (${cost.slab.label}).`}
          </p>
          <p className="wk-sub">
            The worker is paid for the days they actually work, so the final amount can differ.
          </p>
        </div>
      )}

      <Field label="Anything extra?" hint="Optional — leave blank if not.">
        <div className="wk-checks" style={{ marginTop: 4 }}>
          {benefitList.map((b) => (
            <label className="wk-checkrow" key={b.value}>
              <input type="checkbox" checked={has(b.value)} onChange={() => toggleBenefit(b.value)} />
              {b.label}
            </label>
          ))}
        </div>
        {oneDay && !moreBenefits && (
          <button className="emp-chip-add" style={{ marginTop: 10 }} onClick={() => setMoreBenefits(true)}>
            + Add another benefit
          </button>
        )}
        {benefitList.filter((b) => has(b.value) && (b.amount || b.note)).map((b) => (
          <div className="wk-card" key={b.value} style={{ marginTop: 10, padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{b.label}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {b.amount && (
                <input className="wk-input" style={{ maxWidth: 150 }} type="number" min={0}
                  placeholder={b.amountLabel || '₹ amount'} aria-label={`${b.label} amount`}
                  value={benefitOf(b.value).amount || ''}
                  onChange={(e) => setBenefit(b.value, { amount: e.target.value })} />
              )}
              {b.unitOptions && (
                <select className="wk-select" style={{ maxWidth: 150 }} aria-label={`${b.label} unit`}
                  value={benefitOf(b.value).unit || b.unitOptions[0]}
                  onChange={(e) => setBenefit(b.value, { unit: e.target.value })}>
                  {b.unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              )}
              {b.note && (
                <input className="wk-input" style={{ flex: 1, minWidth: 170 }} placeholder="Short description"
                  aria-label="Benefit description" value={benefitOf(b.value).note || ''}
                  onChange={(e) => setBenefit(b.value, { note: e.target.value })} />
              )}
            </div>
          </div>
        ))}
      </Field>

      {askOvertime && (
        <Field label="Can extra hours be required?">
          <div className="emp-pay" style={{ marginTop: 4 }}>
            <button className="emp-pay-opt" aria-pressed={!job.overtimeExpected}
              onClick={() => set({ overtimeExpected: false, overtimePayBasis: null })}>
              <span className="mark" aria-hidden="true" />No
            </button>
            <button className="emp-pay-opt" aria-pressed={!!job.overtimeExpected}
              onClick={() => set({ overtimeExpected: true, overtimePayBasis: job.overtimePayBasis || 'PER_HOUR' })}>
              <span className="mark" aria-hidden="true" />Yes, sometimes
            </button>
          </div>
          {job.overtimeExpected && (
            <div style={{ marginTop: 12 }}>
              <div className="wk-sub" style={{ marginTop: 0, marginBottom: 8 }}>How is extra work paid?</div>
              <div className="emp-pay">
                {OVERTIME_BASES.map((o) => (
                  <button key={o.value} className="emp-pay-opt" aria-pressed={job.overtimePayBasis === o.value}
                    onClick={() => set({ overtimePayBasis: o.value })}>
                    <span className="mark" aria-hidden="true" />{o.label}
                  </button>
                ))}
              </div>
              {['PER_HOUR', 'FIXED_AMOUNT'].includes(job.overtimePayBasis) && (
                <input className="wk-input" style={{ maxWidth: 190, marginTop: 10 }} type="number" min={0}
                  placeholder="₹ amount" aria-label="Extra hours rate" value={job.overtimeRate || ''}
                  onChange={(e) => set({ overtimeRate: e.target.value })} />
              )}
            </div>
          )}
        </Field>
      )}

      <div className="wk-card" style={{ marginTop: 18, background: 'var(--blue-50)', borderColor: 'var(--blue-100)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span className="mk-icon-box sm green" style={{ width: 34, height: 34, marginBottom: 0 }} aria-hidden="true">
            <Icon name="lock" size={16} />
          </span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Payment through JobOn</div>
            <p className="wk-sub" style={{ marginTop: 4 }}>
              You pay JobOn and we pay the worker once the work is confirmed.
              {model?.payroll === 'MONTHLY' ? ' Salary runs on a monthly cycle.' : ' Funded before the work starts.'}
            </p>
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ================= Step 7 — hiring ================= */

export function StepHiring({ job, set }) {
  const model = durationOf(job.durationType)
  const options = hiringOptionsFor(model)

  return (
    <Section title="How do you want to hire?" sub="You can still change your mind after you see the applicants.">
      <div className="emp-radios">
        {options.map((k) => (
          <RadioRow key={k} on={job.hiringMethod === k} onClick={() => set({ hiringMethod: k })}
            icon={HIRING_METHODS[k].icon} title={HIRING_METHODS[k].label} sub={HIRING_METHODS[k].sub} />
        ))}
      </div>

      <div className="mk-note" style={{ marginTop: 16 }}>
        {model?.offerType === 'NONE'
          ? 'For a one-day job there is no offer letter — you pick a worker and they accept.'
          : `After you select someone we’ll send a ${model?.offerTitle}.`}
      </div>

      <Field label="Last date to apply" htmlFor="hr-deadline" hint="Optional.">
        <input id="hr-deadline" className="wk-input" type="date" style={{ maxWidth: 260 }}
          min={new Date().toISOString().slice(0, 10)}
          value={job.applicationDeadline || ''}
          onChange={(e) => set({ applicationDeadline: e.target.value })} />
      </Field>

      <label className="wk-checkrow" style={{ marginTop: 6 }}>
        <input type="checkbox" checked={job.autoCloseWhenFilled}
          onChange={(e) => set({ autoCloseWhenFilled: e.target.checked })} />
        Close the job automatically once all workers are hired
      </label>
    </Section>
  )
}
