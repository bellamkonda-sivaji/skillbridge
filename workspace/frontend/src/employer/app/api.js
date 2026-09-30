import api from '../../api'

/** Employer-side API. Everything under /api/employer/** requires ROLE_EMPLOYER. */

export const getDashboard = () => api.get('/employer/dashboard').then((r) => r.data)

/* ---------- jobs ---------- */
export const listJobs = (status = 'ALL', q = '') =>
  api.get('/employer/jobs', { params: { status, q: q || undefined } }).then((r) => r.data)
export const getJob = (id) => api.get(`/employer/jobs/${id}`).then((r) => r.data)
export const createJob = (body) => api.post('/employer/jobs', body).then((r) => r.data)
export const updateJob = (id, body) => api.put(`/employer/jobs/${id}`, body).then((r) => r.data)
export const setJobStatus = (id, status) =>
  api.patch(`/employer/jobs/${id}/status`, { status }).then((r) => r.data)
export const deleteJob = (id) => api.delete(`/employer/jobs/${id}`).then((r) => r.data)

/* ---------- applicants ---------- */
export const getApplicants = (jobId, status = 'ALL', sort = 'MATCH') =>
  api.get(`/employer/jobs/${jobId}/applicants`, { params: { status, sort } }).then((r) => r.data)
export const getShortlist = (jobId) =>
  api.get(`/employer/jobs/${jobId}/shortlist`).then((r) => r.data)
export const decideApplication = (applicationId, body) =>
  api.patch(`/employer/applications/${applicationId}`, body).then((r) => r.data)
export const bulkDecide = (applicationIds, status, message) =>
  api.post('/employer/applications/bulk', { applicationIds, status, message }).then((r) => r.data)
export const allApplications = () => api.get('/employer/applications').then((r) => r.data)

/* ---------- worker discovery ---------- */
export const getRecommended = (jobId, tab = 'TOP') =>
  api.get(`/employer/jobs/${jobId}/recommended`, { params: { tab } }).then((r) => r.data)
export const getWorker = (workerId, jobId) =>
  api.get(`/employer/workers/${workerId}`, { params: { jobId } }).then((r) => r.data)
export const compareWorkers = (workerIds, jobId) =>
  api.post('/employer/compare', { workerIds, jobId }).then((r) => r.data)
export const inviteWorker = (jobId, workerId) =>
  api.post(`/employer/jobs/${jobId}/invite`, { workerId }).then((r) => r.data)

/* ---------- interviews ---------- */
export const scheduleInterview = (body) =>
  api.post('/employer/interviews', body).then((r) => r.data)
export const listInterviews = (from, to) =>
  api.get('/employer/interviews', { params: { from, to } }).then((r) => r.data)
export const completeInterview = (id) =>
  api.patch(`/employer/interviews/${id}/complete`).then((r) => r.data)
export const cancelInterview = (id) =>
  api.patch(`/employer/interviews/${id}/cancel`).then((r) => r.data)

/* ---------- interview results (screen 21) ---------- */
export const getInterviewResults = (jobId) =>
  api.get(`/employer/jobs/${jobId}/interview-results`).then((r) => r.data)
export const setInterviewResult = (applicationId, result, feedback) =>
  api.patch(`/employer/applications/${applicationId}/interview-result`, { result, feedback }).then((r) => r.data)

/* ---------- offers (screens 22-24) ---------- */
export const getOfferDraft = (applicationId) =>
  api.get(`/employer/applications/${applicationId}/offer-draft`).then((r) => r.data)
export const sendOffer = (applicationId, body) =>
  api.post(`/employer/applications/${applicationId}/offer`, body).then((r) => r.data)
export const listOffers = (status = 'ALL') =>
  api.get('/employer/offers', { params: { status } }).then((r) => r.data)
export const getOffer = (id) => api.get(`/employer/offers/${id}`).then((r) => r.data)
export const cancelOffer = (id) => api.post(`/employer/offers/${id}/cancel`).then((r) => r.data)

/* ---------- joining confirmation (screen 25) ---------- */
export const getJoining = (offerId) =>
  api.get(`/employer/offers/${offerId}/joining`).then((r) => r.data)
export const saveJoining = (offerId, body) =>
  api.post(`/employer/offers/${offerId}/joining`, body).then((r) => r.data)

/* ---------- worker work history ---------- */
// ---------------------------------------------------------------- pricing & demand advice

/** The commission split on a price the employer is still typing. */
export const quotePrice = (salary, unit) =>
  api.get('/employer/pricing/quote', { params: { salary, unit } }).then((r) => r.data)

export const getSlabs = () => api.get('/employer/pricing/slabs').then((r) => r.data)

export const getJobPricing = (jobId) =>
  api.get(`/employer/jobs/${jobId}/pricing`).then((r) => r.data)

export const changeJobPrice = (jobId, salary, reason) =>
  api.patch(`/employer/jobs/${jobId}/price`, { salary, reason }).then((r) => r.data)

export const getPriceHistory = (jobId) =>
  api.get(`/employer/jobs/${jobId}/price-history`).then((r) => r.data)

export const getJobDemand = (jobId) =>
  api.get(`/employer/jobs/${jobId}/demand`).then((r) => r.data)

export const getDemandAlerts = () => api.get('/employer/demand-alerts').then((r) => r.data)

export const getWorkHistory = (workerId) =>
  api.get(`/employer/workers/${workerId}/work-history`).then((r) => r.data)

/* ---------- display helpers ---------- */

const UNIT = { HOURLY: '/hr', PER_SHIFT: '/shift', DAILY: '/day', PER_WEEK: '/week', MONTHLY: '/month' }

export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
export const pay = (salary, unit) => money(salary) + (UNIT[unit] || '')
export const km = (d) => (d === null || d === undefined ? null : `${Number(d).toFixed(1)} km`)

export const JOB_STATUS_TONE = {
  OPEN: 'shortlisted', ACTIVE: 'shortlisted', PAUSED: 'pending',
  FILLED: 'interview', CLOSED: 'withdrawn', DRAFT: 'withdrawn', CANCELLED: 'rejected',
}
export const JOB_STATUS_LABEL = {
  OPEN: 'Active', ACTIVE: 'Active', PAUSED: 'Paused',
  FILLED: 'Filled', CLOSED: 'Closed', DRAFT: 'Draft', CANCELLED: 'Cancelled',
}

export const EMPLOYMENT_LABEL = {
  DAILY: 'Daily Work', PART_TIME: 'Part-time', FULL_TIME: 'Full-time',
  TEMPORARY: 'Temporary', MONTHLY: 'Monthly', PERMANENT: 'Permanent', WEEKLY: 'Weekly',
}

export const APPLICANT_STATUS_LABEL = {
  APPLIED: 'New', VIEWED: 'Viewed', SHORTLISTED: 'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview', OFFERED: 'Offer sent',
  ACCEPTED: 'Hired', REJECTED: 'Rejected', WITHDRAWN: 'Withdrawn',
}
export const APPLICANT_STATUS_TONE = {
  APPLIED: 'viewed', VIEWED: 'viewed', SHORTLISTED: 'shortlisted',
  INTERVIEW_SCHEDULED: 'interview', OFFERED: 'offered',
  ACCEPTED: 'accepted', REJECTED: 'rejected', WITHDRAWN: 'withdrawn',
}

export function timeAgo(iso) {
  if (!iso) return ''
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} hour`.replace('hour', mins === 1 ? 'minute ago' : 'minutes ago')
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ago`
  const days = Math.round(hrs / 24)
  return `${days} ${days === 1 ? 'day' : 'days'} ago`
}

export function formatDate(iso, withTime) {
  if (!iso) return ''
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  return withTime
    ? `${date}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    : date
}

export const timeLabel = (t) => {
  if (!t) return ''
  const [h, m] = String(t).split(':')
  const hour = Number(h)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${String(h12).padStart(2, '0')}:${m || '00'} ${suffix}`
}

/* Offer + interview-result vocabulary, shared by the hiring screens. */

export const OFFER_STATUS_LABEL = {
  PENDING: 'Pending', VIEWED: 'Viewed', ACCEPTED: 'Accepted',
  DECLINED: 'Declined', EXPIRED: 'Expired', CANCELLED: 'Cancelled',
}
export const OFFER_STATUS_TONE = {
  PENDING: 'pending', VIEWED: 'viewed', ACCEPTED: 'accepted',
  DECLINED: 'rejected', EXPIRED: 'withdrawn', CANCELLED: 'withdrawn',
}

export const RESULT_LABEL = {
  INTERVIEWED: 'Interviewed', SHORTLISTED: 'Shortlisted', SELECTED: 'Selected',
  ON_HOLD: 'On Hold', REJECTED: 'Rejected',
}
export const RESULT_TONE = {
  INTERVIEWED: 'interview', SHORTLISTED: 'shortlisted', SELECTED: 'accepted',
  ON_HOLD: 'pending', REJECTED: 'rejected',
}

/** Turns the number of days into the short label used across the hiring tables. */
export function durationLabel(days) {
  const n = Number(days)
  if (!n || n < 1) return '—'
  if (n === 1) return '1 day'
  if (n < 7) return `${n} days`
  if (n < 30) {
    const w = Math.round(n / 7)
    return `${w} week${w === 1 ? '' : 's'}`
  }
  const m = Math.round(n / 30)
  return `${m} month${m === 1 ? '' : 's'}`
}

export const timeRange = (from, to) =>
  [timeLabel(from), timeLabel(to)].filter(Boolean).join(' – ')
