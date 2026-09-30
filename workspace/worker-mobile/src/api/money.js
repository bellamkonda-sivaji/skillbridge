import client from './client'

export const earnings = () => client.get('/worker/earnings').then((r) => r.data)
export const payoutDestinations = () => client.get('/worker/payout-destinations').then((r) => r.data)
export const addPayoutDestination = (body) =>
  client.post('/worker/payout-destinations', body).then((r) => r.data)
export const payouts = () => client.get('/worker/payouts').then((r) => r.data)
export const requestPayout = (amount, destinationId) =>
  client.post('/worker/payouts', { amount, destinationId }).then((r) => r.data)
export const verifyDestination = (id) =>
  client.post(`/worker/payout-destinations/${id}/verify`).then((r) => r.data)
export const makeDefault = (id) =>
  client.post(`/worker/payout-destinations/${id}/default`).then((r) => r.data)
export const removeDestination = (id) =>
  client.delete(`/worker/payout-destinations/${id}`).then((r) => r.data)
