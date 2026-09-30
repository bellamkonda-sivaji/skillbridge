import client from './client'

export const today = () => client.get('/worker/attendance/today').then((r) => r.data)
export const todayShift = () => client.get('/worker/shifts/today').then((r) => r.data)
export const checkIn = (employmentId) =>
  client.post('/worker/attendance/check-in', { employmentId }).then((r) => r.data)
export const checkOut = (employmentId) =>
  client.post('/worker/attendance/check-out', { employmentId }).then((r) => r.data)
export const history = (params) => client.get('/worker/attendance', { params }).then((r) => r.data)
export const myRequests = () => client.get('/worker/attendance/requests').then((r) => r.data)
export const raiseRequest = (body) =>
  client.post('/worker/attendance/requests', body).then((r) => r.data)
export const cancelRequest = (id) =>
  client.post(`/worker/attendance/requests/${id}/cancel`).then((r) => r.data)
