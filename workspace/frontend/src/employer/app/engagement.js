/**
 * Duration drives the whole posting flow.
 *
 * An employer thinks "I need one helper for 15 days, 4–9 PM, ₹500 a day" — not
 * "temporary part-time fixed-term engagement". So Step 2 asks only how long, and
 * every later screen (schedule, pay, hiring, review, offer) reads its rules from
 * here rather than scattering conditions through the components.
 *
 * Duration and work pattern stay separate: 15 days at 4 hours a day is
 * FEW_WEEKS + PART_TIME, not a choice between "15 days" and "part-time".
 */

export const DURATION_MODELS = [
  {
    value: 'ONE_DAY',
    label: 'One day',
    sub: 'Need someone for one specific day.',
    example: 'Tomorrow, or another chosen date',
    icon: 'calendar',
    scheduleVariant: 'SINGLE_DATE',
    allowedPayBasis: ['DAILY', 'HOURLY', 'PER_SHIFT'],
    defaultPayBasis: 'DAILY',
    defaultHiringMethod: 'DIRECT',
    offerType: 'NONE',
    payroll: 'ON_COMPLETION',
    offerTitle: 'work confirmation',
    offerNote: 'This is a 1-day job. We’ll create a simple work confirmation for the selected date.',
  },
  {
    value: 'FEW_DAYS',
    label: 'A few days',
    sub: 'Need someone for a few days.',
    example: 'Usually 2–7 days',
    icon: 'clock',
    scheduleVariant: 'DATE_RANGE_SIMPLE',
    allowedPayBasis: ['DAILY', 'HOURLY', 'PER_SHIFT'],
    defaultPayBasis: 'DAILY',
    defaultHiringMethod: 'DIRECT',
    offerType: 'WORK_CONFIRMATION',
    payroll: 'ON_COMPLETION',
    offerTitle: 'job confirmation',
    offerNote: 'We’ll send the worker a short job confirmation with these dates and pay.',
  },
  {
    value: 'FEW_WEEKS',
    label: 'A few weeks',
    sub: 'Need someone for a few weeks.',
    example: '10 days, 15 days or 3 weeks',
    icon: 'calendar',
    scheduleVariant: 'DATE_RANGE_RECURRING',
    allowedPayBasis: ['DAILY', 'HOURLY', 'PER_SHIFT'],
    defaultPayBasis: 'DAILY',
    defaultHiringMethod: 'TALK_FIRST',
    offerType: 'SIMPLE_JOB_OFFER',
    payroll: 'ON_COMPLETION',
    offerTitle: 'job offer',
    offerNote: 'We’ll send a simple job offer the worker can accept.',
  },
  {
    value: 'MONTHS',
    label: 'One or more months',
    sub: 'Need someone regularly for one or more months.',
    example: '1 month, 3 months, 6 months',
    icon: 'briefcase',
    scheduleVariant: 'RECURRING',
    allowedPayBasis: ['MONTHLY', 'DAILY', 'HOURLY'],
    defaultPayBasis: 'MONTHLY',
    defaultHiringMethod: 'INTERVIEW',
    offerType: 'EMPLOYMENT_OFFER',
    payroll: 'MONTHLY',
    offerTitle: 'employment offer',
    offerNote: 'We’ll send a proper employment offer with joining details.',
  },
  {
    value: 'PERMANENT',
    label: 'Permanent',
    sub: 'Need a regular worker with no planned end date.',
    example: 'A regular member of your team',
    icon: 'checkCircle',
    scheduleVariant: 'RECURRING_ONGOING',
    allowedPayBasis: ['MONTHLY'],
    defaultPayBasis: 'MONTHLY',
    defaultHiringMethod: 'INTERVIEW',
    offerType: 'FULL_EMPLOYMENT_OFFER',
    payroll: 'MONTHLY',
    offerTitle: 'employment offer',
    offerNote: 'We’ll send a full employment offer and start the joining process.',
  },
]

export const durationOf = (v) => DURATION_MODELS.find((m) => m.value === v) || null

/* ---------- pay ---------- */

export const PAY_BASIS_LABEL = {
  HOURLY: 'Per hour',
  PER_SHIFT: 'Per shift',
  DAILY: 'Per day',
  PER_WEEK: 'Per week',
  MONTHLY: 'Per month',
}

/** On a one-day job "For the day" reads better than "Per day". */
const ONE_DAY_LABEL = { DAILY: 'For the day', HOURLY: 'Per hour', PER_SHIFT: 'For this shift' }

export const payChoiceLabel = (basis, model) =>
  (model?.value === 'ONE_DAY' && ONE_DAY_LABEL[basis]) || PAY_BASIS_LABEL[basis] || basis

export const PAY_BASIS_SUFFIX = {
  HOURLY: '/hour', PER_SHIFT: '/shift', DAILY: '/day',
  PER_WEEK: '/week', MONTHLY: '/month',
}

/* ---------- work pattern (inferred, never asked) ---------- */

export const WORK_PATTERN_LABEL = {
  FULL_DAY: 'Full day',
  PART_TIME: 'A few hours',
  SHIFT_BASED: 'Shift work',
}

/** Mirrors WorkPattern.infer on the server. */
export function inferWorkPattern(paidHoursPerDay, distinctWindows) {
  if (paidHoursPerDay > 0 && paidHoursPerDay < 6) return 'PART_TIME'
  if (distinctWindows > 1) return 'SHIFT_BASED'
  return 'FULL_DAY'
}

/* ---------- hiring ---------- */

export const HIRING_METHODS = {
  DIRECT: { label: 'Choose a worker and hire', sub: 'No interview — just pick from the applicants', icon: 'checkCircle' },
  TALK_FIRST: { label: 'Talk to the worker first', sub: 'A quick phone call before you decide', icon: 'phone' },
  INTERVIEW: { label: 'Interview first', sub: 'Meet or call before you decide', icon: 'users' },
}

/** Which hiring options make sense for each duration. */
export const hiringOptionsFor = (model) => {
  switch (model?.value) {
    case 'ONE_DAY':
    case 'FEW_DAYS': return ['DIRECT', 'TALK_FIRST']
    case 'FEW_WEEKS': return ['DIRECT', 'TALK_FIRST', 'INTERVIEW']
    default: return ['INTERVIEW', 'TALK_FIRST', 'DIRECT']
  }
}

/** Plain-language steps shown on Review and after publishing. */
export const whatHappensNext = (model) => {
  switch (model?.value) {
    case 'ONE_DAY':
      return ['Post your job', 'Choose a worker', 'Worker accepts',
        'Worker comes to work', 'Payment through SkillBridge']
    case 'FEW_DAYS':
      return ['Post your job', 'Choose a worker', 'Confirm the job', 'Worker accepts',
        'Work begins', 'Payment through SkillBridge']
    case 'FEW_WEEKS':
      return ['Post your job', 'Review workers', 'Talk or interview if you want',
        'Send a simple job offer', 'Worker accepts', 'Work begins']
    default:
      return ['Post your job', 'Review applications', 'Interview if enabled',
        'Send the employment offer', 'Worker accepts', 'Complete joining',
        'Attendance and payroll begin']
  }
}

/* ---------- schedule inputs ---------- */

export const BREAK_PRESETS = [
  { value: 0, label: 'No break' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: -1, label: 'Custom' },
]

export const MONTH_OPTIONS = [
  { value: 1, label: '1 month' },
  { value: 2, label: '2 months' },
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 0, label: 'Choose an end date' },
]

export const DAYS = [
  { value: 'MON', label: 'Mon' }, { value: 'TUE', label: 'Tue' },
  { value: 'WED', label: 'Wed' }, { value: 'THU', label: 'Thu' },
  { value: 'FRI', label: 'Fri' }, { value: 'SAT', label: 'Sat' },
  { value: 'SUN', label: 'Sun' },
]

/** Deliberately short — a shop owner should not meet a corporate benefits form. */
export const BENEFIT_TYPES = [
  { value: 'MEALS', label: 'Food provided' },
  { value: 'ACCOMMODATION', label: 'Accommodation provided' },
  { value: 'TRAVEL_ALLOWANCE', label: 'Travel allowance', amount: true, unitOptions: ['per day', 'per month'] },
  { value: 'PERFORMANCE_BONUS', label: 'Bonus / Incentive', amount: true, amountLabel: 'Up to ₹' },
  { value: 'OTHER', label: 'Other', note: true },
]

export const OVERTIME_BASES = [
  { value: 'PER_HOUR', label: 'Per extra hour', amount: true },
  { value: 'FIXED_AMOUNT', label: 'Fixed extra amount', amount: true },
  { value: 'AS_PER_TERMS', label: 'Another agreed method' },
]

/* ---------- calculation ---------- */

const DAY_INDEX = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 }
const WEEKS_PER_MONTH = 4.345

const toMinutes = (t) => {
  if (!t) return null
  const [h, m] = String(t).split(':').map(Number)
  return h * 60 + (m || 0)
}

/** Window length in minutes; an end at or before the start crosses midnight. */
function windowMinutes(startTime, endTime, breakMinutes) {
  const start = toMinutes(startTime)
  const end = toMinutes(endTime)
  if (start === null || end === null) return 0
  let span = end - start
  if (span <= 0) span += 24 * 60
  return Math.max(0, span - (Number(breakMinutes) || 0))
}

function countDaysInRange(startDate, endDate, workingDays) {
  if (!startDate || !endDate) return 0
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  if (Number.isNaN(+start) || Number.isNaN(+end) || end < start) return 0
  const wanted = workingDays?.length ? new Set(workingDays.map((d) => DAY_INDEX[d])) : null
  let count = 0
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (!wanted || wanted.has(d.getDay())) count++
  }
  return count
}

export const fmtDate = (iso) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

const round1 = (n) => Math.round(n * 10) / 10

/** Adds months to a date and steps back one day, giving an inclusive period. */
export function addMonths(iso, months) {
  if (!iso || !months) return ''
  const d = new Date(`${iso}T00:00:00`)
  d.setMonth(d.getMonth() + Number(months))
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

/**
 * Turns the schedule into the few figures an employer actually needs:
 * how many days, how many hours a day, how many hours in total.
 */
export function calculateSchedule(job) {
  const model = durationOf(job.durationType)
  const variant = model?.scheduleVariant || 'RECURRING'
  const single = variant === 'SINGLE_DATE'
  const ongoing = variant === 'RECURRING_ONGOING'

  const shifts = (job.shifts || []).filter((s) => s.startTime && s.endTime)
  const perShift = shifts.map((s) => windowMinutes(s.startTime, s.endTime, s.breakMinutes))
  const paidMinutesPerDay = job.shiftArrangement === 'ONE_OF_SHIFTS'
    ? Math.max(0, ...perShift, 0)
    : perShift.reduce((a, b) => a + b, 0)

  const paidHoursPerDay = round1(paidMinutesPerDay / 60)
  const shiftsPerDay = job.shiftArrangement === 'ONE_OF_SHIFTS' ? 1 : shifts.length

  // A few days runs on consecutive dates; longer jobs pick weekdays.
  const usesWeekdays = variant === 'DATE_RANGE_RECURRING' || variant === 'RECURRING' || ongoing
  const workingDaysPerWeek = single ? 1 : (usesWeekdays ? (job.workingDays || []).length : 7)

  let scheduledDays
  let periodLabel
  if (single) {
    scheduledDays = job.workDate ? 1 : 0
    periodLabel = job.workDate ? fmtDate(job.workDate) : 'Pick a work date'
  } else if (ongoing) {
    scheduledDays = Math.round(workingDaysPerWeek * WEEKS_PER_MONTH)
    periodLabel = job.startDate ? `From ${fmtDate(job.startDate)} · ongoing` : 'Ongoing job'
  } else {
    scheduledDays = countDaysInRange(job.startDate, job.endDate, usesWeekdays ? job.workingDays : null)
    periodLabel = job.startDate && job.endDate
      ? `${fmtDate(job.startDate)} – ${fmtDate(job.endDate)}`
      : 'Pick the dates'
  }

  const paidHoursPerWeek = round1(paidHoursPerDay * Math.min(workingDaysPerWeek, 7))
  const daysPerMonth = Math.round(workingDaysPerWeek * WEEKS_PER_MONTH)
  const expectedPaidHours = round1(paidHoursPerDay * scheduledDays)
  const workPattern = inferWorkPattern(paidHoursPerDay, shifts.length)

  const warnings = []
  shifts.forEach((s, i) => {
    const gross = windowMinutes(s.startTime, s.endTime, 0)
    if (!gross) warnings.push(shifts.length > 1 ? `Check shift ${i + 1}’s start and end time.` : 'Check the start and end time.')
    else if (!windowMinutes(s.startTime, s.endTime, s.breakMinutes)) warnings.push('The break is as long as the whole shift.')
  })
  if (!single && !ongoing && job.startDate && job.endDate && job.endDate < job.startDate) {
    warnings.push('The end date is before the start date.')
  }

  return {
    paidHoursPerDay, paidHoursPerWeek, daysPerMonth, shiftsPerDay, scheduledDays, expectedPaidHours,
    periodLabel, isOngoing: ongoing, isSingleDate: single, usesWeekdays,
    workingDaysPerWeek, workPattern, warnings,
  }
}

export const money = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN')

/** Estimated worker pay for the period. */
export function calculateEarnings(job, sched) {
  const rate = Number(job.salary) || 0
  if (!rate) return { amount: 0, label: '' }
  const s = PAY_BASIS_SUFFIX[job.salaryUnit] || ''

  switch (job.salaryUnit) {
    case 'HOURLY':
      return { amount: rate * sched.expectedPaidHours,
        label: `${money(rate)}${s} × ${sched.expectedPaidHours} hours` }
    case 'PER_SHIFT': {
      const n = sched.scheduledDays * (sched.shiftsPerDay || 1)
      return { amount: rate * n, label: `${money(rate)}${s} × ${n} shift${n === 1 ? '' : 's'}` }
    }
    case 'DAILY':
      return { amount: rate * sched.scheduledDays,
        label: sched.scheduledDays === 1 ? `${money(rate)} for the day`
          : `${money(rate)}${s} × ${sched.scheduledDays} days` }
    case 'MONTHLY':
      return { amount: rate, label: `${money(rate)}${s}` }
    default:
      return { amount: 0, label: '' }
  }
}

/**
 * What the employer pays. The fee percent comes from the backend
 * (GET /api/config/pricing) — never hard-code it, pricing can change.
 */
export function calculateCost(workerPay, feePercent) {
  const pay = Number(workerPay) || 0
  if (feePercent === null || feePercent === undefined) return { workerPay: pay, fee: null, total: pay }
  const fee = Math.round(pay * (Number(feePercent) / 100))
  return { workerPay: pay, fee, total: pay + fee }
}

/** Plain-language validation — "Choose a work date", not "invalid configuration". */
export function scheduleReady(job, sched) {
  if (!job.durationType) return 'Choose how long you need the worker'
  if (sched.isSingleDate && !job.workDate) return 'Choose a work date'
  if (!sched.isSingleDate && !job.startDate) return 'Choose a start date'
  if (!sched.isSingleDate && !sched.isOngoing && !job.endDate) return 'Choose an end date'
  if (sched.usesWeekdays && !(job.workingDays || []).length) return 'Choose the working days'
  if (!sched.paidHoursPerDay) return 'Add the start and end time'
  if (sched.warnings.length) return sched.warnings[0]
  if (!sched.scheduledDays) return 'This schedule has no work days — check the dates and days'
  return ''
}

/** What gets reset when the employer changes the duration after filling later steps. */
export function incompatibleFields(fromModel, toModel) {
  if (!fromModel || !toModel || fromModel.value === toModel.value) return []
  const out = []
  if (toModel.scheduleVariant !== fromModel.scheduleVariant) out.push('the schedule')
  if (!toModel.allowedPayBasis.includes(fromModel.defaultPayBasis)) out.push('the pay type')
  if (toModel.payroll !== fromModel.payroll) out.push('the payment cycle')
  return out
}
