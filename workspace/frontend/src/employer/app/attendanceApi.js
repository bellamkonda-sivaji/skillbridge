import api from '../../api'

export const getDay = (date) =>
  api.get('/employer/attendance/day', { params: { date } }).then((r) => r.data)
export const getCalendar = (from, to) =>
  api.get('/employer/attendance/calendar', { params: { from, to } }).then((r) => r.data)
export const searchAttendance = (params) =>
  api.get('/employer/attendance', { params }).then((r) => r.data)
export const approveDay = (id, note) =>
  api.post(`/employer/attendance/${id}/approve`, { note }).then((r) => r.data)
export const rejectDay = (id, note) =>
  api.post(`/employer/attendance/${id}/reject`, { note }).then((r) => r.data)
export const approveAll = (ids) =>
  api.post('/employer/attendance/approve-all', { ids }).then((r) => r.data)
export const listRequests = (status) =>
  api.get('/employer/attendance/requests', { params: { status } }).then((r) => r.data)
export const approveRequest = (id, body) =>
  api.post(`/employer/attendance/requests/${id}/approve`, body).then((r) => r.data)
export const rejectRequest = (id, note) =>
  api.post(`/employer/attendance/requests/${id}/reject`, { note }).then((r) => r.data)

/**
 * Dates here are calendar days, not instants.
 *
 * `toISOString()` converts to UTC first, so local midnight in IST (+5:30) comes
 * back as 18:30 the *previous* day — which silently shifted the whole strip by
 * one. Formatting from the local parts keeps a day meaning the day it says.
 */
export const isoDay = (d) => {
  const x = d instanceof Date ? d : new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
export const todayIso = () => isoDay(new Date())
export const shiftDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  return isoDay(d)
}
/** The last `n` days ending today, oldest first — the strip an employer taps. */
export const recentDays = (n = 14) =>
  Array.from({ length: n }, (_, i) => shiftDays(todayIso(), -(n - 1 - i)))
