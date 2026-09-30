import api from '../api'

/* ---------- worker: punching in and out ---------- */
export const getToday = () => api.get('/worker/attendance/today').then((r) => r.data)
export const checkIn = (employmentId) =>
  api.post('/worker/attendance/check-in', { employmentId }).then((r) => r.data)
export const checkOut = (employmentId) =>
  api.post('/worker/attendance/check-out', { employmentId }).then((r) => r.data)
export const getMyAttendance = (params) =>
  api.get('/worker/attendance', { params }).then((r) => r.data)

/* ---------- worker: "something is wrong" ---------- */
export const raiseRequest = (body) =>
  api.post('/worker/attendance/requests', body).then((r) => r.data)
export const myRequests = () => api.get('/worker/attendance/requests').then((r) => r.data)
export const cancelRequest = (id) =>
  api.post(`/worker/attendance/requests/${id}/cancel`).then((r) => r.data)

/* ==========================================================================
   Wording. Every label here is what a worker or a shop owner actually reads,
   so it is short, concrete, and never uses a word like "regularisation".
   ========================================================================== */

export const REQUEST_TYPES = [
  { value: 'FORGOT_PUNCH_IN',  label: 'I forgot to tap when I started', icon: 'clock', needsIn: true },
  { value: 'FORGOT_PUNCH_OUT', label: 'I forgot to tap when I finished', icon: 'clock', needsOut: true },
  { value: 'WRONG_TIME',       label: 'The time is wrong', icon: 'clock', needsIn: true, needsOut: true },
  { value: 'MISSED_DAY',       label: 'I worked but it is not showing', icon: 'calendar', needsIn: true, needsOut: true },
  { value: 'WRONG_ABSENT',     label: 'It says I was absent but I came', icon: 'checkCircle', needsIn: true, needsOut: true },
]
export const REQUEST_TYPE_LABEL = Object.fromEntries(REQUEST_TYPES.map((r) => [r.value, r.label]))

export const REQUEST_STATUS = {
  PENDING:   { label: 'Waiting for an answer', tone: 'pending' },
  APPROVED:  { label: 'Fixed', tone: 'accepted' },
  REJECTED:  { label: 'Not accepted', tone: 'rejected' },
  CANCELLED: { label: 'You cancelled it', tone: 'withdrawn' },
}

export const ATT_STATUS = {
  NOT_CHECKED_IN: { label: 'Not started', tone: 'withdrawn' },
  CHECKED_IN:     { label: 'Working now', tone: 'interview' },
  CHECKED_OUT:    { label: 'Finished', tone: 'accepted' },
  PRESENT:        { label: 'Present', tone: 'accepted' },
  ABSENT:         { label: 'Absent', tone: 'rejected' },
  LEAVE:          { label: 'Leave', tone: 'pending' },
}

export const APPROVAL = {
  AUTO_APPROVED: { label: 'Counted', tone: 'accepted' },
  APPROVED:      { label: 'Counted', tone: 'accepted' },
  PENDING:       { label: 'Waiting for the shop owner', tone: 'pending' },
  REJECTED:      { label: 'Not counted', tone: 'rejected' },
}

/** "7 hours 15 minutes" — never "7.25h". */
export function minutesLabel(mins) {
  const m = Math.max(0, Math.round(Number(mins) || 0))
  if (!m) return '—'
  const h = Math.floor(m / 60)
  const r = m % 60
  if (!h) return `${r} ${r === 1 ? 'minute' : 'minutes'}`
  if (!r) return `${h} ${h === 1 ? 'hour' : 'hours'}`
  return `${h} ${h === 1 ? 'hour' : 'hours'} ${r} ${r === 1 ? 'minute' : 'minutes'}`
}

export const timeOnly = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}
