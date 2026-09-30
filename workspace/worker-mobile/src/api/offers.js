import client from './client'

export const listOffers = () => client.get('/worker/offers').then((r) => r.data)
export const offerDetail = (id) => client.get(`/worker/offers/${id}`).then((r) => r.data)
export const acceptOffer = (id) => client.post(`/worker/offers/${id}/accept`).then((r) => r.data)
export const declineOffer = (id, reason) =>
  client.post(`/worker/offers/${id}/decline`, { reason }).then((r) => r.data)

export const employments = () => client.get('/worker/employments').then((r) => r.data)
export const employmentDetail = (id) => client.get(`/worker/employments/${id}`).then((r) => r.data)
export const payroll = (id) => client.get(`/worker/employments/${id}/payroll`).then((r) => r.data)
export const acknowledgeJoining = (id) =>
  client.post(`/worker/employments/${id}/acknowledge-joining`).then((r) => r.data)
