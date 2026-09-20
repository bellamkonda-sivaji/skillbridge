import api from '../api'

/** Worker-side API. Every path lives under /api/worker/** and requires ROLE_WORKER. */

export const getDashboard = () => api.get('/worker/dashboard').then((r) => r.data)

export const searchJobs = (body) => api.post('/worker/jobs/search', body).then((r) => r.data)

export const getJob = (id) => api.get(`/jobs/${id}`).then((r) => r.data)

export const getSavedJobs = () => api.get('/worker/saved-jobs').then((r) => r.data)
export const saveJob = (jobId) => api.post(`/worker/saved-jobs/${jobId}`).then((r) => r.data)
export const unsaveJob = (jobId) => api.delete(`/worker/saved-jobs/${jobId}`).then((r) => r.data)

export const applyToJob = (jobId, coverMessage) =>
  api.post(`/worker/jobs/${jobId}/apply`, { coverMessage }).then((r) => r.data)

export const getApplications = () => api.get('/worker/applications').then((r) => r.data)
export const getApplication = (id) => api.get(`/worker/applications/${id}`).then((r) => r.data)
export const withdrawApplication = (id) =>
  api.post(`/worker/applications/${id}/withdraw`).then((r) => r.data)

export const getOffers = () => api.get('/worker/offers').then((r) => r.data)
export const getOffer = (id) => api.get(`/worker/offers/${id}`).then((r) => r.data)
export const acceptOffer = (id) => api.post(`/worker/offers/${id}/accept`).then((r) => r.data)
export const declineOffer = (id) => api.post(`/worker/offers/${id}/decline`).then((r) => r.data)

export const getEmployer = (id) => api.get(`/employers/${id}`).then((r) => r.data)
export const getEmployerJobs = (id) => api.get(`/employers/${id}/jobs`).then((r) => r.data)
export const getUserReviews = (type, id) =>
  api.get(`/reviews/target/${type}/${id}`).then((r) => r.data)

/* ---------- display helpers ---------- */

const UNIT = { PER_DAY: '/day', PER_WEEK: '/week', PER_MONTH: '/month' }

export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

export const pay = (salary, unit) => money(salary) + (UNIT[unit] || '')

export const payRange = (job) =>
  job?.salaryMax && job.salaryMax !== job.salary
    ? `${money(job.salary)} - ${money(job.salaryMax)}${UNIT[job.salaryUnit] || ''}`
    : pay(job?.salary, job?.salaryUnit)

export const distance = (km) =>
  km === null || km === undefined ? null : `${Number(km).toFixed(1)} km`

export const EMPLOYMENT_LABEL = {
  DAILY: 'Daily Work',
  PART_TIME: 'Part Time',
  FULL_TIME: 'Full Time',
  TEMPORARY: 'Temporary',
  MONTHLY: 'Monthly',
  PERMANENT: 'Permanent',
  WEEKLY: 'Weekly',
}

export const STATUS_LABEL = {
  APPLIED: 'Pending',
  VIEWED: 'Viewed',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview',
  OFFERED: 'Offer',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
}

export const STATUS_TONE = {
  APPLIED: 'pending',
  VIEWED: 'viewed',
  SHORTLISTED: 'shortlisted',
  INTERVIEW_SCHEDULED: 'interview',
  OFFERED: 'offered',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
}

/** Stable colour + icon per job, so a listing looks consistent without photos. */
const TONES = [
  ['#dbeafe', '#1e40af', 'store'],
  ['#ffedd5', '#c2410c', 'cup'],
  ['#dcfce7', '#15803d', 'box'],
  ['#ede9fe', '#6d28d9', 'truck'],
  ['#fce7f3', '#be185d', 'scissors'],
  ['#e0f2fe', '#0369a1', 'cross'],
  ['#fef3c7', '#b45309', 'car'],
  ['#ccfbf1', '#0f766e', 'briefcase'],
]

export function jobArt(job) {
  const key = `${job?.title || ''}${job?.businessName || ''}`
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  const [bg, fg, icon] = TONES[h % TONES.length]
  return { bg, fg, icon }
}

export function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDate(iso, withTime) {
  if (!iso) return ''
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  return withTime
    ? `${date}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    : date
}

/* ---------- interviews ---------- */
export const getInterviews = () => api.get('/worker/interviews').then((r) => r.data)
export const getInterview = (id) => api.get(`/worker/interviews/${id}`).then((r) => r.data)
export const rescheduleInterview = (id, reason) =>
  api.post(`/worker/interviews/${id}/reschedule`, { reason }).then((r) => r.data)
export const cancelInterview = (id, reason) =>
  api.post(`/worker/interviews/${id}/cancel`, { reason }).then((r) => r.data)

/* ---------- employment ---------- */
export const getEmployments = (scope = 'CURRENT') =>
  api.get('/worker/employments', { params: { scope } }).then((r) => r.data)
export const getEmployment = (id) => api.get(`/worker/employments/${id}`).then((r) => r.data)
export const acknowledgeJoining = (id) =>
  api.post(`/worker/employments/${id}/acknowledge-joining`).then((r) => r.data)

/* ---------- attendance ---------- */
export const getTodayShift = () => api.get('/worker/shifts/today').then((r) => r.data)
export const checkIn = (employmentId) =>
  api.post('/worker/attendance/check-in', { employmentId }).then((r) => r.data)
export const checkOut = (employmentId) =>
  api.post('/worker/attendance/check-out', { employmentId }).then((r) => r.data)
export const getAttendance = (employmentId, from, to) =>
  api.get('/worker/attendance', { params: { employmentId, from, to } }).then((r) => r.data)

export const MODE_LABEL = { IN_PERSON: 'In-person', PHONE: 'Phone call', VIDEO: 'Video call' }
export const DAY_LABEL = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' }

/** "Mon - Sat" when the days are contiguous, otherwise a comma list. */
export function daysLabel(days) {
  if (!days || !days.length) return '—'
  const order = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  const idx = days.map((d) => order.indexOf(d)).filter((i) => i >= 0).sort((a, b) => a - b)
  const contiguous = idx.length > 2 && idx.every((v, i) => i === 0 || v === idx[i - 1] + 1)
  return contiguous
    ? `${DAY_LABEL[order[idx[0]]]} - ${DAY_LABEL[order[idx[idx.length - 1]]]}`
    : idx.map((i) => DAY_LABEL[order[i]]).join(', ')
}

export const timeOnly = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''

export const hhmm = (t) => {
  if (!t) return ''
  const [h, m] = String(t).split(':')
  const hour = Number(h)
  return `${String(hour % 12 === 0 ? 12 : hour % 12).padStart(2, '0')}:${m || '00'} ${hour >= 12 ? 'PM' : 'AM'}`
}
