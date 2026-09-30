import client from './client'

export const draft = (applicationId) =>
  client.get(`/employer/applications/${applicationId}/offer-draft`).then((r) => r.data)
export const send = (applicationId, body) =>
  client.post(`/employer/applications/${applicationId}/offer`, body).then((r) => r.data)
export const list = (status = 'ALL') =>
  client.get('/employer/offers', { params: { status } }).then((r) => r.data)
export const detail = (id) => client.get(`/employer/offers/${id}`).then((r) => r.data)
export const cancel = (id) => client.post(`/employer/offers/${id}/cancel`).then((r) => r.data)
export const joining = (offerId) =>
  client.get(`/employer/offers/${offerId}/joining`).then((r) => r.data)
export const saveJoining = (offerId, body) =>
  client.post(`/employer/offers/${offerId}/joining`, body).then((r) => r.data)
