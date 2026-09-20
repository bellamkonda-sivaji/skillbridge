import React, { useState } from 'react'
import Icon from '../../../marketing/icons'
import { DAYS } from '../jobForm'
import {
  ENGAGEMENT_MODELS, modelOf, PAY_BASIS_LABEL, PAY_BASIS_SUFFIX, SHIFT_ARRANGEMENTS,
  BENEFIT_TYPES, OVERTIME_BASES, calculateSchedule, calculateEarnings,
} from '../engagement'

const money = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN')
const toggle = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

function Section({ title, sub, children }) {
  return (
    <div style={{ marginTop: 6 }}>
      <h2 className="wk-h2">{title}</h2>
      <p className="wk-sub" style={{ marginBottom: 18 }}>{sub}</p>
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

/* ================= Step 2 — engagement model ================= */

export function StepEmployment({ job, set }) {
  const choose = (m) => {
    // Switching model resets anything the new model cannot express.
    const patch = { engagementModel: m.value, employmentType: m.value }
    if (!m.payBases.includes(job.salaryUnit)) patch.salaryUnit = m.defaultPay
    if (m.duration === 'ONGOING_ONLY') { patch.durationType = 'ONGOING'; patch.startDate = ''; patch.endDate = '' }
    if (m.duration === 'FIXED_ONLY') patch.durationType = 'SPECIFIC'
    if (m.scheduleMode === 'SINGLE_DATE') patch.durationType = 'SPECIFIC'
    set(patch)
  }

  return (
    <Section title="Select employment type" sub="This decides how the schedule and the wage are set up.">
      <div className="emp-radios">
        {ENGAGEMENT_MODELS.map((m) => (
          <RadioRow key={m.value} on={job.engagementModel === m.value} onClick={() => choose(m)}
            icon={m.icon} title={m.label} sub={m.sub} />
        ))}
      </div>
      {job.engagementModel && (
        <p className="wk-sub">
          Pay can be set {modelOf(job.engagementModel).payBases.map((p) => PAY_BASIS_LABEL[p].toLowerCase()).join(', ')} for this type.
        </p>
      )}
    </Section>
  )
}

/* ================= Step 4 — schedule ================= */

export function StepSchedule({ job, set }) {
  const model = modelOf(job.engagementModel)
  const sched = calculateSchedule(job)
  const mode = model?.scheduleMode || 'RECURRING'
  const setShift = (i, patch) => set({ shifts: job.shifts.map((s, n) => (n === i ? { ...s, ...patch } : s)) })

  return (
    <Section title="Work schedule" sub={`Set the dates, timings and duration for ${model ? model.label.toLowerCase() : 'this job'}.`}>
      {/* --- dates / days, by engagement model --- */}
      {mode === 'SINGLE_DATE' ? (
        <div className="wk-field" style={{ maxWidth: 260 }}>
          <label htmlFor="sc-date">Work Date</label>
          <input id="sc-date" className="wk-input" type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={job.workDate || ''}
            onChange={(e) => set({ workDate: e.target.value, startDate: e.target.value, endDate: e.target.value })} />
        </div>
      ) : (
        <>
          {(mode === 'DATE_RANGE' || job.durationType === 'SPECIFIC') && (
            <div className="emp-two">
              <div className="wk-field">
                <label htmlFor="sc-start">Start date</label>
                <input id="sc-start" className="wk-input" type="date" value={job.startDate || ''}
                  onChange={(e) => set({ startDate: e.target.value })} />
              </div>
              <div className="wk-field">
                <label htmlFor="sc-end">End date</label>
                <input id="sc-end" className="wk-input" type="date" value={job.endDate || ''}
                  min={job.startDate || undefined}
                  onChange={(e) => set({ endDate: e.target.value })} />
              </div>
            </div>
          )}

          <div className="wk-field" style={{ marginTop: 14 }}>
            <label>{mode === 'DATE_RANGE' ? 'Working days within this period' : 'Working Days'}</label>
            <div className="emp-days">
              {DAYS.map((d) => (
                <button key={d.value} className="emp-day" aria-pressed={job.workingDays.includes(d.value)}
                  onClick={() => set({ workingDays: toggle(job.workingDays, d.value) })}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* --- shifts --- */}
      <div className="wk-field" style={{ marginTop: 20 }}>
        <label>Shift Timings</label>
        {job.shifts.map((s, i) => (
          <div key={i}>
            <div className="emp-shift">
              <span className="lbl">Shift {i + 1}</span>
              <input type="time" value={s.startTime} aria-label={`Shift ${i + 1} start`}
                onChange={(e) => setShift(i, { startTime: e.target.value })} />
              <span aria-hidden="true" style={{ color: 'var(--muted)' }}>→</span>
              <input type="time" value={s.endTime} aria-label={`Shift ${i + 1} end`}
                onChange={(e) => setShift(i, { endTime: e.target.value })} />
              {job.shifts.length > 1 && (
                <button className="del" aria-label={`Remove shift ${i + 1}`}
                  onClick={() => set({ shifts: job.shifts.filter((_, n) => n !== i) })}>
                  <Icon name="close" size={15} />
                </button>
              )}
            </div>
            <div className="emp-shift" style={{ paddingLeft: 12 }}>
              <span className="lbl" style={{ fontWeight: 500, color: 'var(--muted)' }}>Break</span>
              <input type="time" value={s.breakStart || ''} aria-label={`Shift ${i + 1} break start`}
                onChange={(e) => setShift(i, { breakStart: e.target.value })} />
              <span aria-hidden="true" style={{ color: 'var(--muted)' }}>→</span>
              <input type="time" value={s.breakEnd || ''} aria-label={`Shift ${i + 1} break end`}
                onChange={(e) => setShift(i, { breakEnd: e.target.value })} />
            </div>
          </div>
        ))}

        <button className="mk-btn mk-btn-outline mk-btn-sm" style={{ marginTop: 4 }}
          onClick={() => set({ shifts: [...job.shifts, { label: `Shift ${job.shifts.length + 1}`, startTime: '16:00', endTime: '20:00', breakStart: '', breakEnd: '' }] })}>
          <Icon name="sparkles" size={14} /> Add Shift
        </button>

        <label className="wk-checkrow" style={{ marginTop: 12 }}>
          <input type="checkbox" checked={!!job.breakPaid} onChange={(e) => set({ breakPaid: e.target.checked })} />
          Break time is paid
        </label>
      </div>

      {/* --- shift arrangement: only meaningful with more than one shift --- */}
      {job.shifts.length > 1 && (
        <div className="wk-field" style={{ marginTop: 18 }}>
          <label>Shift arrangement</label>
          <div className="emp-radios">
            {SHIFT_ARRANGEMENTS.map((a) => (
              <RadioRow key={a.value} on={(job.shiftArrangement || 'ALL_SHIFTS') === a.value}
                onClick={() => set({ shiftArrangement: a.value })} title={a.label} sub={a.sub} />
            ))}
          </div>
        </div>
      )}

      {/* --- duration, only where the model allows a choice --- */}
      {model?.duration === 'EITHER' && (
        <div className="wk-field" style={{ marginTop: 18 }}>
          <label>Job Duration</label>
          <div className="emp-radios">
            <RadioRow on={job.durationType !== 'SPECIFIC'} onClick={() => set({ durationType: 'ONGOING', startDate: '', endDate: '' })}
              icon="clock" title="Ongoing" sub="No fixed end date" />
            <RadioRow on={job.durationType === 'SPECIFIC'} onClick={() => set({ durationType: 'SPECIFIC' })}
              icon="calendar" title="Fixed term" sub="Runs between two dates" />
          </div>
        </div>
      )}
      {model?.duration === 'ONGOING_ONLY' && (
        <p className="wk-sub" style={{ marginTop: 18 }}>
          Permanent roles run ongoing with no end date.
        </p>
      )}
      {model?.duration === 'FIXED_ONLY' && mode !== 'SINGLE_DATE' && (
        <p className="wk-sub" style={{ marginTop: 18 }}>
          {model.label} work always runs between a start and an end date.
        </p>
      )}

      <ScheduleSummary sched={sched} model={model} />
    </Section>
  )
}

/** The calculated figures the employer needs before picking a wage. */
function ScheduleSummary({ sched, model, compact, onEdit }) {
  return (
    <div className="wk-card" style={{ marginTop: 20, background: 'var(--blue-50)', borderColor: 'var(--blue-100)' }}>
      <div className="wk-row" style={{ alignItems: 'flex-start' }}>
        <div className="grow">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
            {compact ? 'Work schedule' : 'Calculated from this schedule'}
          </div>
          <div className="wk-sub" style={{ marginTop: 2 }}>
            {model?.label}{sched.isOngoing ? ' · Ongoing' : ''} · {sched.periodLabel}
          </div>
        </div>
        {onEdit && (
          <button className="wk-link" style={{ border: 0, background: 0, cursor: 'pointer', font: 'inherit' }} onClick={onEdit}>
            Edit Schedule
          </button>
        )}
      </div>

      <div className="wk-facts" style={{ marginTop: 12 }}>
        <Fact k="Paid hours / day" v={sched.paidHoursPerDay || '—'} />
        <Fact k="Paid hours / week" v={sched.paidHoursPerWeek || '—'} />
        <Fact k={sched.isOngoing ? 'Working days / month' : 'Working days'} v={sched.scheduledDays || '—'} />
        <Fact k={sched.isOngoing ? 'Paid hours / month' : 'Expected paid hours'} v={sched.expectedPaidHours || '—'} />
      </div>

      {sched.warnings.map((w) => (
        <p key={w} className="wk-sub" style={{ color: '#b45309' }}>{w}</p>
      ))}
    </div>
  )
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

/* ================= Step 5 — salary ================= */

export function StepSalary({ job, set, onEditSchedule }) {
  const model = modelOf(job.engagementModel)
  const sched = calculateSchedule(job)
  const allowed = model?.payBases || ['PER_DAY']
  const earnings = calculateEarnings(job, sched)

  const setBenefit = (type, patch) => {
    const list = job.benefits || []
    const existing = list.find((b) => b.benefitType === type)
    set({
      benefits: existing
        ? list.map((b) => (b.benefitType === type ? { ...b, ...patch } : b))
        : [...list, { benefitType: type, ...patch }],
    })
  }
  const hasBenefit = (type) => (job.benefits || []).some((b) => b.benefitType === type)
  const benefitOf = (type) => (job.benefits || []).find((b) => b.benefitType === type) || {}
  const toggleBenefit = (type) =>
    hasBenefit(type)
      ? set({ benefits: (job.benefits || []).filter((b) => b.benefitType !== type) })
      : setBenefit(type, {})

  return (
    <Section title="Salary & benefits" sub="The pay options below come from the employment type and schedule you set.">
      <ScheduleSummary sched={sched} model={model} compact onEdit={onEditSchedule} />

      <div className="wk-field" style={{ marginTop: 20 }}>
        <label>Salary Type</label>
        <div className="emp-pay">
          {allowed.map((p) => (
            <button key={p} className="emp-pay-opt" aria-pressed={job.salaryUnit === p}
              onClick={() => set({ salaryUnit: p })}>
              <span className="mark" aria-hidden="true" />{PAY_BASIS_LABEL[p]}
            </button>
          ))}
        </div>
        <p className="wk-sub">
          {model ? `${model.label} roles are normally paid ${PAY_BASIS_LABEL[model.defaultPay].toLowerCase()}.` : ''}
        </p>
      </div>

      <div className="wk-field" style={{ marginTop: 6, maxWidth: 320 }}>
        <label htmlFor="sal-amount">Wage ({PAY_BASIS_LABEL[job.salaryUnit] || '—'}) in ₹</label>
        <input id="sal-amount" className="wk-input" type="number" min={0} placeholder="700"
          value={job.salary} onChange={(e) => set({ salary: e.target.value })} />
      </div>

      {/* --- estimate --- */}
      {Number(job.salary) > 0 && sched.scheduledDays > 0 && (
        <div className="wk-card" style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Pay summary</div>
          <div className="emp-kv-grid" style={{ marginTop: 12 }}>
            <KV k="Worker wage" v={`${money(job.salary)}${PAY_BASIS_SUFFIX[job.salaryUnit] || ''}`} />
            <KV k={sched.isOngoing && job.salaryUnit === 'PER_MONTH' ? 'Monthly' : 'Estimated for the period'}
              v={<><strong>{money(earnings.amount)}</strong>{earnings.label ? <div className="wk-sub" style={{ marginTop: 2 }}>{earnings.label}</div> : null}</>} />
            <KV k="SkillBridge fee" v={<span className="wk-sub" style={{ marginTop: 0 }}>As per your plan — confirmed before you fund</span>} />
            <KV k="Worker receives" v={<strong>{money(earnings.amount)}</strong>} />
          </div>
          <p className="wk-sub">
            This is an estimate from the schedule. The amount actually paid comes from
            approved attendance — if a worker completes 9 of 10 scheduled days, they are
            paid for 9.
          </p>
        </div>
      )}

      {/* --- benefits --- */}
      <div className="wk-field" style={{ marginTop: 22 }}>
        <label>Benefits &amp; Additional Pay (Optional)</label>
        <div className="wk-checks">
          {BENEFIT_TYPES.map((b) => (
            <label className="wk-checkrow" key={b.value}>
              <input type="checkbox" checked={hasBenefit(b.value)} onChange={() => toggleBenefit(b.value)} />
              {b.label}
            </label>
          ))}
        </div>

        {BENEFIT_TYPES.filter((b) => hasBenefit(b.value) && (b.amount || b.note)).map((b) => (
          <div key={b.value} className="wk-card" style={{ marginTop: 10, padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>{b.label}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {b.amount && (
                <input className="wk-input" style={{ maxWidth: 150 }} type="number" min={0}
                  placeholder={b.amountLabel || '₹ amount'}
                  aria-label={`${b.label} amount`}
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
                <input className="wk-input" style={{ flex: 1, minWidth: 180 }}
                  placeholder="Describe this benefit" aria-label="Benefit description"
                  value={benefitOf(b.value).note || ''}
                  onChange={(e) => setBenefit(b.value, { note: e.target.value })} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* --- overtime --- */}
      <div className="wk-field" style={{ marginTop: 22 }}>
        <label>Overtime</label>
        <div className="emp-radios">
          <RadioRow on={!job.overtimeExpected} onClick={() => set({ overtimeExpected: false, overtimePayBasis: null })}
            icon="clock" title="No overtime expected" />
          <RadioRow on={!!job.overtimeExpected} onClick={() => set({ overtimeExpected: true, overtimePayBasis: job.overtimePayBasis || 'PER_HOUR' })}
            icon="trending" title="Overtime may be required" />
        </div>
        {job.overtimeExpected && (
          <div style={{ marginTop: 12 }}>
            <div className="wk-sub" style={{ marginTop: 0, marginBottom: 8 }}>Overtime payment</div>
            <div className="emp-pay">
              {OVERTIME_BASES.map((o) => (
                <button key={o.value} className="emp-pay-opt" aria-pressed={job.overtimePayBasis === o.value}
                  onClick={() => set({ overtimePayBasis: o.value })}>
                  <span className="mark" aria-hidden="true" />{o.label}
                </button>
              ))}
            </div>
            {['PER_HOUR', 'FIXED_AMOUNT'].includes(job.overtimePayBasis) && (
              <input className="wk-input" style={{ maxWidth: 200, marginTop: 10 }} type="number" min={0}
                placeholder="₹ amount" aria-label="Overtime rate"
                value={job.overtimeRate || ''}
                onChange={(e) => set({ overtimeRate: e.target.value })} />
            )}
          </div>
        )}
      </div>

      {/* --- payment, SkillBridge-managed only --- */}
      <div className="wk-field" style={{ marginTop: 22 }}>
        <label>Payment</label>
        <div className="wk-card" style={{ background: 'var(--blue-50)', borderColor: 'var(--blue-100)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span className="mk-icon-box sm green" style={{ width: 34, height: 34, marginBottom: 0 }} aria-hidden="true">
              <Icon name="lock" size={16} />
            </span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                Payment handled through SkillBridge
              </div>
              <p className="wk-sub" style={{ marginTop: 4 }}>
                You fund the wage through SkillBridge and the worker is paid through the
                platform once attendance is confirmed. This is what gives both sides a
                payment record.
              </p>
              <p className="wk-sub" style={{ marginTop: 6 }}>
                <strong>
                  {model?.payroll === 'MONTHLY'
                    ? 'Monthly payroll — salary is funded and released each pay cycle.'
                    : 'Funded before work begins, released once the work is confirmed.'}
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

function KV({ k, v }) {
  return (
    <div className="r">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  )
}
