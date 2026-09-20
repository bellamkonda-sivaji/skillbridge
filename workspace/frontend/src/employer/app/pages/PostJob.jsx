import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { useDocumentTitle } from '../../../marketing/components'
import { ErrorNote } from '../../../worker/components'
import { Stepper } from '../../../onboarding/components'
import { createJob, updateJob, getJob, pay, timeLabel } from '../api'
import {
  WORKER_CATEGORIES, DAYS, EXPERIENCE_LEVELS, LANGUAGE_OPTIONS, GENDER_PREFS,
  AGE_RANGES, INTERVIEW_TYPES, RESPONSIBILITY_SUGGESTIONS, SKILL_SUGGESTIONS,
  WIZARD_STEPS, EMPTY_JOB,
} from '../jobForm'
import { StepEmployment, StepSchedule, StepSalary } from './JobWizardSteps'
import {
  modelOf, calculateSchedule, calculateEarnings, scheduleReady,
  PAY_BASIS_LABEL, PAY_BASIS_SUFFIX, BENEFIT_TYPES,
} from '../engagement'

const LAST = WIZARD_STEPS.length - 1
const toggle = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

export default function PostJob() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const editingId = params.get('edit')
  const step = Math.min(LAST, Math.max(0, Number(params.get('step') || 0)))

  const [job, setJob] = useState(EMPTY_JOB)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [published, setPublished] = useState(null)

  useDocumentTitle(published ? 'Job published' : editingId ? 'Edit job' : 'Post a job')

  // Editing an existing job reuses the same wizard.
  useEffect(() => {
    if (!editingId) return
    getJob(editingId)
      .then((d) => setJob({
        ...EMPTY_JOB,
        ...d,
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
    const [ageMin, ageMax] = (job.ageRange || '').split('-')
    // The API keeps a legacy list of benefit names alongside the structured rows.
    const jobBenefits = (job.benefits || []).map((b) => ({
      benefitType: b.benefitType,
      amount: b.amount === '' || b.amount == null ? null : Number(b.amount),
      unit: b.unit || null,
      note: b.note || null,
    }))
    const body = {
      ...job,
      draft,
      jobBenefits,
      benefits: jobBenefits.map((b) => b.benefitType),
      overtimeRate: job.overtimeRate === '' || job.overtimeRate == null ? null : Number(job.overtimeRate),
      salary: Number(job.salary) || 0,
      workersNeeded: Number(job.workersNeeded) || 1,
      minExperienceYears: Number(job.minExperienceYears) || 0,
      ageMin: ageMin ? Number(ageMin) : null,
      ageMax: ageMax ? Number(ageMax) : null,
      applicationDeadline: job.applicationDeadline || null,
      startDate: job.durationType === 'SPECIFIC' ? job.startDate || null : null,
      endDate: job.durationType === 'SPECIFIC' ? job.endDate || null : null,
    }
    delete body.ageRange
    try {
      const saved = editingId ? await updateJob(editingId, body) : await createJob(body)
      if (draft) navigate('/employer/jobs?status=DRAFT')
      else setPublished(saved)
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
          <h1 className="wk-h1">{editingId ? 'Edit Job' : 'Create a New Job'}</h1>
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
          <div style={{ minWidth: 560 }}>
            <Stepper steps={WIZARD_STEPS} current={step} />
          </div>
        </div>

        <ErrorNote>{error}</ErrorNote>

        {step === 0 && <StepCategory job={job} set={set} />}
        {step === 1 && <StepEmployment job={job} set={set} />}
        {step === 2 && <StepDetails job={job} set={set} />}
        {step === 3 && <StepSchedule job={job} set={set} />}
        {step === 4 && <StepSalary job={job} set={set} onEditSchedule={() => goto(3)} />}
        {step === 5 && <StepRequirements job={job} set={set} />}
        {step === 6 && <StepInterview job={job} set={set} />}
        {step === 7 && <StepReview job={job} onEdit={goto} />}

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
            <button
              className="mk-btn mk-btn-primary"
              style={{ minWidth: 150, opacity: invalid ? 0.6 : 1 }}
              disabled={!!invalid}
              title={invalid || undefined}
              onClick={() => goto(step + 1)}
            >
              Continue <Icon name="arrowRight" size={17} />
            </button>
          ) : (
            <button className="mk-btn mk-btn-primary" style={{ minWidth: 150 }} disabled={busy} onClick={() => submit(false)}>
              {busy ? 'Publishing…' : 'Publish Job'}
            </button>
          )}
        </div>
        {invalid && <p className="wk-sub" style={{ textAlign: 'right' }}>{invalid}</p>}
      </div>
    </>
  )
}

/** Returns a message when the current step is incomplete, otherwise ''. */
function validate(j, step) {
  if (step === 0 && !j.workerCategory) return 'Choose the type of worker you need'
  if (step === 1 && !j.engagementModel) return 'Choose an employment type'
  if (step === 2) {
    if (!j.title.trim()) return 'Add a job title'
    if (!Number(j.workersNeeded)) return 'Add how many people you need'
    if (j.description.trim().length < 20) return 'Add a short job description (at least 20 characters)'
  }
  if (step === 3) return scheduleReady(j, calculateSchedule(j))
  if (step === 4) {
    if (!(Number(j.salary) > 0)) return 'Add the wage you are offering'
    const allowed = modelOf(j.engagementModel)?.payBases || []
    if (allowed.length && !allowed.includes(j.salaryUnit)) {
      return `A ${modelOf(j.engagementModel).label.toLowerCase()} job cannot be paid ${PAY_BASIS_LABEL[j.salaryUnit].toLowerCase()}`
    }
    if (j.overtimeExpected && !j.overtimePayBasis) return 'Choose how overtime is paid'
  }
  // The API requires at least one skill; ask for it here rather than failing at publish.
  if (step === 5 && !j.requiredSkills.length) return 'Add at least one required skill'
  return ''
}

/* ---------- 2. worker type ---------- */
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
function StepInterview({ job, set }) {
  return (
    <Section title="Interview & hiring method" sub="Choose how you want to shortlist and hire workers.">
      <div className="wk-field">
        <label>Interview Type</label>
        <div className="emp-radios">
          {INTERVIEW_TYPES.map((t) => (
            <RadioRow key={t.value} on={job.interviewType === t.value}
              onClick={() => set({ interviewType: t.value })}
              icon={t.icon} title={t.label} sub={t.sub} />
          ))}
        </div>
      </div>

      <div className="wk-field" style={{ marginTop: 18, maxWidth: 320 }}>
        <label htmlFor="pj-deadline">Application Deadline</label>
        <input id="pj-deadline" className="wk-input" type="date"
          min={new Date().toISOString().slice(0, 10)}
          value={job.applicationDeadline} onChange={(e) => set({ applicationDeadline: e.target.value })} />
      </div>

      <div className="wk-field" style={{ marginTop: 18 }}>
        <label>Auto-close job when filled</label>
        <label className="wk-checkrow">
          <input type="checkbox" checked={job.autoCloseWhenFilled}
            onChange={(e) => set({ autoCloseWhenFilled: e.target.checked })} />
          Yes, close automatically once all openings are filled
        </label>
      </div>
    </Section>
  )
}

/* ---------- 9. review ---------- */
function StepReview({ job, onEdit }) {
  const cat = WORKER_CATEGORIES.find((c) => c.value === job.workerCategory)
  const model = modelOf(job.engagementModel)
  const sched = calculateSchedule(job)
  const earnings = calculateEarnings(job, sched)
  const days = (job.workingDays || []).map((d) => DAYS.find((x) => x.value === d)?.label).filter(Boolean).join(', ')
  const interview = INTERVIEW_TYPES.find((i) => i.value === job.interviewType)
  const money = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN')

  const benefitLine = (b) => {
    const meta = BENEFIT_TYPES.find((x) => x.value === b.benefitType)
    const label = meta?.label || b.benefitType
    if (b.amount) return `${label} — ${money(b.amount)}${b.unit ? ` ${b.unit}` : ''}`
    if (b.note) return `${label} — ${b.note}`
    return label
  }

  return (
    <Section title="Review your job posting" sub="Please check all details before publishing.">
      <div className="emp-review">
        <div className="hd">
          <span className={`mk-icon-box sm ${cat?.tone || ''}`} style={{ width: 30, height: 30, marginBottom: 0 }}>
            <Icon name={cat?.icon || 'briefcase'} size={16} />
          </span>
          <span className="nm">{job.title || 'Untitled job'}</span>
          <button className="wk-link" style={{ border: 0, background: 0, cursor: 'pointer', font: 'inherit' }}
            onClick={() => onEdit(2)}>Edit</button>
        </div>
        <Row k="Employment Type" v={model?.label || '—'} />
        <Row k="Openings" v={job.workersNeeded} />
        <Row k="Period" v={sched.periodLabel} />
        {!sched.isOneTime && <Row k="Working Days" v={days || '—'} />}
        <Row k="Shift Timings" v={
          <>
            {job.shifts.map((s, i) => (
              <div key={i}>
                {timeLabel(s.startTime)} – {timeLabel(s.endTime)}
                {s.breakStart && s.breakEnd && (
                  <span className="wk-sub" style={{ marginTop: 0 }}>
                    {' '}(break {timeLabel(s.breakStart)}–{timeLabel(s.breakEnd)}, {job.breakPaid ? 'paid' : 'unpaid'})
                  </span>
                )}
              </div>
            ))}
            {job.shifts.length > 1 && (
              <div className="wk-sub" style={{ marginTop: 2 }}>
                {job.shiftArrangement === 'ONE_OF_SHIFTS' ? 'Worker is assigned one of these shifts' : 'Worker works all shifts'}
              </div>
            )}
          </>
        } />
        <Row k="Paid hours" v={`${sched.paidHoursPerDay} hrs/day · ${sched.scheduledDays} working days · ${sched.expectedPaidHours} hrs total`} />
        <Row k="Wage" v={
          <>
            {money(job.salary)}{PAY_BASIS_SUFFIX[job.salaryUnit] || ''}
            {earnings.amount > 0 && (
              <div className="wk-sub" style={{ marginTop: 2 }}>
                Estimated {money(earnings.amount)} for the period — actual pay follows approved attendance
              </div>
            )}
          </>
        } />
        {(job.benefits || []).length > 0 && (
          <Row k="Benefits & Additional Pay" v={<ul>{job.benefits.map((b) => <li key={b.benefitType}>{benefitLine(b)}</li>)}</ul>} />
        )}
        <Row k="Overtime" v={
          job.overtimeExpected
            ? `May be required${job.overtimeRate ? ` — ${money(job.overtimeRate)}` : ''}${job.overtimePayBasis === 'PER_HOUR' ? '/hour' : ''}`
            : 'Not expected'
        } />
        {job.responsibilities.length > 0 && (
          <Row k="Key Responsibilities" v={<ul>{job.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul>} />
        )}
        <Row k="Requirements" v={
          [
            job.minExperienceYears
              ? EXPERIENCE_LEVELS.find((x) => x.value === job.minExperienceYears)?.label
              : 'No experience required',
            job.requiredSkills.join(', '),
            job.languages.join(', '),
            job.ageRange ? `Age: ${job.ageRange.replace('-', ' - ')} years` : '',
            job.genderPreference !== 'ANY' ? `Gender: ${job.genderPreference.toLowerCase()}` : '',
          ].filter(Boolean).join(' · ')
        } />
        <Row k="Interview Type" v={interview?.label || '—'} />
        <Row k="Application Deadline" v={job.applicationDeadline || 'No deadline'} />
        <Row k="Payment" v={
          model?.payroll === 'MONTHLY'
            ? 'Through SkillBridge — monthly payroll'
            : 'Through SkillBridge — funded before work, released on completion'
        } />
      </div>
    </Section>
  )
}

/* ---------- 10. published ---------- */
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
