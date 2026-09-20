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

/* ---------- display helpers ---------- */

const UNIT = { PER_HOUR: '/hr', PER_DAY: '/day', PER_WEEK: '/week', PER_MONTH: '/month' }

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
