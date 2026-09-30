import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { useDocumentTitle } from '../../../marketing/components'
import { ErrorNote } from '../../../worker/components'
import { Stepper } from '../../../onboarding/components'
import { createJob, updateJob, getJob, timeLabel } from '../api'
import {
  WORKER_CATEGORIES, EXPERIENCE_LEVELS, LANGUAGE_OPTIONS, GENDER_PREFS,
  AGE_RANGES, RESPONSIBILITY_SUGGESTIONS, SKILL_SUGGESTIONS, WIZARD_STEPS, EMPTY_JOB,
} from '../jobForm'
import {
  StepDuration, StepSchedule, StepPay, StepHiring, usePlatformFee,
} from './JobWizardSteps'
import {
  durationOf, DAYS, BENEFIT_TYPES, HIRING_METHODS, whatHappensNext,
  calculateSchedule, calculateEarnings, calculateCost, scheduleReady,
  PAY_BASIS_SUFFIX, WORK_PATTERN_LABEL, fmtDate, money,
} from '../engagement'

const LAST = WIZARD_STEPS.length - 1
const toggle = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

export default function PostJob() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const editingId = params.get('edit')
  const step = Math.min(LAST, Math.max(0, Number(params.get('step') || 0)))
  const feePercent = usePlatformFee()

  const [job, setJob] = useState(EMPTY_JOB)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [published, setPublished] = useState(null)

  useDocumentTitle(published ? 'Job posted' : editingId ? 'Edit job' : 'Post a job')

  useEffect(() => {
    if (!editingId) return
    getJob(editingId)
      .then((d) => setJob({
        ...EMPTY_JOB,
        ...d,
        durationType: d.engagementModel || EMPTY_JOB.durationType,
        shifts: d.shifts?.length ? d.shifts : EMPTY_JOB.shifts,
        benefits: d.jobBenefits || [],
      }))
      .catch(() => setError('We could not load that job.'))
  }, [editingId])

  const set = useCallback((patch) => setJob((j) => ({ ...j, ...patch })), [])
  const goto = (n) => {
    const next = new URLSearchParams(params)
    next.set('step', String(n))
    setParams(next)
    window.scrollTo(0, 0)
  }

  const invalid = validate(job, step)

  const submit = async (draft) => {
    setBusy(true); setError('')
    const model = durationOf(job.durationType)
    const sched = calculateSchedule(job)
    const [ageMin, ageMax] = (job.ageRange || '').split('-')
    const jobBenefits = (job.benefits || []).map((b) => ({
      benefitType: b.benefitType,
      amount: b.amount === '' || b.amount == null ? null : Number(b.amount),
      unit: b.unit || null,
      note: b.note || null,
    }))

    const body = {
      ...job,
      draft,
      // The server keeps duration (ONE_DAY…) and the ongoing/fixed flag separately.
      engagementModel: job.durationType,
      // durationType means "bounded by an explicit end date". A month count is its
      // own bound, so those jobs are sent without one.
      durationType: (model?.scheduleVariant === 'RECURRING_ONGOING'
        || (model?.value === 'MONTHS' && Number(job.durationMonths) > 0))
        ? 'ONGOING' : 'SPECIFIC',
      workPattern: sched.workPattern,
      workDate: sched.isSingleDate ? job.workDate || null : null,
      startDate: sched.isSingleDate ? job.workDate || null : job.startDate || null,
      // The server takes a month count OR an end date, never both.
      endDate: sched.isSingleDate ? job.workDate || null
        : sched.isOngoing ? null
          : (model?.value === 'MONTHS' && Number(job.durationMonths) > 0) ? null
            : job.endDate || null,
      durationMonths: model?.value === 'MONTHS' && Number(job.durationMonths) > 0
        ? Number(job.durationMonths) : null,
      salary: Number(job.salary) || 0,
      workersNeeded: Number(job.workersNeeded) || 1,
      minExperienceYears: Number(job.minExperienceYears) || 0,
      overtimeRate: job.overtimeRate === '' || job.overtimeRate == null ? null : Number(job.overtimeRate),
      ageMin: ageMin ? Number(ageMin) : null,
      ageMax: ageMax ? Number(ageMax) : null,
      applicationDeadline: job.applicationDeadline || null,
      jobBenefits,
      benefits: jobBenefits.map((b) => b.benefitType),
      paymentMode: 'SKILLBRIDGE',
    }
    delete body.ageRange

    try {
      const saved = editingId ? await updateJob(editingId, body) : await createJob(body)
      if (draft) navigate('/employer/jobs?status=DRAFT')
      else setPublished({ ...saved, durationType: job.durationType })
    } catch (e) {
      setError(e?.response?.data?.message || 'We could not save this job. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (published) return <Published job={published} />

  return (
    <>
      <div className="wk-row" style={{ marginBottom: 16 }}>
        <Link className="wk-bell" to="/employer/jobs" aria-label="Back to my jobs">
          <Icon name="chevronLeft" size={18} />
        </Link>
        <div className="grow">
          <h1 className="wk-h1">{editingId ? 'Edit job' : 'Post a job'}</h1>
          <p className="wk-sub">Step {step + 1} of {WIZARD_STEPS.length} · {WIZARD_STEPS[step]}</p>
        </div>
        {step > 0 && (
          <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={() => submit(true)} disabled={busy}>
            Save draft
          </button>
        )}
      </div>

      <div className="wk-card pad-lg">
        <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
          <div style={{ minWidth: 580 }}>
            <Stepper steps={WIZARD_STEPS} current={step} />
          </div>
        </div>

        <ErrorNote>{error}</ErrorNote>

        {step === 0 && <StepCategory job={job} set={set} />}
        {step === 1 && <StepDuration job={job} set={set} />}
        {step === 2 && <StepDetails job={job} set={set} />}
        {step === 3 && <StepSchedule job={job} set={set} />}
        {step === 4 && <StepPay job={job} set={set} feePercent={feePercent} onEditSchedule={() => goto(3)} />}
        {step === 5 && <StepRequirements job={job} set={set} />}
        {step === 6 && <StepHiring job={job} set={set} />}
        {step === 7 && <StepReview job={job} onEdit={goto} feePercent={feePercent} />}

        <div className="ob-nav">
          {step === 0 ? (
            <Link className="ob-back" to="/employer/jobs">Cancel</Link>
          ) : (
            <button className="ob-back" onClick={() => goto(step - 1)}>
              <Icon name="chevronLeft" size={16} /> Back
            </button>
          )}
          <span className="grow" />
          {step < LAST ? (
            <button className="mk-btn mk-btn-primary" style={{ minWidth: 150, opacity: invalid ? 0.6 : 1 }}
              disabled={!!invalid} title={invalid || undefined} onClick={() => goto(step + 1)}>
              Continue <Icon name="arrowRight" size={17} />
            </button>
          ) : (
            <button className="mk-btn mk-btn-primary" style={{ minWidth: 150 }} disabled={busy}
              onClick={() => submit(false)}>
              {busy ? 'Posting…' : 'Post Job'}
            </button>
          )}
        </div>
        {invalid && <p className="wk-sub" style={{ textAlign: 'right' }}>{invalid}</p>}
      </div>
    </>
  )
}

/** Plain-language validation, checked on the step where it can be fixed. */
function validate(j, step) {
  if (step === 0 && !j.workerCategory) return 'Choose the kind of worker you need'
  if (step === 1 && !j.durationType) return 'Choose how long you need the worker'
  if (step === 2) {
    if (!j.title.trim()) return 'Add a job title'
    if (!Number(j.workersNeeded)) return 'How many workers do you need?'
  }
  if (step === 3) return scheduleReady(j, calculateSchedule(j))
  if (step === 4) {
    if (!(Number(j.salary) > 0)) return 'Add how much you will pay'
    const allowed = durationOf(j.durationType)?.allowedPayBasis || []
    if (allowed.length && !allowed.includes(j.salaryUnit)) return 'Choose a pay type for this job'
    if (j.overtimeExpected && !j.overtimePayBasis) return 'Choose how extra hours are paid'
  }
  if (step === 5 && !j.requiredSkills.length) return 'Add at least one skill'
  if (step === 6 && !j.hiringMethod) return 'Choose how you want to hire'
  return ''
}

/* ---------- 1. worker type ---------- */
function StepCategory({ job, set }) {
  return (
    <Section title="What type of worker do you need?" sub="Select the category that best matches your requirement.">
      <div className="emp-cats">
        {WORKER_CATEGORIES.map((c) => {
          const on = job.workerCategory === c.value
          return (
            <button
              key={c.value}
              className="emp-cat"
              aria-pressed={on}
              onClick={() => set({
                workerCategory: c.value,
                title: job.title || (c.value === 'OTHER' ? '' : c.label),
                responsibilities: job.responsibilities.length
                  ? job.responsibilities
                  : RESPONSIBILITY_SUGGESTIONS[c.value] || [],
              })}
            >
              {on && <span className="chk"><Icon name="check" size={12} strokeWidth={3.5} /></span>}
              <span className={`ic mk-icon-box ${c.tone}`} style={{ marginBottom: 0 }} aria-hidden="true">
                <Icon name={c.icon} size={18} />
              </span>
              <span className="nm" style={{ display: 'block', marginTop: 10 }}>{c.label}</span>
              <span className="sb">{c.sub}</span>
            </button>
          )
        })}
      </div>
    </Section>
  )
}


/* ---------- 4. job details ---------- */
function StepDetails({ job, set }) {
  const [draft, setDraft] = useState('')
  const suggestions = (RESPONSIBILITY_SUGGESTIONS[job.workerCategory] || [])
    .filter((s) => !job.responsibilities.includes(s))

  const add = (text) => {
    const v = (text || '').trim()
    if (!v || job.responsibilities.includes(v)) return
    set({ responsibilities: [...job.responsibilities, v] })
    setDraft('')
  }

  return (
    <Section title="Job details" sub="Provide basic information about the job.">
      <div className="emp-two">
        <div className="wk-field">
          <label htmlFor="pj-title">Job Title</label>
          <input id="pj-title" className="wk-input" placeholder="Store Helper"
            value={job.title} onChange={(e) => set({ title: e.target.value })} />
        </div>
        <div className="wk-field">
          <label htmlFor="pj-openings">Number of Openings</label>
          <input id="pj-openings" className="wk-input" type="number" min={1} max={99}
            value={job.workersNeeded} onChange={(e) => set({ workersNeeded: e.target.value })} />
        </div>
      </div>

      <div className="wk-field" style={{ marginTop: 14 }}>
        <label htmlFor="pj-desc">Job Description</label>
        <textarea
          id="pj-desc" className="emp-textarea" maxLength={500}
          placeholder="We are looking for store helpers to assist with shelf arrangement, customer support, billing support and basic cleaning."
          value={job.description}
          onChange={(e) => set({ description: e.target.value })}
        />
        <div className="emp-counter">{job.description.length}/500</div>
      </div>

      <div className="wk-field" style={{ marginTop: 6 }}>
        <label>Key Responsibilities</label>
        <div className="emp-chipbox">
          {job.responsibilities.map((r) => (
            <span className="emp-chip" key={r}>
              {r}
              <button onClick={() => set({ responsibilities: job.responsibilities.filter((x) => x !== r) })}
                aria-label={`Remove ${r}`}>
                <Icon name="close" size={12} strokeWidth={2.6} />
              </button>
            </span>
          ))}
          <input
            className="wk-input"
            style={{ border: 0, flex: 1, minWidth: 150, padding: '4px 2px' }}
            placeholder="Add a responsibility and press Enter"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(draft) } }}
            onBlur={() => add(draft)}
          />
        </div>
        {suggestions.length > 0 && (
          <div className="mk-chips" style={{ marginTop: 10 }}>
            {suggestions.map((s) => (
              <button className="emp-chip-add" key={s} onClick={() => add(s)}>+ {s}</button>
            ))}
          </div>
        )}
      </div>
    </Section>
  )
}

/* ---------- 7. worker requirements ---------- */
function StepRequirements({ job, set }) {
  const [skill, setSkill] = useState('')
  const addSkill = (text) => {
    const v = (text || '').trim()
    if (!v || job.requiredSkills.includes(v)) return
    set({ requiredSkills: [...job.requiredSkills, v] })
    setSkill('')
  }
  const suggestions = SKILL_SUGGESTIONS.filter((s) => !job.requiredSkills.includes(s)).slice(0, 8)

  return (
    <Section title="Worker requirements" sub="Set the skills, experience and other requirements.">
      <div className="wk-field">
        <label>Required Skills</label>
        <div className="emp-chipbox">
          {job.requiredSkills.map((s) => (
            <span className="emp-chip" key={s}>
              {s}
              <button onClick={() => set({ requiredSkills: job.requiredSkills.filter((x) => x !== s) })}
                aria-label={`Remove ${s}`}>
                <Icon name="close" size={12} strokeWidth={2.6} />
              </button>
            </span>
          ))}
          <input
            className="wk-input" style={{ border: 0, flex: 1, minWidth: 140, padding: '4px 2px' }}
            placeholder="Add a skill" value={skill}
            onChange={(e) => setSkill(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skill) } }}
            onBlur={() => addSkill(skill)}
          />
        </div>
        {suggestions.length > 0 && (
          <div className="mk-chips" style={{ marginTop: 10 }}>
            {suggestions.map((s) => <button className="emp-chip-add" key={s} onClick={() => addSkill(s)}>+ {s}</button>)}
          </div>
        )}
      </div>

      <div className="wk-field" style={{ marginTop: 18 }}>
        <label htmlFor="pj-exp">Minimum Experience</label>
        <select id="pj-exp" className="wk-select" value={job.minExperienceYears}
          onChange={(e) => set({ minExperienceYears: Number(e.target.value) })}>
          {EXPERIENCE_LEVELS.map((x) => <option key={x.label} value={x.value}>{x.label}</option>)}
        </select>
      </div>

      <div className="wk-field" style={{ marginTop: 18 }}>
        <label>Languages</label>
        <div className="mk-chips">
          {LANGUAGE_OPTIONS.map((l) => (
            <button key={l} className="mk-chip" aria-pressed={job.languages.includes(l)}
              onClick={() => set({ languages: toggle(job.languages, l) })}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="emp-two" style={{ marginTop: 18 }}>
        <div className="wk-field">
          <label>Preferred Gender</label>
          <div className="emp-pay">
            {GENDER_PREFS.map((g) => (
              <button key={g.value} className="emp-pay-opt" aria-pressed={job.genderPreference === g.value}
                onClick={() => set({ genderPreference: g.value })}>
                <span className="mark" aria-hidden="true" />{g.label}
              </button>
            ))}
          </div>
        </div>
        <div className="wk-field">
          <label htmlFor="pj-age">Age Range (Optional)</label>
          <select id="pj-age" className="wk-select" value={job.ageRange}
            onChange={(e) => set({ ageRange: e.target.value })}>
            {AGE_RANGES.map((a) => <option key={a.label} value={a.value}>{a.label}</option>)}
          </select>
        </div>
      </div>

      {job.genderPreference !== 'ANY' && (
        <p className="wk-sub">
          Restricting a role by gender is only lawful where the job genuinely requires it.
          Most roles should stay set to “Any” — our community guidelines do not allow
          selection on gender otherwise.
        </p>
      )}
    </Section>
  )
}

/* ---------- 8. interview & hiring method ---------- */

/* ---------- 8. review ---------- */
function StepReview({ job, onEdit, feePercent }) {
  const cat = WORKER_CATEGORIES.find((c) => c.value === job.workerCategory)
  const model = durationOf(job.durationType)
  const sched = calculateSchedule(job)
  const earnings = calculateEarnings(job, sched)
  const cost = calculateCost(earnings.amount, feePercent)
  const days = (job.workingDays || []).map((d) => DAYS.find((x) => x.value === d)?.label).filter(Boolean).join(', ')
  const shift = job.shifts?.[0] || {}
  const benefitLabel = (b) => {
    const meta = BENEFIT_TYPES.find((x) => x.value === b.benefitType)
    const label = meta?.label || b.benefitType
    if (b.amount) return `${label} — ${money(b.amount)}${b.unit ? ` ${b.unit}` : ''}`
    if (b.note) return `${label} — ${b.note}`
    return label
  }

  const timeLine = shift.startTime
    ? `${timeLabel(shift.startTime)} – ${timeLabel(shift.endTime)}${shift.breakMinutes ? ` (${shift.breakMinutes} min break)` : ''}`
    : '—'

  return (
    <Section title="Check everything" sub="Make sure this is right before you post.">
      <div className="emp-review">
        <div className="hd">
          <span className={`mk-icon-box sm ${cat?.tone || ''}`} style={{ width: 30, height: 30, marginBottom: 0 }}>
            <Icon name={cat?.icon || 'briefcase'} size={16} />
          </span>
          <span className="nm">{job.title || 'Untitled job'}</span>
          <button className="wk-link" style={{ border: 0, background: 0, cursor: 'pointer', font: 'inherit' }}
            onClick={() => onEdit(2)}>Edit</button>
        </div>

        <Row k="How long" v={model?.label || '—'} />
        <Row k={sched.isSingleDate ? 'Date' : sched.isOngoing ? 'Joining from' : 'Dates'} v={sched.periodLabel} />
        {sched.usesWeekdays && <Row k="Working days" v={days || '—'} />}
        <Row k="Working time" v={timeLine} />
        {!sched.isSingleDate && (
          <Row k="Work days" v={`${sched.scheduledDays} ${sched.isOngoing ? 'days a month' : 'days'} · ${sched.paidHoursPerDay} hrs/day`} />
        )}
        <Row k="Workers needed" v={job.workersNeeded} />
        <Row k="Pay" v={
          <>
            <strong>{money(job.salary)}{PAY_BASIS_SUFFIX[job.salaryUnit] || ''}</strong>
            {earnings.amount > 0 && sched.scheduledDays > 1 && (
              <div className="wk-sub" style={{ marginTop: 2 }}>Worker pay about {money(earnings.amount)}</div>
            )}
          </>
        } />
        <Row k="You will pay" v={
          <>
            <strong style={{ color: 'var(--blue-dark)' }}>{money(cost.total)}</strong>
            <div className="wk-sub" style={{ marginTop: 2 }}>
              Worker gets {money(cost.workerPay)} · JobOn fee {cost.percent}% {money(cost.fee)}
            </div>
          </>
        } />
        {(job.benefits || []).length > 0 && (
          <Row k="Extras" v={<ul>{job.benefits.map((b) => <li key={b.benefitType}>{benefitLabel(b)}</li>)}</ul>} />
        )}
        {job.requiredSkills.length > 0 && <Row k="Skills" v={job.requiredSkills.join(', ')} />}
        {job.languages.length > 0 && <Row k="Languages" v={job.languages.join(', ')} />}
        <Row k="Experience" v={EXPERIENCE_LEVELS.find((x) => x.value === job.minExperienceYears)?.label || 'No experience needed'} />
        <Row k="Hiring" v={HIRING_METHODS[job.hiringMethod]?.label || '—'} />
        <Row k="Payment" v={model?.payroll === 'MONTHLY'
          ? 'Monthly payroll through JobOn'
          : 'Through JobOn, after the work is confirmed'} />
      </div>

      <div className="wk-card" style={{ marginTop: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>What happens next?</div>
        <div style={{ display: 'grid', gap: 9, marginTop: 12 }}>
          {whatHappensNext(model).map((s, i) => (
            <div key={s} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: 'var(--body)' }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: 'var(--blue-50)', color: 'var(--blue-dark)',
                display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700,
              }}>{i + 1}</span>
              {s}
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

function Published({ job }) {
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/worker/jobs/${job.id}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="wk-card">
        <div className="emp-success" style={{ padding: '36px 20px' }}>
          <div className="tick">
            <span className="emp-confetti" aria-hidden="true">
              {[['6%', '14%', '#2563eb'], ['88%', '10%', '#f59e0b'], ['0%', '54%', '#10b981'],
                ['94%', '48%', '#ef4444'], ['18%', '90%', '#8b5cf6'], ['76%', '88%', '#0ea5e9']]
                .map(([left, top, bg], i) => <span key={i} style={{ left, top, background: bg }} />)}
            </span>
            <Icon name="check" size={44} strokeWidth={3} />
          </div>
          <h1>Your job is now live!</h1>
          <p>You will start receiving applications soon.</p>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <Link className="mk-btn mk-btn-primary" style={{ flex: 1 }} to={`/employer/jobs/${job.id}`}>
              View Job
            </Link>
            <Link className="mk-btn mk-btn-outline" style={{ flex: 1 }} to="/employer/post-job?step=0" reloadDocument>
              Post Another Job
            </Link>
          </div>
        </div>
      </div>

      <div className="wk-card" style={{ marginTop: 14 }}>
        <div className="wk-row" style={{ alignItems: 'flex-start' }}>
          <span className="mk-icon-box sm" style={{ width: 32, height: 32, marginBottom: 0 }} aria-hidden="true">
            <Icon name="globe" size={16} />
          </span>
          <div className="grow">
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Share to get more applications</div>
            <div className="wk-sub" style={{ marginTop: 2 }}>Share this job link with your network.</div>
          </div>
        </div>
        <div className="wk-bar" style={{ marginTop: 12 }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: 'var(--body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {link}
          </span>
          <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={copy}>
            <Icon name={copied ? 'check' : 'doc'} size={14} /> {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- small shared bits ---------- */

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
      <span className="ic" aria-hidden="true"><Icon name={icon} size={17} /></span>
      <span style={{ minWidth: 0 }}>
        <span className="t" style={{ display: 'block' }}>{title}</span>
        <span className="d">{sub}</span>
      </span>
      <span className="mark" aria-hidden="true">
        {on && <Icon name="check" size={11} strokeWidth={4} />}
      </span>
    </button>
  )
}

function Row({ k, v }) {
  return (
    <div className="r">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  )
}
