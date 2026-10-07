import client from './client'

export const employments = () => client.get('/employer/employments').then((r) => r.data)
export const payroll = (employmentId) =>
  client.get(`/employer/employments/${employmentId}/payroll`).then((r) => r.data)

// ---- attendance
export const attendanceDay = (date) =>
  client.get('/employer/attendance/day', { params: { date } }).then((r) => r.data)
export const attendanceCalendar = (from, to) =>
  client.get('/employer/attendance/calendar', { params: { from, to } }).then((r) => r.data)
export const approve = (id) => client.post(`/employer/attendance/${id}/approve`).then((r) => r.data)
export const reject = (id) => client.post(`/employer/attendance/${id}/reject`).then((r) => r.data)
export const approveAll = (date) =>
  client.post('/employer/attendance/approve-all', { date }).then((r) => r.data)
export const requests = () => client.get('/employer/attendance/requests').then((r) => r.data)
export const approveRequest = (id, body) =>
  client.post(`/employer/attendance/requests/${id}/approve`, body).then((r) => r.data)
export const rejectRequest = (id, reason) =>
  client.post(`/employer/attendance/requests/${id}/reject`, { reason }).then((r) => r.data)

// ---- money
export const billing = () => client.get('/employer/billing').then((r) => r.data)
export const escrow = (jobId) => client.get(`/employer/jobs/${jobId}/escrow`).then((r) => r.data)

/**
 * Starts a gateway order so the employer can put money behind a job.
 *
 * The server works in paise, like the gateway does - money in whole rupees
 * loses the smallest unit the moment anything is divided. Both of these used
 * to send `amount` in rupees, which the server read as a missing amountMinor
 * and rejected with "Enter an amount to fund", so neither button ever worked.
 */
export const createEscrowOrder = (jobId, rupees) =>
  client.post(`/employer/jobs/${jobId}/escrow/order`, {
    amountMinor: Math.round(Number(rupees) * 100),
  }).then((r) => r.data)

/** Confirms a gateway payment against the job. */
export const verifyEscrow = (jobId, body) =>
  client.post(`/employer/jobs/${jobId}/escrow/verify`, body).then((r) => r.data)

/** Moves money from the wallet instead of the gateway. */
export const fundFromWallet = (jobId, rupees) =>
  client.post(`/employer/jobs/${jobId}/escrow/fund-manual`, {
    amountMinor: Math.round(Number(rupees) * 100),
  }).then((r) => r.data)
