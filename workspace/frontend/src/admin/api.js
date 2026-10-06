import api from '../api'

/**
 * Back-office API. Everything under /api/admin/** requires ROLE_ADMIN, and the
 * server additionally gates each call on the signed-in admin's role, so a
 * 403 here means "your role cannot do that" rather than "you are logged out".
 */

/* ---------- team ---------- */
export const getTeam = () => api.get('/admin/team').then((r) => r.data)
export const createAdmin = (body) => api.post('/admin/team', body).then((r) => r.data)
export const setAdminRole = (id, role) =>
  api.patch(`/admin/team/${id}/role`, { role }).then((r) => r.data)
export const setAdminStatus = (id, enabled) =>
  api.patch(`/admin/team/${id}/status`, { enabled }).then((r) => r.data)
export const deleteAdmin = (id) => api.delete(`/admin/team/${id}`).then((r) => r.data)

/* ---------- overview ---------- */
export const getOverview = (days = 30) =>
  api.get('/admin/overview', { params: { days } }).then((r) => r.data)

/* ---------- jobs ---------- */
export const listJobs = (params) => api.get('/admin/jobs/list', { params }).then((r) => r.data)
export const getJobDetail = (id) => api.get(`/admin/jobs/${id}/detail`).then((r) => r.data)

/* ---------- applications + the tracking history ---------- */
export const listApplications = (params) =>
  api.get('/admin/applications', { params }).then((r) => r.data)
export const getApplicationHistory = (id) =>
  api.get(`/admin/applications/${id}/history`).then((r) => r.data)
export const logContact = (id, body) =>
  api.post(`/admin/applications/${id}/contact`, body).then((r) => r.data)
export const getContacts = (id) =>
  api.get(`/admin/applications/${id}/contacts`).then((r) => r.data)

/* ---------- skills registry (not worker profiles) ---------- */
export const getSkillRegistry = (params) =>
  api.get('/admin/skills/registry', { params }).then((r) => r.data)
export const getSkillWorkers = (skill, params) =>
  api.get(`/admin/skills/registry/${encodeURIComponent(skill)}/workers`, { params }).then((r) => r.data)

/* ---------- companies ---------- */
export const listCompanies = (params) => api.get('/admin/companies', { params }).then((r) => r.data)
export const getCompany = (id) => api.get(`/admin/companies/${id}`).then((r) => r.data)

/* ---------- interviews ---------- */
export const listInterviews = (params) =>
  api.get('/admin/interviews/list', { params }).then((r) => r.data)
export const getInterviewCalendar = (from, to) =>
  api.get('/admin/interviews/calendar', { params: { from, to } }).then((r) => r.data)

/* ---------- payments ---------- */
export const listPayments = (params) =>
  api.get('/admin/payments/list', { params }).then((r) => r.data)

/* ---------- analytics ---------- */
export const getTimeseries = (params) =>
  api.get('/admin/analytics/timeseries', { params }).then((r) => r.data)
export const getBreakdown = (params) =>
  api.get('/admin/analytics/breakdown', { params }).then((r) => r.data)
export const getEmployerAnalytics = (params) =>
  api.get('/admin/analytics/employers', { params }).then((r) => r.data)
export const getWorkerAnalytics = (params) =>
  api.get('/admin/analytics/workers', { params }).then((r) => r.data)

/* ---------- finance (ledger, escrow, payouts) ---------- */
export const getFinanceSummary = () => api.get('/admin/finance/summary').then((r) => r.data)
export const getLedger = (params) => api.get('/admin/finance/ledger', { params }).then((r) => r.data)
export const listEscrows = (params) => api.get('/admin/finance/escrows', { params }).then((r) => r.data)
export const listAdminPayouts = (params) => api.get('/admin/finance/payouts', { params }).then((r) => r.data)
export const retryPayout = (id) => api.post(`/admin/finance/payouts/${id}/retry`).then((r) => r.data)
export const listOrders = (params) => api.get('/admin/finance/orders', { params }).then((r) => r.data)
export const listWebhooks = (params) => api.get('/admin/finance/webhooks', { params }).then((r) => r.data)
export const runReconcile = () => api.post('/admin/payments/reconcile').then((r) => r.data)

/* ---------- the call queue: who to ring next ---------- */
export const getCallQueue = (params) => api.get('/admin/call-queue', { params }).then((r) => r.data)
export const getCallQueueSummary = () => api.get('/admin/call-queue/summary').then((r) => r.data)

/* ---------- acting for people who cannot use the app ---------- */
export const registerWorkerOnBehalf = (body) => api.post('/admin/workers', body).then((r) => r.data)
export const applyOnBehalf = (workerId, body) =>
  api.post(`/admin/workers/${workerId}/apply`, body).then((r) => r.data)
export const acceptOfferOnBehalf = (applicationId, note) =>
  api.post(`/admin/applications/${applicationId}/accept-offer`, { note }).then((r) => r.data)
export const declineOfferOnBehalf = (applicationId, reason) =>
  api.post(`/admin/applications/${applicationId}/decline-offer`, { reason }).then((r) => r.data)

/* ---------- leads: missed calls, WhatsApp, walk-ins ---------- */
export const listLeads = (params) => api.get('/admin/leads', { params }).then((r) => r.data)
export const updateLead = (id, body) => api.patch(`/admin/leads/${id}`, body).then((r) => r.data)
export const convertLead = (id, body) => api.post(`/admin/leads/${id}/convert`, body).then((r) => r.data)

/* ---------- shared vocabulary (calls & visits, hiring methods) ---------- */
export const getVocabulary = () => api.get('/config/vocabulary').then((r) => r.data)

/* ---------- attendance: every day, and every correction asked for ---------- */
export const listAttendance = (params) => api.get('/admin/attendance', { params }).then((r) => r.data)
export const attendanceSummary = (params) =>
  api.get('/admin/attendance/summary', { params }).then((r) => r.data)
export const listAttendanceRequests = (params) =>
  api.get('/admin/attendance/requests', { params }).then((r) => r.data)
export const approveAttendanceRequest = (id, body) =>
  api.post(`/admin/attendance/requests/${id}/approve`, body).then((r) => r.data)
export const rejectAttendanceRequest = (id, note) =>
  api.post(`/admin/attendance/requests/${id}/reject`, { note }).then((r) => r.data)
export const overrideAttendance = (id, body) =>
  api.post(`/admin/attendance/${id}/override`, body).then((r) => r.data)

/* ---------- reports + audit ---------- */
export const getDailyReport = (date) =>
  api.get('/admin/reports/daily', { params: { date } }).then((r) => r.data)
export const getAudit = (params) => api.get('/admin/audit', { params }).then((r) => r.data)

/* ---------- verification queue (pre-existing endpoints) ---------- */
export const getPendingVerifications = () => api.get('/admin/verifications').then((r) => r.data)
export const verifyWorker = (workerAccountId, approved, note) =>
  api.patch(`/admin/verifications/${workerAccountId}`, { approved, note }).then((r) => r.data)
export const verifyEmployer = (employerAccountId, approved, note) =>
  api.patch(`/admin/employers/${employerAccountId}/verify`, { approved, note }).then((r) => r.data)

/* ==========================================================================
   Vocabulary
   ========================================================================== */

export const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', hint: 'Full access, including managing the admin team.' },
  { value: 'ADMIN', label: 'Admin', hint: 'Everything operational, but cannot manage the team.' },
  { value: 'HR', label: 'HR', hint: 'Read, contact candidates and schedule interviews.' },
]
export const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.value, r.label]))
export const ROLE_TONE = { SUPER_ADMIN: 'offered', ADMIN: 'interview', HR: 'shortlisted' }

export const CHANNELS = [
  { value: 'CALL', label: 'Phone call' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'SMS', label: 'SMS' },
  { value: 'IN_APP', label: 'In-app message' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'IN_PERSON', label: 'In person' },
]
export const OUTCOMES = [
  { value: 'REACHED', label: 'Reached', tone: 'accepted' },
  { value: 'INTERESTED', label: 'Interested', tone: 'accepted' },
  { value: 'CALLBACK_REQUESTED', label: 'Callback requested', tone: 'pending' },
  { value: 'NO_ANSWER', label: 'No answer', tone: 'withdrawn' },
  { value: 'BUSY', label: 'Busy', tone: 'withdrawn' },
  { value: 'NOT_INTERESTED', label: 'Not interested', tone: 'rejected' },
  { value: 'WRONG_NUMBER', label: 'Wrong number', tone: 'rejected' },
]
export const CHANNEL_LABEL = Object.fromEntries(CHANNELS.map((c) => [c.value, c.label]))
export const OUTCOME_LABEL = Object.fromEntries(OUTCOMES.map((o) => [o.value, o.label]))
export const OUTCOME_TONE = Object.fromEntries(OUTCOMES.map((o) => [o.value, o.tone]))

/** Colour + wording for each step of an application's life. */
export const STAGE = {
  APPLIED: { label: 'Applied', tone: 'viewed', icon: 'doc' },
  VIEWED: { label: 'Viewed by employer', tone: 'viewed', icon: 'eye' },
  CONTACTED: { label: 'Contacted', tone: 'interview', icon: 'phone' },
  SHORTLISTED: { label: 'Shortlisted', tone: 'shortlisted', icon: 'star' },
  INTERVIEW_SCHEDULED: { label: 'Interview scheduled', tone: 'interview', icon: 'calendar' },
  INTERVIEWED: { label: 'Interviewed', tone: 'interview', icon: 'users' },
  OFFERED: { label: 'Offer sent', tone: 'offered', icon: 'doc' },
  OFFER_ACCEPTED: { label: 'Offer accepted', tone: 'accepted', icon: 'checkCircle' },
  OFFER_DECLINED: { label: 'Offer declined', tone: 'rejected', icon: 'close' },
  JOINED: { label: 'Joined', tone: 'accepted', icon: 'checkCircle' },
  ATTENDANCE: { label: 'Attendance', tone: 'viewed', icon: 'clock' },
  COMPLETED: { label: 'Work completed', tone: 'accepted', icon: 'checkCircle' },
  PAID: { label: 'Paid', tone: 'accepted', icon: 'wallet' },
  REJECTED: { label: 'Rejected', tone: 'rejected', icon: 'close' },
  WITHDRAWN: { label: 'Withdrawn', tone: 'withdrawn', icon: 'close' },
}
export const stageOf = (k) => STAGE[k] || { label: k, tone: 'viewed', icon: 'doc' }

export const ACTOR_LABEL = { WORKER: 'Worker', EMPLOYER: 'Employer', ADMIN: 'Admin', SYSTEM: 'System' }

export const SEVERITY_TONE = { HIGH: 'rejected', MEDIUM: 'pending', LOW: 'viewed' }

/* ---------- formatting ---------- */

const UNIT = { HOURLY: '/hr', PER_SHIFT: '/shift', DAILY: '/day', PER_WEEK: '/week', MONTHLY: '/month' }
export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
export const pay = (salary, unit) => money(salary) + (UNIT[unit] || '')
export const num = (n) => Number(n || 0).toLocaleString('en-IN')

export function formatDate(iso, withTime) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  return withTime
    ? `${date}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    : date
}

export function timeAgo(iso) {
  if (!iso) return ''
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  return formatDate(iso)
}

/**
 * A calendar day, formatted from the LOCAL parts.
 *
 * `toISOString()` shifts to UTC first, so local midnight in IST comes back as
 * the previous evening and every "today" is a day early.
 */
export const isoDay = (d) => {
  const x = d instanceof Date ? d : new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
export const todayIso = () => isoDay(new Date())
export const isoDaysAgo = (n) => isoDay(new Date(Date.now() - n * 86400000))

/** Turns an empty page response into something the tables can always render. */
export const EMPTY_PAGE = { content: [], page: 0, size: 25, totalElements: 0, totalPages: 0 }

/* ==========================================================================
   Analytics vocabulary
   ========================================================================== */

export const DIMENSIONS = [
  { value: 'CATEGORY', label: 'Job category', hint: 'Cooking, driving, cleaning and the rest' },
  { value: 'CITY', label: 'City', hint: 'Where the work and the workforce are' },
  { value: 'BUSINESS_TYPE', label: 'Business type', hint: 'Which kinds of shop hire most' },
  { value: 'SKILL', label: 'Skill', hint: 'Demanded against available' },
  { value: 'ENGAGEMENT', label: 'Job duration', hint: 'One day through to permanent' },
  { value: 'WORK_PATTERN', label: 'Work pattern', hint: 'Full day, part time, shifts' },
  { value: 'SALARY_BAND', label: 'Pay band', hint: 'Monthly-equivalent pay' },
  { value: 'EXPERIENCE', label: 'Worker experience', hint: 'How experienced the workforce is' },
  { value: 'AVAILABILITY', label: 'Worker availability', hint: 'When people can work' },
]

export const GRANULARITIES = [
  { value: 'DAY', label: 'Daily' },
  { value: 'WEEK', label: 'Weekly' },
  { value: 'MONTH', label: 'Monthly' },
]

/** The series a timeseries chart can plot, with the colour each one keeps everywhere. */
export const SERIES = [
  { key: 'jobsPosted', label: 'Jobs posted', color: '#2563eb' },
  { key: 'applications', label: 'Applications', color: '#7c3aed' },
  { key: 'hires', label: 'Workers hired', color: '#059669' },
  { key: 'employerSignups', label: 'New companies', color: '#d97706' },
  { key: 'workerSignups', label: 'New workers', color: '#0891b2' },
  { key: 'interviews', label: 'Interviews', color: '#db2777' },
  { key: 'offers', label: 'Offers', color: '#65a30d' },
]

export const pct = (n) => `${Math.round((Number(n) || 0) * 100)}%`
export const ratio = (n) => (Number(n) || 0).toFixed(1)

/** Percentage change against the previous period. null when there is no baseline. */
export function delta(now, before) {
  const a = Number(now) || 0
  const b = Number(before) || 0
  if (!b) return a ? null : 0
  return Math.round(((a - b) / b) * 100)
}

/* ==========================================================================
   Phone-first operations
   ========================================================================== */

/** How each call-queue row should look. Wording comes from the server. */
export const QUEUE_TYPE = {
  UNCONTACTED_APPLICANT:   { icon: 'phone',       tone: 'rejected' },
  EMPLOYER_NOT_RESPONDING: { icon: 'store',       tone: 'rejected' },
  OFFER_NOT_ANSWERED:      { icon: 'doc',         tone: 'rejected' },
  CALLBACK_DUE:            { icon: 'clock',       tone: 'pending' },
  NO_ANSWER_RETRY:         { icon: 'phone',       tone: 'pending' },
  WORK_TOMORROW:           { icon: 'calendar',    tone: 'interview' },
  JOB_NO_APPLICANTS:       { icon: 'briefcase',   tone: 'pending' },
  UNPAID_COMPLETED_WORK:   { icon: 'wallet',      tone: 'rejected' },
}
export const queueLook = (k) => QUEUE_TYPE[k] || { icon: 'phone', tone: 'viewed' }

export const LEAD_SOURCE = {
  MISSED_CALL: { label: 'Missed call', icon: 'phone' },
  WHATSAPP:    { label: 'WhatsApp', icon: 'chat' },
  WALK_IN:     { label: 'Walked in', icon: 'user' },
  REFERRAL:    { label: 'Referral', icon: 'users' },
  PHONE_IN:    { label: 'Phoned us', icon: 'phone' },
}
export const LEAD_STATUS = {
  NEW:       { label: 'New', tone: 'rejected' },
  CONTACTED: { label: 'Contacted', tone: 'pending' },
  CONVERTED: { label: 'Signed up', tone: 'accepted' },
  CLOSED:    { label: 'Closed', tone: 'withdrawn' },
  SPAM:      { label: 'Spam', tone: 'withdrawn' },
}
export const LEAD_INTENT = {
  WANT_WORK:    'Wants work',
  WANT_TO_HIRE: 'Wants to hire',
  UNKNOWN:      'Not known yet',
}

/** "3 days" rather than "72h" — this is read at speed. */
export function waitingLabel(hours) {
  const h = Number(hours) || 0
  if (h < 1) return 'just now'
  if (h < 24) return `${Math.round(h)}h waiting`
  const d = Math.round(h / 24)
  return `${d} ${d === 1 ? 'day' : 'days'} waiting`
}

/* ---------- help desk ---------- */
export const listSupportTickets = (params) =>
  api.get('/admin/support/tickets', { params }).then((r) => r.data)
export const getSupportSummary = () => api.get('/admin/support/summary').then((r) => r.data)
export const assignSupportTicket = (id) =>
  api.post(`/admin/support/tickets/${id}/assign`).then((r) => r.data)
export const replySupportTicket = (id, body) =>
  api.post(`/admin/support/tickets/${id}/replies`, body).then((r) => r.data)
export const setSupportStatus = (id, status) =>
  api.patch(`/admin/support/tickets/${id}/status`, { status }).then((r) => r.data)

/** Plain words for the desk's own vocabulary, so the UI never prints an enum. */
export const SUPPORT_STATUS_LABEL = {
  OPEN: 'Waiting', IN_PROGRESS: 'Being handled', RESOLVED: 'Sorted', CLOSED: 'Closed',
}
export const SUPPORT_STATUS_TONE = {
  OPEN: 'pending', IN_PROGRESS: 'interview', RESOLVED: 'accepted', CLOSED: 'viewed',
}
export const SUPPORT_TOPIC_LABEL = {
  MONEY: 'Money', WORK: 'Work', OFFER: 'Job offer', ATTENDANCE: 'Attendance',
  DOCUMENTS: 'Papers', ACCOUNT: 'Account', OTHER: 'Something else',
}
