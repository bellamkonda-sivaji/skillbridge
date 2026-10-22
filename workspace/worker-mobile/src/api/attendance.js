import client from './client'

export const today = () => client.get('/worker/attendance/today').then((r) => r.data)
export const todayShift = () => client.get('/worker/shifts/today').then((r) => r.data)
/**
 * `where` is optional - `{ latitude, longitude, accuracyM }` from the phone.
 * Without it the punch still goes through; the shop just sees no place.
 */
const punchBody = (employmentId, where) => (where?.ok !== false && Number.isFinite(where?.latitude)
  ? {
    employmentId,
    latitude: where.latitude,
    longitude: where.longitude,
    accuracyM: Number.isFinite(where.accuracyM) ? where.accuracyM : undefined,
  }
  : { employmentId })

export const checkIn = (employmentId, where) =>
  client.post('/worker/attendance/check-in', punchBody(employmentId, where)).then((r) => r.data)
export const checkOut = (employmentId, where) =>
  client.post('/worker/attendance/check-out', punchBody(employmentId, where)).then((r) => r.data)
export const history = (params) => client.get('/worker/attendance', { params }).then((r) => r.data)
export const myRequests = () => client.get('/worker/attendance/requests').then((r) => r.data)
export const raiseRequest = (body) =>
  client.post('/worker/attendance/requests', body).then((r) => r.data)
export const cancelRequest = (id) =>
  client.post(`/worker/attendance/requests/${id}/cancel`).then((r) => r.data)
