/**
 * The engagement model is the root of the posting rules. Schedule shape, the
 * duration options and the allowed pay bases all derive from it — Schedule and
 * Salary are not independent forms.
 *
 * scheduleMode
 *   SINGLE_DATE — one work date, no weekday picker
 *   DATE_RANGE  — start/end dates plus which weekdays fall inside them
 *   RECURRING   — weekday pattern, optionally bounded by dates
 *
 * duration
 *   FIXED_ONLY    — a start and end date are required
 *   ONGOING_ONLY  — no end date is offered
 *   EITHER        — the employer chooses
 *   AUTO          — derived (start = end = the work date)
 */
export const ENGAGEMENT_MODELS = [
  {
    value: 'ONE_TIME',
    label: 'One-time shift',
    sub: 'A single day or shift, e.g. a helper tomorrow',
    icon: 'clock',
    scheduleMode: 'SINGLE_DATE',
    duration: 'AUTO',
    payBases: ['PER_SHIFT', 'PER_HOUR', 'PER_DAY'],
    defaultPay: 'PER_SHIFT',
    payroll: 'ON_COMPLETION',
  },
  {
    value: 'DAILY',
    label: 'Daily work',
    sub: 'A few days, e.g. a shop helper for 3 days',
    icon: 'calendar',
    scheduleMode: 'DATE_RANGE',
    duration: 'FIXED_ONLY',
    payBases: ['PER_DAY', 'PER_HOUR', 'PER_SHIFT'],
    defaultPay: 'PER_DAY',
    payroll: 'ON_COMPLETION',
  },
  {
    value: 'TEMPORARY',
    label: 'Temporary / Fixed-term',
    sub: 'A set period, e.g. one month',
    icon: 'briefcase',
    scheduleMode: 'DATE_RANGE',
    duration: 'FIXED_ONLY',
    payBases: ['PER_DAY', 'PER_HOUR', 'PER_MONTH'],
    defaultPay: 'PER_DAY',
    payroll: 'ON_COMPLETION',
  },
  {
    value: 'PART_TIME',
    label: 'Part-time',
    sub: 'Recurring short hours, e.g. 4 PM – 8 PM Mon–Sat',
    icon: 'clock',
    scheduleMode: 'RECURRING',
    duration: 'EITHER',
    payBases: ['PER_HOUR', 'PER_DAY', 'PER_MONTH'],
    defaultPay: 'PER_HOUR',
    payroll: 'MONTHLY',
  },
  {
    value: 'FULL_TIME',
    label: 'Full-time',
    sub: 'Regular full hours, ongoing or fixed term',
    icon: 'briefcase',
    scheduleMode: 'RECURRING',
    duration: 'EITHER',
    payBases: ['PER_MONTH', 'PER_DAY', 'PER_HOUR'],
    defaultPay: 'PER_MONTH',
    payroll: 'MONTHLY',
  },
  {
    value: 'PERMANENT',
    label: 'Permanent',
    sub: 'A regular employee with no end date',
    icon: 'checkCircle',
    scheduleMode: 'RECURRING',
    duration: 'ONGOING_ONLY',
    payBases: ['PER_MONTH'],
    defaultPay: 'PER_MONTH',
    payroll: 'MONTHLY',
  },
]

export const modelOf = (value) => ENGAGEMENT_MODELS.find((m) => m.value === value) || null

export const PAY_BASIS_LABEL = {
  PER_HOUR: 'Per Hour',
  PER_SHIFT: 'Per Shift',
  PER_DAY: 'Per Day',
  PER_WEEK: 'Per Week',
  PER_MONTH: 'Per Month',
}

export const PAY_BASIS_SUFFIX = {
  PER_HOUR: '/hour', PER_SHIFT: '/shift', PER_DAY: '/day',
  PER_WEEK: '/week', PER_MONTH: '/month',
}

export const SHIFT_ARRANGEMENTS = [
  { value: 'ALL_SHIFTS', label: 'Worker works all listed shifts', sub: 'Every shift below is worked by the same person' },
  { value: 'ONE_OF_SHIFTS', label: 'Worker will be assigned one of these shifts', sub: 'The shifts are alternatives, not a combined day' },
]

export const BENEFIT_TYPES = [
  { value: 'MEALS', label: 'Meals / Food' },
  { value: 'TRAVEL_ALLOWANCE', label: 'Travel Allowance', amount: true, unitOptions: ['per day', 'per month'] },
  { value: 'ACCOMMODATION', label: 'Accommodation' },
  { value: 'OVERTIME_PAY', label: 'Overtime Pay' },
  { value: 'PERFORMANCE_BONUS', label: 'Performance / Incentive Bonus', amount: true, amountLabel: 'Up to ₹' },
  { value: 'WEEKLY_OFF', label: 'Weekly Off' },
  { value: 'TIPS', label: 'Tips / Service Charge' },
  { value: 'OTHER', label: 'Other', note: true },
]

export const OVERTIME_BASES = [
  { value: 'PER_HOUR', label: 'Per hour', amount: true },
  { value: 'FIXED_AMOUNT', label: 'Fixed amount', amount: true },
  { value: 'AS_PER_TERMS', label: 'According to applicable employment terms' },
]

const DAY_INDEX = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 }
const WEEKS_PER_MONTH = 4.345

const toMinutes = (t) => {
  if (!t) return null
  const [h, m] = String(t).split(':').map(Number)
  return h * 60 + (m || 0)
}

/** Shift length in minutes, treating an end at or before the start as crossing midnight. */
function shiftMinutes(shift, breakPaid) {
  const start = toMinutes(shift.startTime)
  const end = toMinutes(shift.endTime)
  if (start === null || end === null) return 0
  let span = end - start
  if (span <= 0) span += 24 * 60
  if (!breakPaid) {
    const bs = toMinutes(shift.breakStart)
    const be = toMinutes(shift.breakEnd)
    if (bs !== null && be !== null && be > bs) span -= be - bs
  }
  return Math.max(0, span)
}

function countDaysInRange(startDate, endDate, workingDays) {
  if (!startDate || !endDate || !workingDays?.length) return 0
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0
  const wanted = new Set(workingDays.map((d) => DAY_INDEX[d]))
  let count = 0
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (wanted.has(d.getDay())) count++
  }
  return count
}

const fmtDate = (iso) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

const round1 = (n) => Math.round(n * 10) / 10

/**
 * Turns the schedule into the figures the employer needs before choosing a wage.
 * Mirrors the server-side calculator; the server stays authoritative for payroll.
 */
export function calculateSchedule(job) {
  const model = modelOf(job.engagementModel)
  const shifts = (job.shifts || []).filter((s) => s.startTime && s.endTime)
  const breakPaid = !!job.breakPaid
  const perShift = shifts.map((s) => shiftMinutes(s, breakPaid))

  const paidMinutesPerDay = job.shiftArrangement === 'ONE_OF_SHIFTS'
    ? Math.max(0, ...perShift, 0)
    : perShift.reduce((a, b) => a + b, 0)

  const paidHoursPerDay = round1(paidMinutesPerDay / 60)
  const shiftsPerDay = job.shiftArrangement === 'ONE_OF_SHIFTS' ? 1 : shifts.length

  const isOneTime = model?.scheduleMode === 'SINGLE_DATE'
  const isOngoing = !isOneTime && job.durationType !== 'SPECIFIC'
  const workingDaysPerWeek = isOneTime ? 1 : (job.workingDays || []).length

  let scheduledDays
  let periodLabel
  if (isOneTime) {
    scheduledDays = job.workDate ? 1 : 0
    periodLabel = job.workDate ? fmtDate(job.workDate) : 'Pick a work date'
  } else if (isOngoing) {
    scheduledDays = Math.round(workingDaysPerWeek * WEEKS_PER_MONTH)
    periodLabel = 'Ongoing — no end date'
  } else {
    scheduledDays = countDaysInRange(job.startDate, job.endDate, job.workingDays)
    periodLabel = job.startDate && job.endDate
      ? `${fmtDate(job.startDate)} – ${fmtDate(job.endDate)}`
      : 'Pick a start and end date'
  }

  const paidHoursPerWeek = round1(paidHoursPerDay * workingDaysPerWeek)
  const expectedPaidHours = round1(paidHoursPerDay * scheduledDays)

  const warnings = []
  shifts.forEach((s, i) => {
    if (shiftMinutes(s, breakPaid) === 0) warnings.push(`Shift ${i + 1} has no paid time — check its timings and break.`)
  })
  if (!isOneTime && !isOngoing && job.startDate && job.endDate && job.endDate < job.startDate) {
    warnings.push('The end date is before the start date.')
  }
  if (!isOneTime && workingDaysPerWeek === 0) warnings.push('Pick at least one working day.')

  return {
    paidHoursPerDay, paidHoursPerWeek, shiftsPerDay, scheduledDays,
    expectedPaidHours, periodLabel, isOngoing, isOneTime,
    workingDaysPerWeek, warnings,
  }
}

/** Estimated worker earnings for the period, from the wage and the schedule. */
export function calculateEarnings(job, sched) {
  const rate = Number(job.salary) || 0
  if (!rate) return { amount: 0, label: '' }
  const s = PAY_BASIS_SUFFIX[job.salaryUnit] || ''
  const money = (n) => '₹' + Math.round(n).toLocaleString('en-IN')

  switch (job.salaryUnit) {
    case 'PER_HOUR':
      return {
        amount: rate * sched.expectedPaidHours,
        label: `${money(rate)}${s} × ${sched.expectedPaidHours} paid hours`,
      }
    case 'PER_SHIFT': {
      const shifts = sched.scheduledDays * (sched.shiftsPerDay || 1)
      return { amount: rate * shifts, label: `${money(rate)}${s} × ${shifts} shift${shifts === 1 ? '' : 's'}` }
    }
    case 'PER_DAY':
      return {
        amount: rate * sched.scheduledDays,
        label: `${money(rate)}${s} × ${sched.scheduledDays} day${sched.scheduledDays === 1 ? '' : 's'}`,
      }
    case 'PER_WEEK': {
      const weeks = sched.workingDaysPerWeek ? sched.scheduledDays / sched.workingDaysPerWeek : 0
      return { amount: rate * weeks, label: `${money(rate)}${s} × ${round1(weeks)} weeks` }
    }
    case 'PER_MONTH':
      if (sched.isOngoing) return { amount: rate, label: `${money(rate)}${s}` }
      return {
        amount: rate * (sched.scheduledDays / Math.max(1, Math.round(sched.workingDaysPerWeek * WEEKS_PER_MONTH))),
        label: `${money(rate)}${s} pro-rated over ${sched.scheduledDays} working days`,
      }
    default:
      return { amount: 0, label: '' }
  }
}

/** The step the employer must complete before a wage can be entered. */
export function scheduleReady(job, sched) {
  if (!job.engagementModel) return 'Choose an employment type first'
  if (sched.isOneTime && !job.workDate) return 'Pick the work date'
  if (!sched.isOneTime && !(job.workingDays || []).length) return 'Pick at least one working day'
  if (!sched.isOneTime && !sched.isOngoing && (!job.startDate || !job.endDate)) return 'Add the start and end dates'
  if (!sched.paidHoursPerDay) return 'Add shift timings'
  return ''
}
